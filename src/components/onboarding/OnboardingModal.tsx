import React, { useState } from 'react';
import { Sparkles, Check, ChevronRight, Refrigerator, Wrench, Key, ArrowRight, X } from 'lucide-react';
import { Ingredient, Equipment } from '../../types';
import { ONBOARDING_STAPLES, ONBOARDING_EQUIPMENT } from '../../services/storage';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onComplete: (selectedIngredients: Ingredient[], selectedEquipment: Equipment[], apiKey: string) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose, onComplete }) => {
  if (!isOpen) return null;

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedStapleIndices, setSelectedStapleIndices] = useState<number[]>([0, 1, 2, 3, 4, 5, 7, 9]);
  const [selectedEquipIndices, setSelectedEquipIndices] = useState<number[]>([0, 1, 2, 3, 4, 6]);
  const [apiKey, setApiKey] = useState('');

  const toggleStaple = (index: number) => {
    setSelectedStapleIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const toggleEquip = (index: number) => {
    setSelectedEquipIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleFinish = () => {
    const ingredients: Ingredient[] = selectedStapleIndices.map((idx, i) => ({
      ...ONBOARDING_STAPLES[idx],
      id: 'staple-' + i + '-' + Date.now(),
    }));

    const equipment: Equipment[] = selectedEquipIndices.map((idx, i) => ({
      ...ONBOARDING_EQUIPMENT[idx],
      id: 'equip-' + i + '-' + Date.now(),
    }));

    onComplete(ingredients, equipment, apiKey);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Step Indicator & Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-orange-400">Step {step} of 3</span>
            <h2 className="text-lg font-bold text-white flex items-center gap-1.5">
              {step === 1 && 'Pantry Essentials'}
              {step === 2 && 'Kitchen Tools & Gear'}
              {step === 3 && 'AI Chef Setup'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`w-2 h-2 rounded-full ${step === s ? 'bg-orange-500 w-5' : 'bg-slate-700'} transition-all`}
                />
              ))}
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 text-slate-400 hover:text-white transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Step 1: Ingredients */}
        {step === 1 && (
          <div className="flex-1 overflow-y-auto pr-1">
            <p className="text-xs text-slate-400 mb-3">
              Tap what you currently have in your kitchen. You can customize amounts or add items anytime later!
            </p>
            <div className="grid grid-cols-2 gap-2">
              {ONBOARDING_STAPLES.map((item, idx) => {
                const isSelected = selectedStapleIndices.includes(idx);
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => toggleStaple(idx)}
                    className={`p-2.5 rounded-xl text-left border flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-orange-500/10 border-orange-500/50 text-white'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-semibold">{item.name}</p>
                      <p className="text-[10px] text-slate-400">{item.quantity} {item.unit}</p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-lg flex items-center justify-center border ${
                        isSelected ? 'bg-orange-500 border-orange-400 text-white' : 'border-slate-600'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Equipment */}
        {step === 2 && (
          <div className="flex-1 overflow-y-auto pr-1">
            <p className="text-xs text-slate-400 mb-3">
              Check off the cooking gear available in your kitchen so Kukito! never asks you for equipment you don't have.
            </p>
            <div className="space-y-2">
              {ONBOARDING_EQUIPMENT.map((item, idx) => {
                const isSelected = selectedEquipIndices.includes(idx);
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => toggleEquip(idx)}
                    className={`w-full p-3 rounded-xl text-left border flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-orange-500/10 border-orange-500/50 text-white'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Wrench className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-xs font-semibold">{item.name}</p>
                        <span className="text-[10px] uppercase text-slate-500 font-medium">{item.category}</span>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-lg flex items-center justify-center border ${
                        isSelected ? 'bg-orange-500 border-orange-400 text-white' : 'border-slate-600'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: AI Setup */}
        {step === 3 && (
          <div className="flex-1 overflow-y-auto pr-1 space-y-4">
            <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs text-orange-200 leading-relaxed">
              <span className="font-semibold text-orange-400 block mb-1">Live Google Gemini AI Integration 🤌</span>
              Kukito! comes with a smart offline recipe generator, or you can plug in your own free Google Gemini API Key for unlimited intelligent culinary chat!
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Google Gemini API Key (Optional)
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                You can get a free key from{' '}
                <a
                  href="https://aistudio.google.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-orange-400 underline font-medium"
                >
                  Google AI Studio
                </a>
                . You can also skip this and add it anytime in Settings.
              </p>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3 mt-auto">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => (s - 1) as any)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Back
            </button>
          ) : (
            <button
              onClick={() => setSelectedStapleIndices([])}
              className="text-xs text-slate-400 hover:text-slate-200 underline"
            >
              Start Empty
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep((s) => (s + 1) as any)}
              className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-600/20 active:scale-95"
            >
              Next <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="flex items-center gap-1.5 px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-600/20 active:scale-95"
            >
              Start Cooking! 🤌
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
