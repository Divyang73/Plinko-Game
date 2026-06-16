import React, { useState, useEffect } from 'react';
import type { RiskLevel, RowCount } from '../types';

interface EngineControlsProps {
  credits: number;
  cost: number;
  setCost: (amount: number) => void;
  risk: RiskLevel;
  setRisk: (risk: RiskLevel) => void;
  rows: RowCount;
  setRows: (rows: RowCount) => void;
  onRun: () => void;
  activeBallsCount?: number;
}

export const EngineControls: React.FC<EngineControlsProps> = ({
  credits,
  cost,
  setCost,
  risk,
  setRisk,
  rows,
  setRows,
  onRun,
  activeBallsCount = 0
}) => {
  const [autoplayEnabled, setAutoplayEnabled] = useState(false);
  const [autoplayCount, setAutoplayCount] = useState(10);
  const [isAutoplayRunning, setIsAutoplayRunning] = useState(false);
  
  const hasBallsDropping = activeBallsCount > 0;
  
  const riskRowsDisabled = hasBallsDropping || isAutoplayRunning;
  
  const costDisabled = isAutoplayRunning;
  
  const runDisabled = cost <= 0 || cost > credits || isAutoplayRunning;
  
  useEffect(() => {
    if (isAutoplayRunning && autoplayCount > 0) {
      const timer = setTimeout(() => {
        if (cost <= credits && cost > 0) {
          onRun();
          setAutoplayCount(prev => prev - 1);
        } else {
          setIsAutoplayRunning(false);
          setAutoplayEnabled(false);
        }
      }, 500);
      return () => clearTimeout(timer);
    } else if (isAutoplayRunning && autoplayCount <= 0) {
      setIsAutoplayRunning(false);
      setAutoplayEnabled(false);
    }
  }, [isAutoplayRunning, autoplayCount, credits, cost, onRun]);
  
  const handleHalf = () => setCost(Math.floor(Math.max(0.01, cost / 2) * 100) / 100);
  const handleDouble = () => setCost(Math.floor(Math.min(credits, cost * 2) * 100) / 100);
  const handleMax = () => setCost(Math.floor(credits * 100) / 100);
  const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setCost(Math.floor(Math.max(0, Math.min(credits, value)) * 100) / 100);
  };
  
  return (
    <div className="bg-[#213743] p-4 rounded-lg flex flex-col gap-4 text-slate-300 font-semibold shadow-lg">
      
      {/* Mode Switch */}
      <div className="flex bg-[#0f212e] rounded-full p-1 mb-2">
        <button 
          className={`flex-1 py-2 rounded-full text-sm transition ${!autoplayEnabled ? 'bg-[#213743] text-white shadow' : 'text-slate-400 hover:text-white'}`}
          onClick={() => { setAutoplayEnabled(false); setIsAutoplayRunning(false); }}
        >
          Manual
        </button>
        <button 
          className={`flex-1 py-2 rounded-full text-sm transition ${autoplayEnabled ? 'bg-[#213743] text-white shadow' : 'text-slate-400 hover:text-white'}`}
          onClick={() => setAutoplayEnabled(true)}
        >
          Auto
        </button>
      </div>

      {/* Simulation Cost */}
      <div className={costDisabled ? 'opacity-50 pointer-events-none' : ''}>
        <div className="flex justify-between text-xs mb-1">
          <label>Simulation Cost</label>
          <span>{credits.toFixed(2)} CR</span>
        </div>
        <div className="flex bg-[#0f212e] border border-[#213743] rounded focus-within:border-[#557086] transition overflow-hidden">
          <input
            type="number"
            value={cost}
            onChange={handleCostChange}
            step="0.01"
            min="0.01"
            max={credits}
            disabled={costDisabled}
            className="w-full bg-transparent text-white px-3 py-2.5 focus:outline-none text-sm font-bold appearance-none"
          />
          <div className="flex border-l border-[#213743]">
            <button onClick={handleHalf} disabled={costDisabled} className="px-3 hover:bg-[#2c4756] transition text-sm">½</button>
            <div className="w-px bg-[#213743]"></div>
            <button onClick={handleDouble} disabled={costDisabled} className="px-3 hover:bg-[#2c4756] transition text-sm">2×</button>
            <div className="w-px bg-[#213743]"></div>
            <button onClick={handleMax} disabled={costDisabled} className="px-3 hover:bg-[#2c4756] transition text-sm">Max</button>
          </div>
        </div>
      </div>
      
      {/* Risk Level */}
      <div className={riskRowsDisabled ? 'opacity-50 pointer-events-none' : ''}>
        <label className="block text-xs mb-1">Risk</label>
        <div className="relative">
          <select 
            value={risk}
            onChange={(e) => setRisk(e.target.value as RiskLevel)}
            disabled={riskRowsDisabled}
            className="w-full bg-[#0f212e] text-white border border-[#213743] rounded px-3 py-2.5 focus:outline-none focus:border-[#557086] transition appearance-none text-sm font-bold cursor-pointer"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
      </div>
      
      {/* Rows */}
      <div className={riskRowsDisabled ? 'opacity-50 pointer-events-none' : ''}>
        <label className="block text-xs mb-1">Rows</label>
        <div className="relative">
          <select 
            value={rows}
            onChange={(e) => setRows(Number(e.target.value) as RowCount)}
            disabled={riskRowsDisabled}
            className="w-full bg-[#0f212e] text-white border border-[#213743] rounded px-3 py-2.5 focus:outline-none focus:border-[#557086] transition appearance-none text-sm font-bold cursor-pointer"
          >
            <option value={8}>8</option>
            <option value={12}>12</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
      </div>

      {autoplayEnabled && (
        <div>
          <label className="block text-xs mb-1">Number of Drops</label>
          <input
            type="number"
            value={autoplayCount}
            onChange={(e) => setAutoplayCount(Math.max(0, parseInt(e.target.value) || 0))}
            disabled={isAutoplayRunning}
            className="w-full bg-[#0f212e] text-white border border-[#213743] rounded px-3 py-2.5 focus:outline-none focus:border-[#557086] transition text-sm font-bold"
          />
        </div>
      )}
      
      <div className="pt-4 mt-4">
        {!autoplayEnabled ? (
          <button
            onClick={onRun}
            disabled={runDisabled}
            className="w-full bg-[#00e701] hover:bg-[#00c701] text-[#0f212e] font-bold py-3.5 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Run Simulation
          </button>
        ) : (
          !isAutoplayRunning ? (
            <button
              onClick={() => setIsAutoplayRunning(true)}
              disabled={autoplayCount <= 0 || runDisabled || (autoplayCount * cost > credits)}
              className="w-full bg-[#00e701] hover:bg-[#00c701] text-[#0f212e] font-bold py-3.5 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Autoplay
            </button>
          ) : (
            <button
              onClick={() => setIsAutoplayRunning(false)}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 rounded transition"
            >
              Stop Autoplay
            </button>
          )
        )}
      </div>
    </div>
  );
};