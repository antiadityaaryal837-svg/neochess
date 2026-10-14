import React from 'react';
import { PlayerInfo } from '@chess/shared';
import { Clock } from 'lucide-react';

interface ClockDisplayProps {
  player: PlayerInfo;
  timeMs: number;
  isActiveTurn: boolean;
  color: 'white' | 'black';
}

export const ClockDisplay: React.FC<ClockDisplayProps> = ({
  player,
  timeMs,
  isActiveTurn,
  color,
}) => {
  const totalSeconds = Math.max(0, Math.floor(timeMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const tenths = Math.floor((timeMs % 1000) / 100);

  // Under 20 seconds, show decimal tenths
  const formattedTime =
    totalSeconds < 20
      ? `${minutes}:${seconds.toString().padStart(2, '0')}.${tenths}`
      : `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const isLowTime = totalSeconds <= 20;

  return (
    <div
      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
        isActiveTurn
          ? 'bg-[#2b2926] border-[#81b64c] shadow-md'
          : 'bg-[#21201d] border-[#312e2b]'
      }`}
    >
      {/* Player info */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="relative">
          <img
            src={player.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${player.username}`}
            alt={player.username}
            className="w-9 h-9 rounded-lg object-cover bg-[#161512] border border-[#3c3934]"
          />
          <span
            className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#21201d] ${
              color === 'white' ? 'bg-white' : 'bg-zinc-800'
            }`}
          />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-white truncate">{player.username}</span>
            {player.title && (
              <span className="px-1 py-0.2 text-[9px] font-black bg-amber-500 text-black rounded">
                {player.title}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-400 font-medium">{player.rating}</span>
        </div>
      </div>

      {/* Clock timer */}
      <div
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-bold text-lg tracking-wider border ${
          isLowTime && isActiveTurn
            ? 'low-time-warning text-red-400 border-red-500'
            : isActiveTurn
            ? 'bg-[#1a1916] text-[#81b64c] border-[#81b64c]/40'
            : 'bg-[#1a1916] text-gray-300 border-[#312e2b]'
        }`}
      >
        <Clock size={16} className={isLowTime && isActiveTurn ? 'animate-bounce text-red-400' : 'text-gray-400'} />
        <span>{formattedTime}</span>
      </div>
    </div>
  );
};
