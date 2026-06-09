import React, { useState } from 'react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (username: string, balance: number) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      localStorage.setItem('plinko_token', data.token);
      onLoginSuccess(data.username, data.balance);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0f212e] w-full max-w-md rounded-lg shadow-xl overflow-hidden text-slate-200">
        <div className="flex justify-between items-center p-4 border-b border-white/5">
          <h2 className="text-xl font-bold">{isLogin ? 'Log In' : 'Register'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded text-sm">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-semibold mb-1 text-slate-300">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#213743] text-white border border-[#213743] rounded px-4 py-2.5 focus:outline-none focus:border-[#00e701]/50 transition"
              placeholder="Enter username"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold mb-1 text-slate-300">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#213743] text-white border border-[#213743] rounded px-4 py-2.5 focus:outline-none focus:border-[#00e701]/50 transition"
              placeholder="Enter password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#00e701] hover:bg-[#00c701] text-[#0f212e] font-bold py-3 rounded transition mt-4 disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : (isLogin ? 'Play Now' : 'Create Account')}
          </button>
        </form>
        
        <div className="p-4 text-center border-t border-white/5 text-sm">
          <span className="text-slate-400">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </span>
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-white hover:text-[#00e701] font-semibold transition"
          >
            {isLogin ? 'Register' : 'Log In'}
          </button>
        </div>
      </div>
    </div>
  );
};
