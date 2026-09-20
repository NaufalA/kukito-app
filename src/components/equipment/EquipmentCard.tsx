import React from 'react';
import { Check, X, Wrench, Trash2 } from 'lucide-react';
import { Equipment } from '../../types';

interface EquipmentCardProps {
  equipment: Equipment;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export const EquipmentCard: React.FC<EquipmentCardProps> = ({ equipment, onToggle, onDelete }) => {
  return (
    <div className="p-3 rounded-xl border border-slate-800/80 bg-slate-900 flex items-center justify-between gap-3 hover:border-slate-700 transition-all">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${equipment.isAvailable ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-800 text-slate-500'
            }`}
        >
          <Wrench className="w-4 h-4" />
        </div>
        <div className="flex flex-col gap-1">
          <div className="truncate">
            <h4 className="text-xs font-semibold text-white truncate">{equipment.name}</h4>
            <div className="flex gap-1 items-center">
              <span className="text-[10px] text-slate-500 uppercase font-medium">{equipment.category}</span>
            </div>
          </div>
          <div className="flex gap-1">
            {equipment.measurement?.map((measurement, index) => (
              <span key={index} className="text-[10px] font-medium bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700/60 flex items-center gap-1">
                {measurement.amount} {measurement.unit}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onToggle(equipment.id)}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all border ${equipment.isAvailable
            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
            : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
        >
          {equipment.isAvailable ? (
            <>
              <Check className="w-3 h-3" /> Ready
            </>
          ) : (
            <>
              <X className="w-3 h-3" /> Inactive
            </>
          )}
        </button>

        <button
          onClick={() => onDelete(equipment.id)}
          className="p-1 text-slate-600 hover:text-red-400 transition-colors"
          title="Delete Tool"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
