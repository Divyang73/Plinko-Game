import React from 'react';

interface WinEntry {
  id: string;
  amount: number;
  multiplier: number;
}

interface WinsQueueProps {
  wins: WinEntry[];
}

const getTier = (multiplier: number) => {
  if (multiplier >= 10) return 'win-tier-high';
  if (multiplier >= 2) return 'win-tier-mid';
  return 'win-tier-low';
};

export const WinsQueue: React.FC<WinsQueueProps> = ({ wins }) => {
  return (
    <div className="wins-panel">
      <div className="wins-title">Last 5 Wins</div>
      <div className="wins-list">
        {wins.map((win, index) => (
          <div
            key={win.id}
            className={`wins-entry ${getTier(win.multiplier)} ${index === 0 ? 'wins-entry-new' : ''}`}
          >
            <span className="wins-indicator" />
            <span className="wins-amount">
              {win.amount > 0 ? `$${win.amount.toFixed(2)}` : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};