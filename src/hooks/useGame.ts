import { useState } from 'react';
import type { RiskLevel, RowCount, BetRequest, BetResponse } from '../types';

export const useGame = () => {
  const [balance, setBalance] = useState(1000);
  const [betAmount, setBetAmount] = useState(1);
  const [risk, setRisk] = useState<RiskLevel>('low');
  const [rows, setRows] = useState<RowCount>(8);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastWin, setLastWin] = useState(0);
  const [lastMultiplier, setLastMultiplier] = useState(0);
  const [dropBall, setDropBall] = useState<{ point: number; path: number[]; multiplier: number; payout: number; slotIndex: number } | null>(null);
  const [activeBallsCount, setActiveBallsCount] = useState(0);
  
  const placeBet = async () => {
    if (betAmount > balance || betAmount <= 0) return;
    
    setIsPlaying(true);
    setLastWin(0);
    
    // Deduct bet from balance immediately
    setBalance(prev => prev - betAmount);
    setActiveBallsCount(prev => prev + 1);
    
    try {
      const request: BetRequest = {
        betAmount,
        risk,
        rows
      };
      
      const response = await fetch('/api/bet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });
      
      if (!response.ok) {
        throw new Error('Bet failed');
      }
      
      const data: BetResponse = await response.json();
      
      // Trigger ball drop - add to array, don't replace
      setDropBall({
        point: data.point,
        path: data.path,
        multiplier: data.multiplier,
        payout: data.payout,
        slotIndex: data.slotIndex
      });
      
      // Reset dropBall after a short delay to allow effect to fire
      setTimeout(() => setDropBall(null), 50);
      
    } catch (error) {
      console.error('Bet error:', error);
      // Refund bet on error
      setBalance(prev => prev + betAmount);
      setActiveBallsCount(prev => Math.max(0, prev - 1));
    }
  };
  
  const handleBallLanded = (_ballId: string, multiplier: number, payout: number) => {
    setBalance(prev => prev + payout);
    setLastWin(payout);
    setLastMultiplier(multiplier);
    
    // Decrement active balls count
    setActiveBallsCount(prev => {
      const newCount = Math.max(0, prev - 1);
      // Set isPlaying to false when no more active balls
      if (newCount === 0) {
        setIsPlaying(false);
      }
      return newCount;
    });
  };
  
  return {
    balance,
    betAmount,
    setBetAmount,
    risk,
    setRisk,
    rows,
    setRows,
    isPlaying,
    lastWin,
    lastMultiplier,
    placeBet,
    handleBallLanded,
    dropBall,
    activeBallsCount
  };
};
