import { useState } from 'react'
import TierDetail from './TierDetail.jsx'
import { formatCurrency, formatRatio, getRichnessColor } from '../utils/calculations.js'
import { COLORS } from '../theme.js'

export default function GameCard({ game }) {
  const [expanded, setExpanded] = useState(false)
  const { name, ticketPrice, richnessRatio, prizesRemainingValue, buyAllProfit, ticketsRemainingFraction } = game
  const color = getRichnessColor(richnessRatio)
  const profitColor = buyAllProfit >= 0 ? COLORS.green : COLORS.red

  return (
    <div style={{
      background: COLORS.cardBg,
      border: `1px solid ${COLORS.cardBorder}`,
      borderRadius: 12,
      overflow: 'hidden',
      cursor: 'pointer',
    }}>
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ padding: '14px 16px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div>
            <div style={{ color: COLORS.textPrimary, fontWeight: 700, fontSize: 14 }}>{name}</div>
            <div style={{ color: COLORS.textMuted, fontSize: 11, marginTop: 2 }}>${ticketPrice} ticket</div>
          </div>
          <span style={{
            background: color,
            color: color === COLORS.red ? '#fff' : '#000',
            fontWeight: 800,
            fontSize: 18,
            padding: '4px 10px',
            borderRadius: 6,
          }}>
            {formatRatio(richnessRatio)}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <div style={{ color: COLORS.textFaint, fontSize: 10 }}>PRIZES LEFT</div>
            <div style={{ color: COLORS.gold, fontWeight: 700, fontSize: 16 }}>{formatCurrency(prizesRemainingValue)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: COLORS.textFaint, fontSize: 10 }}>BUY ALL</div>
            <div style={{ color: profitColor, fontWeight: 700, fontSize: 16 }}>{formatCurrency(buyAllProfit)}</div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 3, height: 4 }}>
          <div style={{
            background: color,
            width: `${(ticketsRemainingFraction ?? 0) * 100}%`,
            height: '100%',
            borderRadius: 3,
          }} />
        </div>
        <div style={{ color: COLORS.textFaint, fontSize: 10, marginTop: 4 }}>
          {ticketsRemainingFraction !== null
            ? `${Math.round(ticketsRemainingFraction * 100)}% tickets remain`
            : 'Ticket count unavailable'}
        </div>
      </div>

      {expanded && <TierDetail game={game} />}
    </div>
  )
}
