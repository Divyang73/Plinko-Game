import React from 'react';

type Mode = 'stars' | 'classic';

interface GameplayModeProps {
  isOpen: boolean;
  mode: Mode;
  onSelect: (mode: Mode) => void;
  onClose?: () => void;
}

export const GameplayMode: React.FC<GameplayModeProps> = ({ isOpen, mode, onSelect, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="mode-overlay">
      <div className="mode-window">
        <h2 className="mode-title">Gameplay Mode</h2>
        <p className="mode-subtitle">
          Choose your experience. Switch anytime for a different vibe.
        </p>
        <div className="mode-options">
          <button
            className={`mode-card ${mode === 'stars' ? 'mode-card-active' : ''}`}
            onClick={() => onSelect('stars')}
          >
            <div className="mode-card-title">Stars ON</div>
            <div className="mode-card-desc">
              Radiant stars, bonus collection, cinematic animations.
            </div>
          </button>
          <button
            className={`mode-card ${mode === 'classic' ? 'mode-card-active' : ''}`}
            onClick={() => onSelect('classic')}
          >
            <div className="mode-card-title">Classic</div>
            <div className="mode-card-desc">
              Clean casino style, fast multi-bets, no stars.
            </div>
          </button>
        </div>
        {onClose && (
          <button className="mode-close" onClick={onClose}>
            Close
          </button>
        )}
      </div>
    </div>
  );
};