# 🔌 jaqEdu API Reference

## Overview

jaqEdu's API is built using a service-oriented architecture with TypeScript. This reference covers all available services, their methods, and usage examples.

## 📋 Table of Contents

- [Authentication Service](#authentication-service)
- [Module Service](#module-service)
- [Quiz Service](#quiz-service)
- [User Progress Service](#user-progress-service)
- [LLM Service](#llm-service)
- [Mind Map Service](#mind-map-service)
- [Video Service](#video-service)
- [Bibliography Service](#bibliography-service)

## 🔐 Authentication Service

### Overview
Handles user authentication, session management, and authorization.

### Service Location
`/src/services/auth/authService.ts`

### Methods

#### `login(credentials: LoginCredentials): Promise<AuthResponse>`
Authenticates a user and returns access tokens.

**Parameters:**
```typescript
interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}
```

**Response:**
```typescript
interface AuthResponse {
  success: boolean;
  user?: User;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
}
```

**Example:**
```typescript
const authService = AuthService.getInstance();
const response = await authService.login({
  username: 'john_doe',
  password: 'secure_password',
  rememberMe: true
});
```

#### `register(userData: RegisterData): Promise<AuthResponse>`
Creates a new user account.

**Parameters:**
```typescript
interface RegisterData {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}
```

#### `logout(): Promise<void>`
Terminates the current user session.

#### `refreshToken(refreshToken: string): Promise<TokenResponse>`
Refreshes an expired access token.

#### `resetPassword(email: string): Promise<void>`
Initiates password reset process.

#### `verifyPasswordResetToken(token: string): Promise<boolean>`
Validates a password reset token.

#### `updatePassword(token: string, newPassword: string): Promise<void>`
Updates user password using reset token.

## 📚 Module Service

### Overview
Manages educational modules and content.

### Service Location
`/src/services/modules/moduleService.ts`

### Methods

#### `getModules(): Promise<Module[]>`
Retrieves all available modules.

**Response:**
```typescript
interface Module {
  id: string;
  title: string;
  description: string;
  content: ModuleContent;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration_minutes: number;
  prerequisites: string[];
  tags: string[];
  is_published: boolean;
  created_at: Date;
  updated_at: Date;
}
```

#### `getModuleById(id: string): Promise<Module>`
Retrieves a specific module by ID.

#### `createModule(moduleData: CreateModuleDto): Promise<Module>`
Creates a new module (requires instructor/admin role).

**Parameters:**
```typescript
interface CreateModuleDto {
  title: string;
  description: string;
  content: ModuleContent;
  difficulty: ModuleDifficulty;
  duration_minutes?: number;
  prerequisites?: string[];
  tags?: string[];
}
```

#### `updateModule(id: string, updates: Partial<Module>): Promise<Module>`
Updates an existing module.

#### `deleteModule(id: string): Promise<void>`
Deletes a module (admin only).

#### `publishModule(id: string): Promise<Module>`
Publishes a module for student access.

## ❓ Quiz Service

### Overview
Handles quiz generation, management, and scoring.

### Service Location
`/src/services/quiz/enhancedQuizGenerator.ts`

### Methods

#### `generateQuiz(moduleContent: string, options?: QuizOptions): Promise<Quiz>`
Generates a quiz using AI based on module content.

**Parameters:**
```typescript
interface QuizOptions {
  questionCount?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  questionTypes?: QuestionType[];
  language?: string;
}
```

**Response:**
```typescript
interface Quiz {
  id: string;
  title: string;
  questions: Question[];
  passing_score: number;
  time_limit_minutes?: number;
}

interface Question {
  id: string;
  text: string;
  type: 'multiple_choice' | 'true_false' | 'essay';
  options?: string[];
  correct_answer: string | number;
  explanation: string;
  points: number;
}
```

#### `submitQuizAttempt(quizId: string, answers: QuizAnswers): Promise<QuizResult>`
Submits and scores a quiz attempt.

**Parameters:**
```typescript
interface QuizAnswers {
  [questionId: string]: string | number;
}
```

**Response:**
```typescript
interface QuizResult {
  score: number;
  passed: boolean;
  correctAnswers: number;
  totalQuestions: number;
  feedback: QuestionFeedback[];
}
```

#### `enhanceQuiz(quiz: Quiz): Promise<Quiz>`
Enhances an existing quiz with better questions and explanations.

## 📊 User Progress Service

### Overview
Tracks and manages user learning progress.

### Service Location
`/src/hooks/useProgress.tsx`

### Methods

#### `getUserProgress(userId: string): Promise<UserProgress[]>`
Retrieves user progress across all modules.

**Response:**
```typescript
interface UserProgress {
  userId: string;
  moduleId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progressPercentage: number;
  timeSpentMinutes: number;
  lastAccessed: Date;
  completedAt?: Date;
  quizAttempts: QuizAttempt[];
}
```

#### `updateProgress(moduleId: string, progress: ProgressUpdate): Promise<void>`
Updates user progress for a specific module.

**Parameters:**
```typescript
interface ProgressUpdate {
  progressPercentage?: number;
  timeSpentMinutes?: number;
  status?: ProgressStatus;
  quizAttempt?: QuizAttempt;
}
```

#### `getProgressSummary(userId: string): Promise<ProgressSummary>`
Gets overall progress summary for a user.

**Response:**
```typescript
interface ProgressSummary {
  totalModules: number;
  completedModules: number;
  inProgressModules: number;
  totalTimeSpent: number;
  completionPercentage: number;
  achievements: Achievement[];
}
```

## 🤖 LLM Service

### Overview
Manages AI/LLM integration for content generation.

### Service Location
`/src/services/llm/provider.ts`

### Methods

#### `generateContent(prompt: string, options?: LLMOptions): Promise<string>`
Generates content using the configured LLM provider.

**Parameters:**
```typescript
interface LLMOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  provider?: 'openai' | 'anthropic' | 'google';
}
```

#### `generateModule(topic: string, config: ModuleConfig): Promise<GeneratedModule>`
Generates a complete educational module.

**Parameters:**
```typescript
interface ModuleConfig {
  difficulty: ModuleDifficulty;
  includeQuiz?: boolean;
  includeVideos?: boolean;
  language?: string;
  targetAudience?: string;
}
```

#### `enhanceContent(content: string, enhancementType: string): Promise<string>`
Enhances existing content with AI.

**Enhancement Types:**
- `'clarity'` - Improves readability
- `'examples'` - Adds practical examples
- `'summary'` - Creates concise summary
- `'expand'` - Adds more detail

## 🧠 Mind Map Service

### Overview
Generates and manages interactive mind maps.

### Service Location
`/src/services/mindmap/mindMapGenerator.ts`

### Methods

#### `generateMindMap(moduleId: string): Promise<MindMapData>`
Generates a mind map for a module.

**Response:**
```typescript
interface MindMapData {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
  layout: 'tree' | 'radial' | 'force' | 'hierarchical';
}

interface MindMapNode {
  id: string;
  label: string;
  type: 'concept' | 'module' | 'topic';
  position: { x: number; y: number };
  data: {
    description?: string;
    moduleId?: string;
    color?: string;
  };
}
```

#### `saveMindMap(mindMapData: MindMapData): Promise<string>`
Saves a user-created mind map.

#### `getMindMap(id: string): Promise<MindMapData>`
Retrieves a saved mind map.

## 🎥 Video Service

### Overview
Manages video content and YouTube integration.

### Service Location
`/src/services/video/youtubeService.ts`

### Methods

#### `searchVideos(query: string, options?: VideoSearchOptions): Promise<Video[]>`
Searches for educational videos.

**Parameters:**
```typescript
interface VideoSearchOptions {
  maxResults?: number;
  language?: string;
  duration?: 'short' | 'medium' | 'long';
  relevanceLanguage?: string;
}
```

**Response:**
```typescript
interface Video {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnailUrl: string;
  duration: number;
  channelName: string;
  publishedAt: Date;
}
```

#### `getVideoDetails(videoId: string): Promise<VideoDetails>`
Gets detailed information about a video.

#### `getVideoTranscript(videoId: string): Promise<string>`
Retrieves video transcript if available.

## 📖 Bibliography Service

### Overview
Manages academic references and resources.

### Service Location
`/src/services/bibliography/bibliographyEnricher.ts`

### Methods

#### `enrichBibliography(moduleId: string): Promise<Bibliography[]>`
Automatically suggests relevant bibliography.

**Response:**
```typescript
interface Bibliography {
  id: string;
  title: string;
  authors: string[];
  publicationYear: number;
  sourceType: 'book' | 'article' | 'website' | 'video';
  sourceUrl?: string;
  description?: string;
  relevanceScore?: number;
}
```

#### `addBibliography(moduleId: string, entry: BibliographyEntry): Promise<Bibliography>`
Adds a bibliography entry to a module.

#### `searchReferences(query: string, filters?: ReferenceFilters): Promise<Bibliography[]>`
Searches for academic references.

**Parameters:**
```typescript
interface ReferenceFilters {
  sourceType?: SourceType;
  yearRange?: { start: number; end: number };
  authors?: string[];
  language?: string;
}
```

## 🔒 Error Handling

All services follow a consistent error handling pattern:

```typescript
try {
  const result = await service.method(params);
  // Handle success
} catch (error) {
  if (error instanceof AuthError) {
    // Handle authentication errors
  } else if (error instanceof ValidationError) {
    // Handle validation errors
  } else if (error instanceof NetworkError) {
    // Handle network errors
  } else {
    // Handle unexpected errors
  }
}
```

### Common Error Types

```typescript
class AuthError extends Error {
  constructor(
    public type: 'INVALID_CREDENTIALS' | 'TOKEN_EXPIRED' | 'UNAUTHORIZED',
    message: string
  ) {
    super(message);
  }
}

class ValidationError extends Error {
  constructor(
    public field: string,
    public constraint: string,
    message: string
  ) {
    super(message);
  }
}

class NetworkError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
  }
}
```

## 🔑 Authentication Headers

Most API calls require authentication. Include the access token in headers:

```typescript
const headers = {
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
};
```

## 📈 Rate Limiting

API calls are rate-limited to prevent abuse:

- **Authenticated users**: 1000 requests per hour
- **Unauthenticated users**: 100 requests per hour
- **AI generation endpoints**: 50 requests per hour

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1628856000
```

## 🌐 CORS Configuration

The API supports CORS for web applications:

```typescript
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
```

---

*For implementation examples and integration guides, see the [Development Guide](./DEVELOPMENT_GUIDE.md).*