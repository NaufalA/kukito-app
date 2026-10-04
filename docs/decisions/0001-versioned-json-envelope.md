# ADR 0001: Versioned JSON envelope for device data portability

- Status: Accepted
- Date: 2026-10-03

## Context

Kukito! is a mobile-first PWA with no backend — all state lives in browser
`localStorage`, and the only secret (the Gemini API key) is entered through Settings
and stored per device. Users need to move a kitchen between devices (PC ↔ Mobile)
without losing data. Candidates considered:

- **Backend / cloud sync** — rejected: violates the project's no-server architecture
  and would require operating infrastructure and handling the API key server-side.
- **QR codes for the full dataset** — rejected: a QR code holds at most ~3 KB even at
  error-correction level L (version 40), which is far below a whole kitchen's JSON;
  QR is only viable for a single record such as one recipe.
- **Unversioned JSON dump** — rejected: once files are shared between devices there is
  no way to detect format drift or safely evolve the structure.

## Decision

Represent device sync as a single **versioned JSON envelope** exchanged as a file:

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

1. **Export scope is exactly four collections** — ingredients, equipment, recipes,
   deduction history. **Settings (including the Gemini API key) are excluded from
   export and never written by import**, so export files are safe to share and every
   device keeps its own secret.
2. **`version` is a hard gate** — import accepts only the exact number `1`. A breaking
   format change must bump the version and keep older versions importable (or drop them
   in a coordinated change); a file from a different format is rejected with a clear
   message rather than silently reinterpreted.
3. **Validation is strict and happens before anything is persisted** — structural
   checks (version, `exportedAt`, array collections) plus item shape (non-null object
   with a string `id`) so malformed records can never reach `localStorage`.

## Consequences

- The envelope is an external contract between builds: files exported anywhere are
  importable elsewhere, and evolving it requires version handling.
- Sync is manual (pick a file) and merge/replace based, not live — acceptable because
  the app has no real-time requirement and no backend to provide one.
- Merge never overwrites an existing `id`, so a record created independently on two
  devices with a colliding (timestamp-based) `id` is skipped as a duplicate rather
  than merged by content — the predictable rule wins over best-effort matching.
- Strict item validation rejects hand-edited files with missing fields, but this is
  the only way to stop bad data before persistence: the app has no error boundary, so
  a malformed persisted record can white-screen the app on load until site data is
  cleared.
- Settings cannot be migrated between devices via export — a deliberate trade-off to
  keep secrets out of files; users re-enter the API key on each device.
- No transactional rollback across storage keys on write failure (e.g. quota exceeded
  mid-import); a partial write is possible and reconciled by retrying the import.

## Related

- [Data Export & Import](../data-export-import.md) — behavior reference
