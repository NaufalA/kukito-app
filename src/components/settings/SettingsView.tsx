import React, { useState } from 'react';
import { Key, RotateCcw, ExternalLink, Sparkles, Check, Trash2 } from 'lucide-react';
import { UserSettings } from '../../types';

interface SettingsViewProps {
  settings: UserSettings;
  onSaveSettings: (settings: UserSettings) => void;
  onRunOnboarding: () => void;
  onResetAllData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  onRunOnboarding,
  onResetAllData,
}) => {
  const [apiKey, setApiKey] = useState(settings.geminiApiKey || '');
  const [model, setModel] = useState(settings.geminiModel || 'gemini-2.5-flash');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      ...settings,
      geminiApiKey: apiKey.trim(),
      geminiModel: model,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-5 pb-8">
      <div className="border-b border-slate-800 pb-3">
        <h2 className="text-base font-bold text-white">App Settings & AI Configuration</h2>
        <p className="text-xs text-slate-400">Configure your Google Gemini connection and kitchen preferences.</p>
      </div>

      {/* Google Gemini Setup Form */}
      <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
        <div className="flex items-center gap-2 text-orange-400 font-bold text-xs uppercase tracking-wider">
          <Key className="w-4 h-4" /> Google Gemini API Connection
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Gemini API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Paste your key: AIzaSy..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
          />
          <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
            Get your free API key at{' '}
            <a
              href="https://aistudio.google.com/"
              target="_blank"
              rel="noreferrer"
              className="text-orange-400 underline font-medium inline-flex items-center gap-0.5"
            >
              Google AI Studio <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Model Selection
          </label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
          >
            <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fastest, Recommended)</option>
            <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
            <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep reasoning)</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-600/20 flex items-center justify-center gap-1.5 active:scale-95"
        >
          {isSaved ? (
            <>
              <Check className="w-4 h-4" /> Settings Saved!
            </>
          ) : (
            'Save API Key'
          )}
        </button>
      </form>

      {/* Setup Wizard */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Kitchen Setup</h3>
        <p className="text-xs text-slate-400">
          Want to re-run the 30-second kitchen onboarding wizard to quickly select your staple ingredients and gear?
        </p>
        <button
          onClick={onRunOnboarding}
          className="mt-2 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 flex items-center gap-1.5 active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Run Kitchen Setup Wizard
        </button>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-950/20 border border-red-900/40 rounded-2xl p-4 space-y-2">
        <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider">Reset Kitchen Data</h3>
        <p className="text-xs text-slate-400">
          Clear all pantry inventory, saved equipment, recipes, and chat history back to fresh state.
        </p>
        <button
          onClick={() => {
            if (window.confirm('Are you sure you want to reset all data? This cannot be undone.')) {
              onResetAllData();
            }
          }}
          className="mt-2 py-2 px-3 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-xl text-xs font-semibold border border-red-500/30 flex items-center gap-1.5 active:scale-95"
        >
          <Trash2 className="w-3.5 h-3.5" /> Clear All Data
        </button>
      </div>
    </div>
  );
};
