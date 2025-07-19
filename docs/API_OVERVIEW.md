# jaqEdu API Overview

## Introduction

The jaqEdu platform provides a comprehensive set of APIs for creating educational content focused on Jungian psychology. The API is organized into several service layers that work together to generate complete educational modules.

## Architecture Overview

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

## Core Services

### 1. LLM Orchestration (`/services/llm`)

The foundation layer that manages AI-powered content generation.

**Key Components:**
- `ModuleGenerationOrchestrator` - Coordinates all content generation
- `LLMProvider` interface - Abstraction for different AI providers
- `ConfigManager` - Centralized configuration management
- `RateLimiter` - API rate limit management

**Features:**
- Multi-provider support (OpenAI, Mock, extensible)
- Automatic retry with exponential backoff
- Token usage tracking and optimization
- Progress event emission
- Structured JSON response parsing

### 2. Module Generation (`/services/moduleGeneration`)

High-level service that creates complete educational modules.

**Key Components:**
- `UnifiedModuleGenerator` - Simplified interface for module creation
- Pre-configured generation profiles (Quick, Study, Research)
- Component selection (videos, quiz, bibliography, mind map)

**Features:**
- One-call module generation
- Automatic difficulty analysis
- Component orchestration
- Metadata enrichment

### 3. Quiz Services (`/services/quiz`)

Advanced quiz generation with educational enhancements.

**Key Components:**
- `EnhancedQuizGenerator` - Template-based quiz creation
- `QuizEnhancer` - Adds explanations and hints
- `QuizValidator` - Ensures quiz quality
- Question templates for Jungian concepts

**Features:**
- Multiple question types (MC, T/F, Essay, Matching)
- Adaptive difficulty
- Bloom's taxonomy alignment
- Detailed explanations
- Study guide generation

### 4. Video Services (`/services/video`)

Educational video discovery and enrichment.

**Key Components:**
- `VideoEnricher` - Adds educational metadata
- `YouTubeService` - YouTube API integration
- Educational value scoring

**Features:**
- Educational content filtering
- Difficulty assessment
- Timestamp generation
- Learning outcome extraction
- Concept mapping

### 5. Bibliography Services (`/services/bibliography`)

Academic reference management for Jungian literature.

**Key Components:**
- `BibliographyEnricher` - Enhanced reference search
- `ReferenceDatabase` - Curated Jung bibliography
- Citation formatters (APA, MLA, Chicago)

**Features:**
- 500+ curated Jung references
- Multi-format citations
- Reading path generation
- Difficulty-based filtering
- Concept-based search

### 6. Mind Map Services (`/services/mindmap`)

Visual concept mapping for educational content.

**Key Components:**
- `MindMapGenerator` - Creates hierarchical concept maps
- `MindMapLayouts` - Multiple layout algorithms
- `ReactFlowAdapter` - React Flow integration

**Features:**
- Automatic concept extraction
- Jungian archetype categorization
- Multiple layout options
- React Flow compatibility
- Depth control

## API Patterns

### 1. Async/Await Pattern

All API methods are asynchronous and return Promises:

```typescript
const result = await orchestrator.generateModule(options);
```

### 2. Event-Driven Progress

Long-running operations emit progress events:

```typescript
orchestrator.on('progress', (progress) => {
  console.log(`${progress.progress}% - ${progress.message}`);
});
```

### 3. Error Handling

Consistent error types across all services:

```typescript
try {
  const result = await service.method();
} catch (error) {
  if (error instanceof LLMProviderError) {
    // Handle provider errors
  } else if (error instanceof ValidationError) {
    // Handle validation errors
  }
}
```

### 4. Configuration

Centralized configuration management:

```typescript
ConfigManager.getInstance().updateConfig({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4o-mini'
});
```

## Common Use Cases

### 1. Creating a Complete Course Module

```typescript
const generator = new UnifiedModuleGenerator();
const module = await generator.generateCompleteModule({
  topic: 'Shadow Work',
  difficulty: 'intermediate',
  includeVideos: true,
  includeQuiz: true,
  includeMindMap: true,
  includeBibliography: true
});
```

### 2. Generating an Assessment

```typescript
const quizGen = new EnhancedQuizGenerator(provider);
const quiz = await quizGen.generateEnhancedQuiz(
  moduleId,
  topic,
  content,
  objectives,
  15, // questions
  { enhanceQuestions: true }
);
```

### 3. Building a Reading List

```typescript
const enricher = new BibliographyEnricher();
const readingPath = await enricher.generateReadingPath(
  'Jungian Psychology',
  'beginner'
);
```

### 4. Creating Visual Learning Materials

```typescript
const mindMapGen = new MindMapGenerator();
const mindMap = await mindMapGen.generateFromModule(module);
const { nodes, edges } = adapter.toReactFlow(mindMap);
```

## Performance Considerations

### Token Usage

- Estimate tokens before generation: `estimateTokenUsage()`
- Monitor usage with rate limiter
- Implement caching for repeated requests

### Optimization Strategies

1. **Batch Operations**: Process multiple items together
2. **Caching**: Use LRU cache for frequently accessed content
3. **Progressive Loading**: Stream large content
4. **Fallback Strategies**: Graceful degradation when services fail

### Rate Limiting

Built-in rate limiting prevents API overuse:

```typescript
const rateLimiter = new RateLimiter({
  maxRequestsPerMinute: 20,
  maxTokensPerMinute: 40000
});
```

## Security Best Practices

1. **API Key Management**
   - Store keys in environment variables
   - Never commit keys to version control
   - Rotate keys regularly

2. **Input Validation**
   - All inputs are validated before processing
   - SQL injection prevention in bibliography service
   - XSS prevention in generated content

3. **Error Handling**
   - Sensitive information is never exposed in errors
   - Detailed logging for debugging
   - User-friendly error messages

## Testing

### Mock Provider

Development and testing without API calls:

```typescript
const mockProvider = new MockLLMProvider();
const orchestrator = new ModuleGenerationOrchestrator(false);
```

### Integration Tests

Located in `__tests__` directories:
- Provider parsing tests
- Service integration tests
- End-to-end workflow tests

## Extending the API

### Adding a New Provider

1. Implement the `ILLMProvider` interface
2. Add to `LLMProviderFactory`
3. Update configuration options

```typescript
export class CustomProvider implements ILLMProvider {
  async generateCompletion(prompt: string, options?: LLMGenerationOptions): Promise<string> {
    // Custom implementation
  }
  // ... other required methods
}
```

### Creating New Generators

1. Extend base generator class
2. Implement generation logic
3. Integrate with orchestrator

```typescript
export class CustomGenerator extends BaseGenerator {
  async generate(options: CustomOptions): Promise<CustomResult> {
    // Generation logic
  }
}
```

## API Versioning

Current version: **2.0.0**

### Version History

- **2.0.0** - Full service integration, mind maps, enhanced quiz
- **1.5.0** - Bibliography service, video enrichment
- **1.0.0** - Initial release with basic generation

### Breaking Changes

See [CHANGELOG.md](./CHANGELOG.md) for breaking changes between versions.

## Support and Resources

### Documentation

- [API Reference](./API_REFERENCE.md) - Detailed API documentation
- [Usage Examples](./API_USAGE_EXAMPLES.md) - Practical examples
- [TypeScript Types](./types/index.ts) - Type definitions

### Getting Help

- GitHub Issues: Report bugs and request features
- Documentation: Comprehensive guides and references
- Examples: Sample implementations

## Quick Start

```typescript
// 1. Install dependencies
npm install @jaqedu/api

// 2. Configure
import { ConfigManager } from '@jaqedu/api';
ConfigManager.getInstance().updateConfig({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY
});

// 3. Generate content
import { UnifiedModuleGenerator } from '@jaqedu/api';
const generator = new UnifiedModuleGenerator();
const module = await generator.generateQuickModule('Shadow Work');

// 4. Use the content
console.log(module.module.title);
console.log(module.quiz.questions.length);
console.log(module.mindMap.nodes.length);
```

## Roadmap

### Upcoming Features

- **v2.1.0** - Real-time collaboration support
- **v2.2.0** - Multi-language content generation
- **v2.3.0** - Advanced analytics and insights
- **v3.0.0** - Plugin architecture for extensions

### Community Contributions

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

This API is part of the jaqEdu platform. See [LICENSE](./LICENSE) for details.