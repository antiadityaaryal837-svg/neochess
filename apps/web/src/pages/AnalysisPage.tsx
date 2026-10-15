import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Chess } from 'chess.js';
import { ChessBoardWrapper } from '../components/chess/ChessBoardWrapper.js';
import { EvalBar } from '../components/chess/EvalBar.js';
import { MoveHistoryPanel } from '../components/chess/MoveHistoryPanel.js';
import { api } from '../services/api.js';
import { sounds } from '../utils/sound.js';
import { CLASSIFICATION_METADATA } from '@chess/shared';
import {
  Microscope,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Upload,
  Sparkles,
  RefreshCw,
  ArrowRight,
  Trophy,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const AnalysisPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const gameId = searchParams.get('gameId');

  const [chess, setChess] = useState<Chess>(new Chess());
  const [fenInput, setFenInput] = useState('');
  const [pgnInput, setPgnInput] = useState('');
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');
  const [moveHistory, setMoveHistory] = useState<any[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState<number>(-1);

  // Engine evaluation states (normalized to White perspective)
  const [evalScore, setEvalScore] = useState<number>(20);
  const [mateInMoves, setMateInMoves] = useState<number | undefined>(undefined);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [engineDepth, setEngineDepth] = useState<number>(10);
  const [bestMove, setBestMove] = useState<string>('');
  const [pvLines, setPvLines] = useState<string[]>([]);

  // Game review report state
  const [analysisReport, setAnalysisReport] = useState<any>(null);
  const [isReviewLoading, setIsReviewLoading] = useState<boolean>(false);
  const [openingName, setOpeningName] = useState<string>('');

  // Retry mistake state
  const [retryTargetMove, setRetryTargetMove] = useState<any | null>(null);
  const [retrySuccess, setRetrySuccess] = useState<boolean | null>(null);

  // Active side panel tab: 'review' | 'table' | 'lines' | 'moments' | 'import'
  const [activeTab, setActiveTab] = useState<'review' | 'table' | 'lines' | 'moments' | 'import'>('review');

  // Trigger live Stockfish evaluation for current board FEN
  const evaluateCurrentPosition = useCallback(async (fen: string) => {
    setIsEvaluating(true);
    try {
      const res = await api.evaluatePosition(fen, 10);
      if (res && res.evaluation) {
        setEvalScore(res.evaluation.whiteScoreCentipawns ?? 0);
        setMateInMoves(res.evaluation.whiteMateInMoves);
        setEngineDepth(res.evaluation.depth || 10);
        setBestMove(res.evaluation.bestMoveSan || res.evaluation.bestMove || '');
        setPvLines(res.evaluation.pvSan || res.evaluation.pv || []);
      }
    } catch (err) {
      console.warn('Live Stockfish evaluation warning:', err);
    } finally {
      setIsEvaluating(false);
    }

    // Lookup opening
    try {
      const openRes = await api.lookupOpening(fen);
      if (openRes && openRes.matched && openRes.opening) {
        setOpeningName(`${openRes.opening.eco} — ${openRes.opening.name}`);
      }
    } catch {
      // Ignore opening lookup failures
    }
  }, []);

  // Load game from database if gameId param is present
  useEffect(() => {
    if (gameId) {
      setIsReviewLoading(true);
      api.getGame(gameId)
        .then((res) => {
          if (res.game) {
            const c = new Chess();
            if (res.game.pgn) {
              try {
                c.loadPgn(res.game.pgn);
              } catch {}
            } else if (res.game.fen) {
              try {
                c.load(res.game.fen);
              } catch {}
            }

            const history = res.game.moves || [];
            setMoveHistory(history);
            setCurrentMoveIndex(history.length - 1);
            setChess(c);
            evaluateCurrentPosition(c.fen());

            // Run / load full Stockfish review
            api.analyzeGame(gameId)
              .then((reviewRes) => {
                if (reviewRes.report) {
                  setAnalysisReport(reviewRes.report);
                  if (reviewRes.moves && reviewRes.moves.length > 0) {
                    setMoveHistory(reviewRes.moves);
                  }
                }
              })
              .catch(console.error)
              .finally(() => setIsReviewLoading(false));
          }
        })
        .catch(() => setIsReviewLoading(false));
    } else {
      evaluateCurrentPosition(chess.fen());
    }
  }, [gameId, evaluateCurrentPosition]);

  // Jump to specific move index (-1 = initial board, 0 = move 1 White, 1 = move 1 Black, ...)
  const handleSelectMove = (index: number) => {
    if (index < -1 || index >= moveHistory.length) return;
    setCurrentMoveIndex(index);
    setRetryTargetMove(null);
    setRetrySuccess(null);

    const c = new Chess();
    for (let i = 0; i <= index; i++) {
      const m = moveHistory[i];
      try {
        if (m.fromSquare && m.toSquare) {
          c.move({ from: m.fromSquare, to: m.toSquare, promotion: m.promotion || 'q' });
        } else if (m.san) {
          c.move(m.san);
        }
      } catch {
        break;
      }
    }

    setChess(c);
    sounds.playMove();

    // Use cached move eval if present in analysisReport, else live evaluate
    const moveAnalysis = analysisReport?.moveAnalyses?.[index];
    if (moveAnalysis) {
      setEvalScore(moveAnalysis.whiteEval ?? 0);
      setMateInMoves(moveAnalysis.mateInMoves);
      setBestMove(moveAnalysis.bestMoveSan || moveAnalysis.bestMove || '');
    } else {
      evaluateCurrentPosition(c.fen());
    }
  };

  // Keyboard navigation (Arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea'].includes((e.target as HTMLElement).tagName.toLowerCase())) return;

      if (e.key === 'ArrowLeft') {
        handleSelectMove(currentMoveIndex - 1);
      } else if (e.key === 'ArrowRight') {
        handleSelectMove(currentMoveIndex + 1);
      } else if (e.key === 'ArrowUp') {
        handleSelectMove(-1);
      } else if (e.key === 'ArrowDown') {
        handleSelectMove(moveHistory.length - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentMoveIndex, moveHistory]);

  // Piece drop handler in free analysis / retry mode
  const handlePieceDrop = (source: string, target: string) => {
    try {
      const clone = new Chess(chess.fen());
      const res = clone.move({ from: source, to: target, promotion: 'q' });
      if (!res) return false;

      // Check retry mode
      if (retryTargetMove) {
        const expectedBest = retryTargetMove.bestMoveSan || retryTargetMove.bestMove;
        const isBestFound =
          res.san === expectedBest || `${source}${target}` === retryTargetMove.bestMove;

        if (isBestFound) {
          sounds.playGameStart();
          setRetrySuccess(true);
          confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
        } else {
          sounds.playCheck();
          setRetrySuccess(false);
        }
      } else {
        sounds.playMove();
      }

      setChess(clone);
      evaluateCurrentPosition(clone.fen());
      return true;
    } catch {
      return false;
    }
  };

  // Start retry mode for a specific mistake/blunder
  const handleStartRetry = (targetMove: any) => {
    setRetryTargetMove(targetMove);
    setRetrySuccess(null);

    // Roll board back to position BEFORE this mistake was played
    const targetIdx = moveHistory.findIndex(
      (m) => m.moveNumber === targetMove.moveNumber && m.color === targetMove.color
    );

    if (targetIdx >= 0) {
      handleSelectMove(targetIdx - 1);
    }
  };

  // Load custom FEN position
  const handleLoadFen = () => {
    if (!fenInput.trim()) return;
    try {
      const c = new Chess(fenInput.trim());
      setChess(c);
      setMoveHistory([]);
      setCurrentMoveIndex(-1);
      setAnalysisReport(null);
      evaluateCurrentPosition(c.fen());
    } catch {
      alert('Invalid FEN position string');
    }
  };

  // Load PGN notation
  const handleLoadPgn = () => {
    if (!pgnInput.trim()) return;
    try {
      const c = new Chess();
      c.loadPgn(pgnInput.trim());
      const historyMoves = c.history({ verbose: true }).map((m, idx) => ({
        moveNumber: Math.floor(idx / 2) + 1,
        color: m.color,
        san: m.san,
        fromSquare: m.from,
        toSquare: m.to,
        promotion: m.promotion,
        fen: m.after,
      }));

      setMoveHistory(historyMoves);
      setCurrentMoveIndex(historyMoves.length - 1);
      setChess(c);
      evaluateCurrentPosition(c.fen());

      // Trigger full Stockfish review on imported moves
      runEngineReviewOnMoves(historyMoves);
    } catch (err) {
      alert('Invalid PGN notation');
    }
  };

  const runEngineReviewOnMoves = async (moves: any[]) => {
    if (moves.length === 0) return;
    setIsReviewLoading(true);
    try {
      const sf = (await import('@chess/chess')).getStockfishEngine();
      const report = await sf.analyzeGame(moves, 8);
      setAnalysisReport(report);
      if (report.moveAnalyses) {
        setMoveHistory(report.moveAnalyses);
      }
    } catch (err) {
      console.error('Engine review error:', err);
    } finally {
      setIsReviewLoading(false);
    }
  };

  const currentMove = moveHistory[currentMoveIndex];
  const currentMoveAnalysis = analysisReport?.moveAnalyses?.[currentMoveIndex];

  // Visual move classification metadata
  const currentClassification = (currentMove?.classification || currentMoveAnalysis?.classification) as string;
  const classificationInfo = currentClassification ? CLASSIFICATION_METADATA[currentClassification] : null;

  // Build custom arrows for recommended best moves
  const customArrows: [string, string, string?][] = useMemo(() => {
    if (bestMove && bestMove.length >= 4) {
      // If best move is UCI e.g. 'e2e4'
      const from = bestMove.slice(0, 2);
      const to = bestMove.slice(2, 4);
      return [[from, to, 'rgba(38, 194, 163, 0.85)']];
    }
    return [];
  }, [bestMove]);

  const keyMoments = analysisReport?.keyMoments || [];
  const classificationCounts = analysisReport?.classificationCounts;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Microscope className="text-[#81b64c]" size={28} /> Stockfish Game Review & Deep Analysis
          </h1>
          <p className="text-sm text-gray-400">
            Move-by-move engine evaluation, colorful Chess.com-style classifications, accuracy rings, and mistake retries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setOrientation((o) => (o === 'white' ? 'black' : 'white'))}
            className="px-3.5 py-2 bg-[#262522] hover:bg-[#312e2b] text-gray-300 hover:text-white rounded-xl border border-[#3c3934] text-xs font-semibold flex items-center gap-2 transition-all"
            title="Flip Board"
          >
            <RotateCw size={15} />
            <span>Flip</span>
          </button>

          {moveHistory.length > 0 && !analysisReport && (
            <button
              onClick={() => runEngineReviewOnMoves(moveHistory)}
              disabled={isReviewLoading}
              className="px-4 py-2 bg-[#81b64c] hover:bg-[#95c65a] disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-glow-green flex items-center gap-1.5 transition-all"
            >
              <Sparkles size={15} />
              <span>{isReviewLoading ? 'Reviewing...' : 'Run Game Review'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Eval Bar + Chessboard + Side Review Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Eval Bar + Board (7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full max-w-[560px] flex gap-3 items-stretch">
            {/* Dynamic Stockfish Evaluation Bar */}
            <div className="w-8 flex-shrink-0 self-stretch">
              <EvalBar
                scoreCentipawns={evalScore}
                mateInMoves={mateInMoves}
                orientation={orientation}
                isEvaluating={isEvaluating}
              />
            </div>

            {/* Chessboard */}
            <div className="flex-1">
              <ChessBoardWrapper
                position={chess.fen()}
                boardOrientation={orientation}
                onPieceDrop={handlePieceDrop}
                customArrows={customArrows}
                arePiecesDraggable={true}
              />
            </div>
          </div>

          {/* Interactive Move Classification Bar Timeline */}
          {moveHistory.length > 0 && (
            <div className="w-full max-w-[560px] mt-4 p-2 bg-[#262522] border border-[#3c3934] rounded-xl flex items-center gap-1 overflow-x-auto">
              {moveHistory.map((m, idx) => {
                const cls = (m.classification || analysisReport?.moveAnalyses?.[idx]?.classification) as string;
                const meta = cls ? CLASSIFICATION_METADATA[cls] : null;
                const isSelected = idx === currentMoveIndex;

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectMove(idx)}
                    className={`h-6 min-w-[20px] px-1 rounded flex items-center justify-center text-[10px] font-black transition-all ${
                      isSelected
                        ? 'ring-2 ring-white scale-110 z-10'
                        : 'opacity-85 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: meta ? meta.color : m.color === 'w' ? '#e2e8f0' : '#475569',
                      color: meta ? '#ffffff' : m.color === 'w' ? '#0f172a' : '#ffffff',
                    }}
                    title={`${m.moveNumber}. ${m.san} (${meta?.label || 'Normal'})`}
                  >
                    {meta ? meta.badge : idx + 1}
                  </button>
                );
              })}
            </div>
          )}

          {/* Navigation Controls */}
          <div className="w-full max-w-[560px] mt-3 flex items-center justify-between p-2.5 bg-[#262522] rounded-xl border border-[#3c3934]">
            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-mono">
              <span>Position:</span>
              <span className="font-bold text-white">
                {currentMoveIndex >= 0 ? `${currentMove?.moveNumber}. ${currentMove?.san}` : 'Start'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleSelectMove(-1)}
                disabled={currentMoveIndex < 0}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#312e2b] disabled:opacity-30"
                title="Start"
              >
                <ChevronsLeft size={18} />
              </button>
              <button
                onClick={() => handleSelectMove(currentMoveIndex - 1)}
                disabled={currentMoveIndex < 0}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#312e2b] disabled:opacity-30"
                title="Previous"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => handleSelectMove(currentMoveIndex + 1)}
                disabled={currentMoveIndex >= moveHistory.length - 1}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#312e2b] disabled:opacity-30"
                title="Next"
              >
                <ChevronRight size={18} />
              </button>
              <button
                onClick={() => handleSelectMove(moveHistory.length - 1)}
                disabled={currentMoveIndex >= moveHistory.length - 1}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#312e2b] disabled:opacity-30"
                title="End"
              >
                <ChevronsRight size={18} />
              </button>
            </div>

            <div className="text-[11px] font-mono font-semibold text-gray-400">
              Depth: <strong className="text-[#81b64c]">{engineDepth}</strong>
            </div>
          </div>

          {/* Move Quality Feedback Banner */}
          {classificationInfo && currentMove && (
            <div
              className="w-full max-w-[560px] mt-3 p-4 rounded-2xl border transition-all shadow-md animate-in fade-in duration-200"
              style={{
                backgroundColor: classificationInfo.bg,
                borderColor: classificationInfo.border,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="px-2.5 py-1 rounded-lg text-xs font-black uppercase text-white shadow-sm"
                    style={{ backgroundColor: classificationInfo.color }}
                  >
                    {classificationInfo.label} {classificationInfo.badge}
                  </span>
                  <span className="font-bold text-white text-sm">
                    {currentMove.moveNumber}. {currentMove.san}
                  </span>
                </div>

                {['inaccuracy', 'mistake', 'blunder', 'missed_win'].includes(currentClassification) && (
                  <button
                    onClick={() => handleStartRetry(currentMove)}
                    className="px-3 py-1 bg-[#1e1d1a] hover:bg-[#2b2926] text-white text-xs font-bold rounded-lg border border-[#3c3934] flex items-center gap-1.5 transition-all"
                  >
                    <RotateCcw size={12} />
                    <span>Retry Move</span>
                  </button>
                )}
              </div>

              <p className="text-xs text-gray-200 mt-2 leading-relaxed">
                {currentMove.comment || classificationInfo.description}
              </p>

              {bestMove && (
                <div className="mt-2 text-xs text-emerald-300 font-mono flex items-center gap-1.5">
                  <Sparkles size={13} />
                  <span>Engine Best Move: <strong>{bestMove}</strong></span>
                </div>
              )}
            </div>
          )}

          {/* Retry Feedback Prompt */}
          {retryTargetMove && (
            <div className="w-full max-w-[560px] mt-3 p-4 bg-amber-950/20 border border-amber-500/40 rounded-2xl space-y-2">
              <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <RotateCcw size={14} /> Retry Exercise Active
              </div>
              <p className="text-xs text-gray-300">
                You played <strong>{retryTargetMove.san}</strong> ({retryTargetMove.classification}). What should you have played instead?
              </p>
              {retrySuccess === true && (
                <div className="p-2 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-lg flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> Excellent! You found the best move!
                </div>
              )}
              {retrySuccess === false && (
                <div className="p-2 bg-rose-500/20 text-rose-300 text-xs font-bold rounded-lg flex items-center gap-1.5">
                  <AlertTriangle size={14} /> That wasn't the top move. Try again!
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Analysis & Review Details (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Navigation Tabs */}
          <div className="flex bg-[#262522] p-1 rounded-xl border border-[#3c3934] text-xs font-bold">
            <button
              onClick={() => setActiveTab('review')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                activeTab === 'review' ? 'bg-[#81b64c] text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              Review
            </button>
            <button
              onClick={() => setActiveTab('table')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                activeTab === 'table' ? 'bg-[#81b64c] text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              Move Quality
            </button>
            <button
              onClick={() => setActiveTab('lines')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                activeTab === 'lines' ? 'bg-[#81b64c] text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              Move List
            </button>
            <button
              onClick={() => setActiveTab('moments')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                activeTab === 'moments' ? 'bg-[#81b64c] text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              Key Moments ({keyMoments.length})
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                activeTab === 'import' ? 'bg-[#81b64c] text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              Import
            </button>
          </div>

          {/* TAB 1: REVIEW SUMMARY & ACCURACY */}
          {activeTab === 'review' && (
            <div className="space-y-4">
              {analysisReport ? (
                <div className="p-5 bg-[#262522] border border-[#3c3934] rounded-2xl space-y-4 shadow-chess">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Engine Accuracy Score (CAPS)
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-[#1e1d1a] rounded-xl border border-[#312e2b] text-center space-y-1">
                      <div className="text-xs text-gray-400 font-semibold">White Accuracy</div>
                      <div className="text-4xl font-black font-mono text-[#81b64c]">
                        {analysisReport.whiteAccuracy}%
                      </div>
                    </div>
                    <div className="p-4 bg-[#1e1d1a] rounded-xl border border-[#312e2b] text-center space-y-1">
                      <div className="text-xs text-gray-400 font-semibold">Black Accuracy</div>
                      <div className="text-4xl font-black font-mono text-zinc-300">
                        {analysisReport.blackAccuracy}%
                      </div>
                    </div>
                  </div>

                  {openingName && (
                    <div className="p-3 bg-[#1e1d1a] rounded-xl border border-[#312e2b] text-xs">
                      <span className="text-gray-400">Opening: </span>
                      <strong className="text-white">{openingName}</strong>
                    </div>
                  )}

                  <p className="text-xs text-gray-300 leading-relaxed bg-[#1e1d1a] p-3.5 rounded-xl border border-[#312e2b]">
                    {analysisReport.summary}
                  </p>
                </div>
              ) : (
                <div className="p-8 bg-[#262522] border border-[#3c3934] rounded-2xl text-center space-y-3">
                  <Microscope size={36} className="text-[#81b64c] mx-auto opacity-70" />
                  <div className="text-sm font-bold text-white">Live Stockfish Ready</div>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto">
                    Load any completed game or import PGN notation to view comprehensive Chess.com-style accuracy reports.
                  </p>
                </div>
              )}

              {/* Move list preview */}
              <div className="h-64">
                <MoveHistoryPanel
                  moves={moveHistory}
                  currentMoveIndex={currentMoveIndex}
                  onSelectMove={handleSelectMove}
                  pgn={chess.pgn()}
                  fen={chess.fen()}
                />
              </div>
            </div>
          )}

          {/* TAB 2: MOVE QUALITY COMPARISON TABLE */}
          {activeTab === 'table' && (
            <div className="p-5 bg-[#262522] border border-[#3c3934] rounded-2xl shadow-chess space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Move Classifications
                </span>
                <div className="flex items-center gap-6 text-xs font-bold text-gray-300">
                  <span>White</span>
                  <span>Black</span>
                </div>
              </div>

              <div className="divide-y divide-[#312e2b]">
                {Object.entries(CLASSIFICATION_METADATA).map(([key, meta]: [string, any]) => {
                  const whiteCount = classificationCounts?.white?.[key] || 0;
                  const blackCount = classificationCounts?.black?.[key] || 0;

                  return (
                    <div key={key} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-6 h-6 rounded-md flex items-center justify-center font-black text-[10px] text-white"
                          style={{ backgroundColor: meta.color }}
                        >
                          {meta.badge}
                        </span>
                        <span className="font-bold text-white">{meta.label}</span>
                      </div>

                      <div className="flex items-center gap-8 font-mono font-bold">
                        <span className="w-4 text-center text-white">{whiteCount}</span>
                        <span className="w-4 text-center text-gray-400">{blackCount}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: MOVE LIST */}
          {activeTab === 'lines' && (
            <div className="h-[520px]">
              <MoveHistoryPanel
                moves={moveHistory}
                currentMoveIndex={currentMoveIndex}
                onSelectMove={handleSelectMove}
                pgn={chess.pgn()}
                fen={chess.fen()}
              />
            </div>
          )}

          {/* TAB 4: KEY MOMENTS */}
          {activeTab === 'moments' && (
            <div className="bg-[#262522] border border-[#3c3934] rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Critical Moments & Blunders
                </span>
                <span className="text-xs text-gray-500 font-mono">{keyMoments.length} moments</span>
              </div>

              {keyMoments.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-xs">
                  No critical blunders detected in this game.
                </div>
              ) : (
                <div className="max-h-[460px] overflow-y-auto space-y-2 pr-1">
                  {keyMoments.map((moment: any, idx: number) => {
                    const meta = CLASSIFICATION_METADATA[moment.classification] || CLASSIFICATION_METADATA.mistake;
                    return (
                      <div
                        key={idx}
                        className="p-3 bg-[#1e1d1a] hover:bg-[#2a2824] rounded-xl border border-[#312e2b] transition-all flex items-center justify-between text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className="px-2 py-0.5 rounded text-[10px] font-black uppercase text-white"
                              style={{ backgroundColor: meta.color }}
                            >
                              {meta.label} {meta.badge}
                            </span>
                            <span className="font-mono font-bold text-white">
                              {moment.moveNumber}. {moment.san}
                            </span>
                          </div>
                          <p className="text-gray-400 text-[11px]">{moment.comment}</p>
                          {moment.bestMoveSan && (
                            <div className="text-[11px] text-[#81b64c] font-mono">
                              Best: {moment.bestMoveSan}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => handleStartRetry(moment)}
                          className="px-3 py-1.5 bg-[#81b64c] hover:bg-[#95c65a] text-white font-bold rounded-lg text-xs transition-all flex items-center gap-1"
                        >
                          <span>Retry</span>
                          <ArrowRight size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: IMPORT */}
          {activeTab === 'import' && (
            <div className="p-5 bg-[#262522] border border-[#3c3934] rounded-2xl space-y-4 text-xs">
              <span className="font-bold text-gray-300 uppercase tracking-wider block">
                Load FEN Position
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={fenInput}
                  onChange={(e) => setFenInput(e.target.value)}
                  placeholder="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
                  className="flex-1 bg-[#1e1d1a] border border-[#3c3934] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#81b64c]"
                />
                <button
                  onClick={handleLoadFen}
                  className="px-4 py-2 bg-[#81b64c] hover:bg-[#95c65a] text-white font-bold rounded-xl transition-all"
                >
                  Load FEN
                </button>
              </div>

              <div className="border-t border-[#312e2b] pt-3 space-y-2">
                <span className="font-bold text-gray-300 uppercase tracking-wider block">
                  Load PGN Notation
                </span>
                <textarea
                  rows={5}
                  value={pgnInput}
                  onChange={(e) => setPgnInput(e.target.value)}
                  placeholder="1. e4 e5 2. Nf3 Nc6 3. Bb5 a6..."
                  className="w-full bg-[#1e1d1a] border border-[#3c3934] rounded-xl p-3 text-white font-mono focus:outline-none focus:border-[#81b64c]"
                />
                <button
                  onClick={handleLoadPgn}
                  className="w-full py-2.5 bg-[#81b64c] hover:bg-[#95c65a] text-white font-bold rounded-xl shadow-glow-green transition-all"
                >
                  Load & Review PGN
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
