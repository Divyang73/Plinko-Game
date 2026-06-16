export type RiskLevel = 'low' | 'medium' | 'high';
export type RowCount = 8 | 12;

export interface PathPoint {
  x: number;
  y: number;
  t: number;
}

export interface SimulationRequest {
  cost: number;
  risk: RiskLevel;
  rows: RowCount;
}

export interface SimulationResponse {
  slotIndex: number;
  multiplier: number;
  reward: number;
  animationPath: PathPoint[];
  startX: number;
  star?: undefined;
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
  credits: number;
  cost: number;
  risk: RiskLevel;
  rows: RowCount;
  isPlaying: boolean;
  lastReward: number;
  lastMultiplier: number;
}