import { formatCurrency } from '../utils/calculations.js'
import { COLORS } from '../theme.js'

export default function SummaryBar({ games, fetchedAt, csvLastModified, onRefresh }) {
  const totalPrizes = games.reduce((s, g) => s + g.prizesRemainingValue, 0)
  const bestBuyAll = Math.max(...games.map(g => g.buyAllProfit))
  const allNegative = games.every(g => g.buyAllProfit < 0)
  const favorableCount = games.filter(g => g.richnessRatio !== null && g.richnessRatio >= 1.0).length

  const fetchedDate = new Date(fetchedAt)
  const ageMs = Date.now() - fetchedDate.getTime()
  const ageHours = ageMs / (1000 * 60 * 60)
  const isStale = ageHours > 3

  const timeStr = fetchedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div>
      {isStale && (
        <div style={{
          background: '#7c5c00',
          color: '#ffd700',
          textAlign: 'center',
          padding: '6px',
          fontSize: 12,
        }}>
          Data may be outdated — fetched {Math.round(ageHours)} hours ago
        </div>
      )}
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        padding: '16px 24px',
        borderBottom: `1px solid ${COLORS.cardBorder}`,
        flexWrap: 'wrap',
        gap: 16,
        alignItems: 'center',
      }}>
        <Stat label="Total Prizes" value={formatCurrency(totalPrizes)} color={COLORS.gold} />
        <Stat
          label={allNegative ? 'Least Loss' : 'Best Buy All'}
          value={formatCurrency(bestBuyAll)}
          color={bestBuyAll >= 0 ? COLORS.green : COLORS.red}
        />
        <Stat label="Favorable Games" value={String(favorableCount)} color={COLORS.green} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: COLORS.textFaint, fontSize: 10, textTransform: 'uppercase' }}>Last updated</div>
          <div style={{ color: COLORS.textMuted, fontSize: 13 }}>{timeStr}</div>
          {csvLastModified && (
            <div style={{ color: COLORS.textFaint, fontSize: 10, marginTop: 2 }}>
              TX data: {new Date(csvLastModified).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
          <button
            onClick={onRefresh}
            style={{
              marginTop: 6,
              background: 'rgba(255,255,255,0.1)',
              border: `1px solid ${COLORS.cardBorder}`,
              color: COLORS.textMuted,
              padding: '4px 12px',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 11,
            }}
          >
            Update Now
          </button>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ color: COLORS.textFaint, fontSize: 10, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ color, fontWeight: 800, fontSize: 22 }}>{value}</div>
    </div>
  )
}
