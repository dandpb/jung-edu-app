# JaqEdu - Jung's Analytical Psychology Educational Platform Architecture

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Pattern](#architecture-pattern)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Core Components](#core-components)
6. [Data Flow](#data-flow)
7. [State Management](#state-management)
8. [Service Layer](#service-layer)
9. [Security](#security)
10. [Deployment Architecture](#deployment-architecture)

## System Overview

JaqEdu is a comprehensive educational platform designed to teach Jung's analytical psychology through interactive modules, mind maps, quizzes, and multimedia content. The system integrates AI capabilities for content generation and provides both student and administrative interfaces.

### High-Level Architecture Diagram

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

## Architecture Pattern

The application follows a **Component-Based Architecture** with elements of:

- **MVC (Model-View-Controller)**: Separation of data (types), views (components), and business logic (services)
- **Context Pattern**: For global state management (AdminContext)
- **Service Layer Pattern**: Abstraction of external integrations and business logic
- **Repository Pattern**: Data access through service classes (ModuleService)

## Technology Stack

### Frontend
- **React 18.2.0**: Core UI framework
- **TypeScript 4.9.5**: Type safety and developer experience
- **React Router 6**: Client-side routing
- **Tailwind CSS 3.4.0**: Utility-first CSS framework

### State Management
- **React Context API**: Global state management
- **LocalStorage**: Client-side persistence

### UI Libraries
- **React Flow 11.11.4**: Interactive mind map visualization
- **Lucide React**: Icon library
- **React Markdown**: Markdown rendering
- **React YouTube**: YouTube video integration

### AI Integration
- **OpenAI API**: Content generation and quiz creation
- **Custom LLM Provider Interface**: Abstraction for multiple AI providers

### Development Tools
- **Create React App**: Build tooling
- **Jest & React Testing Library**: Testing framework
- **AJV**: JSON schema validation

## Project Structure

```
jung-edu-app/
├── src/
│   ├── components/          # Reusable UI components
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
│   │   ├── mindmap/       # Mind map generation
│   │   ├── modules/       # Module management
│   │   ├── quiz/          # Quiz generation
│   │   └── video/         # Video enrichment
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
```

## Core Components

### 1. App.tsx - Application Root
- **Responsibility**: Application initialization and routing setup
- **Key Features**:
  - Provider wrapping (AdminProvider)
  - Route configuration
  - User progress management

### 2. AdminContext - Global State Management
- **Responsibility**: Authentication and content management
- **State Managed**:
  - Admin authentication status
  - Module data
  - Mind map nodes and edges
- **Security**: Session token-based authentication

### 3. Navigation Component
- **Responsibility**: Application navigation
- **Features**:
  - Responsive navigation bar
  - Context-aware menu items
  - Admin/User mode switching

### 4. Dashboard Page
- **Responsibility**: Learning overview and module access
- **Features**:
  - Progress tracking
  - Module grid with prerequisites
  - Completion statistics

## Data Flow

### User Flow
```
User Action → Component → Hook/Context → Service → LocalStorage
                ↓                          ↓
              Update UI ← State Change ← Data Response
```

### Admin Flow
```
Admin Login → AdminContext → Session Token → LocalStorage
     ↓                                           ↓
Admin Panel → Module Editor → LLM Service → Generated Content
     ↓                                           ↓
Save Changes → ModuleService → LocalStorage → Update UI
```

## State Management

### Context-Based State
```typescript
AdminContext {
  isAdmin: boolean
  currentAdmin: AdminUser | null
  modules: Module[]
  mindMapNodes: MindMapNode[]
  mindMapEdges: MindMapEdge[]
}
```

### Local Component State
- Form inputs
- UI toggles
- Temporary data

### Persistent State (LocalStorage)
- User progress
- Module data
- Mind map configurations
- Admin session tokens

## Service Layer

### 1. Module Service
- **Purpose**: CRUD operations for educational modules
- **Features**:
  - Module creation with AI generation
  - Search and filtering
  - Import/Export functionality
  - Draft management

### 2. LLM Provider
- **Purpose**: AI content generation abstraction
- **Implementations**:
  - OpenAIProvider: Production AI integration
  - MockLLMProvider: Development/testing
- **Features**:
  - Structured response generation
  - Retry logic with exponential backoff
  - Token counting

### 3. YouTube Service
- **Purpose**: Video content integration
- **Features**:
  - Video search
  - Metadata enrichment
  - Playlist management

### 4. Mind Map Generator
- **Purpose**: Visual concept mapping
- **Features**:
  - Automatic layout generation
  - Hierarchical organization
  - React Flow integration

## Security

### Authentication
- Session token-based authentication
- Password hashing with salt
- Secure token generation and validation

### Data Protection
- No sensitive data in LocalStorage
- API keys managed through environment variables
- Browser-side API calls with safety flags

### Access Control
- Protected routes with ProtectedRoute component
- Role-based access (admin vs. user)
- Session expiry handling

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

## Performance Optimizations

1. **Code Splitting**: React.lazy for route-based splitting
2. **Component Memoization**: React.memo for expensive components
3. **Debounced Operations**: Search and auto-save features
4. **Optimistic UI Updates**: Immediate feedback with background sync

## Future Architecture Considerations

1. **Backend API**: Migration from LocalStorage to REST API
2. **Real-time Collaboration**: WebSocket integration
3. **Offline Support**: Service Worker implementation
4. **Mobile Apps**: React Native adaptation
5. **Analytics**: Learning progress tracking system

## Development Workflow

1. **Component Development**: Isolated component creation
2. **Service Integration**: Mock providers for testing
3. **Type Safety**: Comprehensive TypeScript coverage
4. **Testing Strategy**: Unit, integration, and E2E tests
5. **Code Quality**: ESLint and Prettier integration

---

This architecture provides a solid foundation for an educational platform while maintaining flexibility for future enhancements and scalability requirements.