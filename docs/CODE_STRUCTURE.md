# Jung Educational App - Code Structure Documentation

## 📁 Project Overview

Jung Educational App is a TypeScript-based React application designed for educational content delivery with a focus on Jungian psychology. The application follows modern React patterns with TypeScript for type safety and features a comprehensive educational module system.

## 🏗️ Directory Structure

```
jung-edu-app/
├── src/                      # Source code directory
│   ├── components/          # React components
│   ├── config/             # Configuration files
│   ├── contexts/           # React contexts
│   ├── data/              # Static data
│   ├── hooks/             # Custom React hooks
│   ├── pages/             # Page components
│   ├── schemas/           # JSON schemas and validators
│   ├── services/          # Business logic and external services
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── public/                # Static assets
├── docs/                  # Documentation
├── coverage/              # Test coverage reports
└── build/                 # Production build output
```

## 🎯 Type System Architecture

### Core Type System (`src/types/`)

The application uses a dual type system approach:

#### 1. **Domain Types** (`src/types/index.ts`)
- Simple, focused interfaces for UI components
- Direct mapping to component props
- Examples:
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

#### 2. **Schema Types** (`src/types/schema.ts`)
- Comprehensive types with BaseEntity pattern
- Includes metadata, timestamps, and advanced features
- Examples:
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

### Key Type Patterns

1. **BaseEntity Pattern**: Common fields for all entities (id, timestamps)
2. **Metadata Pattern**: Extensible metadata objects for flexibility
3. **Status Enums**: Type-safe status tracking
4. **Nested Structures**: Well-defined hierarchical data

## 🧩 Component Architecture

### Component Organization
```
components/
├── admin/              # Admin-specific components
├── common/             # Shared/reusable components
├── mindmap/           # Mind mapping components
├── modules/           # Module-related components
├── notes/             # Note-taking components
├── quiz/              # Quiz components
├── Navigation.tsx     # Main navigation
└── ProtectedRoute.tsx # Route protection HOC
```

### Component Patterns

#### 1. **Functional Components with TypeScript**
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

#### 2. **State Management**
- Local state with `useState`
- Context API for global state (`AdminContext`)
- localStorage for persistence

#### 3. **Props Interface Pattern**
- All components have typed props interfaces
- Clear separation of concerns
- Consistent naming conventions

## 🛠️ Service Layer Architecture

### Service Organization
```
services/
├── bibliography/      # Bibliography management
├── llm/              # LLM integration
│   └── generators/   # Content generators
├── mindmap/          # Mind map generation
├── modules/          # Module management
├── quiz/             # Quiz generation/validation
└── video/            # Video integration
```

### Service Patterns

#### 1. **Generator Pattern**
Each generator follows a consistent interface:
```typescript
interface Generator<T> {
  generate(input: GeneratorInput): Promise<T>;
  validate(output: T): ValidationResult;
}
```

#### 2. **Enricher Pattern**
Services that enhance existing data:
```typescript
class BibliographyEnricher {
  enrich(bibliography: Bibliography[]): EnhancedBibliography[];
}
```

#### 3. **Orchestrator Pattern**
Coordinates multiple services:
```typescript
class LLMOrchestrator {
  async generateModule(config: ModuleConfig): Promise<Module> {
    // Coordinates content, quiz, video generators
  }
}
```

## 📱 Page Structure

### Page Organization
```
pages/
├── admin/             # Admin pages
│   ├── AdminDashboard.tsx
│   ├── AdminLogin.tsx
│   └── AdminModules.tsx
├── Dashboard.tsx      # Main dashboard
├── ModulePage.tsx    # Module detail view
├── MindMapPage.tsx   # Mind map visualization
└── NotesPage.tsx     # Note management
```

### Routing Pattern
- Protected routes for admin sections
- Public routes for student content
- Route guards using `ProtectedRoute` component

## 🧪 Testing Architecture

### Test Organization
```
__tests__/
├── integration/       # Integration tests
├── mocks/            # Mock data and utilities
├── services/         # Service unit tests
└── components/       # Component tests
```

### Testing Patterns

#### 1. **Component Testing**
```typescript
describe('ComponentName', () => {
  it('should render correctly', () => {
    render(<Component {...mockProps} />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

#### 2. **Service Testing**
- Mock external dependencies
- Test business logic in isolation
- Validate error handling

#### 3. **Integration Testing**
- Test component interactions
- Validate data flow
- Test error boundaries

## 🔐 Schema Validation System

### Schema Architecture (`src/schemas/`)

#### 1. **JSON Schema Definition**
- Comprehensive validation rules
- Type-safe schema generation
- AJV for runtime validation

#### 2. **Validator Pattern**
```typescript
export function validateEducationalModule(module: any): {
  isValid: boolean;
  errors: ValidationError[];
  data?: EducationalModule;
}
```

#### 3. **Sanitization**
- Trim strings
- Format timestamps
- Sort arrays for consistency

## 💾 Data Persistence

### localStorage Patterns (`src/utils/localStorage.ts`)

#### 1. **Key Management**
```typescript
const USER_PROGRESS_KEY = 'jungAppUserProgress';
const NOTES_KEY = 'jungAppNotes';
```

#### 2. **Error Handling**
- Try-catch wrappers
- Fallback values
- Console error logging

#### 3. **Type Safety**
- Typed save/load functions
- JSON serialization/deserialization
- Null safety checks

## 🎨 Styling Patterns

### CSS Architecture
- Tailwind CSS for utility-first styling
- Component-specific styles when needed
- Responsive design patterns
- Dark mode support (planned)

## 🚀 Performance Patterns

### 1. **Code Splitting**
- Route-based splitting
- Lazy loading for admin sections

### 2. **Memoization**
- React.memo for expensive components
- useMemo for complex calculations

### 3. **State Optimization**
- Minimize re-renders
- Local state when possible
- Context splitting

## 🐛 Error Handling

### Error Boundary Pattern
- Graceful error recovery
- User-friendly error messages
- Error logging for debugging

### Service Error Handling
```typescript
try {
  const result = await service.method();
  return result;
} catch (error) {
  console.error('Service error:', error);
  return fallbackValue;
}
```

## 📊 Analytics & Monitoring

### Analytics Types
```typescript
interface LearningAnalytics {
  userId: string;
  totalModulesCompleted: number;
  averageQuizScore: number;
  strongConcepts: string[];
  weakConcepts: string[];
}
```

## 🔄 State Management Patterns

### 1. **Context Pattern**
- AdminContext for admin state
- UserContext (planned) for user state

### 2. **Local State**
- Component-specific state
- Form state management
- UI state (modals, toggles)

### 3. **Persistent State**
- localStorage for user progress
- Session storage for temporary data

## 🚦 Best Practices & Conventions

### Naming Conventions
- PascalCase for components
- camelCase for functions/variables
- UPPER_CASE for constants
- kebab-case for file names

### File Organization
- One component per file
- Index exports for clean imports
- Colocated tests and styles

### TypeScript Best Practices
- Strict mode enabled
- No implicit any
- Exhaustive type checking
- Proper null handling

## 🛣️ Future Considerations

### Technical Debt
- Migration to more comprehensive state management (Redux/Zustand)
- Enhanced error boundaries
- Performance monitoring
- Accessibility improvements

### Architectural Improvements
- Module lazy loading
- Service worker for offline support
- WebSocket for real-time features
- Micro-frontend architecture (planned)

## 🔗 Module Dependencies

### Core Dependencies
- React 18.x
- TypeScript 5.x
- Tailwind CSS
- React Router
- AJV for validation
- Lucide React for icons

### Development Dependencies
- Jest & React Testing Library
- ESLint & Prettier
- PostCSS
- TypeScript compiler

## 📝 Code Examples

### Reusable Hook Pattern
```typescript
export function useModuleProgress(moduleId: string) {
  const [progress, setProgress] = useState<ModuleProgress | null>(null);
  
  useEffect(() => {
    const loaded = loadModuleProgress(moduleId);
    setProgress(loaded);
  }, [moduleId]);
  
  return { progress, setProgress };
}
```

### Service Integration Pattern
```typescript
const moduleService = new ModuleService();
const enrichedModule = await moduleService
  .generate(config)
  .then(module => enricher.enrich(module))
  .then(module => validator.validate(module));
```

### Component Composition Pattern
```typescript
<ModuleEditor
  module={selectedModule}
  onSave={(module) => {
    updateModule(module);
    showNotification('Module saved');
  }}
  onCancel={() => setEditingModule(null)}
/>
```

## 🎯 Key Architectural Decisions

1. **TypeScript First**: Full type safety across the application
2. **Component-Based**: Reusable, composable UI components
3. **Service Layer**: Clear separation of business logic
4. **Schema Validation**: Runtime type checking for data integrity
5. **Progressive Enhancement**: Core functionality works without JS
6. **Accessibility**: WCAG compliance (in progress)
7. **Performance**: Lazy loading and code splitting
8. **Testing**: Comprehensive test coverage
9. **Documentation**: Self-documenting code with JSDoc
10. **Scalability**: Modular architecture for growth