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
}

export interface BetResponse {
  slotIndex: number;
  multiplier: number;
  payout: number;
  animationPath: PathPoint[];
  startX: number;
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
