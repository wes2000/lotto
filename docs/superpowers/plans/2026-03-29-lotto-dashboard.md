# Lotto Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static React dashboard on GitHub Pages that fetches Texas Lottery scratch-off data hourly via GitHub Actions and displays games ranked by prize richness ratio with buy-all profit/loss stats.

**Architecture:** GitHub Actions fetches the TX Lottery CSV hourly, transforms it to JSON committed in `data/`, and pushes with `[skip ci]`. The React app fetches `texas-latest.json` from `raw.githubusercontent.com` at runtime — data and code deploys are fully decoupled. Clicking a game card expands an inline accordion showing per-tier prize richness.

**Tech Stack:** React 18, Vite, Vitest, @testing-library/react, csv-parse (Node), GitHub Actions, GitHub Pages

---

## File Map

| File | Responsibility |
|---|---|
| `scripts/fetch-and-transform.js` | Fetch TX Lottery CSV, parse, compute metrics, write JSON files |
| `scripts/fetch-and-transform.test.js` | Unit tests for transform script (Node/Vitest) |
| `src/utils/calculations.js` | Pure functions: richness ratio, buy-all cost/profit, formatting |
| `src/utils/calculations.test.js` | Unit tests for all calculation functions |
| `src/components/SummaryBar.jsx` | Top stats bar: total prizes, best buy-all, favorable count, last updated |
| `src/components/SummaryBar.test.jsx` | Tests for SummaryBar rendering |
| `src/components/GameGrid.jsx` | Sortable grid of GameCards; owns sort state |
| `src/components/GameGrid.test.jsx` | Tests for sort behavior and grid rendering |
| `src/components/GameCard.jsx` | Individual game card + accordion trigger; owns expanded state |
| `src/components/GameCard.test.jsx` | Tests for card rendering, expand/collapse |
| `src/components/TierDetail.jsx` | Accordion body: list of TierCards + footer summary |
| `src/components/TierDetail.test.jsx` | Tests for TierDetail rendering |
| `src/components/TierCard.jsx` | Single prize tier row with progress bar and richness badge |
| `src/components/TierCard.test.jsx` | Tests for TierCard rendering |
| `src/App.jsx` | Fetch data from raw GitHub URL; render loading/error/success states |
| `src/App.test.jsx` | Tests for loading, error, and data-loaded states |
| `src/main.jsx` | React entry point |
| `src/index.css` | Global styles: navy gradient background, fonts, resets |
| `src/theme.js` | Color/threshold constants shared across components |
| `vite.config.js` | Vite config with Vitest setup and GitHub Pages base path |
| `package.json` | Dependencies and scripts |
| `.github/workflows/fetch-data.yml` | Hourly data fetch cron job |
| `.github/workflows/deploy.yml` | Build + deploy to GitHub Pages on code push |

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html`
- Create: `src/main.jsx`
- Create: `src/App.jsx` (stub)
- Create: `src/index.css`
- Create: `.gitignore`

- [ ] Step 1: Initialize Vite React project
- [ ] Step 2: Install dependencies
- [ ] Step 3: Configure Vite for testing and GitHub Pages (base: '/lotto/')
- [ ] Step 4: Create src/test-setup.js
- [ ] Step 5: Add test scripts to package.json
- [ ] Step 6: Add "type": "module" to package.json
- [ ] Step 7: Wipe default Vite boilerplate
- [ ] Step 8: Create data directory with .gitkeep
- [ ] Step 9: Verify build succeeds
- [ ] Step 10: Commit scaffold

---

### Task 2: Calculation Utilities (TDD)

**Files:**
- Create: `src/utils/calculations.js`
- Create: `src/utils/calculations.test.js`

Pure functions: computeRichnessRatio, computeBuyAllCost, computeBuyAllProfit, computeTicketsRemainingFraction, formatCurrency, formatRatio, getRichnessColor. Also create `src/theme.js` with COLORS and RICHNESS_THRESHOLDS constants.

Richness ratio formula: `(prizes_remaining_value / tickets_remaining) / (total_prize_value_at_launch / total_tickets_printed)`

Color thresholds: green (#00ff88) >= 1.5x, gold (#ffd700) 1.0-1.49x, red (#e94560) < 1.0x

---

### Task 3: Data Transform Script (TDD)

**Files:**
- Create: `scripts/fetch-and-transform.js`
- Create: `scripts/fetch-and-transform.test.js`
- Create: `scripts/fixtures/sample.csv`

Key exports: parseCSV, groupByGame, computeGameMetrics, run (main entry point).

Ticket count resolution priority: (1) direct CSV column, (2) Overall Odds column, (3) baseline cache, (4) skip game with warning. Never write a guessed baseline value.

Diff logic excludes `fetched_at`. History capped at 720 entries (summary only, no tier data in history).

---

### Task 4: GitHub Actions Workflows

**Files:**
- Create: `.github/workflows/fetch-data.yml`
- Create: `.github/workflows/deploy.yml`

fetch-data.yml: hourly cron + workflow_dispatch, commits with "[skip ci]"
deploy.yml: triggers only on pushes WITHOUT "[skip ci]", builds and deploys to gh-pages

---

### Task 5: TierCard Component (TDD)

**Files:**
- Create: `src/components/TierCard.jsx`
- Create: `src/components/TierCard.test.jsx`

Props: `{ tier }` where tier = { prize, originalCount, remaining, richnessRatio }
Shows: prize amount, "X of Y remain", progress bar (tier_remaining/originalCount), richness badge

---

### Task 6: TierDetail Component (TDD)

**Files:**
- Create: `src/components/TierDetail.jsx`
- Create: `src/components/TierDetail.test.jsx`

Props: `{ game }`. Renders TierCards sorted by prize descending + footer (Buy All Cost | Prizes Remaining | Profit/Loss).

---

### Task 7: GameCard Component (TDD)

**Files:**
- Create: `src/components/GameCard.jsx`
- Create: `src/components/GameCard.test.jsx`

Props: `{ game }`. Shows game name, ticket price, richness badge, prizes remaining (gold), buy-all profit/loss, progress bar. Click expands/collapses TierDetail accordion inline.

---

### Task 8: SummaryBar Component (TDD)

**Files:**
- Create: `src/components/SummaryBar.jsx`
- Create: `src/components/SummaryBar.test.jsx`

Props: `{ games, fetchedAt }`. Shows: total prizes (gold), best/least-loss buy-all, favorable game count (ratio >= 1.0), last updated time. Shows staleness warning if fetchedAt > 3 hours ago.

---

### Task 9: GameGrid Component (TDD)

**Files:**
- Create: `src/components/GameGrid.jsx`
- Create: `src/components/GameGrid.test.jsx`

Props: `{ games }`. Owns sort state. Default sort: richness ratio descending. Sort options: Richness Ratio, Prizes Remaining, Buy All Profit, Ticket Price, % Tickets Remaining. All toggleable asc/desc.

---

### Task 10: App.jsx — Data Fetch and State Management (TDD)

**Files:**
- Modify: `src/App.jsx`
- Create: `src/App.test.jsx`

Fetches from `https://raw.githubusercontent.com/wes2000/lotto/main/data/texas-latest.json`.
States: loading, error (network/404), json-error (SyntaxError), loaded.
Renders: header, SummaryBar + GameGrid when loaded.

---

### Task 11: Global Styles

**Files:**
- Modify: `src/index.css`
- Verify: `src/main.jsx`

CSS reset (box-sizing, margin, padding). Verify main.jsx imports index.css and renders App. Smoke test dev server.

---

### Task 12: Run All Tests and First Data Fetch

- Run full test suite: `npm run test:run` — all pass
- Push repo to GitHub: `git remote add origin https://github.com/wes2000/lotto.git && git push -u origin main`
- Trigger manual data fetch via GitHub Actions workflow_dispatch
- Verify texas-latest.json committed to repo
- Trigger deploy via empty commit

---

### Task 13: Push All Code via GitHub

- Verify all code committed and pushed
- Verify GitHub Actions green
- Final smoke test at https://wes2000.github.io/lotto/
