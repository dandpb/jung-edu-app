# 🏗️ jaqEdu Technical Documentation

## Architecture Overview

jaqEdu is built using modern web technologies following clean architecture principles with a strong emphasis on type safety, modularity, and scalability.

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18.2.0
- **Language**: TypeScript 4.9.5
- **Styling**: TailwindCSS 3.4.0
- **State Management**: React Context API
- **Routing**: React Router DOM 6.21.0
- **Build Tool**: React Scripts 5.0.1

### Backend & Data
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth + Custom JWT implementation
- **Real-time**: Socket.io for live updates
- **Storage**: LocalStorage for offline capability

### Visualization & UI
- **Mind Maps**: React Flow 11.11.4
- **Charts**: Recharts 3.1.0
- **Data Visualization**: D3.js 7.9.0
- **Icons**: Lucide React
- **Markdown**: React Markdown with GFM support

### AI Integration
- **LLM Provider**: OpenAI API (GPT-4)
- **Content Generation**: Custom orchestration layer
- **Multiple Providers**: Support for OpenAI, Anthropic, Google

### Testing & Quality
- **Test Framework**: Jest
- **Testing Library**: React Testing Library
- **Coverage Target**: 70% minimum
- **Mocking**: MSW (Mock Service Worker)

## 📁 Project Structure

```
jaqEdu/
├── jung-edu-app/                 # Main application
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── admin/          # Admin panel components
│   │   │   ├── auth/           # Authentication components
│   │   │   ├── common/         # Shared components
│   │   │   ├── modules/        # Module-related components
│   │   │   ├── notes/          # Note-taking components
│   │   │   └── quiz/           # Quiz components
│   │   ├── contexts/           # React contexts
│   │   ├── data/               # Static data and configurations
│   │   ├── hooks/              # Custom React hooks
│   │   ├── pages/              # Page components
│   │   ├── schemas/            # TypeScript schemas and validation
│   │   ├── services/           # Business logic and API services
│   │   │   ├── auth/           # Authentication services
│   │   │   ├── llm/            # AI/LLM integration
│   │   │   ├── modules/        # Module management
│   │   │   ├── quiz/           # Quiz generation
│   │   │   └── validation/     # Data validation
│   │   ├── types/              # TypeScript type definitions
│   │   └── utils/              # Utility functions
│   ├── database/               # Database schemas and migrations
│   ├── public/                 # Static assets
│   └── scripts/                # Build and deployment scripts
└── docs/                       # Documentation

```

## 🏛️ Architecture Patterns

### Clean Architecture Layers

1. **Presentation Layer** (React Components)
   - Handles UI rendering and user interactions
   - Implements React patterns (hooks, context, memo)
   - Maintains separation of concerns

2. **Business Logic Layer** (Services)
   - Contains application-specific business rules
   - Orchestrates data flow between layers
   - Implements domain logic

3. **Data Layer** (Repositories/Storage)
   - Manages data persistence
   - Handles API communications
   - Implements caching strategies

### Design Patterns

#### Service Pattern
```typescript
// Example: Authentication Service
export class AuthService {
  private static instance: AuthService;
  
  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }
  
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Implementation
  }
}
```

#### Provider Pattern
```typescript
// LLM Provider abstraction
export abstract class LLMProvider {
  abstract generateContent(prompt: string): Promise<string>;
  abstract generateQuiz(content: string): Promise<Quiz>;
}
```

#### Repository Pattern
```typescript
// Module repository for data access
export class ModuleRepository {
  async findAll(): Promise<Module[]> { }
  async findById(id: string): Promise<Module> { }
  async create(module: Module): Promise<Module> { }
  async update(id: string, module: Partial<Module>): Promise<Module> { }
}
```

## 🔐 Security Architecture

### Authentication Flow
1. User provides credentials
2. Credentials validated against stored hash
3. JWT tokens generated (access + refresh)
4. Tokens stored in secure storage
5. API requests include Bearer token
6. Token validation on each request
7. Automatic token refresh

### Security Features
- **Password Security**: bcrypt with 12 rounds
- **JWT Tokens**: Short-lived access tokens (15 min)
- **Session Management**: Device fingerprinting and tracking
- **Rate Limiting**: Login attempt protection
- **CSRF Protection**: Token validation
- **XSS Prevention**: Input sanitization
- **SQL Injection**: Parameterized queries

### Role-Based Access Control (RBAC)
```typescript
enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  INSTRUCTOR = 'instructor',
  STUDENT = 'student',
  GUEST = 'guest'
}
```

## 🎨 Component Architecture

### Component Categories

1. **Page Components** (`/pages`)
   - Route-level components
   - Orchestrate child components
   - Handle data fetching

2. **Feature Components** (`/components`)
   - Reusable UI components
   - Encapsulate specific functionality
   - Follow single responsibility principle

3. **Common Components** (`/components/common`)
   - Shared across features
   - Generic UI elements
   - Highly reusable

### Component Best Practices
- Functional components with hooks
- TypeScript for prop validation
- Memoization for performance
- Lazy loading for route components
- Error boundaries for graceful failures

## 🧠 AI Integration Architecture

### LLM Orchestration
```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Client    │────▶│ Orchestrator │────▶│  Provider   │
│  Request    │     │   Service    │     │  (OpenAI)   │
└─────────────┘     └──────────────┘     └─────────────┘
                            │
                    ┌───────▼────────┐
                    │   Validators   │
                    │  & Enhancers   │
                    └────────────────┘
```

### Content Generation Pipeline
1. **Request Processing**: Parse and validate input
2. **Provider Selection**: Choose appropriate LLM
3. **Prompt Engineering**: Optimize for quality output
4. **Generation**: Execute LLM request
5. **Validation**: Ensure output quality
6. **Enhancement**: Apply post-processing
7. **Caching**: Store for performance

## 🗄️ Data Architecture

### Storage Strategy
- **Primary**: Supabase (PostgreSQL) for persistent data
- **Secondary**: LocalStorage for offline capability
- **Cache**: In-memory for performance
- **Session**: Secure storage for auth tokens

### Data Models
```typescript
interface Module {
  id: string;
  title: string;
  description: string;
  content: ModuleContent;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface UserProgress {
  userId: string;
  moduleId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progressPercentage: number;
  timeSpentMinutes: number;
  quizAttempts: QuizAttempt[];
  notes: string;
}
```

## 🚀 Performance Optimization

### Frontend Optimization
- **Code Splitting**: Route-based lazy loading
- **Memoization**: React.memo for expensive components
- **Virtual Scrolling**: For large lists
- **Image Optimization**: Lazy loading and compression
- **Bundle Size**: Tree shaking and minification

### Backend Optimization
- **Database Indexing**: Strategic index placement
- **Query Optimization**: Efficient SQL queries
- **Caching Strategy**: Multi-level caching
- **Connection Pooling**: Efficient database connections
- **API Response Compression**: gzip compression

## 🔄 State Management

### Context Architecture
```typescript
// Authentication Context
const AuthContext = createContext<AuthContextType | null>(null);

// Admin Context
const AdminContext = createContext<AdminContextType | null>(null);

// Theme Context
const ThemeContext = createContext<ThemeContextType | null>(null);
```

### State Flow
1. **Global State**: Context API for app-wide state
2. **Component State**: useState for local state
3. **Derived State**: useMemo for computed values
4. **Side Effects**: useEffect for data fetching

## 📊 Monitoring & Analytics

### Performance Monitoring
- Web Vitals tracking
- Custom performance metrics
- Error tracking and reporting
- User behavior analytics

### Logging Strategy
```typescript
enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

class Logger {
  log(level: LogLevel, message: string, data?: any): void {
    // Implementation
  }
}
```

## 🔧 Development Tools

### Build Configuration
- **Webpack**: Via React Scripts
- **Babel**: TypeScript transpilation
- **PostCSS**: CSS processing
- **ESLint**: Code linting
- **Prettier**: Code formatting

### Developer Experience
- Hot Module Replacement (HMR)
- TypeScript strict mode
- Source maps for debugging
- Environment-specific configs
- Git hooks for quality checks

## 📈 Scalability Considerations

### Horizontal Scaling
- Stateless application design
- Load balancer ready
- CDN for static assets
- Database read replicas

### Vertical Scaling
- Efficient memory usage
- Optimized algorithms
- Resource monitoring
- Performance profiling

## 🌐 Internationalization

### i18n Architecture
- Language files in `/locales`
- Context-based language switching
- Fallback language support
- RTL language ready

### Supported Languages
- Portuguese (pt-BR) - Primary
- English (en) - In development
- Spanish (es) - Planned

---

*For more specific technical details, see the [API Reference](./API_REFERENCE.md) and [Database Schema](./DATABASE_SCHEMA.md) documentation.*