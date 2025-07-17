# Component Interaction Diagram

## Application Component Hierarchy

```
App.tsx (Root Component)
│
├── AdminProvider (Context Wrapper)
│   │
│   └── Router (React Router)
│       │
│       ├── Navigation (Global Navigation Bar)
│       │   ├── Links to all main pages
│       │   ├── User progress indicator
│       │   └── Admin access button
│       │
│       └── Routes
│           │
│           ├── Public Routes
│           │   ├── Dashboard
│           │   │   ├── Progress Overview Cards
│           │   │   └── Module Grid
│           │   │       └── Module Cards (with completion status)
│           │   │
│           │   ├── ModulePage
│           │   │   ├── Module Content Sections
│           │   │   ├── VideoPlayer Component
│           │   │   ├── QuizComponent
│           │   │   └── NoteEditor Component
│           │   │
│           │   ├── MindMapPage
│           │   │   └── ReactFlow Diagram
│           │   │       ├── Concept Nodes
│           │   │       └── Relationship Edges
│           │   │
│           │   ├── NotesPage
│           │   │   ├── Notes List
│           │   │   └── Note Editor
│           │   │
│           │   ├── ProgressPage
│           │   │   ├── Overall Statistics
│           │   │   ├── Module Progress List
│           │   │   └── Quiz Score Summary
│           │   │
│           │   ├── BibliographyPage
│           │   │   ├── Book References
│           │   │   └── Film References
│           │   │
│           │   └── SearchPage
│           │       ├── Search Input
│           │       └── Results List
│           │
│           └── Protected Routes (Admin)
│               ├── AdminLogin
│               │   └── Login Form
│               │
│               ├── AdminDashboard
│               │   ├── System Overview
│               │   └── Quick Actions
│               │
│               ├── AdminModules
│               │   ├── Module List
│               │   ├── ModuleEditor
│               │   └── QuizEditor
│               │
│               ├── AdminMindMap
│               │   └── Interactive Mind Map Editor
│               │
│               └── AdminResources
│                   ├── Bibliography Manager
│                   └── Film Resource Manager
```

## Data Flow Patterns

### User Progress Flow
```
User Action → Component State → App State → LocalStorage
                                    ↓
                              UserProgress Object
                                    ↓
                            Child Components (Props)
```

### Admin Content Management Flow
```
Admin Edit → AdminContext → LocalStorage → Module/MindMap Data
                  ↓                              ↓
            Update State                   Refresh UI
                  ↓
           Propagate to Components
```

### Component Communication Patterns

1. **Props Drilling**: UserProgress passed from App to child components
2. **Context API**: AdminContext for admin state management
3. **Local State**: Form inputs and UI state in individual components
4. **Side Effects**: useEffect hooks for localStorage synchronization

## Key Component Responsibilities

### App.tsx
- Root state management for user progress
- Route configuration
- Context provider setup

### Navigation.tsx
- Global navigation UI
- Active route highlighting
- Responsive menu handling

### Dashboard.tsx
- Module grid display
- Progress overview
- Module access control (prerequisites)

### ModulePage.tsx
- Content rendering
- Video playback coordination
- Quiz integration
- Note-taking interface

### AdminContext.tsx
- Admin authentication logic
- Content CRUD operations
- Session management

### MindMapPage.tsx
- React Flow integration
- Node/edge rendering
- Interactive navigation

## Component Testing Structure

```
Component
│
├── Component.tsx (Implementation)
├── __tests__/
│   └── Component.test.tsx (Unit tests)
└── Component.module.css (Styles, if applicable)
```

Each component follows a consistent testing pattern:
- Render testing
- User interaction testing
- Props validation
- State management verification