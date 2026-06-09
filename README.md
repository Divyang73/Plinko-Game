# 🎮 Plinko Game - Enhanced Casino Experience

A fully functional, production-ready Plinko game with casino-grade animations, dual gameplay modes, and advanced visual effects. Built with React, TypeScript, and Node.js.

![Plinko Game](https://github.com/user-attachments/assets/15fdeed5-11fc-4ba9-943e-d1fc2d8a1ea1)

## ✨ Features

### Gameplay Modes
- **Stars ON Mode**: Radiant stars with 5% chance per slot to collect bonus, cinematic animations, and RTP-adjusted multipliers
- **Classic Mode**: Clean casino style, fast multi-bets, no stars - pure Plinko action
- **Mode Selection**: Choose your experience on startup or switch anytime for a different vibe
- **Near-Miss Psychology**: Engaging gameplay mechanics that enhance player experience

### Core Gameplay
- **Deterministic Backend**: Server decides outcomes using binomial distribution with house edge
- **Integer Physics Engine**: ×1000 scale factor for consistent cross-device behavior
- **Pre-computed Paths**: Ball trajectories calculated in advance for guaranteed outcomes
- **60fps Canvas Rendering**: Smooth animations with requestAnimationFrame

### Game Configuration
- **3 Risk Levels**: Low (🟢 Green), Medium (🟡 Yellow), High (🔴 Red)
- **2 Row Options**: 8 or 12 rows
- **Accurate Multipliers**: Professional multiplier tables with house edge balancing
- **Bet Controls**: Half, Double, and Max buttons for quick betting

### Visual Design & Effects
- **Loading Screen**: Welcome animation with fuzzy text effects and progress bar
- **Wins Queue**: Live display of recent wins with color-coded multiplier tiers (blue → epic)
- **Shiny Text**: Animated gradient text for headers and branding
- **Fuzzy Text**: Dynamic text distortion effects for emphasis
- **Dark Theme**: Professional casino color scheme (#0f212e background)
- **Dynamic Ball Colors**: Changes based on selected risk level
- **Glowing Effects**: Ball trails and glow effects for visual polish
- **Multiplier Pulse**: Winning slots pulse and highlight on ball landing
- **Win Display**: Color-coded boxes showing recent wins with multiplier tiers

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
│   ├── gameLogic.ts      # Binomial distribution, multiplier logic & star bonus system
│   ├── simulate.ts       # Pre-computation script for ball paths
│   └── pathData.json     # Generated path data (git-ignored)
├── src/
│   ├── main.tsx          # React entry point
│   ├── App.tsx           # Main application component with mode selection
│   ├── index.css         # TailwindCSS styles with custom animations
│   ├── classes/
│   │   └── Ball.ts       # Integer physics ball class
│   ├── components/
│   │   ├── GameCanvas.tsx      # Canvas rendering & animation
│   │   ├── BetControls.tsx     # Betting UI controls
│   │   ├── GameplayMode.tsx    # Mode selection dialog (Stars ON/Classic)
│   │   ├── WinsQueue.tsx       # Recent wins display with color tiers
│   │   ├── LoadingScreen.tsx   # Welcome screen with progress animation
│   │   ├── ShinyText.tsx       # Animated gradient text effect
│   │   └── FuzzyText.tsx       # Dynamic text distortion effect
│   ├── hooks/
│   │   └── useGame.ts         # Game state management with star bonus
│   └── types/
│       └── index.ts           # TypeScript type definitions
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## 🎯 Technical Implementation

### Dual Gameplay Modes
The game offers two distinct experiences:

**Stars ON Mode:**
- 5% chance per slot to collect a star bonus
- Star bonus multiplier: 0.5x of bet amount
- All multipliers are RTP-adjusted by factor of `1 - (0.05 * 0.5) = 0.975`
- Cinematic animations and radiant visual effects
- Enhanced engagement through bonus collection mechanics

**Classic Mode:**
- Pure Plinko gameplay without stars
- Standard multipliers without RTP adjustment
- Fast multi-bet capability for experienced players
- Clean casino aesthetic

### Deterministic System
The backend determines the outcome before the ball drops:
1. Client places bet with risk level, row count, and gameplay mode
2. Server selects slot using binomial distribution with house edge
3. Server generates star bonus (if Stars ON mode is enabled)
4. Server looks up pre-computed path for that slot
5. Server returns: `{ slotIndex, multiplier, payout, animationPath, startX, star }`
6. Client animates ball following the predetermined path
7. Client displays star collection if applicable

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

**Note:** When Stars ON mode is enabled, all multipliers are adjusted by a factor of 0.975 to maintain balanced RTP while accounting for the 5% chance per slot of collecting a star bonus.

## 🔧 API Documentation

### POST /api/bet

Place a bet and receive ball drop instructions.

**Request:**
```json
{
  "betAmount": 10,
  "risk": "low",
  "rows": 8,
  "playWithStars": true
}
```

**Response:**
```json
{
  "slotIndex": 0,
  "multiplier": 5.46,
  "payout": 54.6,
  "animationPath": [
    { "x": 300000, "y": 0, "t": 0 },
    { "x": 295000, "y": 50000, "t": 100 }
  ],
  "startX": 300000,
  "star": {
    "x": 300000,
    "y": 150000,
    "collected": false,
    "bonusAmount": 5
  }
}
```

- `slotIndex`: Final slot (0-indexed)
- `multiplier`: Winning multiplier (RTP-adjusted if Stars ON)
- `payout`: Total payout amount
- `animationPath`: Array of {x, y, t} points for smooth ball animation
- `startX`: Starting X position (×1000 scale)
- `star`: Star bonus data (position, collection status, bonus amount)

### GET /api/health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "pathDataLoaded": true
}
```

## 🎨 Visual Features

### Color-Coded Multiplier Tiers
The wins queue displays recent wins with dynamic color coding:
- **Blue** (`< 1x`): Low multiplier
- **Light Blue** (`1x - 2x`): Break-even to small win
- **Green** (`2x - 5x`): Good win
- **Yellow** (`5x - 10x`): Great win
- **Orange** (`10x - 25x`): Excellent win
- **Red** (`25x - 100x`): Amazing win
- **Epic** (`100x+`): Legendary win

### Text Effects
- **ShinyText**: Animated linear gradient effect that moves across text
- **FuzzyText**: Dynamic distortion effect with customizable intensity
- Used throughout the UI for enhanced visual appeal and player engagement

## 🛠️ Development

### Build for Production
```bash
npm run build
```

### Technologies Used
- **Frontend**: React 18, TypeScript, Vite, TailwindCSS
- **Backend**: Node.js, Express, TypeScript
- **Physics**: Custom integer-based physics engine (×1000 scale)
- **Graphics**: HTML5 Canvas API with 60fps rendering
- **Effects**: Custom ShinyText and FuzzyText components
- **State Management**: React Hooks (useState, useEffect, custom hooks)

## 📝 License

MIT License - feel free to use this project for learning or commercial purposes.

## 🙏 Acknowledgments

This project demonstrates advanced web game development techniques including deterministic gameplay, client-server architecture, dual gameplay modes, and casino-grade visual effects. Built as an educational recreation showcasing professional game development patterns and engaging user experience design.
