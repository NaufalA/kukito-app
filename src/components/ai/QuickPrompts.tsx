import React from 'react';
import { Sparkles, Zap, UtensilsCrossed, Salad } from 'lucide-react';

interface QuickPromptsProps {
  onSelectPrompt: (prompt: string) => void;
  disabled?: boolean;
}

export const QuickPrompts: React.FC<QuickPromptsProps> = ({ onSelectPrompt, disabled }) => {
  const prompts = [
    { text: 'What can I cook right now?', icon: UtensilsCrossed },
    { text: 'Quick 15-minute meal', icon: Zap },
    { text: 'Healthy high-protein dish', icon: Salad },
    { text: 'Surprise me with a chef special', icon: Sparkles },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto py-1 no-scrollbar text-xs">
      {prompts.map((item, idx) => {
        const Icon = item.icon;
        return (
          <button
            key={idx}
            disabled={disabled}
            onClick={() => onSelectPrompt(item.text)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-orange-500/50 whitespace-nowrap transition-all active:scale-95 disabled:opacity-50"
          >
            <Icon className="w-3 h-3 text-orange-400" />
            <span>{item.text}</span>
          </button>
        );
      })}
    </div>
  );
};
