import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { Trophy, Flame, Zap, Clock, Puzzle, ShieldCheck } from 'lucide-react';

export const LeaderboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [category, setCategory] = useState<'bullet' | 'blitz' | 'rapid' | 'classical' | 'puzzles'>('blitz');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getLeaderboard(category)
      .then((res) => setLeaderboard(res.leaderboard))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [category]);

  const categories = [
    { id: 'bullet', name: 'Bullet', icon: Zap },
    { id: 'blitz', name: 'Blitz', icon: Flame },
    { id: 'rapid', name: 'Rapid', icon: Clock },
    { id: 'classical', name: 'Classical', icon: ShieldCheck },
    { id: 'puzzles', name: 'Puzzles', icon: Puzzle },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Trophy className="text-amber-400" size={28} /> Global Leaderboards
        </h1>
        <p className="text-sm text-gray-400">
          Top-rated players across standard time controls and tactical puzzles.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => {
          const isSelected = category === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setCategory(c.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isSelected
                  ? 'bg-[#81b64c] text-white shadow-glow-green'
                  : 'bg-[#262522] text-gray-300 hover:text-white border border-[#3c3934]'
              }`}
            >
              <c.icon size={15} />
              <span>{c.name}</span>
            </button>
          );
        })}
      </div>

      {/* Leaderboard Table */}
      <div className="bg-[#262522] border border-[#3c3934] rounded-2xl shadow-chess overflow-hidden">
        <div className="grid grid-cols-12 px-6 py-3.5 bg-[#1e1d1a] border-b border-[#312e2b] text-xs font-bold uppercase tracking-wider text-gray-400">
          <div className="col-span-1 text-center">Rank</div>
          <div className="col-span-8">Player</div>
          <div className="col-span-3 text-right">Rating</div>
        </div>

        <div className="divide-y divide-[#312e2b]">
          {leaderboard.map((item) => (
            <div
              key={item.userId}
              onClick={() => navigate(`/profile/${item.username}`)}
              className="grid grid-cols-12 items-center px-6 py-3.5 hover:bg-[#2e2c28] cursor-pointer transition-colors text-sm"
            >
              <div className="col-span-1 text-center font-bold font-mono text-gray-400">
                {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : `#${item.rank}`}
              </div>

              <div className="col-span-8 flex items-center gap-3">
                <img
                  src={item.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${item.username}`}
                  alt={item.username}
                  className="w-10 h-10 rounded-xl bg-[#1e1d1a] object-cover border border-[#3c3934]"
                />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white hover:text-[#81b64c] transition-colors">
                      {item.displayName || item.username}
                    </span>
                    {item.title && (
                      <span className="px-1 text-[9px] font-black bg-amber-500 text-black rounded">
                        {item.title}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 font-medium">@{item.username} • {item.country}</span>
                </div>
              </div>

              <div className="col-span-3 text-right font-mono font-bold text-base text-[#81b64c]">
                {item.rating}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
