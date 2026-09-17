import React from 'react';
import { CheckCircle2, RotateCcw, X } from 'lucide-react';

interface ToastProps {
  message: string;
  onUndo?: () => void;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onUndo, onClose }) => {
  return (
    <div className="fixed top-16 left-4 right-4 z-50 max-w-md mx-auto flex items-center justify-between p-3.5 bg-slate-900 text-white rounded-xl border border-slate-700 shadow-xl animate-in slide-in-from-top duration-200">
      <div className="flex items-center gap-2.5 text-sm">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="font-medium text-slate-200">{message}</span>
      </div>

      <div className="flex items-center gap-2">
        {onUndo && (
          <button
            onClick={onUndo}
            className="flex items-center gap-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-orange-400 px-2.5 py-1.5 rounded-lg border border-slate-700 active:scale-95 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Undo
          </button>
        )}
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
