# JaqEdu Technical Documentation
## Jung's Analytical Psychology Educational Platform

---

# Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Overview](#system-overview)
3. [Architecture Documentation](#architecture-documentation)
4. [Code Structure](#code-structure)
5. [API Documentation](#api-documentation)
6. [Dependency Analysis](#dependency-analysis)
7. [Installation & Setup](#installation--setup)
8. [Testing Strategy](#testing-strategy)
9. [Security Considerations](#security-considerations)
10. [Performance Optimization](#performance-optimization)
11. [Glossary](#glossary)
12. [Appendices](#appendices)

---

# Executive Summary

JaqEdu is a comprehensive educational platform designed to teach Carl Jung's analytical psychology through interactive modules, mind maps, quizzes, and multimedia content. Built with React 18.2 and TypeScript 4.9.5, the platform integrates AI capabilities through OpenAI's GPT-4o-mini model for dynamic content generation.

## Key Features
- **6 Educational Modules**: Covering Jung's foundational concepts from introduction to dream analysis
- **AI-Powered Content Generation**: Dynamic module creation, quiz generation, and concept mapping
- **Interactive Mind Maps**: Visual learning through React Flow with Jungian archetype categorization
- **Comprehensive Assessment**: Adaptive quizzing with multiple question types and study guides
- **Rich Media Integration**: YouTube videos, curated bibliography, and multimedia resources
- **Progress Tracking**: Student learning analytics with achievement systems
- **Note-Taking System**: Persistent personal notes with search functionality

## Technology Highlights
- **Frontend**: React 18.2 with TypeScript for type safety
- **Styling**: Tailwind CSS with custom animations and responsive design
- **State Management**: React Context API with LocalStorage persistence
- **AI Integration**: OpenAI API with fallback mock providers
- **Visualization**: React Flow for interactive mind maps
- **Testing**: 70%+ coverage with Jest and React Testing Library

## Target Audience
- Psychology students (beginner to advanced)
- Mental health professionals
- Jung enthusiasts and researchers
- Educational institutions

---

# System Overview

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Frontend (React SPA)                         │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  ┌───────────┐ │
│  │   Pages     │  │  Components  │  │  Contexts  │  │   Hooks   │ │
│  │  Dashboard  │  │  Navigation  │  │AdminContext│  │useModule  │ │
│  │  Modules    │  │  Quiz        │  │            │  │Generator  │ │
│  │  MindMap    │  │  VideoPlayer │  │            │  │           │ │
│  │  Admin      │  │  NoteEditor  │  │            │  │           │ │
│  └─────────────┘  └──────────────┘  └────────────┘  └───────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│                         Service Layer                                │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  ┌───────────┐ │
│  │   Module    │  │     LLM      │  │  YouTube   │  │  MindMap  │ │
│  │  Service    │  │  Provider    │  │  Service   │  │ Generator │ │
│  │             │  │  (OpenAI)    │  │            │  │           │ │
│  └─────────────┘  └──────────────┘  └────────────┘  └───────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│                      Data Persistence                                │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    LocalStorage                              │   │
│  │  - User Progress    - Modules    - Mind Maps    - Notes     │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow Architecture

### User Learning Flow
```
User Action → Component → Hook/Context → Service → LocalStorage
                ↓                          ↓
              Update UI ← State Change ← Data Response
```

### Admin Content Management Flow
```
Admin Login → AdminContext → Session Token → LocalStorage
     ↓                                           ↓
Admin Panel → Module Editor → LLM Service → Generated Content
     ↓                                           ↓
Save Changes → ModuleService → LocalStorage → Update UI
```

## Core Technologies

### Frontend Stack
- **React 18.2.0**: Component-based UI framework
- **TypeScript 4.9.5**: Static typing and enhanced DX
- **React Router 6.21.0**: Client-side routing
- **Tailwind CSS 3.4.0**: Utility-first styling
- **React Flow 11.11.4**: Interactive diagrams

### AI & Content Generation
- **OpenAI API 5.10.1**: GPT-4o-mini for content generation
- **Custom LLM Orchestration**: Abstraction layer for multiple providers
- **Fallback System**: Mock providers for offline development

### State & Persistence
- **React Context API**: Global state management
- **LocalStorage**: Client-side data persistence
- **Session Management**: Token-based admin authentication

---

# Architecture Documentation

## Architecture Pattern

The application follows a **Component-Based Architecture** with elements of:

- **MVC (Model-View-Controller)**: Separation of data (types), views (components), and business logic (services)
- **Context Pattern**: For global state management (AdminContext)
- **Service Layer Pattern**: Abstraction of external integrations and business logic
- **Repository Pattern**: Data access through service classes (ModuleService)

## Service Layer Architecture

### LLM Orchestration Services
The foundation layer managing AI-powered content generation with:
- Multi-provider support (OpenAI, Mock, extensible)
- Automatic retry with exponential backoff
- Token usage tracking and optimization
- Progress event emission
- Structured JSON response parsing

### Module Generation Services
High-level service creating complete educational modules:
- One-call module generation
- Automatic difficulty analysis
- Component orchestration (videos, quiz, bibliography, mind map)
- Metadata enrichment

### Specialized Services

#### Quiz Generation
- Template-based question creation
- Multiple question types (MC, T/F, Essay, Matching)
- Adaptive difficulty based on performance
- Bloom's taxonomy alignment
- Study guide generation

#### Video Enrichment
- YouTube API integration
- Educational value scoring
- Difficulty assessment
- Learning outcome extraction

#### Bibliography Management
- 500+ curated Jung references
- Multi-format citations (APA, MLA, Chicago)
- Reading path generation
- Concept-based search

#### Mind Map Generation
- Automatic concept extraction
- Jungian archetype categorization
- Multiple layout algorithms
- React Flow integration

## Security Architecture

### Authentication & Authorization
- Session token-based authentication
- Password hashing with salt
- Role-based access control (admin/user)
- Protected route components

### Data Protection
- No sensitive data in LocalStorage
- Environment variable API key management
- Browser-side API call safety flags
- XSS prevention in generated content

### API Security
- Rate limiting (60 req/min, 90k tokens/min)
- Request validation and sanitization
- Error message sanitization
- Secure token generation

## Deployment Architecture

### Client-Side Application
```
Build Process:
Source Code → TypeScript Compilation → Webpack Bundle → Static Assets
                                            ↓
                                    CDN Distribution
```

### Environment Configuration
- Development: `.env.local`
- Production: Environment variables
- API Keys: Secure environment injection

### Scalability Considerations
- Static hosting capability (Netlify, Vercel)
- CDN distribution for assets
- LocalStorage limitations (~10MB)
- Future migration path to backend API

---

# Code Structure

## Directory Organization

```
jung-edu-app/
├── src/                      # Source code directory
│   ├── components/          # React components
│   │   ├── admin/          # Admin-specific components
│   │   ├── common/         # Shared components
│   │   ├── media/          # Media-related components
│   │   ├── mindmap/        # Mind map components
│   │   ├── modules/        # Module-specific components
│   │   ├── notes/          # Note-taking components
│   │   ├── progress/       # Progress tracking components
│   │   └── quiz/           # Quiz components
│   ├── contexts/           # React contexts
│   ├── data/               # Static data and configurations
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Route components
│   │   └── admin/          # Admin panel pages
│   ├── schemas/            # Data validation schemas
│   ├── services/           # Business logic and integrations
│   │   ├── bibliography/   # Bibliography management
│   │   ├── llm/           # AI/LLM integration
│   │   │   ├── generators/ # Content generators
│   │   │   └── providers/  # LLM provider implementations
│   │   ├── mindmap/       # Mind map generation
│   │   ├── modules/       # Module management
│   │   ├── quiz/          # Quiz generation
│   │   └── video/         # Video enrichment
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── public/                 # Static assets
├── docs/                   # Documentation
├── coverage/               # Test coverage reports
└── build/                  # Production build output
```

## Type System Architecture

### Dual Type System Approach

#### Domain Types (`src/types/index.ts`)
Simple, focused interfaces for UI components:
```typescript
interface Module {
  id: string;
  title: string;
  description: string;
  icon: string;
  content: ModuleContent;
  prerequisites?: string[];
  estimatedTime: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}
```

#### Schema Types (`src/types/schema.ts`)
Comprehensive types with BaseEntity pattern:
```typescript
interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Quiz extends BaseEntity {
  moduleId: string;
  title: string;
  questions: QuizQuestion[];
  metadata?: {
    enhanced?: boolean;
    userLevel?: 'beginner' | 'intermediate' | 'advanced';
  };
}
```

## Component Architecture

### Component Patterns

#### Functional Components with TypeScript
```typescript
interface ModuleEditorProps {
  module: Module;
  modules: Module[];
  onSave: (module: Module) => void;
  onCancel: () => void;
}

const ModuleEditor: React.FC<ModuleEditorProps> = ({ module, modules, onSave, onCancel }) => {
  // Component logic
};
```

#### State Management Patterns
- Local state with `useState`
- Context API for global state (`AdminContext`)
- LocalStorage for persistence
- Optimistic UI updates

### Service Patterns

#### Generator Pattern
```typescript
interface Generator<T> {
  generate(input: GeneratorInput): Promise<T>;
  validate(output: T): ValidationResult;
}
```

#### Enricher Pattern
```typescript
class BibliographyEnricher {
  enrich(bibliography: Bibliography[]): EnhancedBibliography[];
}
```

#### Orchestrator Pattern
```typescript
class LLMOrchestrator {
  async generateModule(config: ModuleConfig): Promise<Module> {
    // Coordinates content, quiz, video generators
  }
}
```

---

# API Documentation

## API Overview

The jaqEdu platform provides a comprehensive set of APIs organized into service layers:

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Application                      │
├─────────────────────────────────────────────────────────────┤
│                    Unified Module Generator                   │
│                 (High-level orchestration)                    │
├─────────────────────────┬─────────────────────────────────────┤
│   Module Generation      │        Specialized Services         │
│   Orchestrator          │  • Quiz Generator                   │
│   (Core coordination)    │  • Video Enricher                  │
│                         │  • Bibliography Enricher            │
│                         │  • Mind Map Generator               │
├─────────────────────────┴─────────────────────────────────────┤
│                      LLM Provider Layer                        │
│              (OpenAI / Mock / Other Providers)                 │
└─────────────────────────────────────────────────────────────┘
```

## Core API Services

### ModuleGenerationOrchestrator

The main orchestrator coordinating all content generation services.

```typescript
class ModuleGenerationOrchestrator extends EventEmitter {
  async generateModule(options: GenerationOptions): Promise<GenerationResult>
}
```

**GenerationOptions:**
```typescript
interface GenerationOptions {
  topic: string;                    // The main topic of the module
  objectives: string[];             // Learning objectives
  targetAudience: string;           // Target audience description
  duration: number;                 // Duration in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  includeVideos?: boolean;          // Include video resources
  includeBibliography?: boolean;    // Include bibliography
  includeMindMap?: boolean;         // Include concept mind map
  quizQuestions?: number;           // Number of quiz questions
  videoCount?: number;              // Maximum videos to include
  bibliographyCount?: number;       // Maximum bibliography items
  useRealServices?: boolean;        // Use real services vs LLM-only
}
```

### EnhancedQuizGenerator

Advanced quiz generation with multiple question types and enhancements.

```typescript
class EnhancedQuizGenerator {
  async generateEnhancedQuiz(
    moduleId: string,
    topic: string,
    content: string,
    learningObjectives: string[],
    numberOfQuestions: number,
    options?: {
      useTemplates?: boolean;
      enhanceQuestions?: boolean;
      adaptiveDifficulty?: boolean;
      includeEssayQuestions?: boolean;
      contextualizeQuestions?: boolean;
      userLevel?: 'beginner' | 'intermediate' | 'advanced';
    }
  ): Promise<Quiz>
}
```

### VideoEnricher

Enriches educational content with relevant video resources.

```typescript
class VideoEnricher {
  async searchVideos(
    topic: string,
    options?: EnrichmentOptions
  ): Promise<VideoMetadata[]>
}
```

### BibliographyEnricher

Enriches content with academic references and reading materials.

```typescript
class BibliographyEnricher {
  async searchBibliography(options: {
    concepts: string[];
    maxResults?: number;
    yearRange?: { start: number; end: number };
    types?: ReferenceType[];
  }): Promise<EnrichedReference[]>

  async generateReadingPath(
    topic: string,
    userLevel: 'beginner' | 'intermediate' | 'advanced'
  ): Promise<ReadingPath>
}
```

### MindMapGenerator

Generates mind maps from educational content.

```typescript
class MindMapGenerator {
  async generateFromModule(module: Module): Promise<MindMapData>
  
  async generateFromConcepts(
    centralConcept: string,
    relatedConcepts: string[],
    depth?: number
  ): Promise<MindMapData>
}
```

## API Usage Examples

### Complete Module Generation
```typescript
const orchestrator = new ModuleGenerationOrchestrator();

orchestrator.on('progress', (progress) => {
  console.log(`${progress.stage}: ${progress.progress}% - ${progress.message}`);
});

const result = await orchestrator.generateModule({
  topic: 'The Shadow Archetype',
  objectives: [
    'Understand the concept of the Shadow',
    'Identify personal Shadow aspects',
    'Learn integration techniques'
  ],
  targetAudience: 'Psychology students',
  duration: 90,
  difficulty: 'intermediate',
  includeVideos: true,
  includeBibliography: true,
  includeMindMap: true,
  quizQuestions: 15
});
```

### Error Handling
```typescript
try {
  const result = await orchestrator.generateModule(options);
} catch (error) {
  if (error instanceof LLMProviderError) {
    // Handle provider-specific errors
    console.error('Provider error:', error.code, error.details);
  } else if (error instanceof ValidationError) {
    // Handle validation errors
    console.error('Invalid input:', error.field, error.value);
  } else if (error instanceof GenerationError) {
    // Handle generation errors
    console.error('Generation failed at:', error.stage);
  }
}
```

---

# Dependency Analysis

## Core Dependencies Summary

### Production Dependencies
- **React Ecosystem**: react (18.2.0), react-dom, react-router-dom
- **TypeScript**: typescript (4.9.5) with comprehensive type definitions
- **UI Libraries**: tailwindcss (3.4.0), lucide-react, reactflow (11.11.4)
- **Content & AI**: openai (5.10.1), react-markdown, react-youtube
- **Data Validation**: ajv (8.17.1) with ajv-formats
- **Utilities**: uuid, axios, web-vitals

### Development Dependencies
- **Testing**: @testing-library/react, jest-dom, user-event
- **Build Tools**: react-scripts (5.0.1), postcss, autoprefixer
- **Type Definitions**: Complete @types packages for all libraries

## Security Analysis

### Critical Vulnerabilities
1. **nth-check** (<2.0.1) - High severity
   - CVE-2021-3803: Inefficient Regular Expression Complexity
   - Affects: css-select → svgo → @svgr/plugin-svgo → react-scripts

2. **@svgr/plugin-svgo** (<=5.5.0) - High severity
   - Indirect vulnerability through svgo dependency

### Security Recommendations
1. Update react-scripts to latest version or consider ejecting
2. Run `npm audit fix --force` for automatic fixes
3. Implement npm overrides for critical patches
4. Regular dependency audits (quarterly)

## Performance Considerations

### Bundle Size Optimization
- Code splitting for large libraries (React Flow, OpenAI)
- Lazy loading for admin sections
- Tree-shaking with modern build tools

### Dependency Health
- Consider upgrading TypeScript to v5.x
- Consolidate react-flow-renderer and reactflow to single version
- Update @types/node to match runtime version

---

# Installation & Setup

## Prerequisites
- Node.js 14+ (recommended: 18.x or 20.x)
- npm 7+ or yarn
- Git for version control

## Development Setup

```bash
# Clone the repository
git clone [repository-url]
cd jung-edu-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Start development server
npm start
```

## Environment Configuration

Create `.env.local` with:
```bash
# LLM Provider
REACT_APP_OPENAI_API_KEY=your-api-key
REACT_APP_OPENAI_MODEL=gpt-4o-mini

# Service Configuration
REACT_APP_YOUTUBE_API_KEY=your-youtube-key
REACT_APP_USE_REAL_SERVICES=true
REACT_APP_ENABLE_CACHING=true

# Rate Limiting
REACT_APP_MAX_REQUESTS_PER_MINUTE=20
REACT_APP_MAX_TOKENS_PER_MINUTE=40000
```

## Production Build

```bash
# Create optimized production build
npm run build

# Test production build locally
npm install -g serve
serve -s build

# Deploy to hosting service
# (Netlify, Vercel, AWS S3, etc.)
```

## Docker Setup (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

# Testing Strategy

## Test Coverage Goals
- **Branches**: 70%+
- **Functions**: 70%+
- **Lines**: 70%+
- **Statements**: 70%+

## Test Structure

```
src/
├── __tests__/
│   ├── integration/       # Integration tests
│   ├── mocks/            # Mock data and utilities
│   ├── services/         # Service unit tests
│   └── components/       # Component tests
├── App.test.tsx
├── components/__tests__/
├── pages/__tests__/
├── hooks/__tests__/
└── utils/__tests__/
```

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm test -- --watch

# Run specific test file
npm test -- Navigation.test.tsx

# Update snapshots
npm test -- -u
```

## Testing Patterns

### Component Testing
```typescript
describe('ComponentName', () => {
  it('should render correctly', () => {
    render(<Component {...mockProps} />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Service Testing
```typescript
describe('ServiceName', () => {
  beforeEach(() => {
    // Mock external dependencies
    jest.mock('./dependencies');
  });

  it('should handle business logic correctly', async () => {
    const result = await service.method();
    expect(result).toMatchExpectedStructure();
  });
});
```

### Integration Testing
```typescript
describe('User Flow', () => {
  it('should complete learning module', async () => {
    const { user } = renderWithRouter(<App />);
    
    // Navigate to module
    await user.click(screen.getByText('Module 1'));
    
    // Complete quiz
    await user.click(screen.getByText('Take Quiz'));
    
    // Verify progress
    expect(screen.getByText('100% Complete')).toBeInTheDocument();
  });
});
```

---

# Security Considerations

## Authentication & Authorization

### Session Management
- Token-based authentication with secure generation
- Session expiry handling (24-hour default)
- Secure token storage in memory
- HTTP-only cookies for future backend integration

### Access Control
```typescript
// Protected Route Implementation
<ProtectedRoute requiredRole="admin">
  <AdminDashboard />
</ProtectedRoute>

// Role-based access check
const canAccess = user.roles.includes(requiredRole);
```

## Data Security

### API Key Management
- Environment variables for sensitive data
- Never commit keys to version control
- Rotate keys quarterly
- Use separate keys for dev/staging/prod

### Input Validation
```typescript
// Schema validation with AJV
const validator = ajv.compile(moduleSchema);
if (!validator(input)) {
  throw new ValidationError(validator.errors);
}

// XSS prevention
const sanitizedContent = DOMPurify.sanitize(userInput);
```

### Content Security Policy
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline'; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' data: https:;">
```

## Privacy Considerations

### Data Storage
- LocalStorage limitations and encryption needs
- No PII in client-side storage
- Clear data on logout
- Implement data retention policies

### GDPR Compliance
- User consent for data collection
- Data export functionality
- Right to deletion implementation
- Privacy policy integration

---

# Performance Optimization

## Bundle Optimization

### Code Splitting
```typescript
// Route-based splitting
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));

// Component wrapping
<Suspense fallback={<LoadingSpinner />}>
  <AdminDashboard />
</Suspense>
```

### Tree Shaking
```javascript
// webpack.config.js
module.exports = {
  optimization: {
    usedExports: true,
    sideEffects: false,
  }
};
```

## Runtime Optimization

### Memoization
```typescript
// Component memoization
const ExpensiveComponent = React.memo(({ data }) => {
  return <ComplexVisualization data={data} />;
});

// Value memoization
const processedData = useMemo(() => 
  expensiveCalculation(rawData), 
  [rawData]
);
```

### Debouncing
```typescript
const debouncedSearch = useMemo(
  () => debounce((query: string) => {
    performSearch(query);
  }, 300),
  []
);
```

## API Optimization

### Request Caching
```typescript
const cache = new Map();

async function cachedFetch(url: string) {
  if (cache.has(url)) {
    return cache.get(url);
  }
  
  const response = await fetch(url);
  const data = await response.json();
  cache.set(url, data);
  
  return data;
}
```

### Token Usage Optimization
```typescript
// Monitor and optimize token usage
const estimatedTokens = await orchestrator.estimateTokenUsage(options);
if (estimatedTokens > budget) {
  options = reduceScope(options);
}
```

## Monitoring & Analytics

### Performance Metrics
```typescript
// Web Vitals monitoring
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  // Send to analytics endpoint
  analytics.track('performance', metric);
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

---

# Glossary

## Technical Terms

**API (Application Programming Interface)**: Set of protocols and tools for building software applications

**Component**: Reusable piece of UI code in React

**Context API**: React's built-in state management solution

**JWT (JSON Web Token)**: Secure method for transmitting information between parties

**LocalStorage**: Web storage API for storing data in the browser

**LLM (Large Language Model)**: AI model trained on vast amounts of text data

**Memoization**: Optimization technique that stores the results of expensive function calls

**React Flow**: Library for building node-based editors and diagrams

**Service Layer**: Abstraction layer containing business logic

**TypeScript**: Typed superset of JavaScript that compiles to plain JavaScript

## Jungian Psychology Terms

**Archetype**: Universal, archaic patterns and images that derive from the collective unconscious

**Collective Unconscious**: Part of the unconscious mind shared by all humanity

**Individuation**: Process of psychological integration and self-realization

**Shadow**: Repressed or hidden aspects of the personality

**Anima/Animus**: Contrasexual aspects of the psyche

**Self**: The unified whole of conscious and unconscious

**Persona**: The mask or social face presented to the world

**Synchronicity**: Meaningful coincidences that occur with no causal relationship

---

# Appendices

## Appendix A: Module Content Structure

### Module 1: Introduction to Carl Jung
- Overview of Jung's life and career
- Key differences from Freudian psychology
- Foundational concepts introduction
- Historical context and influence

### Module 2: The Collective Unconscious
- Definition and characteristics
- Relationship to personal unconscious
- Universal symbols and patterns
- Cultural manifestations

### Module 3: Major Archetypes
- The Shadow
- Anima and Animus
- The Self
- The Hero
- The Wise Old Man/Woman
- The Trickster

### Module 4: The Individuation Process
- Stages of individuation
- Integration of unconscious contents
- Role of dreams and active imagination
- Challenges and obstacles

### Module 5: Psychological Types
- Introversion vs. Extraversion
- The Four Functions: Thinking, Feeling, Sensation, Intuition
- Type dynamics and development
- MBTI connection

### Module 6: Dreams and Symbolism
- Jung's approach to dream interpretation
- Compensatory function of dreams
- Common symbols and their meanings
- Practical dream analysis techniques

## Appendix B: API Response Schemas

### Module Schema
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "difficulty": "beginner|intermediate|advanced",
  "estimatedTime": "number",
  "objectives": ["string"],
  "prerequisites": ["string"],
  "content": {
    "introduction": "string",
    "sections": [{
      "id": "string",
      "title": "string",
      "content": "string",
      "duration": "number",
      "concepts": ["string"]
    }],
    "summary": "string",
    "keyTakeaways": ["string"]
  }
}
```

### Quiz Schema
```json
{
  "id": "string",
  "moduleId": "string",
  "title": "string",
  "questions": [{
    "id": "string",
    "type": "multiple-choice|true-false|essay",
    "question": "string",
    "options": ["string"],
    "correctAnswer": "number|boolean|string",
    "explanation": "string",
    "difficulty": "easy|medium|hard"
  }]
}
```

## Appendix C: Environment Variables Reference

```bash
# Required
REACT_APP_OPENAI_API_KEY=            # OpenAI API key
REACT_APP_OPENAI_MODEL=              # Model to use (default: gpt-4o-mini)

# Optional
REACT_APP_YOUTUBE_API_KEY=           # YouTube Data API key
REACT_APP_USE_REAL_SERVICES=         # Use real vs mock services
REACT_APP_ENABLE_CACHING=            # Enable response caching
REACT_APP_MAX_REQUESTS_PER_MINUTE=   # Rate limit for API calls
REACT_APP_MAX_TOKENS_PER_MINUTE=     # Token usage limit
REACT_APP_DEBUG_MODE=                # Enable debug logging
```

## Appendix D: Troubleshooting Guide

### Common Issues

#### Provider Unavailable
- Check API key configuration
- Verify network connectivity
- Check service status
- Fall back to mock provider

#### Rate Limit Exceeded
- Implement request queuing
- Reduce token usage
- Enable caching
- Distribute requests over time

#### Generation Timeout
- Increase timeout settings
- Reduce content scope
- Check provider status
- Use progressive generation

#### Memory Issues
- Implement streaming for large content
- Use pagination
- Clear caches periodically
- Monitor browser memory usage

## Appendix E: Contributing Guidelines

### Code Style
- Use TypeScript strict mode
- Follow ESLint configuration
- Write comprehensive tests
- Document complex logic

### Pull Request Process
1. Fork the repository
2. Create feature branch
3. Write tests for new features
4. Update documentation
5. Submit PR with description
6. Address review comments

### Commit Message Format
```
type(scope): subject

body

footer
```

Types: feat, fix, docs, style, refactor, test, chore

---

**Document Version**: 1.0.0  
**Last Updated**: January 19, 2025  
**Next Review**: April 19, 2025

---

*This technical documentation is maintained by the JaqEdu development team. For questions or corrections, please submit an issue on the project repository.*