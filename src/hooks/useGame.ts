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
  const [dropBall, setDropBall] = useState<{ point: number; path: number[]; multiplier: number; payout: number } | null>(null);
  
  const placeBet = async () => {
    if (isPlaying || betAmount > balance || betAmount <= 0) return;
    
    setIsPlaying(true);
    setLastWin(0);
    
    // Deduct bet from balance
    setBalance(prev => prev - betAmount);
    
    try {
      const request: BetRequest = {
        betAmount,
        risk,
        rows
      };
      
      const response = await fetch('http://localhost:3000/api/bet', {
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
      
      // Trigger ball drop
      setDropBall({
        point: data.point,
        path: data.path,
        multiplier: data.multiplier,
        payout: data.payout
      });
      
    } catch (error) {
      console.error('Bet error:', error);
      // Refund bet on error
      setBalance(prev => prev + betAmount);
      setIsPlaying(false);
    }
  };
  
  const handleBallLanded = (multiplier: number, payout: number) => {
    setBalance(prev => prev + payout);
    setLastWin(payout);
    setLastMultiplier(multiplier);
    setIsPlaying(false);
    setDropBall(null);
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
    dropBall
  };
};
