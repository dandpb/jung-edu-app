# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Jung's Analytical Psychology Educational App - A React/TypeScript educational application for learning Carl Jung's analytical psychology concepts. Features interactive modules, mind maps, video integration, note-taking, and AI-powered content generation.

## Key Commands

### Development Commands
```bash
# Start development server
npm start

# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run unit tests only
npm run test:unit

# Run integration tests only  
npm run test:integration

# Run all tests without watch mode
npm run test:all

# Run tests in watch mode
npm run test:watch

# Build for production
npm run build
```

### Test Coverage Requirements
- Minimum 70% coverage for branches, functions, lines, and statements
- Coverage configuration in `jest.config.js`
- Test files located in `__tests__` directories and `.test.tsx` files

## Architecture Overview

### Core Application Structure

**Main App Flow:**
- `App.tsx` → AdminProvider → Router with protected/public routes
- User progress stored in localStorage (`jungAppProgress`)
- Admin functionality requires authentication
- Real-time progress tracking with localStorage persistence

**Key Data Models:**
- `Module` - Educational content with sections, videos, quizzes
- `UserProgress` - Completion tracking, quiz scores, notes
- `MindMapNode/Edge` - Interactive mind map components
- Schema validation in `src/schemas/` with JSON Schema and TypeScript types

### Services Architecture

The app uses a modular services architecture in `src/services/`:

**Core Services:**
- **LLM Services** (`llm/`) - AI content generation with OpenAI integration
  - `orchestrator.ts` - Main orchestration for multi-step generation
  - `provider.ts` - LLM provider abstraction (OpenAI/Mock)
  - `generators/` - Specialized content generators
- **Module Management** (`modules/`) - CRUD operations for educational modules
- **Mind Map** (`mindmap/`) - React Flow integration for concept visualization  
- **Quiz Engine** (`quiz/`) - Enhanced quiz generation and management
- **Video Integration** (`video/`) - YouTube service integration
- **Bibliography** (`bibliography/`) - Reference management and enrichment

**Data Storage:**
- All data persisted in localStorage (no backend)
- Key storage patterns:
  - `jungAppProgress` - User progress and notes
  - `jungAppEducationalModules` - Published modules
  - `jungAppDraftModules` - Draft modules during generation

### Component Architecture

**Layout:**
- `Navigation.tsx` - Main navigation with admin/user modes
- `ProtectedRoute.tsx` - Admin route protection

**Pages:**
- `Dashboard.tsx` - Main learning dashboard
- `ModulePage.tsx` - Individual module content display
- `MindMapPage.tsx` - Interactive concept visualization
- `admin/` - Admin interface for content management

**Core Components:**
- `modules/VideoPlayer.tsx` - YouTube integration
- `quiz/QuizComponent.tsx` - Interactive quiz interface
- `notes/NoteEditor.tsx` - Note-taking functionality
- `admin/AIModuleGenerator.tsx` - AI-powered content creation

### State Management

**Context Providers:**
- `AdminContext` - Admin authentication and module management
- LocalStorage-based persistence for all user data
- Real-time progress updates with automatic saving

### Testing Strategy

**Test Structure:**
- Unit tests: Individual components and utilities
- Integration tests: Page components and user flows  
- Service tests: Business logic and data operations
- Mock configurations in `__tests__/mocks/`

**Key Test Files:**
- Component tests in `components/__tests__/`
- Page tests in `pages/__tests__/`
- Service tests in `services/__tests__/`
- Utility tests in `utils/__tests__/`

## Development Guidelines

### Working with Modules
- Module data structure defined in `src/types/index.ts`
- Schema validation in `src/schemas/module.schema.ts`
- Default modules in `src/data/modules.ts`
- Use ModuleService for CRUD operations

### AI Content Generation
- Main orchestrator in `src/services/llm/orchestrator.ts`
- Provider abstraction supports OpenAI and mock implementations
- Progress tracking through EventEmitter pattern
- Draft system for long-running generation processes

### Mind Map Integration
- Built with React Flow (`reactflow` package)
- Layout algorithms in `src/services/mindmap/mindMapLayouts.ts`
- React Flow adapter for data transformation
- Interactive navigation between concepts

### Admin Interface
- Authentication required for `/admin` routes
- Module editing with real-time preview
- AI-assisted content generation
- Mind map editing capabilities

### Video Integration
- YouTube embeds via `react-youtube`
- Video metadata enrichment services
- Transcript and caption support planned

### Progress Tracking
- Automatic progress saving on user actions
- Quiz score tracking with detailed analytics
- Time spent tracking per module
- Achievement system for milestones

## Technology Stack

- **React 18** with TypeScript
- **React Router** for navigation  
- **Tailwind CSS** for styling
- **React Flow** for mind maps
- **React YouTube** for video players
- **Lucide React** for icons
- **OpenAI** for AI content generation
- **Jest & React Testing Library** for testing
- **AJV** for JSON schema validation

## Common Development Tasks

### Adding New Modules
1. Define module in `src/data/modules.ts` following the Module interface
2. Add corresponding mind map nodes in `src/data/mindmap.ts`
3. Update navigation if needed
4. Add tests for new content

### Modifying Quiz System
1. Update Quiz/Question interfaces in `src/types/index.ts`
2. Modify QuizComponent for UI changes
3. Update quiz generation in `src/services/quiz/`
4. Test with mock data in `__tests__/mocks/`

### Extending AI Services
1. Add new generators in `src/services/llm/generators/`
2. Update orchestrator to include new generation steps
3. Add progress tracking stages
4. Create corresponding tests

### Testing Changes
- Always run tests before committing: `npm run test:coverage`
- Maintain 70%+ coverage across all metrics
- Add integration tests for new user flows
- Mock external services (OpenAI, YouTube) in tests