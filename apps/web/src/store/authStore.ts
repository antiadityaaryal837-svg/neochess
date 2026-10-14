import { create } from 'zustand';
import { api } from '../services/api.js';
import { getSocket } from '../services/socket.js';
import { sounds } from '../utils/sound.js';

export interface UserState {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'moderator' | 'admin';
  membershipTier: 'free' | 'gold' | 'platinum' | 'diamond';
  profile?: any;
  settings?: any;
  ratings?: any;
  isGuest?: boolean;
}

interface AuthStore {
  user: UserState | null;
  token: string | null;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  isLoading: boolean;

  setAuth: (token: string, user: UserState) => void;
  logout: () => void;
  updateSettings: (settings: any) => Promise<void>;
  refreshUser: () => Promise<void>;
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: localStorage.getItem('chess_auth_token'),
  isAuthenticated: false,
  isAuthModalOpen: false,
  authModalMode: 'login',
  isLoading: true,

  setAuth: (token: string, user: UserState) => {
    localStorage.setItem('chess_auth_token', token);
    localStorage.setItem('chess_user_data', JSON.stringify(user));
    if (user.settings?.soundEnabled !== undefined) {
      sounds.enabled = user.settings.soundEnabled;
    }
    set({ token, user, isAuthenticated: true });

    // Identify with socket
    const socket = getSocket();
    socket.emit('auth:identify', {
      userId: user.id,
      username: user.username,
    });
  },

  logout: () => {
    localStorage.removeItem('chess_auth_token');
    localStorage.removeItem('chess_user_data');
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateSettings: async (newSettings: any) => {
    try {
      const res = await api.updatePreferences(newSettings);
      const currentUser = get().user;
      if (currentUser) {
        const updated = { ...currentUser, settings: res.settings };
        set({ user: updated });
        localStorage.setItem('chess_user_data', JSON.stringify(updated));
        if (res.settings.soundEnabled !== undefined) {
          sounds.enabled = res.settings.soundEnabled;
        }
      }
    } catch (err) {
      console.error('Failed to update settings:', err);
    }
  },

  refreshUser: async () => {
    try {
      const { user } = await api.getMe();
      if (user) {
        get().setAuth(get().token || '', user);
      }
    } catch {
      get().logout();
    }
  },

  openAuthModal: (mode = 'login') => {
    set({ isAuthModalOpen: true, authModalMode: mode });
  },

  closeAuthModal: () => {
    set({ isAuthModalOpen: false });
  },

  initialize: async () => {
    const token = localStorage.getItem('chess_auth_token');
    if (!token) {
      set({ isLoading: false });
      return;
    }

    try {
      const { user } = await api.getMe();
      if (user) {
        get().setAuth(token, user);
      }
    } catch {
      get().logout();
    } finally {
      set({ isLoading: false });
    }
  },
}));
