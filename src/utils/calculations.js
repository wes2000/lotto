export function computeRichnessRatio({ prizesRemainingValue, ticketsRemaining, totalPrizeValueAtLaunch, totalTicketsPrinted }) {
  if (!ticketsRemaining || !totalTicketsPrinted) return null
  const currentRate = prizesRemainingValue / ticketsRemaining
  const originalRate = totalPrizeValueAtLaunch / totalTicketsPrinted
  if (!originalRate) return null
  return currentRate / originalRate
}

export function computeBuyAllCost({ ticketsRemaining, ticketPrice }) {
  return ticketsRemaining * ticketPrice
}

export function computeBuyAllProfit({ prizesRemainingValue, buyAllCost }) {
  return prizesRemainingValue - buyAllCost
}

export function computeTicketsRemainingFraction({ ticketsRemaining, totalTicketsPrinted }) {
  if (!totalTicketsPrinted) return null
  return ticketsRemaining / totalTicketsPrinted
}

export function formatCurrency(value) {
  const abs = Math.abs(value)
  const prefix = value < 0 ? '-' : ''
  if (abs >= 1_000_000) {
    const n = abs / 1_000_000
    return `${prefix}$${n % 1 === 0 ? n.toFixed(0) : n.toFixed(1)}M`
  }
  if (abs >= 1_000) {
    const n = abs / 1_000
    return `${prefix}$${n % 1 === 0 ? n.toFixed(0) : n.toFixed(1)}K`
  }
  return `${prefix}$${abs}`
}

export function formatRatio(ratio) {
  if (ratio === null || ratio === undefined) return '—'
  return `${ratio.toFixed(2)}×`
}

export function getRichnessColor(ratio) {
  if (ratio === null || ratio === undefined || ratio < 1.0) return '#e94560'
  if (ratio < 1.5) return '#ffd700'
  return '#00ff88'
}

export function computeExpectedValueExcludingTop(tiers, ticketsRemaining, excludeTopN = 3) {
  if (!ticketsRemaining || ticketsRemaining <= 0) return null
  const sorted = [...tiers].sort((a, b) => b.prize - a.prize)
  const included = sorted.slice(excludeTopN)
  if (included.length === 0) return null
  return included.reduce((s, t) => s + t.prize * t.remaining, 0) / ticketsRemaining
}
