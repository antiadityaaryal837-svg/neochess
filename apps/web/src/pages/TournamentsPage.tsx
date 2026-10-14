import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { Trophy, Users, Clock, Swords, CheckCircle2, Plus } from 'lucide-react';
import { useAuthStore } from '../store/authStore.js';

export const TournamentsPage: React.FC = () => {
  const { isAuthenticated, openAuthModal } = useAuthStore();
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<any>(null);
  const [joinedMap, setJoinedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      const res = await api.getTournaments();
      setTournaments(res.tournaments);
      if (res.tournaments.length > 0) {
        loadTournamentDetails(res.tournaments[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadTournamentDetails = async (id: string) => {
    try {
      const res = await api.getTournament(id);
      setSelectedTournament(res.tournament);
    } catch (err) {
      console.error(err);
    }
  };

  const handleJoin = async (id: string) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    try {
      await api.joinTournament(id);
      setJoinedMap((prev) => ({ ...prev, [id]: true }));
      loadTournamentDetails(id);
    } catch (err: any) {
      alert(err.message || 'Failed to join tournament');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Trophy className="text-amber-400" size={28} /> Online Chess Tournaments
          </h1>
          <p className="text-sm text-gray-400">
            Compete in fast-paced Arena battles or traditional Swiss championship rounds.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Tournaments List (6 cols) */}
        <div className="lg:col-span-6 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Upcoming Events</span>
          {tournaments.map((t) => {
            const isSelected = selectedTournament?.id === t.id;
            const isJoined = joinedMap[t.id];
            return (
              <div
                key={t.id}
                onClick={() => loadTournamentDetails(t.id)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#2b2926] border-[#81b64c] shadow-md'
                    : 'bg-[#262522] border-[#3c3934] hover:border-[#504c46]'
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <h3 className="font-bold text-white text-base">{t.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{t.description}</p>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-mono font-bold bg-[#81b64c]/20 text-[#81b64c] rounded-lg border border-[#81b64c]/30">
                    {t.timeControl}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#312e2b] text-xs text-gray-400">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <Users size={14} className="text-gray-400" />
                      {t._count?.players || 1} / {t.maxPlayers} Players
                    </span>
                    <span className="capitalize px-1.5 py-0.5 rounded bg-zinc-800 text-gray-300">
                      {t.status}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleJoin(t.id);
                    }}
                    disabled={isJoined}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isJoined
                        ? 'bg-[#81b64c]/20 text-[#81b64c] border border-[#81b64c]/40 cursor-default'
                        : 'bg-[#81b64c] hover:bg-[#95c65a] text-white shadow-glow-green'
                    }`}
                  >
                    {isJoined ? 'Registered' : 'Join'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Tournament Standings & Roster (6 cols) */}
        {selectedTournament && (
          <div className="lg:col-span-6 p-6 bg-[#262522] border border-[#3c3934] rounded-2xl shadow-chess space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-white">{selectedTournament.name}</h2>
                <div className="text-xs text-gray-400 mt-0.5">
                  Organized by {selectedTournament.createdBy?.username || 'Admin'}
                </div>
              </div>
              <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold rounded-xl uppercase">
                {selectedTournament.variant}
              </span>
            </div>

            {/* Standings Table */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Live Standings & Roster
              </span>
              <div className="space-y-1.5 max-h-80 overflow-y-auto">
                {selectedTournament.players?.map((p: any, idx: number) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2.5 bg-[#1e1d1a] border border-[#312e2b] rounded-xl text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-5 font-bold font-mono text-gray-400">#{idx + 1}</span>
                      <img
                        src={p.user?.profile?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${p.user?.username}`}
                        alt={p.user?.username}
                        className="w-7 h-7 rounded-lg bg-[#2b2926] object-cover"
                      />
                      <span className="font-bold text-white">{p.user?.username}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-gray-400">{p.user?.ratings?.blitz || 1200}</span>
                      <span className="font-bold font-mono text-[#81b64c] bg-[#81b64c]/10 px-2 py-0.5 rounded">
                        {p.points.toFixed(1)} pts
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
