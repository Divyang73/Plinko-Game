# Plinko Game

A functional, production-ready Plinko application built with React, TypeScript, Node.js, Express, Prisma, and PostgreSQL. It features a deterministic physics model, secure authentication, and a responsive interface.

![Plinko Game](readme_image.png)

## Features

### Core Gameplay
- **Deterministic Backend**: The server exclusively determines outcomes utilizing a binomial distribution model, ensuring client manipulation is impossible.
- **Pre-computed Paths**: Ball trajectories are simulated in advance to guarantee that the physics rendering perfectly matches the server-assigned outcome.
- **Client-Side Rendering**: 60fps HTML5 Canvas rendering engine interpolates the predetermined paths for smooth visual playback.
- **Simultaneous Bets**: The engine supports dropping multiple balls concurrently without performance degradation or logic interference.

### Game Configuration
- **Risk Levels**: Select between Low, Medium, and High risk profiles.
- **Row Configurations**: Choose between 8 or 12 rows, dynamically altering the canvas dimensions and multiplier distributions.
- **Accurate Multipliers**: Mathematically verified multiplier tables balanced with a standard house edge.

### Architecture & Security
- **PostgreSQL Database**: Relational database storage mapped via Prisma ORM for tracking user balances and bet histories.
- **Authentication**: Secure JWT-based authentication system for user registration, login, and protected API endpoints.
- **Stateless Betting**: Balance deductions and payout credits are handled securely on the server side within ACID-compliant transactions.

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL instance
- npm or yarn

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

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and add the following:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/plinko"
   JWT_SECRET="your_secure_random_string"
   ```

4. **Initialize Database:**
   ```bash
   npx prisma db push
   ```

5. **Generate Physics Paths (Required):**
   ```bash
   npm run simulate
   ```

### Running the Application

**Terminal 1 - Backend Server:**
```bash
npm run server
```
The Express API will initialize on `http://localhost:3000`.

**Terminal 2 - Frontend Development Server:**
```bash
npm run dev
```
The React frontend will initialize on `http://localhost:5173`. Access this URL in your browser to interact with the application.

## Multiplier Distributions

### 8 Rows
- **Low**: 5.6, 2.1, 1.1, 1.0, 0.5, 1.0, 1.1, 2.1, 5.6
- **Medium**: 13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13
- **High**: 29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29

### 12 Rows
- **Low**: 10, 3, 1.6, 1.4, 1.1, 1.0, 0.5, 1.0, 1.1, 1.4, 1.6, 3, 10
- **Medium**: 33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33
- **High**: 170, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8.1, 24, 170

## API Documentation

### POST /api/auth/register
Registers a new user and initializes their balance.
- **Payload**: `{ "username": "user1", "password": "password123" }`

### POST /api/auth/login
Authenticates a user and returns a JWT token.
- **Payload**: `{ "username": "user1", "password": "password123" }`

### GET /api/user/balance
Retrieves the authenticated user's current balance and username. Requires Authorization header.

### POST /api/bet
Places a bet, deducts the balance, generates the outcome, credits the payout, and returns the physical trajectory.
- **Payload**: `{ "betAmount": 10, "risk": "low", "rows": 8 }`
- **Response**: `{ slotIndex, multiplier, payout, animationPath, startX }`

## License

This project is licensed under the MIT License.
