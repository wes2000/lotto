import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import GameCard from './GameCard.jsx'

const game = {
  id: '2345',
  name: '$50 Lucky 7s',
  ticketPrice: 50,
  ticketsRemainingFraction: 0.23,
  prizesRemainingValue: 12_500_000,
  buyAllProfit: -1_300_000,
  richnessRatio: 3.67,
  tiers: [
    { prize: 500000, originalCount: 3, remaining: 2, richnessRatio: 2.90 },
  ],
  buyAllCost: 13_800_000,
}

describe('GameCard', () => {
  it('displays the game name', () => {
    render(<GameCard game={game} />)
    expect(screen.getByText('$50 Lucky 7s')).toBeInTheDocument()
  })

  it('displays the richness ratio badge', () => {
    render(<GameCard game={game} />)
    expect(screen.getByText('3.67×')).toBeInTheDocument()
  })

  it('displays prizes remaining', () => {
    render(<GameCard game={game} />)
    expect(screen.getByText('$12.5M')).toBeInTheDocument()
  })

  it('displays negative buy-all profit', () => {
    render(<GameCard game={game} />)
    expect(screen.getByText('-$1.3M')).toBeInTheDocument()
  })

  it('tier detail is hidden by default', () => {
    render(<GameCard game={game} />)
    expect(screen.queryByText('$500K')).not.toBeInTheDocument()
  })

  it('expands tier detail when clicked', async () => {
    render(<GameCard game={game} />)
    await userEvent.click(screen.getByText('$50 Lucky 7s'))
    expect(screen.getByText('$500K')).toBeInTheDocument()
  })

  it('collapses tier detail on second click', async () => {
    render(<GameCard game={game} />)
    await userEvent.click(screen.getByText('$50 Lucky 7s'))
    await userEvent.click(screen.getByText('$50 Lucky 7s'))
    expect(screen.queryByText('$500K')).not.toBeInTheDocument()
  })
})
