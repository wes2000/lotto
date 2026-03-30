import TierCard from './TierCard.jsx'
import { formatCurrency } from '../utils/calculations.js'
import { COLORS } from '../theme.js'

export default function TierDetail({ game }) {
  const { tiers, buyAllCost, prizesRemainingValue, buyAllProfit } = game
  const profitColor = buyAllProfit >= 0 ? COLORS.green : COLORS.red

  return (
    <div style={{ padding: '12px 16px 16px', borderTop: `1px solid ${COLORS.cardBorder}` }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {tiers.map(tier => (
          <TierCard key={tier.prize} tier={tier} />
        ))}
      </div>

      {/* Footer summary */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: 12,
        padding: '8px 12px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: 6,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: COLORS.textMuted, fontSize: 10 }}>Buy All Cost</div>
          <div style={{ color: COLORS.textPrimary, fontWeight: 700, fontSize: 13 }}>
            {formatCurrency(buyAllCost)}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: COLORS.textMuted, fontSize: 10 }}>Prizes Remaining</div>
          <div style={{ color: COLORS.gold, fontWeight: 700, fontSize: 13 }}>
            {formatCurrency(prizesRemainingValue)}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: COLORS.textMuted, fontSize: 10 }}>Profit / Loss</div>
          <div style={{ color: profitColor, fontWeight: 700, fontSize: 13 }}>
            {formatCurrency(buyAllProfit)}
          </div>
        </div>
      </div>
    </div>
  )
}
