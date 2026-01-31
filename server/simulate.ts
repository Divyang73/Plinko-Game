import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GRAVITY = 0.5;
const BOUNCE_DAMPING = 0.7;
const HORIZONTAL_DAMPING = 0.99;

const STAR_COLLECT_RADIUS = 18;
const STAR_COLLECT_RATE = 0.05;
const STAR_MISS_OFFSET_MIN = STAR_COLLECT_RADIUS + 8;
const STAR_MISS_OFFSET_MAX = STAR_COLLECT_RADIUS + 18;

interface PathPoint {
  x: number;
  y: number;
  t: number;
}

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

function minDistance(points: PathPoint[], x: number, y: number): number {
  let min = Infinity;
  for (const point of points) {
    const dist = Math.hypot(point.x - x, point.y - y);
    if (dist < min) min = dist;
  }
  return min;
}

function closestPoint(points: PathPoint[], x: number, y: number): PathPoint {
  let min = Infinity;
  let closest = points[0];
  for (const point of points) {
    const dist = Math.hypot(point.x - x, point.y - y);
    if (dist < min) {
      min = dist;
      closest = point;
    }
  }
  return closest;
}

function clampStarX(x: number, rows: number, canvasWidth: number): number {
  const centerX = canvasWidth / 2;
  const leftBound = centerX - (rows + 1) * 20;
  const rightBound = centerX + (rows + 1) * 20;
  return Math.max(leftBound + 10, Math.min(rightBound - 10, x));
}

function pickStarBasePoint(points: PathPoint[], rows: number): { x: number; y: number } {
  const FIRST_ROW_Y = 100;
  const ROW_SPACING = 40;
  const targetRow = Math.max(1, Math.floor(rows / 2));
  const targetY = FIRST_ROW_Y + targetRow * ROW_SPACING - ROW_SPACING / 2;
  
  let closest = points[0];
  let min = Infinity;
  points.forEach(point => {
    const dist = Math.abs(point.y - targetY);
    if (dist < min) {
      min = dist;
      closest = point;
    }
  });
  
  return { x: closest.x, y: closest.y };
}

function assignStars(paths: SimulatedPath[], rows: number, canvasWidth: number): void {
  const collectibleCount = Math.max(1, Math.round(paths.length * STAR_COLLECT_RATE));
  const indices = Array.from({ length: paths.length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const swap = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[swap]] = [indices[swap], indices[i]];
  }
  const collectibleSet = new Set(indices.slice(0, collectibleCount));
  
  paths.forEach((path, index) => {
    const base = pickStarBasePoint(path.points, rows);
    let starX = base.x;
    let starY = base.y;
    const collected = collectibleSet.has(index);
    
    if (!collected) {
      const offset = STAR_MISS_OFFSET_MIN + Math.random() * (STAR_MISS_OFFSET_MAX - STAR_MISS_OFFSET_MIN);
      const direction = Math.random() < 0.5 ? -1 : 1;
      starX = clampStarX(base.x + direction * offset, rows, canvasWidth);
    }
    
    let dist = minDistance(path.points, starX, starY);
    if (collected && dist > STAR_COLLECT_RADIUS) {
      const closest = closestPoint(path.points, starX, starY);
      starX = closest.x;
      starY = closest.y;
    }
    
    if (!collected && dist <= STAR_COLLECT_RADIUS) {
      const direction = Math.random() < 0.5 ? -1 : 1;
      starX = clampStarX(starX + direction * (STAR_COLLECT_RADIUS + 12), rows, canvasWidth);
      dist = minDistance(path.points, starX, starY);
      if (dist <= STAR_COLLECT_RADIUS) {
        starX = clampStarX(starX + direction * (STAR_COLLECT_RADIUS + 20), rows, canvasWidth);
      }
    }
    
    path.star = { x: starX, y: starY, collected };
  });
}

function simulateBallDrop(startX: number, rows: number, canvasWidth: number): SimulatedPath {
  const points: PathPoint[] = [];
  
  let x = startX;
  let y = 50;
  let vx = 0;
  let vy = 0;
  let t = 0;
  
  const FIRST_ROW_Y = 100;
  const ROW_SPACING = 40;
  const PIN_RADIUS = 10;
  const BALL_RADIUS = 8;
  const CENTER_X = canvasWidth / 2;
  
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
  
  const sinkY = FIRST_ROW_Y + rows * ROW_SPACING + 20;
  
  points.push({ x, y, t: 0 });
  
  const dt = 16;
  const maxTime = 10000;
  
  while (y < sinkY && t < maxTime) {
    vy += GRAVITY;
    
    x += vx;
    y += vy;
    
    vx *= HORIZONTAL_DAMPING;
    
    for (const pin of pins) {
      const dx = x - pin.x;
      const dy = y - pin.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = PIN_RADIUS + BALL_RADIUS;
      
      if (dist < minDist && dist > 0) {
        const overlap = minDist - dist;
        const nx = dx / dist;
        const ny = dy / dist;
        
        x += nx * overlap;
        y += ny * overlap;
        
        const dotProduct = vx * nx + vy * ny;
        vx = (vx - 2 * dotProduct * nx) * BOUNCE_DAMPING;
        vy = (vy - 2 * dotProduct * ny) * BOUNCE_DAMPING;
        
        vx += (Math.random() - 0.5) * 2;
        vy += (Math.random() - 0.5) * 0.5;
        
        points.push({ x, y, t });
        
        break;
      }
    }
    
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
    
    if (Math.abs(t % 50) < dt) {
      points.push({ x, y, t });
    }
  }
  
  points.push({ x, y: sinkY, t });
  
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

function generateAllPaths(rows: number, pathsPerSlot: number = 100): Record<number, SimulatedPath[]> {
  const pathsBySlot: Record<number, SimulatedPath[]> = {};
  const canvasWidth = 600;
  const centerX = canvasWidth / 2;
  
  for (let slot = 0; slot <= rows; slot++) {
    pathsBySlot[slot] = [];
  }
  
  console.log(`Generating paths for ${rows} rows...`);
  
  let attempts = 0;
  const maxAttempts = pathsPerSlot * (rows + 1) * 20;
  
  while (attempts < maxAttempts) {
    const startX = centerX + (Math.random() - 0.5) * 60;
    
    const result = simulateBallDrop(startX, rows, canvasWidth);
    const slot = result.landedSlot;
    
    if (pathsBySlot[slot].length < pathsPerSlot) {
      pathsBySlot[slot].push(result);
    }
    
    attempts++;
    
    const allFull = Object.values(pathsBySlot).every(paths => paths.length >= pathsPerSlot);
    if (allFull) break;
  }
  
  for (let slot = 0; slot <= rows; slot++) {
    assignStars(pathsBySlot[slot], rows, canvasWidth);
    console.log(`  Slot ${slot}: ${pathsBySlot[slot].length} paths`);
  }
  
  return pathsBySlot;
}

const pathData: Record<string, Record<number, SimulatedPath[]>> = {};

pathData['8'] = generateAllPaths(8, 200);
pathData['12'] = generateAllPaths(12, 200);

const outputPath = path.join(__dirname, 'pathData.json');
fs.writeFileSync(outputPath, JSON.stringify(pathData, null, 2));
console.log(`Saved path data to ${outputPath}`);