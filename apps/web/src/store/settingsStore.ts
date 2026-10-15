import { create } from 'zustand';
import { BOARD_THEMES, PIECE_THEMES } from '@chess/shared';
import { api } from '../services/api.js';

interface SettingsState {
  boardTheme: string;
  pieceTheme: string;
  showCoordinates: boolean;
  autoQueen: boolean;
  soundEnabled: boolean;
  setBoardTheme: (theme: string) => void;
  setPieceTheme: (theme: string) => void;
  setShowCoordinates: (show: boolean) => void;
  setAutoQueen: (auto: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  syncFromUser: (settings?: any) => void;
}

const getInitial = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const val = localStorage.getItem(key);
    if (val !== null) {
      if (typeof fallback === 'boolean') return (val === 'true') as unknown as T;
      return val as unknown as T;
    }
  } catch (_) {}
  return fallback;
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  boardTheme: getInitial('neochess_board_theme', 'green'),
  pieceTheme: getInitial('neochess_piece_theme', 'neo'),
  showCoordinates: getInitial('neochess_show_coordinates', true),
  autoQueen: getInitial('neochess_auto_queen', true),
  soundEnabled: getInitial('neochess_sound_enabled', true),

  setBoardTheme: (theme: string) => {
    if (!BOARD_THEMES[theme]) return;
    set({ boardTheme: theme });
    try {
      localStorage.setItem('neochess_board_theme', theme);
    } catch (_) {}

    // Async sync to server if authenticated
    api.updatePreferences({ boardTheme: theme }).catch(() => {});
  },

  setPieceTheme: (theme: string) => {
    if (!PIECE_THEMES[theme]) return;
    set({ pieceTheme: theme });
    try {
      localStorage.setItem('neochess_piece_theme', theme);
    } catch (_) {}

    // Async sync to server if authenticated
    api.updatePreferences({ pieceTheme: theme }).catch(() => {});
  },

  setShowCoordinates: (show: boolean) => {
    set({ showCoordinates: show });
    try {
      localStorage.setItem('neochess_show_coordinates', String(show));
    } catch (_) {}
    api.updatePreferences({ showCoordinates: show }).catch(() => {});
  },

  setAutoQueen: (auto: boolean) => {
    set({ autoQueen: auto });
    try {
      localStorage.setItem('neochess_auto_queen', String(auto));
    } catch (_) {}
    api.updatePreferences({ autoQueen: auto }).catch(() => {});
  },

  setSoundEnabled: (enabled: boolean) => {
    set({ soundEnabled: enabled });
    try {
      localStorage.setItem('neochess_sound_enabled', String(enabled));
    } catch (_) {}
    api.updatePreferences({ soundEnabled: enabled }).catch(() => {});
  },

  syncFromUser: (settings?: any) => {
    if (!settings) return;
    if (settings.boardTheme && BOARD_THEMES[settings.boardTheme]) {
      set({ boardTheme: settings.boardTheme });
      localStorage.setItem('neochess_board_theme', settings.boardTheme);
    }
    if (settings.pieceTheme && PIECE_THEMES[settings.pieceTheme]) {
      set({ pieceTheme: settings.pieceTheme });
      localStorage.setItem('neochess_piece_theme', settings.pieceTheme);
    }
    if (settings.showCoordinates !== undefined) {
      set({ showCoordinates: settings.showCoordinates });
      localStorage.setItem('neochess_show_coordinates', String(settings.showCoordinates));
    }
    if (settings.autoQueen !== undefined) {
      set({ autoQueen: settings.autoQueen });
      localStorage.setItem('neochess_auto_queen', String(settings.autoQueen));
    }
  },
}));
