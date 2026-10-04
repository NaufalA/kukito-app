# Code Review: Data Export & QR Code Recipe Sharing — Phase 1 (Data Export/Import)

## Summary

Phase 1 adds a Settings "Data Sync" section (`ExportImportSection`), an export service (`src/services/export.ts`), a bulk `storageService.setDeductionHistory()` setter, and `App.tsx` wiring (`handleImportData` + props). Export writes a versioned JSON envelope (ingredients, equipment, recipes, deduction history — settings excluded). Import validates structure, previews incoming counts, and applies Merge (dedupe by id) or Replace (cap history at 30) via storage + React state with a success toast. All changes are uncommitted in the working tree; Phase 2 (QR) is stashed and out of scope for this review.

The implementation satisfies all nine Phase 1 requirements. Two MINOR reliability gaps were confirmed empirically: the preview modal dereferences `exportedAt` without the validator requiring it (render crash on accepted input), and import performs no item-shape validation (malformed items can crash the app persistently in Replace mode).

## Requirements

Phase 1 requirements from `.ai/tasks/data-export-qr/task.md`:

- [x] Export file named `kukito-export-YYYY-MM-DD.json` — `export.ts:37`
- [x] Envelope `{ version: 1, exportedAt, data: { ingredients, equipment, recipes, deductionHistory } }` — `export.ts:4-13`; smoke test asserts all 4 collections and `!('settings' in env.data)` (API key never exported)
- [x] Import with preview step showing incoming record counts before applying — `ExportImportSection.tsx:77-84, 151-156`
- [x] Merge adds imported records without overwriting existing ids; Replace overwrites — `applyImport` (`export.ts:64-101`), smoke-tested
- [x] Deduction history capped at 30 after import; merge dedupes by `id` — `export.ts:72, 99`; `storage.ts:117`; smoke-tested at all three layers
- [x] Validation rejects non-JSON, missing `version`/`data`, non-array collections with clear error — `parseImportFile` (`export.ts:42-62`), smoke-tested (see Finding 1 for a gap outside the enumerated scope)
- [x] Persist through `storageService` including new `setDeductionHistory` — `App.tsx:170-173`, `storage.ts:116-118`
- [x] Success toast; parse/validation failures as inline error in the Settings section — `App.tsx:176-178`, `ExportImportSection.tsx:55-61, 123-128`
- [x] UI lives in Settings as `ExportImportSection`, shows counts, follows existing design patterns — modal uses the design-specified `fixed inset-0 z-50 bg-slate-950/85 …` pattern; dark cards, orange accents, mobile-first grid all match `SettingsView` conventions

Also verified: settings (`geminiApiKey` etc.) are never read by export and never written by import, so each device keeps its own API key.

## Findings

### BLOCKER

- None

### MAJOR

- None

### MINOR

**1. Preview modal crashes the app when `exportedAt` is missing — validator and UI disagree on required fields**

- **File:** `src/services/export.ts` / `src/components/settings/ExportImportSection.tsx`
- **Location:** `parseImportFile()` (export.ts:42-62) vs. preview render at ExportImportSection.tsx:140
- **Problem:** `parseImportFile` requires `version`, `data`, and array collections, but not `exportedAt`. The preview modal unconditionally renders `pendingEnvelope.exportedAt.split('T')[0]`. A file such as `{"version":1,"data":{…all 4 arrays…}}` passes validation and then throws `TypeError: Cannot read properties of undefined (reading 'split')` during render. There is no error boundary anywhere in `src/`, so the whole app unmounts to a white screen (verified: validator ACCEPTED the file; render expression threw).
- **Why it matters:** The crash happens on accepted input, inside the core import flow. Recovery requires a manual reload, and reopening the preview reproduces it. The envelope format (requirement) includes `exportedAt`, so the validator should enforce what the UI dereferences.
- **Recommendation:** In `parseImportFile`, require `typeof parsed.exportedAt === 'string'` (add to the existing "missing version or data"-style error), or render defensively (`pendingEnvelope.exportedAt?.split('T')[0] ?? 'unknown date'`). Validating in the parser is preferred so the error surfaces as the existing inline Settings error.

**2. No item-shape validation — Replace mode can poison localStorage and crash-loop the app; Merge fails silently**

- **File:** `src/services/export.ts`
- **Location:** `parseImportFile()` (export.ts:56-60) and `applyImport()` (export.ts:82-99)
- **Problem:** Validation only checks `Array.isArray`. Verified empirically:
  - `{version:1, data:{ingredients:[null], …}}` is ACCEPTED.
  - Merge: `data.ingredients.filter((i) => !existingIngIds.has(i.id))` throws `TypeError: … reading 'id'` on `null`. `handleConfirmImport` (ExportImportSection.tsx:64-68) has no try/catch, so the error is uncaught — no inline error, no toast, modal stays open, nothing visibly happens.
  - Replace: `[null]` is returned untouched, persisted via `handleImportData`, and the Pantry tab renders `ingredient.name` on `null` → render TypeError. Default tab is `'pantry'` (App.tsx:25) and there is no error boundary, so the app white-screens on every load until the user manually clears localStorage.
  - Non-object items (e.g. `ingredients:[42]`) are also accepted and stored as garbage rows.
- **Why it matters:** The stated requirement is "Import must validate data and handle errors gracefully." A corrupt or hand-edited file — exactly the cross-device sync scenario this feature exists for — can brick the app with no error message, and the only recovery is wiping all site data (total data loss).
- **Recommendation:** In `parseImportFile`, after the array check, verify each item is a non-null object with an `id` (string) — reject with `Invalid export file: data.<key> contains malformed records` so it surfaces as the existing inline error. Additionally, wrap `handleConfirmImport` in try/catch mapping to `setErrorMessage` so apply-time failures can never fail silently.

### SUGGESTION

**3. Future file versions are accepted as v1**

- **File:** `src/services/export.ts` — `parseImportFile()` line 47
- **Problem:** `if (!parsed.version || !parsed.data)` accepts `version: 2` (verified) and string versions; a future export format would be silently interpreted with v1 semantics.
- **Recommendation:** Reject `parsed.version !== 1` with a "created by a newer version of Kukito!" message. Cheap forward-compat guard for a versioned format.

**4. Import write errors are unhandled (partial write + state/storage divergence)**

- **File:** `src/App.tsx` — `handleImportData()` (lines 168-180)
- **Problem:** Four `storageService.set*` calls run before the state setters with no try/catch. A `QuotaExceededError` mid-sequence (localStorage ~5 MB cap; a hand-crafted large file can exceed it) leaves some collections overwritten in storage while React state still shows the old data — the UI and storage diverge until reload, and `onImport` throwing means `setPendingEnvelope(null)` never runs: modal stays open with no error shown.
- **Recommendation:** Wrap the persist+setState sequence in try/catch in `handleConfirmImport` or `handleImportData`, surface a `setErrorMessage`/toast on failure, and close the modal only on success. Low likelihood for normal export sizes; noted for robustness.

## Tests Reviewed

No test suite exists in the repo (per AGENTS.md). Validation actually performed by the reviewer:

- Phase 1 smoke harness (real compiled sources via `tsc`, localStorage polyfill; rebuilt as a Phase-1-only run after the Phase 2 stash) — **PASS** (8/8): envelope contents + settings excluded, valid round-trip, non-JSON rejected, missing `data` rejected, non-array collection rejected, merge (new added / existing skipped / deduction dedupe), replace (overwrite + 30-cap), `setDeductionHistory` bulk setter + cap
- `npx tsc --noEmit` — **PASS with pre-existing error**: only `src/main.tsx(4,8) TS2882` (CSS side-effect import, untouched by this task)
- `npm run build` — **PASS** (precache 8 entries, 837.42 KiB, `dist/sw.js` generated)
- Browser round-trip of Export/Import buttons (file picker, blob download, preview modal) — **NOT RUN**: no browser available in this environment; also flagged as remaining work in `task.md`. `downloadExportFile` uses a detached anchor + immediate `URL.revokeObjectURL` (export.ts:30-40), a pattern with known cross-browser quirks — please verify manually on Chrome and Safari/iOS during the task's browser-verification step (consider appending the anchor to `document.body` and revoking on a `setTimeout` if any browser drops the download).
- Prior QR/Phase 2 test results in `test-results.md` — not re-run (Phase 2 stashed; marked stale there).

## Design Deviations

- `ExportImportSection` is placed above the Kitchen Setup wizard in `SettingsView`; design §8 said "below the Kitchen Setup section". Cosmetic placement only — task.md does not specify order.
- Import errors render inline in the section (task.md requirement) whereas the design's Error-Handling table said "Toast error". Implementation correctly follows the task, which supersedes.
- `ExportImportSectionProps` adds `counts` (design specified only `onImport`); required by the task's counts-display requirement — justified extension.
- `parseImportFile` uses `Array.isArray` instead of the design's `key in parsed.data` presence check — stronger than design, matches the task.

## Final Status (original review — superseded by the re-review below)

CHANGES_REQUIRED

Findings 1 and 2 (both MINOR) should be addressed: they are validator/contract defects in the core import path with confirmed crash behavior, fixable with small additions to `parseImportFile` (plus an optional try/catch around confirm). Requirements are otherwise fully met and all executed validation passes. Browser verification of the file-picker flow remains outstanding per `task.md` regardless of this review.

---

## Update (2026-10-03): findings addressed by implementer

All four findings were implemented at the user's request; **pending reviewer re-check**:

- **Finding 1 (MINOR)** — `parseImportFile` now requires a non-empty string `exportedAt` (`src/services/export.ts:56-58`); the preview modal's `pendingEnvelope.exportedAt.split('T')[0]` dereference is parser-guaranteed safe.
- **Finding 2 (MINOR)** — item-shape guard added (`src/services/export.ts:65-77`): each collection element must be a non-null object with a string `id`, else `Invalid export file: data.<key> contains malformed records` (surfaces via the existing inline Settings error). Additionally `handleConfirmImport` is wrapped in try/catch (`src/components/settings/ExportImportSection.tsx:64-80`); apply/persist failures render as `Import failed: …` **inside the preview modal** (the section-body error box sits behind the overlay), and the modal closes only on success.
- **Suggestion 3** — `version !== 1` (number or string, e.g. `"1"`) rejected with `unsupported version … created by a newer version of Kukito!` (`src/services/export.ts:50-55`); a missing version still reports `missing version or data`.
- **Suggestion 4** — covered by the same try/catch: `onImport` (the four `storageService.set*` writes + state updates) runs inside the guarded block, so quota/write failures surface inline instead of silently diverging.

Re-validation performed by the implementer: smoke harness **12/12 PASS** (8 original Phase 1 checks + 4 new checks covering findings 1–2 and suggestion 3, including a guard that real `exportAllData` envelopes still pass), `npm run build` PASS, `npx tsc --noEmit` — only the pre-existing `src/main.tsx` TS2882 error. Component-level try/catch behavior is compile-validated only (no DOM test tooling in this repo). Browser round-trip verification of the file picker flow remains NOT RUN.

---

## Re-review (2026-10-03): finding fixes

Scope note: this re-review was performed by the same agent that applied the fixes (no second reviewer available in this session), so it is evidence-based rather than second-party: code on disk was re-read against the fix regions, an independent adversarial probe was run against the freshly compiled sources, and the full validation set was re-run.

### Verification of each finding

**Finding 1 (MINOR) — `exportedAt` contract crash: FIXED.**
`src/services/export.ts:56-58` requires a non-empty string `exportedAt`, checked before any data-shape checks. Probe: missing `exportedAt` → `REJECTED: Invalid export file: missing exportedAt`; `exportedAt: 12345` → rejected the same way. The preview modal's `pendingEnvelope.exportedAt.split('T')[0]` dereference is now unreachable for validator-accepted input (the original crash path is closed). Missing-`data` files still report `missing version or data` (presence check runs first — message priority correct). Non-ISO strings (e.g. `'x'`) remain accepted by design — presence-level validation as recommended; renders `Import from x`, no crash.

**Finding 2 (MINOR) — item-shape validation + silent apply failure: FIXED.**
`src/services/export.ts:65-77`: every element of all four collections must be a non-null object with a string `id`, else `Invalid export file: data.<key> contains malformed records`. Probe: `ingredients: [null]` → rejected; `recipes: [{title}]` → rejected; harness additionally covers `42`, missing `id`, `null` id, numeric `id`, valid-then-malformed, and `deductionHistory: [null]`. Because malformed items are rejected at parse time, `applyImport`'s uncaught `null.id` TypeError from file-sourced data is unreachable, and `[null]` can no longer be persisted — the pantry crash-loop path is closed. Component half: `handleConfirmImport` (`ExportImportSection.tsx:64-80`) guards apply + persist in try/catch; the error renders through a shared `errorBox` **inside** the preview modal (correct placement — the section-body instance sits behind the `z-50` overlay and would be illegible); the modal closes only on success (close statement runs after `onImport`, inside the `try`). Quota-failure simulation surfaced `Import failed: The quota has been exceeded.` as expected. Limitation: the component catch path is compile/logic-validated only (no DOM test tooling in this repo); the probe reproduced the same logic under Node.

**Suggestion 3 — future-version acceptance: FIXED.**
`src/services/export.ts:50-55`: `version !== 1` rejected with `Invalid export file: unsupported version … — the file was created by a newer version of Kukito!`. Probe: `2`, `99`, `"1"`, `1.5` all rejected — the strict inequality also catches string `"1"`, which the old `!parsed.version` truthiness check accepted. A missing version still reports `missing version or data`. The version check runs before data-shape checks, so a future-format file gets the version message rather than a confusing array error.

**Suggestion 4 — unhandled import write errors: FIXED (as scoped by the finding).**
All four `storageService.set*` writes plus the React state updates run inside the guarded try block (`onImport` is invoked within `try`); failure → `Import failed: <message>` in the modal, `pendingEnvelope` retained for retry, closed only on success. One caveat unchanged from the finding's accepted scope: a mid-sequence quota failure can still leave a partial write (no rollback across the four localStorage keys — inherent to the medium and acknowledged when the recommendation was written); it is no longer silent, which was the point of the suggestion.

### Cross-cutting checks

- **Error-prefix contract**: every parse error starts with `Invalid export file`, so the component's `startsWith` branch shows the specific message inline rather than falling back to the generic one — verified on all 10 probe cases (`[inline-shown by component]`).
- **Settings isolation still holds**: export contains only the four collections (`!('settings' in env.data)` harness check), and `App.handleImportData` writes only the four collections — an imported file's contents can never modify the device's API key, regardless of extra keys present.
- **No regression**: the original 8 Phase 1 checks (round-trip, merge/replace semantics, 30-cap, bulk setter) still PASS, plus an explicit guard that real `exportAllData` envelopes still validate — tightening did not break app-generated files.
- **Scope**: the fix round changed only `src/services/export.ts` and `src/components/settings/ExportImportSection.tsx` (both Phase 1 files; tracked diff still shows only the original Phase 1 wiring in `App.tsx`/`SettingsView.tsx`/`storage.ts`). No new dependencies, no commits, stash untouched. All error messages verified as user-appropriate and React-escaped (no file content echoed except the small `version` primitive).

### Findings (re-review)

- **BLOCKER** — none
- **MAJOR** — none
- **MINOR** — none
- **SUGGESTION** — `src/services/export.ts:50-55`: the unsupported-version message always claims the file "was created by a newer version of Kukito", which is inaccurate for `version: 0`, `version: null`, and `version: "1"` (corrupt or hand-edited rather than newer). All of these are correctly rejected; only the wording misleads. Optional: branch the message for non-numeric or `< 1` values (e.g. `unsupported version X (expected 1)`). Does not require changes.

### Tests reviewed (re-run during this re-review)

- Phase 1 smoke harness, real compiled sources — **12/12 PASS**
- Independent adversarial probe (10 validator cases + simulated quota failure) — all expected outcomes (see verification section above)
- `npx tsc --noEmit` — PASS with only the pre-existing `src/main.tsx(4,8) TS2882` error (no new errors)
- `npm run build` — PASS (838.05 KiB precache, `dist/sw.js` generated)
- Browser file-picker round-trip — **NOT RUN** (no browser in session; remains an open validation task in `task.md`, not a code defect)

### Design deviations (re-review)

- None. The fixes are strict supersets of the design's structural-validation list and implement exactly the recommendations made in this review.

## Final Status

APPROVED
