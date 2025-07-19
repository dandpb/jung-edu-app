# Jung Edu App - Component Reference Documentation

## Table of Contents

1. [Component Hierarchy](#component-hierarchy)
2. [Core Components](#core-components)
3. [Page Components](#page-components)
4. [Admin Components](#admin-components)
5. [Common Components](#common-components)
6. [Custom Hooks](#custom-hooks)
7. [Context Providers](#context-providers)
8. [Component Interaction Flow](#component-interaction-flow)
9. [Styling Patterns](#styling-patterns)
10. [Accessibility Features](#accessibility-features)
11. [Responsive Design Patterns](#responsive-design-patterns)
12. [Best Practices](#best-practices)

---

## Component Hierarchy

```
App.tsx
├── AdminProvider (Context)
│   └── AppContent
│       ├── Navigation
│       └── Routes
│           ├── Dashboard
│           ├── ModulePage
│           ├── MindMapPage
│           ├── NotesPage
│           ├── ProgressPage
│           ├── BibliographyPage
│           ├── SearchPage
│           └── Admin Routes (Protected)
│               ├── AdminLogin
│               ├── AdminDashboard
│               ├── AdminModules
│               ├── AdminMindMap
│               └── AdminResources
```

---

## Core Components

### App Component

**File:** `src/App.tsx`

**Props:** None

**Description:** Root component that provides the AdminContext and sets up routing.

**Key Features:**
- Wraps the entire application with AdminProvider
- Manages React Router configuration
- Future-proofs with React Router v7 flags

```tsx
function App() {
  return (
    <AdminProvider>
      <AppContent />
    </AdminProvider>
  );
}
```

### AppContent Component

**File:** `src/App.tsx`

**Props:** None (uses context)

**Description:** Main application content wrapper that manages user progress and routing.

**State Management:**
- `userProgress`: Persistent user progress data stored in localStorage
- Provides `updateProgress` callback to child components

**Key Features:**
- Lazy loads progress from localStorage
- Auto-saves progress changes
- Provides progress update mechanism to child components

---

## Page Components

### Dashboard

**File:** `src/pages/Dashboard.tsx`

**Props:**
```tsx
interface DashboardProps {
  modules: Module[];
  userProgress: UserProgress;
}
```

**Description:** Main landing page showing module overview and user progress summary.

**Features:**
- Module grid display
- Progress statistics
- Quick navigation to modules

### ModulePage

**File:** `src/pages/ModulePage.tsx`

**Props:**
```tsx
interface ModulePageProps {
  modules: Module[];
  userProgress: UserProgress;
  updateProgress: (updates: Partial<UserProgress>) => void;
}
```

**Description:** Individual module learning page with content sections, videos, and quiz.

**Features:**
- Section-based content display
- Video player integration
- Quiz component
- Progress tracking
- Note-taking capability

### MindMapPage

**File:** `src/pages/MindMapPage.tsx`

**Props:**
```tsx
interface MindMapPageProps {
  modules: Module[];
}
```

**Description:** Interactive visualization of module relationships and concepts.

**Features:**
- Interactive mind map using ReactFlow
- Multiple layout options
- Category filtering
- Study path generation

### NotesPage

**File:** `src/pages/NotesPage.tsx`

**Props:**
```tsx
interface NotesPageProps {
  modules: Module[];
  userProgress: UserProgress;
  updateProgress: (updates: Partial<UserProgress>) => void;
}
```

**Description:** User's personal notes management page.

**Features:**
- Create, read, update, delete notes
- Filter notes by module
- Search functionality
- Timestamp tracking

### ProgressPage

**File:** `src/pages/ProgressPage.tsx`

**Props:**
```tsx
interface ProgressPageProps {
  userProgress: UserProgress;
  modules: Module[];
}
```

**Description:** Detailed progress tracking and statistics page.

**Features:**
- Module completion status
- Quiz scores overview
- Time tracking statistics
- Visual progress indicators

### BibliographyPage

**File:** `src/pages/BibliographyPage.tsx`

**Props:**
```tsx
interface BibliographyPageProps {
  modules: Module[];
}
```

**Description:** Comprehensive resource listing page.

**Features:**
- Books, articles, and films listing
- Filter by type
- Search functionality
- External links

### SearchPage

**File:** `src/pages/SearchPage.tsx`

**Props:**
```tsx
interface SearchPageProps {
  modules: Module[];
}
```

**Description:** Global search across all module content.

**Features:**
- Full-text search
- Result categorization
- Direct navigation to content

---

## Admin Components

### AdminLogin

**File:** `src/pages/admin/AdminLogin.tsx`

**Props:** None

**Description:** Secure login page for admin access.

**Features:**
- Username/password authentication
- Session management
- Redirect on successful login

### AdminDashboard

**File:** `src/pages/admin/AdminDashboard.tsx`

**Props:** None (uses AdminContext)

**Description:** Admin overview page with quick actions.

**Features:**
- Module statistics
- Quick actions menu
- Recent activity log

### AdminModules

**File:** `src/pages/admin/AdminModules.tsx`

**Props:** None (uses AdminContext)

**Description:** Module management interface.

**Features:**
- Create/Edit/Delete modules
- AI-powered module generation
- Content preview
- Bulk operations

### ModuleEditor

**File:** `src/components/admin/ModuleEditor.tsx`

**Props:**
```tsx
interface ModuleEditorProps {
  module: Module;
  modules: Module[];
  onSave: (module: Module) => void;
  onCancel: () => void;
}
```

**Description:** Comprehensive module editing interface.

**Features:**
- Tabbed interface (Basic Info, Content, Videos, Quiz, Resources)
- Section management with expand/collapse
- Rich text editing
- Media management
- Prerequisites configuration

**Tabs:**
1. **Basic Info**: Title, description, icon, difficulty, time estimate
2. **Content**: Introduction and sections with key terms
3. **Videos**: YouTube video management
4. **Quiz**: Question editor integration
5. **Resources**: Bibliography and film references

### AIModuleGenerator

**File:** `src/components/admin/AIModuleGenerator.tsx`

**Props:**
```tsx
interface AIModuleGeneratorProps {
  onGenerate: (module: Module) => void;
  onCancel: () => void;
}
```

**Description:** AI-powered module generation interface.

**Features:**
- Configuration form for AI generation
- Real-time generation progress
- Module preview
- Regeneration capabilities

### GenerationProgress

**File:** `src/components/admin/GenerationProgress.tsx`

**Props:**
```tsx
interface GenerationProgressProps {
  steps: GenerationStep[];
  currentStep: number;
}
```

**Description:** Visual progress indicator for AI generation.

**Features:**
- Step-by-step progress display
- Status indicators (pending, in-progress, completed, error)
- Detailed messages per step

### QuizEditor

**File:** `src/components/admin/QuizEditor.tsx`

**Props:**
```tsx
interface QuizEditorProps {
  quiz?: Quiz;
  onUpdate: (quiz: Quiz | undefined) => void;
}
```

**Description:** Quiz creation and editing interface.

**Features:**
- Question management
- Multiple choice options
- Correct answer selection
- Explanation editor

---

## Common Components

### Navigation

**File:** `src/components/Navigation.tsx`

**Props:** None (uses AdminContext and location)

**Description:** Main navigation bar component.

**Features:**
- Responsive navigation menu
- Active route highlighting
- Admin-specific menu items
- Logout functionality

**Navigation Items:**
- Dashboard
- Mind Map
- Notes
- Progress
- Resources
- Search
- Admin (conditional)

### ProtectedRoute

**File:** `src/components/ProtectedRoute.tsx`

**Props:**
```tsx
interface ProtectedRouteProps {
  children: React.ReactNode;
}
```

**Description:** Route wrapper for admin-only pages.

**Features:**
- Authentication check
- Automatic redirect to login
- Child component rendering

### QuizComponent

**File:** `src/components/quiz/QuizComponent.tsx`

**Props:**
```tsx
interface QuizComponentProps {
  quiz: Quiz;
  onComplete: (score: number) => void;
  previousScore?: number;
}
```

**Description:** Interactive quiz interface for students.

**Features:**
- Question-by-question navigation
- Answer selection with immediate feedback
- Progress bar
- Score calculation and display
- Review mode with explanations

### NoteEditor

**File:** `src/components/notes/NoteEditor.tsx`

**Props:**
```tsx
interface NoteEditorProps {
  onSave: (content: string) => void;
  onCancel: () => void;
  moduleTitle: string;
  initialContent?: string;
}
```

**Description:** Modal interface for creating/editing notes.

**Features:**
- Full-screen modal
- Auto-focus textarea
- Save/Cancel actions
- Module context display

### InteractiveMindMap

**File:** `src/components/mindmap/InteractiveMindMap.tsx`

**Props:**
```tsx
interface InteractiveMindMapProps {
  modules: Module[];
  selectedModule?: Module;
  onNodeClick?: (moduleId: string) => void;
  showControls?: boolean;
  showMiniMap?: boolean;
  initialLayout?: LayoutType;
}
```

**Description:** ReactFlow-based interactive mind map visualization.

**Features:**
- Multiple layout algorithms (radial, hierarchical, force-directed)
- Interactive node clicking
- Zoom and pan controls
- Mini-map navigation
- Category filtering
- Study path generation
- Layout recommendations

### VideoPlayer

**File:** `src/components/modules/VideoPlayer.tsx`

**Props:**
```tsx
interface VideoPlayerProps {
  video: Video;
  onComplete?: () => void;
}
```

**Description:** YouTube video player wrapper.

**Features:**
- YouTube iframe integration
- Responsive sizing
- Completion tracking
- Error handling

### MarkdownContent

**File:** `src/components/common/MarkdownContent.tsx`

**Props:**
```tsx
interface MarkdownContentProps {
  content: string;
  className?: string;
  prose?: boolean;
}
```

**Description:** Markdown renderer with custom styling.

**Features:**
- GitHub Flavored Markdown support
- Custom component styling
- Table support
- Code highlighting
- Responsive typography

**Supported Elements:**
- Headers (h1-h6)
- Bold/italic text
- Lists (ordered/unordered)
- Links (external opening)
- Code blocks (inline and block)
- Tables
- Blockquotes
- Horizontal rules

---

## Custom Hooks

### useModuleGenerator

**File:** `src/hooks/useModuleGenerator.ts`

**Returns:**
```tsx
interface UseModuleGeneratorReturn {
  isGenerating: boolean;
  generatedModule: Module | null;
  generationSteps: GenerationStep[];
  currentStep: number;
  error: string | null;
  generateModule: (config: GenerationConfig) => Promise<void>;
  regenerateSection: (sectionId: string) => Promise<void>;
  updateGeneratedModule: (module: Module) => void;
  reset: () => void;
}
```

**Description:** Hook for AI-powered module generation.

**Features:**
- Orchestrates LLM-based content generation
- Progress tracking
- Error handling
- Section regeneration
- Module updates

**Generation Steps:**
1. Initializing
2. Content generation
3. Quiz creation (optional)
4. Video resource finding (optional)
5. Bibliography compilation (optional)
6. Finalization

---

## Context Providers

### AdminContext

**File:** `src/contexts/AdminContext.tsx`

**Provider:** `AdminProvider`

**Context Value:**
```tsx
interface AdminContextType {
  isAdmin: boolean;
  currentAdmin: AdminUser | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  modules: Module[];
  updateModules: (modules: Module[]) => void;
  mindMapNodes: MindMapNode[];
  mindMapEdges: MindMapEdge[];
  updateMindMap: (nodes: MindMapNode[], edges: MindMapEdge[]) => void;
}
```

**Description:** Global admin state management.

**Features:**
- Authentication state
- Module management
- Mind map data management
- Session persistence
- Secure password handling

---

## Component Interaction Flow

### Module Learning Flow

```
Dashboard → Module Selection → ModulePage
                                    ↓
                              Section Reading
                                    ↓
                              Video Watching
                                    ↓
                              Note Taking
                                    ↓
                              Quiz Taking
                                    ↓
                              Progress Update
```

### Admin Module Creation Flow

```
AdminModules → AIModuleGenerator → Generation Config
                                          ↓
                                   Generation Progress
                                          ↓
                                   Module Preview
                                          ↓
                                   ModuleEditor
                                          ↓
                                   Save to Context
```

---

## Styling Patterns

### Tailwind CSS Classes

**Common Button Styles:**
- `btn-primary`: Primary action buttons
- `btn-secondary`: Secondary action buttons
- `card`: Content card containers

**Layout Classes:**
- `container mx-auto px-4`: Standard container
- `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3`: Responsive grid
- `flex items-center justify-between`: Flex layouts

**Color Scheme:**
- Primary: `primary-{50-900}` (purple shades)
- Gray: `gray-{50-900}` (neutral colors)
- Success: `green-{500-700}`
- Error: `red-{500-700}`

### Component-Specific Styles

**Navigation Active State:**
```css
bg-primary-50 text-primary-700
```

**Card Hover Effects:**
```css
hover:shadow-lg transition-shadow duration-200
```

**Form Input Focus:**
```css
focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
```

---

## Accessibility Features

### ARIA Labels and Roles

- Navigation uses semantic `<nav>` elements
- Form inputs have associated labels
- Interactive elements have hover/focus states
- Color contrast meets WCAG AA standards

### Keyboard Navigation

- Tab order follows logical flow
- Modal dialogs trap focus
- Escape key closes modals
- Enter key submits forms

### Screen Reader Support

- Meaningful alt text for images
- Descriptive link text
- Status messages announced
- Form validation errors associated with inputs

---

## Responsive Design Patterns

### Breakpoints

- **Mobile**: Default (< 640px)
- **Tablet**: `sm:` (≥ 640px)
- **Desktop**: `md:` (≥ 768px)
- **Large**: `lg:` (≥ 1024px)

### Responsive Components

**Navigation:**
- Mobile: Icon-only menu items
- Desktop: Full text labels

**Module Grid:**
- Mobile: Single column
- Tablet: 2 columns
- Desktop: 3 columns

**Mind Map:**
- Mobile: Simplified controls
- Desktop: Full control panel

---

## Best Practices

### Component Design

1. **Single Responsibility**: Each component has one clear purpose
2. **Props Interface**: All props are typed with TypeScript
3. **Default Props**: Sensible defaults for optional props
4. **Error Boundaries**: Graceful error handling

### State Management

1. **Local State**: Component-specific state stays local
2. **Context**: Shared state uses React Context
3. **LocalStorage**: Persistent data synced with localStorage
4. **Optimistic Updates**: UI updates before async operations

### Performance

1. **Lazy Loading**: Routes are code-split
2. **Memoization**: Complex calculations are memoized
3. **Debouncing**: Search and filter inputs are debounced
4. **Virtual Scrolling**: Long lists use virtualization

### Code Organization

1. **File Structure**: Components grouped by feature
2. **Import Order**: External → Internal → Types → Styles
3. **Naming Convention**: PascalCase for components, camelCase for functions
4. **Documentation**: JSDoc comments for complex logic

---

## Component Testing Guidelines

### Unit Testing

- Test props and state changes
- Test user interactions
- Test error states
- Mock external dependencies

### Integration Testing

- Test component communication
- Test routing behavior
- Test context updates
- Test localStorage sync

### Accessibility Testing

- Test keyboard navigation
- Test screen reader announcements
- Test color contrast
- Test focus management

---

This component reference serves as a comprehensive guide to all React components in the Jung Edu App. Each component is designed with reusability, accessibility, and performance in mind, following React and TypeScript best practices.