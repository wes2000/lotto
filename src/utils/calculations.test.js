import { describe, it, expect } from 'vitest'
import {
  computeRichnessRatio,
  computeBuyAllCost,
  computeBuyAllProfit,
  computeTicketsRemainingFraction,
  formatCurrency,
  formatRatio,
  getRichnessColor,
  computeExpectedValueExcludingTop,
} from './calculations.js'

describe('computeRichnessRatio', () => {
  it('returns ratio > 1 when prizes are proportionally rich', () => {
    // prizes_remaining/tickets_remaining = 12,500,000/276,000 = 45.29
    // total_prize_at_launch/total_tickets = 14,800,000/1,200,000 = 12.33
    // ratio = 45.29 / 12.33 = 3.67
    const result = computeRichnessRatio({
      prizesRemainingValue: 12_500_000,
      ticketsRemaining: 276_000,
      totalPrizeValueAtLaunch: 14_800_000,
      totalTicketsPrinted: 1_200_000,
    })
    expect(result).toBeCloseTo(3.67, 1)
  })

  it('returns 1.0 when odds match original exactly', () => {
    const result = computeRichnessRatio({
      prizesRemainingValue: 1000,
      ticketsRemaining: 100,
      totalPrizeValueAtLaunch: 10_000,
      totalTicketsPrinted: 1000,
    })
    expect(result).toBeCloseTo(1.0, 5)
  })

  it('returns 0 when no prizes remain', () => {
    const result = computeRichnessRatio({
      prizesRemainingValue: 0,
      ticketsRemaining: 100,
      totalPrizeValueAtLaunch: 10_000,
      totalTicketsPrinted: 1000,
    })
    expect(result).toBe(0)
  })

  it('returns null when ticketsRemaining is 0', () => {
    const result = computeRichnessRatio({
      prizesRemainingValue: 1000,
      ticketsRemaining: 0,
      totalPrizeValueAtLaunch: 10_000,
      totalTicketsPrinted: 1000,
    })
    expect(result).toBeNull()
  })
})

describe('computeBuyAllCost', () => {
  it('multiplies tickets remaining by ticket price', () => {
    expect(computeBuyAllCost({ ticketsRemaining: 276_000, ticketPrice: 50 })).toBe(13_800_000)
  })
})

describe('computeBuyAllProfit', () => {
  it('returns positive profit when prizes exceed cost', () => {
    expect(computeBuyAllProfit({ prizesRemainingValue: 15_000_000, buyAllCost: 13_800_000 })).toBe(1_200_000)
  })

  it('returns negative when cost exceeds prizes', () => {
    expect(computeBuyAllProfit({ prizesRemainingValue: 12_500_000, buyAllCost: 13_800_000 })).toBe(-1_300_000)
  })
})

describe('computeTicketsRemainingFraction', () => {
  it('returns decimal fraction', () => {
    expect(computeTicketsRemainingFraction({ ticketsRemaining: 276_000, totalTicketsPrinted: 1_200_000 }))
      .toBeCloseTo(0.23, 2)
  })

  it('returns null when totalTicketsPrinted is 0', () => {
    expect(computeTicketsRemainingFraction({ ticketsRemaining: 0, totalTicketsPrinted: 0 })).toBeNull()
  })
})

describe('formatCurrency', () => {
  it('formats millions with M suffix', () => {
    expect(formatCurrency(12_500_000)).toBe('$12.5M')
  })

  it('formats thousands with K suffix', () => {
    expect(formatCurrency(13_800)).toBe('$13.8K')
  })

  it('formats values under 1K as plain dollars', () => {
    expect(formatCurrency(500)).toBe('$500')
  })

  it('prepends minus for negative values', () => {
    expect(formatCurrency(-1_300_000)).toBe('-$1.3M')
  })
})

describe('formatRatio', () => {
  it('formats to 2 decimal places with × suffix', () => {
    expect(formatRatio(3.67)).toBe('3.67×')
  })

  it('returns "—" for null', () => {
    expect(formatRatio(null)).toBe('—')
  })
})

describe('getRichnessColor', () => {
  it('returns green for ratio >= 1.5', () => {
    expect(getRichnessColor(1.5)).toBe('#00ff88')
    expect(getRichnessColor(3.67)).toBe('#00ff88')
  })

  it('returns gold for ratio 1.0–1.49', () => {
    expect(getRichnessColor(1.0)).toBe('#ffd700')
    expect(getRichnessColor(1.49)).toBe('#ffd700')
  })

  it('returns red for ratio < 1.0', () => {
    expect(getRichnessColor(0.99)).toBe('#e94560')
    expect(getRichnessColor(0)).toBe('#e94560')
  })

  it('returns red for null', () => {
    expect(getRichnessColor(null)).toBe('#e94560')
  })
})

describe('computeExpectedValueExcludingTop', () => {
  const tiers = [
    { prize: 1000, remaining: 2 },
    { prize: 500, remaining: 5 },
    { prize: 100, remaining: 20 },
    { prize: 10, remaining: 100 },
    { prize: 1, remaining: 500 },
  ]

  it('excludes top 3 tiers and computes EV', () => {
    // included: $10 (100 remaining) + $1 (500 remaining) = 1000 + 500 = 1500
    // EV = 1500 / 1000 = 1.5
    expect(computeExpectedValueExcludingTop(tiers, 1000)).toBeCloseTo(1.5)
  })

  it('returns null when ticketsRemaining is 0', () => {
    expect(computeExpectedValueExcludingTop(tiers, 0)).toBeNull()
  })

  it('returns null when ticketsRemaining is null', () => {
    expect(computeExpectedValueExcludingTop(tiers, null)).toBeNull()
  })

  it('returns null when all tiers are excluded', () => {
    const shortTiers = [{ prize: 100, remaining: 10 }, { prize: 10, remaining: 5 }]
    expect(computeExpectedValueExcludingTop(shortTiers, 1000, 3)).toBeNull()
  })

  it('respects custom excludeTopN', () => {
    // excludeTopN=1: skip $1000, include $500,$100,$10,$1
    // value = 500*5 + 100*20 + 10*100 + 1*500 = 6000
    // EV = 6000/1000 = 6.0
    expect(computeExpectedValueExcludingTop(tiers, 1000, 1)).toBeCloseTo(6.0)
  })
})
