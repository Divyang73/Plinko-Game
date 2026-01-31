export type RiskLevel = 'low' | 'medium' | 'high';
export type RowCount = 8 | 12;

export interface PathPoint {
  x: number;
  y: number;
  t: number;
}

export interface BetRequest {
  betAmount: number;
  risk: RiskLevel;
  rows: RowCount;
  playWithStars: boolean;
}

export interface StarBonus {
  x: number;
  y: number;
  collected: boolean;
  bonusAmount: number;
}

export interface BetResponse {
  slotIndex: number;
  multiplier: number;
  payout: number;
  animationPath: PathPoint[];
  startX: number;
  star: StarBonus;
}

export interface Pin {
  x: number;
  y: number;
}

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  isActive: boolean;
}

export interface GameState {
  balance: number;
  betAmount: number;
  risk: RiskLevel;
  rows: RowCount;
  isPlaying: boolean;
  lastWin: number;
  lastMultiplier: number;
}