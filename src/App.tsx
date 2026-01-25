import { GameCanvas } from './components/GameCanvas';
import { BetControls } from './components/BetControls';
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
    lastWin,
    lastMultiplier,
    placeBet,
    handleBallLanded,
    dropBall,
    activeBallsCount
  } = useGame();
  
  return (
    <div className="min-h-screen bg-stake-dark text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Plinko</h1>
          <p className="text-gray-400">Stake Game Replica</p>
        </header>
        
        {/* Game Area */}
        <div className="flex flex-col lg:flex-row items-start justify-center gap-8">
          {/* Canvas */}
          <div className="flex-shrink-0">
            <GameCanvas
              rows={rows}
              risk={risk}
              onBallLanded={handleBallLanded}
              dropBall={dropBall}
            />
          </div>
          
          {/* Controls */}
          <BetControls
            balance={balance}
            betAmount={betAmount}
            setBetAmount={setBetAmount}
            risk={risk}
            setRisk={setRisk}
            rows={rows}
            setRows={setRows}
            onBet={placeBet}
            lastWin={lastWin}
            lastMultiplier={lastMultiplier}
            activeBallsCount={activeBallsCount}
          />
        </div>
        
        {/* Footer */}
        <footer className="text-center mt-12 text-gray-500 text-sm">
          <p>Built with React, TypeScript, and Canvas API</p>
          <p className="mt-2">Deterministic physics with integer math (×1000 scale factor)</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
