# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Jung's Analytical Psychology Educational App - A React/TypeScript web application for learning Carl Jung's analytical psychology concepts. The app features module-based learning, interactive mind maps, video integration, quizzes, note-taking, and progress tracking.

## Common Development Commands

### Build and Development
```bash
# Install dependencies
npm install

# Start development server (http://localhost:3000)
npm start

# Build for production
npm run build

# Serve production build
npm run serve
```

### Testing Commands
```bash
# Run unit tests (skip integration tests)
npm test

# Run tests with coverage report and validation
npm run test:coverage-report

# Run specific test categories
npm run test:components     # Component tests only
npm run test:utils         # Utility tests only
npm run test:critical      # Critical service tests

# Run integration tests
npm run test:integration
npm run test:integration:real  # With real API calls

# Run tests in watch mode
npm run test:watch

# Run a single test file
npm test src/components/__tests__/Navigation.test.tsx
```

### Supabase and Deployment
```bash
# Deploy to Supabase
npm run test:deployment  # Validate before deployment
./scripts/deploy-supabase.sh

# Deploy via different methods
./scripts/deploy-via-dashboard.sh
./scripts/deploy-direct.sh
./scripts/deploy-remote-only.sh

# Health monitoring
npm run monitor:health
npm run validate:health
```

## Architecture Overview

### Tech Stack
- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **State Management**: React Context (AuthContext, AdminContext)
- **Database**: Supabase (PostgreSQL with RLS)
- **Authentication**: Supabase Auth with JWT
- **Testing**: Jest + React Testing Library
- **LLM Integration**: OpenAI API for content generation

### Key Architecture Patterns

1. **Context-Based Architecture**
   - `AuthContext`: Handles authentication state and user management
   - `AdminContext`: Manages admin-specific functionality and module data
   - Contexts wrap the entire app in `App.tsx`

2. **Protected Routes Pattern**
   - `ProtectedRoute` component handles authentication checks
   - Role-based access control (UserRole enum)
   - Public routes redirect authenticated users

3. **Service Layer Architecture**
   - Services organized by domain (auth, llm, quiz, modules, etc.)
   - Each service has dedicated types and test files
   - Mock providers for testing (see `test-utils/mocks/`)

4. **Module System**
   - Modules stored as JSON with comprehensive schema validation
   - Dynamic content generation via LLM integration
   - Progress tracking stored in localStorage and Supabase

### Directory Structure Highlights

```
src/
├── components/       # Reusable UI components
│   ├── auth/        # Authentication components
│   ├── admin/       # Admin-specific components
│   ├── quiz/        # Quiz functionality
│   └── mindmap/     # Mind map visualizations
├── contexts/        # React contexts for state management
├── pages/           # Route components
├── services/        # Business logic and API integration
│   ├── auth/        # Authentication services
│   ├── llm/         # LLM integration for content generation
│   └── supabase/    # Database integration
├── types/           # TypeScript type definitions
└── test-utils/      # Testing utilities and mocks
```

## Database Architecture

The app uses Supabase with PostgreSQL. Key tables:
- `users`: Extended auth.users with roles
- `modules`: Educational content storage
- `quizzes`: Quiz questions and configurations
- `user_progress`: Progress tracking
- `notes`: User notes per module

Row Level Security (RLS) is enabled on all tables.

## LLM Integration Architecture

The app integrates with OpenAI for dynamic content generation:

1. **Provider Pattern**: Abstract base class with implementations for different providers
2. **Generator System**: Specialized generators for content, quizzes, videos, bibliography
3. **Orchestrator**: Coordinates multiple generators for complete module generation
4. **Caching Layer**: Reduces API calls and improves performance

See `src/services/llm/API_SERVICE_STRUCTURE.md` for detailed documentation.

## Testing Strategy

### Test Coverage Requirements
- Global: 70% minimum for all metrics
- Services, Components, Utils: 70% minimum
- Coverage validation runs automatically

### Test Organization
- Unit tests: Alongside source files in `__tests__` folders
- Integration tests: In `src/__tests__/integration/`
- Test utilities: In `src/test-utils/`
- Mocks: MSW for API mocking, custom mocks for modules

### Key Testing Patterns
```typescript
// Use test builders for complex objects
const module = moduleBuilder()
  .withTitle('Test Module')
  .withDifficulty('intermediate')
  .build();

// Mock LLM provider for consistent tests
jest.mock('../services/llm/provider');

// Use MSW for API mocking
server.use(
  rest.get('/api/modules', (req, res, ctx) => {
    return res(ctx.json({ modules: [] }));
  })
);
```

## Authentication Flow

1. User registers/logs in via Supabase Auth
2. JWT stored in session
3. AuthContext manages user state
4. ProtectedRoute components check authentication
5. Role-based access control for admin features

## Key Features Implementation

### Module Generation
- LLM-powered content generation
- Schema validation for all generated content
- Progress tracking with visual indicators
- Multi-language support structure

### Mind Maps
- React Flow for interactive visualizations
- Dynamic node generation based on modules
- Click-to-navigate functionality
- Multiple layout options

### Quiz System
- Automatic quiz generation from content
- Multiple question types
- Instant feedback with explanations
- Score tracking and progress integration

## Environment Variables

Required environment variables:
```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_OPENAI_API_KEY=your_openai_key (optional for AI features)
```

## Common Development Tasks

### Adding a New Module
1. Use the Admin panel (`/admin/modules`)
2. Or programmatically via `moduleGenerator.generateModule()`
3. Modules are validated against schema before saving

### Running Integration Tests
```bash
# Set up environment
export USE_REAL_API=false  # Use mocks by default

# Run integration tests
npm run test:integration

# With real API (requires credentials)
USE_REAL_API=true npm run test:integration:real
```

### Debugging Failed Tests
1. Check if it's an integration test (may need `SKIP_INTEGRATION=true`)
2. Look for async issues (use `waitFor` from testing-library)
3. Check mock implementations in `test-utils/mocks/`
4. Verify test data builders are creating valid data

### Working with Supabase
1. Schema changes go in `database/schema.sql`
2. RLS policies in `database/rls_policies.sql`
3. Run `./scripts/deploy-supabase.sh` to deploy
4. Generated types in `src/types/database.generated.ts`

## Performance Considerations

- Module content is cached in localStorage
- LLM responses are cached to reduce API calls
- Lazy loading for heavy components (mind maps, videos)
- Debounced search functionality
- Optimistic UI updates for better UX