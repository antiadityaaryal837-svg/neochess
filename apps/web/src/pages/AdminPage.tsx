import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import {
  ShieldAlert,
  Users,
  Swords,
  Puzzle,
  CheckCircle,
  Ban,
  RefreshCw,
  Activity,
  Settings,
  FileText,
  AlertTriangle,
  Server,
  Search,
  Filter,
  UserCheck,
  UserX,
  Trash2,
  Edit2,
  Eye,
  StopCircle,
  Plus,
  Radio,
  Clock,
  Database,
  Cpu,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore.js';

export const AdminPage: React.FC = () => {
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'games' | 'config' | 'content' | 'moderation' | 'system'>('dashboard');
  const [loading, setLoading] = useState<boolean>(true);

  // Dashboard Stats
  const [stats, setStats] = useState<any>(null);

  // Users State
  const [users, setUsers] = useState<any[]>([]);
  const [userPage, setUserPage] = useState<number>(1);
  const [userTotalPages, setUserTotalPages] = useState<number>(1);
  const [userSearch, setUserSearch] = useState<string>('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('');
  const [userStatusFilter, setUserStatusFilter] = useState<string>('');
  const [selectedUserDetail, setSelectedUserDetail] = useState<any | null>(null);
  const [editingUser, setEditingUser] = useState<any | null>(null);

  // Games State
  const [games, setGames] = useState<any[]>([]);
  const [gameStatusFilter, setGameStatusFilter] = useState<string>('');
  const [gameSearch, setGameSearch] = useState<string>('');
  const [inspectingGame, setInspectingGame] = useState<any | null>(null);

  // Config State
  const [config, setConfig] = useState<any>({
    allowRegistrations: true,
    maintenanceMode: false,
    announcement: '',
    puzzlesEnabled: true,
    tournamentsEnabled: true,
    matchmakingRatingRange: 200,
  });
  const [configSaved, setConfigSaved] = useState<boolean>(false);

  // Content (Puzzles) State
  const [puzzles, setPuzzles] = useState<any[]>([]);
  const [newPuzzleFen, setNewPuzzleFen] = useState<string>('');
  const [newPuzzleMoves, setNewPuzzleMoves] = useState<string>('');
  const [newPuzzleRating, setNewPuzzleRating] = useState<number>(1500);

  // Moderation State
  const [reports, setReports] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // System State
  const [systemMetrics, setSystemMetrics] = useState<any>(null);

  const isSuperAdmin = user?.role === 'superadmin';
  const isAdmin = user?.role === 'admin' || isSuperAdmin;
  const isModerator = user?.role === 'moderator' || isAdmin;

  useEffect(() => {
    if (isModerator) {
      loadInitialData();
    }
  }, [isModerator]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const s = await api.getAdminStats();
      setStats(s);
      loadUsers(1);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async (page: number = 1) => {
    try {
      const res = await api.getAdminUsers(page, userSearch, userRoleFilter, userStatusFilter);
      setUsers(res.users);
      setUserPage(res.pagination.page);
      setUserTotalPages(res.pagination.totalPages);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const loadGames = async (status: string = '', search: string = '') => {
    try {
      const res = await api.getAdminGames(1, status, search);
      setGames(res.games);
    } catch (err) {
      console.error('Failed to load games:', err);
    }
  };

  const loadConfig = async () => {
    try {
      const res = await api.getPlatformConfig();
      if (res.config) setConfig(res.config);
    } catch (err) {
      console.error('Failed to load config:', err);
    }
  };

  const loadContent = async () => {
    try {
      const res = await api.getAdminPuzzles(1);
      setPuzzles(res.puzzles);
    } catch (err) {
      console.error('Failed to load puzzles:', err);
    }
  };

  const loadModeration = async () => {
    try {
      const [r, a] = await Promise.all([api.getAdminReports(), api.getAdminAuditLogs(50)]);
      setReports(r.reports);
      setAuditLogs(a.logs);
    } catch (err) {
      console.error('Failed to load moderation:', err);
    }
  };

  const loadSystem = async () => {
    try {
      const res = await api.getAdminSystem();
      setSystemMetrics(res.system);
    } catch (err) {
      console.error('Failed to load system metrics:', err);
    }
  };

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (tab === 'dashboard') loadInitialData();
    if (tab === 'users') loadUsers(userPage);
    if (tab === 'games') loadGames(gameStatusFilter, gameSearch);
    if (tab === 'config') loadConfig();
    if (tab === 'content') loadContent();
    if (tab === 'moderation') loadModeration();
    if (tab === 'system') loadSystem();
  };

  const handleBanToggle = async (userId: string, isBanned: boolean) => {
    try {
      if (isBanned) {
        await api.unsuspendUser(userId);
      } else {
        const reason = prompt('Reason for suspension (optional):') || 'Violation of fair play or terms';
        await api.suspendUser(userId, reason);
      }
      loadUsers(userPage);
    } catch (err: any) {
      alert(err.message || 'Operation failed');
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!isSuperAdmin) {
      alert('Only Super Admin can change user roles.');
      return;
    }
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;

    try {
      await api.updateAdminUserRole(userId, newRole);
      alert('User role updated successfully');
      loadUsers(userPage);
    } catch (err: any) {
      alert(err.message || 'Failed to update user role');
    }
  };

  const handleDeleteUser = async (targetUser: any) => {
    if (!isSuperAdmin) {
      alert('Only Super Admin can permanently delete user accounts.');
      return;
    }
    if (!confirm(`DANGER: Are you sure you want to PERMANENTLY DELETE user "${targetUser.username}"? This cannot be undone.`)) return;

    try {
      await api.deleteUser(targetUser.id);
      alert(`User ${targetUser.username} was deleted.`);
      loadUsers(userPage);
      setSelectedUserDetail(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    }
  };

  const handleSaveConfig = async () => {
    try {
      await api.updatePlatformConfig(config);
      setConfigSaved(true);
      setTimeout(() => setConfigSaved(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update platform settings');
    }
  };

  const handleTerminateGame = async (gameId: string) => {
    const reason = prompt('Reason for terminating this game:') || 'Abusive or disconnected state';
    try {
      await api.terminateGame(gameId, reason);
      alert('Game terminated with audit log');
      loadGames(gameStatusFilter, gameSearch);
      setInspectingGame(null);
    } catch (err: any) {
      alert(err.message || 'Failed to terminate game');
    }
  };

  const handleCreatePuzzle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPuzzleFen || !newPuzzleMoves) {
      alert('Please enter FEN and solution moves');
      return;
    }
    try {
      await api.createAdminPuzzle({
        fen: newPuzzleFen,
        moves: newPuzzleMoves,
        rating: newPuzzleRating,
      });
      alert('Puzzle created successfully');
      setNewPuzzleFen('');
      setNewPuzzleMoves('');
      loadContent();
    } catch (err: any) {
      alert(err.message || 'Failed to create puzzle');
    }
  };

  const handleDeletePuzzle = async (id: string) => {
    if (!confirm('Are you sure you want to remove this puzzle?')) return;
    try {
      await api.deleteAdminPuzzle(id);
      loadContent();
    } catch (err: any) {
      alert(err.message || 'Failed to delete puzzle');
    }
  };

  const handleResolveReport = async (reportId: string, status: string) => {
    const actionTaken = prompt(`Action taken for this report (${status}):`) || '';
    try {
      await api.resolveAdminReport(reportId, status, actionTaken);
      loadModeration();
    } catch (err: any) {
      alert(err.message || 'Failed to update report');
    }
  };

  if (!isModerator) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 bg-[#262522] border border-red-500/30 rounded-2xl text-center space-y-4">
        <ShieldAlert size={48} className="text-red-400 mx-auto" />
        <h2 className="text-lg font-black text-white">Access Denied</h2>
        <p className="text-xs text-gray-400">
          This area is restricted to NeoChess Administrators and Staff.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#312e2b]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <ShieldAlert className="text-red-400" size={28} /> Control Center & Administration
            </h1>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
              isSuperAdmin ? 'bg-purple-900/60 text-purple-300 border border-purple-500/40' :
              isAdmin ? 'bg-red-900/60 text-red-300 border border-red-500/40' :
              'bg-blue-900/60 text-blue-300 border border-blue-500/40'
            }`}>
              {user?.role}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Authoritative player management, game moderation, platform configuration, and telemetry.
          </p>
        </div>

        <button
          onClick={() => handleTabChange(activeTab)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#262522] hover:bg-[#312e2b] text-gray-300 text-xs font-semibold rounded-xl border border-[#3c3934] transition-all"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#312e2b] pb-2 text-xs font-bold">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: Activity },
          { id: 'users', label: 'User Management', icon: Users },
          { id: 'games', label: 'Game Control', icon: Swords },
          { id: 'config', label: 'Platform Config', icon: Settings, adminOnly: true },
          { id: 'content', label: 'Content Management', icon: Puzzle, adminOnly: true },
          { id: 'moderation', label: 'Moderation & Audit', icon: AlertTriangle },
          { id: 'system', label: 'System Monitoring', icon: Server, adminOnly: true },
        ]
          .filter((t) => !t.adminOnly || isAdmin)
          .map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                  isActive
                    ? 'bg-[#81b64c] text-white shadow-chess'
                    : 'bg-[#262522] text-gray-400 hover:text-white hover:bg-[#312e2b] border border-[#3c3934]'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
      </div>

      {/* ---------------- SECTION A: DASHBOARD ---------------- */}
      {activeTab === 'dashboard' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-[#262522] border border-[#3c3934] rounded-2xl shadow-chess space-y-1">
              <div className="flex items-center gap-2 text-xs text-gray-400 font-semibold">
                <Users size={16} className="text-[#81b64c]" />
                <span>Total Users</span>
              </div>
              <div className="text-3xl font-black font-mono text-white">{stats.totalUsers}</div>
              <div className="text-[11px] text-emerald-400 font-semibold">{stats.onlineUsers} online now</div>
            </div>

            <div className="p-4 bg-[#262522] border border-[#3c3934] rounded-2xl shadow-chess space-y-1">
              <div className="flex items-center gap-2 text-xs text-gray-400 font-semibold">
                <Swords size={16} className="text-amber-400" />
                <span>Active Games</span>
              </div>
              <div className="text-3xl font-black font-mono text-white">{stats.activeGames}</div>
              <div className="text-[11px] text-gray-400 font-semibold">{stats.completedGames} completed</div>
            </div>

            <div className="p-4 bg-[#262522] border border-[#3c3934] rounded-2xl shadow-chess space-y-1">
              <div className="flex items-center gap-2 text-xs text-gray-400 font-semibold">
                <Puzzle size={16} className="text-purple-400" />
                <span>Puzzles Solved</span>
              </div>
              <div className="text-3xl font-black font-mono text-white">{stats.totalAttempts}</div>
              <div className="text-[11px] text-gray-400 font-semibold">{stats.totalPuzzles} catalog</div>
            </div>

            <div className="p-4 bg-[#262522] border border-[#3c3934] rounded-2xl shadow-chess space-y-1">
              <div className="flex items-center gap-2 text-xs text-gray-400 font-semibold">
                <Clock size={16} className="text-cyan-400" />
                <span>Games Today</span>
              </div>
              <div className="text-3xl font-black font-mono text-white">{stats.gamesToday}</div>
              <div className="text-[11px] text-gray-400 font-semibold">{stats.totalTournaments} tournaments</div>
            </div>
          </div>

          {/* Platform Health Quick Snapshot */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-[#262522] border border-[#3c3934] rounded-2xl space-y-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Database size={15} className="text-emerald-400" /> Database Health
              </span>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300">SQLite / PostgreSQL:</span>
                <span className="text-emerald-400 font-bold">Connected ({stats.serverHealth?.dbLatencyMs || 1}ms)</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300">Uptime:</span>
                <span className="text-white font-mono">{Math.floor((stats.serverHealth?.uptimeSeconds || 0) / 60)} mins</span>
              </div>
            </div>

            <div className="p-4 bg-[#262522] border border-[#3c3934] rounded-2xl space-y-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Cpu size={15} className="text-cyan-400" /> Engine & Workers
              </span>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300">Stockfish 19 Engine:</span>
                <span className="text-emerald-400 font-bold">Operational (WASM)</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300">RAM Heap Used:</span>
                <span className="text-white font-mono">{stats.serverHealth?.memoryUsageMb} MB</span>
              </div>
            </div>

            <div className="p-4 bg-[#262522] border border-[#3c3934] rounded-2xl space-y-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle size={15} className="text-amber-400" /> Pending Reports
              </span>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300">Flagged Cases:</span>
                <span className="font-bold text-amber-400">{stats.pendingReports} pending</span>
              </div>
              <button
                onClick={() => handleTabChange('moderation')}
                className="w-full mt-1 py-1 text-xs bg-[#312e2b] hover:bg-[#3c3934] text-white rounded font-bold"
              >
                Review Reports →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- SECTION B: USER MANAGEMENT ---------------- */}
      {activeTab === 'users' && (
        <div className="p-6 bg-[#262522] border border-[#3c3934] rounded-2xl shadow-chess space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users size={18} className="text-[#81b64c]" /> Player Accounts & Access Control
            </h3>

            {/* Search and Filters */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-2.5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search username or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadUsers(1)}
                  className="bg-[#1e1d1a] border border-[#3c3934] rounded-xl pl-8 pr-3 py-1.5 text-white focus:outline-none focus:border-[#81b64c]"
                />
              </div>

              <select
                value={userRoleFilter}
                onChange={(e) => { setUserRoleFilter(e.target.value); }}
                className="bg-[#1e1d1a] border border-[#3c3934] rounded-xl px-2.5 py-1.5 text-white focus:outline-none"
              >
                <option value="">All Roles</option>
                <option value="user">User</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
                <option value="superadmin">Super Admin</option>
              </select>

              <select
                value={userStatusFilter}
                onChange={(e) => { setUserStatusFilter(e.target.value); }}
                className="bg-[#1e1d1a] border border-[#3c3934] rounded-xl px-2.5 py-1.5 text-white focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="banned">Suspended</option>
              </select>

              <button
                onClick={() => loadUsers(1)}
                className="px-3 py-1.5 bg-[#81b64c] hover:bg-[#95c65a] text-white font-bold rounded-xl"
              >
                Filter
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#312e2b] text-gray-400 font-bold uppercase tracking-wider">
                  <th className="pb-3">User</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Ratings</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
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
                      {u.profile?.title && (
                        <span className="px-1 py-0.2 bg-red-600 text-white rounded text-[9px] font-black font-mono">
                          {u.profile.title}
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-gray-400 font-mono">{u.email}</td>
                    <td className="py-3 capitalize text-gray-300 font-semibold">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.role === 'superadmin' ? 'bg-purple-900/60 text-purple-300' :
                        u.role === 'admin' ? 'bg-red-900/60 text-red-300' :
                        u.role === 'moderator' ? 'bg-blue-900/60 text-blue-300' :
                        'bg-gray-800 text-gray-300'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-gray-300">
                      Blitz: {u.ratings?.blitz || 1500} | Rapid: {u.ratings?.rapid || 1500}
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
                    <td className="py-3 text-right space-x-1.5">
                      {/* View Profile */}
                      <button
                        onClick={() => setSelectedUserDetail(u)}
                        className="p-1.5 bg-[#312e2b] hover:bg-[#3c3934] text-gray-300 rounded-lg"
                        title="View Full Profile & Game History"
                      >
                        <Eye size={13} />
                      </button>

                      {/* Suspend / Unsuspend */}
                      <button
                        onClick={() => handleBanToggle(u.id, u.isBanned)}
                        disabled={u.id === user?.id || (u.role === 'superadmin' && !isSuperAdmin)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all disabled:opacity-30 ${
                          u.isBanned
                            ? 'bg-[#81b64c] hover:bg-[#95c65a] text-white'
                            : 'bg-amber-600 hover:bg-amber-700 text-white'
                        }`}
                      >
                        {u.isBanned ? 'Unban' : 'Suspend'}
                      </button>

                      {/* Role selection for Super Admin */}
                      {isSuperAdmin && (
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          disabled={u.id === user?.id}
                          className="bg-[#1e1d1a] border border-[#3c3934] rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none"
                        >
                          <option value="user">User</option>
                          <option value="moderator">Mod</option>
                          <option value="admin">Admin</option>
                          <option value="superadmin">Super Admin</option>
                        </select>
                      )}

                      {/* Delete Account (Super Admin only) */}
                      {isSuperAdmin && u.id !== user?.id && (
                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="p-1.5 bg-red-950/80 hover:bg-red-900 text-red-300 rounded-lg"
                          title="Permanently Delete User"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-[#312e2b]">
            <span>Page {userPage} of {userTotalPages}</span>
            <div className="space-x-2">
              <button
                onClick={() => userPage > 1 && loadUsers(userPage - 1)}
                disabled={userPage <= 1}
                className="px-3 py-1 bg-[#312e2b] rounded-lg disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => userPage < userTotalPages && loadUsers(userPage + 1)}
                disabled={userPage >= userTotalPages}
                className="px-3 py-1 bg-[#312e2b] rounded-lg disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUserDetail && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[#262522] border border-[#3c3934] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#312e2b]">
              <h3 className="font-bold text-white text-base">User Profile Inspector</h3>
              <button onClick={() => setSelectedUserDetail(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <div className="flex items-center gap-4">
              <img
                src={selectedUserDetail.profile?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${selectedUserDetail.username}`}
                alt="Avatar"
                className="w-14 h-14 rounded-xl bg-[#1e1d1a]"
              />
              <div>
                <div className="text-lg font-black text-white">{selectedUserDetail.username}</div>
                <div className="text-xs text-gray-400">{selectedUserDetail.email}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Created on: {new Date(selectedUserDetail.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-[#1e1d1a] p-3 rounded-xl border border-[#312e2b]">
              <div>
                <span className="text-gray-400">Role:</span> <strong className="text-white uppercase">{selectedUserDetail.role}</strong>
              </div>
              <div>
                <span className="text-gray-400">Status:</span> <strong className={selectedUserDetail.isBanned ? 'text-red-400' : 'text-emerald-400'}>{selectedUserDetail.isBanned ? 'Suspended' : 'Active'}</strong>
              </div>
              <div>
                <span className="text-gray-400">Country:</span> <span className="text-white">{selectedUserDetail.profile?.country || 'US'}</span>
              </div>
              <div>
                <span className="text-gray-400">Membership:</span> <span className="text-amber-400 uppercase font-bold">{selectedUserDetail.membershipTier}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="px-4 py-2 bg-[#312e2b] hover:bg-[#3c3934] text-white font-bold rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- SECTION C: GAME MANAGEMENT ---------------- */}
      {activeTab === 'games' && (
        <div className="p-6 bg-[#262522] border border-[#3c3934] rounded-2xl shadow-chess space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Swords size={18} className="text-amber-400" /> Live & Completed Game Management
            </h3>

            <div className="flex items-center gap-2 text-xs">
              <input
                type="text"
                placeholder="Search by player or game ID..."
                value={gameSearch}
                onChange={(e) => setGameSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadGames(gameStatusFilter, gameSearch)}
                className="bg-[#1e1d1a] border border-[#3c3934] rounded-xl px-3 py-1.5 text-white focus:outline-none"
              />

              <select
                value={gameStatusFilter}
                onChange={(e) => {
                  setGameStatusFilter(e.target.value);
                  loadGames(e.target.value, gameSearch);
                }}
                className="bg-[#1e1d1a] border border-[#3c3934] rounded-xl px-3 py-1.5 text-white focus:outline-none"
              >
                <option value="">All Games</option>
                <option value="in_progress">Live / Active</option>
                <option value="completed">Completed</option>
              </select>

              <button
                onClick={() => loadGames(gameStatusFilter, gameSearch)}
                className="px-3 py-1.5 bg-[#81b64c] hover:bg-[#95c65a] text-white font-bold rounded-xl"
              >
                Search
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#312e2b] text-gray-400 font-bold uppercase tracking-wider">
                  <th className="pb-3">Game ID</th>
                  <th className="pb-3">White Player</th>
                  <th className="pb-3">Black Player</th>
                  <th className="pb-3">Time Control</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Result</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#312e2b]">
                {games.map((g) => (
                  <tr key={g.id} className="hover:bg-[#2b2926] transition-colors">
                    <td className="py-3 font-mono text-gray-400 text-[11px]">{g.id.slice(0, 8)}...</td>
                    <td className="py-3 font-bold text-white">{g.whitePlayer?.username || 'Bot'}</td>
                    <td className="py-3 font-bold text-white">{g.blackPlayer?.username || 'Bot'}</td>
                    <td className="py-3 text-gray-300 font-mono">{g.timeControl}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        g.status === 'in_progress' ? 'bg-emerald-500/20 text-emerald-400 animate-pulse' : 'bg-gray-800 text-gray-300'
                      }`}>
                        {g.status}
                      </span>
                    </td>
                    <td className="py-3 font-mono font-bold text-white">{g.result || '*'}</td>
                    <td className="py-3 text-right space-x-1.5">
                      <button
                        onClick={() => setInspectingGame(g)}
                        className="px-2.5 py-1 bg-[#312e2b] hover:bg-[#3c3934] text-gray-300 rounded-lg"
                      >
                        Inspect
                      </button>
                      {g.status === 'in_progress' && (
                        <button
                          onClick={() => handleTerminateGame(g.id)}
                          className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold"
                          title="Force terminate abusive or broken game"
                        >
                          Terminate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inspect Game Modal */}
      {inspectingGame && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#262522] border border-[#3c3934] rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#312e2b]">
              <h3 className="font-bold text-white text-base">Game Audit Inspection</h3>
              <button onClick={() => setInspectingGame(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-2 text-xs">
              <div><span className="text-gray-400">Game ID:</span> <span className="font-mono text-white">{inspectingGame.id}</span></div>
              <div><span className="text-gray-400">White:</span> <strong className="text-white">{inspectingGame.whitePlayer?.username}</strong></div>
              <div><span className="text-gray-400">Black:</span> <strong className="text-white">{inspectingGame.blackPlayer?.username}</strong></div>
              <div><span className="text-gray-400">FEN:</span> <div className="font-mono text-[11px] bg-[#1e1d1a] p-2 rounded mt-1 overflow-x-auto text-gray-300">{inspectingGame.fen}</div></div>
              <div><span className="text-gray-400">PGN:</span> <div className="font-mono text-[11px] bg-[#1e1d1a] p-2 rounded mt-1 max-h-32 overflow-y-auto text-gray-300">{inspectingGame.pgn || 'No PGN recorded yet'}</div></div>
            </div>
            <div className="flex justify-between pt-2">
              {inspectingGame.status === 'in_progress' && (
                <button
                  onClick={() => handleTerminateGame(inspectingGame.id)}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs"
                >
                  Terminate Game
                </button>
              )}
              <button
                onClick={() => setInspectingGame(null)}
                className="px-4 py-1.5 bg-[#312e2b] text-white font-bold rounded-xl text-xs ml-auto"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- SECTION D: PLATFORM CONFIGURATION ---------------- */}
      {activeTab === 'config' && (
        <div className="p-6 bg-[#262522] border border-[#3c3934] rounded-2xl shadow-chess space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Settings size={18} className="text-cyan-400" /> Platform Operations & Rules Configuration
              </h3>
              <p className="text-xs text-gray-400">Control matchmaking ranges, feature flags, maintenance mode, and announcements.</p>
            </div>

            {configSaved && (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle size={14} /> Settings Saved & Active
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* General Toggles */}
            <div className="space-y-4 bg-[#1e1d1a] p-4 rounded-xl border border-[#312e2b]">
              <span className="font-bold text-gray-300 uppercase tracking-wider block">Access & Availability</span>

              <label className="flex items-center justify-between p-2 rounded hover:bg-[#262522] cursor-pointer">
                <div>
                  <div className="font-bold text-white">Allow New Registrations</div>
                  <div className="text-[11px] text-gray-400">Permit new players to sign up for accounts</div>
                </div>
                <input
                  type="checkbox"
                  checked={config.allowRegistrations ?? true}
                  onChange={(e) => setConfig({ ...config, allowRegistrations: e.target.checked })}
                  className="w-4 h-4 rounded text-[#81b64c]"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded hover:bg-[#262522] cursor-pointer">
                <div>
                  <div className="font-bold text-white">Maintenance Mode</div>
                  <div className="text-[11px] text-gray-400">Lock site for maintenance except for administrators</div>
                </div>
                <input
                  type="checkbox"
                  checked={config.maintenanceMode ?? false}
                  onChange={(e) => setConfig({ ...config, maintenanceMode: e.target.checked })}
                  className="w-4 h-4 rounded text-red-500"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded hover:bg-[#262522] cursor-pointer">
                <div>
                  <div className="font-bold text-white">Puzzles Enabled</div>
                  <div className="text-[11px] text-gray-400">Allow players to solve daily and rated puzzles</div>
                </div>
                <input
                  type="checkbox"
                  checked={config.puzzlesEnabled ?? true}
                  onChange={(e) => setConfig({ ...config, puzzlesEnabled: e.target.checked })}
                  className="w-4 h-4 rounded text-[#81b64c]"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded hover:bg-[#262522] cursor-pointer">
                <div>
                  <div className="font-bold text-white">Tournaments Enabled</div>
                  <div className="text-[11px] text-gray-400">Allow players to create and join arena tournaments</div>
                </div>
                <input
                  type="checkbox"
                  checked={config.tournamentsEnabled ?? true}
                  onChange={(e) => setConfig({ ...config, tournamentsEnabled: e.target.checked })}
                  className="w-4 h-4 rounded text-[#81b64c]"
                />
              </label>
            </div>

            {/* Matchmaking & Announcements */}
            <div className="space-y-4 bg-[#1e1d1a] p-4 rounded-xl border border-[#312e2b]">
              <span className="font-bold text-gray-300 uppercase tracking-wider block">Matchmaking & Broadcast</span>

              <div className="space-y-1.5">
                <label className="font-bold text-white block">Matchmaking Rating Tolerance (± ELO)</label>
                <input
                  type="number"
                  min="50"
                  max="500"
                  value={config.matchmakingRatingRange || 200}
                  onChange={(e) => setConfig({ ...config, matchmakingRatingRange: parseInt(e.target.value, 10) })}
                  className="w-full bg-[#262522] border border-[#3c3934] rounded-xl px-3 py-2 text-white font-mono"
                />
                <span className="text-[11px] text-gray-400">Pair opponents within this rating bracket</span>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-white block">Platform Broadcast Announcement</label>
                <textarea
                  rows={3}
                  placeholder="Welcome to NeoChess! Server update scheduled for tonight..."
                  value={config.announcement || ''}
                  onChange={(e) => setConfig({ ...config, announcement: e.target.value })}
                  className="w-full bg-[#262522] border border-[#3c3934] rounded-xl p-3 text-white focus:outline-none"
                />
                <span className="text-[11px] text-gray-400">Displays global banner across the application</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveConfig}
              className="px-6 py-2.5 bg-[#81b64c] hover:bg-[#95c65a] text-white font-black rounded-xl text-xs transition-all shadow-chess"
            >
              Save Platform Configuration
            </button>
          </div>
        </div>
      )}

      {/* ---------------- SECTION E: CONTENT MANAGEMENT (Puzzles) ---------------- */}
      {activeTab === 'content' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Create Puzzle Form */}
          <div className="lg:col-span-5 p-6 bg-[#262522] border border-[#3c3934] rounded-2xl shadow-chess space-y-4 text-xs">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus size={18} className="text-[#81b64c]" /> Add Tactical Puzzle
            </h3>

            <form onSubmit={handleCreatePuzzle} className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-gray-300">FEN Position</label>
                <input
                  type="text"
                  placeholder="r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4"
                  value={newPuzzleFen}
                  onChange={(e) => setNewPuzzleFen(e.target.value)}
                  className="w-full bg-[#1e1d1a] border border-[#3c3934] rounded-xl px-3 py-2 text-white font-mono focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-300">Solution Moves (Space Separated UCI/SAN)</label>
                <input
                  type="text"
                  placeholder="Bxf7+ Kxf7 Nxe5+ Nxe5"
                  value={newPuzzleMoves}
                  onChange={(e) => setNewPuzzleMoves(e.target.value)}
                  className="w-full bg-[#1e1d1a] border border-[#3c3934] rounded-xl px-3 py-2 text-white font-mono focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-300">Target Rating</label>
                <input
                  type="number"
                  value={newPuzzleRating}
                  onChange={(e) => setNewPuzzleRating(parseInt(e.target.value, 10))}
                  className="w-full bg-[#1e1d1a] border border-[#3c3934] rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#81b64c] hover:bg-[#95c65a] text-white font-bold rounded-xl text-xs mt-2"
              >
                Create Puzzle
              </button>
            </form>
          </div>

          {/* Puzzle Catalog Table */}
          <div className="lg:col-span-7 p-6 bg-[#262522] border border-[#3c3934] rounded-2xl shadow-chess space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Puzzle size={18} className="text-purple-400" /> Puzzle Database ({puzzles.length})
            </h3>

            <div className="max-h-[420px] overflow-y-auto space-y-2">
              {puzzles.map((p) => (
                <div key={p.id} className="p-3 bg-[#1e1d1a] rounded-xl border border-[#312e2b] flex items-center justify-between text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white font-mono">Rating: {p.rating}</span>
                      <span className="text-gray-400">{p.theme}</span>
                    </div>
                    <div className="font-mono text-[10px] text-gray-500 truncate max-w-sm">{p.fen}</div>
                  </div>

                  <button
                    onClick={() => handleDeletePuzzle(p.id)}
                    className="p-1.5 bg-red-950 hover:bg-red-900 text-red-300 rounded-lg"
                    title="Delete puzzle"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- SECTION F: MODERATION & AUDIT ---------------- */}
      {activeTab === 'moderation' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Reports Inbox */}
          <div className="p-6 bg-[#262522] border border-[#3c3934] rounded-2xl shadow-chess space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-400" /> User Reports Inbox
            </h3>

            {reports.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-xs">No pending user reports.</div>
            ) : (
              <div className="space-y-2.5 max-h-[450px] overflow-y-auto">
                {reports.map((r) => (
                  <div key={r.id} className="p-3.5 bg-[#1e1d1a] rounded-xl border border-[#312e2b] space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">
                        Reported: <span className="text-amber-400">{r.reportedUser?.username}</span>
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        r.status === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-800 text-gray-400'
                      }`}>
                        {r.status}
                      </span>
                    </div>
                    <div className="text-gray-300">{r.reason}</div>
                    {r.details && <div className="text-gray-400 text-[11px] bg-[#262522] p-2 rounded">{r.details}</div>}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-gray-500">By {r.reporter?.username}</span>
                      {r.status === 'pending' && (
                        <div className="space-x-1.5">
                          <button
                            onClick={() => handleResolveReport(r.id, 'resolved')}
                            className="px-2.5 py-1 bg-[#81b64c] hover:bg-[#95c65a] text-white rounded font-bold"
                          >
                            Resolve
                          </button>
                          <button
                            onClick={() => handleResolveReport(r.id, 'dismissed')}
                            className="px-2.5 py-1 bg-[#312e2b] hover:bg-[#3c3934] text-gray-300 rounded font-bold"
                          >
                            Dismiss
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Audit Logs History */}
          <div className="p-6 bg-[#262522] border border-[#3c3934] rounded-2xl shadow-chess space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText size={18} className="text-cyan-400" /> Administrative Audit Log
            </h3>

            <div className="space-y-2 max-h-[450px] overflow-y-auto">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-2.5 bg-[#1e1d1a] rounded-lg border border-[#312e2b] text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#81b64c] uppercase">{log.action}</span>
                    <span className="text-[10px] text-gray-500">{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="text-gray-300 text-[11px]">{log.details}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- SECTION H: SYSTEM MONITORING ---------------- */}
      {activeTab === 'system' && systemMetrics && (
        <div className="p-6 bg-[#262522] border border-[#3c3934] rounded-2xl shadow-chess space-y-6">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Server size={18} className="text-cyan-400" /> System Metrics & Architecture Status
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-[#1e1d1a] rounded-xl border border-[#312e2b] space-y-2">
              <span className="text-gray-400 font-bold uppercase tracking-wider block">Host & Environment</span>
              <div className="flex justify-between"><span className="text-gray-400">Node.js:</span> <span className="font-mono text-white">{systemMetrics.nodeVersion}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Platform:</span> <span className="font-mono text-white">{systemMetrics.platform} ({systemMetrics.arch})</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Hostname:</span> <span className="font-mono text-white">{systemMetrics.hostname}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">CPUs:</span> <span className="font-mono text-white">{systemMetrics.cpus} Cores</span></div>
            </div>

            <div className="p-4 bg-[#1e1d1a] rounded-xl border border-[#312e2b] space-y-2">
              <span className="text-gray-400 font-bold uppercase tracking-wider block">Memory Footprint</span>
              <div className="flex justify-between"><span className="text-gray-400">Heap Used:</span> <span className="font-mono text-emerald-400">{systemMetrics.processMemory?.heapUsedMb} MB</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Heap Total:</span> <span className="font-mono text-white">{systemMetrics.processMemory?.heapTotalMb} MB</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Process RSS:</span> <span className="font-mono text-white">{systemMetrics.processMemory?.rssMb} MB</span></div>
              <div className="flex justify-between"><span className="text-gray-400">System Free:</span> <span className="font-mono text-white">{systemMetrics.freeMemMb} MB</span></div>
            </div>

            <div className="p-4 bg-[#1e1d1a] rounded-xl border border-[#312e2b] space-y-2">
              <span className="text-gray-400 font-bold uppercase tracking-wider block">Connected Services</span>
              <div className="flex justify-between"><span className="text-gray-400">API Server:</span> <span className="text-emerald-400 font-bold">Online</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Database:</span> <span className="text-emerald-400 font-bold">Connected ({systemMetrics.services?.database?.latencyMs}ms)</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Engine:</span> <span className="text-emerald-400 font-bold">{systemMetrics.services?.stockfish?.engine}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
