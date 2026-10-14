import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { ShieldAlert, Users, Swords, Puzzle, CheckCircle, Ban, RefreshCw, Activity } from 'lucide-react';
import { useAuthStore } from '../store/authStore.js';

export const AdminPage: React.FC = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, u] = await Promise.all([api.getAdminStats(), api.getAdminUsers(1)]);
      setStats(s);
      setUsers(u.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBanToggle = async (userId: string, isBanned: boolean) => {
    try {
      if (isBanned) {
        await api.unbanUser(userId);
      } else {
        await api.banUser(userId);
      }
      loadData();
    } catch (err: any) {
      alert(err.message || 'Operation failed');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="p-8 text-center text-red-400 font-bold">
        Access Denied. Administrator credentials required.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="text-red-400" size={28} /> Platform Administration & Security
          </h1>
          <p className="text-sm text-gray-400">
            Real-time player moderation, user bans, game telemetry, and audit management.
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#262522] hover:bg-[#312e2b] text-gray-300 text-xs font-semibold rounded-xl border border-[#3c3934]"
        >
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Metrics Row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-[#262522] border border-[#3c3934] rounded-2xl shadow-chess space-y-1">
            <div className="flex items-center gap-2 text-xs text-gray-400 font-semibold">
              <Users size={16} className="text-[#81b64c]" />
              <span>Total Users</span>
            </div>
            <div className="text-2xl font-black font-mono text-white">{stats.totalUsers}</div>
          </div>

          <div className="p-4 bg-[#262522] border border-[#3c3934] rounded-2xl shadow-chess space-y-1">
            <div className="flex items-center gap-2 text-xs text-gray-400 font-semibold">
              <Swords size={16} className="text-amber-400" />
              <span>Games Played</span>
            </div>
            <div className="text-2xl font-black font-mono text-white">{stats.totalGames}</div>
          </div>

          <div className="p-4 bg-[#262522] border border-[#3c3934] rounded-2xl shadow-chess space-y-1">
            <div className="flex items-center gap-2 text-xs text-gray-400 font-semibold">
              <Puzzle size={16} className="text-purple-400" />
              <span>Puzzles Solved</span>
            </div>
            <div className="text-2xl font-black font-mono text-white">{stats.totalAttempts}</div>
          </div>

          <div className="p-4 bg-[#262522] border border-[#3c3934] rounded-2xl shadow-chess space-y-1">
            <div className="flex items-center gap-2 text-xs text-gray-400 font-semibold">
              <Activity size={16} className="text-cyan-400" />
              <span>Live Games</span>
            </div>
            <div className="text-2xl font-black font-mono text-white">{stats.activeGames}</div>
          </div>
        </div>
      )}

      {/* User Moderation Table */}
      <div className="p-6 bg-[#262522] border border-[#3c3934] rounded-2xl shadow-chess space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Users size={18} className="text-[#81b64c]" /> Player Accounts & Moderation
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#312e2b] text-gray-400 font-bold uppercase tracking-wider">
                <th className="pb-3">User</th>
                <th className="pb-3">Email</th>
                <th className="pb-3">Role</th>
                <th className="pb-3">Tier</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#312e2b]">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-[#2b2926] transition-colors">
                  <td className="py-3 flex items-center gap-2.5 font-bold text-white">
                    <img
                      src={u.profile?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username}`}
                      alt={u.username}
                      className="w-7 h-7 rounded-lg bg-[#1e1d1a] object-cover"
                    />
                    <span>{u.username}</span>
                  </td>
                  <td className="py-3 text-gray-400 font-mono">{u.email}</td>
                  <td className="py-3 capitalize text-gray-300 font-semibold">{u.role}</td>
                  <td className="py-3 uppercase font-bold text-amber-400 text-[10px]">
                    {u.membershipTier}
                  </td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        u.isBanned ? 'bg-red-500/20 text-red-400' : 'bg-[#81b64c]/20 text-[#81b64c]'
                      }`}
                    >
                      {u.isBanned ? 'Suspended' : 'Active'}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => handleBanToggle(u.id, u.isBanned)}
                      disabled={u.id === user?.id}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all disabled:opacity-30 ${
                        u.isBanned
                          ? 'bg-[#81b64c] hover:bg-[#95c65a] text-white'
                          : 'bg-red-600 hover:bg-red-700 text-white'
                      }`}
                    >
                      {u.isBanned ? 'Unban' : 'Suspend'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
