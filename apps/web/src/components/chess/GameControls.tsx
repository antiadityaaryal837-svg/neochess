import React, { useState } from 'react';
import { Flag, Scale, RotateCw, Volume2, VolumeX } from 'lucide-react';
import { sounds } from '../../utils/sound.js';
import { useAuthStore } from '../../store/authStore.js';

interface GameControlsProps {
  onResign: () => void;
  onOfferDraw: () => void;
  onFlipBoard: () => void;
  disabled?: boolean;
}

export const GameControls: React.FC<GameControlsProps> = ({
  onResign,
  onOfferDraw,
  onFlipBoard,
  disabled = false,
}) => {
  const [confirmResign, setConfirmResign] = useState(false);
  const [soundOn, setSoundOn] = useState(sounds.enabled);
  const { updateSettings } = useAuthStore();

  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    sounds.enabled = next;
    updateSettings({ soundEnabled: next });
  };

  return (
    <div className="flex items-center justify-between gap-2 p-2 bg-[#21201d] rounded-xl border border-[#312e2b]">
      {/* Resign / Confirm Resign */}
      {confirmResign ? (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setConfirmResign(false);
              onResign();
            }}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition-all"
          >
            Confirm Resign
          </button>
          <button
            onClick={() => setConfirmResign(false)}
            className="px-2.5 py-1.5 bg-[#2b2926] hover:bg-[#363430] text-gray-300 text-xs rounded-lg transition-all"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirmResign(true)}
          disabled={disabled}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2b2926] hover:bg-red-950/40 text-gray-300 hover:text-red-400 text-xs font-semibold rounded-lg border border-[#3c3934] transition-all disabled:opacity-40"
          title="Resign game"
        >
          <Flag size={14} />
          <span>Resign</span>
        </button>
      )}

      {/* Offer Draw */}
      <button
        onClick={onOfferDraw}
        disabled={disabled}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2b2926] hover:bg-[#363430] text-gray-300 hover:text-white text-xs font-semibold rounded-lg border border-[#3c3934] transition-all disabled:opacity-40"
        title="Offer draw"
      >
        <Scale size={14} />
        <span>Offer Draw</span>
      </button>

      {/* Flip Board */}
      <button
        onClick={onFlipBoard}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2b2926] hover:bg-[#363430] text-gray-300 hover:text-white text-xs font-semibold rounded-lg border border-[#3c3934] transition-all"
        title="Flip board orientation"
      >
        <RotateCw size={14} />
        <span>Flip</span>
      </button>

      {/* Audio Mute/Unmute */}
      <button
        onClick={handleToggleSound}
        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#2b2926] transition-colors"
        title={soundOn ? 'Mute sound' : 'Enable sound'}
      >
        {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
      </button>
    </div>
  );
};
