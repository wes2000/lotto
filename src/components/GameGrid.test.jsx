import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import GameGrid from './GameGrid.jsx'

const games = [
  { id: '1', name: 'Game Alpha', ticketPrice: 50, richnessRatio: 1.2,  prizesRemainingValue: 5_000_000, buyAllProfit: -500_000, ticketsRemainingFraction: 0.4, tiers: [], buyAllCost: 5_500_000 },
  { id: '2', name: 'Game Beta',  ticketPrice: 20, richnessRatio: 3.67, prizesRemainingValue: 12_000_000, buyAllProfit: 1_000_000, ticketsRemainingFraction: 0.2, tiers: [], buyAllCost: 11_000_000 },
  { id: '3', name: 'Game Gamma', ticketPrice: 10, richnessRatio: 0.8,  prizesRemainingValue: 1_000_000, buyAllProfit: -200_000, ticketsRemainingFraction: 0.7, tiers: [], buyAllCost: 1_200_000 },
]

describe('GameGrid', () => {
  it('renders all games', () => {
    render(<GameGrid games={games} />)
    expect(screen.getByText('Game Alpha')).toBeInTheDocument()
    expect(screen.getByText('Game Beta')).toBeInTheDocument()
    expect(screen.getByText('Game Gamma')).toBeInTheDocument()
  })

  it('default sort is richness ratio descending (Beta first)', () => {
    render(<GameGrid games={games} />)
    const cards = screen.getAllByText(/Game (Alpha|Beta|Gamma)/)
    expect(cards[0].textContent).toBe('Game Beta')
  })

  it('sorts by prizes remaining descending when that button is clicked', async () => {
    render(<GameGrid games={games} />)
    await userEvent.click(screen.getByRole('button', { name: /Prizes/i }))
    const cards = screen.getAllByText(/Game (Alpha|Beta|Gamma)/)
    expect(cards[0].textContent).toBe('Game Beta')
  })

  it('toggles sort direction on second click of same column', async () => {
    render(<GameGrid games={games} />)
    // Click Richness button twice — first click sets descending (default), second click sets ascending
    await userEvent.click(screen.getByRole('button', { name: /Richness/i }))
    await userEvent.click(screen.getByRole('button', { name: /Richness/i }))
    // ascending: Gamma (0.8) should be first
    const cards = screen.getAllByText(/Game (Alpha|Beta|Gamma)/)
    expect(cards[0].textContent).toBe('Game Gamma')
  })
})
