import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { selectSlot, getMultiplier } from './gameLogic.js';
import type { BetRequest, BetResponse, RowCount, RiskLevel } from '../src/types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Load pre-computed path data
let pathData: Record<string, Array<{ slot: number; paths: Array<{ startX: number; slotIndex: number; path: number[] }> }>> = {};

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
    
    if (![8, 12, 16].includes(rows)) {
      return res.status(400).json({ error: 'Invalid row count' });
    }
    
    // Select slot based on binomial distribution
    const slotIndex = selectSlot(rows, risk);
    const multiplier = getMultiplier(rows, risk, slotIndex);
    
    // Get pre-computed path for this slot
    let point = 300000; // Default center (×1000)
    let path: number[] = [];
    
    const rowData = pathData[rows.toString()];
    if (rowData) {
      const slotData = rowData.find(s => s.slot === slotIndex);
      if (slotData && slotData.paths.length > 0) {
        // Select a random path that leads to this slot
        const randomPath = slotData.paths[Math.floor(Math.random() * slotData.paths.length)];
        point = randomPath.startX;
        path = randomPath.path;
      }
    }
    
    // If no pre-computed path found, generate a simple path based on slot position
    if (path.length === 0) {
      const middleSlot = rows / 2;
      const deviation = slotIndex - middleSlot;
      
      for (let i = 0; i < rows; i++) {
        if (i < Math.abs(deviation)) {
          path.push(deviation > 0 ? 1 : -1);
        } else {
          path.push(Math.random() < 0.5 ? -1 : 1);
        }
      }
    }
    
    const payout = betAmount * multiplier;
    
    const response: BetResponse = {
      point,
      multiplier,
      slotIndex,
      path,
      payout
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
