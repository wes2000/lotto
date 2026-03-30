import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import App from './App.jsx'

// The raw JSON shape as it comes from the server (snake_case)
const jsonFixture = {
  fetched_at: '2026-03-29T14:00:00Z',
  games: [
    {
      id: '1001',
      name: 'Lucky 7s',
      ticket_price: 5,
      richness_ratio: 1.2,
      prizes_remaining_value: 500000,
      buy_all_profit: -50000,
      buy_all_cost: 550000,
      tickets_remaining_fraction: 0.4,
      tickets_remaining: 4000,
      total_tickets_printed: 10000,
      total_prize_value_at_launch: 600000,
      tiers: [],
    },
  ],
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('App', () => {
  it('shows loading message during initial load', () => {
    // fetch never resolves during this test
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
    render(<App />)
    expect(screen.getByText('Loading data...')).toBeInTheDocument()
  })

  it('shows network error message on fetch failure', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('Network error'))))
    render(<App />)
    await waitFor(() =>
      expect(
        screen.getByText('Unable to load data. The data file may not exist yet.')
      ).toBeInTheDocument()
    )
  })

  it('shows network error message on non-ok HTTP response', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ ok: false, status: 404, text: () => Promise.resolve('Not Found') })
    ))
    render(<App />)
    await waitFor(() =>
      expect(
        screen.getByText('Unable to load data. The data file may not exist yet.')
      ).toBeInTheDocument()
    )
  })

  it('shows JSON error message on malformed JSON', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ ok: true, text: () => Promise.resolve('not valid json {{{') })
    ))
    render(<App />)
    await waitFor(() =>
      expect(
        screen.getByText('Data format error. Please try again later.')
      ).toBeInTheDocument()
    )
  })

  it('renders header when data loads successfully', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(jsonFixture)),
      })
    ))
    render(<App />)
    await waitFor(() =>
      expect(screen.getByText('Texas Lottery Dashboard')).toBeInTheDocument()
    )
  })

  it('renders SummaryBar with games and fetchedAt when loaded', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(jsonFixture)),
      })
    ))
    render(<App />)
    // SummaryBar renders "Last updated" label
    await waitFor(() =>
      expect(screen.getByText(/Last updated/i)).toBeInTheDocument()
    )
    // SummaryBar renders "Favorable Games" label
    expect(screen.getByText(/Favorable/i)).toBeInTheDocument()
  })

  it('renders GameGrid with games when loaded', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(jsonFixture)),
      })
    ))
    render(<App />)
    // GameGrid renders sort buttons; "Richness" is one of them
    await waitFor(() =>
      expect(screen.getByText('Richness')).toBeInTheDocument()
    )
    // The game name should appear in a GameCard
    expect(screen.getByText('Lucky 7s')).toBeInTheDocument()
  })
})
