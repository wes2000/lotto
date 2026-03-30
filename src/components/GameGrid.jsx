import { useState } from 'react'
import GameCard from './GameCard.jsx'
import { COLORS } from '../theme.js'

const SORT_OPTIONS = [
  { key: 'richnessRatio',            label: 'Richness' },
  { key: 'prizesRemainingValue',     label: 'Prizes' },
  { key: 'buyAllProfit',             label: 'Buy All' },
  { key: 'ticketPrice',              label: 'Price' },
  { key: 'ticketsRemainingFraction', label: '% Left' },
]

const DEFAULT_SORT_KEY = 'richnessRatio'

export default function GameGrid({ games }) {
  // sortKey='' means "using the default sort (richness desc) but no button is 'active/clicked'"
  const [sortKey, setSortKey] = useState('')
  const [sortAsc, setSortAsc] = useState(false)

  function handleSort(key) {
    if (key === sortKey) {
      // Already on this sort: toggle direction
      setSortAsc(a => !a)
    } else {
      // New sort key: start descending
      setSortKey(key)
      setSortAsc(false)
    }
  }

  // The effective sort key — fall back to default when no button has been clicked
  const effectiveSortKey = sortKey || DEFAULT_SORT_KEY

  const sorted = [...games].sort((a, b) => {
    const av = a[effectiveSortKey] ?? -Infinity
    const bv = b[effectiveSortKey] ?? -Infinity
    return sortAsc ? av - bv : bv - av
  })

  return (
    <div>
      {/* Sort controls */}
      <div style={{ display: 'flex', gap: 8, padding: '12px 16px', flexWrap: 'wrap' }}>
        {SORT_OPTIONS.map(opt => {
          const isActive = sortKey === opt.key
          return (
            <button
              key={opt.key}
              onClick={() => handleSort(opt.key)}
              style={{
                background: isActive ? COLORS.gold : COLORS.cardBg,
                color: isActive ? '#000' : COLORS.textMuted,
                border: `1px solid ${COLORS.cardBorder}`,
                borderRadius: 6,
                padding: '4px 12px',
                fontSize: 12,
                cursor: 'pointer',
                fontWeight: isActive ? 700 : 400,
              }}
            >
              {opt.label} {isActive ? (sortAsc ? '↑' : '↓') : ''}
            </button>
          )
        })}
      </div>

      {/* Card grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: 16,
        padding: '0 16px 24px',
      }}>
        {sorted.map(game => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </div>
  )
}
