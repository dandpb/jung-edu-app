# Module Generation Service

The **Module Generation Service** is the central integration point for creating comprehensive educational modules about Jungian psychology. It orchestrates all other services to generate complete learning experiences.

## Overview

This service unifies:
- **Module Structure Generation** - Creates the base educational module
- **Mind Map Generation** - Visual concept mapping with React Flow
- **Quiz Generation** - Interactive assessments with explanations
- **Video Enrichment** - Educational video discovery and integration
- **Bibliography Generation** - Academic references and citations
- **Difficulty Analysis** - Automatic content level detection

## Quick Start

```typescript
import { UnifiedModuleGenerator } from './services/moduleGeneration';

const generator = new UnifiedModuleGenerator();

// Quick module with essential components
const quickModule = await generator.generateQuickModule('Shadow Integration');

// Comprehensive study module
const studyModule = await generator.generateStudyModule('Collective Unconscious');

// Research-focused module
const researchModule = await generator.generateResearchModule('Synchronicity Theory');
```

## Usage Examples

### 1. Complete Module Generation

```typescript
const config: ModuleGenerationConfig = {
  topic: 'Individuation Process',
  difficulty: 'intermediate',
  targetAudience: 'psychology students',
  includeVideos: true,
  includeQuiz: true,
  includeBibliography: true,
  quizQuestions: 10,
  maxVideos: 5
};

const module = await generator.generateCompleteModule(config);

// Access generated components
console.log(module.module);      // Base module structure
console.log(module.mindMap);     // React Flow nodes and edges
console.log(module.quiz);        // Enhanced quiz with explanations
console.log(module.videos);      // Enriched video resources
console.log(module.bibliography); // Academic references
```

### 2. Custom Component Selection

```typescript
// Generate only specific components
const customModule = await generator.generateCustomModule(
  'Dream Analysis',
  {
    module: true,
    mindMap: true,
    quiz: false,
    videos: true,
    bibliography: false
  }
);
```

### 3. Using the LLM Orchestrator

```typescript
import { LLMOrchestrator } from './services/llm/orchestrator';

const orchestrator = new LLMOrchestrator();

// Generate individual components
const module = await orchestrator.generateModule({
  topic: 'Archetypes',
  difficulty: 'beginner'
});

const quiz = await orchestrator.generateQuiz({
  topic: 'Shadow Work',
  numberOfQuestions: 15
});

const bibliography = await orchestrator.generateBibliography({
  topic: 'Anima and Animus',
  count: 20
});
```

## Configuration Options

### ModuleGenerationConfig

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `topic` | string | The main subject of the module | Required |
| `difficulty` | 'beginner' \| 'intermediate' \| 'advanced' | Content complexity level | Auto-detected |
| `targetAudience` | string | Who the module is for | 'general learners' |
| `includeVideos` | boolean | Generate video resources | true |
| `includeQuiz` | boolean | Generate interactive quiz | true |
| `includeBibliography` | boolean | Generate academic references | true |
| `language` | string | Content language | 'en' |
| `maxVideos` | number | Maximum videos to include | 5 |
| `quizQuestions` | number | Number of quiz questions | 10 |

## Generated Module Structure

```typescript
interface GeneratedModule {
  module: {
    id: string;
    title: string;
    description: string;
    objectives: string[];
    duration: number;
    targetAudience: string;
    metadata: {
      difficulty: string;
      tags: string[];
      jungianConcepts: string[];
    };
  };
  
  mindMap?: {
    nodes: Node[];
    edges: Edge[];
  };
  
  quiz?: {
    questions: Question[];
    passingScore: number;
    timeLimit: number;
  };
  
  videos?: VideoResource[];
  
  bibliography?: Reference[];
  
  metadata: {
    generatedAt: Date;
    difficulty: string;
    topic: string;
    componentsIncluded: string[];
  };
}
```

## Preset Configurations

### Quick Module
- 5 quiz questions
- 3 videos maximum
- Includes mind map
- Skips bibliography
- Fast generation time

### Study Module
- 15 quiz questions
- 10 videos maximum
- Full bibliography
- Comprehensive mind map
- All components included

### Research Module
- Advanced difficulty
- Focus on bibliography
- Detailed mind map
- No quiz or videos
- Academic oriented

## Integration with Services

The module generator seamlessly integrates with:

1. **Mind Map Service** - Creates visual concept hierarchies
2. **Quiz Service** - Generates and enhances assessments
3. **Video Service** - Searches and enriches video content
4. **Bibliography Service** - Creates and enriches references
5. **LLM Service** - Orchestrates AI-powered generation

## Advanced Features

### Difficulty Auto-Detection

```typescript
// Difficulty is automatically analyzed if not provided
const module = await generator.generateCompleteModule({
  topic: 'Basic Jungian Concepts' // Will detect as 'beginner'
});
```

### Progress Monitoring

```typescript
const orchestrator = new ModuleGenerationOrchestrator();

orchestrator.on('progress', (progress) => {
  console.log(`${progress.stage}: ${progress.progress}% - ${progress.message}`);
});

const result = await orchestrator.generateModule(options);
```

### Error Handling

```typescript
try {
  const module = await generator.generateCompleteModule(config);
} catch (error) {
  if (error.message.includes('API')) {
    // Handle API errors
  } else if (error.message.includes('timeout')) {
    // Handle timeout errors
  }
}
```

## Testing

Run the integration tests:

```bash
npm test -- src/services/moduleGeneration/__tests__/integration.test.ts
```

Run the demo:

```bash
npx ts-node src/services/moduleGeneration/demo.ts
```

## Best Practices

1. **Component Selection**: Only include components relevant to your use case
2. **Difficulty Levels**: Let auto-detection handle difficulty when unsure
3. **Performance**: Generate fewer components for faster results
4. **Caching**: Results are not cached - save important outputs
5. **Error Recovery**: Handle individual component failures gracefully

## API Rate Limits

The service respects API rate limits:
- Content generation: ~5000 tokens
- Quiz generation: ~3000 tokens
- Video search: Limited by YouTube API
- Bibliography: ~2000 tokens

## Future Enhancements

- [ ] Multi-language support
- [ ] Custom templates
- [ ] Progress persistence
- [ ] Batch generation
- [ ] Export formats (PDF, SCORM)
- [ ] Analytics dashboard