import React from 'react';

interface EvalBarProps {
  scoreCentipawns?: number; // Normalized to White: positive = White advantage (+100 = +1.00), negative = Black advantage (-200 = -2.00)
  mateInMoves?: number;     // Normalized to White: +3 = White mates in 3, -2 = Black mates in 2
  orientation?: 'white' | 'black';
  isLive?: boolean;
  isLoading?: boolean;
  isEvaluating?: boolean;
}

export const EvalBar: React.FC<EvalBarProps> = ({
  scoreCentipawns = 0,
  mateInMoves,
  orientation = 'white',
  isLive = false,
  isLoading = false,
  isEvaluating = false,
}) => {
  const loading = isLoading || isEvaluating;
  // Calculate White advantage percentage (0% to 100%, neutral is 50%)
  let whitePercent = 50;

  if (mateInMoves !== undefined && mateInMoves !== null) {
    if (mateInMoves > 0) {
      whitePercent = 97; // White has forced mate
    } else if (mateInMoves < 0) {
      whitePercent = 3;  // Black has forced mate
    } else {
      whitePercent = 98; // Checkmate
    }
  } else {
    // Sigmoidal winning chance mapping based on standard chess formula:
    // P(Win) = 50 + 50 * (2 / (1 + exp(-0.00368208 * cp)) - 1)
    const cp = typeof scoreCentipawns === 'number' ? scoreCentipawns : 0;
    const winRate = 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1);
    whitePercent = Math.max(5, Math.min(95, winRate));
  }

  // Format label to White perspective
  let label = '0.0';
  let isWhiteAdvantage = false;

  if (mateInMoves !== undefined && mateInMoves !== null) {
    if (mateInMoves > 0) {
      label = `M${mateInMoves}`;
      isWhiteAdvantage = true;
    } else if (mateInMoves < 0) {
      label = `-M${Math.abs(mateInMoves)}`;
      isWhiteAdvantage = false;
    } else {
      label = '#';
      isWhiteAdvantage = true;
    }
  } else {
    const cp = typeof scoreCentipawns === 'number' ? scoreCentipawns : 0;
    if (cp > 0) {
      label = `+${(cp / 100).toFixed(1)}`;
      isWhiteAdvantage = true;
    } else if (cp < 0) {
      label = `-${(Math.abs(cp) / 100).toFixed(1)}`;
      isWhiteAdvantage = false;
    } else {
      label = '0.0';
      isWhiteAdvantage = true;
    }
  }

  // Bar height for White segment
  const whiteBarHeight = orientation === 'white' ? `${whitePercent}%` : `${100 - whitePercent}%`;
  const blackBarHeight = orientation === 'white' ? `${100 - whitePercent}%` : `${whitePercent}%`;

  return (
    <div className="relative flex flex-col items-center">
      <div
        className="relative w-8 h-[520px] max-h-[80vh] bg-[#272522] rounded-lg overflow-hidden flex flex-col justify-between border border-[#3d3a34] shadow-2xl select-none transition-all duration-300"
        title={`Evaluation: ${label} (White perspective)`}
      >
        {/* Black territory (top if white orientation) */}
        <div
          className="w-full bg-[#1b1a17] transition-all duration-500 ease-out relative flex items-start justify-center pt-2 overflow-hidden border-b border-[#312e2b]"
          style={{ height: blackBarHeight }}
        >
          {!isWhiteAdvantage && (
            <span className="text-[11px] font-mono font-black text-gray-200 tracking-tight px-1 py-0.5 rounded bg-black/40 backdrop-blur-xs">
              {label}
            </span>
          )}
        </div>

        {/* 50% Neutral baseline indicator */}
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-red-500/30 z-10 pointer-events-none" />

        {/* White territory (bottom if white orientation) */}
        <div
          className="w-full bg-[#f1f1f1] transition-all duration-500 ease-out relative flex items-end justify-center pb-2 overflow-hidden border-t border-gray-300"
          style={{ height: whiteBarHeight }}
        >
          {isWhiteAdvantage && (
            <span className="text-[11px] font-mono font-black text-[#1b1a17] tracking-tight px-1 py-0.5 rounded bg-white/60 backdrop-blur-xs">
              {label}
            </span>
          )}
        </div>

        {/* Loading / Evaluating pulse bar indicator */}
        {loading && (
          <div className="absolute inset-0 bg-blue-500/10 pointer-events-none animate-pulse flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
          </div>
        )}
      </div>

      {/* Mode pill below the bar */}
      <div className="mt-1.5 flex items-center gap-1">
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isLive ? 'bg-emerald-400 animate-pulse' : 'bg-blue-400'
          }`}
        />
        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
          {isLive ? 'Live SF' : 'Review'}
        </span>
      </div>
    </div>
  );
};
