# Data Export & QR Code Recipe Sharing

## Objective

Enable users to sync their Kukito! data between devices (PC ↔ Mobile) via JSON file export/import, and share individual recipes with others via QR code scan.

The work is split into two independent phases:

1. **Phase 1 — Data Export/Import**: full-data sync via JSON file (Settings)
2. **Phase 2 — QR Recipe Sharing**: single-recipe share via QR code (Recipes)

## Status

PHASE 2 STASHED (Phase 1 active in working tree)

**Phase 1 — Data Export/Import**: implemented in the working tree (uncommitted) and validated:

- Service smoke test — PASS (see `test-results.md`)
- `npm run build` — passes (re-validated after the stash)
- `npx tsc --noEmit` — only pre-existing `src/main.tsx` CSS-import error (untouched by this task)
- Browser/runtime smoke test — not performed (no desktop browser connected)

**Phase 1 review (2026-10-03)**: `review.md` returned CHANGES_REQUIRED (2 MINOR + 2 SUGGESTION). All four findings were addressed the same day at the user's request:

1. **MINOR** — `parseImportFile` now requires a non-empty string `exportedAt`, so the preview modal's `exportedAt.split('T')` dereference can no longer crash on validator-accepted input.
2. **MINOR** — item-shape validation in `parseImportFile` (every record must be a non-null object with a string `id`, else `data.<key> contains malformed records`), plus `handleConfirmImport` wrapped in try/catch with `Import failed: …` rendered inside the preview modal — apply/persist errors can no longer fail silently or close the modal on failure.
3. **SUGGESTION** — `version !== 1` (including string versions like `"1"`) rejected with an "unsupported version … newer version of Kukito!" message.
4. **SUGGESTION** — storage write failures during import (e.g. quota exceeded) surface through the same try/catch instead of leaving a silent partial write.

Re-validated after the fixes: smoke test **12/12 PASS** (4 new checks), `npm run build` PASS, `npx tsc --noEmit` only the pre-existing error.

**Re-review (2026-10-03)**: `review.md` re-review section verified all four fixes with an adversarial probe against the compiled sources (original crash paths closed, error-prefix contract intact, no regressions in the 8 original checks). Verdict: **APPROVED** (one optional SUGGESTION: unsupported-version message wording for non-newer inputs like `version: 0` — no changes required). Remaining validation: browser round-trip of the file picker flow.

**Knowledge update (2026-10-03)**: Phase 1 durable design and behavior promoted to project documentation:

- `docs/data-export-import.md` — behavior reference (export scope, v1 envelope contract, import flow/merge semantics, validation rules with rationale, error handling, storage notes)
- `docs/decisions/0001-versioned-json-envelope.md` — ADR for the versioned-envelope decision (alternatives, settings exclusion, strict validation, consequences)
- `AGENTS.md` quirk #8 corrected (the `docs/` directory now exists)

Task artifacts are retained unchanged: Phase 2 remains stashed and `design.md`/`test-results.md` still carry its state. No task content was deleted — promotion was copy-forward of durable knowledge only.

**Phase 2 — QR Recipe Sharing**: stashed on user request (2026-10-03).

- Stash entry (top of stack at time of stashing): `stash@{0}` — *"Phase 2 Recipe QR: qrCode.ts (byte payload + EC L fix), QR display/scan modals, Share buttons, qrcode/jsqr/lz-string deps, App.tsx QR wiring patch"*
  (the pre-existing `stash@{1}` "WIP on ingredients-export" is untouched)
- Contains: `src/services/qrCode.ts`, `RecipeQrCodeModal.tsx`, `RecipeQrScanModal.tsx`, `RecipeCard.tsx` + `RecipeDetailModal.tsx` Share-button changes, `package.json`/`package-lock.json` (qrcode/jsqr/lz-string/@types/qrcode deps), and `.ai/tasks/data-export-qr/app-tsx-qr-wiring.patch`
- `src/App.tsx` could not be pathspec-stashed (it mixes both phases), so its QR wiring was removed manually and saved as the patch inside the stash. **To restore Phase 2:** `git stash pop`, then apply `app-tsx-qr-wiring.patch` to `src/App.tsx` (`git apply` from repo root; patch is also preserved at `/tmp/App.tsx.mixed-backup` as a full-file copy).
- Open implementation issue at time of stashing: the byte-payload QR fix was applied to `src/services/qrCode.ts` and `npx tsc --noEmit`/`npm run build` passed, but the smoke-test harness re-run for the new byte API was **not completed**. Phase 2 needs test re-validation before review (see `test-results.md` and `design.md` deviation note).

## Requirements

### Phase 1 — Data Export/Import

Scope: **ingredients, equipment, recipes, deduction history**. Settings are explicitly excluded (export files never contain the API key).

- [x] Export the four collections as a downloadable JSON file (`kukito-export-YYYY-MM-DD.json`)
- [x] Envelope format: `{ version: 1, exportedAt, data: { ingredients, equipment, recipes, deductionHistory } }`
- [x] Import from a JSON file with a preview step showing incoming record counts before applying
- [x] Two import modes: **Merge** (dedupe by id; imported records never overwrite existing ids) and **Replace** (overwrite all four collections)
- [x] Deduction history capped at 30 records after import (matches storage limit); merge dedupes by record id
- [x] Validation: reject non-JSON, missing `version`/`data`, and non-array collections with a clear error message
- [x] Persist via `storageService`, including the new bulk setter `setDeductionHistory()`
- [x] Success surfaces as a toast; parse/validation failures surface as an inline error in the Settings section
- [x] UI lives in Settings (`ExportImportSection`), shows current record counts, follows existing design patterns

### Phase 2 — QR Recipe Sharing

- [x] Share entry points: QR share button on `RecipeCard` and in the `RecipeDetailModal` header
- [x] QR display modal renders the recipe QR (`qrcode` lib) with a save-image action
- [x] QR payload: full recipe JSON prefixed `KUKITO:`, compressed with `lz-string` `compressToUTF16`, size limit ~2800 chars
- [x] Oversized recipes fail gracefully with a user-facing message
- [x] "Scan QR" button in the Recipes tab header opens a camera scanner modal
- [x] Scanner uses `getUserMedia` (environment-facing) + `jsQR`; camera stream stopped on close/decode (StrictMode-safe init token)
- [x] Invalid/foreign QR payloads rejected with retry; camera errors handled (denied, unsupported, no camera)
- [x] Scanned recipe shows a preview with "Add to Collection"; imported recipe gets a fresh id to avoid collisions
- [x] UI follows existing design patterns (dark theme, orange accents, rounded cards, mobile-first)

## Implementation Status

### Phase 1 — Data Export/Import: implemented

- `src/services/export.ts` — envelope, download, parse/validate, merge/replace apply
- `src/services/storage.ts` — `setDeductionHistory()` bulk setter
- `src/components/settings/ExportImportSection.tsx` — section UI + import preview modal
- `src/components/settings/SettingsView.tsx` — new `exportCounts` / `onImportData` props wired
- `src/App.tsx` — `handleImportData` handler + prop wiring

Verified: service smoke test PASS — 12/12 checks (envelope, validation incl. `exportedAt`/version/item-shape guards, merge/replace, 30-cap, bulk setter). Review findings 1–2 and suggestions 3–4 addressed (see Status).
Remaining: [ ] browser round-trip verification of the file picker flow

### Phase 2 — QR Recipe Sharing: implemented

- `package.json` — new deps: `qrcode`, `jsqr`, `lz-string`, `@types/qrcode`
- `src/services/qrCode.ts` — generate / decode / scan helpers
- `src/components/recipes/RecipeQrCodeModal.tsx` — QR display modal
- `src/components/recipes/RecipeQrScanModal.tsx` — camera scanner modal
- `src/components/recipes/RecipeCard.tsx` — Share button
- `src/components/recipes/RecipeDetailModal.tsx` — Share QR header button
- `src/App.tsx` — QR state, handlers, Scan QR button, modal rendering

Verified: service smoke test PASS (QR encode → pixel render → `jsQR` decode round-trip, payload prefix/corruption/oversize rejection).
Remaining: [ ] camera scanner verification on a real device (HTTPS + `getUserMedia`)

## Artifacts

- `design.md`
- `test-results.md`
- `review.md`
- Promoted to `docs/`: `docs/data-export-import.md`, `docs/decisions/0001-versioned-json-envelope.md`

## Next Step

Phase 1: re-review completed — **APPROVED** (`review.md`). Remaining: browser round-trip
verification of the file picker flow (not yet performed — no browser in session); one
optional suggestion on version-message wording if ever touched again.

Phase 2: remains stashed; restore per the Status section, then re-run the byte-API QR
smoke tests (including the real burger-recipe regression fixture) before its review.
