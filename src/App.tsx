import { useState, useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { BetControls } from './components/BetControls';
import { AuthModal } from './components/AuthModal';
import { useGame } from './hooks/useGame';

function App() {
  const {
    balance,
    setBalance,
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
    fetchBalance,
    username,
    setUsername
  } = useGame();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    // Check if token exists on load
    const token = localStorage.getItem('plinko_token');
    if (token) {
      fetchBalance();
    }
  }, []);

  const handleLoginSuccess = (user: string, initialBalance: number) => {
    setUsername(user);
    setBalance(Number(initialBalance));
  };

  const handleLogout = () => {
    localStorage.removeItem('plinko_token');
    setUsername(null);
    setBalance(0);
  };

  return (
    <div className="min-h-screen bg-[#1a2c38] text-white flex flex-col font-['Inter',sans-serif]">
      {/* Header */}
      <header className="flex justify-between items-center px-8 py-4 bg-gradient-to-b from-[#1a2c38] to-[#0f212e] border-b border-[#213743] shadow-md relative z-10">
        <div className="flex items-center gap-2">
          {/* Logo Placeholder */}
          <div className="font-black text-3xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#00e701] to-[#14f1ff] drop-shadow-sm">Plinko</div>
        </div>
        <div className="flex items-center gap-4">
          {localStorage.getItem('plinko_token') ? (
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-end">
                <span className="text-sm font-black text-white">{username || 'User'}</span>
              </div>
              <div className="bg-[#0b1724] px-5 py-2.5 rounded-lg font-bold text-sm border border-[#213743] shadow-inner flex items-center gap-2">
                <span className="text-[#00e701]">$</span>
                <span className="text-white">{balance.toFixed(2)}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="bg-[#213743] hover:bg-[#2c4756] text-slate-300 hover:text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition shadow-sm"
              >
                Logout
              </button>
            </div>
          ) : (
            <>
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="text-slate-300 hover:text-white font-semibold text-sm transition px-4 py-2"
              >
                Login
              </button>
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-[#00e701] hover:bg-[#00c701] text-[#0f212e] px-6 py-2.5 rounded-lg text-sm font-bold transition shadow-lg shadow-[#00e701]/20"
              >
                Register
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col lg:flex-row max-w-[1400px] w-full mx-auto p-4 lg:p-8 gap-8 mt-2">
        
        {/* Left Sidebar - Bet Controls */}
        <div className="w-full lg:w-[320px] flex-shrink-0">
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
          />
        </div>
        
        {/* Right Area - Canvas */}
        <div className="flex-1 bg-[#0f212e] rounded-lg shadow-xl border border-[#213743] flex flex-col items-center justify-center relative overflow-hidden">
          <GameCanvas
            rows={rows}
            risk={risk}
            onBallLanded={handleBallLanded}
            dropBall={dropBall}
          />
        </div>
      </main>
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}

export default App;