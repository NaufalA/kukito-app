import React from 'react';
import { Clock, CheckCircle2, AlertCircle, Trash2, Edit3, MessageSquare } from 'lucide-react';
import { Recipe, Ingredient } from '../../types';

interface RecipeCardProps {
  recipe: Recipe;
  inventory: Ingredient[];
  onOpen: (recipe: Recipe) => void;
  onDelete: (recipeId: string) => void;
  onEdit: (recipe: Recipe) => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, inventory, onOpen, onDelete, onEdit }) => {
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
    <div className="p-4 rounded-2xl border border-slate-800/80 bg-slate-900 hover:border-slate-700 transition-all cursor-pointer relative">
      {/* Main clickable area */}
      <div onClick={() => onOpen(recipe)} className="flex items-center justify-between gap-2 mb-1.5">
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

      {/* Stats row + Action buttons */}
      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-800/80">
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs text-slate-400">{recipe.prepTimeMinutes + recipe.cookTimeMinutes} mins</span>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); onOpen(recipe); }}
            className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-orange-600/80 text-slate-300 hover:text-white rounded-lg text-[10px] font-medium transition-colors border border-slate-700/60 active:scale-95"
          >
            <MessageSquare className="w-3 h-3" /> Guide & Cook
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(recipe); }}
            className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-blue-600/80 text-slate-300 hover:text-white rounded-lg text-[10px] font-medium transition-colors border border-slate-700/60 active:scale-95"
          >
            <Edit3 className="w-3 h-3" /> Edit
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(recipe.id); }}
            className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-red-600/80 text-slate-300 hover:text-white rounded-lg text-[10px] font-medium transition-colors border border-slate-700/60 active:scale-95"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
