import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  Gamepad2,
  Puzzle,
  GraduationCap,
  Microscope,
  Bot,
  Trophy,
  Users,
  BarChart3,
  BookOpen,
  Settings,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  User,
  LogOut,
  Flame,
  Menu,
  X,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore.js';

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, openAuthModal, logout } = useAuthStore();

  const canAccessAdmin =
    user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'moderator';

  const navLinks = [
    { to: '/', label: 'Play', icon: Gamepad2, badge: 'Live' },
    { to: '/puzzles', label: 'Puzzles', icon: Puzzle, badge: 'Daily' },
    { to: '/bots', label: 'Computer', icon: Bot },
    { to: '/lessons', label: 'Lessons', icon: GraduationCap },
    { to: '/analysis', label: 'Analysis', icon: Microscope },
    { to: '/openings', label: 'Openings', icon: BookOpen },
    { to: '/tournaments', label: 'Tournaments', icon: Trophy },
    { to: '/clubs', label: 'Clubs', icon: Users },
    { to: '/leaderboard', label: 'Leaderboard', icon: BarChart3 },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  if (canAccessAdmin) {
    navLinks.push({ to: '/admin', label: 'Admin', icon: ShieldAlert, badge: 'Staff' });
  }

  // Mobile primary items
  const mobilePrimaryLinks = [
    { to: '/', label: 'Play', icon: Gamepad2 },
    { to: '/puzzles', label: 'Puzzles', icon: Puzzle },
    { to: '/bots', label: 'Bots', icon: Bot },
    { to: '/analysis', label: 'Review', icon: Microscope },
  ];

  return (
    <>
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside
        className={`hidden md:flex relative flex-col justify-between bg-[#21201d] border-r border-[#312e2b] transition-all duration-300 z-30 select-none shrink-0 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Top Branding */}
        <div>
          <div className="flex items-center justify-between px-4 py-4 border-b border-[#312e2b]">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#81b64c] to-[#50802c] flex items-center justify-center shadow-glow-green">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 22H5V20H19V22M17.5 18H6.5L7.25 15.5C7.38 15.06 7.6 14.65 7.89 14.31C8.18 13.97 8.54 13.7 8.95 13.52L9 13.5C7.34 13.5 6 12.16 6 10.5C6 9.4 6.58 8.44 7.45 7.91C7.3 7.45 7.19 6.96 7.15 6.45C7.03 4.96 7.8 3.56 9.11 2.87L9.89 2.45L10.37 3.2C10.74 3.79 11.23 4.29 11.8 4.67C12.4 3.65 13.48 3 14.7 3C16.63 3 18.2 4.57 18.2 6.5C18.2 6.8 18.16 7.09 18.09 7.37C18.66 8.21 19 9.22 19 10.3C19 11.2 18.66 12 18.1 12.63L18.77 15.5H17.5V18Z" />
                </svg>
              </div>
              {!collapsed && (
                <div className="flex flex-col">
                  <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                    Neo<span className="text-[#81b64c]">Chess</span>
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                    Master The Board
                  </span>
                </div>
              )}
            </Link>

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#2b2926] transition-colors"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>

          {/* Navigation List */}
          <nav className="p-3 space-y-1">
            {navLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-[#312e2b] text-white border-l-4 border-[#81b64c] shadow-sm'
                      : 'text-gray-300 hover:text-white hover:bg-[#282622]'
                  }`
                }
              >
                <item.icon size={20} className="shrink-0 text-[#81b64c]" />
                {!collapsed && (
                  <div className="flex items-center justify-between w-full">
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-[#81b64c]/20 text-[#81b64c] border border-[#81b64c]/30">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* User Section at Bottom */}
        <div className="p-3 border-t border-[#312e2b]">
          {isAuthenticated && user ? (
            <div className="space-y-2">
              <Link
                to={`/profile/${user.username}`}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#2b2926] transition-colors"
              >
                <img
                  src={
                    user.profile?.avatarUrl ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`
                  }
                  alt={user.username}
                  className="w-10 h-10 rounded-xl bg-[#2b2926] object-cover border border-[#3c3934]"
                />
                {!collapsed && (
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-white truncate">{user.username}</span>
                      {user.profile?.title && (
                        <span className="px-1 py-0.2 text-[9px] font-black bg-amber-500 text-black rounded">
                          {user.profile.title}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1 text-[#81b64c] font-semibold">
                        <Flame size={13} /> {user.ratings?.blitz || 1200}
                      </span>
                      <span className="capitalize text-[11px] text-amber-400">
                        {user.membershipTier}
                      </span>
                    </div>
                  </div>
                )}
              </Link>

              {!collapsed && (
                <button
                  onClick={logout}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-gray-400 hover:text-red-400 hover:bg-[#2b2926] rounded-lg transition-colors"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {!collapsed ? (
                <>
                  <button
                    onClick={() => openAuthModal('login')}
                    className="w-full py-2.5 px-3 bg-[#81b64c] hover:bg-[#95c65a] text-white font-bold text-sm rounded-xl shadow-glow-green transition-all"
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => openAuthModal('register')}
                    className="w-full py-2 px-3 bg-[#2b2926] hover:bg-[#36332f] text-gray-200 font-semibold text-xs rounded-xl border border-[#3c3934] transition-all"
                  >
                    Sign Up Free
                  </button>
                </>
              ) : (
                <button
                  onClick={() => openAuthModal('login')}
                  className="w-full p-2.5 bg-[#81b64c] hover:bg-[#95c65a] text-white rounded-xl flex items-center justify-center transition-all"
                  title="Log In"
                >
                  <User size={20} />
                </button>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* ================= MOBILE BOTTOM NAVIGATION BAR ================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#1e1d1a]/95 backdrop-blur-md border-t border-[#312e2b] flex items-center justify-around py-1.5 px-2 shadow-2xl">
        {mobilePrimaryLinks.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center p-1.5 rounded-lg transition-all ${
                isActive ? 'text-[#81b64c]' : 'text-gray-400 hover:text-white'
              }`
            }
          >
            <item.icon size={20} />
            <span className="text-[10px] font-bold mt-0.5">{item.label}</span>
          </NavLink>
        ))}

        {/* More / Menu trigger */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center p-1.5 text-gray-400 hover:text-white rounded-lg transition-all"
        >
          <Menu size={20} />
          <span className="text-[10px] font-bold mt-0.5">More</span>
        </button>
      </nav>

      {/* ================= MOBILE EXPANDABLE MENU DRAWER ================= */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div
            className="fixed inset-0"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          <div className="relative bg-[#21201d] border-t border-[#3c3934] rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto space-y-5 shadow-2xl z-10">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#312e2b]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#81b64c] flex items-center justify-center text-white font-black text-sm">
                  NC
                </div>
                <span className="font-bold text-white text-base">Menu & Navigation</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white bg-[#2b2926]"
              >
                <X size={18} />
              </button>
            </div>

            {/* User Profile or Login CTA */}
            {isAuthenticated && user ? (
              <div className="flex items-center justify-between p-3 bg-[#181714] rounded-2xl border border-[#312e2b]">
                <Link
                  to={`/profile/${user.username}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3"
                >
                  <img
                    src={
                      user.profile?.avatarUrl ||
                      `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`
                    }
                    alt={user.username}
                    className="w-10 h-10 rounded-xl bg-[#2b2926]"
                  />
                  <div>
                    <span className="text-sm font-bold text-white block">{user.username}</span>
                    <span className="text-xs text-[#81b64c] font-semibold">
                      Rating: {user.ratings?.blitz || 1200}
                    </span>
                  </div>
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="p-2 text-gray-400 hover:text-red-400 rounded-lg"
                  title="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal('login');
                  }}
                  className="py-2.5 px-3 bg-[#81b64c] text-white font-bold text-xs rounded-xl shadow-glow-green"
                >
                  Log In
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal('register');
                  }}
                  className="py-2.5 px-3 bg-[#2b2926] text-gray-200 font-semibold text-xs rounded-xl border border-[#3c3934]"
                >
                  Sign Up Free
                </button>
              </div>
            )}

            {/* Grid of All Navigation Links */}
            <div className="grid grid-cols-2 gap-2">
              {navLinks.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 p-3 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-[#81b64c] text-white'
                        : 'bg-[#181714] text-gray-300 hover:bg-[#2b2926] border border-[#312e2b]'
                    }`
                  }
                >
                  <item.icon size={16} className="text-[#81b64c]" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
