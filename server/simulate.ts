import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Integer physics constants (×1000 scale)
const GRAVITY = 2000;
const DAMPING = 950; // 0.95
const PIN_RADIUS = 10000; // 10
const BALL_RADIUS = 8000; // 8
const HORIZONTAL_SPACING = 40000; // 40
const VERTICAL_SPACING = 40000; // 40

interface SimulationResult {
  startX: number;
  slotIndex: number;
  path: number[]; // -1 for left, 1 for right
}

// Simulate a ball drop with integer physics
function simulateDrop(
  startX: number,
  rows: number,
  canvasWidth: number
): { slotIndex: number; path: number[] } {
  const centerX = (canvasWidth * 1000) / 2;
  
  // Ball state (all integers)
  let x = startX;
  let y = 50000; // Start from top
  let vx = 0;
  let vy = 0;
  
  const path: number[] = [];
  const pins = generatePins(rows, canvasWidth);
  const maxIterations = 10000;
  let iteration = 0;
  
  while (y < (rows + 2) * VERTICAL_SPACING && iteration < maxIterations) {
    iteration++;
    
    // Apply gravity
    vy += GRAVITY;
    
    // Update position
    x += vx;
    y += vy;
    
    // Apply damping
    vx = (vx * DAMPING) / 1000;
    vy = (vy * DAMPING) / 1000;
    
    // Check collision with pins
    for (let i = 0; i < pins.length; i++) {
      const pin = pins[i];
      const dx = x - pin.x;
      const dy = y - pin.y;
      const distance = Math.sqrt((dx * dx + dy * dy) / 1000000);
      const minDist = (PIN_RADIUS + BALL_RADIUS) / 1000;
      
      if (distance < minDist) {
        // Collision detected
        const angle = Math.atan2(dy / 1000, dx / 1000);
        const overlap = minDist - distance;
        
        // Push ball away from pin
        x += Math.cos(angle) * overlap * 1000;
        y += Math.sin(angle) * overlap * 1000;
        
        // Reflect velocity
        const speed = Math.sqrt((vx * vx + vy * vy) / 1000000);
        vx = Math.cos(angle) * speed * 1000;
        vy = Math.sin(angle) * speed * 1000;
        
        // Record bounce direction
        if (dx < 0) {
          path.push(-1); // Left
        } else {
          path.push(1); // Right
        }
        
        break;
      }
    }
    
    // Keep ball in bounds
    if (x < 0) x = 0;
    if (x > canvasWidth * 1000) x = canvasWidth * 1000;
  }
  
  // Calculate final slot
  const slotWidth = HORIZONTAL_SPACING;
  const slotIndex = Math.max(0, Math.min(rows, Math.floor((x - centerX + (rows * slotWidth) / 2) / slotWidth)));
  
  return { slotIndex, path };
}

// Generate pin positions
function generatePins(rows: number, canvasWidth: number): Array<{ x: number; y: number }> {
  const pins: Array<{ x: number; y: number }> = [];
  const centerX = (canvasWidth * 1000) / 2;
  
  for (let row = 0; row < rows; row++) {
    const pinsInRow = row + 2;
    const rowWidth = (pinsInRow - 1) * HORIZONTAL_SPACING;
    const startX = centerX - rowWidth / 2;
    const y = 100000 + row * VERTICAL_SPACING; // Start pins lower
    
    for (let col = 0; col < pinsInRow; col++) {
      pins.push({
        x: startX + col * HORIZONTAL_SPACING,
        y: y
      });
    }
  }
  
  return pins;
}

// Run simulation for all possible starting positions
function runSimulation(rows: number, canvasWidth: number = 600): Map<number, SimulationResult[]> {
  console.log(`Running simulation for ${rows} rows...`);
  
  const slotMap = new Map<number, SimulationResult[]>();
  const centerX = (canvasWidth * 1000) / 2;
  const searchRange = rows * HORIZONTAL_SPACING;
  const step = 1000; // 1 pixel increments
  
  for (let offsetX = -searchRange; offsetX <= searchRange; offsetX += step) {
    const startX = centerX + offsetX;
    const result = simulateDrop(startX, rows, canvasWidth);
    
    if (!slotMap.has(result.slotIndex)) {
      slotMap.set(result.slotIndex, []);
    }
    
    slotMap.get(result.slotIndex)!.push({
      startX,
      slotIndex: result.slotIndex,
      path: result.path
    });
  }
  
  console.log(`Simulation complete. Found paths for ${slotMap.size} slots.`);
  return slotMap;
}

// Main execution
console.log('Starting Plinko path pre-computation...');

const simulations = {
  8: runSimulation(8),
  12: runSimulation(12),
  16: runSimulation(16)
};

// Save results
const outputPath = path.join(__dirname, 'pathData.json');
const outputData: Record<string, Array<{ slot: number; paths: SimulationResult[] }>> = {};

for (const [rows, slotMap] of Object.entries(simulations)) {
  outputData[rows] = Array.from(slotMap.entries()).map(([slot, paths]) => ({
    slot,
    paths
  }));
}

fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
console.log(`Path data saved to ${outputPath}`);
console.log('Pre-computation complete!');
