import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { Ingredient, IngredientCategory, StorageLocation } from '../../types';

interface IngredientModalProps {
  isOpen: boolean;
  ingredientToEdit?: Ingredient | null;
  onClose: () => void;
  onSave: (ingredient: Omit<Ingredient, 'id'>, id?: string) => void;
  onDelete?: (id: string) => void;
}

export const IngredientModal: React.FC<IngredientModalProps> = ({
  isOpen,
  ingredientToEdit,
  onClose,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<IngredientCategory>('produce');
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState('pcs');
  const [location, setLocation] = useState<StorageLocation>('pantry');
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(1);

  useEffect(() => {
    if (ingredientToEdit) {
      setName(ingredientToEdit.name);
      setCategory(ingredientToEdit.category);
      setQuantity(ingredientToEdit.quantity);
      setUnit(ingredientToEdit.unit);
      setLocation(ingredientToEdit.location);
      setLowStockThreshold(ingredientToEdit.lowStockThreshold ?? 1);
    } else {
      setName('');
      setCategory('produce');
      setQuantity(1);
      setUnit('pcs');
      setLocation('pantry');
      setLowStockThreshold(1);
    }
  }, [ingredientToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(
      {
        name: name.trim(),
        category,
        quantity: Number(quantity) || 0,
        unit: unit.trim(),
        location,
        lowStockThreshold: Number(lowStockThreshold) || 1,
      },
      ingredientToEdit?.id
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <h2 className="text-base font-bold text-white">
            {ingredientToEdit ? 'Edit Ingredient' : 'Add New Ingredient'}
          </h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Item Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Heavy Cream, Garlic, Eggs"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as IngredientCategory)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 capitalize"
              >
                <option value="produce">Produce (Veggies & Fruits)</option>
                <option value="dairy">Dairy & Eggs</option>
                <option value="meat">Meat & Seafood</option>
                <option value="pantry">Pantry & Grains</option>
                <option value="spices">Spices & Seasonings</option>
                <option value="condiments">Condiments & Oils</option>
                <option value="frozen">Frozen</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Location</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value as StorageLocation)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 capitalize"
              >
                <option value="pantry">Pantry</option>
                <option value="fridge">Fridge</option>
                <option value="freezer">Freezer</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Quantity</label>
              <input
                type="number"
                step="any"
                required
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Unit</label>
              <input
                type="text"
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="g, ml, pcs, cups, tbsp"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Low Stock Warning Threshold</label>
            <input
              type="number"
              step="any"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            {ingredientToEdit && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(ingredientToEdit.id);
                  onClose();
                }}
                className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            ) : <div />}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-600/20 active:scale-95"
              >
                {ingredientToEdit ? 'Save Changes' : 'Add to Inventory'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
