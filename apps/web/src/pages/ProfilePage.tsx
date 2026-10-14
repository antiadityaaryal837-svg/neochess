import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { User, Flame, Zap, Clock, ShieldCheck, Puzzle, Trophy, Award, Microscope } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (username) {
      setLoading(true);
      api.getUserProfile(username)
        .then((res) => setProfileData(res.user))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [username]);

  if (loading) {
    return <div className="p-8 text-center text-gray-400">Loading player profile...</div>;
  }

  if (!profileData) {
    return <div className="p-8 text-center text-red-400">Player profile not found.</div>;
  }

  const { profile, ratings, stats, recentGames, membershipTier } = profileData;

  const ratingCategories = [
    { label: 'Bullet', value: ratings?.bullet || 1200, icon: Zap, color: 'text-amber-400' },
    { label: 'Blitz', value: ratings?.blitz || 1200, icon: Flame, color: 'text-orange-400' },
    { label: 'Rapid', value: ratings?.rapid || 1200, icon: Clock, color: 'text-[#81b64c]' },
    { label: 'Classical', value: ratings?.classical || 1200, icon: ShieldCheck, color: 'text-sky-400' },
    { label: 'Puzzles', value: ratings?.puzzles || 1200, icon: Puzzle, color: 'text-purple-400' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Header Profile Card */}
      <div className="p-6 bg-[#262522] border border-[#3c3934] rounded-2xl shadow-chess flex flex-col md:flex-row items-center gap-6">
        <img
          src={profile?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${profileData.username}`}
          alt={profileData.username}
          className="w-24 h-24 rounded-2xl bg-[#1e1d1a] object-cover border-2 border-[#81b64c]"
        />

        <div className="flex-1 text-center md:text-left space-y-2">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <h1 className="text-2xl font-black text-white">{profile?.displayName || profileData.username}</h1>
            {profile?.title && (
              <span className="px-1.5 py-0.5 text-xs font-black bg-amber-500 text-black rounded">
                {profile.title}
              </span>
            )}
            <span className="px-2 py-0.5 text-[11px] font-bold uppercase rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {membershipTier} Member
            </span>
          </div>

          <p className="text-xs text-gray-400">@{profileData.username} • Country: {profile?.country || 'US'}</p>
          {profile?.bio && <p className="text-xs text-gray-300 max-w-xl">{profile.bio}</p>}
        </div>

        {/* Win Rate Stats Ring */}
        <div className="p-4 bg-[#1e1d1a] border border-[#312e2b] rounded-xl flex items-center gap-4 text-center">
          <div>
            <div className="text-xs text-gray-400">Games</div>
            <div className="font-mono font-bold text-white text-lg">{stats.totalGames}</div>
          </div>
          <div className="w-[1px] h-8 bg-[#312e2b]" />
          <div>
            <div className="text-xs text-gray-400">Win Rate</div>
            <div className="font-mono font-bold text-[#81b64c] text-lg">{stats.winRate}%</div>
          </div>
          <div className="w-[1px] h-8 bg-[#312e2b]" />
          <div>
            <div className="text-xs text-gray-400">Record (W/L/D)</div>
            <div className="font-mono font-bold text-gray-300 text-xs">
              {stats.wins} / {stats.losses} / {stats.draws}
            </div>
          </div>
        </div>
      </div>

      {/* Ratings Breakdown Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {ratingCategories.map((c) => (
          <div key={c.label} className="p-4 bg-[#262522] border border-[#3c3934] rounded-xl text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 font-semibold">
              <c.icon size={15} className={c.color} />
              <span>{c.label}</span>
            </div>
            <div className="font-mono font-bold text-xl text-white">{c.value}</div>
          </div>
        ))}
      </div>

      {/* Recent Games List */}
      <div className="p-6 bg-[#262522] border border-[#3c3934] rounded-2xl shadow-chess space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Trophy size={18} className="text-[#81b64c]" /> Recent Match History
        </h3>

        {recentGames?.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-xs">No recent completed games found.</div>
        ) : (
          <div className="space-y-2">
            {recentGames.map((g: any) => {
              const isWhite = g.whitePlayerId === profileData.id;
              const opponent = isWhite ? g.blackPlayer : g.whitePlayer;
              const opponentName = opponent?.username || (isWhite ? g.blackBotName : g.whiteBotName) || 'Opponent';
              const playerWon = (g.result === '1-0' && isWhite) || (g.result === '0-1' && !isWhite);
              const isDraw = g.result === '1/2-1/2';

              return (
                <div
                  key={g.id}
                  className="flex items-center justify-between p-3 bg-[#1e1d1a] border border-[#312e2b] rounded-xl text-xs hover:border-[#504c46] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                        playerWon
                          ? 'bg-[#81b64c]/20 text-[#81b64c]'
                          : isDraw
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {playerWon ? 'Won' : isDraw ? 'Draw' : 'Loss'}
                    </span>
                    <div>
                      <span className="font-bold text-white">vs {opponentName}</span>
                      <span className="text-gray-400 ml-2 font-mono">{g.timeControl}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-gray-400">{g.result}</span>
                    <button
                      onClick={() => navigate(`/analysis?gameId=${g.id}`)}
                      className="p-1.5 rounded-lg bg-[#2b2926] hover:bg-[#363430] text-gray-300 hover:text-white transition-colors"
                      title="Review game"
                    >
                      <Microscope size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
