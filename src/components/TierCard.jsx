import { formatCurrency, formatRatio, getRichnessColor } from '../utils/calculations.js'
import { COLORS } from '../theme.js'

export default function TierCard({ tier }) {
  const { prize, originalCount, remaining, richnessRatio } = tier
  const color = getRichnessColor(richnessRatio)
  const pct = originalCount > 0 ? (remaining / originalCount) * 100 : 0

  return (
    <div style={{
      background: COLORS.cardBg,
      border: `1px solid ${COLORS.cardBorder}`,
      borderRadius: 8,
      padding: '8px 12px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: COLORS.gold, fontSize: 14, fontWeight: 800 }}>
          {formatCurrency(prize)}
        </span>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ color: COLORS.textMuted, fontSize: 11 }}>
            {remaining} of {originalCount} remain
          </span>
          <span style={{
            background: color,
            color: color === COLORS.red ? '#fff' : '#000',
            fontSize: 10,
            fontWeight: 700,
            padding: '1px 6px',
            borderRadius: 4,
          }}>
            {formatRatio(richnessRatio)}
          </span>
        </div>
      </div>
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        borderRadius: 3,
        height: 4,
        marginTop: 8,
      }}>
        <div
          data-testid="tier-progress-bar"
          style={{
            background: color,
            width: `${pct}%`,
            height: '100%',
            borderRadius: 3,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  )
}
