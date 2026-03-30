import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import TierCard from './TierCard.jsx'

const tier = {
  prize: 500000,
  originalCount: 3,
  remaining: 2,
  richnessRatio: 2.90,
}

describe('TierCard', () => {
  it('displays the prize amount', () => {
    render(<TierCard tier={tier} />)
    expect(screen.getByText('$500K')).toBeInTheDocument()
  })

  it('displays remaining count', () => {
    render(<TierCard tier={tier} />)
    expect(screen.getByText(/2 of 3/)).toBeInTheDocument()
  })

  it('displays richness ratio badge', () => {
    render(<TierCard tier={tier} />)
    expect(screen.getByText('2.90×')).toBeInTheDocument()
  })

  it('renders a progress bar element', () => {
    const { container } = render(<TierCard tier={tier} />)
    const bar = container.querySelector('[data-testid="tier-progress-bar"]')
    expect(bar).toBeInTheDocument()
  })

  it('shows "0 of N" when all prizes claimed', () => {
    render(<TierCard tier={{ ...tier, remaining: 0 }} />)
    expect(screen.getByText(/0 of 3/)).toBeInTheDocument()
  })
})
