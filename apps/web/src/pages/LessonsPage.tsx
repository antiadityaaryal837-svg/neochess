import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { ChessBoardWrapper } from '../components/chess/ChessBoardWrapper.js';
import { api } from '../services/api.js';
import { sounds } from '../utils/sound.js';
import {
  GraduationCap,
  CheckCircle,
  ArrowRight,
  BookOpen,
  Crown,
  Swords,
  Target,
  Lightbulb,
  RotateCcw,
  Sparkles,
  Award,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const LessonsPage: React.FC = () => {
  const [lessons, setLessons] = useState<any[]>([]);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [chess, setChess] = useState<Chess>(new Chess());
  const [stepSolved, setStepSolved] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
  const [hintSquare, setHintSquare] = useState<string | null>(null);

  const fetchLessons = async () => {
    try {
      const res = await api.getLessons();
      setLessons(res.lessons || []);
      if (res.lessons?.length > 0 && !activeLesson) {
        loadLesson(res.lessons[0].slug);
      }
    } catch (err) {
      console.error('Failed to load lessons list:', err);
    }
  };

  useEffect(() => {
    fetchLessons();
  }, []);

  const loadLesson = async (slug: string) => {
    try {
      const res = await api.getLesson(slug);
      const l = res.lesson;
      setActiveLesson(l);
      setCurrentStepIndex(0);
      setStepSolved(false);
      setHintSquare(null);
      if (l.steps?.length > 0) {
        setChess(new Chess(l.steps[0].fen));
      }
    } catch (err) {
      console.error('Failed to load lesson:', err);
    }
  };

  const currentStep = activeLesson?.steps?.[currentStepIndex];

  const handlePieceDrop = (source: string, target: string) => {
    if (!currentStep || stepSolved) return false;

    try {
      const testChess = new Chess(chess.fen());
      const res = testChess.move({ from: source, to: target, promotion: 'q' });
      if (!res) return false;

      // Check if move matches any accepted solution SAN
      const isCorrect = currentStep.solutionMoves.some(
        (m: string) => m === res.san || m === `${source}${target}` || m === `${source}${target}${res.promotion || ''}`
      );

      if (isCorrect) {
        sounds.playMove();
        setChess(testChess);
        setStepSolved(true);
        setHintSquare(null);
        sounds.playGameStart();

        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.6 },
        });

        // Save progress to server
        api.saveLessonStep(activeLesson.id, currentStepIndex).then(() => {
          fetchLessons();
        }).catch(() => {});

        return true;
      } else {
        sounds.playCheck();
        return false;
      }
    } catch {
      return false;
    }
  };

  const handleNextStep = () => {
    if (!activeLesson) return;
    const nextIdx = currentStepIndex + 1;
    if (nextIdx < activeLesson.steps.length) {
      setCurrentStepIndex(nextIdx);
      setStepSolved(false);
      setHintSquare(null);
      setChess(new Chess(activeLesson.steps[nextIdx].fen));
    } else {
      alert('🎉 Congratulations! You have completed all exercises in this lesson.');
    }
  };

  const handleHint = () => {
    if (!currentStep || !currentStep.solutionMoves?.length) return;
    const firstMove = currentStep.solutionMoves[0];
    const moves = chess.moves({ verbose: true });
    const match = moves.find((m) => m.san === firstMove || `${m.from}${m.to}` === firstMove);
    if (match) {
      setHintSquare(match.from);
    } else if (firstMove.length >= 2) {
      // Find starting letter
      const matchingMove = moves[0];
      if (matchingMove) setHintSquare(matchingMove.from);
    }
  };

  const handleReset = () => {
    if (currentStep) {
      setChess(new Chess(currentStep.fen));
      setStepSolved(false);
      setHintSquare(null);
    }
  };

  const filteredLessons = lessons.filter((l) => {
    if (categoryFilter === 'all') return true;
    return l.category === categoryFilter;
  });

  const orientation = currentStep?.fen?.split(' ')[1] === 'b' ? 'black' : 'white';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <GraduationCap className="text-[#81b64c]" size={28} /> Chess Academy & Comprehensive Curriculum
        </h1>
        <p className="text-sm text-gray-400">
          From basic piece movements to master opening repertoires, tactical calculation, and endgame mastery.
        </p>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2">
        {(['all', 'beginner', 'intermediate', 'advanced'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              categoryFilter === cat
                ? 'bg-[#81b64c] text-white shadow-glow-green'
                : 'bg-[#262522] text-gray-400 hover:text-white border border-[#3c3934]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Lessons Directory (4 cols) */}
        <div className="lg:col-span-4 space-y-3 max-h-[750px] overflow-y-auto pr-1">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Lessons Catalog ({filteredLessons.length})
          </span>
          {filteredLessons.map((item) => {
            const isSelected = activeLesson?.id === item.id;
            return (
              <div
                key={item.id}
                onClick={() => loadLesson(item.slug)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#2b2926] border-[#81b64c] shadow-lg ring-1 ring-[#81b64c]/40'
                    : 'bg-[#262522] border-[#3c3934] hover:border-[#504c46]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-bold text-white truncate">{item.title}</span>
                    {item.isCompleted && (
                      <CheckCircle size={15} className="text-[#81b64c] flex-shrink-0" />
                    )}
                  </div>
                  <span
                    className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase border ${
                      item.category === 'beginner'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : item.category === 'intermediate'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {item.category}
                  </span>
                </div>
                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{item.description}</p>
                <div className="mt-2 text-[10px] text-gray-500 flex items-center justify-between">
                  <span>{item.totalSteps || 2} steps</span>
                  {item.completedSteps > 0 && (
                    <span className="text-[#81b64c] font-semibold">
                      {item.completedSteps}/{item.totalSteps} complete
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Interactive Lesson Stage (8 cols) */}
        <div className="lg:col-span-8 flex flex-col md:flex-row gap-6 items-start">
          <div className="w-full max-w-[480px]">
            <ChessBoardWrapper
              position={chess.fen()}
              boardOrientation={orientation}
              onPieceDrop={handlePieceDrop}
              arePiecesDraggable={!stepSolved}
            />
          </div>

          {/* Instructions Panel */}
          {currentStep && (
            <div className="flex-1 p-6 bg-[#262522] border border-[#3c3934] rounded-2xl shadow-chess space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#81b64c] uppercase tracking-wider">
                  Exercise {currentStepIndex + 1} of {activeLesson.steps.length}
                </span>
                {stepSolved && (
                  <span className="flex items-center gap-1 text-xs font-bold text-[#81b64c]">
                    <CheckCircle size={14} /> Solved
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-[#1c1b18] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#81b64c] transition-all duration-300"
                  style={{
                    width: `${((currentStepIndex + (stepSolved ? 1 : 0)) / activeLesson.steps.length) * 100}%`,
                  }}
                />
              </div>

              <h3 className="text-lg font-bold text-white leading-snug">{currentStep.prompt}</h3>

              {stepSolved ? (
                <div className="p-4 bg-[#81b64c]/20 border border-[#81b64c]/40 rounded-xl text-xs text-gray-200 space-y-2 animate-in fade-in duration-200">
                  <div className="font-bold text-[#81b64c] flex items-center gap-1.5">
                    <Sparkles size={14} /> Master Explanation:
                  </div>
                  <p className="leading-relaxed">{currentStep.explanation}</p>
                </div>
              ) : (
                <p className="text-xs text-gray-400">
                  Drag and drop the correct piece on the board to complete the move.
                </p>
              )}

              {hintSquare && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs rounded-xl">
                  Hint: Try moving a piece from square <strong>{hintSquare.toUpperCase()}</strong>.
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                {stepSolved ? (
                  <button
                    onClick={handleNextStep}
                    className="w-full py-3.5 px-4 bg-[#81b64c] hover:bg-[#95c65a] text-white font-bold text-sm rounded-xl shadow-glow-green flex items-center justify-center gap-2 transition-all"
                  >
                    <span>
                      {currentStepIndex + 1 < activeLesson.steps.length ? 'Next Step' : 'Finish Lesson'}
                    </span>
                    <ArrowRight size={18} />
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleHint}
                      className="py-2.5 px-3 bg-[#1e1d1a] hover:bg-[#2b2926] text-amber-400 font-bold text-xs rounded-xl border border-[#3c3934] flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Lightbulb size={15} />
                      <span>Get Hint</span>
                    </button>
                    <button
                      onClick={handleReset}
                      className="py-2.5 px-3 bg-[#1e1d1a] hover:bg-[#2b2926] text-gray-300 font-bold text-xs rounded-xl border border-[#3c3934] flex items-center justify-center gap-1.5 transition-all"
                    >
                      <RotateCcw size={15} />
                      <span>Reset</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
