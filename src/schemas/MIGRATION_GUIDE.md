# Module Schema Migration Guide

## Overview

This guide helps migrate from the existing module structure to the new comprehensive `EducationalModule` schema.

## Key Changes

### 1. Module Structure Changes

#### Old Structure:
```typescript
interface Module {
  id: string;
  title: string;
  description: string;
  icon: string;
  content: ModuleContent;
  prerequisites?: string[];
  estimatedTime: number; // minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}
```

#### New Structure:
```typescript
interface EducationalModule {
  id: string;
  title: string;
  description: string;
  content: ModuleContent;
  videos: Video[];        // Now required at module level
  quiz: Quiz;             // Now required (was optional)
  bibliography: Bibliography[];
  filmReferences: FilmReference[];  // Renamed from 'films'
  tags: string[];         // NEW: Required tags
  difficultyLevel: DifficultyLevel; // Renamed from 'difficulty'
  timeEstimate: TimeEstimate;       // Changed from number to object
  metadata: ModuleMetadata;         // NEW: Required metadata
  prerequisites?: string[];
  learningObjectives?: string[];   // NEW: Optional field
  icon?: string;          // Now optional
}
```

### 2. Time Representation

#### Old:
```typescript
estimatedTime: 90  // minutes as number
```

#### New:
```typescript
timeEstimate: {
  hours: 1,
  minutes: 30,
  description: "Including videos and exercises"
}
```

### 3. Video Structure Enhanced

#### Old:
```typescript
interface Video {
  id: string;
  title: string;
  youtubeId: string;
  description: string;
  duration: number;  // minutes
}
```

#### New:
```typescript
interface Video {
  id: string;
  title: string;
  url: string;       // More flexible than youtubeId
  duration: {        // Object instead of number
    hours: number;
    minutes: number;
    seconds: number;
  };
  description: string;
  thumbnail?: string;
  transcript?: string;
  captions?: Caption[];
  chapters?: VideoChapter[];
  platform?: VideoPlatform;
  embedCode?: string;
}
```

### 4. Quiz Question Types

#### Old:
```typescript
interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}
```

#### New (Multiple Types):
```typescript
type Question = MultipleChoiceQuestion | TrueFalseQuestion | OpenEndedQuestion;

// Each type has specific properties
interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple-choice';
  options: Option[];  // Rich option objects
  correctAnswers: number[];  // Support multiple correct
  allowMultiple: boolean;
}
```

### 5. Mind Maps (New Feature)


### 6. Enhanced Bibliography

#### Old:
```typescript
interface Bibliography {
  id: string;
  title: string;
  author: string;
  year: number;
  type: 'book' | 'article' | 'journal';
  url?: string;
}
```

#### New:
```typescript
interface Bibliography {
  id: string;
  title: string;
  authors: string[];  // Array for multiple authors
  year: number;
  type: PublicationType;  // Extended enum
  publisher?: string;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  isbn?: string;
  url?: string;
  abstract?: string;
  tags?: string[];
  relevanceNote?: string;
}
```

## Migration Steps

### Step 1: Update Type Imports

```typescript
// Old
import { Module, ModuleContent, Video, Quiz } from '../types';

// New
import { 
  EducationalModule, 
  ModuleContent, 
  Video, 
  Quiz,
  DifficultyLevel,
  ModuleStatus,
  Bibliography,
  FilmReference 
} from '../schemas/module.schema';
```

### Step 2: Update Module Creation

```typescript
// Migration function example
function migrateModule(oldModule: Module): EducationalModule {
  const now = new Date().toISOString();
  
  return {
    ...oldModule,
    // Rename fields
    difficultyLevel: oldModule.difficulty as DifficultyLevel,
    
    // Convert time
    timeEstimate: {
      hours: Math.floor(oldModule.estimatedTime / 60),
      minutes: oldModule.estimatedTime % 60,
      description: `Estimated time: ${oldModule.estimatedTime} minutes`
    },
    
    // Add required fields
    videos: oldModule.content.videos || [],
    quiz: oldModule.content.quiz || createDefaultQuiz(),
    bibliography: oldModule.content.bibliography || [],
    filmReferences: oldModule.content.films?.map(migrateFilm) || [],
    tags: generateTags(oldModule),
    
    // Add metadata
    metadata: {
      createdAt: now,
      updatedAt: now,
      version: "1.0.0",
      author: {
        id: "system",
        name: "System Migration",
        role: "System"
      },
      status: ModuleStatus.PUBLISHED,
      language: "en"
    },
    
    // Optional fields
    learningObjectives: [],
    icon: oldModule.icon || undefined
  };
}
```

### Step 3: Update Video References

```typescript
function migrateVideo(oldVideo: any): Video {
  return {
    ...oldVideo,
    url: oldVideo.youtubeId 
      ? `https://www.youtube.com/watch?v=${oldVideo.youtubeId}`
      : oldVideo.url,
    duration: {
      hours: Math.floor(oldVideo.duration / 60),
      minutes: oldVideo.duration % 60,
      seconds: 0
    },
    platform: oldVideo.youtubeId ? 'youtube' : 'custom'
  };
}
```

### Step 4: Update Quiz Questions

```typescript
function migrateQuestion(oldQuestion: any): Question {
  // Detect question type based on structure
  if (oldQuestion.options && oldQuestion.correctAnswer !== undefined) {
    return {
      ...oldQuestion,
      type: 'multiple-choice',
      points: 10,  // Default points
      options: oldQuestion.options.map((text: string, index: number) => ({
        id: index,
        text,
        isCorrect: index === oldQuestion.correctAnswer,
        feedback: index === oldQuestion.correctAnswer 
          ? "Correct!" 
          : "Try again."
      })),
      correctAnswers: [oldQuestion.correctAnswer],
      allowMultiple: false
    };
  }
  // Handle other types...
}
```

### Step 5: Add Validation

```typescript
import { validateEducationalModule } from '../schemas/module.validator';

// Before saving
const validationResult = validateEducationalModule(newModule);
if (!validationResult.isValid) {
  console.error('Validation errors:', validationResult.errors);
  // Handle errors
}
```

## Component Updates

### ModuleEditor Component

Update to handle new fields:

```typescript
// Add new form sections for:
- timeEstimate (hours/minutes inputs)
- tags (tag input component)
- metadata (author info, status)
- Enhanced quiz editor for multiple question types
```

### Module Display Components

Update to render new data:

```typescript
// Update ModulePage to display:
- Time estimate in hours/minutes format
- Tags
- Mind maps
- Enhanced video player with chapters
- Rich quiz interface
```

## Database Schema Updates

If using a database, update schema to accommodate:

1. New required fields
2. Changed data types (e.g., timeEstimate object)
3. New relationships (mind maps, enhanced quiz structure)

## Testing Updates

Update tests to use new schema:

```typescript
import { generateModuleTemplate } from '../schemas/module.validator';

// Use template for test data
const testModule = generateModuleTemplate({
  title: "Test Module",
  // Override specific fields
});
```

## Gradual Migration Strategy

1. **Phase 1**: Update type definitions, keep backward compatibility
2. **Phase 2**: Migrate data using migration functions
3. **Phase 3**: Update UI components
4. **Phase 4**: Remove old type definitions

## Validation Checklist

- [ ] All modules have required fields
- [ ] Time estimates converted to object format
- [ ] Videos have duration objects
- [ ] Quiz questions have proper types
- [ ] Metadata added to all modules
- [ ] Tags populated (at least one)
- [ ] Bibliography and film references migrated
- [ ] Mind maps added (can be empty array initially)

## Common Issues and Solutions

### Issue: Missing Required Fields
**Solution**: Use `generateModuleTemplate()` to get defaults

### Issue: Time Conversion
**Solution**: Use provided migration functions

### Issue: Quiz Type Detection
**Solution**: Check question structure to determine type

### Issue: Validation Errors
**Solution**: Use `validatePartialModule()` during migration

## Support

For questions about migration:
1. Check the example module in `module.example.ts`
2. Use TypeScript types for guidance
3. Validate with JSON schema