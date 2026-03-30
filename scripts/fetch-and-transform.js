import { parse } from 'csv-parse/sync'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = resolve(__dirname, '../data')
const BASELINE_PATH = resolve(DATA_DIR, 'texas-baseline.json')
const LATEST_PATH = resolve(DATA_DIR, 'texas-latest.json')
const HISTORY_PATH = resolve(DATA_DIR, 'texas-history.json')
const HISTORY_CAP = 720
const CSV_URL = 'https://www.texaslottery.com/export/sites/lottery/Games/Scratch_Offs/scratchoff.csv'

export async function parseCSV(csvText) {
  return parse(csvText, { columns: true, skip_empty_lines: true, trim: true, from_line: 2 })
}

export function groupByGame(rows) {
  const games = {}
  for (const row of rows) {
    const id = row['Game Number']
    if (!games[id]) {
      games[id] = {
        id,
        name: row['Game Name'],
        ticketPrice: Number(row['Ticket Price']),
        startDate: row['Game Close Date'],
        tiers: [],
      }
    }
    games[id].tiers.push({
      prize: Number(row['Prize Level']),
      printed: Number(row['Total Prizes in Level']),
      claimed: Number(row['Prizes Claimed']),
    })
  }
  return games
}

export function computeGameMetrics(game, baseline) {
  const { ticketPrice, tiers } = game
  const totalTicketsAtLaunch = baseline.totalTicketsAtLaunch
  const totalPrizeValueAtLaunch = baseline.totalPrizeValueAtLaunch

  // Weighted claim rate to estimate tickets remaining
  const totalPrinted = tiers.reduce((s, t) => s + t.printed, 0)
  const totalClaimed = tiers.reduce((s, t) => s + t.claimed, 0)
  const claimRateRaw = totalPrinted > 0 ? totalClaimed / totalPrinted : 0
  const claimRate = Math.round(claimRateRaw * 1000) / 1000
  const ticketsRemaining = Math.round(totalTicketsAtLaunch * (1 - claimRate))
  const ticketsRemainingFraction = totalTicketsAtLaunch > 0 ? ticketsRemaining / totalTicketsAtLaunch : null

  // Prizes remaining value
  const prizesRemainingValue = tiers.reduce((s, t) => s + t.prize * (t.printed - t.claimed), 0)

  const buyAllCost = ticketsRemaining * ticketPrice
  const buyAllProfit = prizesRemainingValue - buyAllCost

  // Richness ratio
  let richnessRatio = null
  if (ticketsRemaining > 0 && totalTicketsAtLaunch > 0 && totalPrizeValueAtLaunch > 0) {
    const currentRate = prizesRemainingValue / ticketsRemaining
    const originalRate = totalPrizeValueAtLaunch / totalTicketsAtLaunch
    richnessRatio = originalRate > 0 ? Math.round((currentRate / originalRate) * 100) / 100 : null
  }

  // Per-tier richness
  const computedTiers = tiers.map(t => {
    const tierRemaining = t.printed - t.claimed
    const tierOriginal = baseline.tiers?.[String(t.prize)]?.originalCount ?? t.printed
    let tierRichnessRatio = null
    if (ticketsRemaining > 0 && totalTicketsAtLaunch > 0) {
      const currentTierRate = tierRemaining / ticketsRemaining
      const originalTierRate = tierOriginal / totalTicketsAtLaunch
      tierRichnessRatio = originalTierRate > 0
        ? Math.round((currentTierRate / originalTierRate) * 100) / 100
        : null
    }
    return {
      prize: t.prize,
      originalCount: tierOriginal,
      remaining: tierRemaining,
      richnessRatio: tierRichnessRatio,
    }
  }).sort((a, b) => b.prize - a.prize)

  return {
    id: game.id,
    name: game.name,
    ticketPrice,
    totalTicketsPrinted: totalTicketsAtLaunch,
    totalPrizeValueAtLaunch,
    ticketsRemaining,
    ticketsRemainingFraction,
    prizesRemainingValue,
    buyAllCost,
    buyAllProfit,
    richnessRatio,
    tiers: computedTiers,
  }
}

function resolveTicketsAtLaunch(game, rows) {
  const firstRow = rows.find(r => r['Game Number'] === game.id)
  if (firstRow?.['Total Tickets']) return Number(firstRow['Total Tickets'])

  const oddsRaw = firstRow?.['Overall Odds'] ?? firstRow?.['Odds']
  if (oddsRaw) {
    const match = String(oddsRaw).match(/[\d.]+$/)
    if (match) {
      const oddsRatio = parseFloat(match[0])
      const totalPrinted = game.tiers.reduce((s, t) => s + t.printed, 0)
      return Math.round(totalPrinted * oddsRatio)
    }
  }

  return null
}

function bootstrapBaseline(baseline, game, rawRows) {
  if (baseline[game.id]) return baseline

  const totalTicketsAtLaunch = resolveTicketsAtLaunch(game, rawRows)
  if (totalTicketsAtLaunch === null) {
    console.warn(`[skip] Game ${game.id} "${game.name}" — cannot resolve total_tickets_at_launch. Skipping until CSV column is confirmed.`)
    return baseline
  }

  const totalPrizeValue = game.tiers.reduce((s, t) => s + t.prize * t.printed, 0)
  const tiers = {}
  for (const t of game.tiers) {
    tiers[String(t.prize)] = { originalCount: t.printed }
  }

  return {
    ...baseline,
    [game.id]: {
      firstSeen: new Date().toISOString(),
      totalTicketsAtLaunch,
      totalPrizeValueAtLaunch: totalPrizeValue,
      tiers,
    },
  }
}

function loadBaseline() {
  if (!existsSync(BASELINE_PATH)) return {}
  return JSON.parse(readFileSync(BASELINE_PATH, 'utf-8'))
}

function dataChanged(newLatest, existingPath) {
  if (!existsSync(existingPath)) return true
  const existing = JSON.parse(readFileSync(existingPath, 'utf-8'))
  const { fetched_at: _a, ...newRest } = newLatest
  const { fetched_at: _b, ...existingRest } = existing
  return JSON.stringify(newRest) !== JSON.stringify(existingRest)
}

export async function run() {
  console.log('[fetch] Fetching TX Lottery CSV...')
  let csvText
  try {
    const res = await fetch(CSV_URL)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    csvText = await res.text()
  } catch (err) {
    console.warn(`[fetch] Failed to fetch CSV: ${err.message}. Skipping update.`)
    process.exit(0)
  }

  const rows = await parseCSV(csvText)
  const games = groupByGame(rows)

  let baseline = loadBaseline()
  for (const game of Object.values(games)) {
    baseline = bootstrapBaseline(baseline, game, rows)
  }

  const computedGames = Object.values(games)
    .map(game => {
      const b = baseline[game.id]
      if (!b) {
        console.warn(`[skip] Game ${game.id} has no baseline — skipping`)
        return null
      }
      return computeGameMetrics(game, b)
    })
    .filter(Boolean)

  const fetchedAt = new Date().toISOString()
  const latest = { state: 'texas', fetched_at: fetchedAt, games: computedGames }

  if (!dataChanged(latest, LATEST_PATH)) {
    console.log('[fetch] No data change detected. Skipping commit.')
    process.exit(0)
  }

  writeFileSync(LATEST_PATH, JSON.stringify(latest, null, 2))

  const historySummary = {
    fetched_at: fetchedAt,
    games: computedGames.map(g => ({
      id: g.id,
      richness_ratio: g.richnessRatio,
      prizes_remaining_value: g.prizesRemainingValue,
      buy_all_profit: g.buyAllProfit,
      tickets_remaining_fraction: g.ticketsRemainingFraction,
    })),
  }
  let history = existsSync(HISTORY_PATH) ? JSON.parse(readFileSync(HISTORY_PATH, 'utf-8')) : []
  history.push(historySummary)
  if (history.length > HISTORY_CAP) history = history.slice(history.length - HISTORY_CAP)
  writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2))

  writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2))

  console.log(`[fetch] Done. ${computedGames.length} games written.`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  run()
}
