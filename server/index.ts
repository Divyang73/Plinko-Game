import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { selectSlot, getMultiplier } from './gameLogic.js';
import type { BetRequest, BetResponse, PathPoint } from '../src/types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Load pre-computed path data
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', pathDataLoaded: Object.keys(pathData).length > 0 });
});

// Bet endpoint
app.post('/api/bet', (req, res) => {
  try {
    const { betAmount, risk, rows }: BetRequest = req.body;
    
    // Validate input
    if (typeof betAmount !== 'number' || betAmount <= 0) {
      return res.status(400).json({ error: 'Invalid bet amount' });
    }
    
    if (!['low', 'medium', 'high'].includes(risk)) {
      return res.status(400).json({ error: 'Invalid risk level' });
    }
    
    if (![8, 12].includes(rows)) {
      return res.status(400).json({ error: 'Invalid row count' });
    }
    
    // Select slot based on binomial distribution
    const slotIndex = selectSlot(rows, risk);
    const multiplier = getMultiplier(rows, risk, slotIndex);
    
    // Get a random pre-computed path that lands in this slot
    const rowPaths = pathData[rows.toString()];
    const slotPaths = rowPaths ? rowPaths[slotIndex] : null;
    
    let animationPath: PathPoint[] = [];
    let startX = 300;
    
    if (slotPaths && slotPaths.length > 0) {
      const randomPath = slotPaths[Math.floor(Math.random() * slotPaths.length)];
      startX = randomPath.startX;
      animationPath = randomPath.points;
    } else {
      console.error(`No paths available for slot ${slotIndex}, rows ${rows}. Loaded ${Object.keys(rowPaths || {}).length} slots with paths.`);
      // Fallback: simple straight path (not ideal)
      animationPath = [
        { x: 300, y: 50, t: 0 },
        { x: 300, y: 500, t: 2000 }
      ];
    }
    
    const payout = betAmount * multiplier;
    
    const response: BetResponse = {
      slotIndex,
      multiplier,
      payout,
      animationPath,
      startX
    };
    
    res.json(response);
  } catch (error) {
    console.error('Bet error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('API endpoints:');
  console.log(`  GET  /api/health`);
  console.log(`  POST /api/bet`);
});
