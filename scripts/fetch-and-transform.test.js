import { describe, it, expect } from 'vitest'
import { parseCSV, groupByGame, computeGameMetrics } from './fetch-and-transform.js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const sampleCSV = readFileSync(resolve(__dirname, 'fixtures/sample.csv'), 'utf-8')

describe('parseCSV', () => {
  it('returns array of row objects with correct column names', async () => {
    const rows = await parseCSV(sampleCSV)
    expect(rows).toHaveLength(7) // 5 prize-tier rows + 2 TOTAL rows
    expect(rows[0]).toMatchObject({
      'Game Number': '1001',
      'Game Name': 'Test Game A',
      'Ticket Price': '10',
      'Prize Level': '1000',
      'Total Prizes in Level': '5',
      'Prizes Claimed': '2',
    })
  })
})

describe('groupByGame', () => {
  it('groups rows by game ID with tier array', async () => {
    const rows = await parseCSV(sampleCSV)
    const games = groupByGame(rows)
    expect(Object.keys(games)).toHaveLength(2)
    expect(games['1001'].tiers).toHaveLength(3)
    expect(games['1001'].name).toBe('Test Game A')
    expect(games['1001'].ticketPrice).toBe(10)
  })
})

describe('computeGameMetrics', () => {
  it('computes prizes remaining, buy-all, and richness ratio', async () => {
    const rows = await parseCSV(sampleCSV)
    const games = groupByGame(rows)

    const baseline = {
      '1001': {
        totalTicketsAtLaunch: 10000,
        totalPrizeValueAtLaunch: 1000 * 5 + 100 * 50 + 10 * 500,
        tiers: { '1000': { originalCount: 5 }, '100': { originalCount: 50 }, '10': { originalCount: 500 } },
      },
    }

    const result = computeGameMetrics(games['1001'], baseline['1001'])

    // prizes remaining: 3*1000 + 20*100 + 100*10 = 3000 + 2000 + 1000 = 6000
    expect(result.prizesRemainingValue).toBe(6000)

    // tickets remaining: weighted claim rate = (2+30+400)/(5+50+500) = 432/555 = 0.778
    // tickets remaining = 10000 * (1 - 0.778) = 2220
    expect(result.ticketsRemaining).toBeCloseTo(2220, 0)

    // buy all cost = 2220 * 10 = 22200
    expect(result.buyAllCost).toBeCloseTo(22200, 0)

    // buy all profit = 6000 - 22200 = -16200
    expect(result.buyAllProfit).toBeCloseTo(-16200, 0)

    expect(result.richnessRatio).toBeGreaterThan(0)
  })

  it('includes per-tier richness in each tier', async () => {
    const rows = await parseCSV(sampleCSV)
    const games = groupByGame(rows)
    const baseline = {
      totalTicketsAtLaunch: 10000,
      totalPrizeValueAtLaunch: 10000,
      tiers: { '1000': { originalCount: 5 }, '100': { originalCount: 50 }, '10': { originalCount: 500 } },
    }
    const result = computeGameMetrics(games['1001'], baseline)
    expect(result.tiers[0]).toMatchObject({
      prize: 1000,
      originalCount: 5,
      remaining: 3,
    })
    expect(typeof result.tiers[0].richnessRatio).toBe('number')
  })

  it('returns only $50 prizes remaining for game 1002 (all $500 claimed)', async () => {
    const rows = await parseCSV(sampleCSV)
    const games = groupByGame(rows)
    const baseline = {
      totalTicketsAtLaunch: 1000,
      totalPrizeValueAtLaunch: 500 * 3 + 50 * 30,
      tiers: { '500': { originalCount: 3 }, '50': { originalCount: 30 } },
    }
    const result = computeGameMetrics(games['1002'], baseline)
    expect(result.prizesRemainingValue).toBe(50 * 20) // only $50 prizes remain
  })
})
