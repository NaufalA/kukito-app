import React from 'react';
import { Bookmark, Sparkles, Clock, Check } from 'lucide-react';
import { Recipe } from '../../types';

interface RecipeCardAiProps {
  recipe: Recipe;
  isSaved: boolean;
  onSave: (recipe: Recipe) => void;
  onCook: (recipe: Recipe) => void;
}

export const RecipeCardAi: React.FC<RecipeCardAiProps> = ({ recipe, isSaved, onSave, onCook }) => {
  return (
    <div className="mt-3 p-4 rounded-2xl bg-slate-950 border border-orange-500/30 shadow-lg text-left">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
          AI Tailored Recipe 🤌
        </span>
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <Clock className="w-3 h-3 text-slate-500" />
          <span>{recipe.prepTimeMinutes + recipe.cookTimeMinutes}m</span>
        </div>
      </div>

      <h4 className="text-sm font-bold text-white">{recipe.title}</h4>
      <p className="text-xs text-slate-400 mt-1">{recipe.description}</p>

      {/* Ingredients list */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80">
        <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
          Ingredients Required:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {recipe.ingredients.map((ing, i) => (
            <span
              key={i}
              className="text-[11px] bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded-lg"
            >
              {ing.name} ({ing.amount} {ing.unit})
            </span>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-3.5 pt-2.5 border-t border-slate-800 grid grid-cols-2 gap-2">
        <button
          onClick={() => onSave(recipe)}
          disabled={isSaved}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
            isSaved
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
          }`}
        >
          {isSaved ? (
            <>
              <Check className="w-3.5 h-3.5" /> Saved!
            </>
          ) : (
            <>
              <Bookmark className="w-3.5 h-3.5" /> Save Recipe
            </>
          )}
        </button>

        <button
          onClick={() => onCook(recipe)}
          className="py-2 px-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-600/20 flex items-center justify-center gap-1.5 active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5" /> Cook & Deduct
        </button>
      </div>
    </div>
  );
};
