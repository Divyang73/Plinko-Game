import { useState } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { BetControls } from './components/BetControls';
import { GameplayMode } from './components/GameplayMode';
import { WinsQueue } from './components/WinsQueue';
import { LoadingScreen } from './components/LoadingScreen';
import { ShinyText } from './components/ShinyText';
import { useGame } from './hooks/useGame';

function App() {
  const {
    balance,
    betAmount,
    setBetAmount,
    risk,
    setRisk,
    rows,
    setRows,
    placeBet,
    handleBallLanded,
    dropBall,
    activeBallsCount,
    playWithStars,
    setPlayWithStars,
    lastWins
  } = useGame();

  const [showMode, setShowMode] = useState(true);
  const [showLoading, setShowLoading] = useState(true);
  
  const handleModeSelect = (mode: 'stars' | 'classic') => {
    setPlayWithStars(mode === 'stars');
    setShowMode(false);
  };
  
  if (showLoading) {
    return <LoadingScreen onComplete={() => setShowLoading(false)} />;
  }
  
  return (
    <div className="min-h-screen casino-bg text-white">
      <GameplayMode
        isOpen={showMode}
        mode={playWithStars ? 'stars' : 'classic'}
        onSelect={handleModeSelect}
        onClose={() => setShowMode(false)}
      />
      <div className="container mx-auto px-4 py-12">
        <header className="text-center mb-12 flex flex-col items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="logo-dots">
              <span className="logo-dot dot-1" />
              <span className="logo-dot dot-2" />
              <span className="logo-dot dot-3" />
            </div>
            <ShinyText text="PLINKO" />
            <div className="logo-dots">
              <span className="logo-dot dot-3" />
              <span className="logo-dot dot-2" />
              <span className="logo-dot dot-1" />
            </div>
          </div>
          <ShinyText 
            text="Casino-grade drops • star bonus • near-miss psychology" 
            fontSize="0.95rem"
            className="text-slate-300"
          />
        </header>
        
        <div className="flex flex-col lg:flex-row items-start justify-center gap-12">
          <WinsQueue wins={lastWins} />
          
          <div className="flex-shrink-0">
            <GameCanvas
              rows={rows}
              risk={risk}
              onBallLanded={handleBallLanded}
              dropBall={dropBall}
              playWithStars={playWithStars}
            />
          </div>
          
          <BetControls
            balance={balance}
            betAmount={betAmount}
            setBetAmount={setBetAmount}
            risk={risk}
            setRisk={setRisk}
            rows={rows}
            setRows={setRows}
            onBet={placeBet}
            activeBallsCount={activeBallsCount}
            playWithStars={playWithStars}
            onOpenMode={() => setShowMode(true)}
          />
        </div>
        
        <footer className="text-center mt-12 text-slate-400 text-xs">
          <p>React • TypeScript • Canvas. Casino-grade animation & payout math.</p>
          <p className="mt-2">Star bonus is enforced at 5% per slot, with RTP-adjusted multipliers.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;