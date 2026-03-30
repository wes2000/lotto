import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import TierDetail from './TierDetail.jsx'

const game = {
  ticketPrice: 50,
  ticketsRemaining: 276000,
  ticketsRemainingFraction: 0.23,
  prizesRemainingValue: 12_500_000,
  buyAllCost: 13_800_000,
  buyAllProfit: -1_300_000,
  tiers: [
    { prize: 500000, originalCount: 3, remaining: 2, richnessRatio: 2.90 },
    { prize: 50000,  originalCount: 22, remaining: 18, richnessRatio: 1.95 },
  ],
}

describe('TierDetail', () => {
  it('renders a TierCard for each tier', () => {
    render(<TierDetail game={game} />)
    expect(screen.getByText('$500K')).toBeInTheDocument()
    expect(screen.getByText('$50K')).toBeInTheDocument()
  })

  it('shows buy all cost in footer', () => {
    render(<TierDetail game={game} />)
    expect(screen.getByText('$13.8M')).toBeInTheDocument()
  })

  it('shows prizes remaining in footer', () => {
    render(<TierDetail game={game} />)
    expect(screen.getByText('$12.5M')).toBeInTheDocument()
  })

  it('shows negative profit in footer', () => {
    render(<TierDetail game={game} />)
    const profit = screen.getByText('-$1.3M')
    expect(profit).toBeInTheDocument()
  })
})
