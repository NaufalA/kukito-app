import React, { useState, useEffect } from 'react';
import { X, Check, Play, Pause, RotateCcw, Clock, Sparkles } from 'lucide-react';
import { Recipe } from '../../types';

interface CookingGuideModalProps {
  isOpen: boolean;
  recipe: Recipe;
  onClose: () => void;
  onFinishCooking: () => void;
}

export const CookingGuideModal: React.FC<CookingGuideModalProps> = ({
  isOpen,
  recipe,
  onClose,
  onFinishCooking,
}) => {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    let interval: any;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  if (!isOpen) return null;

  const toggleStep = (idx: number) => {
    setCompletedSteps((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const startQuickTimer = (mins: number) => {
    setTimerSeconds(mins * 60);
    setIsTimerRunning(true);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 flex flex-col p-4 max-w-md mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">Cooking Guide Mode</span>
          <h2 className="text-base font-bold text-white truncate max-w-[260px]">{recipe.title}</h2>
        </div>
        <button onClick={onClose} className="p-1.5 bg-slate-800 text-slate-300 rounded-xl hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Interactive Timer Widget */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Kitchen Timer</p>
            <p className="text-xl font-bold font-mono text-white tracking-wider">
              {formatTime(timerSeconds)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {timerSeconds > 0 && (
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="p-2 rounded-xl bg-orange-600 text-white font-bold active:scale-95"
            >
              {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          )}

          {timerSeconds === 0 ? (
            <div className="flex gap-1.5">
              <button
                onClick={() => startQuickTimer(3)}
                className="px-2.5 py-1 bg-slate-800 text-xs text-slate-300 rounded-lg hover:text-white"
              >
                +3m
              </button>
              <button
                onClick={() => startQuickTimer(5)}
                className="px-2.5 py-1 bg-slate-800 text-xs text-slate-300 rounded-lg hover:text-white"
              >
                +5m
              </button>
              <button
                onClick={() => startQuickTimer(10)}
                className="px-2.5 py-1 bg-slate-800 text-xs text-slate-300 rounded-lg hover:text-white"
              >
                +10m
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setIsTimerRunning(false);
                setTimerSeconds(0);
              }}
              className="p-2 text-slate-400 hover:text-white"
              title="Reset Timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Steps Checklist */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Steps ({completedSteps.length}/{recipe.steps.length} done)
        </h3>

        {recipe.steps.map((stepText, idx) => {
          const isDone = completedSteps.includes(idx);
          return (
            <div
              key={idx}
              onClick={() => toggleStep(idx)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex gap-3 ${
                isDone
                  ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-400'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-200'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-lg shrink-0 flex items-center justify-center font-bold text-xs ${
                  isDone
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {isDone ? <Check className="w-3.5 h-3.5" /> : idx + 1}
              </div>
              <p className={`text-xs leading-relaxed ${isDone ? 'line-through opacity-70' : ''}`}>
                {stepText}
              </p>
            </div>
          );
        })}
      </div>

      {/* Done & Deduct Button */}
      <div className="pt-4 border-t border-slate-800 mt-auto">
        <button
          onClick={() => {
            onClose();
            onFinishCooking();
          }}
          className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 active:scale-98"
        >
          <Sparkles className="w-4 h-4" /> Dish Finished! Deduct Ingredients 🤌
        </button>
      </div>
    </div>
  );
};
