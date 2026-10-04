import { Ingredient, Equipment, Recipe, DeductionRecord } from '../types';
import { storageService } from './storage';

export interface ExportEnvelope {
  version: 1;
  exportedAt: string;
  data: {
    ingredients: Ingredient[];
    equipment: Equipment[];
    recipes: Recipe[];
    deductionHistory: DeductionRecord[];
  };
}

export type ImportedData = ExportEnvelope['data'];

export function exportAllData(): ExportEnvelope {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      ingredients: storageService.getIngredients(),
      equipment: storageService.getEquipment(),
      recipes: storageService.getRecipes(),
      deductionHistory: storageService.getDeductionHistory(),
    },
  };
}

export function downloadExportFile(): void {
  const envelope = exportAllData();
  const json = JSON.stringify(envelope, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kukito-export-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseImportFile(jsonString: string): ExportEnvelope {
  const parsed = JSON.parse(jsonString);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid export file: not a JSON object');
  }
  if (parsed.version === undefined || parsed.data === undefined || parsed.data === null) {
    throw new Error('Invalid export file: missing version or data');
  }
  if (parsed.version !== 1) {
    throw new Error(
      `Invalid export file: unsupported version ${JSON.stringify(parsed.version)} — ` +
        'the file was created by a newer version of Kukito!'
    );
  }
  if (typeof parsed.exportedAt !== 'string' || parsed.exportedAt.trim() === '') {
    throw new Error('Invalid export file: missing exportedAt');
  }
  const requiredKeys: (keyof ExportEnvelope['data'])[] = [
    'ingredients',
    'equipment',
    'recipes',
    'deductionHistory',
  ];
  for (const key of requiredKeys) {
    const collection = parsed.data[key];
    if (!Array.isArray(collection)) {
      throw new Error(`Invalid export file: data.${key} must be an array`);
    }
    // Item-shape guard: the preview/merge/render code dereferences .id and other
    // fields, and a malformed item persisted here would crash the app on load.
    for (const item of collection) {
      if (item === null || typeof item !== 'object' || typeof item.id !== 'string') {
        throw new Error(`Invalid export file: data.${key} contains malformed records`);
      }
    }
  }
  return parsed as ExportEnvelope;
}

export function applyImport(envelope: ExportEnvelope, mode: 'merge' | 'replace'): ImportedData {
  const { data } = envelope;

  if (mode === 'replace') {
    return {
      ingredients: data.ingredients,
      equipment: data.equipment,
      recipes: data.recipes,
      deductionHistory: data.deductionHistory.slice(0, 30),
    };
  }

  // Merge mode: combine arrays, imported items don't override existing IDs
  const existingIngIds = new Set(storageService.getIngredients().map((i) => i.id));
  const existingEquipIds = new Set(storageService.getEquipment().map((e) => e.id));
  const existingRecipeIds = new Set(storageService.getRecipes().map((r) => r.id));
  const existingDeductIds = new Set(storageService.getDeductionHistory().map((d) => d.id));

  return {
    ingredients: [
      ...storageService.getIngredients(),
      ...data.ingredients.filter((i) => !existingIngIds.has(i.id)),
    ],
    equipment: [
      ...storageService.getEquipment(),
      ...data.equipment.filter((e) => !existingEquipIds.has(e.id)),
    ],
    recipes: [
      ...storageService.getRecipes(),
      ...data.recipes.filter((r) => !existingRecipeIds.has(r.id)),
    ],
    // Imported records come first (newer history), capped at 30 to match storage limit
    deductionHistory: [
      ...data.deductionHistory.filter((d) => !existingDeductIds.has(d.id)),
      ...storageService.getDeductionHistory(),
    ].slice(0, 30),
  };
}
