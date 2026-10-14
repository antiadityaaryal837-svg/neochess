import React, { useState } from 'react';
import { X, User, Lock, Mail, Globe, Zap, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../store/authStore.js';
import { api } from '../../services/api.js';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, authModalMode, closeAuthModal, setAuth } = useAuthStore();
  const [isLogin, setIsLogin] = useState(authModalMode === 'login');

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('US');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const res = await api.login({ usernameOrEmail: username, password });
        setAuth(res.token, res.user);
        closeAuthModal();
      } else {
        const res = await api.register({ username, email, password, country });
        setAuth(res.token, res.user);
        closeAuthModal();
      }
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.guest();
      setAuth(res.token, res.user);
      closeAuthModal();
    } catch (err: any) {
      setError(err.message || 'Guest session initialization failed');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickAccount = (u: string, p: string) => {
    setIsLogin(true);
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#262522] border border-[#3c3934] rounded-2xl p-6 shadow-chess-lg">
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#312e2b] transition-colors"
        >
          <X size={20} />
        </button>

        {/* Header Tabs */}
        <div className="flex border-b border-[#312e2b] mb-6">
          <button
            onClick={() => {
              setIsLogin(true);
              setError(null);
            }}
            className={`flex-1 pb-3 text-sm font-bold transition-all border-b-2 ${
              isLogin ? 'border-[#81b64c] text-white' : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Log In
          </button>
          <button
            onClick={() => {
              setIsLogin(false);
              setError(null);
            }}
            className={`flex-1 pb-3 text-sm font-bold transition-all border-b-2 ${
              !isLogin ? 'border-[#81b64c] text-white' : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Demo Fast Login Buttons */}
        <div className="mb-5 p-3 bg-[#1e1d1a] rounded-xl border border-[#312e2b]">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <ShieldCheck size={13} className="text-[#81b64c]" /> Quick Demo Accounts:
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => fillQuickAccount('admin', 'AdminPass123!')}
              className="px-2 py-1.5 bg-[#2b2926] hover:bg-[#383531] text-amber-400 font-semibold rounded border border-[#3c3934] transition-all truncate"
            >
              Admin GM
            </button>
            <button
              type="button"
              onClick={() => fillQuickAccount('magnus_test', 'ChessPass123!')}
              className="px-2 py-1.5 bg-[#2b2926] hover:bg-[#383531] text-sky-400 font-semibold rounded border border-[#3c3934] transition-all truncate"
            >
              Magnus
            </button>
            <button
              type="button"
              onClick={() => fillQuickAccount('alex_club', 'ChessPass123!')}
              className="px-2 py-1.5 bg-[#2b2926] hover:bg-[#383531] text-emerald-400 font-semibold rounded border border-[#3c3934] transition-all truncate"
            >
              Alex (Club)
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/50 border border-red-500/40 text-red-200 text-xs rounded-xl">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              {isLogin ? 'Username or Email' : 'Username'}
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={isLogin ? 'admin or email' : 'Choose username'}
                required
                className="w-full bg-[#1e1d1a] border border-[#3c3934] rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-[#81b64c] transition-colors"
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full bg-[#1e1d1a] border border-[#3c3934] rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-[#81b64c] transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-[#1e1d1a] border border-[#3c3934] rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-[#81b64c] transition-colors"
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Country</label>
              <div className="relative">
                <Globe size={16} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value.toUpperCase())}
                  placeholder="US, NO, GB, etc."
                  maxLength={3}
                  className="w-full bg-[#1e1d1a] border border-[#3c3934] rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-[#81b64c] transition-colors"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-[#81b64c] hover:bg-[#95c65a] text-white font-bold text-sm rounded-xl shadow-glow-green flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <span>{isLogin ? 'Log In' : 'Create Free Account'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="w-full border-t border-[#312e2b]" />
          <span className="absolute bg-[#262522] px-2 text-[11px] text-gray-400 uppercase tracking-wider">
            Or
          </span>
        </div>

        {/* Instant Guest Play Button */}
        <button
          onClick={handleGuestLogin}
          disabled={loading}
          className="w-full py-2 px-4 bg-[#1e1d1a] hover:bg-[#2e2c28] text-gray-200 font-semibold text-xs rounded-xl border border-[#3c3934] flex items-center justify-center gap-2 transition-all"
        >
          <Zap size={15} className="text-amber-400" />
          <span>Play Instantly as Guest (No Sign Up)</span>
        </button>
      </div>
    </div>
  );
};
