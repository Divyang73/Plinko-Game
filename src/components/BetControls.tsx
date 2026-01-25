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
  lastWin: number;
  lastMultiplier: number;
  activeBallsCount?: number;
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
  lastWin,
  lastMultiplier,
  activeBallsCount = 0
}) => {
  const hasBallsDropping = activeBallsCount > 0;
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
    <div className="w-80 bg-stake-darker p-6 rounded-lg space-y-6 relative">
      {/* Balance Display */}
      <div className="text-center">
        <div className="text-gray-400 text-sm">Balance</div>
        <div className="text-3xl font-bold text-white">${balance.toFixed(2)}</div>
      </div>
      
      {/* Last Win Display - Fixed position box */}
      {lastWin > 0 && (
        <div className="h-[90px] flex items-center justify-center bg-green-900/30 border border-green-700 rounded p-3">
          <div className="text-center">
            <div className="text-green-400 text-sm">Last Win</div>
            <div className="text-2xl font-bold text-green-400">
              ${lastWin.toFixed(2)}
            </div>
            <div className="text-green-500 text-xs mt-1">
              {lastMultiplier}x multiplier
            </div>
          </div>
        </div>
      )}
      {lastWin === 0 && (
        <div className="h-[90px]"></div>
      )}
      
      {/* Bet Amount */}
      <div>
        <label className="block text-gray-400 text-sm mb-2">Bet Amount</label>
        <input
          type="number"
          value={betAmount}
          onChange={handleBetChange}
          step="0.01"
          min="0.01"
          max={balance}
          className="w-full bg-stake-dark text-white px-4 py-3 rounded border border-stake-light focus:outline-none focus:border-blue-500"
        />
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleHalf}
            className="flex-1 bg-stake-light hover:bg-stake-dark text-white py-2 rounded"
          >
            ½
          </button>
          <button
            onClick={handleDouble}
            className="flex-1 bg-stake-light hover:bg-stake-dark text-white py-2 rounded"
          >
            2×
          </button>
          <button
            onClick={handleMax}
            className="flex-1 bg-stake-light hover:bg-stake-dark text-white py-2 rounded"
          >
            Max
          </button>
        </div>
      </div>
      
      {/* Risk Level */}
      <div>
        <label className="block text-gray-400 text-sm mb-2">Risk</label>
        <div className="grid grid-cols-3 gap-2">
          {(['low', 'medium', 'high'] as RiskLevel[]).map((r) => (
            <button
              key={r}
              onClick={() => setRisk(r)}
              disabled={hasBallsDropping}
              className={`py-3 rounded font-semibold uppercase text-sm transition ${
                risk === r
                  ? r === 'low'
                    ? 'bg-green-600 text-white'
                    : r === 'medium'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-red-600 text-white'
                  : 'bg-stake-light text-gray-400 hover:bg-stake-dark'
              } ${hasBallsDropping ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      
      {/* Rows */}
      <div>
        <label className="block text-gray-400 text-sm mb-2">Rows</label>
        <div className="grid grid-cols-2 gap-2">
          {([8, 12] as RowCount[]).map((r) => (
            <button
              key={r}
              onClick={() => setRows(r)}
              disabled={hasBallsDropping}
              className={`py-3 rounded font-semibold transition ${
                rows === r
                  ? 'bg-blue-600 text-white'
                  : 'bg-stake-light text-gray-400 hover:bg-stake-dark'
              } ${hasBallsDropping ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      
      {/* Bet Button */}
      <button
        onClick={onBet}
        disabled={betAmount <= 0 || betAmount > balance}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-600 transition"
      >
        Bet
      </button>
    </div>
  );
};
