import { useState, useEffect } from 'react';
import type { RiskLevel, RowCount, SimulationRequest, SimulationResponse } from '../types';

interface OutcomeEntry {
  id: string;
  amount: number;
  multiplier: number;
}

const buildInitialOutcomes = (): OutcomeEntry[] =>
  Array.from({ length: 5 }, (_, index) => ({
    id: `init-${index}`,
    amount: 0,
    multiplier: 0
  }));

export const useGame = () => {
  const [credits, setCredits] = useState(1000);
  const [cost, setCost] = useState(1);
  const [risk, setRisk] = useState<RiskLevel>('low');
  const [rows, setRows] = useState<RowCount>(8);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastOutcomes, setLastOutcomes] = useState<OutcomeEntry[]>(buildInitialOutcomes());
  const [dropBall, setDropBall] = useState<{
    animationPath: Array<{ x: number; y: number; t: number }>;
    multiplier: number;
    reward: number;
    slotIndex: number;
  } | null>(null);
  const [activeBallsCount, setActiveBallsCount] = useState(0);
  const [username, setUsername] = useState<string | null>(null);

  // Fetch credits periodically or on load
  const fetchCredits = async () => {
    const token = localStorage.getItem('plinko_token');
    if (!token) return;
    try {
      const res = await fetch('/api/user/credits', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCredits(Number(data.credits));
        if (data.username) setUsername(data.username);
      }
    } catch (e) {
      console.error('Failed to fetch credits', e);
    }
  };

  useEffect(() => {
    fetchCredits();
  }, []);
  
  const runSimulation = async () => {
    const token = localStorage.getItem('plinko_token');
    if (!token) {
      alert('Please log in first!');
      return;
    }
    if (cost > credits || cost <= 0) return;
    
    setIsPlaying(true);
    
    setCredits(prev => prev - cost);
    setActiveBallsCount(prev => prev + 1);
    
    try {
      const request: SimulationRequest = {
        cost,
        risk,
        rows
      };
      
      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(request)
      });
      
      if (!response.ok) {
        throw new Error('Simulation failed');
      }
      
      const data: SimulationResponse = await response.json();
      
      setDropBall({
        animationPath: data.animationPath,
        multiplier: data.multiplier,
        reward: data.reward,
        slotIndex: data.slotIndex
      });
      
      setTimeout(() => setDropBall(null), 50);
      
    } catch (error) {
      console.error('Simulation error:', error);
      setCredits(prev => prev + cost);
      setActiveBallsCount(prev => Math.max(0, prev - 1));
    }
  };
  
  const handleBallLanded = (_ballId: string, multiplier: number, reward: number) => {
    setCredits(prev => prev + reward);
    setLastOutcomes(prev => [
      { id: `outcome-${Date.now()}-${Math.random().toString(36).slice(2)}`, amount: reward, multiplier },
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
    credits,
    setCredits,
    cost,
    setCost,
    risk,
    setRisk,
    rows,
    setRows,
    isPlaying,
    runSimulation,
    handleBallLanded,
    dropBall,
    activeBallsCount,
    lastOutcomes,
    fetchCredits,
    username,
    setUsername
  };
};