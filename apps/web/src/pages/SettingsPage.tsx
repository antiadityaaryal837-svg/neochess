import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore.js';
import { BOARD_THEMES } from '@chess/shared';
import { Settings, Volume2, Eye, Shield, Check, Palette } from 'lucide-react';
import { sounds } from '../utils/sound.js';

export const SettingsPage: React.FC = () => {
  const { user, updateSettings } = useAuthStore();
  const currentSettings = user?.settings || {};

  const [boardTheme, setBoardTheme] = useState(currentSettings.boardTheme || 'green');
  const [pieceTheme, setPieceTheme] = useState(currentSettings.pieceTheme || 'neo');
  const [soundEnabled, setSoundEnabled] = useState(currentSettings.soundEnabled !== false);
  const [showCoordinates, setShowCoordinates] = useState(currentSettings.showCoordinates !== false);
  const [autoQueen, setAutoQueen] = useState(currentSettings.autoQueen !== false);
  const [saved, setSaved] = useState(false);

  const handleSave = async (changes: any) => {
    await updateSettings(changes);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sounds.enabled = next;
    handleSave({ soundEnabled: next });
  };

  const handleSelectBoardTheme = (themeKey: string) => {
    setBoardTheme(themeKey);
    handleSave({ boardTheme: themeKey });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Settings className="text-[#81b64c]" size={28} /> Board & Game Settings
          </h1>
          <p className="text-sm text-gray-400">
            Customize board themes, audio feedback, and gameplay options.
          </p>
        </div>

        {saved && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[#81b64c]/20 border border-[#81b64c]/40 text-[#81b64c] font-bold text-xs rounded-xl shadow-glow-green">
            <Check size={14} /> Preferences Saved
          </span>
        )}
      </div>

      <div className="space-y-6">
        {/* Board Themes Gallery */}
        <div className="p-6 bg-[#262522] border border-[#3c3934] rounded-2xl shadow-chess space-y-4">
          <div className="flex items-center gap-2">
            <Palette size={18} className="text-[#81b64c]" />
            <h3 className="text-base font-bold text-white">Chessboard Theme</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {Object.entries(BOARD_THEMES).map(([key, t]) => {
              const isSelected = boardTheme === key;
              return (
                <button
                  key={key}
                  onClick={() => handleSelectBoardTheme(key)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    isSelected
                      ? 'bg-[#2b2926] border-[#81b64c] shadow-glow-green'
                      : 'bg-[#1e1d1a] border-[#312e2b] hover:border-[#504c46]'
                  }`}
                >
                  {/* Miniature 2x2 board representation */}
                  <div className="w-16 h-16 mx-auto rounded-lg overflow-hidden grid grid-cols-2 grid-rows-2 border border-black/30 mb-2">
                    <div style={{ backgroundColor: t.light }} />
                    <div style={{ backgroundColor: t.dark }} />
                    <div style={{ backgroundColor: t.dark }} />
                    <div style={{ backgroundColor: t.light }} />
                  </div>
                  <span className="text-xs font-bold text-white block">{t.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Gameplay & Audio Toggles */}
        <div className="p-6 bg-[#262522] border border-[#3c3934] rounded-2xl shadow-chess space-y-4 divide-y divide-[#312e2b]">
          <h3 className="text-base font-bold text-white mb-2">Game Preferences</h3>

          {/* Audio toggle */}
          <div className="flex items-center justify-between pt-4">
            <div>
              <span className="text-sm font-bold text-white block">Sound Effects</span>
              <span className="text-xs text-gray-400">Play realistic moves, captures, and timer sounds</span>
            </div>
            <button
              onClick={handleToggleSound}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                soundEnabled ? 'bg-[#81b64c]' : 'bg-[#3c3934]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                  soundEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Coordinates toggle */}
          <div className="flex items-center justify-between pt-4">
            <div>
              <span className="text-sm font-bold text-white block">Board Coordinates</span>
              <span className="text-xs text-gray-400">Display letters (a-h) and numbers (1-8) along board edges</span>
            </div>
            <button
              onClick={() => {
                const next = !showCoordinates;
                setShowCoordinates(next);
                handleSave({ showCoordinates: next });
              }}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                showCoordinates ? 'bg-[#81b64c]' : 'bg-[#3c3934]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                  showCoordinates ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Auto Queen toggle */}
          <div className="flex items-center justify-between pt-4">
            <div>
              <span className="text-sm font-bold text-white block">Auto-Promote to Queen</span>
              <span className="text-xs text-gray-400">Automatically promote pawns reaching 8th rank to Queen</span>
            </div>
            <button
              onClick={() => {
                const next = !autoQueen;
                setAutoQueen(next);
                handleSave({ autoQueen: next });
              }}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                autoQueen ? 'bg-[#81b64c]' : 'bg-[#3c3934]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                  autoQueen ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
