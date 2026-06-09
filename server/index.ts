import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { selectSlot, getMultiplier } from './gameLogic.js';
import type { BetRequest, BetResponse, PathPoint } from '../src/types/index.js';
import { registerUser, loginUser, requireAuth } from './auth.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

interface SimulatedPath {
  startX: number;
  points: PathPoint[];
  landedSlot: number;
}

let pathData: Record<string, Record<number, SimulatedPath[]>> = {};

try {
  const pathDataPath = path.join(__dirname, 'pathData.json');
  if (fs.existsSync(pathDataPath)) {
    pathData = JSON.parse(fs.readFileSync(pathDataPath, 'utf-8'));
    console.log('Loaded pre-computed path data');
  } else {
    console.warn('Warning: pathData.json not found. Run "npm run simulate" first.');
  }
} catch (error) {
  console.error('Error loading path data:', error);
}

app.post('/api/auth/register', registerUser);
app.post('/api/auth/login', loginUser);

app.get('/api/user/balance', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ balance: user.balance, username: user.username });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', pathDataLoaded: Object.keys(pathData).length > 0 });
});

app.post('/api/bet', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { betAmount, risk, rows }: BetRequest = req.body;
    
    if (typeof betAmount !== 'number' || betAmount <= 0) {
      return res.status(400).json({ error: 'Invalid bet amount' });
    }
    
    if (!['low', 'medium', 'high'].includes(risk)) {
      return res.status(400).json({ error: 'Invalid risk level' });
    }
    
    if (![8, 12].includes(rows)) {
      return res.status(400).json({ error: 'Invalid row count' });
    }

    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user || user.balance < betAmount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Deduct bet amount
    await prisma.users.update({
      where: { id: userId },
      data: { balance: { decrement: betAmount } }
    });
    
    const slotIndex = selectSlot(rows, risk);
    const multiplier = getMultiplier(rows, risk, slotIndex);
    
    const rowPaths = pathData[rows.toString()];
    const slotPaths = rowPaths ? rowPaths[slotIndex] : null;
    
    let animationPath: PathPoint[] = [];
    let startX = 300;
    
    if (slotPaths && slotPaths.length > 0) {
      const randomPath = slotPaths[Math.floor(Math.random() * slotPaths.length)];
      startX = randomPath.startX;
      animationPath = randomPath.points;
    } else {
      console.error(`No paths available for slot ${slotIndex}, rows ${rows}.`);
      animationPath = [
        { x: 300, y: 50, t: 0 },
        { x: 300, y: 500, t: 2000 }
      ];
    }
    
    const payout = betAmount * multiplier;

    // Credit payout and record bet
    await prisma.$transaction([
      prisma.users.update({
        where: { id: userId },
        data: { balance: { increment: payout } }
      }),
      prisma.bets.create({
        data: {
          user_id: userId,
          bet_amount: betAmount,
          multiplier: multiplier,
          payout: payout,
          risk: risk,
          rows: rows
        }
      })
    ]);
    
    const response: BetResponse = {
      slotIndex,
      multiplier,
      payout,
      animationPath,
      startX,
      star: undefined // Removing star logic
    };
    
    res.json(response);
  } catch (error) {
    console.error('Bet error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve frontend static files in production
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  console.log('Frontend dist folder not found. API running in dev mode.');
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});