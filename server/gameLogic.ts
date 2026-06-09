import type { RiskLevel, RowCount } from '../src/types/index.js';

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
  
};

const HOUSE_EDGE_BOOST = 1.05;
const HOUSE_EDGE_PENALTY = 0.05;

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

export function calculateSlotProbabilities(rows: RowCount): number[] {
  const n = rows;
  const probabilities: number[] = [];
  let total = 0;
  
  for (let k = 0; k <= n; k++) {
    const prob = binomialCoefficient(n, k);
    probabilities.push(prob);
    total += prob;
  }
  
  return probabilities.map(p => p / total);
}

export function selectSlot(rows: RowCount, risk: RiskLevel): number {
  const probabilities = calculateSlotProbabilities(rows);
  const multipliers = MULTIPLIERS[rows][risk];
  
  const adjustedProbabilities = probabilities.map((prob, index) => {
    const multiplier = multipliers[index];
    const adjustment = multiplier < 1 ? HOUSE_EDGE_BOOST : 1 / (1 + Math.log10(multiplier) * HOUSE_EDGE_PENALTY);
    return prob * adjustment;
  });
  
  const total = adjustedProbabilities.reduce((sum, p) => sum + p, 0);
  const normalizedProbs = adjustedProbabilities.map(p => p / total);
  
  const random = Math.random();
  let cumulative = 0;
  
  for (let i = 0; i < normalizedProbs.length; i++) {
    cumulative += normalizedProbs[i];
    if (random <= cumulative) {
      return i;
    }
  }
  
  return Math.floor(normalizedProbs.length / 2);
}

export function getMultiplier(rows: RowCount, risk: RiskLevel, slotIndex: number): number {
  return MULTIPLIERS[rows][risk][slotIndex];
}