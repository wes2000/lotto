# Lottery Ticket Dashboard — Design Spec

**Date:** 2026-03-29
**State:** Texas (expandable to other states)
**Repo:** https://github.com/wes2000/lotto

---

## Overview

A static web dashboard hosted on GitHub Pages that monitors Texas scratch-off lottery tickets. Data is fetched hourly from the official TX Lottery CSV via GitHub Actions, transformed into JSON, and committed to the repo. The React app reads that JSON and presents a visual, sortable dashboard helping users identify the most favorable games to play based on remaining prize richness.

---

## Architecture

```
github.com/wes2000/lotto
├── .github/workflows/
│   ├── fetch-data.yml        # Hourly cron: fetch CSV → transform → commit JSON
│   └── deploy.yml            # On push to main: Vite build → GitHub Pages deploy
├── data/
│   ├── texas-latest.json     # Current snapshot (always loaded by app)
│   ├── texas-history.json    # Appended hourly metric snapshots (capped at 720)
│   └── texas-baseline.json   # First-observed values per game (never overwritten)
├── scripts/
│   └── fetch-and-transform.js  # Node script: fetch CSV → compute metrics → write JSON
├── src/
│   ├── components/
│   │   ├── SummaryBar.jsx    # Top stats bar
│   │   ├── GameGrid.jsx      # Sortable grid of GameCards
│   │   ├── GameCard.jsx      # Individual game card + accordion trigger
│   │   ├── TierDetail.jsx    # Accordion: prize tier breakdown
│   │   └── TierCard.jsx      # Single prize tier row
│   ├── utils/
│   │   └── calculations.js   # Richness ratio, buy-all, formatting helpers
│   └── App.jsx
├── public/
└── index.html
```

**Data flow:**
1. GitHub Actions fetches the TX Lottery CSV hourly (see CSV section for URL and format)
2. `scripts/fetch-and-transform.js` parses CSV → computes all metrics → writes `texas-latest.json`, appends to `texas-history.json`, and bootstraps `texas-baseline.json` for any new game IDs
3. If data changed (excluding `fetched_at`), commits and pushes to `main` with `[skip ci]`
4. On load, the React app fetches `texas-latest.json` directly from the raw GitHub URL (`https://raw.githubusercontent.com/wes2000/lotto/main/data/texas-latest.json`) — the app always reads the latest committed JSON without needing a redeploy
5. `deploy.yml` triggers only on code changes (non-`[skip ci]` pushes to `main`): `npm ci` → `npm run build` → deploys `dist/` to GitHub Pages

> **Key architectural point:** Data and code are decoupled. The built app is deployed once when code changes. Data updates flow through `raw.githubusercontent.com` at runtime — the app always sees fresh JSON regardless of when the last code deploy happened.

---

## TX Lottery CSV Format

**Source URL:** `https://www.texaslottery.com/export/sites/lottery/Games/Scratch_Offs/scratch_off_odds.csv`

The CSV contains **one row per prize tier per game** (a $20 game with 8 prize levels has 8 rows). All rows for a game share the same Game Number, Name, and Ticket Price.

**Columns:**

| Column | Type | Description |
|---|---|---|
| `Game #` | string | Stable game identifier (used as `id` in JSON) |
| `Game Name` | string | Display name |
| `Ticket Price` | number | Cost per ticket in dollars |
| `Start Date` | date | Game launch date |
| `Prize Amount` | number | Dollar value of this prize tier |
| `Prizes Printed` | number | Original total prizes in this tier at launch |
| `Prizes Claimed` | number | Number of prizes in this tier redeemed to date |

**Derived fields (not in CSV, computed by transform script):**

- `prizes_remaining` per tier = `Prizes Printed − Prizes Claimed`
- `total_tickets_printed` per game — resolved in this priority order:
  1. **Direct column:** Check if the CSV contains a `Total Tickets` or `Tickets Remaining` column — use it if present
  2. **Overall odds column:** Check if the CSV contains an `Overall Odds` column (e.g., `1 in 3.5` → `overall_win_probability = 1/3.5`). Then: `total_tickets_printed = sum(Prizes Printed across all tiers) / overall_win_probability`
  3. **Baseline cache:** If neither column is present, check `texas-baseline.json` — `total_tickets_at_launch` is stored there on first observation and re-used on every subsequent fetch for that game
  4. **Fallback:** If none of the above are available (new game, first run, no odds column), log a warning and skip the game — do not include it in the output until the value can be resolved
- `tickets_remaining` per game = `total_tickets_printed × (1 − weighted_claim_rate)` where `weighted_claim_rate = sum(Prizes Claimed) / sum(Prizes Printed)` across all tiers

---

## Baseline Data (`texas-baseline.json`)

To compute the richness ratio, the script needs the original prize pool and total tickets at launch. These values are captured the **first time a game ID is seen** in the CSV and stored in `texas-baseline.json`.

**Mutability rules:**
- `first_seen`, `total_tickets_at_launch`, `total_prize_value_at_launch` — **immutable**; never overwritten after first observation
- `tiers[tier].original_count` — **updated** if the CSV's `Prizes Printed` for that tier changes (rare; occurs when the lottery adds additional ticket packs); treat the new value as authoritative

---

## Game Lifecycle

**New game appears in CSV:** Bootstrap baseline on first observation, include in dashboard normally.

**Game disappears from CSV (ended/retired):** Exclude from `texas-latest.json` and dashboard. The baseline entry is retained in `texas-baseline.json` for historical reference.

**Game ID is stable:** TX Lottery uses a numeric `Game #` that does not change across fetches. This is used as the canonical ID throughout.

---

## Data Model

### `texas-latest.json`

```json
{
  "state": "texas",
  "fetched_at": "2026-03-29T14:00:00Z",
  "games": [
    {
      "id": "2345",
      "name": "$50 Lucky 7s",
      "ticket_price": 50,
      "total_tickets_printed": 1200000,
      "total_prize_value_at_launch": 14800000,
      "tickets_remaining": 276000,
      "tickets_remaining_fraction": 0.23,
      "prizes_remaining_value": 12500000,
      "buy_all_cost": 13800000,
      "buy_all_profit": -1300000,
      "richness_ratio": 3.67,
      "tiers": [
        {
          "prize": 500000,
          "original_count": 3,
          "remaining": 2,
          "richness_ratio": 2.90
        }
      ]
    }
  ]
}
```

### Computed Fields

| Field | Formula |
|---|---|
| `richness_ratio` (game) | `(prizes_remaining_value / tickets_remaining) / (total_prize_value_at_launch / total_tickets_printed)` |
| `richness_ratio` (tier) | `(tier_remaining / tickets_remaining) / (tier_original_count / total_tickets_printed)` |
| `buy_all_cost` | `tickets_remaining × ticket_price` |
| `buy_all_profit` | `prizes_remaining_value − buy_all_cost` |
| `tickets_remaining_fraction` | `tickets_remaining / total_tickets_printed` (decimal 0–1; UI multiplies by 100 to display as %) |

---

## UI Components

### SummaryBar
- Total prizes remaining across all active games (gold)
- Best single-game buy-all result: "Best Buy All: +$X.XM" if positive, "Least Loss: −$X.XM" if all negative
- Count of games with richness ratio ≥ 1.0 ("favorable games")
- Last updated timestamp + staleness warning if `fetched_at` > 3 hours old

### GameGrid
- Responsive card grid: 3 columns desktop, 2 tablet, 1 mobile
- Default sort: richness ratio descending
- Sort options: Richness Ratio, Prizes Remaining, Buy All Profit/Loss, Ticket Price, % Tickets Remaining
- All sorts toggle ascending/descending on click

### GameCard
- Game name + ticket price
- Richness ratio badge: green ≥ 1.5×, gold 1.0–1.49×, red < 1.0×
- Total prizes remaining (gold)
- Buy All profit/loss (green if ≥ 0, red if negative)
- Progress bar: tickets_remaining_fraction; color follows richness badge
- Click → expands TierDetail accordion inline

### TierDetail (accordion)
- One TierCard per prize tier, sorted prize descending
- Footer: Buy All Cost | Total Prizes Remaining | Net Profit/Loss

### TierCard
- Prize amount (gold), "X of Y remain", progress bar, richness badge

---

## Visual Design

- Background: deep navy gradient (`#1a1a2e` → `#16213e`)
- Primary accent: gold (`#ffd700`)
- Positive/profit: neon green (`#00ff88`)
- Negative/loss: red (`#e94560`)
- Card backgrounds: `rgba(255,255,255,0.07)` with `rgba(255,255,255,0.12)` border
- Richness thresholds: green ≥ 1.5×, gold 1.0–1.49×, red < 1.0×

---

## Loading and Error States

| State | UI Behavior |
|---|---|
| Initial load | Full-page spinner with "Loading data..." |
| Fetch error (network/404) | "Unable to load data. The data file may not exist yet." |
| Malformed JSON | "Data format error. Please try again later." |
| Data stale (> 3 hours) | Yellow warning banner: "Data may be outdated (last updated X hours ago)" |
| No games returned | "No active games found." |

---

## Data Pipeline

### `fetch-data.yml`
- Hourly cron + `workflow_dispatch`
- Fetches CSV, transforms, diffs (excluding `fetched_at`), commits with `[skip ci]` if changed

### `deploy.yml`
- Triggers on push to `main` that does NOT contain `[skip ci]`
- `npm ci` → `npm run build` → deploy to `gh-pages` via `peaceiris/actions-gh-pages`

---

## Future Considerations

- Multi-state support
- Trend charts from `texas-history.json`
- Webhook/Discord alerts on richness threshold crossing
