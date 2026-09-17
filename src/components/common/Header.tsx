import React from 'react';
import { ChefHat, Sparkles, Settings as SettingsIcon } from 'lucide-react';

interface HeaderProps {
  ingredientCount: number;
  equipmentCount: number;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ ingredientCount, equipmentCount, onOpenSettings }) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 border-b border-slate-800/80 px-4 py-3 backdrop-blur-none">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-sm shadow-orange-500/20">
            <span className="text-xl select-none" role="img" aria-label="pinched fingers">🤌</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1">
                Kukito!
              </h1>
              <span className="text-xs bg-orange-500/20 text-orange-400 font-semibold px-1.5 py-0.5 rounded-full border border-orange-500/30 flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5" /> AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              {ingredientCount} ingredients · {equipmentCount} tools ready
            </p>
          </div>
        </div>

        <button
          onClick={onOpenSettings}
          className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors border border-slate-700/60 active:scale-95"
          title="Settings & Setup"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
