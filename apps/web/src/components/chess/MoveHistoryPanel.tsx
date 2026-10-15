import React, { useRef, useEffect } from 'react';
import { ChessMoveRecord, MoveClassification } from '@chess/shared';
import { Copy, Download, Share2, Sparkles, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';

interface MoveHistoryPanelProps {
  moves: ChessMoveRecord[];
  currentMoveIndex?: number;
  onSelectMove?: (index: number) => void;
  pgn?: string;
  fen?: string;
}

export const MoveHistoryPanel: React.FC<MoveHistoryPanelProps> = ({
  moves,
  currentMoveIndex,
  onSelectMove,
  pgn = '',
  fen = '',
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Group moves into pairs (White & Black)
  const movePairs: { moveNumber: number; white?: ChessMoveRecord; black?: ChessMoveRecord }[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      moveNumber: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1],
    });
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [moves.length]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label} copied to clipboard!`);
  };

  const getClassificationBadge = (cls?: MoveClassification) => {
    switch (cls) {
      case 'brilliant':
        return (
          <span title="Brilliant Move (!!" className="inline-flex items-center ml-1 px-1 py-0.2 rounded bg-cyan-900/60 text-cyan-300 text-[9px] font-black">
            !!
          </span>
        );
      case 'great':
        return (
          <span title="Great Move (!)" className="inline-flex items-center ml-1 px-1 py-0.2 rounded bg-blue-900/60 text-blue-300 text-[9px] font-black">
            !
          </span>
        );
      case 'best':
        return (
          <span title="Best Move (★)" className="inline-flex items-center ml-1 px-1 py-0.2 rounded bg-[#81b64c]/30 text-[#95c65a] text-[9px] font-black">
            ★
          </span>
        );
      case 'excellent':
        return (
          <span title="Excellent Move" className="inline-flex items-center ml-1 px-1 py-0.2 rounded bg-emerald-900/40 text-emerald-300 text-[9px] font-black">
            ✓
          </span>
        );
      case 'book':
        return (
          <span title="Book Opening Move" className="inline-flex items-center ml-1 px-1 py-0.2 rounded bg-amber-900/40 text-amber-300 text-[9px] font-black">
            📖
          </span>
        );
      case 'inaccuracy':
        return (
          <span title="Inaccuracy (?!)" className="inline-flex items-center ml-1 px-1 py-0.2 rounded bg-amber-900/60 text-amber-300 text-[9px] font-black">
            ?!
          </span>
        );
      case 'mistake':
        return (
          <span title="Mistake (?)" className="inline-flex items-center ml-1 px-1 py-0.2 rounded bg-orange-900/60 text-orange-300 text-[9px] font-black">
            ?
          </span>
        );
      case 'blunder':
        return (
          <span title="Blunder (??)" className="inline-flex items-center ml-1 px-1 py-0.2 rounded bg-red-900/70 text-red-300 text-[9px] font-black">
            ??
          </span>
        );
      case 'missed_win':
        return (
          <span title="Missed Win" className="inline-flex items-center ml-1 px-1 py-0.2 rounded bg-purple-900/70 text-purple-300 text-[9px] font-black">
            ✕
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#262522] rounded-xl border border-[#3c3934] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#21201d] border-b border-[#312e2b]">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-300">Move History</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => copyToClipboard(pgn, 'PGN')}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#2b2926] transition-colors"
            title="Copy PGN"
          >
            <Download size={14} />
          </button>
          <button
            onClick={() => copyToClipboard(fen, 'FEN')}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#2b2926] transition-colors"
            title="Copy FEN"
          >
            <Copy size={14} />
          </button>
        </div>
      </div>

      {/* Move list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-0.5 font-mono text-xs">
        {movePairs.length === 0 ? (
          <div className="text-center py-8 text-gray-500 font-sans text-xs">
            Moves will appear here as you play.
          </div>
        ) : (
          movePairs.map((pair, idx) => {
            const whiteIndex = idx * 2;
            const blackIndex = idx * 2 + 1;
            const isWhiteActive = currentMoveIndex === whiteIndex;
            const isBlackActive = currentMoveIndex === blackIndex;

            return (
              <div
                key={pair.moveNumber}
                className="flex items-center px-2 py-1 rounded hover:bg-[#2b2926] transition-colors"
              >
                <span className="w-8 text-gray-500 font-semibold">{pair.moveNumber}.</span>
                {pair.white && (
                  <button
                    onClick={() => onSelectMove && onSelectMove(whiteIndex)}
                    className={`flex-1 text-left px-2 py-0.5 rounded font-bold transition-all ${
                      isWhiteActive ? 'bg-[#81b64c] text-white shadow-sm' : 'text-gray-200 hover:bg-[#363430]'
                    }`}
                  >
                    {pair.white.san}
                    {getClassificationBadge(pair.white.classification)}
                  </button>
                )}
                {pair.black && (
                  <button
                    onClick={() => onSelectMove && onSelectMove(blackIndex)}
                    className={`flex-1 text-left px-2 py-0.5 rounded font-bold transition-all ${
                      isBlackActive ? 'bg-[#81b64c] text-white shadow-sm' : 'text-gray-200 hover:bg-[#363430]'
                    }`}
                  >
                    {pair.black.san}
                    {getClassificationBadge(pair.black.classification)}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
