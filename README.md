# Plinko Game

A production-ready Plinko application built with React, TypeScript, Node.js, Express, Prisma, and PostgreSQL. It features server-authoritative outcomes via binomial distribution, pre-computed physics simulations for cross-device determinism, JWT authentication, and concurrent bet support with real-time Canvas rendering.

![Plinko Game](readme_image.png)

## Architecture

```
                         ┌─────────────────────────────────────────────┐
                         │                  Client                    │
                         │                                             │
                         │  React + TypeScript + HTML5 Canvas (60fps)  │
                         │                                             │
                         │  1. User clicks "Bet"                       │
                         │  2. POST /api/bet { amount, risk, rows }    │
                         │  3. Receives predetermined path + payout    │
                         │  4. Animates ball along server-sent path    │
                         └──────────────────┬──────────────────────────┘
                                            │ HTTPS
                         ┌──────────────────▼──────────────────────────┐
                         │               Express API                   │
                         │                                             │
                         │  1. Validate JWT + input                    │
                         │  2. selectSlot() via binomial distribution  │
                         │  3. Lookup pre-computed path from JSON      │
                         │  4. Atomic DB transaction (deduct + credit) │
                         │  5. Return { path, multiplier, payout }     │
                         └──────────────────┬──────────────────────────┘
                                            │
                    ┌───────────────────────┼───────────────────────┐
                    │                       │                       │
          ┌─────────▼─────────┐   ┌─────────▼─────────┐   ┌────────▼────────┐
          │    PostgreSQL      │   │   pathData.json    │   │   gameLogic.ts  │
          │                   │   │                    │   │                 │
          │  users: balances  │   │  Pre-simulated     │   │  Binomial dist  │
          │  bets: history    │   │  ball trajectories │   │  Multiplier LUT │
          └───────────────────┘   └────────────────────┘   └─────────────────┘
```

The client is a pure renderer. It has zero influence over outcomes. The server selects the landing slot, computes the payout, commits the database transaction, and then hands the client a set of (x, y, t) keyframes to animate.

## Why Binomial Distribution

A physical Plinko board has `n` rows of pegs. At each peg, a ball bounces either left or right with equal probability. The number of rightward bounces determines which of the `n + 1` slots the ball lands in.

This is mathematically equivalent to flipping `n` fair coins and counting heads. The probability of landing in slot `k` is:

```
P(k) = C(n, k) / 2^n
```

where `C(n, k)` is the binomial coefficient. This distribution is used directly in `selectSlot()` with no artificial weighting. The house edge is encoded entirely in the multiplier tables (the expected value of each configuration is strictly less than 1.00).

## House Edge Verification

The expected value (EV) for a $1 bet can be independently verified by summing `P(k) * multiplier(k)` across all slots. An EV below 1.00 confirms a house edge.

| Configuration | EV per $1 Bet | House Edge |
|:---|:---|:---|
| 8 rows, Low | $0.9844 | 1.56% |
| 8 rows, Medium | $0.9844 | 1.56% |
| 8 rows, High | $0.9844 | 1.56% |
| 12 rows, Low | $0.9783 | 2.17% |
| 12 rows, Medium | $0.9595 | 4.05% |
| 12 rows, High | $0.9517 | 4.83% |

These values can be reproduced by running the following in any JavaScript environment:

```javascript
function C(n, k) {
  let r = 1;
  for (let i = 0; i < k; i++) { r *= (n - i); r /= (i + 1); }
  return r;
}

function ev(n, multipliers) {
  const total = 2 ** n;
  return multipliers.reduce((sum, m, k) => sum + (C(n, k) / total) * m, 0);
}

// Example: 8 rows, low risk
ev(8, [5.6, 2.1, 1.1, 1.0, 0.5, 1.0, 1.1, 2.1, 5.6]);
```

## Features

### Core Gameplay
- **Server-Authoritative Outcomes**: The server exclusively determines results via binomial sampling, making client-side manipulation impossible.
- **Pre-computed Paths**: Ball trajectories are physically simulated in advance (`npm run simulate`) and stored in `pathData.json`. The server selects a path that terminates at the assigned slot.
- **Client-Side Rendering**: 60fps HTML5 Canvas engine interpolates the server-sent keyframes for smooth visual playback.
- **Concurrent Bets**: Multiple balls can be dropped simultaneously. Risk and row controls are locked during active drops to prevent physics mismatches.

### Security
- **JWT Authentication**: Stateless token-based auth with mandatory `JWT_SECRET` (server refuses to start without it).
- **Rate Limiting**: In-memory rate limiter on `/api/auth/login` (10 attempts per IP per 15-minute window).
- **Input Validation**: Username restricted to 3-20 alphanumeric characters. Password 6-128 characters. Bet amount capped between $0.01 and $10,000.
- **Atomic Transactions**: The entire bet flow (balance check, deduction, payout credit, bet record) executes inside a single Prisma `$transaction`. If any step fails, the entire operation rolls back.

### Game Configuration
- **Risk Levels**: Low, Medium, High (affects multiplier table only, not landing probabilities).
- **Row Options**: 8 or 12 rows, dynamically resizing the canvas.
- **Bet Controls**: Half, Double, and Max buttons with floating-point precision handling.

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL instance
- npm

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Divyang73/Plinko-Game.git
   cd Plinko-Game
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env` file in the project root:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/plinko"
   JWT_SECRET="your_secure_random_string"
   ```

4. **Initialize database schema:**
   ```bash
   npx prisma db push
   ```

5. **Generate physics paths (required before first run):**
   ```bash
   npm run simulate
   ```

### Running Locally

Start the backend and frontend in separate terminals:

```bash
# Terminal 1: Express API on port 3000
npm run server

# Terminal 2: Vite dev server on port 5173
npm run dev
```

Access the application at `http://localhost:5173`.

### Performance

Tested locally with k6 on Apple M-series / 16GB RAM:
| Metric | Result |
|---|---|
| Concurrent users | 100 |
| Avg response time | ~6.7ms |
| p95 response time | ~28.4ms |
| Requests/sec | ~910 |
| Error rate | 0% |

*(local benchmark)*

### Deployment (Render)

Use the following configuration for a single-service deployment:

| Setting | Value |
|:---|:---|
| Build Command | `npm install --include=dev && npx prisma db push --accept-data-loss && npm run build && npm run simulate` |
| Start Command | `npm run server` |
| Environment Variables | `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production` |

The Express server automatically serves the compiled frontend from `dist/` when it exists.

## Project Structure

```
server/
  auth.ts           JWT auth, rate limiting, input validation
  gameLogic.ts      Binomial distribution, multiplier tables, slot selection
  index.ts          Express routes, Prisma transactions, static serving
  simulate.ts       Physics simulation script (generates pathData.json)
  pathData.json     Pre-computed ball trajectories (git-ignored, ~60MB)

src/
  App.tsx           Root component, auth state, layout
  main.tsx          React entry point
  index.css         Global styles (dark theme)
  classes/
    Ball.ts         Ball animation, trail rendering, fade-out
  components/
    AuthModal.tsx   Login/Register modal
    BetControls.tsx Bet amount, risk, rows, autoplay controls
    GameCanvas.tsx  Canvas rendering, peg layout, sink animations
  hooks/
    useGame.ts      Game state management, API calls
  types/
    index.ts        Shared TypeScript interfaces

prisma/
  schema.prisma     Database schema (users, bets)
```

## API Reference

### POST /api/auth/register
Registers a new user account with an initial balance of $1,000.
- **Request**: `{ "username": "player1", "password": "securepass" }`
- **Response**: `{ "token": "jwt...", "username": "player1", "balance": 1000 }`
- **Validation**: Username 3-20 chars, alphanumeric/underscore only. Password 6-128 chars.

### POST /api/auth/login
Authenticates a user and returns a signed JWT.
- **Request**: `{ "username": "player1", "password": "securepass" }`
- **Response**: `{ "token": "jwt...", "username": "player1", "balance": 985.50 }`
- **Rate Limit**: 10 attempts per IP per 15-minute window. Returns `429` when exceeded.

### GET /api/user/balance
Returns the authenticated user's current balance and username.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ "balance": 985.50, "username": "player1" }`

### POST /api/bet
Places a bet within an atomic database transaction.
- **Headers**: `Authorization: Bearer <token>`
- **Request**: `{ "betAmount": 10, "risk": "low", "rows": 8 }`
- **Response**: `{ "slotIndex": 2, "multiplier": 1.1, "payout": 11, "animationPath": [...], "startX": 300 }`
- **Limits**: Minimum $0.01, maximum $10,000. Returns `400` for out-of-range values.

### GET /api/health
Returns server status and whether path data is loaded.
- **Response**: `{ "status": "ok", "pathDataLoaded": true }`

## Troubleshooting

| Problem | Cause | Solution |
|:---|:---|:---|
| Server crashes on startup | `JWT_SECRET` not set in `.env` | Add `JWT_SECRET` to your `.env` file. The server intentionally refuses to start without it. |
| `pathData.json not found` warning | `npm run simulate` was not executed | Run `npm run simulate` before starting the server. This generates the ~60MB physics data file. |
| Ball drops straight down | Path data missing for that slot/row combination | Re-run `npm run simulate` to regenerate all paths. |
| `400 Bad Request` on bet | Bet amount exceeds balance or limits | Ensure bet is between $0.01 and $10,000 and does not exceed your current balance. |
| Blank page after login | Balance returned as string from database | Ensure `Number()` conversion is applied. This is handled in the current codebase. |
| `429 Too Many Requests` on login | Rate limiter triggered | Wait 15 minutes or restart the server to reset the in-memory rate limiter. |
| Build fails on deployment | Dev dependencies not installed | Use `npm install --include=dev` in the build command to ensure TypeScript and type definitions are available. |
| `PORT already declared` error | Duplicate `const PORT` in server code | Ensure only one `PORT` declaration exists at the top of `server/index.ts`. |

## Technologies

| Layer | Stack |
|:---|:---|
| Frontend | React 18, TypeScript, Vite, HTML5 Canvas |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL, Prisma ORM |
| Authentication | JSON Web Tokens (jsonwebtoken, bcryptjs) |
| Physics | Custom simulation engine (server/simulate.ts) |
| Rendering | requestAnimationFrame, Canvas 2D API |
