import React from 'react';
import { Plus, Minus, AlertTriangle, Edit3, Trash2 } from 'lucide-react';
import { Ingredient } from '../../types';

interface IngredientCardProps {
  ingredient: Ingredient;
  onUpdateQuantity: (id: string, delta: number) => void;
  onEdit: (ingredient: Ingredient) => void;
  onDelete: (id: string) => void;
}

export const IngredientCard: React.FC<IngredientCardProps> = ({
  ingredient,
  onUpdateQuantity,
  onEdit,
  onDelete,
}) => {
  const isLowStock =
    ingredient.lowStockThreshold !== undefined &&
    ingredient.quantity <= ingredient.lowStockThreshold &&
    ingredient.quantity > 0;
  const isDepleted = ingredient.quantity <= 0;

  return (
    <div
      className={`p-3.5 rounded-xl border bg-slate-900 transition-all flex items-center justify-between gap-2.5 ${
        isDepleted
          ? 'border-red-900/40 opacity-70'
          : isLowStock
          ? 'border-amber-500/40 bg-amber-950/10'
          : 'border-slate-800/80 hover:border-slate-700'
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white truncate">{ingredient.name}</h3>
          {isDepleted && (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded border border-red-500/30">
              Out
            </span>
          )}
          {isLowStock && (
            <span className="text-[10px] font-semibold bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30 flex items-center gap-0.5">
              <AlertTriangle className="w-2.5 h-2.5" /> Low
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
          <span className="capitalize font-medium text-slate-300">
            {ingredient.quantity} {ingredient.unit}
          </span>
          <span>•</span>
          <span className="capitalize text-[11px] text-slate-500">{ingredient.location}</span>
        </div>
      </div>

      {/* Quick Stepper & Actions */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onUpdateQuantity(ingredient.id, -1)}
          disabled={ingredient.quantity <= 0}
          className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all border border-slate-700/60"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <span className="w-8 text-center text-xs font-bold text-white">
          {ingredient.quantity}
        </span>

        <button
          onClick={() => onUpdateQuantity(ingredient.id, 1)}
          className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 flex items-center justify-center active:scale-95 transition-all border border-slate-700/60"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => onEdit(ingredient)}
          className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors ml-1"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
