import React, { useRef, useState } from 'react';
import { Download, Upload, FileJson, AlertCircle, Check, X } from 'lucide-react';
import {
  downloadExportFile,
  parseImportFile,
  applyImport,
  ExportEnvelope,
  ImportedData,
} from '../../services/export';

interface DataCounts {
  ingredients: number;
  equipment: number;
  recipes: number;
  deductionHistory: number;
}

interface ExportImportSectionProps {
  counts: DataCounts;
  onImport: (data: ImportedData) => void;
}

type ImportMode = 'merge' | 'replace';

const CountGrid: React.FC<{ counts: { label: string; count: number }[] }> = ({ counts }) => (
  <div className="grid grid-cols-4 gap-2">
    {counts.map((item) => (
      <div
        key={item.label}
        className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/60 text-center"
      >
        <p className="text-xs font-bold text-white">{item.count}</p>
        <span className="text-[10px] text-slate-400 uppercase font-semibold">{item.label}</span>
      </div>
    ))}
  </div>
);

export const ExportImportSection: React.FC<ExportImportSectionProps> = ({ counts, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingEnvelope, setPendingEnvelope] = useState<ExportEnvelope | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset so the same file can be picked again after an error
    e.target.value = '';
    if (!file) return;

    setErrorMessage(null);
    try {
      const text = await file.text();
      const envelope = parseImportFile(text);
      setPendingEnvelope(envelope);
    } catch (err: any) {
      setErrorMessage(
        err?.message?.startsWith('Invalid export file')
          ? err.message
          : 'Invalid file format. Please select a valid Kukito! export file.'
      );
    }
  };

  const handleConfirmImport = (mode: ImportMode) => {
    if (!pendingEnvelope) return;
    try {
      const imported = applyImport(pendingEnvelope, mode);
      onImport(imported); // persists via storageService + updates App state
      setErrorMessage(null);
      setPendingEnvelope(null); // close only on success
    } catch (err) {
      // apply-time failures (e.g. corrupted existing storage, quota exceeded on
      // bulk write) must never fail silently behind the open preview modal
      setErrorMessage(
        err instanceof Error
          ? `Import failed: ${err.message}`
          : 'Import failed. Please try again.'
      );
    }
  };

  const currentSummary = [
    { label: 'Ings', count: counts.ingredients },
    { label: 'Tools', count: counts.equipment },
    { label: 'Recipes', count: counts.recipes },
    { label: 'History', count: counts.deductionHistory },
  ];

  const incomingSummary = pendingEnvelope
    ? [
        { label: 'Ings', count: pendingEnvelope.data.ingredients.length },
        { label: 'Tools', count: pendingEnvelope.data.equipment.length },
        { label: 'Recipes', count: pendingEnvelope.data.recipes.length },
        { label: 'History', count: pendingEnvelope.data.deductionHistory.length },
      ]
    : [];

  const errorBox = errorMessage ? (
    <div className="flex items-start gap-2 p-2.5 rounded-xl bg-red-950/30 border border-red-900/50 text-xs text-red-300">
      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
      <span>{errorMessage}</span>
    </div>
  ) : null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2 text-orange-400 font-bold text-xs uppercase tracking-wider">
        <FileJson className="w-4 h-4" /> Data Sync
      </div>

      <p className="text-xs text-slate-400">
        Move your kitchen data between devices with a JSON file. Syncs ingredients, equipment,
        recipes, and cooking history — your AI settings stay on this device.
      </p>

      <CountGrid counts={currentSummary} />

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => downloadExportFile()}
          className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center justify-center gap-1.5 active:scale-95"
        >
          <Download className="w-3.5 h-3.5" /> Export Data
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-600/20 flex items-center justify-center gap-1.5 active:scale-95"
        >
          <Upload className="w-3.5 h-3.5" /> Import Data
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        onChange={handleFileSelected}
        className="hidden"
      />

      {errorBox}

      {/* Import Preview Modal */}
      {pendingEnvelope && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">
                  Import Preview
                </span>
                <h2 className="text-base font-bold text-white">
                  Import from {pendingEnvelope.exportedAt.split('T')[0]}
                </h2>
              </div>
              <button
                onClick={() => setPendingEnvelope(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                File contents
              </p>
              <CountGrid counts={incomingSummary} />
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Merge adds items from the file alongside your current data (duplicates skipped).
              Replace overwrites your current data with the file's contents.
            </p>

            {errorBox && <div className="mb-4">{errorBox}</div>}

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleConfirmImport('merge')}
                className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Check className="w-3.5 h-3.5" /> Merge
              </button>
              <button
                onClick={() => handleConfirmImport('replace')}
                className="py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-600/20 flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Upload className="w-3.5 h-3.5" /> Replace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
