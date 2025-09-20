# Repository Guidelines

## Project Structure & Modules
- `src/`: React + TypeScript app (components, pages, hooks, services, utils). Example: `src/pages/Dashboard.tsx`, `src/components/quiz/`.
- `backend/`: Express-based services and workflow engine (TypeScript). Example: `backend/api/workflow/` routes, `backend/src/services/workflow/`.
- `public/`: Static assets served by the app.
- `tests/`: Additional unit/integration/e2e suites and helpers. Example: `tests/e2e/`, `tests/unit/`.
- `configs/, config/, docker/, k8s/`: Ops and environment configs.
- `scripts/`: CI/local utilities (coverage, deployment, validation).

## Build, Test, and Dev
- `npm start`: Run CRA dev server at `http://localhost:3000`.
- `npm run build`: Production build to `build/`.
- `npm test`: Jest tests (unit/integration) in watch mode.
- `npm run test:coverage`: Coverage report (watch off) and thresholds validated via `scripts/coverage-validation.js`.
- `npm run test:e2e`: Playwright E2E tests. Run `npm run test:e2e:install` once to install browsers.
- `npm run test:integration`: Repository integration flow (see `scripts/run-integration-tests.js`).

## Coding Style & Naming
- Language: TypeScript, React 18, Tailwind CSS.
- Linting: CRA ESLint defaults (`react-app`, `react-app/jest`).
- Indentation: 2 spaces; semicolons required; single quotes preferred.
- Components/Pages: PascalCase (e.g., `ModulePage.tsx`).
- Hooks/Utils/Functions: camelCase (e.g., `useProgress.ts`, `formatScore.ts`).
- Tests: colocate under `__tests__` or use `*.test.ts(x)`.

## Testing Guidelines
- Frameworks: Jest + React Testing Library for unit/integration; Playwright for E2E.
- Coverage thresholds: Global ≥90%; services ≥95%; components ≥85%; utils ≥90% (enforced by `scripts/coverage-validation.js`). Generate via `npm run test:coverage` or validate with `npm run test:coverage-report`.
- Test names: Describe behavior (“renders module list”, “handles quiz scoring”). Place UI tests in `src/**/__tests__/` and cross-cutting suites in `tests/`.

## Commit & Pull Requests
- Commits: Imperative, concise, scoped (e.g., `fix tests`, `feat: quiz scoring`). Group related changes; avoid noisy reformat-only commits.
- PRs: Clear description, rationale, and scope; link issues; include screenshots/GIFs for UI; note env changes; add/adjust tests; update docs when applicable.

## Security & Configuration
- Env files: Use `.env.example` as reference. Never commit real secrets (`.env`, `.env.production`, `.env.test` are gitignored).
- Supabase/OpenAI keys: Load from env; mock in tests (`msw` available).
- Health/Deploy: See `netlify.toml`, `scripts/netlify-deploy.sh`, and `npm run validate:deployment`.
