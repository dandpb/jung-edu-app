# jaqEdu API Usage Examples

This document provides practical examples of using the jaqEdu APIs for common educational scenarios.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Module Generation Examples](#module-generation-examples)
3. [Quiz Creation Examples](#quiz-creation-examples)
4. [Video Integration Examples](#video-integration-examples)
5. [Bibliography Management Examples](#bibliography-management-examples)
6. [Mind Map Generation Examples](#mind-map-generation-examples)
7. [Complete Workflow Examples](#complete-workflow-examples)
8. [Error Handling Examples](#error-handling-examples)
9. [Performance Optimization](#performance-optimization)

---

## Getting Started

### Basic Setup

```typescript
import { 
  ModuleGenerationOrchestrator,
  ConfigManager,
  OpenAIProvider 
} from './services/llm';

// Configure the services
ConfigManager.getInstance().updateConfig({
  provider: 'openai',
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  model: 'gpt-4o-mini',
  rateLimit: {
    maxRequestsPerMinute: 20,
    maxTokensPerMinute: 40000
  }
});

// Initialize orchestrator
const orchestrator = new ModuleGenerationOrchestrator();
```

### Using Mock Provider for Development

```typescript
import { MockLLMProvider } from './services/llm/provider';

// Use mock provider for testing without API calls
const mockProvider = new MockLLMProvider();
const orchestrator = new ModuleGenerationOrchestrator(false); // false = use mock
```

---

## Module Generation Examples

### Basic Module Generation

```typescript
import { LLMOrchestrator } from './services/llm';

const orchestrator = new LLMOrchestrator();

// Generate a simple module
const module = await orchestrator.generateModule({
  topic: 'Introduction to Archetypes',
  targetAudience: 'Psychology students',
  difficulty: 'beginner'
});

console.log('Module:', module.title);
console.log('Sections:', module.content.sections.length);
```

### Complete Module with All Components

```typescript
import { ModuleGenerationOrchestrator } from './services/llm';

const orchestrator = new ModuleGenerationOrchestrator();

// Track progress
orchestrator.on('progress', (progress) => {
  console.log(`[${progress.stage}] ${progress.progress}% - ${progress.message}`);
});

// Generate comprehensive module
const result = await orchestrator.generateModule({
  topic: 'The Individuation Process',
  objectives: [
    'Understand the stages of individuation',
    'Recognize individuation symbols in dreams',
    'Apply individuation concepts to personal growth'
  ],
  targetAudience: 'Advanced psychology students',
  duration: 120, // 2 hours
  difficulty: 'advanced',
  includeVideos: true,
  includeBibliography: true,
  includeMindMap: true,
  quizQuestions: 20,
  videoCount: 8,
  bibliographyCount: 15,
  useRealServices: true
});

// Access generated components
const { module, content, quiz, videos, bibliography, mindMap } = result;
```

### Using the Unified Module Generator

```typescript
import { UnifiedModuleGenerator } from './services/moduleGeneration';

const generator = new UnifiedModuleGenerator();

// Quick module for introductory lesson
const quickModule = await generator.generateQuickModule('Shadow Work Basics');

// Comprehensive study module
const studyModule = await generator.generateStudyModule('Dream Analysis Techniques');

// Research-focused module
const researchModule = await generator.generateResearchModule('Synchronicity in Modern Psychology');

// Custom module with specific components
const customModule = await generator.generateCustomModule(
  'Active Imagination Practice',
  {
    module: true,
    mindMap: true,
    quiz: true,
    videos: true,
    bibliography: false // Skip bibliography for practice-focused module
  }
);
```

---

## Quiz Creation Examples

### Basic Quiz Generation

```typescript
import { EnhancedQuizGenerator } from './services/quiz';
import { OpenAIProvider } from './services/llm/provider';

const provider = new OpenAIProvider(process.env.OPENAI_API_KEY!);
const quizGenerator = new EnhancedQuizGenerator(provider);

// Generate basic quiz
const quiz = await quizGenerator.generateQuiz(
  'module-123',
  'Collective Unconscious',
  'The collective unconscious contains universal patterns...',
  ['Understand collective unconscious', 'Identify archetypes'],
  10
);
```

### Enhanced Quiz with Templates

```typescript
// Generate quiz with all enhancements
const enhancedQuiz = await quizGenerator.generateEnhancedQuiz(
  'module-456',
  'Psychological Types',
  moduleContent,
  learningObjectives,
  15,
  {
    useTemplates: true,
    enhanceQuestions: true,
    adaptiveDifficulty: true,
    includeEssayQuestions: true,
    contextualizeQuestions: true,
    userLevel: 'intermediate'
  }
);

// Questions will include:
// - Varied question types (multiple choice, true/false, essay)
// - Explanations and hints
// - Difficulty progression
// - Context from module content
```

### Adaptive Quiz Generation

```typescript
// Track user performance
const performanceHistory = [
  { correct: true, difficulty: 'easy' },
  { correct: true, difficulty: 'easy' },
  { correct: true, difficulty: 'medium' },
  { correct: false, difficulty: 'hard' }
];

// Generate adaptive questions based on performance
const adaptiveQuestions = await quizGenerator.generateAdaptiveQuestions(
  'Shadow Integration',
  performanceHistory,
  5 // Generate 5 questions
);

// Questions will be adjusted to user's demonstrated level
```

### Study Guide Generation

```typescript
// After quiz completion
const userResponses = [
  { questionId: 'q1', answer: 0, correct: true },
  { questionId: 'q2', answer: 1, correct: false },
  // ... more responses
];

// Generate personalized study guide
const studyGuide = await quizGenerator.generateStudyGuide(
  quiz,
  userResponses,
  'Psychological Types'
);

console.log('Areas to review:', studyGuide.topicsToReview);
console.log('Recommended resources:', studyGuide.resources);
```

### Quiz Enhancement

```typescript
import { QuizEnhancer } from './services/quiz';

const enhancer = new QuizEnhancer();

// Enhance existing questions
const basicQuestions = [
  {
    question: 'What is the Shadow?',
    options: ['Hidden self', 'Conscious mind', 'Dream state', 'Memory'],
    correctAnswer: 0
  }
];

const enhancedQuestions = await enhancer.enhanceQuestions(
  basicQuestions,
  'Shadow Work'
);

// Enhanced questions now include:
// - Detailed explanations
// - Helpful hints
// - Concept connections
// - Difficulty ratings
```

---

## Video Integration Examples

### Basic Video Search

```typescript
import { VideoEnricher } from './services/video';

const videoEnricher = new VideoEnricher();

// Search for educational videos
const videos = await videoEnricher.searchVideos(
  'Carl Jung Archetypes',
  {
    maxResults: 10,
    language: 'en',
    duration: 'medium', // 4-20 minutes
    educationalOnly: true
  }
);

// Filter high-quality educational content
const educationalVideos = videos.filter(video => 
  video.educationalValue > 0.7 && 
  video.relevanceScore > 0.8
);
```

### Video Enrichment with Metadata

```typescript
import { YouTubeService } from './services/video';

const youtube = new YouTubeService();

// Search YouTube directly
const searchResults = await youtube.search('Jung Shadow Work Tutorial', {
  maxResults: 5,
  type: 'video',
  duration: 'medium',
  safeSearch: 'strict'
});

// Enrich each video with educational metadata
const enrichedVideos = await Promise.all(
  searchResults.map(video => 
    videoEnricher.enrichVideo(video, {
      analyzeTranscript: true,
      generateTimestamps: true,
      assessDifficulty: true,
      extractLearningOutcomes: true,
      courseContext: {
        topic: 'Shadow Work',
        concepts: ['Shadow', 'Integration', 'Projection']
      }
    })
  )
);
```

### Module Video Integration

```typescript
// Integrate videos into module sections
const moduleWithVideos = {
  ...module,
  content: {
    ...module.content,
    sections: module.content.sections.map(section => ({
      ...section,
      media: enrichedVideos
        .filter(video => 
          video.metadata.relatedConcepts.some(concept => 
            section.concepts.includes(concept)
          )
        )
        .slice(0, 2) // Max 2 videos per section
    }))
  }
};
```

---

## Bibliography Management Examples

### Basic Bibliography Search

```typescript
import { 
  findReferencesByKeywords,
  findReferencesByCategory 
} from './services/bibliography';

// Search by keywords
const shadowReferences = findReferencesByKeywords(['shadow', 'integration']);

// Search by category
const collectedWorks = findReferencesByCategory('Collected Works');

// Filter by year range
const recentReferences = shadowReferences.filter(ref => 
  ref.year >= 2010 && ref.year <= 2024
);
```

### Enhanced Bibliography Generation

```typescript
import { BibliographyEnricher } from './services/bibliography';

const enricher = new BibliographyEnricher();

// Search with enrichment
const enrichedRefs = await enricher.searchBibliography({
  concepts: ['individuation', 'self-realization'],
  maxResults: 20,
  yearRange: { start: 2000, end: 2024 }
});

// Generate formatted bibliography
const bibliography = await enricher.generateBibliography(
  enrichedRefs,
  {
    format: 'APA',
    groupBy: 'type',
    includeAbstracts: true
  }
);

console.log(bibliography); // Formatted APA citations
```

### Reading Path Generation

```typescript
// Generate progressive reading list
const beginnerPath = await enricher.generateReadingPath(
  'Introduction to Jung',
  'beginner'
);

console.log('Reading stages:');
beginnerPath.stages.forEach((stage, index) => {
  console.log(`Stage ${index + 1}: ${stage.level}`);
  console.log(`Description: ${stage.description}`);
  console.log(`Books: ${stage.references.length}`);
  console.log(`Time: ${stage.estimatedTime} hours\n`);
});
```

### Custom Bibliography Export

```typescript
// Export in different formats
const formats = ['APA', 'MLA', 'Chicago'] as const;

for (const format of formats) {
  const formatted = await enricher.exportBibliography(
    enrichedRefs,
    {
      format,
      includeAbstracts: false,
      groupBy: 'year'
    }
  );
  
  // Save to file
  await fs.writeFile(
    `bibliography-${format.toLowerCase()}.txt`,
    formatted
  );
}
```

---

## Mind Map Generation Examples

### Basic Mind Map from Module

```typescript
import { MindMapGenerator } from './services/mindmap';

const generator = new MindMapGenerator();

// Generate from module structure
const mindMapData = await generator.generateFromModule(module);

console.log(`Generated ${mindMapData.nodes.length} nodes`);
console.log(`Connected with ${mindMapData.edges.length} edges`);
console.log(`Depth: ${mindMapData.metadata.depth} levels`);
```

### Concept-Based Mind Map

```typescript
// Generate from concepts
const conceptMap = await generator.generateFromConcepts(
  'Collective Unconscious', // Central concept
  [
    'Archetypes',
    'Personal Unconscious',
    'Ego',
    'Self',
    'Cultural Symbols',
    'Mythology'
  ],
  3 // Maximum depth
);

// Categorize by Jungian concepts
const categorized = mindMapData.metadata.categorization;
console.log('Shadow concepts:', categorized.shadow);
console.log('Self concepts:', categorized.self);
```

### React Flow Integration

```typescript
import { ReactFlowAdapter } from './services/mindmap';

const adapter = new ReactFlowAdapter();

// Convert to React Flow format
const { nodes, edges } = adapter.toReactFlow(mindMapData);

// Ready for React Flow component
<ReactFlow
  nodes={nodes}
  edges={edges}
  nodeTypes={nodeTypes}
  onNodesChange={onNodesChange}
  onEdgesChange={onEdgesChange}
/>
```

### Custom Layout Application

```typescript
import { MindMapLayouts } from './services/mindmap';

const layouts = new MindMapLayouts();

// Apply different layouts
const radialLayout = layouts.applyLayout(nodes, edges, 'radial');
const hierarchicalLayout = layouts.applyLayout(nodes, edges, 'hierarchical');
const forceLayout = layouts.applyLayout(nodes, edges, 'force');

// Choose layout based on content
const optimalLayout = nodes.length > 20 ? 'force' : 'radial';
const finalLayout = layouts.applyLayout(nodes, edges, optimalLayout);
```

---

## Complete Workflow Examples

### Educational Course Creation

```typescript
// Complete workflow for creating a course module
async function createCourseModule(courseTopic: string) {
  console.log(`Creating course module for: ${courseTopic}`);
  
  // Step 1: Generate base module
  const orchestrator = new ModuleGenerationOrchestrator();
  
  orchestrator.on('progress', (progress) => {
    updateProgressBar(progress.progress);
    showStatus(progress.message);
  });
  
  const result = await orchestrator.generateModule({
    topic: courseTopic,
    objectives: generateLearningObjectives(courseTopic),
    targetAudience: 'University students',
    duration: 90,
    difficulty: 'intermediate',
    includeVideos: true,
    includeBibliography: true,
    includeMindMap: true,
    quizQuestions: 15
  });
  
  // Step 2: Enhance content
  const enhancedContent = await enhanceModuleContent(result);
  
  // Step 3: Create study materials
  const studyMaterials = await createStudyMaterials(enhancedContent);
  
  // Step 4: Generate assessments
  const assessments = await createAssessments(enhancedContent);
  
  // Step 5: Package for LMS
  const coursePackage = await packageForLMS({
    module: enhancedContent,
    materials: studyMaterials,
    assessments: assessments
  });
  
  return coursePackage;
}
```

### Adaptive Learning Path

```typescript
// Create adaptive learning experience
async function createAdaptiveLearningPath(
  studentProfile: StudentProfile,
  topic: string
) {
  // Assess student level
  const level = await assessStudentLevel(studentProfile);
  
  // Generate appropriate content
  const generator = new UnifiedModuleGenerator();
  
  const module = await generator.generateCompleteModule({
    topic,
    difficulty: level,
    targetAudience: describeStudent(studentProfile),
    includeVideos: studentProfile.learningStyle === 'visual',
    includeQuiz: true,
    includeMindMap: studentProfile.learningStyle === 'visual',
    includeBibliography: level === 'advanced',
    quizQuestions: level === 'beginner' ? 5 : 10
  });
  
  // Create adaptive quiz
  const quizGenerator = new EnhancedQuizGenerator(provider);
  
  // Monitor progress and adapt
  const progressMonitor = new ProgressMonitor();
  
  progressMonitor.on('milestone', async (milestone) => {
    if (milestone.performance < 0.6) {
      // Generate remedial content
      const remedial = await generateRemedialContent(
        milestone.topic,
        milestone.struggles
      );
      module.content.sections.push(remedial);
    }
  });
  
  return {
    module,
    monitor: progressMonitor,
    adaptiveQuiz: await createAdaptiveQuiz(module, studentProfile)
  };
}
```

### Research Assistant

```typescript
// Research assistant for Jung studies
async function jungianResearchAssistant(
  researchTopic: string,
  researchDepth: 'overview' | 'detailed' | 'comprehensive'
) {
  const results = {
    overview: null,
    primarySources: [],
    secondarySources: [],
    multimedia: [],
    conceptMap: null,
    readingPath: null
  };
  
  // Generate overview
  const orchestrator = new LLMOrchestrator();
  results.overview = await orchestrator.generateModule({
    topic: researchTopic,
    difficulty: 'advanced'
  });
  
  // Collect bibliography
  const bibEnricher = new BibliographyEnricher();
  
  // Primary sources (Jung's works)
  results.primarySources = await bibEnricher.searchBibliography({
    concepts: [researchTopic],
    maxResults: 20,
    yearRange: { start: 1900, end: 1961 } // Jung's lifetime
  });
  
  // Secondary sources (contemporary research)
  results.secondarySources = await bibEnricher.searchBibliography({
    concepts: [researchTopic],
    maxResults: 30,
    yearRange: { start: 2000, end: 2024 }
  });
  
  // Find multimedia resources
  if (researchDepth !== 'overview') {
    const videoEnricher = new VideoEnricher();
    results.multimedia = await videoEnricher.searchVideos(
      researchTopic,
      {
        maxResults: 15,
        educationalOnly: true
      }
    );
  }
  
  // Generate concept map for comprehensive research
  if (researchDepth === 'comprehensive') {
    const mindMapGen = new MindMapGenerator();
    results.conceptMap = await mindMapGen.generateFromConcepts(
      researchTopic,
      extractKeyConceptsFromBibliography([
        ...results.primarySources,
        ...results.secondarySources
      ]),
      4 // Deep concept exploration
    );
  }
  
  // Create reading path
  results.readingPath = await bibEnricher.generateReadingPath(
    researchTopic,
    'scholar'
  );
  
  return results;
}
```

---

## Error Handling Examples

### Comprehensive Error Handling

```typescript
import { 
  LLMProviderError, 
  ValidationError, 
  GenerationError 
} from './services/errors';

async function safeModuleGeneration(options: GenerationOptions) {
  try {
    const result = await orchestrator.generateModule(options);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof LLMProviderError) {
      // Handle provider-specific errors
      if (error.code === 'RATE_LIMIT_EXCEEDED') {
        console.log('Rate limit hit, waiting before retry...');
        await delay(60000); // Wait 1 minute
        return safeModuleGeneration(options); // Retry
      } else if (error.code === 'PROVIDER_UNAVAILABLE') {
        // Fall back to mock provider
        const mockOrchestrator = new ModuleGenerationOrchestrator(false);
        return await mockOrchestrator.generateModule(options);
      }
    } else if (error instanceof ValidationError) {
      // Handle validation errors
      return {
        success: false,
        error: `Invalid ${error.field}: ${error.message}`,
        suggestion: getSuggestionForField(error.field)
      };
    } else if (error instanceof GenerationError) {
      // Handle generation errors
      console.error(`Generation failed at stage: ${error.stage}`);
      // Try partial generation
      return await attemptPartialGeneration(options, error.stage);
    }
    
    // Unknown error
    console.error('Unexpected error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
      details: error.message
    };
  }
}
```

### Retry with Exponential Backoff

```typescript
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error(`Failed after ${maxRetries} attempts: ${lastError.message}`);
}

// Usage
const module = await withRetry(
  () => orchestrator.generateModule(options),
  5, // max retries
  2000 // base delay
);
```

### Graceful Degradation

```typescript
async function generateWithFallbacks(topic: string) {
  const strategies = [
    // Strategy 1: Full generation with all services
    async () => {
      const generator = new UnifiedModuleGenerator();
      return await generator.generateCompleteModule({
        topic,
        includeVideos: true,
        includeQuiz: true,
        includeMindMap: true,
        includeBibliography: true
      });
    },
    
    // Strategy 2: Reduce scope
    async () => {
      console.log('Falling back to reduced scope...');
      const generator = new UnifiedModuleGenerator();
      return await generator.generateCompleteModule({
        topic,
        includeVideos: false, // Skip video search
        includeQuiz: true,
        includeMindMap: true,
        includeBibliography: false // Skip bibliography
      });
    },
    
    // Strategy 3: Essential only
    async () => {
      console.log('Falling back to essentials only...');
      const orchestrator = new LLMOrchestrator();
      return {
        module: await orchestrator.generateModule({ topic }),
        metadata: { componentsIncluded: ['module'] }
      };
    },
    
    // Strategy 4: Mock data
    async () => {
      console.log('Using mock data...');
      return generateMockModule(topic);
    }
  ];
  
  for (const strategy of strategies) {
    try {
      return await strategy();
    } catch (error) {
      console.error('Strategy failed:', error);
      continue;
    }
  }
  
  throw new Error('All generation strategies failed');
}
```

---

## Performance Optimization

### Token Usage Optimization

```typescript
// Monitor and optimize token usage
class TokenOptimizer {
  private usage: Map<string, number> = new Map();
  
  async optimizedGeneration(options: GenerationOptions) {
    // Estimate token usage
    const estimate = await orchestrator.estimateTokenUsage(options);
    
    // Check budget
    const currentUsage = this.getCurrentUsage();
    if (currentUsage + estimate > this.dailyLimit) {
      // Reduce scope to fit budget
      options = this.reduceScope(options, estimate);
    }
    
    // Generate with monitoring
    const result = await this.generateWithMonitoring(options);
    
    // Update usage
    this.updateUsage(result.tokensUsed);
    
    return result;
  }
  
  private reduceScope(
    options: GenerationOptions, 
    estimate: number
  ): GenerationOptions {
    const reduced = { ...options };
    
    // Reduce in order of token cost
    if (estimate > this.remainingBudget * 0.8) {
      reduced.includeBibliography = false; // -2000 tokens
    }
    if (estimate > this.remainingBudget * 0.6) {
      reduced.includeVideos = false; // -1500 tokens
    }
    if (estimate > this.remainingBudget * 0.4) {
      reduced.quizQuestions = Math.floor(reduced.quizQuestions / 2);
    }
    
    return reduced;
  }
}
```

### Caching Strategy

```typescript
import { LRUCache } from 'lru-cache';

class CachedModuleGenerator {
  private cache: LRUCache<string, any>;
  
  constructor() {
    this.cache = new LRUCache({
      max: 100, // Maximum items
      ttl: 1000 * 60 * 60 * 24, // 24 hour TTL
      updateAgeOnGet: true
    });
  }
  
  async generateModule(options: GenerationOptions) {
    const cacheKey = this.generateCacheKey(options);
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log('Returning cached module');
      return cached;
    }
    
    // Generate fresh
    const result = await orchestrator.generateModule(options);
    
    // Cache result
    this.cache.set(cacheKey, result);
    
    return result;
  }
  
  private generateCacheKey(options: GenerationOptions): string {
    return crypto
      .createHash('md5')
      .update(JSON.stringify({
        topic: options.topic,
        difficulty: options.difficulty,
        objectives: options.objectives.sort()
      }))
      .digest('hex');
  }
}
```

### Parallel Processing

```typescript
// Process multiple modules in parallel with concurrency control
async function batchGenerateModules(
  topics: string[],
  concurrency: number = 3
) {
  const results = [];
  const executing = [];
  
  for (const topic of topics) {
    const promise = generateModuleWithRateLimit(topic).then(result => {
      executing.splice(executing.indexOf(promise), 1);
      return result;
    });
    
    results.push(promise);
    executing.push(promise);
    
    if (executing.length >= concurrency) {
      await Promise.race(executing);
    }
  }
  
  return Promise.all(results);
}

// With progress tracking
async function batchGenerateWithProgress(
  topics: string[],
  onProgress: (completed: number, total: number) => void
) {
  let completed = 0;
  const total = topics.length;
  
  const results = await Promise.all(
    topics.map(async (topic, index) => {
      // Stagger starts to avoid rate limit
      await delay(index * 1000);
      
      const result = await orchestrator.generateModule({
        topic,
        difficulty: 'intermediate',
        includeQuiz: true,
        quizQuestions: 10
      });
      
      completed++;
      onProgress(completed, total);
      
      return result;
    })
  );
  
  return results;
}
```

### Memory Management

```typescript
// Stream large content to avoid memory issues
class StreamingContentGenerator {
  async *generateLargeModule(options: GenerationOptions) {
    // Yield progress updates
    yield { type: 'progress', stage: 'initializing', progress: 0 };
    
    // Generate content in chunks
    const sections = await this.planSections(options);
    
    yield { type: 'progress', stage: 'content', progress: 10 };
    
    for (let i = 0; i < sections.length; i++) {
      const section = await this.generateSection(sections[i], options);
      
      yield { 
        type: 'section', 
        data: section,
        progress: 10 + (80 * (i + 1) / sections.length)
      };
      
      // Free memory
      sections[i] = null;
    }
    
    // Generate supplementary content
    yield { type: 'progress', stage: 'finalizing', progress: 90 };
    
    const quiz = await this.generateQuiz(options);
    yield { type: 'quiz', data: quiz, progress: 95 };
    
    yield { type: 'complete', progress: 100 };
  }
}

// Usage
const generator = new StreamingContentGenerator();
for await (const chunk of generator.generateLargeModule(options)) {
  switch (chunk.type) {
    case 'progress':
      updateProgress(chunk.progress);
      break;
    case 'section':
      appendSection(chunk.data);
      break;
    case 'quiz':
      setQuiz(chunk.data);
      break;
  }
}
```

---

## Integration with Frontend

### React Hook Example

```typescript
// Custom hook for module generation
function useModuleGenerator() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);
  
  const generateModule = useCallback(async (options: GenerationOptions) => {
    setLoading(true);
    setError(null);
    setProgress(0);
    
    const orchestrator = new ModuleGenerationOrchestrator();
    
    orchestrator.on('progress', (progressData) => {
      setProgress(progressData.progress);
    });
    
    try {
      const moduleResult = await orchestrator.generateModule(options);
      setResult(moduleResult);
      return moduleResult;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  return {
    generateModule,
    loading,
    progress,
    error,
    result
  };
}

// Usage in component
function ModuleCreator() {
  const { generateModule, loading, progress, error } = useModuleGenerator();
  
  const handleCreate = async () => {
    try {
      await generateModule({
        topic: 'Shadow Work',
        objectives: ['Understand the Shadow', 'Practice integration'],
        targetAudience: 'Beginners',
        duration: 60,
        difficulty: 'beginner',
        includeQuiz: true
      });
    } catch (error) {
      console.error('Failed to generate module:', error);
    }
  };
  
  return (
    <div>
      <button onClick={handleCreate} disabled={loading}>
        Create Module
      </button>
      {loading && <ProgressBar value={progress} />}
      {error && <ErrorMessage error={error} />}
    </div>
  );
}
```

---

## Best Practices Summary

1. **Always handle errors gracefully** - Use try-catch and provide fallbacks
2. **Monitor token usage** - Track and optimize API calls
3. **Implement caching** - Avoid regenerating identical content
4. **Use progress events** - Keep users informed during long operations
5. **Validate inputs** - Check parameters before making API calls
6. **Batch operations** - Process multiple items efficiently
7. **Provide offline capability** - Use mock providers for development
8. **Stream large content** - Avoid memory issues with large modules
9. **Rate limit requests** - Respect API limits with queuing
10. **Test with mocks** - Develop without consuming API quota