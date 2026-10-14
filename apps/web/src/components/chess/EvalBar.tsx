import React from 'react';

interface EvalBarProps {
  scoreCentipawns: number; // e.g. +100 means +1.0 for White, -200 means -2.0 for Black
  orientation?: 'white' | 'black';
}

export const EvalBar: React.FC<EvalBarProps> = ({ scoreCentipawns, orientation = 'white' }) => {
  // Convert centipawns to percentage: score of 0 = 50%
  // Sigmoid-like conversion: clamp between -1000 and +1000
  const clamped = Math.max(-1000, Math.min(1000, scoreCentipawns));
  let whitePercent = 50 + (clamped / 1000) * 45;
  whitePercent = Math.max(5, Math.min(95, whitePercent));

  const displayScore = (Math.abs(scoreCentipawns) / 100).toFixed(1);
  const isWhiteAdvantage = scoreCentipawns >= 0;

  return (
    <div className="relative w-7 h-full min-h-[400px] bg-[#27272a] rounded-lg overflow-hidden flex flex-col justify-between border border-[#3f3f46] shadow-inner select-none">
      {/* Black portion (top if white orientation) */}
      <div
        className="w-full bg-[#18181b] transition-all duration-300 relative flex items-center justify-center"
        style={{
          height: orientation === 'white' ? `${100 - whitePercent}%` : `${whitePercent}%`,
        }}
      >
        {!isWhiteAdvantage && (
          <span className="text-[10px] font-mono font-bold text-gray-300">
            -{displayScore}
          </span>
        )}
      </div>

      {/* White portion (bottom if white orientation) */}
      <div
        className="w-full bg-[#f4f4f5] transition-all duration-300 relative flex items-center justify-center text-zinc-900"
        style={{
          height: orientation === 'white' ? `${whitePercent}%` : `${100 - whitePercent}%`,
        }}
      >
        {isWhiteAdvantage && (
          <span className="text-[10px] font-mono font-bold text-zinc-900">
            +{displayScore}
          </span>
        )}
      </div>
    </div>
  );
};
