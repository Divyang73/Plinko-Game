import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Physics constants matching the visual game
const GRAVITY = 0.5;
const BOUNCE_DAMPING = 0.7;
const HORIZONTAL_DAMPING = 0.99;

interface PathPoint {
  x: number;
  y: number;
  t: number;  // Time in ms
}

interface SimulatedPath {
  startX: number;
  points: PathPoint[];
  landedSlot: number;
}

// Simulate a single ball drop with REAL physics
function simulateBallDrop(startX: number, rows: number, canvasWidth: number): SimulatedPath {
  const points: PathPoint[] = [];
  
  // Ball state
  let x = startX;
  let y = 50;  // Start Y
  let vx = 0;
  let vy = 0;
  let t = 0;
  
  const FIRST_ROW_Y = 100;
  const ROW_SPACING = 40;
  const PIN_RADIUS = 10;
  const BALL_RADIUS = 8;
  const CENTER_X = canvasWidth / 2;
  
  // Generate pin positions
  const pins: Array<{x: number, y: number, row: number}> = [];
  for (let row = 0; row < rows; row++) {
    const pinsInRow = row + 2;
    const rowWidth = (pinsInRow - 1) * 40;
    const startPinX = CENTER_X - rowWidth / 2;
    const pinY = FIRST_ROW_Y + row * ROW_SPACING;
    
    for (let col = 0; col < pinsInRow; col++) {
      pins.push({
        x: startPinX + col * 40,
        y: pinY,
        row
      });
    }
  }
  
  // Sink Y position
  const sinkY = FIRST_ROW_Y + rows * ROW_SPACING + 20;
  
  // Record initial position
  points.push({ x, y, t: 0 });
  
  // Simulate until ball reaches sink
  const dt = 16;  // ~60fps
  const maxTime = 10000;  // 10 second max
  
  while (y < sinkY && t < maxTime) {
    // Apply gravity
    vy += GRAVITY;
    
    // Update position
    x += vx;
    y += vy;
    
    // Apply horizontal damping
    vx *= HORIZONTAL_DAMPING;
    
    // Check collision with pins
    for (const pin of pins) {
      const dx = x - pin.x;
      const dy = y - pin.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = PIN_RADIUS + BALL_RADIUS;
      
      if (dist < minDist && dist > 0) {
        // Collision! Push ball out
        const overlap = minDist - dist;
        const nx = dx / dist;
        const ny = dy / dist;
        
        x += nx * overlap;
        y += ny * overlap;
        
        // Reflect velocity
        const dotProduct = vx * nx + vy * ny;
        vx = (vx - 2 * dotProduct * nx) * BOUNCE_DAMPING;
        vy = (vy - 2 * dotProduct * ny) * BOUNCE_DAMPING;
        
        // Add slight randomness (THIS IS KEY FOR NATURAL LOOK!)
        vx += (Math.random() - 0.5) * 2;
        vy += (Math.random() - 0.5) * 0.5;
        
        // Record collision point
        points.push({ x, y, t });
        
        break;
      }
    }
    
    // Keep ball in bounds
    const leftBound = CENTER_X - (rows + 1) * 20;
    const rightBound = CENTER_X + (rows + 1) * 20;
    if (x < leftBound) {
      x = leftBound;
      vx = Math.abs(vx) * BOUNCE_DAMPING;
    }
    if (x > rightBound) {
      x = rightBound;
      vx = -Math.abs(vx) * BOUNCE_DAMPING;
    }
    
    t += dt;
    
    // Record position every 50ms for smooth animation
    if (t % 50 === 0) {
      points.push({ x, y, t });
    }
  }
  
  // Record final position
  points.push({ x, y: sinkY, t });
  
  // Calculate which slot ball landed in
  const slotWidth = 40;
  const totalSlots = rows + 1;
  const slotsStartX = CENTER_X - (totalSlots * slotWidth) / 2 + slotWidth / 2;
  const landedSlot = Math.round((x - slotsStartX) / slotWidth);
  const clampedSlot = Math.max(0, Math.min(rows, landedSlot));
  
  return {
    startX,
    points,
    landedSlot: clampedSlot
  };
}

// Main simulation: Generate paths for all slots
function generateAllPaths(rows: number, pathsPerSlot: number = 100): Record<number, SimulatedPath[]> {
  const pathsBySlot: Record<number, SimulatedPath[]> = {};
  const canvasWidth = 600;
  const centerX = canvasWidth / 2;
  
  // Initialize slots
  for (let slot = 0; slot <= rows; slot++) {
    pathsBySlot[slot] = [];
  }
  
  console.log(`Generating paths for ${rows} rows...`);
  
  // Keep simulating until we have enough paths for each slot
  let attempts = 0;
  const maxAttempts = pathsPerSlot * (rows + 1) * 20;  // Generous limit
  
  while (attempts < maxAttempts) {
    // Random start position near center (slight variation)
    const startX = centerX + (Math.random() - 0.5) * 60;
    
    const result = simulateBallDrop(startX, rows, canvasWidth);
    const slot = result.landedSlot;
    
    // Add if we need more paths for this slot
    if (pathsBySlot[slot].length < pathsPerSlot) {
      pathsBySlot[slot].push(result);
    }
    
    attempts++;
    
    // Check if all slots have enough
    const allFull = Object.values(pathsBySlot).every(paths => paths.length >= pathsPerSlot);
    if (allFull) break;
  }
  
  // Log stats
  for (let slot = 0; slot <= rows; slot++) {
    console.log(`  Slot ${slot}: ${pathsBySlot[slot].length} paths`);
  }
  
  return pathsBySlot;
}

// Run simulation for 8 and 12 rows
const pathData: Record<string, Record<number, SimulatedPath[]>> = {};

pathData['8'] = generateAllPaths(8, 200);
pathData['12'] = generateAllPaths(12, 200);

// Save to file
const outputPath = path.join(__dirname, 'pathData.json');
fs.writeFileSync(outputPath, JSON.stringify(pathData, null, 2));
console.log(`Saved path data to ${outputPath}`);
