import React from 'react';
import { IngredientCategory } from '../../types';

interface CategoryFilterProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  categoryCounts: Record<string, number>;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
}) => {
  const categories: { id: string; label: string; icon: string }[] = [
    { id: 'all', label: 'All', icon: '🍽️' },
    { id: 'produce', label: 'Produce', icon: '🥬' },
    { id: 'dairy', label: 'Dairy & Eggs', icon: '🥚' },
    { id: 'meat', label: 'Meat & Seafood', icon: '🥩' },
    { id: 'pantry', label: 'Grains & Pantry', icon: '🌾' },
    { id: 'spices', label: 'Spices & Herbs', icon: '🧂' },
    { id: 'condiments', label: 'Sauces & Oils', icon: '🫒' },
    { id: 'frozen', label: 'Frozen', icon: '🧊' },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto py-1 no-scrollbar text-xs">
      {categories.map((cat) => {
        const isSelected = selectedCategory === cat.id;
        const count = categoryCounts[cat.id] ?? 0;
        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border whitespace-nowrap font-medium transition-all active:scale-95 ${
              isSelected
                ? 'bg-orange-500/20 border-orange-500 text-orange-300 font-semibold'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
            <span className="text-[10px] opacity-70 bg-slate-800 px-1.5 py-0.2 rounded-full">
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
