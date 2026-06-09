import React from 'react';

interface WinEntry {
  id: string;
  amount: number;
  multiplier: number;
}

interface WinsQueueProps {
  wins: WinEntry[];
}

const getMultiplierTier = (multiplier: number): string => {
  if (multiplier === 0) return 'win-tier-empty';
  if (multiplier < 1) return 'win-tier-blue';
  if (multiplier < 2) return 'win-tier-lightblue';
  if (multiplier < 5) return 'win-tier-green';
  if (multiplier < 10) return 'win-tier-yellow';
  if (multiplier < 25) return 'win-tier-orange';
  if (multiplier < 100) return 'win-tier-red';
  return 'win-tier-epic';
};

export const WinsQueue: React.FC<WinsQueueProps> = ({ wins }) => {
  return (
    <div className="wins-panel">
      <div className="wins-list">
        {wins.map((win, index) => (
          <div
            key={win.id}
            className={`wins-entry ${index === 0 ? 'wins-entry-new' : ''}`}
          >
            <span className={`wins-multiplier ${getMultiplierTier(win.multiplier)}`}>
              {win.multiplier > 0 ? `${win.multiplier}x` : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};