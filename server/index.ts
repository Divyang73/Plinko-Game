import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { selectSlot, getMultiplier, STAR_BONUS_MULTIPLIER } from './gameLogic.js';
import type { BetRequest, BetResponse, PathPoint } from '../src/types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

interface StarInfo {
  x: number;
  y: number;
  collected: boolean;
}

interface SimulatedPath {
  startX: number;
  points: PathPoint[];
  landedSlot: number;
  star?: StarInfo;
}

let pathData: Record<string, Record<number, SimulatedPath[]>> = {};

const buildFallbackStar = (points: PathPoint[], rows: number): StarInfo => {
  const targetY = 100 + (rows * 0.5) * 40;
  let closest = points[0];
  let min = Infinity;
  points.forEach(point => {
    const dist = Math.abs(point.y - targetY);
    if (dist < min) {
      min = dist;
      closest = point;
    }
  });
  return {
    x: closest.x,
    y: closest.y,
    collected: Math.random() < 0.05
  };
};

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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', pathDataLoaded: Object.keys(pathData).length > 0 });
});

app.post('/api/bet', (req, res) => {
  try {
    const { betAmount, risk, rows, playWithStars }: BetRequest = req.body;
    
    if (typeof betAmount !== 'number' || betAmount <= 0) {
      return res.status(400).json({ error: 'Invalid bet amount' });
    }
    
    if (!['low', 'medium', 'high'].includes(risk)) {
      return res.status(400).json({ error: 'Invalid risk level' });
    }
    
    if (![8, 12].includes(rows)) {
      return res.status(400).json({ error: 'Invalid row count' });
    }
    
    const slotIndex = selectSlot(rows, risk, playWithStars);
    const multiplier = getMultiplier(rows, risk, slotIndex, playWithStars);
    
    const rowPaths = pathData[rows.toString()];
    const slotPaths = rowPaths ? rowPaths[slotIndex] : null;
    
    let animationPath: PathPoint[] = [];
    let startX = 300;
    let star: StarInfo | undefined;
    
    if (slotPaths && slotPaths.length > 0) {
      const randomPath = slotPaths[Math.floor(Math.random() * slotPaths.length)];
      startX = randomPath.startX;
      animationPath = randomPath.points;
      star = randomPath.star ?? buildFallbackStar(randomPath.points, rows);
    } else {
      console.error(`No paths available for slot ${slotIndex}, rows ${rows}. Loaded ${Object.keys(rowPaths || {}).length} slots with paths.`);
      animationPath = [
        { x: 300, y: 50, t: 0 },
        { x: 300, y: 500, t: 2000 }
      ];
      star = buildFallbackStar(animationPath, rows);
    }
    
    const starEnabled = Boolean(playWithStars);
    const collected = starEnabled ? star?.collected ?? false : false;
    const bonusAmount = collected ? betAmount * STAR_BONUS_MULTIPLIER : 0;
    const payout = betAmount * multiplier + bonusAmount;
    
    const response: BetResponse = {
      slotIndex,
      multiplier,
      payout,
      animationPath,
      startX,
      star: {
        x: star?.x ?? 300,
        y: star?.y ?? 300,
        collected,
        bonusAmount
      }
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