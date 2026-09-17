import React from 'react';
import { X, Clock, Users, Flame, Utensils, CheckCircle2, AlertCircle, Play } from 'lucide-react';
import { Recipe, Ingredient, Equipment } from '../../types';

interface RecipeDetailModalProps {
  isOpen: boolean;
  recipe: Recipe | null;
  inventory: Ingredient[];
  equipmentList: Equipment[];
  onClose: () => void;
  onStartCooking: (recipe: Recipe) => void;
  onDirectCookDeduct: (recipe: Recipe) => void;
}

export const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({
  isOpen,
  recipe,
  inventory,
  equipmentList,
  onClose,
  onStartCooking,
  onDirectCookDeduct,
}) => {
  if (!isOpen || !recipe) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
            {recipe.cuisine || 'Home Cooking'}
          </span>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-white">{recipe.title}</h2>
            <p className="text-xs text-slate-400 mt-1">{recipe.description}</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-800 text-center">
            <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/60">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Time</span>
              <p className="text-xs font-bold text-white mt-0.5">
                {recipe.prepTimeMinutes + recipe.cookTimeMinutes} mins
              </p>
            </div>
            <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/60">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Servings</span>
              <p className="text-xs font-bold text-white mt-0.5">{recipe.servings} people</p>
            </div>
            <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/60">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Difficulty</span>
              <p className="text-xs font-bold text-orange-400 mt-0.5">{recipe.difficulty}</p>
            </div>
          </div>

          {/* Required Ingredients Checker */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Ingredients Needed
            </h3>
            <div className="space-y-1.5">
              {recipe.ingredients.map((ing, idx) => {
                const matched = inventory.find((inv) =>
                  inv.name.toLowerCase().includes(ing.name.toLowerCase()) ||
                  ing.name.toLowerCase().includes(inv.name.toLowerCase())
                );
                const hasEnough = matched && matched.quantity >= ing.amount;

                return (
                  <div
                    key={idx}
                    className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      {hasEnough ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      )}
                      <span className="font-semibold text-slate-200">{ing.name}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-slate-300 font-bold">{ing.amount} {ing.unit}</span>
                      {matched && (
                        <span className="text-[10px] text-slate-500 block">
                          Have: {matched.quantity} {matched.unit}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Equipment Needed */}
          {recipe.equipment && recipe.equipment.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Equipment Needed
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {recipe.equipment.map((tool, idx) => {
                  const matched = equipmentList.find((e) =>
                    e.name.toLowerCase().includes(tool.toLowerCase())
                  );
                  const isReady = matched ? matched.isAvailable : false;

                  return (
                    <span
                      key={idx}
                      className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
                        isReady
                          ? 'bg-slate-800 text-slate-300 border-slate-700'
                          : 'bg-amber-950/20 text-amber-300 border-amber-800/40'
                      }`}
                    >
                      <Utensils className="w-3 h-3 text-slate-400" />
                      {tool}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-3.5 border-t border-slate-800 grid grid-cols-2 gap-2 mt-auto">
          <button
            onClick={() => {
              onClose();
              onDirectCookDeduct(recipe);
            }}
            className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700 active:scale-95"
          >
            Quick Deduct
          </button>
          <button
            onClick={() => {
              onClose();
              onStartCooking(recipe);
            }}
            className="py-2.5 px-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-600/20 flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Play className="w-3.5 h-3.5" /> Start Cooking Mode
          </button>
        </div>
      </div>
    </div>
  );
};
