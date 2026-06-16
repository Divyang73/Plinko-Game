import React from 'react';

interface OutcomeEntry {
  id: string;
  amount: number;
  multiplier: number;
}

interface OutcomesQueueProps {
  outcomes: OutcomeEntry[];
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

export const OutcomesQueue: React.FC<OutcomesQueueProps> = ({ outcomes }) => {
  return (
    <div className="wins-panel">
      <div className="wins-list">
        {outcomes.map((outcome, index) => (
          <div
            key={outcome.id}
            className={`wins-entry ${index === 0 ? 'wins-entry-new' : ''}`}
          >
            <span className={`wins-multiplier ${getMultiplierTier(outcome.multiplier)}`}>
              {outcome.multiplier > 0 ? `${outcome.multiplier}x` : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};