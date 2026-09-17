import React from 'react';
import { Clock, CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react';
import { Recipe, Ingredient } from '../../types';

interface RecipeCardProps {
  recipe: Recipe;
  inventory: Ingredient[];
  onOpen: (recipe: Recipe) => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, inventory, onOpen }) => {
  // Calculate match percentage
  const matchedCount = recipe.ingredients.filter((recIng) =>
    inventory.some(
      (inv) =>
        inv.quantity > 0 &&
        (inv.name.toLowerCase().includes(recIng.name.toLowerCase()) ||
          recIng.name.toLowerCase().includes(inv.name.toLowerCase()))
    )
  ).length;

  const totalCount = recipe.ingredients.length;
  const isCompleteMatch = matchedCount === totalCount && totalCount > 0;

  return (
    <div
      onClick={() => onOpen(recipe)}
      className="p-4 rounded-2xl border border-slate-800/80 bg-slate-900 hover:border-slate-700 transition-all cursor-pointer active:scale-98"
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">
          {recipe.cuisine || 'Home Cooking'}
        </span>

        {isCompleteMatch ? (
          <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Ready (All In Stock)
          </span>
        ) : (
          <span className="text-[10px] font-medium bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700/60 flex items-center gap-1">
            {matchedCount}/{totalCount} ingredients
          </span>
        )}
      </div>

      <h3 className="text-sm font-bold text-white">{recipe.title}</h3>
      <p className="text-xs text-slate-400 line-clamp-2 mt-1">{recipe.description}</p>

      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-800/80 text-xs text-slate-400">
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>{recipe.prepTimeMinutes + recipe.cookTimeMinutes} mins</span>
        </div>

        <div className="flex items-center gap-1 text-orange-400 font-semibold text-[11px]">
          <span>View Guide</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};
