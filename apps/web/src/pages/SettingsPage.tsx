import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore.js';
import { useSettingsStore } from '../store/settingsStore.js';
import { BOARD_THEMES, PIECE_THEMES } from '@chess/shared';
import { Settings, Volume2, VolumeX, Check, Palette, Sparkles, Play, Eye } from 'lucide-react';
import { sounds } from '../utils/sound.js';

export const SettingsPage: React.FC = () => {
  const { user } = useAuthStore();
  const {
    boardTheme,
    pieceTheme,
    showCoordinates,
    autoQueen,
    soundEnabled,
    setBoardTheme,
    setPieceTheme,
    setShowCoordinates,
    setAutoQueen,
    setSoundEnabled,
  } = useSettingsStore();

  const [volume, setVolume] = useState(Math.round((sounds.masterVolume || 0.8) * 100));
  const [moveSoundsEnabled, setMoveSoundsEnabled] = useState(sounds.moveSoundsEnabled);
  const [alertsEnabled, setAlertsEnabled] = useState(sounds.alertsEnabled);
  const [savedBanner, setSavedBanner] = useState(false);

  const triggerSavedNotice = () => {
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2000);
  };

  const handleSelectBoardTheme = (key: string) => {
    setBoardTheme(key);
    triggerSavedNotice();
  };

  const handleSelectPieceTheme = (key: string) => {
    setPieceTheme(key);
    triggerSavedNotice();
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sounds.enabled = next;
    triggerSavedNotice();
  };

  const handleVolumeChange = (newVal: number) => {
    setVolume(newVal);
    sounds.setMasterVolume(newVal / 100);
  };

  const handleToggleMoveSounds = () => {
    const next = !moveSoundsEnabled;
    setMoveSoundsEnabled(next);
    sounds.moveSoundsEnabled = next;
  };

  const handleToggleAlerts = () => {
    const next = !alertsEnabled;
    setAlertsEnabled(next);
    sounds.alertsEnabled = next;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Settings className="text-[#81b64c]" size={28} /> Board & Game Settings
          </h1>
          <p className="text-sm text-gray-400">
            Customize board themes, piece sets, audio feedback, and gameplay preferences with instant live preview.
          </p>
        </div>

        {savedBanner && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[#81b64c]/20 border border-[#81b64c]/40 text-[#81b64c] font-bold text-xs rounded-xl shadow-glow-green animate-in fade-in">
            <Check size={14} /> Preferences Updated
          </span>
        )}
      </div>

      <div className="space-y-6">
        {/* 1. Board Themes Gallery */}
        <div className="p-6 bg-[#262522] border border-[#3c3934] rounded-2xl shadow-chess space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Palette size={18} className="text-[#81b64c]" />
              <h3 className="text-base font-bold text-white">Chessboard Theme</h3>
            </div>
            <span className="text-xs text-gray-400">
              Active: <span className="font-bold text-[#81b64c]">{BOARD_THEMES[boardTheme]?.name || boardTheme}</span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Object.entries(BOARD_THEMES).map(([key, t]: [string, any]) => {
              const isSelected = boardTheme === key;
              return (
                <button
                  key={key}
                  onClick={() => handleSelectBoardTheme(key)}
                  className={`p-3 rounded-xl border text-center transition-all relative ${
                    isSelected
                      ? 'bg-[#2b2926] border-[#81b64c] ring-2 ring-[#81b64c]/50 shadow-glow-green scale-[1.02]'
                      : 'bg-[#1e1d1a] border-[#312e2b] hover:border-[#504c46]'
                  }`}
                >
                  {isSelected && (
                    <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#81b64c] text-white flex items-center justify-center text-[10px]">
                      ✓
                    </span>
                  )}
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

        {/* 2. Piece Set Gallery */}
        <div className="p-6 bg-[#262522] border border-[#3c3934] rounded-2xl shadow-chess space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-[#81b64c]" />
              <h3 className="text-base font-bold text-white">Piece Style</h3>
            </div>
            <span className="text-xs text-gray-400">
              Active: <span className="font-bold text-[#81b64c]">{PIECE_THEMES[pieceTheme]?.name || pieceTheme}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(PIECE_THEMES).map(([key, p]: [string, any]) => {
              const isSelected = pieceTheme === key;
              return (
                <button
                  key={key}
                  onClick={() => handleSelectPieceTheme(key)}
                  className={`p-4 rounded-xl border text-left transition-all relative ${
                    isSelected
                      ? 'bg-[#2b2926] border-[#81b64c] ring-2 ring-[#81b64c]/50 shadow-glow-green scale-[1.02]'
                      : 'bg-[#1e1d1a] border-[#312e2b] hover:border-[#504c46]'
                  }`}
                >
                  {isSelected && (
                    <span className="absolute top-3 right-3 w-4 h-4 rounded-full bg-[#81b64c] text-white flex items-center justify-center text-[10px]">
                      ✓
                    </span>
                  )}
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-lg bg-[#262522] border border-[#3c3934] flex items-center justify-center text-lg">
                      {key === 'wood' ? '🪵' : key === 'alpha' ? '⚡' : key === 'modern' ? '💠' : '♟️'}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{p.name}</div>
                      <div className="text-[11px] text-gray-400">{key.toUpperCase()}</div>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-300 leading-snug">{p.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Audio Engine Configuration */}
        <div className="p-6 bg-[#262522] border border-[#3c3934] rounded-2xl shadow-chess space-y-6">
          <div className="flex items-center justify-between border-b border-[#312e2b] pb-4">
            <div className="flex items-center gap-2">
              <Volume2 size={20} className="text-[#81b64c]" />
              <div>
                <h3 className="text-base font-bold text-white">Synthesized Audio Engine</h3>
                <p className="text-xs text-gray-400">Zero-latency realistic Web Audio sound effects</p>
              </div>
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

          {soundEnabled && (
            <div className="space-y-5">
              {/* Master Volume Slider */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-gray-300 mb-2">
                  <span className="flex items-center gap-1.5">
                    {volume > 0 ? <Volume2 size={15} /> : <VolumeX size={15} />}
                    Master Volume
                  </span>
                  <span className="text-[#81b64c] font-mono">{volume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => handleVolumeChange(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-[#1b1917] rounded-lg appearance-none cursor-pointer accent-[#81b64c]"
                />
              </div>

              {/* Category Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="flex items-center justify-between p-3 bg-[#1e1d1a] border border-[#312e2b] rounded-xl">
                  <div>
                    <span className="text-xs font-bold text-white block">Move & Capture Sounds</span>
                    <span className="text-[11px] text-gray-400">Organic wooden clicks & strikes</span>
                  </div>
                  <button
                    onClick={handleToggleMoveSounds}
                    className={`w-10 h-5 rounded-full transition-colors relative ${
                      moveSoundsEnabled ? 'bg-[#81b64c]' : 'bg-[#3c3934]'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                        moveSoundsEnabled ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-[#1e1d1a] border border-[#312e2b] rounded-xl">
                  <div>
                    <span className="text-xs font-bold text-white block">Alert & Chime Sounds</span>
                    <span className="text-[11px] text-gray-400">Check alerts, game start & fanfare</span>
                  </div>
                  <button
                    onClick={handleToggleAlerts}
                    className={`w-10 h-5 rounded-full transition-colors relative ${
                      alertsEnabled ? 'bg-[#81b64c]' : 'bg-[#3c3934]'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                        alertsEnabled ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Sound Effect Previews */}
              <div className="pt-2">
                <span className="text-xs font-bold text-gray-400 block mb-2.5">
                  Test Sound Effects (Click to Preview)
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Normal Move', action: () => sounds.playMove() },
                    { label: 'Capture', action: () => sounds.playCapture() },
                    { label: 'Check Chime', action: () => sounds.playCheck() },
                    { label: 'Castle', action: () => sounds.playCastle() },
                    { label: 'Promotion', action: () => sounds.playPromotion() },
                    { label: 'Victory Fanfare', action: () => sounds.playVictory() },
                    { label: 'Defeat', action: () => sounds.playDefeat() },
                    { label: 'Notification', action: () => sounds.playNotification() },
                  ].map((s) => (
                    <button
                      key={s.label}
                      onClick={s.action}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e1d1a] hover:bg-[#312e2b] active:scale-95 text-xs text-gray-200 hover:text-white font-semibold rounded-lg border border-[#3c3934] transition-all"
                    >
                      <Play size={11} className="text-[#81b64c] fill-[#81b64c]" />
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. Gameplay Preferences */}
        <div className="p-6 bg-[#262522] border border-[#3c3934] rounded-2xl shadow-chess space-y-4 divide-y divide-[#312e2b]">
          <h3 className="text-base font-bold text-white mb-2">Gameplay Preferences</h3>

          {/* Coordinates toggle */}
          <div className="flex items-center justify-between pt-4">
            <div>
              <span className="text-sm font-bold text-white block">Board Coordinates</span>
              <span className="text-xs text-gray-400">Display letters (a-h) and numbers (1-8) along board edges</span>
            </div>
            <button
              onClick={() => {
                setShowCoordinates(!showCoordinates);
                triggerSavedNotice();
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
                setAutoQueen(!autoQueen);
                triggerSavedNotice();
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

export default SettingsPage;
