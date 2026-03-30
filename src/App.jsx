import { useState, useEffect } from 'react'
import SummaryBar from './components/SummaryBar.jsx'
import GameGrid from './components/GameGrid.jsx'

const DATA_URL = 'https://raw.githubusercontent.com/wes2000/lotto/main/data/texas-latest.json'

function transformGame(raw) {
  return {
    id: raw.id,
    name: raw.name,
    ticketPrice: raw.ticketPrice,
    ticketsRemaining: raw.ticketsRemaining,
    totalTicketsPrinted: raw.totalTicketsPrinted,
    totalPrizeValueAtLaunch: raw.totalPrizeValueAtLaunch,
    prizesRemainingValue: raw.prizesRemainingValue,
    buyAllCost: raw.buyAllCost,
    buyAllProfit: raw.buyAllProfit,
    richnessRatio: raw.richnessRatio,
    ticketsRemainingFraction: raw.ticketsRemainingFraction,
    tiers: (raw.tiers ?? []).map(tier => ({
      prize: tier.prize,
      originalCount: tier.originalCount,
      remaining: tier.remaining,
      richnessRatio: tier.richnessRatio,
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
