# Module Management Documentation

This document provides a comprehensive guide to creating, editing, and managing educational modules in the Jung Educational App.

## Overview

Modules are the core educational units in the app. Each module contains:
- Structured content sections
- Interactive elements
- Video resources
- Quiz assessments
- Bibliography references
- Learning objectives

## Module Structure

### Module Schema
```typescript
interface Module {
  id: string;
  title: string;
  description: string;
  icon?: string;
  content?: ModuleContent;
  sections?: Section[];
  prerequisites?: string[];
  learningObjectives?: string[];
  estimatedTime: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category?: string;
  quiz?: Quiz;
  practicalExercises?: Exercise[];
}
```

### Content Components

#### 1. Sections
Each module contains multiple sections:
```typescript
interface Section {
  id: string;
  title: string;
  content: string;
  order: number;
  keyTerms?: KeyTerm[];
  images?: Image[];
  concepts?: string[];
  interactiveElements?: any[];
  estimatedTime?: number;
}
```

#### 2. Key Terms
Important concepts with definitions:
```typescript
interface KeyTerm {
  term: string;
  definition: string;
}
```

#### 3. Quiz
Assessment component with questions:
```typescript
interface Quiz {
  id: string;
  title: string;
  questions: Question[];
  description?: string;
  passingScore?: number;
  timeLimit?: number;
}
```

## Creating Modules

### Manual Module Creation

1. **Access Module Manager**
   - Log in as admin
   - Navigate to `/admin/modules`
   - Click "Adicionar Módulo"

2. **Basic Information**
   - **Title**: Clear, descriptive module name
   - **Description**: Brief overview (150-200 characters)
   - **Icon**: Choose emoji or upload image
   - **Difficulty**: Select appropriate level
   - **Duration**: Estimated completion time in minutes
   - **Category**: Thematic grouping

3. **Content Creation**
   - **Introduction**: Hook and overview
   - **Sections**: Break content into logical parts
   - **Key Terms**: Define important concepts
   - **Summary**: Reinforce main points

4. **Learning Design**
   - **Objectives**: Clear, measurable goals
   - **Prerequisites**: Required prior knowledge
   - **Exercises**: Practical applications

### AI-Powered Module Generation

1. **Initiate AI Generation**
   ```
   Click "Gerar com IA" → Configure parameters
   ```

2. **Configuration Options**
   ```typescript
   interface AIGenerationConfig {
     topic: string;
     subtopics?: string[];
     difficulty: DifficultyLevel;
     targetAudience: string;
     estimatedDuration: number;
     includeVideos: boolean;
     includeQuiz: boolean;
     includeBibliography: boolean;
     jungianConcepts: string[];
     language: string;
   }
   ```

3. **Generation Process**
   - Content generation (40%)
   - Video search (15%)
   - Quiz creation (25%)
   - Bibliography compilation (15%)
   - Final validation (5%)

4. **Review and Edit**
   - Preview generated content
   - Edit sections as needed
   - Approve or regenerate parts
   - Save to module library

## Editing Modules

### Edit Interface
1. Click edit icon (✏️) on module card
2. Opens `ModuleEditor` component
3. All fields are editable
4. Real-time preview available

### Section Management
- **Add Section**: Click "+" button
- **Reorder**: Drag-and-drop handles
- **Delete**: Confirmation required
- **Duplicate**: Copy existing section

### Content Formatting
Supports Markdown formatting:
```markdown
# Heading 1
## Heading 2
**Bold text**
*Italic text*
- Bullet points
1. Numbered lists
[Links](url)
![Images](url)
```

### Media Integration
1. **Videos**
   - YouTube URL auto-embed
   - Custom video uploads
   - Timestamps for key moments

2. **Images**
   - Drag-and-drop upload
   - Alt text required
   - Automatic optimization

3. **Interactive Elements**
   - Embedded exercises
   - External tool integration
   - Progress tracking

## Quiz Management

### Creating Quizzes

#### Manual Creation
1. Add questions individually
2. Set correct answers
3. Provide explanations
4. Configure scoring

#### Automatic Generation
1. Click sparkle icon (✨)
2. AI analyzes module content
3. Generates relevant questions
4. Review and approve

### Question Types
- Multiple choice
- True/False
- Short answer
- Essay (manual grading)

### Quiz Configuration
```typescript
interface QuizConfig {
  passingScore: number;      // Default: 70%
  timeLimit?: number;        // In minutes
  randomizeQuestions: boolean;
  showExplanations: boolean;
  allowRetakes: boolean;
  maxAttempts?: number;
}
```

## Module Organization

### Categories
Group modules by theme:
- Fundamentals
- Archetypes
- Dreams & Symbols
- Individuation
- Psychological Types
- Advanced Concepts

### Prerequisites
Define learning paths:
```typescript
prerequisites: ['module-1', 'module-2']
```

### Difficulty Progression
- **Beginner**: Core concepts, 20-30 min
- **Intermediate**: Applications, 30-45 min
- **Advanced**: Deep analysis, 45-60 min

## Best Practices

### Content Guidelines
1. **Clear Structure**
   - Logical progression
   - Consistent formatting
   - Regular summaries

2. **Engagement**
   - Interactive elements every 5-7 minutes
   - Varied content types
   - Real-world examples

3. **Accessibility**
   - Simple language for complex ideas
   - Visual aids for abstract concepts
   - Multiple learning styles

### Quality Assurance
1. **Review Checklist**
   - [ ] Learning objectives clear
   - [ ] Content accurate and relevant
   - [ ] Quiz aligns with objectives
   - [ ] Media resources functional
   - [ ] Appropriate difficulty level

2. **Testing**
   - Complete module as student
   - Verify all links/media
   - Check quiz functionality
   - Time the experience

## Data Management

### Storage
- **Development**: localStorage
- **Production**: Supabase database

### Backup & Export
```bash
# Export all modules
npm run export:modules

# Import modules
npm run import:modules <file>
```

### Version Control
- Automatic versioning on save
- Change history tracking
- Rollback capability

## Troubleshooting

### Common Issues

1. **Module not saving**
   - Check browser console for errors
   - Verify localStorage space
   - Try clearing cache

2. **AI generation fails**
   - Verify API key configured
   - Check internet connection
   - Review error message

3. **Media not loading**
   - Confirm URLs are valid
   - Check CORS settings
   - Verify file formats

### Debug Tools
```javascript
// List all modules
const modules = JSON.parse(localStorage.getItem('jungAppModules'));
console.table(modules);

// Validate module structure
const validateModule = (module) => {
  // Validation logic
};

// Export specific module
const exportModule = (moduleId) => {
  // Export logic
};
```

## Advanced Features

### Multi-language Support
```typescript
interface MultilingualModule extends Module {
  translations: {
    [language: string]: {
      title: string;
      description: string;
      content: ModuleContent;
    }
  }
}
```

### Analytics Integration
- Completion rates
- Time per section
- Quiz performance
- User feedback

### Collaborative Editing
- Real-time updates
- Change tracking
- Comment system
- Approval workflow

## API Integration

### Module API Endpoints
```typescript
// Get all modules
GET /api/modules

// Get specific module
GET /api/modules/:id

// Create module
POST /api/modules

// Update module
PUT /api/modules/:id

// Delete module
DELETE /api/modules/:id
```

### Webhook Events
- `module.created`
- `module.updated`
- `module.published`
- `module.deleted`