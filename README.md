# 🎮 Plinko Game - Stake Replica

A fully functional, production-ready replica of the "Stake Plinko" game built with React, TypeScript, and Node.js.

![Plinko Game](https://github.com/user-attachments/assets/15fdeed5-11fc-4ba9-943e-d1fc2d8a1ea1)

## ✨ Features

### Core Gameplay
- **Deterministic Backend**: Server decides outcomes using binomial distribution
- **Integer Physics Engine**: ×1000 scale factor for consistent cross-device behavior
- **Pre-computed Paths**: Ball trajectories calculated in advance for guaranteed outcomes
- **60fps Canvas Rendering**: Smooth animations with requestAnimationFrame

### Game Configuration
- **3 Risk Levels**: Low (🟢 Green), Medium (🟡 Yellow), High (🔴 Red)
- **3 Row Options**: 8, 12, or 16 rows
- **Stake-Accurate Multipliers**: Exact multiplier tables matching Stake's values
- **Bet Controls**: Half, Double, and Max buttons for quick betting

### Visual Design
- **Dark Theme**: Authentic Stake color scheme (#0f212e background)
- **Dynamic Ball Colors**: Changes based on selected risk level
- **Glowing Effects**: Ball trails and glow effects for visual polish
- **Multiplier Pulse**: Winning slots pulse and highlight on ball landing
- **Win Display**: Green-highlighted box showing last win and multiplier

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/Divyang73/Plinko.git
cd Plinko

# Install dependencies
npm install

# Generate pre-computed ball paths (required, run once)
npm run simulate
```

### Running the Application

**Terminal 1 - Backend Server:**
```bash
npm run server
```
Server starts on http://localhost:3000

**Terminal 2 - Frontend Development Server:**
```bash
npm run dev
```
Frontend starts on http://localhost:5173

**Visit:** http://localhost:5173 to play!

## 🏗️ Project Structure

```
├── server/
│   ├── index.ts          # Express server with /api/bet endpoint
│   ├── gameLogic.ts      # Binomial distribution & multiplier logic
│   ├── simulate.ts       # Pre-computation script for ball paths
│   └── pathData.json     # Generated path data (git-ignored)
├── src/
│   ├── main.tsx          # React entry point
│   ├── App.tsx           # Main application component
│   ├── index.css         # TailwindCSS styles
│   ├── classes/
│   │   └── Ball.ts       # Integer physics ball class
│   ├── components/
│   │   ├── GameCanvas.tsx     # Canvas rendering & animation
│   │   └── BetControls.tsx    # Betting UI controls
│   ├── hooks/
│   │   └── useGame.ts         # Game state management
│   └── types/
│       └── index.ts           # TypeScript type definitions
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## 🎯 Technical Implementation

### Deterministic System
The backend determines the outcome before the ball drops:
1. Client places bet with risk level and row count
2. Server selects slot using binomial distribution with house edge
3. Server looks up pre-computed path for that slot
4. Server returns: `{ point, multiplier, slotIndex, path, payout }`
5. Client animates ball following the predetermined path

### Integer Physics (×1000 Scale)
All physics calculations use integers multiplied by 1000:
- `gravity = 2000` (instead of 2.0)
- `position.x = 300000` (instead of 300.0)
- Division by 1000 only happens during canvas rendering

This guarantees identical physics across all devices and browsers.

### Pre-computation Script
Run `npm run simulate` to generate path data:
- Drops balls from X=-searchRange to X=+searchRange in small increments
- Records which slot each starting position lands in
- Saves mapping of slots to valid starting positions
- Backend uses this data to select paths that lead to desired outcomes

## 📊 Multiplier Tables

### 8 Rows
- **Low**: 5.6, 2.1, 1.1, 1.0, 0.5, 1.0, 1.1, 2.1, 5.6
- **Medium**: 13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13
- **High**: 29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29

### 12 Rows
- **Low**: 10, 3, 1.6, 1.4, 1.1, 1.0, 0.5, 1.0, 1.1, 1.4, 1.6, 3, 10
- **Medium**: 33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33
- **High**: 170, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8.1, 24, 170

### 16 Rows
- **Low**: 16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1.0, 0.5, 1.0, 1.1, 1.2, 1.4, 1.4, 2, 9, 16
- **Medium**: 110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110
- **High**: 1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000

## 🔧 API Documentation

### POST /api/bet

Place a bet and receive ball drop instructions.

**Request:**
```json
{
  "betAmount": 10,
  "risk": "low",
  "rows": 8
}
```

**Response:**
```json
{
  "point": 300000,
  "multiplier": 5.6,
  "slotIndex": 0,
  "path": [-1, 1, -1, 1, -1, 1, -1, 1],
  "payout": 56
}
```

- `point`: Starting X position (×1000 scale)
- `multiplier`: Winning multiplier
- `slotIndex`: Final slot (0-indexed)
- `path`: Bounce directions (-1 = left, 1 = right)
- `payout`: Total payout amount

### GET /api/health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "pathDataLoaded": true
}
```

## 🛠️ Development

### Build for Production
```bash
npm run build
```

### Technologies Used
- **Frontend**: React 18, TypeScript, Vite, TailwindCSS
- **Backend**: Node.js, Express, TypeScript
- **Physics**: Custom integer-based physics engine
- **Graphics**: HTML5 Canvas API

## 📝 License

MIT License - feel free to use this project for learning or commercial purposes.

## 🙏 Acknowledgments

Inspired by the original Stake Plinko game. This is an educational recreation demonstrating deterministic game mechanics and client-server architecture.
