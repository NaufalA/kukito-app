# Test Results: Data Export & QR Code Recipe Sharing

Validation performed 2026-10-03.

> **Phase 2 (QR) note — updated 2026-10-03:** the QR results below were produced by the
> original `compressToUTF16` string implementation. That implementation was later found
> **broken for real recipes** (UTF-8 byte expansion exceeded QR capacity — a real 3,736-char
> recipe failed to generate) and was replaced with a byte-payload + EC level L fix in
> `src/services/qrCode.ts`. The fix passed `tsc --noEmit` and `npm run build`, but its
> smoke-test re-run was not completed before the Phase 2 changes were stashed
> (stash entry with "Phase 2 Recipe QR", see `task.md`). **Phase 1 results below remain valid;
> Phase 2 QR tests must be re-run against the byte API before review.**
> A regression fixture (`recipe-sample.json`, the real burger recipe) and updated byte-API
> tests were added to the harness in `/tmp/kukito-smoke/test.mjs` but the suite was not
> executed after those edits.

## Tests

Service-level smoke test — executes the **real compiled sources** of
`src/services/export.ts`, `src/services/qrCode.ts`, and `src/services/storage.ts`
(via `tsc --module commonjs` into `/tmp/kukito-smoke/out`, run under Node with a
`localStorage` polyfill).

### Phase 1 — Data Export/Import (12 checks) — RE-RUN after review fixes: **12/12 PASS** (2026-10-03)

- PASS — `exportAllData` produces versioned envelope with all 4 collections (settings excluded)
- PASS — `parseImportFile` accepts a valid envelope round-trip
- PASS — `parseImportFile` rejects non-JSON
- PASS — `parseImportFile` rejects missing `data` section
- PASS — `parseImportFile` rejects non-array collection
- PASS — merge mode: adds new items, skips existing ids, dedupes deduction history
- PASS — replace mode: overwrites collections, caps deduction history at 30
- PASS — `storageService.setDeductionHistory` persists and caps at 30 (real compiled storage service)
- PASS — `parseImportFile` rejects envelope without `exportedAt` (non-string/empty too) — review finding 1
- PASS — `parseImportFile` rejects unsupported versions (`2`, `99`, `"1"`) with a clear "newer version" message; missing version still reported as missing — review suggestion 3
- PASS — `parseImportFile` rejects malformed records (`null`, `42`, missing `id`, non-string `id`, valid-then-malformed) in every collection — review finding 2
- PASS — `parseImportFile` still accepts a real `exportAllData` envelope after validation tightening

Review finding 2's component half (try/catch around apply/persist with the error
rendered inside the preview modal) and suggestion 4 (apply failures surfaced instead
of silent partial writes) are UI behavior — covered by `tsc`/build only, not the
service harness (no DOM test tooling in this repo).

### Phase 2 — QR Recipe Sharing (6 checks) — **STALE, not re-run** (Phase 2 stashed)

- PASS — `generateRecipeQrDataUrl` returns a PNG data URL
- PASS — QR payload round-trips: encode → render pixels → `jsQR` decode → original recipe recovered
- PASS — `decodeQrPayload` rejects payloads without the `KUKITO:` prefix
- PASS — `decodeQrPayload` rejects corrupted compressed payloads
- PASS — `decodeQrPayload` rejects payloads decompressing to non-recipe JSON
- PASS — `generateRecipeQrDataUrl` rejects oversized recipes (incompressible payload > 2800 chars)

(These 6 passed in the original 14/14 run against the pre-fix string implementation;
they must be re-run against the byte API after the stash is restored — see top note.)

Note: earlier failures in this suite were test-harness bugs (wrong storage key
`kukito_deduction_history_v1` vs real `kukito_deductions_v1`; an oversized-recipe
fixture padded with repeating `x` that lz-string compressed below the limit), not
implementation bugs. Fixed in the harness.

## Build

- `npm run build` — PASS (re-run 2026-10-03 after review fixes: 8 entries, 838.05 KiB precache)

## Lint / Static Analysis

- `npx tsc --noEmit` — FAIL (1 pre-existing error unrelated to this task:
  `src/main.tsx(4,8): TS2882` — side-effect import of `./index.css`.
  `src/main.tsx` is untouched by this task; no new type errors were introduced.
  Re-run 2026-10-03 after review fixes: same single pre-existing error, no new errors.)

## Notes

- No lint/test scripts exist in this repository (per AGENTS.md); the smoke test above is
  an ad-hoc harness kept outside the repo (`/tmp/kukito-smoke/`), not a committed test suite.
- Browser/runtime smoke test **not performed**: no desktop browser is connected to this
  session. UI flows (file picker, camera scanner, modal interactions) are therefore
  compile-validated and logic-validated only, not visually verified.
- QR camera scanning requires `getUserMedia` (HTTPS/localhost) — verify on a real device
  during review.

## Failures

- None at the service level. See `tsc` note above for the pre-existing repo error.
