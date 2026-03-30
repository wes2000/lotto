import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import SummaryBar from './SummaryBar.jsx'

const games = [
  { id: '1', prizesRemainingValue: 12_500_000, buyAllProfit: -1_300_000, richnessRatio: 3.67 },
  { id: '2', prizesRemainingValue: 8_100_000, buyAllProfit: 1_800_000, richnessRatio: 1.74 },
  { id: '3', prizesRemainingValue: 3_400_000, buyAllProfit: -500_000, richnessRatio: 0.61 },
]

describe('SummaryBar', () => {
  it('shows total prizes remaining across all games', () => {
    render(<SummaryBar games={games} fetchedAt="2026-03-29T14:00:00Z" />)
    // 12.5M + 8.1M + 3.4M = 24M
    expect(screen.getByText('$24M')).toBeInTheDocument()
  })

  it('shows best buy-all profit with positive label', () => {
    render(<SummaryBar games={games} fetchedAt="2026-03-29T14:00:00Z" />)
    expect(screen.getByText('$1.8M')).toBeInTheDocument()
    expect(screen.getByText(/Best Buy All/)).toBeInTheDocument()
  })

  it('shows least loss label when all profits are negative', () => {
    const allLoss = games.map(g => ({ ...g, buyAllProfit: -500_000 }))
    render(<SummaryBar games={allLoss} fetchedAt="2026-03-29T14:00:00Z" />)
    expect(screen.getByText(/Least Loss/)).toBeInTheDocument()
  })

  it('shows count of favorable games (richness >= 1.0)', () => {
    render(<SummaryBar games={games} fetchedAt="2026-03-29T14:00:00Z" />)
    // games 1 and 2 have ratio >= 1.0
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText(/Favorable/i)).toBeInTheDocument()
  })

  it('shows last updated time', () => {
    render(<SummaryBar games={games} fetchedAt="2026-03-29T14:00:00Z" />)
    expect(screen.getByText(/Last updated/i)).toBeInTheDocument()
  })

  it('shows staleness warning when data is older than 3 hours', () => {
    const staleTime = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
    render(<SummaryBar games={games} fetchedAt={staleTime} />)
    expect(screen.getByText(/outdated/i)).toBeInTheDocument()
  })
})
