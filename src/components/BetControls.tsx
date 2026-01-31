import React from 'react';
import type { RiskLevel, RowCount } from '../types';

interface BetControlsProps {
  balance: number;
  betAmount: number;
  setBetAmount: (amount: number) => void;
  risk: RiskLevel;
  setRisk: (risk: RiskLevel) => void;
  rows: RowCount;
  setRows: (rows: RowCount) => void;
  onBet: () => void;
  activeBallsCount?: number;
  playWithStars: boolean;
  onOpenMode: () => void;
}

export const BetControls: React.FC<BetControlsProps> = ({
  balance,
  betAmount,
  setBetAmount,
  risk,
  setRisk,
  rows,
  setRows,
  onBet,
  activeBallsCount = 0,
  playWithStars,
  onOpenMode
}) => {
  const hasBallsDropping = activeBallsCount > 0;
  
  // Risk and Rows are locked when balls are dropping in BOTH modes
  const riskRowsDisabled = hasBallsDropping;
  
  // Bet amount controls: locked only in Stars mode when balls dropping
  const betAmountDisabled = playWithStars && hasBallsDropping;
  
  // Bet button: 
  // - Stars mode: disabled when balls dropping (no multi-bet)
  // - Classic mode: always enabled if valid bet (multi-bet allowed)
  const betDisabled = betAmount <= 0 || betAmount > balance || (playWithStars && hasBallsDropping);
  
  const handleHalf = () => {
    setBetAmount(Math.max(0.01, betAmount / 2));
  };
  
  const handleDouble = () => {
    setBetAmount(Math.min(balance, betAmount * 2));
  };
  
  const handleMax = () => {
    setBetAmount(balance);
  };
  
  const handleBetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setBetAmount(Math.max(0, Math.min(balance, value)));
  };
  
  return (
    <div className="w-80 glass-panel p-6 rounded-2xl space-y-6">
      <div className="stat-box">
        <div className="text-xs text-slate-300 uppercase tracking-wide">Balance</div>
        <div className="text-3xl font-bold text-white">${balance.toFixed(2)}</div>
      </div>
      
      <div className="glass-panel p-4 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-300 uppercase tracking-wide">Gameplay Mode</div>
            <div className="text-sm text-white font-semibold">
              {playWithStars ? 'Stars ON' : 'Classic'}
            </div>
          </div>
          <button 
            className="btn-secondary px-4 py-2 text-xs" 
            onClick={onOpenMode}
            disabled={hasBallsDropping}
          >
            Change
          </button>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          {playWithStars
            ? 'Stars enabled. Multi-bet disabled for cinematic drops.'
            : 'Classic mode. Multi-bets enabled, clean casino style.'}
        </p>
      </div>
      
      <div className={betAmountDisabled ? 'control-disabled' : ''}>
        <label className="block text-slate-300 text-sm mb-2">Bet Amount</label>
        <input
          type="number"
          value={betAmount}
          onChange={handleBetChange}
          step="0.01"
          min="0.01"
          max={balance}
          disabled={betAmountDisabled}
          className="w-full bg-slate-950/70 text-white px-4 py-3 rounded-xl border border-white/10 focus:outline-none focus:border-emerald-400/60 transition"
        />
        <div className="flex gap-2 mt-2">
          <button onClick={handleHalf} disabled={betAmountDisabled} className="flex-1 btn-secondary">½</button>
          <button onClick={handleDouble} disabled={betAmountDisabled} className="flex-1 btn-secondary">2×</button>
          <button onClick={handleMax} disabled={betAmountDisabled} className="flex-1 btn-secondary">Max</button>
        </div>
      </div>
      
      <div className={riskRowsDisabled ? 'control-disabled' : ''}>
        <label className="block text-slate-300 text-sm mb-2">Risk</label>
        <div className="grid grid-cols-3 gap-2">
          {(['low', 'medium', 'high'] as RiskLevel[]).map((r) => (
            <button
              key={r}
              onClick={() => setRisk(r)}
              disabled={riskRowsDisabled}
              className={`pill-button py-3 font-semibold uppercase text-xs transition ${
                risk === r
                  ? r === 'low'
                    ? 'risk-low'
                    : r === 'medium'
                    ? 'risk-med'
                    : 'risk-high'
                  : 'btn-muted'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      
      <div className={riskRowsDisabled ? 'control-disabled' : ''}>
        <label className="block text-slate-300 text-sm mb-2">Rows</label>
        <div className="grid grid-cols-2 gap-2">
          {([8, 12] as RowCount[]).map((r) => (
            <button
              key={r}
              onClick={() => setRows(r)}
              disabled={riskRowsDisabled}
              className={`pill-button py-3 font-semibold transition ${
                rows === r ? 'btn-rows-active' : 'btn-muted'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      
      <button
        onClick={onBet}
        disabled={betDisabled}
        className="w-full btn-gradient text-white font-bold py-4 rounded-full text-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        Bet
      </button>
    </div>
  );
};