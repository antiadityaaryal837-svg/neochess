import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { Users, Shield, Check, UserPlus } from 'lucide-react';
import { useAuthStore } from '../store/authStore.js';

export const ClubsPage: React.FC = () => {
  const { isAuthenticated, openAuthModal } = useAuthStore();
  const [clubs, setClubs] = useState<any[]>([]);
  const [joinedClubs, setJoinedClubs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    api.getClubs().then((res) => setClubs(res.clubs)).catch(console.error);
  }, []);

  const handleJoin = async (slug: string) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    try {
      await api.joinClub(slug);
      setJoinedClubs((prev) => ({ ...prev, [slug]: true }));
      // Refresh
      const res = await api.getClubs();
      setClubs(res.clubs);
    } catch (err: any) {
      alert(err.message || 'Failed to join club');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Users className="text-[#81b64c]" size={28} /> Chess Clubs & Communities
        </h1>
        <p className="text-sm text-gray-400">
          Connect with like-minded chess players, participate in internal club battles, and share strategies.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clubs.map((club) => {
          const isJoined = joinedClubs[club.slug];
          return (
            <div
              key={club.id}
              className="p-6 bg-[#262522] border border-[#3c3934] hover:border-[#504c46] rounded-2xl shadow-chess flex flex-col justify-between transition-all"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3.5">
                  <img
                    src={club.avatarUrl || 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=150&q=80'}
                    alt={club.name}
                    className="w-14 h-14 rounded-2xl object-cover border border-[#3c3934]"
                  />
                  <div>
                    <h3 className="font-bold text-white text-base leading-snug">{club.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Users size={13} className="text-[#81b64c]" /> {club.memberCount} Members
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed">{club.description}</p>
              </div>

              <div className="pt-4 mt-4 border-t border-[#312e2b] flex items-center justify-between">
                <span className="text-[11px] text-gray-400">Owner: {club.owner?.username}</span>
                <button
                  onClick={() => handleJoin(club.slug)}
                  disabled={isJoined}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    isJoined
                      ? 'bg-[#81b64c]/20 text-[#81b64c] border border-[#81b64c]/40 cursor-default'
                      : 'bg-[#81b64c] hover:bg-[#95c65a] text-white shadow-glow-green'
                  }`}
                >
                  {isJoined ? (
                    <>
                      <Check size={14} /> Joined
                    </>
                  ) : (
                    <>
                      <UserPlus size={14} /> Join Club
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
