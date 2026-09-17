import React from 'react';
import { Refrigerator, Wrench, MessageSquareText, BookOpen, Settings } from 'lucide-react';

export type TabType = 'pantry' | 'equipment' | 'ai' | 'recipes' | 'settings';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  recipeCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab, recipeCount }) => {
  const tabs = [
    { id: 'pantry' as TabType, label: 'Pantry', icon: Refrigerator },
    { id: 'equipment' as TabType, label: 'Gear', icon: Wrench },
    { id: 'ai' as TabType, label: 'Kukito AI', icon: MessageSquareText, highlight: true },
    { id: 'recipes' as TabType, label: 'Recipes', icon: BookOpen, badge: recipeCount },
    { id: 'settings' as TabType, label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800 safe-pb">
      <div className="max-w-md mx-auto grid grid-cols-5 h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center justify-center relative transition-all active:scale-95 ${
                isActive ? 'text-orange-500 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.highlight && (
                <div className="absolute -top-3 w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-600/30 border-2 border-slate-900">
                  <Icon className="w-5 h-5" />
                </div>
              )}
              {!tab.highlight && <Icon className="w-5 h-5 mb-1" />}
              {tab.highlight && <div className="h-5 mb-1" />}
              <span className="text-[11px] tracking-tight">{tab.label}</span>

              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute top-2 right-4 w-4 h-4 bg-orange-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {tab.badge}
                </span>
              )}

              {isActive && !tab.highlight && (
                <div className="absolute bottom-1 w-6 h-0.5 bg-orange-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
