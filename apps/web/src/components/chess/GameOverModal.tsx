import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, RotateCcw, Microscope, Flame, X } from 'lucide-react';
import { PieceColor } from '@chess/shared';

interface GameOverModalProps {
  winner?: PieceColor | null;
  reason?: string;
  result?: string;
  playerColor?: 'white' | 'black';
  whiteRatingDelta?: number;
  blackRatingDelta?: number;
  gameId: string;
  onRematch?: () => void;
  onClose: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  winner,
  reason = 'Game Completed',
  result = '*',
  playerColor = 'white',
  whiteRatingDelta = 0,
  blackRatingDelta = 0,
  gameId,
  onRematch,
  onClose,
}) => {
  const navigate = useNavigate();

  const isPlayerWhite = playerColor === 'white';
  const playerWon = (winner === 'w' && isPlayerWhite) || (winner === 'b' && !isPlayerWhite);
  const isDraw = result === '1/2-1/2';
  const playerDelta = isPlayerWhite ? whiteRatingDelta : blackRatingDelta;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#262522] border border-[#3c3934] rounded-2xl p-6 shadow-chess-lg text-center">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#312e2b] transition-colors"
        >
          <X size={20} />
        </button>

        {/* Icon & Title */}
        <div className="flex justify-center mb-4">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
              playerWon
                ? 'bg-[#81b64c]/20 text-[#81b64c] border border-[#81b64c]/40 shadow-glow-green'
                : isDraw
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'bg-red-500/20 text-red-400 border border-red-500/40'
            }`}
          >
            <Trophy size={32} />
          </div>
        </div>

        <h2 className="text-2xl font-black text-white tracking-tight mb-1">
          {playerWon ? 'Victory!' : isDraw ? 'Draw' : 'Defeat'}
        </h2>

        <p className="text-sm text-gray-300 font-medium mb-4">{reason}</p>

        {/* Score & Rating Delta */}
        <div className="flex items-center justify-center gap-4 py-3 px-4 bg-[#1e1d1a] rounded-xl border border-[#312e2b] mb-6">
          <span className="text-xl font-mono font-bold text-gray-200">{result}</span>
          {playerDelta !== 0 && (
            <div
              className={`flex items-center gap-1 font-bold text-sm ${
                playerDelta > 0 ? 'text-[#81b64c]' : 'text-red-400'
              }`}
            >
              <Flame size={15} />
              <span>
                {playerDelta > 0 ? `+${playerDelta}` : playerDelta} Rating
              </span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="space-y-2.5">
          <button
            onClick={() => navigate(`/analysis?gameId=${gameId}`)}
            className="w-full py-3 px-4 bg-[#81b64c] hover:bg-[#95c65a] text-white font-bold rounded-xl shadow-glow-green flex items-center justify-center gap-2 transition-all"
          >
            <Microscope size={18} />
            <span>Game Review & Analysis</span>
          </button>

          {onRematch && (
            <button
              onClick={onRematch}
              className="w-full py-2.5 px-4 bg-[#312e2b] hover:bg-[#3d3a36] text-gray-200 font-semibold rounded-xl border border-[#3c3934] flex items-center justify-center gap-2 transition-all"
            >
              <RotateCcw size={16} />
              <span>Rematch</span>
            </button>
          )}

          <button
            onClick={() => {
              onClose();
              navigate('/');
            }}
            className="w-full py-2 px-4 text-gray-400 hover:text-white text-xs font-semibold transition-colors"
          >
            Back to Play Menu
          </button>
        </div>
      </div>
    </div>
  );
};
