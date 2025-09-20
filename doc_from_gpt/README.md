# Jung Analytical Psychology Education Platform — Comprehensive Documentation

## 1. Platform Overview
- **Purpose**: Full-stack learning platform focused on Carl Jung's analytical psychology, delivering modules, quizzes, multimedia resources, and AI-assisted content generation.
- **Primary Stacks**:
  - Frontend: React 18 + TypeScript, Tailwind CSS, React Router, localStorage persistence, optional Supabase integration.
  - Backend: Express + TypeScript workflow APIs, observability services, predictive monitoring, self-healing orchestration, and supplementary Python ML tooling.
  - AI Services: Pluggable LLM orchestration (OpenAI-compatible) powering adaptive module, quiz, video, and bibliography generation pipelines.
- **Key Principles**: Offline-first storage for learners, modular service architecture, comprehensive testing, and automated operational safeguards (monitoring + recovery).

## 2. Repository Topology
| Path | Description |
| --- | --- |
| `src/` | React application (components, pages, services, hooks, schemas, utilities, styles, tests). |
| `backend/` | Express workflow API, monitoring, self-healing, ML orchestration, TypeScript services. |
| `tests/` | Multi-layer automated testing (unit, integration, E2E, performance, chaos, recovery). |
| `database/` | SQL migrations, schema definitions, RLS policies, prompt templates. |
| `docs/` | Existing manuals, guides, and audit reports. |
| `configs/`, `config/` | Environment and deployment configuration collections. |
| `docker/`, `k8s/` | Container and Kubernetes manifests for deployment. |
| `scripts/` | CI automation, deployment helpers, coverage validation, test runners. |
| `supabase/` | Supabase client configuration and helper scripts. |
| `public/` | CRA static assets and base HTML. |
| `memory/`, `coordination/`, `claude-flow/` | AI agent orchestration assets and auxiliary tooling. |
| `docs_from_gemini/` | Prior auto-generated documentation set. |

## 3. Frontend Application (`src/`)
### 3.1 App Shell & Routing
- `src/App.tsx` wires React Router routes, gating access through `AuthProvider` + `AdminProvider`, and applies Tailwind layout.
- Protected routes leverage `src/components/auth/ProtectedRoute.tsx`, `AdminProtectedRoute`, and public wrappers for login/registration flows.
- Admin-only surfaces: `/admin` suite (dashboard, modules, resources, prompts), AI demos, monitoring dashboards, and test tools.

### 3.2 State & Contexts
- `src/contexts/AuthContext.tsx`: Comprehensive auth/session lifecycle with JWT handling, token refresh, role/permission enforcement, and localStorage fallbacks for test-mode users.
- `src/contexts/AdminContext.tsx`: Manages admin-facing module/resource catalogs, bridging module services and UI.
- `src/contexts/I18nContext.tsx`, `LanguageContext.tsx`: Provide translation resources and language preferences.

### 3.3 Components & Pages
- Components grouped by domain (`components/quiz`, `components/modules`, `components/monitoring`, etc.) plus shared UI (`components/common`).
- Page taxonomy under `src/pages/`: learner dashboards, module views, notes, search, bibliography, health checks, plus admin panels and diagnostic screens (YouTube tests, AI demos, monitoring dashboards).
- Visualization helpers in `components/visualizations`, gamification widgets in `components/gamification`, and media players in `components/multimedia` / `components/media`.

### 3.4 Hooks & Utilities
- Custom hooks under `src/hooks/` (e.g., progress tracking, search helpers).
- Utilities in `src/utils/`: localStorage helpers, formatting, logging, feature flags, error boundaries.
- `src/config/` centralizes client-side configuration defaults (API hosts, rate limits, feature toggles).

### 3.5 Services Layer
- **Auth (`src/services/auth/`)**: Password hashing, JWT issuance/rotation, session storage, permission matrices, and token persistence utilities.
- **Modules (`src/services/modules/`)**: CRUD, drafts, search, and validation for `EducationalModule` records (localStorage-backed with schema validation in `src/schemas/module.*`).
- **Module Generation (`src/services/moduleGeneration/`)**: Orchestrates AI-assisted module creation, integrating analyzer pipelines, quality checks, and caching.
- **LLM Orchestration (`src/services/llm/`)**: Provider abstraction (`provider.ts`, `providers/`), config + rate limiting, generators for content/quiz/video/bibliography, and `ModuleGenerationOrchestrator` that coordinates both simulated and real services.
- **Quiz (`src/services/quiz/`)**: Template catalog, adaptive quiz engine, enhancer pipeline, validation, and CLI/test utilities documented in `src/services/quiz/README.md`.
- **Video (`src/services/video/`)**: `youtubeService.ts` for API communication, `videoEnricher.ts` for metadata enrichment, optional AI-driven enhancements.
- **Bibliography (`src/services/bibliography/`)**: Aggregates academic sources, duplicates detection, and AI enrichment.
- **Workflow (`src/services/workflow/`)**: Client-side mirror of backend workflow engine supporting template loading, state management, plugins, and educational workflow definitions.
- **Resource Pipeline (`src/services/resourcePipeline/`)**: End-to-end pipeline builder that links module generation, enrichment, monitoring hooks, and analytics.
- **Adaptive/Alerting/Health (`src/services/adaptive`, `src/services/alerting`, `src/services/health`)**: Runtime services for learner personalization and UI alerts.
- **Sockets & Realtime (`src/services/socket/`)**: Socket.IO client wrappers for live updates.
- **Supabase (`src/services/supabase/`)**: Thin client around Supabase auth APIs for optional cloud persistence.

### 3.6 Data, Schemas & Types
- Static pedagogy content in `src/data/modules.ts` and workflow templates in `src/data/workflowTemplates.ts`.
- Rich schema definitions under `src/schemas/` (module, quiz, workflow, telemetry) using Zod/AJV-compatible structures and validators.
- Shared TypeScript models in `src/types/` (auth, modules, quizzes, workflows, monitoring, sockets, AI artifacts).

### 3.7 Styling & Assets
- Tailwind configuration via `tailwind.config.js` and base styles in `src/index.css` / `src/styles/` (design tokens, typography, layout helpers).
- `public/` hosts base HTML template, icons, and manifest assets.

### 3.8 Frontend Testing
- Component/page/unit tests colocated under `src/**/__tests__/` with Jest + React Testing Library (`setupTests.ts`, `jest-setup.js`).
- Mocking infrastructure in `src/__mocks__/` and `src/test-utils/` for consistent environment setup.

## 4. Backend Platform (`backend/`)
### 4.1 Express Workflow API (`backend/api/workflow/`)
- `WorkflowRoutes.ts` registers REST endpoints for workflow CRUD, execution, monitoring, and analytics.
- `WorkflowController.ts` implements in-memory demo storage, pagination, filtering, execution lifecycle management, and structured API responses.
- Middleware (`WorkflowMiddleware.ts`) handles validation, auth context injection, request tracing; validation schemas align with `ValidationSchemas.ts`.
- `openapi.yaml` documents the full API surface (health, workflows, executions, metrics, logs) with bearer/auth key security schemes.

### 4.2 Workflow Engine Core (`backend/src/services/workflow/`)
- `WorkflowEngine.ts`: Event-driven state machine with plugin registry, execution strategies (`ExecutionStrategy.ts`), concurrency limits, state history, and error handling.
- `WorkflowNode.ts`, `WorkflowStateManager.ts`, `WorkflowTemplateEngine.ts/Manager.ts`: Define node execution lifecycle, persistence, templating, and dynamic workflow generation.
- Plugin support under `plugins/` with context-aware hooks and retry policies; utilities for validation, transitions, and metrics in `utils/`.
- Types consolidated in `backend/src/types/workflow.ts` for reuse across API and services.

### 4.3 Monitoring & Observability (`backend/monitoring/`)
- Core health monitoring (`core/health-monitor.ts`) runs periodic CPU/memory/disk/network checks, stores history, and emits severity-based events.
- Metrics collectors (`metrics/`), storage adapters (`storage/`), anomaly detectors, alert routing, and dashboard helpers provide complete observability tooling.
- Predictive analytics modules (`predictive/`) integrate with ML forecasts and escalate warnings pre-failure.

### 4.4 Self-Healing & Recovery (`backend/self-healing/`, `backend/recovery/`)
- `self-healing/core/self-healing-orchestrator.ts` orchestrates monitoring signals, recovery managers, predictive analytics, and rollback workflows.
- Recovery strategies (rollback, blue/green activation, canary) and pattern libraries live in `recovery/` & `self-healing/recovery/`.
- Health monitors, fault detectors, and analytics share event buses to automate remediation.

### 4.5 Integration & ML Tooling
- `backend/integration/`: Bridges backend services with external systems/test harnesses.
- `backend/ml/`: Python ecosystem (anomaly detection, auto tuning, predictive analytics, self-healing orchestrator) with modular pipelines under `training/`, `monitoring/`, and `models/`.
- `backend/WorkflowService.ts`: Entry point linking API, engine, and observers for deployment.

### 4.6 Backend Utilities & Config
- Shared configs in `backend/src/config/` (service defaults, logging, storage adapters).
- Utility helpers (`backend/src/utils/`) and typed interfaces (`backend/src/types/`) ensure consistency between frontend abstractions and backend execution.

## 5. AI & Intelligent Content Generation
- `src/services/llm/` centralizes provider configuration (`config.ts`), prompt adapters, and generator classes (content, quiz, video, bibliography).
- Providers include real (`OpenAIProvider`) and mock implementations, with rate limiting, retry policies, and progress events for UI feedback.
- `ModuleGenerationOrchestrator` coordinates staged generation (content → quiz → media → bibliography) and can swap between AI-generated outputs and deterministic services (`EnhancedQuizGenerator`, `VideoEnricher`, `BibliographyEnricher`).
- `src/services/resourcePipeline/` connects generation outputs to monitoring, caching, and enrichment hooks, enabling end-to-end module publishing workflows.
- Supplementary demos/tests inside `src/pages/AIDemo.tsx`, `src/services/moduleGeneration/example-usage.ts`, and `src/services/quiz/testQuizQuality.ts` illustrate integration patterns.

## 6. Data & Persistence Strategy
- Client-side persistence: localStorage-backed module, progress, user/session storage with validation layers (`ModuleService`, `AuthService`, `NoteService`).
- Optional cloud persistence via Supabase (`supabase/`, `src/services/supabase/authService.ts`).
- SQL schemas and migrations in `database/` for prompt templates, workflow tables, security (row-level security policies), and deployment-ready structures.
- Workflow state storage abstractions in backend `StateStore.ts` (memory implementation, extensible to Redis/DB).

## 7. Testing & Quality Assurance (`tests/` + scripts)
- Unified test infrastructure documented in `tests/README.md` with configuration (`tests/config/unified-test.config.ts`), database/test data managers, and reporting systems.
- Suites cover: unit (`src/**/__tests__`, `tests/unit/`), integration (`tests/integration/`), API contract (`tests/api/`), E2E Playwright (`tests/e2e/`), performance (`tests/performance/`), chaos/self-healing (`tests/chaos-engineering/`, `tests/self-healing/`), monitoring, and ML validation.
- Jest configs: `jest.config.js` (frontend), `jest.integration.config.js`, `tests/jest.config.backend.js`, plus specialized configs in `tests/unit/jest.config.js`.
- Automation helpers in `scripts/` (`run-integration-tests.js`, `run-comprehensive-test-validation.sh`, `coverage-validation.js`). Coverage thresholds enforced by `scripts/coverage-validation.js`.

## 8. Operations, Monitoring & Reliability
- Health monitoring entrypoints: `src/pages/HealthCheck.tsx`, backend health route `/health`, and CLI monitors (`scripts/health-monitor.sh`).
- Predictive monitoring dashboards under `src/pages/MonitoringDashboard.tsx` backed by services in `src/services/monitoring/` and backend predictive modules.
- Self-healing pipelines integrate anomaly detection, predictive analytics, and recovery orchestration to maintain uptime with minimal manual intervention.

## 9. DevOps, Deployment & Environment Configuration
- Deployment scripts: `scripts/deploy*.sh`, `scripts/netlify-deploy.sh`, Netlify configuration (`netlify.toml`, `scripts/netlify-deploy.sh`).
- Docker & Kubernetes: `docker-compose.workflow.yml`, manifests in `docker/` and `k8s/` for containerized environments.
- Environment templates: `.env.example` (refer to README instructions), configs under `config/` & `configs/` for multi-environment overrides.
- Validation pipelines: `scripts/deployment-validation.sh`, `npm run validate:deployment`, `scripts/run-all-tests.sh` for pre-release checks.

## 10. Development Workflow
- Install dependencies with `npm install`, run CRA dev server via `npm start`, execute backend services separately as needed.
- Testing commands available in `package.json` (`test`, `test:coverage`, `test:integration`, `test:e2e`, etc.), plus backend-specific runners in `tests/` package.
- `scripts/setup-dev.sh` bootstraps local environment; `run-tests.sh` and `run-tests.*` convenience scripts aid CI orchestration.
- Code style enforced by CRA ESLint defaults (React + Jest), TypeScript configs in `tsconfig*.json`, Tailwind for utility-first styling.

## 11. Extensibility & Customization Guidelines
- **Adding Modules**: Extend `src/data/modules.ts` for static content or use `ModuleGenerationOrchestrator` + `ModuleService` to persist AI-generated modules; validate against `src/schemas/module.schema.ts` before persistence.
- **Enhancing Quizzes**: Modify templates in `src/services/quiz/quizTemplates.ts` and enrichment rules in `quizEnhancer.ts`; update validator schemas as needed.
- **Custom Workflows**: Define templates in `src/data/workflowTemplates.ts` or backend equivalents, register plugins under `src/services/workflow/plugins/` (frontend) and `backend/src/services/workflow/plugins/` (backend).
- **Monitoring Hooks**: Register new health checks via `backend/monitoring/core/health-monitor.ts` or frontend monitoring services; connect to alerts through `backend/monitoring/alerts/`.
- **AI Providers**: Implement additional providers in `src/services/llm/providers/`, configure via `ConfigManager`, and plug into orchestrator without altering consumers.

## 12. Reference & Supporting Assets
- Existing manuals (`docs/*.md`) cover admin operations, deployment, testing, and architecture deep dives—use alongside this document.
- `docs_from_gemini/` holds prior auto-generated documentation for comparison.
- Memory/coordination directories supply AI agent state machines used by auxiliary tooling (Claude/LLM automation), useful when integrating autonomous workflows.

---
**Next Steps for New Contributors**
1. Review `README.md` for setup, then run `npm start` and explore key pages (Dashboard, Module view, Admin panels).
2. Examine `src/services/llm/orchestrator.ts` and `backend/src/services/workflow/WorkflowEngine.ts` to understand AI + workflow lifecycles.
3. Execute `npm run test:coverage` followed by `npm run test:coverage-report` to validate local environment and familiarize with testing thresholds.
4. For backend experiments, use `backend/api/workflow/openapi.yaml` with an API client (e.g., Postman) to explore endpoints.
