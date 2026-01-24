import type { RiskLevel, RowCount } from '../src/types/index.js';

// Multiplier tables matching Stake's exact values
export const MULTIPLIERS: Record<RowCount, Record<RiskLevel, number[]>> = {
  8: {
    low: [5.6, 2.1, 1.1, 1.0, 0.5, 1.0, 1.1, 2.1, 5.6],
    medium: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    high: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29]
  },
  12: {
    low: [10, 3, 1.6, 1.4, 1.1, 1.0, 0.5, 1.0, 1.1, 1.4, 1.6, 3, 10],
    medium: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33],
    high: [170, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8.1, 24, 170]
  },
  16: {
    low: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1.0, 0.5, 1.0, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
    medium: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110],
    high: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000]
  }
};

// Calculate binomial coefficient
function binomialCoefficient(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  
  let result = 1;
  for (let i = 0; i < k; i++) {
    result *= (n - i);
    result /= (i + 1);
  }
  return result;
}

// Calculate probability for each slot using binomial distribution
export function calculateSlotProbabilities(rows: RowCount): number[] {
  const n = rows;
  const probabilities: number[] = [];
  let total = 0;
  
  for (let k = 0; k <= n; k++) {
    const prob = binomialCoefficient(n, k);
    probabilities.push(prob);
    total += prob;
  }
  
  // Normalize probabilities
  return probabilities.map(p => p / total);
}

// House edge configuration
const HOUSE_EDGE_BOOST = 1.05; // 5% boost for lower multipliers
const HOUSE_EDGE_PENALTY = 0.05; // Logarithmic penalty factor for higher multipliers

// Select a slot based on binomial distribution with slight house edge
export function selectSlot(rows: RowCount, risk: RiskLevel): number {
  const probabilities = calculateSlotProbabilities(rows);
  const multipliers = MULTIPLIERS[rows][risk];
  
  // Apply house edge by slightly favoring lower multipliers
  const adjustedProbabilities = probabilities.map((prob, index) => {
    const multiplier = multipliers[index];
    // Lower multipliers get slight boost, higher multipliers get slight reduction
    const adjustment = multiplier < 1 ? HOUSE_EDGE_BOOST : 1 / (1 + Math.log10(multiplier) * HOUSE_EDGE_PENALTY);
    return prob * adjustment;
  });
  
  // Normalize
  const total = adjustedProbabilities.reduce((sum, p) => sum + p, 0);
  const normalizedProbs = adjustedProbabilities.map(p => p / total);
  
  // Select slot using weighted random
  const random = Math.random();
  let cumulative = 0;
  
  for (let i = 0; i < normalizedProbs.length; i++) {
    cumulative += normalizedProbs[i];
    if (random <= cumulative) {
      return i;
    }
  }
  
  return Math.floor(normalizedProbs.length / 2); // Fallback to middle
}

// Get multiplier for a specific slot
export function getMultiplier(rows: RowCount, risk: RiskLevel, slotIndex: number): number {
  return MULTIPLIERS[rows][risk][slotIndex];
}
