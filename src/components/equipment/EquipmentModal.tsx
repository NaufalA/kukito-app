import React, { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { EquimentMeasurement, Equipment, EquipmentCategory } from '../../types';

interface EquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (equipment: Omit<Equipment, 'id'>) => void;
}

export const EquipmentModal: React.FC<EquipmentModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<EquipmentCategory>('cookware');
  const [measurements, setMeasurement] = useState<EquimentMeasurement[]>([]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({
      name: name.trim(),
      category,
      isAvailable: true,
      measurement: measurements,
    });
    setName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <h2 className="text-base font-bold text-white">Add Kitchen Tool or Appliance</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Equipment Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Cast Iron Skillet, Food Processor"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as EquipmentCategory)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 capitalize"
            >
              <option value="cookware">Cookware (Pans, Pots, Skillets)</option>
              <option value="appliances">Appliances (Air Fryer, Blender, Rice Cooker)</option>
              <option value="prep">Prep Tools (Knives, Boards, Peelers)</option>
              <option value="measuring">Measuring Tools (Tablespoon, Teaspoon, Cup, etc.)</option>
              <option value="baking">Baking & Roasting (Oven, Trays, Molds)</option>
              <option value="other">Other Gadgets</option>
            </select>
          </div>

          {(category === 'measuring' || category === 'baking') && (
            <>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300 mb-1">Measurements</label>
                <button
                  onClick={() => setMeasurement([...measurements, { amount: 0, unit: '' }])}
                  className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 flex items-center justify-center active:scale-95 transition-all border border-slate-700/60"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              {measurements.map((measurement, index) => (
                <div>
                  <div key={index} className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Amount</label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={measurement.amount}
                        onChange={(e) => setMeasurement((prevMeasurements) => {
                          const newMeasurements = [...prevMeasurements];
                          newMeasurements[index] = {
                            ...prevMeasurements[index],
                            amount: parseFloat(e.target.value),
                          };
                          return newMeasurements;
                        })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Unit</label>
                      <input
                        type="text"
                        required
                        value={measurement.unit}
                        onChange={(e) => setMeasurement((prevMeasurements) => {
                          const newMeasurements = [...prevMeasurements];
                          newMeasurements[index] = {
                            ...prevMeasurements[index],
                            unit: e.target.value,
                          };
                          return newMeasurements;
                        })}
                        placeholder="g, ml, pcs, cups, tbsp"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <button
                      onClick={() => setMeasurement(measurements.filter((_, i) => i !== index))}
                      className="p-1 text-slate-600 hover:text-red-400 transition-colors"
                      title="Delete Tool"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
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
              Save Equipment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
