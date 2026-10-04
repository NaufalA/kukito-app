# Feature: Data Export & QR Code Recipe Sharing

## Objective

Enable users to sync their Kukito! kitchen data (ingredients, equipment, recipes, deduction history) between devices (PC ↔ Mobile) via JSON file export/import, and share individual recipes with others via QR code scan.

## Current Behavior

- All data persists in `localStorage` via `src/services/storage.ts` using versioned keys (`kukito_*_v1`)
- No export or import functionality exists
- No QR code generation or scanning capability exists
- Data types: `Ingredient[]`, `Equipment[]`, `Recipe[]`, `UserSettings`, `DeductionRecord[]`, `ChatMessage[]`
- The app is a PWA with no backend — all state lives in React `useState` hooks in `App.tsx`
- 5 tabs: Pantry, Equipment, AI Chef, Recipes, Settings

## Desired Behavior

### 1. Data Export (PC ↔ Mobile Sync)
- User can export kitchen data as a single downloadable `.json` file
- File contains: ingredients, equipment, recipes, deduction history (settings are excluded)
- User can import a `.json` file to restore data on another device
- Import validates the file structure and rejects invalid data
- Import merges or replaces (user's choice) existing data

### 2. Recipe QR Code Sharing
- User can generate a QR code for any single recipe
- QR code encodes the full recipe data (title, description, ingredients, steps, etc.)
- Another user can scan the QR code with their device camera
- Scanned recipe is previewed and can be added to the recipe collection
- QR code uses a compact binary format to maximize data capacity

### 3. UI Integration
- Export/Import controls live in the Settings tab
- QR code generation is accessible from Recipe Detail modal and Recipe Card
- QR code scanner is accessible from the Recipes tab
- All UI follows existing design patterns (dark theme, orange accents, rounded cards, mobile-first)

## Constraints

- **No backend**: All data must be encoded in the QR code itself or transferred as a file
- **QR code capacity**: Standard QR codes hold ~2,953 bytes (binary) or ~4,296 chars (alphanumeric). A typical recipe JSON is ~1-2KB minified, which fits. For larger recipes, use LZ-string compression.
- **Camera access**: QR scanning requires `getUserMedia` API, which needs HTTPS or localhost. The PWA context satisfies this.
- **No new heavy dependencies**: Use lightweight libraries. `qrcode` (~30KB) for generation, `jsqr` (~15KB) for scanning, `lz-string` (~8KB) for compression.
- **Mobile-first**: All UI must work on small screens with touch interactions
- **Existing patterns**: Follow the modal pattern (fixed overlay, rounded card, close button), button styles (rounded-xl, orange-600 primary, slate-800 secondary), and toast notifications

## Architecture / Flow

### Data Export/Import Flow

```
[Settings Tab]
  → Export Section
    → Click "Export Data"
    → Collect ingredients, equipment, recipes, deduction history from storageService
    → Wrap in export envelope { version, exportedAt, data }
    → Create Blob → trigger download as kukito-export-YYYY-MM-DD.json

  → Import Section
    → Click "Import Data"
    → File picker opens
    → Read file → JSON.parse
    → Validate structure (version field, data object with expected keys)
    → Show preview (counts of each data type)
    → User chooses "Merge" or "Replace"
    → Apply to storageService → update React state
    → Toast confirmation
```

### Recipe QR Code Generation Flow

```
[Recipe Detail Modal / Recipe Card]
  → Click "Share via QR" button
  → Open QR Code Modal
  → Serialize recipe to compact JSON
  → Compress with LZ-string (compressToUTF16)
  → Generate QR code using `qrcode` library → canvas/dataURL
  → Display QR code image with recipe title
  → Optional: "Download QR" button to save as PNG
```

### Recipe QR Code Scanning Flow

```
[Recipes Tab]
  → Click "Scan QR" button
  → Open Scanner Modal
  → Request camera access via getUserMedia
  → Continuously capture frames → canvas → jsQR decode
  → On successful decode:
    → Decompress with LZ-string (decompressFromUTF16)
    → JSON.parse → validate recipe structure
    → Show recipe preview modal
    → "Add to Collection" button → save recipe
  → Handle errors: invalid QR, camera denied, no camera found
```

## Implementation

### 1. Install Dependencies

Add to `package.json`:
```json
"dependencies": {
  "qrcode": "^1.5.4",
  "jsqr": "^1.4.0",
  "lz-string": "^1.5.0"
}
```

Add type definitions:
```json
"devDependencies": {
  "@types/qrcode": "^1.5.5"
}
```

### 2. Create Export/Import Service

**File: `src/services/storage.ts`** (modify)

Add a bulk setter alongside the existing per-record methods, following the same pattern as `setIngredients`/`setRecipes`:

```typescript
setDeductionHistory(records: DeductionRecord[]): void {
  localStorage.setItem(STORAGE_KEYS.DEDUCTION_HISTORY, JSON.stringify(records.slice(0, 30)));
},
```

**File: `src/services/export.ts`** (create)

```typescript
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
  // Validate structure
  if (!parsed.version || !parsed.data) {
    throw new Error('Invalid export file: missing version or data');
  }
  const requiredKeys = ['ingredients', 'equipment', 'recipes', 'deductionHistory'];
  for (const key of requiredKeys) {
    if (!(key in parsed.data)) {
      throw new Error(`Invalid export file: missing data.${key}`);
    }
  }
  return parsed as ExportEnvelope;
}

export function applyImport(
  envelope: ExportEnvelope,
  mode: 'merge' | 'replace'
): {
  ingredients: Ingredient[];
  equipment: Equipment[];
  recipes: Recipe[];
  deductionHistory: DeductionRecord[];
} {
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
  const existingIngIds = new Set(storageService.getIngredients().map(i => i.id));
  const existingEquipIds = new Set(storageService.getEquipment().map(e => e.id));
  const existingRecipeIds = new Set(storageService.getRecipes().map(r => r.id));
  const existingDeductIds = new Set(storageService.getDeductionHistory().map(d => d.id));
  
  return {
    ingredients: [
      ...storageService.getIngredients(),
      ...data.ingredients.filter(i => !existingIngIds.has(i.id)),
    ],
    equipment: [
      ...storageService.getEquipment(),
      ...data.equipment.filter(e => !existingEquipIds.has(e.id)),
    ],
    recipes: [
      ...storageService.getRecipes(),
      ...data.recipes.filter(r => !existingRecipeIds.has(r.id)),
    ],
    // Imported records come first (newer history), capped at 30 to match storage limit
    deductionHistory: [
      ...data.deductionHistory.filter(d => !existingDeductIds.has(d.id)),
      ...storageService.getDeductionHistory(),
    ].slice(0, 30),
  };
}
```

### 3. Create QR Code Service

**File: `src/services/qrCode.ts`**

```typescript
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { compressToUTF16, decompressFromUTF16 } from 'lz-string';
import { Recipe } from '../types';

const QR_PREFIX = 'KUKITO:';

export async function generateRecipeQrDataUrl(recipe: Recipe): Promise<string> {
  const json = JSON.stringify(recipe);
  const compressed = compressToUTF16(json);
  const payload = QR_PREFIX + compressed;
  
  // Check size - QR codes max ~2953 bytes for binary
  if (payload.length > 2800) {
    throw new Error('Recipe is too large for a QR code. Try removing some steps or tips.');
  }
  
  const dataUrl = await QRCode.toDataURL(payload, {
    width: 300,
    margin: 2,
    color: { dark: '#0b0f19', light: '#ffffff' },
    errorCorrectionLevel: 'M',
  });
  return dataUrl;
}

export function decodeQrPayload(payload: string): Recipe {
  if (!payload.startsWith(QR_PREFIX)) {
    throw new Error('Not a valid Kukito! recipe QR code');
  }
  const compressed = payload.slice(QR_PREFIX.length);
  const json = decompressFromUTF16(compressed);
  if (!json) {
    throw new Error('Failed to decompress recipe data');
  }
  const recipe = JSON.parse(json) as Recipe;
  // Validate minimal recipe structure
  if (!recipe.title || !recipe.ingredients || !recipe.steps) {
    throw new Error('Invalid recipe data in QR code');
  }
  return recipe;
}

export function scanQrFromImageData(imageData: ImageData): string | null {
  const result = jsQR(imageData.data, imageData.width, imageData.height);
  return result?.data ?? null;
}
```

### 4. Create Export/Import UI Section

**File: `src/components/settings/ExportImportSection.tsx`**

A new component rendered inside `SettingsView` that provides:
- "Export Data" button → calls `downloadExportFile()`
- "Import Data" button → hidden file input → parse → preview modal → merge/replace
- Shows data summary (counts of ingredients, equipment, recipes, deduction records)

Props:
```typescript
interface ExportImportSectionProps {
  onImport: (data: {
    ingredients: Ingredient[];
    equipment: Equipment[];
    recipes: Recipe[];
    deductionHistory: DeductionRecord[];
  }) => void;
}
```

### 5. Create QR Code Display Modal

**File: `src/components/recipes/RecipeQrCodeModal.tsx`**

Modal that shows:
- Recipe title
- QR code image (data URL from `generateRecipeQrDataUrl`)
- "Download QR" button (saves PNG)
- Close button

Props:
```typescript
interface RecipeQrCodeModalProps {
  isOpen: boolean;
  recipe: Recipe | null;
  onClose: () => void;
}
```

### 6. Create QR Scanner Modal

**File: `src/components/recipes/RecipeQrScanModal.tsx`**

Modal that:
- Requests camera access on open
- Shows camera feed in a viewfinder overlay
- Continuously scans frames using `jsQR`
- On successful decode: stops camera, shows recipe preview
- Recipe preview shows title, description, ingredient count
- "Add to Collection" button → calls `onImportRecipe`
- Error states: camera denied, no camera, invalid QR code
- Close button stops camera

Props:
```typescript
interface RecipeQrScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportRecipe: (recipe: Recipe) => void;
}
```

### 7. Wire Up in App.tsx

Add new state:
```typescript
const [isQrCodeModalOpen, setIsQrCodeModalOpen] = useState(false);
const [qrRecipe, setQrRecipe] = useState<Recipe | null>(null);
const [isQrScanModalOpen, setIsQrScanModalOpen] = useState(false);
```

Add handlers:
```typescript
const handleShareRecipeQr = (recipe: Recipe) => {
  setQrRecipe(recipe);
  setIsQrCodeModalOpen(true);
};

const handleImportRecipeFromQr = (recipe: Recipe) => {
  const newRecipe = { ...recipe, id: 'recipe-' + Date.now() };
  updateRecipes([newRecipe, ...recipes]);
  setToastMessage(`"${recipe.title}" added to collection! 🤌`);
  setTimeout(() => setToastMessage(null), 3000);
  setIsQrScanModalOpen(false);
};

const handleImportData = (data: {
  ingredients: Ingredient[];
  equipment: Equipment[];
  recipes: Recipe[];
  deductionHistory: DeductionRecord[];
}) => {
  storageService.setIngredients(data.ingredients);
  storageService.setEquipment(data.equipment);
  storageService.setRecipes(data.recipes);
  storageService.setDeductionHistory(data.deductionHistory);
  // Update React state
  setIngredients(data.ingredients);
  setEquipment(data.equipment);
  setRecipes(data.recipes);
  // Deduction history has no React state in App.tsx — it is read from
  // storageService on demand (undo flow), so storage write above is sufficient
  setToastMessage('Data imported successfully! 🤌');
  setTimeout(() => setToastMessage(null), 3000);
};
```

### 8. Add UI Entry Points

- **SettingsView**: Add `<ExportImportSection onImport={handleImportData} />` below the Kitchen Setup section
- **RecipeDetailModal**: Add a "Share QR" button (QR code icon from lucide-react) in the action buttons area
- **RecipeCard**: Add a share button (QR icon) alongside Edit/Delete
- **Recipes tab header**: Add a "Scan QR" button next to "Create" and "Ask AI Chef"

## Files

### Create

- `src/services/export.ts` — Export/import logic, file download, data validation
- `src/services/qrCode.ts` — QR generation, scanning, compression/decompression
- `src/components/settings/ExportImportSection.tsx` — Export/import UI in settings
- `src/components/recipes/RecipeQrCodeModal.tsx` — QR code display modal
- `src/components/recipes/RecipeQrScanModal.tsx` — Camera-based QR scanner modal

### Modify

- `src/App.tsx` — Add state, handlers, and render new modals; pass share/scan props to existing components
- `src/services/storage.ts` — Add `setDeductionHistory()` bulk setter
- `src/components/settings/SettingsView.tsx` — Add ExportImportSection
- `src/components/recipes/RecipeDetailModal.tsx` — Add "Share QR" button
- `src/components/recipes/RecipeCard.tsx` — Add share button
- `package.json` — Add `qrcode`, `jsqr`, `lz-string` dependencies
- `tsconfig.json` — No changes needed (types come from `@types/qrcode`)

## API Changes

None — this is a client-only feature with no backend.

## Data / Database Changes

None — uses existing localStorage schema. Export file format is new but transient.

## Configuration

None.

## Error Handling

- **Import file invalid JSON**: Toast error "Invalid file format. Please select a valid Kukito! export file."
- **Import file wrong structure**: Toast error "Invalid export file structure."
- **QR code too large**: Show error in QR modal "Recipe is too large for QR code. Try a simpler recipe."
- **Camera permission denied**: Show error in scanner modal "Camera access denied. Please allow camera permissions."
- **No camera available**: Show error "No camera found on this device."
- **Invalid QR code scanned**: Show toast "Not a valid Kukito! recipe QR code."
- **Corrupted QR data**: Show toast "Failed to read recipe data from QR code."

## Security Considerations

- **No API keys in export**: Since settings are excluded, the export file does not contain the Gemini API key. Each device configures its own AI settings independently.
- **Camera access**: QR scanner uses `getUserMedia` which requires user permission. Camera stream is stopped when modal closes.
- **No XSS risk**: QR code data is parsed as JSON and validated before use. Recipe data is rendered through React's built-in XSS protection.
- **File upload**: Import file is parsed as JSON and validated against expected structure before applying.

## Testing

No automated test suite exists. Manual validation:

1. **Export/Import round-trip**:
   - Add some ingredients, equipment, and recipes; cook a recipe to create a deduction record
   - Export data → verify JSON file downloads with correct structure (including `deductionHistory`)
   - Clear all data (Reset in Settings)
   - Import the exported file → verify all data is restored, including deduction history
   - Test merge mode: add new items, import with merge → verify both old and new items exist
   - Verify import does not touch settings (API key remains as configured on the target device)

2. **QR Code Generation**:
   - Open a recipe → tap "Share QR" → verify QR code displays
   - Scan the QR code with a phone → verify recipe data is readable
   - Test with a large recipe (many ingredients/steps) → verify it still generates or shows appropriate error

3. **QR Code Scanning**:
   - Display a recipe QR code on another device
   - Open scanner in Kukito! → point camera at QR code → verify recipe preview appears
   - Tap "Add to Collection" → verify recipe appears in Recipes tab
   - Test with invalid QR code → verify error message

4. **Edge cases**:
   - Export with empty data → verify file is valid but empty
   - Import corrupted file → verify error message
   - Camera permission denied → verify graceful error

## Edge Cases

- **Very large recipes**: A recipe with 20+ ingredients and 15+ steps might exceed QR capacity. Mitigation: LZ-string compression typically achieves 50-70% reduction. If still too large, show error suggesting to simplify the recipe.
- **Duplicate recipe IDs on import**: Merge mode filters out items with existing IDs to prevent duplicates.
- **Settings excluded**: Export/import covers ingredients, equipment, recipes, and deduction history. Settings (API key, model preference) stay local to each device.
- **Deduction history cap**: Storage limits deduction history to 30 records (`saveDeductionRecord` slices to 30). Both export and import respect this cap — `setDeductionHistory` slices to 30 on write, and merge deduplicates by record `id` before concatenating.
- **Camera not available on desktop**: Some desktops may not have cameras. Show appropriate error message.
- **Multiple rapid scans**: Scanner should debounce — once a valid QR is found, stop scanning and show preview to prevent duplicate imports.
- **QR code in poor lighting**: Use `jsQR` with `inversionAttempts: 'attemptBoth'` to handle inverted QR codes.

## Implementation Notes

- The `qrcode` library works in browser via its bundled `browser.js` entry. With Vite, `import QRCode from 'qrcode'` resolves correctly.
- `jsQR` is a pure JS library with no dependencies — ideal for this use case.
- `lz-string`'s `compressToUTF16`/`decompressFromUTF16` is chosen over `compressToEncodedURIComponent` because UTF16 is more compact for QR code payloads.
- The QR prefix `KUKITO:` allows future expansion (e.g., `KUKITO:EQUIP:...` for equipment sharing).
- Camera stream must be explicitly stopped (`stream.getTracks().forEach(t => t.stop())`) when the scanner modal closes to release the camera.
- Use `useRef` for video and canvas elements in the scanner to avoid re-renders.
- The scanner should use `requestAnimationFrame` or `setInterval` (~100ms) to periodically capture and decode frames.
- Follow the existing modal pattern: `fixed inset-0 z-50 bg-slate-950/85 flex items-center justify-center p-4` with inner card `max-w-md bg-slate-900 border border-slate-800 rounded-2xl`.
- Use lucide-react icons: `QrCode` for share button, `Camera` or `ScanLine` for scan button, `Download` for QR download.
