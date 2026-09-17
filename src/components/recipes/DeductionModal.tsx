import React, { useState } from 'react';
import { X, Minus, Plus, AlertCircle, Sparkles, Check, RotateCcw } from 'lucide-react';
import { Recipe, Ingredient, DeductionItem } from '../../types';

interface DeductionModalProps {
  isOpen: boolean;
  recipe: Recipe;
  inventory: Ingredient[];
  onClose: () => void;
  onConfirmDeduction: (items: DeductionItem[]) => void;
}

export const DeductionModal: React.FC<DeductionModalProps> = ({
  isOpen,
  recipe,
  inventory,
  onClose,
  onConfirmDeduction,
}) => {
  if (!isOpen) return null;

  // Build deduction items list matched against inventory
  const [deductionItems, setDeductionItems] = useState<DeductionItem[]>(() => {
    return recipe.ingredients.map((recIng) => {
      const matched = inventory.find((inv) =>
        inv.name.toLowerCase().includes(recIng.name.toLowerCase()) ||
        recIng.name.toLowerCase().includes(inv.name.toLowerCase())
      );

      return {
        ingredientId: matched?.id || 'unmatched-' + recIng.name,
        ingredientName: matched ? matched.name : recIng.name,
        currentStock: matched ? matched.quantity : 0,
        recipeAmount: recIng.amount,
        deductAmount: recIng.amount, // Initialized to recipe amount, editable by user!
        unit: matched ? matched.unit : recIng.unit,
        isExcluded: !matched, // Exclude by default if not in stock
      };
    });
  });

  const updateDeductAmount = (index: number, delta: number) => {
    setDeductionItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const newAmount = Math.max(0, parseFloat((item.deductAmount + delta).toFixed(2)));
        return { ...item, deductAmount: newAmount };
      })
    );
  };

  const setDeductDirectly = (index: number, val: number) => {
    setDeductionItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, deductAmount: Math.max(0, val) } : item))
    );
  };

  const toggleExclude = (index: number) => {
    setDeductionItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, isExcluded: !item.isExcluded } : item))
    );
  };

  const handleConfirm = () => {
    const activeDeductions = deductionItems.filter(
      (item) => !item.isExcluded && item.deductAmount > 0 && !item.ingredientId.startsWith('unmatched-')
    );
    onConfirmDeduction(activeDeductions);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">Inventory Auto-Deduct</span>
            <h2 className="text-base font-bold text-white flex items-center gap-1.5">
              Review Used Ingredients 🤌
            </h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-400 mb-3">
          Adjust the numbers below to match what you actually used, or uncheck items you didn't use.
        </p>

        {/* List of Ingredients to Deduct */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {deductionItems.map((item, idx) => {
            const isUnmatched = item.ingredientId.startsWith('unmatched-');
            const remaining = item.currentStock - item.deductAmount;
            const willBeDepleted = remaining <= 0;

            return (
              <div
                key={item.ingredientName + idx}
                className={`p-3 rounded-xl border transition-all ${
                  item.isExcluded
                    ? 'bg-slate-900/50 border-slate-800/60 opacity-50'
                    : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={!item.isExcluded}
                      onChange={() => toggleExclude(idx)}
                      disabled={isUnmatched}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-orange-600 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-white truncate">{item.ingredientName}</span>
                  </label>

                  {isUnmatched ? (
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
                      Not in pantry
                    </span>
                  ) : (
                    <div className="text-[11px] text-slate-400">
                      Stock: <span className="font-medium text-slate-300">{item.currentStock} {item.unit}</span>
                      {!item.isExcluded && (
                        <span className={`ml-1.5 font-bold ${willBeDepleted ? 'text-red-400' : 'text-emerald-400'}`}>
                          → {remaining > 0 ? remaining : 0} {item.unit}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {!item.isExcluded && !isUnmatched && (
                  <div className="flex items-center justify-between bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
                    <span className="text-[11px] text-slate-400 font-medium">Deduct quantity:</span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateDeductAmount(idx, -1)}
                        className="w-6 h-6 rounded bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center active:scale-95"
                      >
                        <Minus className="w-3 h-3" />
                      </button>

                      <input
                        type="number"
                        step="any"
                        value={item.deductAmount}
                        onChange={(e) => setDeductDirectly(idx, parseFloat(e.target.value) || 0)}
                        className="w-14 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-center text-xs font-bold text-white focus:outline-none focus:border-orange-500"
                      />
                      <span className="text-[11px] text-slate-400">{item.unit}</span>

                      <button
                        type="button"
                        onClick={() => updateDeductAmount(idx, 1)}
                        className="w-6 h-6 rounded bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center active:scale-95"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Confirmation Footer */}
        <div className="pt-3.5 border-t border-slate-800 flex items-center justify-between gap-3 mt-auto">
          <button
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-600/20 active:scale-95"
          >
            <Check className="w-4 h-4" /> Confirm & Update Inventory
          </button>
        </div>
      </div>
    </div>
  );
};
