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
    
    if (![8, 12].includes(rows)) {
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
    
    // Generate a valid path: 0 = left, 1 = right
    // Rule: sum(path) = slotIndex
    if (path.length === 0 || path.length !== rows) {
      console.warn(`Generating fallback path for slot ${slotIndex}, rows ${rows}`);
      
      path = [];
      let remainingRights = slotIndex;
      let remainingLefts = rows - slotIndex;
      
      for (let i = 0; i < rows; i++) {
        const totalRemaining = remainingRights + remainingLefts;
        if (totalRemaining === 0) break;
        
        // Randomly decide, but ensure we use exactly the right number of each
        const goRight = Math.random() < (remainingRights / totalRemaining);
        
        if (goRight && remainingRights > 0) {
          path.push(1);
          remainingRights--;
        } else {
          path.push(0);
          remainingLefts--;
        }
      }
      
      point = 300000; // Center
    }
    
    // Validate: sum of path must equal slotIndex
    const pathSum = path.reduce((sum, d) => sum + d, 0);
    if (path.length !== rows || pathSum !== slotIndex) {
      console.error(`Path validation failed: length=${path.length}, sum=${pathSum}, expected slot=${slotIndex}`);
      
      // Force create correct path
      path = [];
      for (let i = 0; i < slotIndex; i++) path.push(1);
      for (let i = 0; i < rows - slotIndex; i++) path.push(0);
      
      // Shuffle for variety
      for (let i = path.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [path[i], path[j]] = [path[j], path[i]];
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
