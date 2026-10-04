# Data Export & Import

Kukito! has no backend — all state lives in browser `localStorage`. Data export/import is
the supported way to move a kitchen between devices (e.g. compose recipes on a PC, cook
from a phone): download one JSON file on the first device and select it on the second,
both from the **Settings** tab's **Data Sync** section.

Design rationale lives in [ADR 0001 — Versioned JSON envelope for data portability](decisions/0001-versioned-json-envelope.md).

## Export scope

An export file contains exactly four collections:

- `ingredients`, `equipment`, `recipes`, `deductionHistory` (storage keeps the most
  recent 30 records)

Deliberately excluded:

- **Settings, including the Gemini API key** — secrets stay device-local so an export
  file can be shared without leaking the key (see ADR 0001).
- Chat messages and onboarding flags are also never exported.

Filename: `kukito-export-YYYY-MM-DD.json` (UTC date), serialized as pretty-printed JSON.

## Envelope format (v1 interchange contract)

```json
{
  "version": 1,
  "exportedAt": "2026-10-03T12:00:00.000Z",
  "data": {
    "ingredients": [],
    "equipment": [],
    "recipes": [],
    "deductionHistory": []
  }
}
```

The envelope is an external contract — files exported by any build may be imported by
another. Rules:

- `version` must be exactly the number `1`; import rejects anything else with
  `unsupported version … created by a newer version of Kukito!`. A breaking format
  change must bump `version` and keep older versions importable (or drop them in a
  coordinated change) — never silently reinterpret a file.
- `exportedAt` must be a non-empty string (the exporter writes an ISO-8601 timestamp;
  it is shown in the import preview header).
- Unknown keys in the file are ignored. Import applies only the four `data`
  collections and `App.handleImportData` never writes settings, so a hand-edited file
  cannot alter the importing device's API key or onboarding flag.

## Import flow

1. File selected → parsed and validated first; nothing is applied if validation fails.
2. A preview modal shows the export date and incoming record counts (Ings / Tools /
   Recipes / History). Nothing is written until a mode is chosen.
3. Modes (both cap `deductionHistory` at 30 records, matching the storage limit):
   - **Merge** — imported records are added alongside current data; an imported record
     whose `id` already exists is skipped, so existing data is never overwritten.
     Deduction history: imported records first, then existing records, deduped by `id`.
   - **Replace** — all four collections are overwritten with the file's contents.
4. On success: data is written through `storageService`, React state is updated, and a
   success toast is shown.

Consequences of merge semantics worth knowing:

- Merge compares against **localStorage**, not React state. This is safe because every
  mutation in `App.tsx` writes state and storage together, so the two cannot diverge.
- Records created independently on two devices can share an `id` (ids are
  timestamp-based); merge will treat the imported one as a duplicate and skip it — by
  the "never overwrite existing ids" rule, not by content comparison.
- Import does not trigger onboarding on a fresh device: onboarding only auto-starts
  when no ingredients exist, and a successful import creates them.

## Validation rules

`parseImportFile` (`src/services/export.ts`) rejects, with every message prefixed
**`Invalid export file`**. The prefix is a UI contract: the Data Sync section displays
prefixed messages verbatim as an inline error and falls back to a generic
"Invalid file format…" message for anything else (e.g. a JSON syntax error).

| Rejected input | Error message |
| --- | --- |
| not a JSON object | `Invalid export file: not a JSON object` |
| missing `version` or `data` | `Invalid export file: missing version or data` |
| `version !== 1` (incl. string `"1"`) | `Invalid export file: unsupported version …` |
| missing / empty / non-string `exportedAt` | `Invalid export file: missing exportedAt` |
| a collection that is not an array | `Invalid export file: data.<key> must be an array` |
| an item that is not a non-null object with a string `id` | `Invalid export file: data.<key> contains malformed records` |

The item-shape rule is strict on purpose: the app has **no error boundary**, renders
record fields directly, and `localStorage` is the only store — a single malformed
persisted record would white-screen the app on the default Pantry tab on every load,
recoverable only by clearing site data. Parse time is the only point where a bad file
can be stopped with a user-visible error.

## Error handling

- **Parse/validation failures** → inline error inside the Data Sync section; no file is
  applied and no modal opens.
- **Apply/persist failures** (corrupted existing storage, `QuotaExceededError` during
  the bulk write) → caught in `handleConfirmImport`; `Import failed: …` is rendered
  **inside** the preview modal (the section-level error box sits behind the modal
  overlay), the modal stays open for retry, and it closes only on success.
  Caveat: `localStorage` has no cross-key transactions, so a quota failure mid-import
  can leave a partial write; retrying the import reconciles it.
- **Success** → toast.

## Related storage behavior

- Persistence goes through `storageService` (versioned keys `kukito_*_v1`).
- `deductionHistory` is capped at 30 on every write path: `saveDeductionRecord`,
  the bulk `setDeductionHistory`, and both import modes.
- `storageService.setDeductionHistory()` exists specifically for import. Deduction
  history has no React state in `App.tsx` (the undo flow reads storage on demand), so
  the storage write is the complete update for that collection — its absence from the
  state setters is intentional, not an omission.

## Implementation map

- `src/services/export.ts` — envelope type, download, `parseImportFile`,
  `applyImport` (merge/replace)
- `src/components/settings/ExportImportSection.tsx` — Data Sync UI, file picker,
  preview modal, error display
- `src/services/storage.ts` — `getDeductionHistory` / `setDeductionHistory`
- `src/App.tsx` — `handleImportData` (persist four collections + state + toast),
  `SettingsView` prop wiring
