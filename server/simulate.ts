import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Integer physics constants (×1000 scale)
const HORIZONTAL_SPACING = 40000; // 40

interface SimulationResult {
  startX: number;
  slotIndex: number;
  path: number[]; // 0 for left, 1 for right
}

// Generate a valid path that hits exactly 'rows' pegs and lands in targetSlot
function generateValidPath(rows: number, targetSlot: number): number[] {
  const path: number[] = [];
  let remainingRights = targetSlot;
  let remainingLefts = rows - targetSlot;
  
  for (let i = 0; i < rows; i++) {
    const total = remainingRights + remainingLefts;
    if (total === 0) break;
    
    const goRight = Math.random() < (remainingRights / total);
    
    if (goRight && remainingRights > 0) {
      path.push(1);
      remainingRights--;
    } else {
      path.push(0);
      remainingLefts--;
    }
  }
  
  return path;
}

// Validate that a path leads to the correct slot
function validatePath(path: number[], targetSlot: number, rows: number): boolean {
  if (path.length !== rows) return false;
  
  const pathSum = path.reduce((sum, d) => sum + d, 0);
  return pathSum === targetSlot;
}

// Calculate starting X position that will hit the first peg
function calculateStartX(rows: number, canvasWidth: number, targetSlot: number, pathIndex: number): number {
  const centerX = (canvasWidth * 1000) / 2;
  
  // First row has 2 pegs at positions -HORIZONTAL_SPACING/2 and +HORIZONTAL_SPACING/2 from center
  // To hit a peg, start slightly offset from center
  // Use targetSlot to add variety
  const normalizedTarget = (targetSlot / rows) - 0.5; // -0.5 to 0.5
  const startOffset = normalizedTarget * HORIZONTAL_SPACING * 0.8 + (pathIndex % 100) * 100;
  
  return Math.round(centerX + startOffset);
}

// Run simulation for all possible slots
function runSimulation(rows: number, canvasWidth: number = 600): Map<number, SimulationResult[]> {
  console.log(`Running simulation for ${rows} rows...`);
  
  const slotMap = new Map<number, SimulationResult[]>();
  const slotCount = rows + 1;
  const pathsPerSlot = 500; // Generate 500 valid paths per slot
  
  for (let slotIndex = 0; slotIndex < slotCount; slotIndex++) {
    const paths: SimulationResult[] = [];
    
    let attempts = 0;
    const maxAttempts = pathsPerSlot * 10; // Allow up to 10x attempts
    
    while (paths.length < pathsPerSlot && attempts < maxAttempts) {
      attempts++;
      
      // Generate a valid path
      const path = generateValidPath(rows, slotIndex);
      
      // Validate it
      if (validatePath(path, slotIndex, rows)) {
        // Calculate starting position
        const startX = calculateStartX(rows, canvasWidth, slotIndex, paths.length);
        
        paths.push({
          startX,
          slotIndex,
          path
        });
      }
    }
    
    if (paths.length > 0) {
      slotMap.set(slotIndex, paths);
      console.log(`  Slot ${slotIndex}: Generated ${paths.length} valid paths`);
    } else {
      console.warn(`  Slot ${slotIndex}: WARNING - Failed to generate valid paths`);
    }
  }
  
  console.log(`Simulation complete. Generated paths for ${slotMap.size} slots.`);
  return slotMap;
}

// Main execution
console.log('Starting Plinko path pre-computation...');

const simulations = {
  8: runSimulation(8),
  12: runSimulation(12)
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
