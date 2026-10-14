import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { ChessBoardWrapper } from '../components/chess/ChessBoardWrapper.js';
import { api } from '../services/api.js';
import { sounds } from '../utils/sound.js';
import { useAuthStore } from '../store/authStore.js';
import { Puzzle, Zap, Lightbulb, RotateCcw, ArrowRight, CheckCircle2, Flame, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';

export const PuzzlesPage: React.FC = () => {
  const { user, refreshUser } = useAuthStore();
  const [puzzle, setPuzzle] = useState<any>(null);
  const [chess, setChess] = useState<Chess>(new Chess());
  const [currentPly, setCurrentPly] = useState(0);
  const [status, setStatus] = useState<'solving' | 'correct' | 'failed'>('solving');
  const [ratingDelta, setRatingDelta] = useState<number | null>(null);
  const [hintSquare, setHintSquare] = useState<string | null>(null);
  const [streakCount, setStreakCount] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [loading, setLoading] = useState(true);

  const loadNextPuzzle = async () => {
    setLoading(true);
    setStatus('solving');
    setRatingDelta(null);
    setHintSquare(null);
    setCurrentPly(0);

    try {
      const res = await api.getRatedPuzzle();
      const p = res.puzzle;
      setPuzzle(p);
      const c = new Chess(p.fen);
      setChess(c);
      setStartTime(Date.now());
    } catch (err) {
      console.error('Failed to load puzzle:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNextPuzzle();
  }, []);

  const handlePieceDrop = (source: string, target: string) => {
    if (status !== 'solving' || !puzzle) return false;

    try {
      const expectedMoveSan = puzzle.moves[currentPly];

      // Clone chess to test move
      const testChess = new Chess(chess.fen());
      const res = testChess.move({ from: source, to: target, promotion: 'q' });

      if (!res) return false;

      // Check if move matches expected SAN
      if (res.san === expectedMoveSan) {
        sounds.playMove();
        setChess(testChess);
        const nextPly = currentPly + 1;
        setCurrentPly(nextPly);

        // Check if puzzle is fully solved
        if (nextPly >= puzzle.moves.length) {
          handleSuccess();
          return true;
        }

        // Auto-play computer opponent response in puzzle sequence
        setTimeout(() => {
          const opponentMoveSan = puzzle.moves[nextPly];
          const autoChess = new Chess(testChess.fen());
          autoChess.move(opponentMoveSan);
          sounds.playMove();
          setChess(autoChess);
          setCurrentPly(nextPly + 1);

          if (nextPly + 1 >= puzzle.moves.length) {
            handleSuccess();
          }
        }, 500);

        return true;
      } else {
        // Wrong move
        sounds.playCheck();
        setStatus('failed');
        handleFailure();
        return false;
      }
    } catch {
      return false;
    }
  };

  const handleSuccess = async () => {
    setStatus('correct');
    sounds.playGameStart();
    setStreakCount((s) => s + 1);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });

    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    try {
      const res = await api.submitPuzzleAttempt(puzzle.id, {
        puzzleId: puzzle.id,
        success: true,
        timeSpentSeconds: elapsed,
      });
      setRatingDelta(res.ratingChange);
      refreshUser();
    } catch {}
  };

  const handleFailure = async () => {
    setStreakCount(0);
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    try {
      const res = await api.submitPuzzleAttempt(puzzle.id, {
        puzzleId: puzzle.id,
        success: false,
        timeSpentSeconds: elapsed,
      });
      setRatingDelta(res.ratingChange);
      refreshUser();
    } catch {}
  };

  const handleShowHint = () => {
    if (puzzle && puzzle.moves[currentPly]) {
      const expectedSan = puzzle.moves[currentPly];
      const moves = chess.moves({ verbose: true });
      const found = moves.find((m) => m.san === expectedSan);
      if (found) {
        setHintSquare(found.from);
      }
    }
  };

  const turn = chess.turn(); // 'w' or 'b'
  const orientation = puzzle ? (puzzle.fen.split(' ')[1] === 'w' ? 'white' : 'black') : 'white';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Puzzle className="text-amber-400" size={28} /> Tactics & Puzzles
          </h1>
          <p className="text-sm text-gray-400">
            Train your tactical calculation with rated chess combinations.
          </p>
        </div>

        {/* Streak Counter */}
        <div className="flex items-center gap-4 bg-[#262522] border border-[#3c3934] px-4 py-2 rounded-xl">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold text-sm">
            <Flame size={18} />
            <span>Streak: {streakCount}</span>
          </div>
          <div className="w-[1px] h-4 bg-[#3c3934]" />
          <div className="text-sm font-mono font-bold text-[#81b64c]">
            Rating: {user?.ratings?.puzzles || 1200}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Chessboard (7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full max-w-[540px]">
            <ChessBoardWrapper
              position={chess.fen()}
              boardOrientation={orientation}
              onPieceDrop={handlePieceDrop}
              arePiecesDraggable={status === 'solving'}
            />
          </div>
        </div>

        {/* Puzzle Card & Actions (5 cols) */}
        <div className="lg:col-span-5 p-6 bg-[#262522] border border-[#3c3934] rounded-2xl shadow-chess space-y-6">
          {/* Turn Banner */}
          <div className="p-3.5 bg-[#1e1d1a] border border-[#312e2b] rounded-xl flex items-center justify-between">
            <span className="text-sm font-bold text-white">
              {turn === 'w' ? 'White to move and win' : 'Black to move and win'}
            </span>
            <span className="text-xs font-mono font-bold text-gray-400">
              Puzzle #{puzzle?.id?.substring(4) || '1'}
            </span>
          </div>

          {/* Status Feedback */}
          {status === 'correct' && (
            <div className="p-4 bg-[#81b64c]/20 border border-[#81b64c]/40 rounded-xl flex items-center justify-between text-[#81b64c] shadow-glow-green">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 size={20} />
                <span>Solved! Brilliant move!</span>
              </div>
              {ratingDelta !== null && (
                <span className="font-mono font-bold text-base">+{ratingDelta}</span>
              )}
            </div>
          )}

          {status === 'failed' && (
            <div className="p-4 bg-red-950/40 border border-red-500/40 rounded-xl flex items-center justify-between text-red-400">
              <span className="font-bold text-sm">Not the best move. Try again!</span>
              {ratingDelta !== null && (
                <span className="font-mono font-bold text-base">{ratingDelta}</span>
              )}
            </div>
          )}

          {/* Themes Tags */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Tactical Themes</span>
            <div className="flex flex-wrap gap-1.5">
              {puzzle?.themes?.map((t: string) => (
                <span key={t} className="px-2.5 py-1 text-xs font-semibold bg-[#1e1d1a] text-gray-300 rounded-lg border border-[#363430]">
                  #{t}
                </span>
              ))}
            </div>
          </div>

          {puzzle?.description && (
            <p className="text-xs text-gray-400 italic">"{puzzle.description}"</p>
          )}

          {hintSquare && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs rounded-xl">
              Hint: Look at moves starting from square <strong>{hintSquare.toUpperCase()}</strong>.
            </div>
          )}

          {/* Controls */}
          <div className="space-y-3 pt-2">
            {status === 'correct' ? (
              <button
                onClick={loadNextPuzzle}
                className="w-full py-3.5 px-4 bg-[#81b64c] hover:bg-[#95c65a] text-white font-bold text-sm rounded-xl shadow-glow-green flex items-center justify-center gap-2 transition-all"
              >
                <span>Next Puzzle</span>
                <ArrowRight size={18} />
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleShowHint}
                  className="py-2.5 px-3 bg-[#1e1d1a] hover:bg-[#2b2926] text-amber-400 font-bold text-xs rounded-xl border border-[#3c3934] flex items-center justify-center gap-2 transition-all"
                >
                  <Lightbulb size={16} />
                  <span>Get Hint</span>
                </button>
                <button
                  onClick={() => {
                    if (puzzle) {
                      setChess(new Chess(puzzle.fen));
                      setCurrentPly(0);
                      setStatus('solving');
                    }
                  }}
                  className="py-2.5 px-3 bg-[#1e1d1a] hover:bg-[#2b2926] text-gray-300 font-bold text-xs rounded-xl border border-[#3c3934] flex items-center justify-center gap-2 transition-all"
                >
                  <RotateCcw size={16} />
                  <span>Retry</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
