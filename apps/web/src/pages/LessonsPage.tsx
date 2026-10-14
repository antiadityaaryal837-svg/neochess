import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { ChessBoardWrapper } from '../components/chess/ChessBoardWrapper.js';
import { api } from '../services/api.js';
import { sounds } from '../utils/sound.js';
import { GraduationCap, CheckCircle, ArrowRight, BookOpen, Crown, Swords, Target } from 'lucide-react';
import confetti from 'canvas-confetti';

export const LessonsPage: React.FC = () => {
  const [lessons, setLessons] = useState<any[]>([]);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [chess, setChess] = useState<Chess>(new Chess());
  const [stepSolved, setStepSolved] = useState(false);

  useEffect(() => {
    api.getLessons().then((res) => {
      setLessons(res.lessons);
      if (res.lessons.length > 0) {
        loadLesson(res.lessons[0].slug);
      }
    });
  }, []);

  const loadLesson = async (slug: string) => {
    try {
      const res = await api.getLesson(slug);
      const l = res.lesson;
      setActiveLesson(l);
      setCurrentStepIndex(0);
      setStepSolved(false);
      if (l.steps.length > 0) {
        setChess(new Chess(l.steps[0].fen));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const currentStep = activeLesson?.steps?.[currentStepIndex];

  const handlePieceDrop = (source: string, target: string) => {
    if (!currentStep || stepSolved) return false;

    try {
      const testChess = new Chess(chess.fen());
      const res = testChess.move({ from: source, to: target, promotion: 'q' });
      if (!res) return false;

      // Check if move matches solution SAN
      if (currentStep.solutionMoves.includes(res.san)) {
        sounds.playMove();
        setChess(testChess);
        setStepSolved(true);
        sounds.playGameStart();

        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.6 },
        });

        // Save progress to server
        api.saveLessonStep(activeLesson.id, currentStepIndex).catch(() => {});
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
      setChess(new Chess(activeLesson.steps[nextIdx].fen));
    } else {
      alert('🎉 You have completed this lesson! Great job.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <GraduationCap className="text-[#81b64c]" size={28} /> Chess Academy & Lessons
        </h1>
        <p className="text-sm text-gray-400">
          Learn essential opening principles, tactical patterns, and endgame techniques.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Lessons Directory (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Lessons Catalog</span>
          {lessons.map((item) => {
            const isSelected = activeLesson?.id === item.id;
            return (
              <div
                key={item.id}
                onClick={() => loadLesson(item.slug)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#2b2926] border-[#81b64c] shadow-md'
                    : 'bg-[#262522] border-[#3c3934] hover:border-[#504c46]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-white">{item.title}</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase">
                    {item.category}
                  </span>
                </div>
                <p className="text-xs text-gray-400 line-clamp-2">{item.description}</p>
              </div>
            );
          })}
        </div>

        {/* Right: Interactive Lesson Stage (8 cols) */}
        <div className="lg:col-span-8 flex flex-col md:flex-row gap-6 items-start">
          <div className="w-full max-w-[480px]">
            <ChessBoardWrapper
              position={chess.fen()}
              boardOrientation="white"
              onPieceDrop={handlePieceDrop}
              arePiecesDraggable={!stepSolved}
            />
          </div>

          {/* Instructions Panel */}
          {currentStep && (
            <div className="flex-1 p-6 bg-[#262522] border border-[#3c3934] rounded-2xl shadow-chess space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#81b64c] uppercase tracking-wider">
                  Step {currentStepIndex + 1} of {activeLesson.steps.length}
                </span>
                {stepSolved && (
                  <span className="flex items-center gap-1 text-xs font-bold text-[#81b64c]">
                    <CheckCircle size={14} /> Solved
                  </span>
                )}
              </div>

              <h3 className="text-lg font-bold text-white">{currentStep.prompt}</h3>

              {stepSolved ? (
                <div className="p-4 bg-[#81b64c]/20 border border-[#81b64c]/40 rounded-xl text-xs text-gray-200 space-y-2">
                  <div className="font-bold text-[#81b64c]">Explanation:</div>
                  <p>{currentStep.explanation}</p>
                </div>
              ) : (
                <p className="text-xs text-gray-400">
                  Drag and drop the piece to complete the exercise on the board.
                </p>
              )}

              {stepSolved && (
                <button
                  onClick={handleNextStep}
                  className="w-full py-3 px-4 bg-[#81b64c] hover:bg-[#95c65a] text-white font-bold text-sm rounded-xl shadow-glow-green flex items-center justify-center gap-2 transition-all"
                >
                  <span>
                    {currentStepIndex + 1 < activeLesson.steps.length ? 'Next Step' : 'Finish Lesson'}
                  </span>
                  <ArrowRight size={18} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
