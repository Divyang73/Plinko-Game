import { useState } from 'react';
import type { RiskLevel, RowCount, BetRequest, BetResponse } from '../types';

interface WinEntry {
  id: string;
  amount: number;
  multiplier: number;
}

const buildInitialWins = (): WinEntry[] =>
  Array.from({ length: 5 }, (_, index) => ({
    id: `init-${index}`,
    amount: 0,
    multiplier: 0
  }));

export const useGame = () => {
  const [balance, setBalance] = useState(1000);
  const [betAmount, setBetAmount] = useState(1);
  const [risk, setRisk] = useState<RiskLevel>('low');
  const [rows, setRows] = useState<RowCount>(8);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playWithStars, setPlayWithStars] = useState(true);
  const [lastWins, setLastWins] = useState<WinEntry[]>(buildInitialWins());
  const [dropBall, setDropBall] = useState<{
    animationPath: Array<{ x: number; y: number; t: number }>;
    multiplier: number;
    payout: number;
    slotIndex: number;
    star: BetResponse['star'];
  } | null>(null);
  const [activeBallsCount, setActiveBallsCount] = useState(0);
  
  const placeBet = async () => {
    if (betAmount > balance || betAmount <= 0) return;
    if (playWithStars && activeBallsCount > 0) return;
    
    setIsPlaying(true);
    
    setBalance(prev => prev - betAmount);
    setActiveBallsCount(prev => prev + 1);
    
    try {
      const request: BetRequest = {
        betAmount,
        risk,
        rows,
        playWithStars
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
      
      setDropBall({
        animationPath: data.animationPath,
        multiplier: data.multiplier,
        payout: data.payout,
        slotIndex: data.slotIndex,
        star: data.star
      });
      
      setTimeout(() => setDropBall(null), 50);
      
    } catch (error) {
      console.error('Bet error:', error);
      setBalance(prev => prev + betAmount);
      setActiveBallsCount(prev => Math.max(0, prev - 1));
    }
  };
  
  const handleBallLanded = (_ballId: string, multiplier: number, payout: number) => {
    setBalance(prev => prev + payout);
    setLastWins(prev => [
      { id: `win-${Date.now()}-${Math.random().toString(36).slice(2)}`, amount: payout, multiplier },
      ...prev
    ].slice(0, 5));
    
    setActiveBallsCount(prev => {
      const newCount = Math.max(0, prev - 1);
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
    placeBet,
    handleBallLanded,
    dropBall,
    activeBallsCount,
    playWithStars,
    setPlayWithStars,
    lastWins
  };
};