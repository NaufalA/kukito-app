# AGENTS.md — Kukito! Repository

## Project Overview

Kukito! is a mobile-first, offline-ready PWA built with **React 19, TypeScript, Tailwind CSS v4, Vite 8, and `vite-plugin-pwa`**. It manages kitchen inventory and provides AI-generated recipes via the Google Gemini API.

**No server, no backend** — all state persists in `localStorage` via `src/services/storage.ts`.

---

## Commands

```bash
npm install          # Installs deps; @google/genai and protobufjs have allowScripts in package.json
npm run dev          # Dev server at http://localhost:5173
npm run build        # Produces dist/
npm run preview      # Preview production build locally
```

**No lint, typecheck, or test scripts exist** in `package.json`. There is no test suite or CI pipeline.

When validating changes, use the available commands directly. Do not claim that tests, linting, or type checking passed when no such validation was performed.

---

## Architecture

### Entry Points

- `index.html` → mounts `src/main.tsx` → renders `src/App.tsx`
- `src/App.tsx` is the single-page shell with **5 tabs** (bottom navigation):
  Pantry, Equipment, AI Chef, Recipes, Settings

### Key Directories

- `src/components/` — Feature components (ai, common, equipment, onboarding, pantry, recipes, settings)
- `src/services/` — `gemini.ts` (Google Gemini API client, streaming) and `storage.ts` (localStorage persistence)
- `src/types/` — TypeScript interfaces (`index.ts`, `recipe.ts`, `equipment.ts`, `gemini.ts`, `dtos/`)
- `public/` — Static assets, PWA icons, favicon

### State Management

- All state lives in React `useState` hooks in `App.tsx` — no external state library
- `storageService` in `src/services/storage.ts` persists to `localStorage` using versioned keys (`kukito_*_v1`)
- Onboarding auto-triggers when `hasCompletedOnboarding` is false and no ingredients exist

### AI Integration

- `src/services/gemini.ts` uses `@google/genai` SDK with **streaming** interactions
- Model filtering in `listGeminiModels()` only returns models matching `gemini-3.`, excluding `image`/`preview`, with `generateContent` support
- Default model stored in settings is `gemini-2.5-flash`
- `geminiRecipeSchema` in `src/types/gemini.ts` defines the Zod response format for recipe generation
- `initiateGemini(apiKey)` must be called before using the AI features

### PWA / Offline

- `vite-plugin-pwa` in `vite.config.ts` generates a Workbox service worker with `registerType: 'autoUpdate'`
- `index.html` has `viewport` locked for mobile (`user-scalable=no`) and `theme-color` set
- `src/index.css` includes safe-area-inset padding utilities for notched devices

---

## TypeScript Configuration

- `tsconfig.json`: `strict: true`, `noEmit: true`, `jsx: "react-jsx"`
- **`noUnusedLocals: false` and `noUnusedParameters: false`** — unused vars are NOT errors
- `include: ["src"]` only — types outside `src/` won't be checked

---

## Important Constraints & Quirks

1. **`allowScripts` in `package.json`**: `@google/genai` and `protobufjs` have `allowScripts: true`. If `npm install` fails, check for postinstall script issues with these packages.

2. **No `.env` files**: The `.gitignore` excludes `.env`, `.env.*`, and `*.local` — environment variables are not used; API keys are stored in `localStorage` via Settings UI.

3. **`localStorage` is the only persistence** — clearing it resets the entire app state. `handleResetAllData` in `App.tsx` calls `localStorage.clear()`.

4. **Deduction undo is time-limited**: `setTimeout(() => setToastMessage(null), 5000)` and `setTimeout(() => setToastMessage(null), 3000)` control toast visibility; `canUndoDeduction` flag enables the undo button.

5. **Gemini streaming**: `generateRecipeWithGemini` iterates over `interaction` events using `for await...of`. Error handling catches `step.delta`, `error`, and `interaction.completed` event types.

6. **Onboarding data**: `ONBOARDING_STAPLES` and `ONBOARDING_EQUIPMENT` in `storage.ts` provide initial data when the user first runs the app.

7. **Dark theme is default** (`<html class="dark">` in `index.html`), though `UserSettings` has a `theme` field that's defined but not actively wired to toggle.

8. **No `docs/` directory** — the README references `docs/implementation_plan.md` and `docs/walkthrough.md` but they don't exist in the repo. Create documentation when durable project knowledge needs to be recorded.

9. **No `.github/` directory** — no CI workflows, no issue/PR templates.

10. **`dist/` is in `.gitignore`** — production builds are not committed.

---

## Project Knowledge & Documentation

The repository uses three distinct layers of information:

```text
AGENTS.md
    → How AI agents should work in this repository

docs/
    → How the project works and why it works that way

.ai/tasks/
    → What is currently being worked on
```

### `AGENTS.md`

Contains stable instructions for AI agents, including:

- development rules
- architectural boundaries
- Git workflow
- agent responsibilities
- task workflow
- documentation rules

Keep this file focused on instructions that apply broadly to agent work.

### `docs/`

Contains durable project knowledge intended for future maintainers and agents.

Use `docs/` for information such as:

- architecture
- important system behavior
- API or integration conventions
- data and persistence decisions
- authentication/security behavior
- PWA/offline behavior
- important constraints
- architectural decisions and trade-offs
- development and operational procedures

Documentation should describe the **current system and its reasoning**, not serve as a changelog.

When a significant architectural decision is introduced, prefer an ADR under:

```text
docs/decisions/
```

### `.ai/tasks/`

Contains temporary feature-specific working state.

A feature may use:

```text
.ai/tasks/<feature-name>/
├── task.md
├── design.md
├── review.md
└── test-results.md
```

These files may contain:

- the original task
- implementation requirements
- implementation plans
- temporary investigation
- hypotheses
- review findings
- debugging notes
- temporary validation results
- feature-specific progress

Do not duplicate the entire task into `docs/`.

### Knowledge Promotion

When a feature is completed, determine whether it introduced durable project knowledge.

Use this rule:

> If a maintainer working on the project six months from now would need to know it, it probably belongs in `docs/`.

Promote durable knowledge from `.ai/tasks/` into the appropriate `docs/` document.

Do not promote temporary implementation details, intermediate hypotheses, resolved review comments, or transient debugging information.

After durable knowledge has been extracted, completed task artifacts may be archived or removed according to the project's task-management workflow.

---

## AI Agent Workflow

AI agents operate as specialized roles. Repository artifacts are the primary means of communication between agents.

The normal feature workflow is:

```text
PLANNING
    ↓
DESIGN_READY
    ↓
IMPLEMENTING
    ↓
IMPLEMENTED
    ↓
REVIEWING
    ↓
APPROVED
    ↓
KNOWLEDGE_UPDATE
    ↓
COMPLETED
```

If the reviewer finds problems:

```text
REVIEWING
    ↓
CHANGES_REQUIRED
    ↓
IMPLEMENTING
    ↓
REVIEWING
```

### Planner

The Planner:

- understands the requested change
- investigates the existing codebase
- reads relevant project documentation
- produces an implementation-ready design
- identifies architectural decisions and constraints
- maintains the feature's task/design artifacts
- performs the knowledge-update phase after a feature is accepted

The Planner should plan before implementation and should not modify source code during normal planning.

### Implementer

The Implementer:

- reads the approved task and design
- implements the requested change
- follows existing project patterns
- keeps changes focused
- adds or updates validation where appropriate
- runs available validation commands
- reports actual results
- does not redesign the feature unless necessary

If implementation reveals a material conflict with the approved design or a significant architectural ambiguity, stop and ask for clarification rather than silently making a product-level decision.

### Reviewer

The Reviewer:

- independently checks the implementation against requirements
- checks the design and architecture
- checks correctness and edge cases
- checks security and regression risks
- checks available tests/validation
- does not modify the implementation by default

Review findings must be concrete and evidence-based.

### Debugger

The Debugger is used when there is:

- a failing test
- a runtime error
- a regression
- unexpected behavior
- an implementation that does not behave as expected

The Debugger should establish evidence, reproduce the problem where possible, identify the root cause, apply the smallest appropriate fix, and validate the result.

---

## General Agent Rules

### Understand Before Changing

Before making substantial changes:

1. Read this `AGENTS.md`.
2. Read relevant documentation under `docs/`.
3. Read relevant task files under `.ai/tasks/`.
4. Inspect the existing implementation and related patterns.
5. Inspect the current Git state.

Do not invent architecture or conventions that can be determined from the repository.

Prefer existing patterns over introducing new abstractions.

### Preserve Existing Behavior

Changes should be focused on the requested task.

Do not:

- refactor unrelated code
- rewrite working systems without a task requirement
- remove existing functionality unnecessarily
- introduce dependencies without justification
- change public behavior accidentally

If unrelated improvements are discovered, record them separately rather than silently including them in the current task.

### Handle Ambiguity Explicitly

If a requirement is materially ambiguous, ask the user rather than making a product or architectural decision on their behalf.

Small implementation details may be resolved using existing project conventions.

Material decisions involving behavior, architecture, data, security, or public interfaces should be surfaced explicitly.

### Do Not Hide Problems

Agents must not:

- suppress errors merely to make a command pass
- weaken or remove validation to avoid failures
- delete tests because they fail
- ignore relevant compiler/runtime errors
- claim validation passed when it was not performed
- report assumptions as confirmed facts

---

## Git Workflow

Git is used to preserve project history and provide a boundary between AI-generated changes and human-approved changes.

### Allowed Git Operations

Agents may:

- inspect `git status`
- inspect `git diff`
- inspect `git log`
- inspect relevant commit history
- inspect branches when necessary to understand repository state
- create, modify, and delete files required by their assigned task

### Git Operations Requiring Explicit User Instruction

Unless explicitly requested by the user, agents must not:

- create commits
- amend commits
- rebase
- reset
- revert commits
- discard working-tree changes
- switch branches
- create or delete branches
- merge branches
- force-push
- push to a remote
- modify tags

The human developer controls commits, branch operations, merges, and pushes.

### Protect Existing Changes

Before making substantial changes, inspect:

```bash
git status
```

Do not overwrite or discard changes that appear unrelated to the current task.

If unrelated uncommitted changes exist, treat them as user-owned unless there is clear evidence that they belong to the current task.

Never use destructive Git commands to clean up changes simply because they are unfamiliar or unrelated.

### Before Completion

Before reporting implementation work as complete:

```bash
git status
git diff
```

Review the resulting changes and verify that:

- intended files changed
- unintended files were not modified
- no debugging artifacts remain
- no secrets or credentials were introduced
- generated files are not accidentally included
- the implementation matches the task

---

## Branch Strategy

The repository currently uses:

- `main` — production
- `development` — active feature integration

Feature branches branch from and merge back into `development`.

Agents should work within the currently selected branch unless the user explicitly instructs otherwise.

Agents must not switch, create, merge, or delete branches without explicit instruction.

---

## Validation

There are currently no:

- lint scripts
- typecheck scripts
- test scripts
- automated test suite
- CI pipeline

Available validation commands are:

```bash
npm run build
npm run dev
npm run preview
```

Use the most relevant validation available for the change.

For UI changes, inspect the application behavior where possible.

For TypeScript changes, `npm run build` provides the primary available compile-time validation.

For changes involving PWA behavior, verify the production build/preview behavior when practical.

Always distinguish between:

- validation that was actually performed
- validation that could not be performed
- assumptions about behavior that were not verified

---

## Security & Secrets

Never commit secrets, API keys, credentials, tokens, or other sensitive configuration.

API keys are currently stored in browser `localStorage` through the Settings UI.

Do not introduce `.env` files or environment-based configuration unless explicitly required by the task and the project architecture is intentionally changed.

Treat any existing secret-like value found in the repository as sensitive and do not reproduce it in task artifacts, documentation, commits, or agent output.

---

## Documentation Rules

When implementation changes the behavior or architecture of the system:

1. Determine whether existing documentation is affected.
2. Update the appropriate document if durable knowledge has changed.
3. Create new documentation only when existing documents cannot appropriately contain the information.
4. Prefer updating existing documentation over creating duplicates.
5. Use ADRs for significant architectural decisions.
6. Keep documentation concise and focused on behavior, relationships, constraints, and rationale.

Do not document facts that are trivially discoverable from the source code unless they are important constraints or conventions.

---

## Git Ignore

The repository ignores:

- `node_modules/`
- `dist/`
- `.env`
- `.env.*`
- `*.local`

Do not commit generated build output or local environment files.
