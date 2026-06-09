import type { RiskLevel, RowCount } from '../src/types/index.js';

/**
 * Multiplier lookup tables indexed by [rows][risk][slotIndex].
 *
 * Each row configuration has (rows + 1) slots. The tables are symmetric
 * around the center slot, reflecting the symmetric nature of the binomial
 * distribution. Edge slots carry high multipliers (low probability) and
 * center slots carry low multipliers (high probability).
 *
 * House edge is embedded directly in these values. For every configuration
 * the expected value (EV) is strictly less than 1.00, meaning no probability
 * manipulation is needed in the slot selection logic. See README for the
 * full EV verification.
 */
export const MULTIPLIERS: Record<RowCount, Record<RiskLevel, number[]>> = {
  8: {
    low:    [5.6, 2.1, 1.1, 1.0, 0.5, 1.0, 1.1, 2.1, 5.6],
    medium: [13,  3,   1.3, 0.7, 0.4, 0.7, 1.3, 3,   13],
    high:   [29,  4,   1.5, 0.3, 0.2, 0.3, 1.5, 4,   29]
  },
  12: {
    low:    [10,  3,   1.6, 1.4, 1.1, 1.0, 0.5, 1.0, 1.1, 1.4, 1.6, 3,   10],
    medium: [33,  11,  4,   2,   1.1, 0.6, 0.3, 0.6, 1.1, 2,   4,   11,  33],
    high:   [170, 24,  8.1, 2,   0.7, 0.2, 0.2, 0.2, 0.7, 2,   8.1, 24,  170]
  },
};

/**
 * Computes the binomial coefficient C(n, k) = n! / (k! * (n - k)!).
 *
 * Uses the multiplicative formula to avoid computing large factorials.
 * This is numerically stable for the small values of n used in this
 * application (n <= 12).
 *
 * @param n - Total number of trials (rows in the Plinko board).
 * @param k - Number of successes (rightward bounces).
 * @returns The number of ways to choose k items from n.
 */
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

/**
 * Calculates the probability of a ball landing in each slot using the
 * binomial distribution.
 *
 * In a Plinko board with n rows, a ball makes n independent binary
 * decisions (bounce left or right) at each peg. The probability of
 * landing in slot k is therefore:
 *
 *   P(k) = C(n, k) / 2^n
 *
 * This models fair, physics-based randomness identical to flipping n
 * fair coins and counting heads. No artificial weighting is applied;
 * the house edge is encoded entirely in the multiplier tables.
 *
 * @param rows - Number of rows on the board (8 or 12).
 * @returns An array of probabilities summing to 1.0, one per slot.
 */
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

/**
 * Selects the landing slot for a single bet using pure binomial sampling.
 *
 * Generates a uniform random number in [0, 1) and walks the cumulative
 * distribution function (CDF) of the binomial probabilities. The first
 * slot whose cumulative probability exceeds the random value is selected.
 *
 * The risk parameter is accepted but intentionally unused here. Risk
 * affects only the payout multiplier (via getMultiplier), not the
 * landing probability. All risk levels share the same fair distribution.
 *
 * @param rows - Number of rows (determines the number of slots).
 * @param risk - Risk level (unused in probability calculation).
 * @returns The zero-indexed slot the ball lands in.
 */
export function selectSlot(rows: RowCount, risk: RiskLevel): number {
  const probabilities = calculateSlotProbabilities(rows);

  const random = Math.random();
  let cumulative = 0;
  for (let i = 0; i < probabilities.length; i++) {
    cumulative += probabilities[i];
    if (random <= cumulative) return i;
  }
  // Fallback to center slot (should never reach here due to floating-point).
  return Math.floor(probabilities.length / 2);
}

/**
 * Retrieves the payout multiplier for a given configuration and slot.
 *
 * @param rows - Number of rows on the board.
 * @param risk - Selected risk level.
 * @param slotIndex - The zero-indexed slot the ball landed in.
 * @returns The multiplier applied to the bet amount.
 */
export function getMultiplier(rows: RowCount, risk: RiskLevel, slotIndex: number): number {
  return MULTIPLIERS[rows][risk][slotIndex];
}