import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { ChessBoardWrapper } from '../components/chess/ChessBoardWrapper.js';
import { api } from '../services/api.js';
import { sounds } from '../utils/sound.js';
import { useAuthStore } from '../store/authStore.js';
import {
  Puzzle,
  Zap,
  Lightbulb,
  RotateCcw,
  ArrowRight,
  CheckCircle2,
  Flame,
  Trophy,
  Timer,
  ShieldAlert,
  Calendar,
  Layers,
  History,
  Sparkles,
  HelpCircle,
  Clock,
  Heart,
  TrendingUp,
  Filter,
} from 'lucide-react';
import confetti from 'canvas-confetti';

type PuzzleMode = 'rated' | 'daily' | 'rush' | 'survival' | 'themes' | 'recommendations' | 'leaderboard';

export const PuzzlesPage: React.FC = () => {
  const { user, refreshUser, isAuthenticated, openAuthModal } = useAuthStore();
  const [mode, setMode] = useState<PuzzleMode>('rated');

  // Active puzzle state
  const [puzzle, setPuzzle] = useState<any>(null);
  const [chess, setChess] = useState<Chess>(new Chess());
  const [currentPly, setCurrentPly] = useState(0);
  const [status, setStatus] = useState<'solving' | 'correct' | 'failed'>('solving');
  const [ratingDelta, setRatingDelta] = useState<number | null>(null);
  const [hintSquare, setHintSquare] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [streakCount, setStreakCount] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [loading, setLoading] = useState(true);

  // Themes state
  const [themesList, setThemesList] = useState<any[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string>('fork');

  // History & Recommendations state
  const [historyData, setHistoryData] = useState<{ attempts: any[]; stats: any }>({ attempts: [], stats: {} });
  const [recommendations, setRecommendations] = useState<{ recommendedTheme: string; puzzles: any[] }>({
    recommendedTheme: '',
    puzzles: [],
  });

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<{ ratingLeaderboard: any[]; rushLeaderboard: any[] }>({
    ratingLeaderboard: [],
    rushLeaderboard: [],
  });

  // Puzzle Rush / Survival State
  const [rushTimeLeft, setRushTimeLeft] = useState<number>(180); // 3 minutes in seconds
  const [rushScore, setRushScore] = useState<number>(0);
  const [rushStrikes, setRushStrikes] = useState<number>(0);
  const [rushPuzzles, setRushPuzzles] = useState<any[]>([]);
  const [rushIndex, setRushIndex] = useState<number>(0);
  const [isRushActive, setIsRushActive] = useState<boolean>(false);
  const [isRushGameOver, setIsRushGameOver] = useState<boolean>(false);
  const rushTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load themes on mount
  useEffect(() => {
    api.getPuzzleThemes().then((res) => setThemesList(res.themes || [])).catch(console.error);
    api.getPuzzleLeaderboard().then(setLeaderboard).catch(console.error);
  }, []);

  // Mode Switch Handler
  const handleModeChange = (newMode: PuzzleMode) => {
    setMode(newMode);
    setStatus('solving');
    setRatingDelta(null);
    setHintSquare(null);
    setExplanation(null);

    // Stop rush timer if leaving rush
    if (rushTimerRef.current) {
      clearInterval(rushTimerRef.current);
      rushTimerRef.current = null;
    }
    setIsRushActive(false);
    setIsRushGameOver(false);

    if (newMode === 'daily') {
      loadDailyPuzzle();
    } else if (newMode === 'rated') {
      loadRatedPuzzle();
    } else if (newMode === 'themes') {
      loadThemePuzzle(selectedTheme);
    } else if (newMode === 'recommendations') {
      loadRecommendations();
    } else if (newMode === 'leaderboard') {
      loadHistoryAndLeaderboard();
    }
  };

  const loadRatedPuzzle = async () => {
    setLoading(true);
    setStatus('solving');
    setRatingDelta(null);
    setHintSquare(null);
    setExplanation(null);
    setCurrentPly(0);

    try {
      const res = await api.getRatedPuzzle();
      const p = res.puzzle;
      setPuzzle(p);
      setChess(new Chess(p.fen));
      setStartTime(Date.now());
    } catch (err) {
      console.error('Failed to load rated puzzle:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDailyPuzzle = async () => {
    setLoading(true);
    setStatus('solving');
    setRatingDelta(null);
    setHintSquare(null);
    setExplanation(null);
    setCurrentPly(0);

    try {
      const res = await api.getDailyPuzzle();
      const p = res.puzzle;
      setPuzzle(p);
      setChess(new Chess(p.fen));
      setStartTime(Date.now());
    } catch (err) {
      console.error('Failed to load daily puzzle:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadThemePuzzle = async (theme: string) => {
    setLoading(true);
    setStatus('solving');
    setRatingDelta(null);
    setHintSquare(null);
    setExplanation(null);
    setCurrentPly(0);

    try {
      const res = await api.getRandomPuzzle({ theme });
      const p = res.puzzle;
      setPuzzle(p);
      setChess(new Chess(p.fen));
      setStartTime(Date.now());
    } catch (err) {
      console.error('Failed to load theme puzzle:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const res = await api.getPuzzleRecommendations();
      setRecommendations(res);
      if (res.puzzles && res.puzzles.length > 0) {
        const p = res.puzzles[0];
        setPuzzle(p);
        setChess(new Chess(p.fen));
        setCurrentPly(0);
      }
    } catch (err) {
      console.error('Failed to load recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadHistoryAndLeaderboard = async () => {
    try {
      if (isAuthenticated) {
        const hist = await api.getPuzzleHistory();
        setHistoryData(hist);
      }
      const lead = await api.getPuzzleLeaderboard();
      setLeaderboard(lead);
    } catch (err) {
      console.error('Failed to load history/leaderboard:', err);
    }
  };

  // Start Puzzle Rush (Timed 3min or Survival)
  const startPuzzleRush = async (rushMode: '3min' | 'survival') => {
    try {
      setLoading(true);
      const res = await api.getPuzzleRush();
      const pool = res.puzzles || [];
      if (pool.length === 0) return;

      setRushPuzzles(pool);
      setRushIndex(0);
      setRushScore(0);
      setRushStrikes(0);
      setIsRushActive(true);
      setIsRushGameOver(false);
      setRushTimeLeft(rushMode === '3min' ? 180 : 9999);

      const first = pool[0];
      setPuzzle(first);
      setChess(new Chess(first.fen));
      setCurrentPly(0);
      setStatus('solving');
      setStartTime(Date.now());

      if (rushTimerRef.current) clearInterval(rushTimerRef.current);

      if (rushMode === '3min') {
        rushTimerRef.current = setInterval(() => {
          setRushTimeLeft((t) => {
            if (t <= 1) {
              endRushGame();
              return 0;
            }
            return t - 1;
          });
        }, 1000);
      }
    } catch (err) {
      console.error('Failed to start puzzle rush:', err);
    } finally {
      setLoading(false);
    }
  };

  const endRushGame = async () => {
    if (rushTimerRef.current) {
      clearInterval(rushTimerRef.current);
      rushTimerRef.current = null;
    }
    setIsRushActive(false);
    setIsRushGameOver(true);

    if (isAuthenticated && rushScore > 0) {
      try {
        await api.submitPuzzleRushScore(rushScore, mode === 'survival' ? 'survival' : '3min');
        api.getPuzzleLeaderboard().then(setLeaderboard).catch(console.error);
      } catch (err) {
        console.error('Failed to record rush score:', err);
      }
    }
  };

  // Initial load
  useEffect(() => {
    loadRatedPuzzle();
    return () => {
      if (rushTimerRef.current) clearInterval(rushTimerRef.current);
    };
  }, []);

  const handlePieceDrop = (source: string, target: string) => {
    if (status !== 'solving' || !puzzle) return false;

    try {
      const expectedMoveSanOrUci = puzzle.moves[currentPly];

      // Clone chess to test move
      const testChess = new Chess(chess.fen());
      const res = testChess.move({ from: source, to: target, promotion: 'q' });
      if (!res) return false;

      const playedUci = `${source}${target}${res.promotion || ''}`;
      const isExpected = res.san === expectedMoveSanOrUci || playedUci === expectedMoveSanOrUci;

      if (isExpected) {
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
          const opponentMove = puzzle.moves[nextPly];
          const autoChess = new Chess(testChess.fen());

          if (opponentMove.length === 4 || opponentMove.length === 5) {
            autoChess.move({
              from: opponentMove.slice(0, 2),
              to: opponentMove.slice(2, 4),
              promotion: opponentMove.length > 4 ? opponentMove[4] : undefined,
            });
          } else {
            autoChess.move(opponentMove);
          }

          sounds.playMove();
          setChess(autoChess);
          setCurrentPly(nextPly + 1);

          if (nextPly + 1 >= puzzle.moves.length) {
            handleSuccess();
          }
        }, 450);

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

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });

    if (isRushActive) {
      setRushScore((s) => s + 1);
      // Advance to next rush puzzle
      const nextIdx = rushIndex + 1;
      if (nextIdx < rushPuzzles.length) {
        setRushIndex(nextIdx);
        const nextP = rushPuzzles[nextIdx];
        setTimeout(() => {
          setPuzzle(nextP);
          setChess(new Chess(nextP.fen));
          setCurrentPly(0);
          setStatus('solving');
        }, 500);
      } else {
        endRushGame();
      }
      return;
    }

    setStreakCount((s) => s + 1);
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
    if (isRushActive) {
      const newStrikes = rushStrikes + 1;
      setRushStrikes(newStrikes);
      if (newStrikes >= 3) {
        endRushGame();
        return;
      }
      // In rush, move to next puzzle on mistake
      const nextIdx = rushIndex + 1;
      if (nextIdx < rushPuzzles.length) {
        setRushIndex(nextIdx);
        const nextP = rushPuzzles[nextIdx];
        setTimeout(() => {
          setPuzzle(nextP);
          setChess(new Chess(nextP.fen));
          setCurrentPly(0);
          setStatus('solving');
        }, 800);
      } else {
        endRushGame();
      }
      return;
    }

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
      const expected = puzzle.moves[currentPly];
      if (expected.length >= 4) {
        setHintSquare(expected.slice(0, 2));
      } else {
        const moves = chess.moves({ verbose: true });
        const found = moves.find((m) => m.san === expected);
        if (found) setHintSquare(found.from);
      }
    }
  };

  const handleShowSolution = () => {
    if (puzzle && puzzle.moves) {
      setExplanation(`The winning tactical sequence is: ${puzzle.moves.join(' → ')}.`);
    }
  };

  const turn = chess.turn();
  const orientation = puzzle ? (puzzle.fen.split(' ')[1] === 'w' ? 'white' : 'black') : 'white';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Mode Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Puzzle className="text-amber-400" size={28} /> Tactics & Puzzles
          </h1>
          <p className="text-sm text-gray-400">
            Official Lichess Open Puzzle Database (CC0). Daily challenges, puzzle rush, and theme practice.
          </p>
        </div>

        {/* Global Puzzle Rating & Streak */}
        <div className="flex items-center gap-4 bg-[#262522] border border-[#3c3934] px-4 py-2 rounded-2xl shadow-chess">
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

      {/* Mode Navigation Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-[#262522] border border-[#3c3934] rounded-2xl">
        <button
          onClick={() => handleModeChange('rated')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            mode === 'rated'
              ? 'bg-[#81b64c] text-white shadow-glow-green'
              : 'text-gray-400 hover:text-white hover:bg-[#312e2b]'
          }`}
        >
          <TrendingUp size={15} /> Rated Puzzles
        </button>

        <button
          onClick={() => handleModeChange('daily')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            mode === 'daily'
              ? 'bg-[#81b64c] text-white shadow-glow-green'
              : 'text-gray-400 hover:text-white hover:bg-[#312e2b]'
          }`}
        >
          <Calendar size={15} /> Daily Puzzle
        </button>

        <button
          onClick={() => handleModeChange('rush')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            mode === 'rush' || mode === 'survival'
              ? 'bg-amber-500 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-[#312e2b]'
          }`}
        >
          <Zap size={15} /> Puzzle Rush & Survival
        </button>

        <button
          onClick={() => handleModeChange('themes')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            mode === 'themes'
              ? 'bg-[#81b64c] text-white shadow-glow-green'
              : 'text-gray-400 hover:text-white hover:bg-[#312e2b]'
          }`}
        >
          <Layers size={15} /> Themes Explorer
        </button>

        <button
          onClick={() => handleModeChange('recommendations')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            mode === 'recommendations'
              ? 'bg-[#81b64c] text-white shadow-glow-green'
              : 'text-gray-400 hover:text-white hover:bg-[#312e2b]'
          }`}
        >
          <Sparkles size={15} /> Fix My Mistakes
        </button>

        <button
          onClick={() => handleModeChange('leaderboard')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            mode === 'leaderboard'
              ? 'bg-[#81b64c] text-white shadow-glow-green'
              : 'text-gray-400 hover:text-white hover:bg-[#312e2b]'
          }`}
        >
          <Trophy size={15} /> Leaderboard & History
        </button>
      </div>

      {/* Main Mode Views */}
      {mode === 'leaderboard' ? (
        /* Leaderboards and History View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Puzzle Ratings */}
          <div className="p-6 bg-[#262522] border border-[#3c3934] rounded-2xl shadow-chess space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Trophy size={18} className="text-amber-400" /> Puzzle Rating Leaderboard
            </h3>
            <div className="divide-y divide-[#312e2b]">
              {leaderboard.ratingLeaderboard?.map((entry, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-gray-500 w-5">#{idx + 1}</span>
                    <span className="font-bold text-white">{entry.username}</span>
                  </div>
                  <span className="font-mono font-bold text-[#81b64c]">{entry.rating} Elo</span>
                </div>
              ))}
            </div>
          </div>

          {/* Puzzle Rush Top Scores */}
          <div className="p-6 bg-[#262522] border border-[#3c3934] rounded-2xl shadow-chess space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Zap size={18} className="text-amber-400" /> Puzzle Rush High Scores
            </h3>
            <div className="divide-y divide-[#312e2b]">
              {leaderboard.rushLeaderboard?.length === 0 ? (
                <p className="py-4 text-xs text-gray-400">No rush records yet. Be the first to set one!</p>
              ) : (
                leaderboard.rushLeaderboard?.map((entry, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-gray-500 w-5">#{idx + 1}</span>
                      <span className="font-bold text-white">{entry.username}</span>
                      <span className="text-[10px] text-gray-400 uppercase">({entry.mode})</span>
                    </div>
                    <span className="font-mono font-bold text-amber-400">{entry.score} solved</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Solver View (Chessboard + Controls) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Chessboard (7 cols) */}
          <div className="lg:col-span-7 flex flex-col items-center">
            {/* Rush Timer & Strikes Banner if in Rush mode */}
            {isRushActive && (
              <div className="w-full max-w-[540px] mb-4 p-3 bg-gradient-to-r from-amber-950/40 via-[#262522] to-amber-950/40 border border-amber-500/40 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <Clock size={16} />
                  <span>
                    {Math.floor(rushTimeLeft / 60)}:{(rushTimeLeft % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                <div className="font-mono font-black text-white text-lg">Score: {rushScore}</div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3].map((s) => (
                    <span
                      key={s}
                      className={`text-sm ${s <= rushStrikes ? 'text-rose-500' : 'text-gray-600'}`}
                    >
                      ✖
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="w-full max-w-[540px]">
              <ChessBoardWrapper
                position={chess.fen()}
                boardOrientation={orientation}
                onPieceDrop={handlePieceDrop}
                arePiecesDraggable={status === 'solving'}
              />
            </div>

            {/* CC0 Attribution Footer */}
            <div className="mt-3 text-[11px] text-gray-400 flex items-center gap-1.5">
              <span>Source:</span>
              <a
                href="https://database.lichess.org/#puzzles"
                target="_blank"
                rel="noreferrer"
                className="text-[#81b64c] hover:underline"
              >
                Lichess Open Puzzle Database (CC0 1.0)
              </a>
            </div>
          </div>

          {/* Puzzle Card & Actions (5 cols) */}
          <div className="lg:col-span-5 p-6 bg-[#262522] border border-[#3c3934] rounded-2xl shadow-chess space-y-6">
            {/* Rush Mode Selector if on Rush Tab */}
            {(mode === 'rush' || mode === 'survival') && !isRushActive && (
              <div className="p-4 bg-[#1e1d1a] border border-[#312e2b] rounded-xl space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Zap size={16} className="text-amber-400" /> Choose Challenge Mode
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => startPuzzleRush('3min')}
                    className="p-3 bg-amber-500 hover:bg-amber-400 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
                  >
                    3-Minute Rush
                  </button>
                  <button
                    onClick={() => startPuzzleRush('survival')}
                    className="p-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
                  >
                    Survival (3 Strikes)
                  </button>
                </div>
                {isRushGameOver && (
                  <div className="p-3 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs rounded-xl text-center font-bold">
                    Game Over! Final Score: {rushScore} puzzles solved!
                  </div>
                )}
              </div>
            )}

            {/* Theme Selector if on Themes Tab */}
            {mode === 'themes' && (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Select Tactical Theme
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 bg-[#1c1b18] rounded-xl border border-[#3c3934]">
                  {themesList.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSelectedTheme(t.id);
                        loadThemePuzzle(t.id);
                      }}
                      className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all ${
                        selectedTheme === t.id
                          ? 'bg-[#81b64c] text-white shadow-glow-green'
                          : 'bg-[#262522] text-gray-300 hover:bg-[#312e2b]'
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Turn Banner */}
            <div className="p-3.5 bg-[#1e1d1a] border border-[#312e2b] rounded-xl flex items-center justify-between">
              <span className="text-sm font-bold text-white">
                {turn === 'w' ? 'White to move and win' : 'Black to move and win'}
              </span>
              <span className="text-xs font-mono font-bold text-gray-400">
                {puzzle?.rating ? `${puzzle.rating} Elo` : 'Rated'}
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
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Tactical Motifs
              </span>
              <div className="flex flex-wrap gap-1.5">
                {puzzle?.themes?.map((t: string) => (
                  <span
                    key={t}
                    className="px-2.5 py-1 text-xs font-semibold bg-[#1e1d1a] text-gray-300 rounded-lg border border-[#363430]"
                  >
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
                Hint: Look for active moves starting from square <strong>{hintSquare.toUpperCase()}</strong>.
              </div>
            )}

            {explanation && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs rounded-xl">
                {explanation}
              </div>
            )}

            {/* Controls */}
            <div className="space-y-3 pt-2">
              {status === 'correct' ? (
                <button
                  onClick={() => {
                    if (mode === 'daily') loadDailyPuzzle();
                    else if (mode === 'themes') loadThemePuzzle(selectedTheme);
                    else loadRatedPuzzle();
                  }}
                  className="w-full py-3.5 px-4 bg-[#81b64c] hover:bg-[#95c65a] text-white font-bold text-sm rounded-xl shadow-glow-green flex items-center justify-center gap-2 transition-all"
                >
                  <span>Next Puzzle</span>
                  <ArrowRight size={18} />
                </button>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={handleShowHint}
                    className="py-2.5 px-2 bg-[#1e1d1a] hover:bg-[#2b2926] text-amber-400 font-bold text-xs rounded-xl border border-[#3c3934] flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Lightbulb size={15} />
                    <span>Hint</span>
                  </button>
                  <button
                    onClick={handleShowSolution}
                    className="py-2.5 px-2 bg-[#1e1d1a] hover:bg-[#2b2926] text-blue-400 font-bold text-xs rounded-xl border border-[#3c3934] flex items-center justify-center gap-1.5 transition-all"
                  >
                    <HelpCircle size={15} />
                    <span>Solution</span>
                  </button>
                  <button
                    onClick={() => {
                      if (puzzle) {
                        setChess(new Chess(puzzle.fen));
                        setCurrentPly(0);
                        setStatus('solving');
                        setHintSquare(null);
                      }
                    }}
                    className="py-2.5 px-2 bg-[#1e1d1a] hover:bg-[#2b2926] text-gray-300 font-bold text-xs rounded-xl border border-[#3c3934] flex items-center justify-center gap-1.5 transition-all"
                  >
                    <RotateCcw size={15} />
                    <span>Retry</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
