import { useState, useEffect } from 'react'
import SummaryBar from './components/SummaryBar.jsx'
import GameGrid from './components/GameGrid.jsx'
import { computeBuyAllCost, computeBuyAllProfit, computeRichnessRatio, computeTicketsRemainingFraction } from './utils/calculations.js'

const DATA_URL = 'https://raw.githubusercontent.com/wes2000/lotto/main/data/texas-latest.json'

function transformGame(raw) {
  const ticketPrice = raw.ticket_price
  const ticketsRemaining = raw.tickets_remaining
  const totalTicketsPrinted = raw.total_tickets_printed
  const totalPrizeValueAtLaunch = raw.total_prize_value_at_launch
  const prizesRemainingValue = raw.prizes_remaining_value

  const buyAllCost = raw.buy_all_cost ?? computeBuyAllCost({ ticketsRemaining, ticketPrice })
  const buyAllProfit = raw.buy_all_profit ?? computeBuyAllProfit({ prizesRemainingValue, buyAllCost })
  const richnessRatio = raw.richness_ratio ?? computeRichnessRatio({ prizesRemainingValue, ticketsRemaining, totalPrizeValueAtLaunch, totalTicketsPrinted })
  const ticketsRemainingFraction = raw.tickets_remaining_fraction ?? computeTicketsRemainingFraction({ ticketsRemaining, totalTicketsPrinted })

  return {
    id: raw.id,
    name: raw.name,
    ticketPrice,
    ticketsRemaining,
    totalTicketsPrinted,
    totalPrizeValueAtLaunch,
    prizesRemainingValue,
    buyAllCost,
    buyAllProfit,
    richnessRatio,
    ticketsRemainingFraction,
    tiers: (raw.tiers ?? []).map(tier => ({
      prize: tier.prize,
      odds: tier.odds,
      remaining: tier.remaining,
      totalPrinted: tier.total_printed ?? tier.totalPrinted,
    })),
  }
}

export default function App() {
  const [state, setState] = useState('loading')
  const [data, setData] = useState(null)

  useEffect(() => {
    fetch(DATA_URL)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.text()
      })
      .then(text => {
        const json = JSON.parse(text)
        setData({
          fetchedAt: json.fetched_at,
          games: json.games.map(transformGame),
        })
        setState('loaded')
      })
      .catch(err => {
        if (err instanceof SyntaxError) {
          setState('json-error')
        } else {
          setState('error')
        }
      })
  }, [])

  if (state === 'loading') return <div>Loading data...</div>
  if (state === 'error') return <div>Unable to load data. The data file may not exist yet.</div>
  if (state === 'json-error') return <div>Data format error. Please try again later.</div>

  return (
    <div>
      <header>
        <h1>Texas Lottery Dashboard</h1>
      </header>
      <SummaryBar games={data.games} fetchedAt={data.fetchedAt} />
      <GameGrid games={data.games} />
    </div>
  )
}
