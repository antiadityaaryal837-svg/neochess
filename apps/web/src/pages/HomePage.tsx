import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  Flame,
  Clock,
  Swords,
  Bot,
  Puzzle,
  GraduationCap,
  Trophy,
  ArrowRight,
  TrendingUp,
  Award,
  Loader2,
} from 'lucide-react';
import { useGameStore } from '../store/gameStore.js';
import { useAuthStore } from '../store/authStore.js';
import { api } from '../services/api.js';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { startMatchmaking, isSearchingMatch, matchQueueStatus, cancelMatchmaking } = useGameStore();
  const { user, isAuthenticated, openAuthModal } = useAuthStore();

  const [dailyPuzzle, setDailyPuzzle] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    api.getDailyPuzzle().then((res) => setDailyPuzzle(res.puzzle)).catch(() => {});
    api.getLeaderboard('blitz').then((res) => setLeaderboard(res.leaderboard.slice(0, 5))).catch(() => {});
  }, []);

  const timeControlCards = [
    { tc: '1+0', name: '1 min', type: 'Bullet', icon: Zap, color: 'text-amber-400' },
    { tc: '2+1', name: '2 | 1', type: 'Bullet', icon: Zap, color: 'text-amber-400' },
    { tc: '3+0', name: '3 min', type: 'Blitz', icon: Flame, color: 'text-orange-400', popular: true },
    { tc: '3+2', name: '3 | 2', type: 'Blitz', icon: Flame, color: 'text-orange-400' },
    { tc: '5+0', name: '5 min', type: 'Blitz', icon: Flame, color: 'text-orange-400' },
    { tc: '10+0', name: '10 min', type: 'Rapid', icon: Clock, color: 'text-[#81b64c]', popular: true },
  ];

  const handleStartGame = (tc: string) => {
    startMatchmaking(tc, true);
    navigate(`/play?tc=${tc}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Top Banner / Matchmaking Status */}
      {isSearchingMatch && (
        <div className="p-4 bg-[#81b64c]/20 border border-[#81b64c]/40 rounded-2xl flex items-center justify-between shadow-glow-green">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#81b64c]" />
            <div>
              <h3 className="font-bold text-white text-base">Searching for Opponent...</h3>
              <p className="text-xs text-gray-300">
                Time control: <span className="font-mono font-bold text-[#81b64c]">{matchQueueStatus?.timeControl}</span>
              </p>
            </div>
          </div>
          <button
            onClick={cancelMatchmaking}
            className="px-4 py-2 bg-[#2b2926] hover:bg-[#363430] text-gray-200 text-xs font-bold rounded-xl border border-[#3c3934] transition-all"
          >
            Cancel Queue
          </button>
        </div>
      )}

      {/* Main Grid: Left Quick Play + Right Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Play section (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 bg-[#262522] border border-[#3c3934] rounded-2xl shadow-chess">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <Swords className="text-[#81b64c]" size={26} /> Play Chess Online
                </h1>
                <p className="text-sm text-gray-400">
                  Select a time control to automatically match with players at your rating level.
                </p>
              </div>
            </div>

            {/* Time Controls Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {timeControlCards.map((item) => (
                <button
                  key={item.tc}
                  onClick={() => handleStartGame(item.tc)}
                  className="relative p-4 rounded-xl bg-[#1e1d1a] hover:bg-[#2e2c28] border border-[#363430] hover:border-[#81b64c] transition-all text-left group"
                >
                  {item.popular && (
                    <span className="absolute top-2 right-2 px-1.5 py-0.5 text-[9px] font-black uppercase rounded bg-[#81b64c]/20 text-[#81b64c] border border-[#81b64c]/30">
                      Popular
                    </span>
                  )}
                  <div className="flex items-center gap-2 mb-1">
                    <item.icon className={item.color} size={18} />
                    <span className="text-xs text-gray-400 font-semibold">{item.type}</span>
                  </div>
                  <div className="text-xl font-bold font-mono text-white group-hover:text-[#81b64c] transition-colors">
                    {item.name}
                  </div>
                </button>
              ))}
            </div>

            {/* Quick Action Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-[#312e2b]">
              <button
                onClick={() => navigate('/bots')}
                className="flex items-center justify-between p-3.5 rounded-xl bg-[#2e2c28] hover:bg-[#383531] border border-[#3c3934] transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <Bot size={22} />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                      Play Computer
                    </div>
                    <div className="text-xs text-gray-400">Challenge adaptive bots from 400 to 3200</div>
                  </div>
                </div>
                <ArrowRight size={18} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => navigate('/analysis')}
                className="flex items-center justify-between p-3.5 rounded-xl bg-[#2e2c28] hover:bg-[#383531] border border-[#3c3934] transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <GraduationCap size={22} />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                      Analysis Board
                    </div>
                    <div className="text-xs text-gray-400">Deep Stockfish engine evaluation</div>
                  </div>
                </div>
                <ArrowRight size={18} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Daily Puzzle Card */}
          {dailyPuzzle && (
            <div className="p-6 bg-[#262522] border border-[#3c3934] rounded-2xl shadow-chess flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-xs font-black rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wider">
                    Daily Tactical Puzzle
                  </span>
                  <span className="text-xs text-gray-400 font-mono font-bold">Rating: {dailyPuzzle.rating}</span>
                </div>
                <h3 className="text-xl font-bold text-white">Sharpen Your Calculation</h3>
                <p className="text-sm text-gray-300 max-w-lg">
                  {dailyPuzzle.description || 'Find the optimal combination to deliver decisive tactical advantage.'}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {dailyPuzzle.themes?.map((t: string) => (
                    <span key={t} className="px-2 py-0.5 text-[11px] font-semibold bg-[#1e1d1a] text-gray-300 rounded border border-[#363430]">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => navigate('/puzzles')}
                className="w-full sm:w-auto px-6 py-3 bg-[#81b64c] hover:bg-[#95c65a] text-white font-bold rounded-xl shadow-glow-green flex items-center justify-center gap-2 transition-all shrink-0"
              >
                <Puzzle size={18} />
                <span>Solve Puzzle</span>
              </button>
            </div>
          )}
        </div>

        {/* Sidebar Widgets (1 col) */}
        <div className="space-y-6">
          {/* Top Leaderboard Card */}
          <div className="p-5 bg-[#262522] border border-[#3c3934] rounded-2xl shadow-chess">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trophy size={18} className="text-amber-400" />
                <h3 className="text-base font-bold text-white">Top Grandmasters</h3>
              </div>
              <button
                onClick={() => navigate('/leaderboard')}
                className="text-xs text-[#81b64c] hover:underline font-semibold"
              >
                View All
              </button>
            </div>

            <div className="space-y-2">
              {leaderboard.map((player) => (
                <div
                  key={player.userId}
                  onClick={() => navigate(`/profile/${player.username}`)}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-[#2e2c28] cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 text-center font-bold text-xs text-gray-400">
                      #{player.rank}
                    </span>
                    <img
                      src={player.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${player.username}`}
                      alt={player.username}
                      className="w-8 h-8 rounded-lg bg-[#1e1d1a] border border-[#3c3934]"
                    />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">{player.username}</span>
                        {player.title && (
                          <span className="px-1 text-[9px] font-black bg-amber-500 text-black rounded">
                            {player.title}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400">{player.country}</span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-xs text-[#81b64c]">{player.rating}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Featured Bot Challenge */}
          <div className="p-5 bg-gradient-to-br from-[#262522] to-[#1e1d1a] border border-[#3c3934] rounded-2xl shadow-chess">
            <div className="flex items-center gap-3 mb-3">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
                alt="Nelson Bot"
                className="w-12 h-12 rounded-xl object-cover border border-[#81b64c]/40"
              />
              <div>
                <h4 className="text-sm font-bold text-white">Bot of the Day: Nelson</h4>
                <div className="text-xs text-amber-400 font-semibold">1300 Rating • Queen Attacker</div>
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-4 italic">
              "Watch out for my early Queen attacks! Think you can survive scholar mate tactics?"
            </p>
            <button
              onClick={() => navigate('/play?bot=bot_nelson')}
              className="w-full py-2 px-3 bg-[#312e2b] hover:bg-[#3d3a36] text-white font-bold text-xs rounded-xl border border-[#3c3934] flex items-center justify-center gap-2 transition-all"
            >
              <Bot size={15} />
              <span>Challenge Nelson</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
