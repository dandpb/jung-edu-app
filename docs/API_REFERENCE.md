# jaqEdu API Reference Documentation

## Table of Contents

1. [LLM Orchestration Services](#llm-orchestration-services)
2. [Module Generation Services](#module-generation-services)
3. [Quiz Generation Services](#quiz-generation-services)
4. [Video Enrichment Services](#video-enrichment-services)
5. [Bibliography Services](#bibliography-services)
6. [Mind Map Services](#mind-map-services)
7. [Data Types and Interfaces](#data-types-and-interfaces)
8. [Error Handling](#error-handling)
9. [Usage Examples](#usage-examples)

---

## LLM Orchestration Services

The LLM orchestration layer provides a unified interface for generating educational content using Large Language Models.

### ModuleGenerationOrchestrator

The main orchestrator that coordinates all content generation services.

```typescript
class ModuleGenerationOrchestrator extends EventEmitter
```

#### Constructor

```typescript
constructor(useRealServices: boolean = true)
```

**Parameters:**
- `useRealServices` - Whether to use real service implementations or fallback to LLM-only generation

#### Methods

##### generateModule

Generates a complete educational module with all requested components.

```typescript
async generateModule(options: GenerationOptions): Promise<GenerationResult>
```

**Parameters:**
```typescript
interface GenerationOptions {
  topic: string;                    // The main topic of the module
  objectives: string[];             // Learning objectives
  targetAudience: string;           // Target audience description
  duration: number;                 // Duration in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  includeVideos?: boolean;          // Include video resources
  includeBibliography?: boolean;    // Include bibliography
  includeMindMap?: boolean;         // Include concept mind map
  quizQuestions?: number;           // Number of quiz questions
  videoCount?: number;              // Maximum videos to include
  bibliographyCount?: number;       // Maximum bibliography items
  useRealServices?: boolean;        // Use real services vs LLM-only
}
```

**Returns:**
```typescript
interface GenerationResult {
  module: Module;                   // Core module structure
  content: ModuleContent;           // Educational content
  quiz?: Quiz;                      // Assessment quiz
  videos?: Video[];                 // Video resources
  bibliography?: any[];             // Bibliography references
  mindMap?: any;                    // Mind map visualization data
}
```

**Events:**
- `progress` - Emitted during generation with `GenerationProgress` data

```typescript
interface GenerationProgress {
  stage: 'initializing' | 'content' | 'quiz' | 'videos' | 
         'bibliography' | 'mindmap' | 'finalizing' | 'complete' | 'error';
  progress: number;                 // 0-100
  message: string;
  details?: any;
}
```

##### analyzeDifficulty

Analyzes content to determine appropriate difficulty level.

```typescript
async analyzeDifficulty(
  topic: string, 
  content: string
): Promise<'beginner' | 'intermediate' | 'advanced'>
```

##### checkProviderAvailability

Checks if the LLM provider is available and configured.

```typescript
async checkProviderAvailability(): Promise<boolean>
```

##### estimateTokenUsage

Estimates the token usage for a generation request.

```typescript
async estimateTokenUsage(options: GenerationOptions): Promise<number>
```

### LLMOrchestrator

Simplified interface for common generation tasks.

```typescript
class LLMOrchestrator
```

#### Methods

##### generateModule

```typescript
async generateModule(options: {
  topic: string;
  targetAudience?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}): Promise<Module>
```

##### generateQuiz

```typescript
async generateQuiz(options: {
  topic: string;
  numberOfQuestions: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}): Promise<Quiz>
```

##### generateBibliography

```typescript
async generateBibliography(options: {
  topic: string;
  count?: number;
  yearRange?: { start: number; end: number };
}): Promise<any[]>
```

---

## LLM Provider Services

### ILLMProvider Interface

Base interface for all LLM providers.

```typescript
interface ILLMProvider {
  generateCompletion(
    prompt: string, 
    options?: LLMGenerationOptions
  ): Promise<string>;
  
  generateStructuredResponse<T>(
    prompt: string, 
    schema: any, 
    options?: LLMGenerationOptions
  ): Promise<T>;
  
  getTokenCount(text: string): number;
  
  isAvailable(): Promise<boolean>;
}
```

#### LLMGenerationOptions

```typescript
interface LLMGenerationOptions {
  temperature?: number;      // 0-1, default 0.7
  maxTokens?: number;       // Max tokens to generate
  systemPrompt?: string;    // System message
  retries?: number;         // Retry attempts
  timeout?: number;         // Request timeout
}
```

### OpenAIProvider

Production LLM provider using OpenAI's API.

```typescript
class OpenAIProvider implements ILLMProvider
```

#### Constructor

```typescript
constructor(apiKey: string, model: string = 'gpt-4o-mini')
```

### MockLLMProvider

Development provider for testing without API calls.

```typescript
class MockLLMProvider implements ILLMProvider
```

#### Constructor

```typescript
constructor(delay: number = 500)
```

### LLMProviderFactory

Factory for creating appropriate providers based on configuration.

```typescript
class LLMProviderFactory {
  static getProvider(): ILLMProvider
}
```

---

## Module Generation Services

### UnifiedModuleGenerator

High-level service that coordinates all module generation components.

```typescript
class UnifiedModuleGenerator
```

#### Methods

##### generateCompleteModule

Generate a module with all specified components.

```typescript
async generateCompleteModule(
  config: ModuleGenerationConfig
): Promise<GeneratedModule>
```

**Parameters:**
```typescript
interface ModuleGenerationConfig {
  topic: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  targetAudience?: string;
  includeVideos?: boolean;
  includeQuiz?: boolean;
  includeMindMap?: boolean;
  includeBibliography?: boolean;
  language?: string;
  maxVideos?: number;
  quizQuestions?: number;
}
```

**Returns:**
```typescript
interface GeneratedModule {
  module: any;              // Jung module structure
  mindMap?: any;            // React Flow nodes and edges
  quiz?: any;               // Enhanced quiz with explanations
  videos?: any[];           // Enriched video content
  bibliography?: any[];     // Academic references
  metadata: {
    generatedAt: Date;
    difficulty: string;
    topic: string;
    componentsIncluded: string[];
  };
}
```

##### generateCustomModule

Generate module with specific components only.

```typescript
async generateCustomModule(
  topic: string,
  components: {
    module?: boolean;
    mindMap?: boolean;
    quiz?: boolean;
    videos?: boolean;
    bibliography?: boolean;
  }
): Promise<Partial<GeneratedModule>>
```

##### Preset Methods

Quick generation with predefined configurations:

- `generateQuickModule(topic: string)` - Fast generation with essentials
- `generateStudyModule(topic: string)` - Comprehensive study materials
- `generateResearchModule(topic: string)` - Research-focused materials

---

## Quiz Generation Services

### EnhancedQuizGenerator

Advanced quiz generation with multiple question types and enhancements.

```typescript
class EnhancedQuizGenerator
```

#### Constructor

```typescript
constructor(provider: ILLMProvider)
```

#### Methods

##### generateEnhancedQuiz

Generate a complete quiz with all enhancements.

```typescript
async generateEnhancedQuiz(
  moduleId: string,
  topic: string,
  content: string,
  learningObjectives: string[],
  numberOfQuestions: number,
  options?: {
    useTemplates?: boolean;
    enhanceQuestions?: boolean;
    adaptiveDifficulty?: boolean;
    includeEssayQuestions?: boolean;
    contextualizeQuestions?: boolean;
    userLevel?: 'beginner' | 'intermediate' | 'advanced';
  }
): Promise<Quiz>
```

##### generateAdaptiveQuestions

Generate questions based on user performance.

```typescript
async generateAdaptiveQuestions(
  topic: string,
  performanceHistory: Array<{
    correct: boolean;
    difficulty: string;
  }>,
  count: number
): Promise<QuizQuestion[]>
```

##### generateStudyGuide

Create personalized study guide based on quiz results.

```typescript
async generateStudyGuide(
  quiz: Quiz,
  userResponses: any[],
  topic: string
): Promise<StudyGuide>
```

### QuizEnhancer

Enhances existing quiz questions with additional features.

```typescript
class QuizEnhancer
```

#### Methods

##### enhanceQuestions

Add explanations and hints to questions.

```typescript
async enhanceQuestions(
  questions: QuizQuestion[],
  topic: string
): Promise<QuizQuestion[]>
```

### QuizValidator

Validates quiz structure and content quality.

```typescript
class QuizValidator
```

#### Methods

##### validateQuiz

```typescript
validateQuiz(quiz: Quiz): ValidationResult
```

##### validateQuestion

```typescript
validateQuestion(question: QuizQuestion): ValidationResult
```

---

## Video Enrichment Services

### VideoEnricher

Enriches educational content with relevant video resources.

```typescript
class VideoEnricher
```

#### Methods

##### searchVideos

Search for educational videos on a topic.

```typescript
async searchVideos(
  topic: string,
  options?: EnrichmentOptions
): Promise<VideoMetadata[]>
```

**Parameters:**
```typescript
interface EnrichmentOptions {
  maxResults?: number;
  language?: string;
  duration?: 'short' | 'medium' | 'long';
  educationalOnly?: boolean;
}
```

**Returns:**
```typescript
interface VideoMetadata {
  id: string;
  title: string;
  description: string;
  url: string;
  duration: number;        // in seconds
  thumbnail: string;
  channel: string;
  publishedAt: Date;
  viewCount?: number;
  relevanceScore?: number;
  educationalValue?: number;
  tags?: string[];
}
```

### YouTubeService

Low-level YouTube API integration.

```typescript
class YouTubeService
```

#### Methods

##### search

```typescript
async search(
  query: string,
  options?: YouTubeSearchOptions
): Promise<YouTubeVideo[]>
```

**Parameters:**
```typescript
interface YouTubeSearchOptions {
  maxResults?: number;
  type?: 'video' | 'channel' | 'playlist';
  duration?: 'short' | 'medium' | 'long';
  order?: 'relevance' | 'date' | 'rating' | 'viewCount';
  safeSearch?: 'none' | 'moderate' | 'strict';
}
```

---

## Bibliography Services

### BibliographyEnricher

Enriches content with academic references and reading materials.

```typescript
class BibliographyEnricher
```

#### Methods

##### searchBibliography

Search for relevant bibliography items.

```typescript
async searchBibliography(options: {
  concepts: string[];
  maxResults?: number;
  yearRange?: { start: number; end: number };
  types?: ReferenceType[];
}): Promise<EnrichedReference[]>
```

##### generateBibliography

Generate formatted bibliography.

```typescript
async generateBibliography(
  references: Reference[],
  options?: BibliographyOptions
): Promise<string>
```

**Parameters:**
```typescript
interface BibliographyOptions {
  format: 'APA' | 'MLA' | 'Chicago' | 'Harvard';
  groupBy?: 'type' | 'year' | 'category';
  includeAbstracts?: boolean;
}
```

##### generateReadingPath

Create progressive reading recommendations.

```typescript
async generateReadingPath(
  topic: string,
  userLevel: 'beginner' | 'intermediate' | 'advanced'
): Promise<ReadingPath>
```

**Returns:**
```typescript
interface ReadingPath {
  stages: Array<{
    level: string;
    description: string;
    references: Reference[];
    estimatedTime: number;
  }>;
  totalReferences: number;
  estimatedDuration: string;
}
```

### Reference Database Functions

##### findReferencesByKeywords

```typescript
function findReferencesByKeywords(
  keywords: string[]
): Reference[]
```

##### findReferencesByCategory

```typescript
function findReferencesByCategory(
  category: string
): Reference[]
```

##### findReferencesByAuthor

```typescript
function findReferencesByAuthor(
  author: string
): Reference[]
```

##### findReferencesByType

```typescript
function findReferencesByType(
  type: ReferenceType
): Reference[]
```

##### findReferencesInYearRange

```typescript
function findReferencesInYearRange(
  startYear: number,
  endYear: number
): Reference[]
```

---

## Mind Map Services

### MindMapGenerator

Generates mind maps from educational content.

```typescript
class MindMapGenerator
```

#### Methods

##### generateFromModule

Create mind map from module structure.

```typescript
async generateFromModule(
  module: Module
): Promise<MindMapData>
```

**Returns:**
```typescript
interface MindMapData {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
  layout: LayoutType;
}
```

##### generateFromConcepts

Create mind map from concept list.

```typescript
async generateFromConcepts(
  centralConcept: string,
  relatedConcepts: string[],
  depth?: number
): Promise<MindMapData>
```

### MindMapLayouts

Layout algorithms for mind map visualization.

```typescript
class MindMapLayouts
```

#### Methods

##### applyLayout

```typescript
applyLayout(
  nodes: MindMapNode[],
  edges: MindMapEdge[],
  layoutType: 'radial' | 'hierarchical' | 'force' | 'tree'
): { nodes: MindMapNode[]; edges: MindMapEdge[] }
```

### ReactFlowAdapter

Converts mind map data to React Flow format.

```typescript
class ReactFlowAdapter
```

#### Methods

##### toReactFlow

```typescript
toReactFlow(
  mindMapData: MindMapData
): { nodes: Node[]; edges: Edge[] }
```

---

## Service Method Details

### ModuleService API

Complete service for module management:

```typescript
class ModuleService {
  // Module CRUD operations
  async createModule(data: CreateModuleDto): Promise<Module>
  async getModule(id: string): Promise<Module | null>
  async updateModule(id: string, data: UpdateModuleDto): Promise<Module>
  async deleteModule(id: string): Promise<boolean>
  async listModules(filters?: ModuleFilters): Promise<Module[]>
  
  // Module content management
  async addSection(moduleId: string, section: ContentSection): Promise<Module>
  async updateSection(moduleId: string, sectionId: string, data: Partial<ContentSection>): Promise<Module>
  async removeSection(moduleId: string, sectionId: string): Promise<Module>
  async reorderSections(moduleId: string, sectionIds: string[]): Promise<Module>
  
  // Module enrichment
  async enrichWithVideos(moduleId: string, videoIds: string[]): Promise<Module>
  async enrichWithBibliography(moduleId: string, referenceIds: string[]): Promise<Module>
  async attachQuiz(moduleId: string, quizId: string): Promise<Module>
  async attachMindMap(moduleId: string, mindMapData: any): Promise<Module>
  
  // Progress tracking
  async trackProgress(moduleId: string, userId: string, progress: ModuleProgress): Promise<void>
  async getProgress(moduleId: string, userId: string): Promise<ModuleProgress>
  
  // Analytics
  async getModuleAnalytics(moduleId: string): Promise<ModuleAnalytics>
  async getPopularModules(limit?: number): Promise<Module[]>
}
```

### Quiz Service Extended API

```typescript
class QuizService {
  // Quiz management
  async createQuiz(data: CreateQuizDto): Promise<Quiz>
  async updateQuiz(id: string, data: UpdateQuizDto): Promise<Quiz>
  async deleteQuiz(id: string): Promise<boolean>
  async getQuiz(id: string): Promise<Quiz | null>
  
  // Question management
  async addQuestion(quizId: string, question: QuizQuestion): Promise<Quiz>
  async updateQuestion(quizId: string, questionId: string, data: Partial<QuizQuestion>): Promise<Quiz>
  async removeQuestion(quizId: string, questionId: string): Promise<Quiz>
  async reorderQuestions(quizId: string, questionIds: string[]): Promise<Quiz>
  
  // Quiz taking
  async startQuizSession(quizId: string, userId: string): Promise<QuizSession>
  async submitAnswer(sessionId: string, questionId: string, answer: any): Promise<AnswerResult>
  async completeSession(sessionId: string): Promise<QuizResult>
  
  // Analytics and feedback
  async getQuizAnalytics(quizId: string): Promise<QuizAnalytics>
  async getQuestionAnalytics(quizId: string, questionId: string): Promise<QuestionAnalytics>
  async generateFeedback(sessionId: string): Promise<QuizFeedback>
  
  // Adaptive features
  async getNextAdaptiveQuestion(sessionId: string): Promise<QuizQuestion>
  async adjustDifficulty(sessionId: string, performance: Performance): Promise<void>
}
```

### Video Service Extended API

```typescript
class VideoService {
  // Video search and retrieval
  async searchVideos(query: string, options?: VideoSearchOptions): Promise<Video[]>
  async getVideo(id: string): Promise<Video | null>
  async getVideosByIds(ids: string[]): Promise<Video[]>
  
  // Video analysis
  async analyzeVideo(videoId: string): Promise<VideoAnalysis>
  async extractTimestamps(videoId: string): Promise<VideoTimestamp[]>
  async assessEducationalValue(videoId: string): Promise<EducationalAssessment>
  
  // Playlist management
  async createPlaylist(name: string, videoIds: string[]): Promise<VideoPlaylist>
  async updatePlaylist(playlistId: string, data: UpdatePlaylistDto): Promise<VideoPlaylist>
  async getRecommendedPlaylist(topic: string, level: string): Promise<VideoPlaylist>
  
  // Progress tracking
  async trackWatchProgress(videoId: string, userId: string, progress: WatchProgress): Promise<void>
  async getWatchHistory(userId: string): Promise<WatchHistory[]>
  
  // Recommendations
  async getRecommendations(userId: string, context?: RecommendationContext): Promise<Video[]>
  async getSimilarVideos(videoId: string, limit?: number): Promise<Video[]>
}
```

### Bibliography Service Extended API

```typescript
class BibliographyService {
  // Reference management
  async searchReferences(query: string, filters?: ReferenceFilters): Promise<Reference[]>
  async getReference(id: string): Promise<Reference | null>
  async addReference(data: CreateReferenceDto): Promise<Reference>
  async updateReference(id: string, data: UpdateReferenceDto): Promise<Reference>
  
  // Collection management
  async createCollection(name: string, referenceIds: string[]): Promise<ReferenceCollection>
  async addToCollection(collectionId: string, referenceIds: string[]): Promise<ReferenceCollection>
  async removeFromCollection(collectionId: string, referenceIds: string[]): Promise<ReferenceCollection>
  
  // Citation formatting
  async formatCitation(referenceId: string, style: CitationStyle): Promise<string>
  async formatBibliography(referenceIds: string[], style: CitationStyle): Promise<string>
  async generateInTextCitation(referenceId: string, style: CitationStyle): Promise<string>
  
  // Import/Export
  async importFromBibTeX(bibtex: string): Promise<Reference[]>
  async exportToBibTeX(referenceIds: string[]): Promise<string>
  async importFromRIS(ris: string): Promise<Reference[]>
  async exportToRIS(referenceIds: string[]): Promise<string>
  
  // Analysis
  async analyzeReadingComplexity(referenceIds: string[]): Promise<ComplexityAnalysis>
  async generateReadingOrder(referenceIds: string[], userLevel: string): Promise<string[]>
  async findRelatedReferences(referenceId: string, limit?: number): Promise<Reference[]>
}
```

### Mind Map Service Extended API

```typescript
class MindMapService {
  // Mind map generation
  async generateFromText(text: string, options?: MindMapOptions): Promise<MindMapData>
  async generateFromModule(moduleId: string): Promise<MindMapData>
  async generateFromConcepts(concepts: Concept[]): Promise<MindMapData>
  
  // Mind map manipulation
  async addNode(mapId: string, node: MindMapNode, parentId?: string): Promise<MindMapData>
  async updateNode(mapId: string, nodeId: string, data: Partial<MindMapNode>): Promise<MindMapData>
  async removeNode(mapId: string, nodeId: string): Promise<MindMapData>
  async addEdge(mapId: string, edge: MindMapEdge): Promise<MindMapData>
  async removeEdge(mapId: string, edgeId: string): Promise<MindMapData>
  
  // Layout and visualization
  async applyLayout(mapId: string, layoutType: LayoutType): Promise<MindMapData>
  async optimizeLayout(mapId: string): Promise<MindMapData>
  async exportToImage(mapId: string, format: 'png' | 'svg' | 'pdf'): Promise<Buffer>
  
  // Interaction and navigation
  async expandNode(mapId: string, nodeId: string): Promise<MindMapData>
  async collapseNode(mapId: string, nodeId: string): Promise<MindMapData>
  async focusOnNode(mapId: string, nodeId: string): Promise<ViewportData>
  async searchNodes(mapId: string, query: string): Promise<MindMapNode[]>
  
  // Analysis
  async analyzeStructure(mapId: string): Promise<StructureAnalysis>
  async findCentralNodes(mapId: string): Promise<MindMapNode[]>
  async calculateNodeImportance(mapId: string): Promise<NodeImportanceMap>
}
```

## Data Types and Interfaces

### Core Module Types

```typescript
interface Module {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  objectives: string[];
  prerequisites: string[];
  content: ModuleContent;
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    targetAudience: string;
    version: number;
    status: 'draft' | 'published' | 'archived';
    tags: string[];
    jungianConcepts: string[];
  };
}

interface ModuleContent {
  introduction: string;
  sections: ContentSection[];
  summary: string;
  keyTakeaways: string[];
  practicalExercises?: Exercise[];
  reflectionQuestions?: string[];
  furtherReading?: string[];
}

interface ContentSection {
  id: string;
  title: string;
  content: string;
  duration: number;
  concepts: string[];
  media?: Media[];
}
```

### Quiz Types

```typescript
interface Quiz {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  passingScore: number;
  timeLimit?: number;
  createdAt: Date;
  updatedAt: Date;
}

interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'essay' | 'matching';
  question: string;
  options?: string[];
  correctAnswer?: number | boolean | string;
  explanation?: string;
  hints?: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  cognitiveLevel: 'remember' | 'understand' | 'apply' | 
                  'analyze' | 'evaluate' | 'create';
  points?: number;
  tags?: string[];
}
```

### Video Types

```typescript
interface Video {
  id: string;
  title: string;
  description: string;
  url: string;
  duration: number;
  thumbnail?: string;
  channel?: string;
  publishedAt?: Date;
  relatedConcepts: string[];
  educationalValue?: number;
}
```

### Bibliography Types

```typescript
interface Reference {
  id: string;
  title: string;
  author: string;
  year: number;
  type: 'book' | 'article' | 'chapter' | 'film' | 'lecture';
  publisher?: string;
  journal?: string;
  doi?: string;
  isbn?: string;
  url?: string;
  abstract?: string;
  keywords: string[];
  category: string;
  difficulty?: 'introductory' | 'intermediate' | 'advanced';
}

interface EnrichedReference extends Reference {
  relevanceScore: number;
  summary: string;
  keyInsights: string[];
  relatedReferences: string[];
}
```

### Mind Map Types

```typescript
interface MindMapNode {
  id: string;
  label: string;
  type: 'central' | 'main' | 'sub' | 'detail';
  position?: { x: number; y: number };
  data?: any;
  style?: any;
}

interface MindMapEdge {
  id: string;
  source: string;
  target: string;
  type?: 'default' | 'straight' | 'step';
  label?: string;
  style?: any;
}
```

---

## Error Handling

### Common Error Types

```typescript
class LLMProviderError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
  }
}

class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: any
  ) {
    super(message);
  }
}

class GenerationError extends Error {
  constructor(
    message: string,
    public stage: string,
    public cause?: Error
  ) {
    super(message);
  }
}
```

### Error Codes

- `PROVIDER_UNAVAILABLE` - LLM provider not accessible
- `RATE_LIMIT_EXCEEDED` - API rate limit reached
- `INVALID_CONFIGURATION` - Invalid service configuration
- `GENERATION_FAILED` - Content generation failed
- `VALIDATION_FAILED` - Input validation failed
- `TIMEOUT` - Operation timed out

### Error Handling Best Practices

```typescript
try {
  const result = await orchestrator.generateModule(options);
  // Handle success
} catch (error) {
  if (error instanceof LLMProviderError) {
    // Handle provider-specific errors
    console.error('Provider error:', error.code, error.details);
  } else if (error instanceof ValidationError) {
    // Handle validation errors
    console.error('Invalid input:', error.field, error.value);
  } else if (error instanceof GenerationError) {
    // Handle generation errors
    console.error('Generation failed at:', error.stage);
  } else {
    // Handle unexpected errors
    console.error('Unexpected error:', error);
  }
}
```

---

## Usage Examples

### Complete Module Generation

```typescript
import { ModuleGenerationOrchestrator } from './services/llm';

const orchestrator = new ModuleGenerationOrchestrator();

// Listen to progress events
orchestrator.on('progress', (progress) => {
  console.log(`${progress.stage}: ${progress.progress}% - ${progress.message}`);
});

// Generate complete module
const result = await orchestrator.generateModule({
  topic: 'The Shadow Archetype',
  objectives: [
    'Understand the concept of the Shadow',
    'Identify personal Shadow aspects',
    'Learn integration techniques'
  ],
  targetAudience: 'Psychology students',
  duration: 90,
  difficulty: 'intermediate',
  includeVideos: true,
  includeBibliography: true,
  includeMindMap: true,
  quizQuestions: 15,
  videoCount: 5,
  bibliographyCount: 10
});

console.log('Module generated:', result.module);
console.log('Quiz questions:', result.quiz?.questions.length);
console.log('Videos found:', result.videos?.length);
console.log('References:', result.bibliography?.length);
```

### Quiz Generation with Enhancements

```typescript
import { EnhancedQuizGenerator } from './services/quiz';
import { OpenAIProvider } from './services/llm/provider';

const provider = new OpenAIProvider(process.env.OPENAI_API_KEY!);
const quizGenerator = new EnhancedQuizGenerator(provider);

// Generate enhanced quiz
const quiz = await quizGenerator.generateEnhancedQuiz(
  'module-123',
  'Individuation Process',
  moduleContent,
  ['Understand individuation stages', 'Recognize individuation symbols'],
  10,
  {
    useTemplates: true,
    enhanceQuestions: true,
    adaptiveDifficulty: true,
    includeEssayQuestions: true,
    userLevel: 'intermediate'
  }
);

// Generate adaptive follow-up questions
const performanceHistory = [
  { correct: true, difficulty: 'easy' },
  { correct: true, difficulty: 'medium' },
  { correct: false, difficulty: 'hard' }
];

const adaptiveQuestions = await quizGenerator.generateAdaptiveQuestions(
  'Individuation Process',
  performanceHistory,
  5
);
```

### Bibliography Generation

```typescript
import { BibliographyEnricher, findReferencesByKeywords } from './services/bibliography';

const enricher = new BibliographyEnricher();

// Search for references
const references = await enricher.searchBibliography({
  concepts: ['collective unconscious', 'archetypes'],
  maxResults: 20,
  yearRange: { start: 2000, end: 2024 }
});

// Generate formatted bibliography
const bibliography = await enricher.generateBibliography(
  references,
  {
    format: 'APA',
    groupBy: 'type',
    includeAbstracts: true
  }
);

// Create reading path
const readingPath = await enricher.generateReadingPath(
  'Jungian Psychology',
  'beginner'
);
```

### Mind Map Generation

```typescript
import { MindMapGenerator, ReactFlowAdapter } from './services/mindmap';

const generator = new MindMapGenerator();
const adapter = new ReactFlowAdapter();

// Generate from module
const mindMapData = await generator.generateFromModule(module);

// Convert to React Flow format
const { nodes, edges } = adapter.toReactFlow(mindMapData);

// Generate from concepts
const conceptMap = await generator.generateFromConcepts(
  'Collective Unconscious',
  ['Archetypes', 'Personal Unconscious', 'Ego', 'Self'],
  3 // depth
);
```

### Video Enrichment

```typescript
import { VideoEnricher } from './services/video';

const enricher = new VideoEnricher();

// Search for educational videos
const videos = await enricher.searchVideos(
  'Jung Shadow Work',
  {
    maxResults: 10,
    language: 'en',
    duration: 'medium',
    educationalOnly: true
  }
);

// Filter by educational value
const highQualityVideos = videos.filter(v => 
  v.educationalValue && v.educationalValue > 0.7
);
```

### Using the Unified Module Generator

```typescript
import { UnifiedModuleGenerator } from './services/moduleGeneration';

const generator = new UnifiedModuleGenerator();

// Quick generation
const quickModule = await generator.generateQuickModule('Anima and Animus');

// Study-focused generation
const studyModule = await generator.generateStudyModule('Dream Analysis');

// Research-focused generation
const researchModule = await generator.generateResearchModule('Synchronicity');

// Custom generation
const customModule = await generator.generateCustomModule(
  'Active Imagination',
  {
    module: true,
    mindMap: true,
    quiz: true,
    videos: false,
    bibliography: true
  }
);
```

---

## Best Practices

### 1. Error Handling

Always wrap API calls in try-catch blocks and handle specific error types:

```typescript
try {
  const result = await service.method();
} catch (error) {
  if (error instanceof LLMProviderError) {
    // Handle provider errors
  } else if (error instanceof ValidationError) {
    // Handle validation errors
  } else {
    // Handle unexpected errors
  }
}
```

### 2. Progress Monitoring

Subscribe to progress events for long-running operations:

```typescript
orchestrator.on('progress', (progress) => {
  updateUI(progress.stage, progress.progress);
});
```

### 3. Token Management

Monitor token usage to avoid rate limits:

```typescript
const estimatedTokens = await orchestrator.estimateTokenUsage(options);
if (estimatedTokens > MAX_ALLOWED_TOKENS) {
  // Reduce scope or split into batches
}
```

### 4. Caching

Implement caching for expensive operations:

```typescript
const cacheKey = `module:${topic}:${difficulty}`;
const cached = await cache.get(cacheKey);
if (cached) return cached;

const result = await generator.generateModule(options);
await cache.set(cacheKey, result, TTL);
```

### 5. Graceful Degradation

Provide fallbacks when services are unavailable:

```typescript
const options = {
  useRealServices: await checkServicesAvailable(),
  // Falls back to LLM-only generation if services unavailable
};
```

---

## Configuration

### Environment Variables

```bash
# LLM Provider
REACT_APP_OPENAI_API_KEY=your-api-key
REACT_APP_OPENAI_MODEL=gpt-4o-mini

# Service URLs
REACT_APP_YOUTUBE_API_KEY=your-youtube-key
REACT_APP_BIBLIOGRAPHY_API_URL=https://api.example.com

# Feature Flags
REACT_APP_USE_REAL_SERVICES=true
REACT_APP_ENABLE_CACHING=true

# Rate Limiting
REACT_APP_MAX_REQUESTS_PER_MINUTE=20
REACT_APP_MAX_TOKENS_PER_MINUTE=40000
```

### Configuration Object

```typescript
import { ConfigManager } from './services/llm/config';

const config = ConfigManager.getInstance();

config.updateConfig({
  provider: 'openai',
  model: 'gpt-4o-mini',
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  rateLimit: {
    maxRequestsPerMinute: 20,
    maxTokensPerMinute: 40000
  },
  defaultOptions: {
    temperature: 0.7,
    maxTokens: 2000
  }
});
```

---

## Troubleshooting

### Common Issues

1. **Provider Unavailable**
   - Check API key configuration
   - Verify network connectivity
   - Check service status

2. **Rate Limit Exceeded**
   - Implement request queuing
   - Reduce token usage
   - Use caching

3. **Generation Timeout**
   - Increase timeout settings
   - Reduce content scope
   - Check provider status

4. **Invalid JSON Response**
   - Check prompt formatting
   - Verify schema definitions
   - Enable retry logic

5. **Memory Issues**
   - Implement streaming for large content
   - Use pagination
   - Clear caches periodically

### Debug Mode

Enable debug logging:

```typescript
if (process.env.NODE_ENV === 'development') {
  orchestrator.on('debug', console.log);
}
```

---

## Version History

- **v2.0.0** - Current version with full service integration
- **v1.5.0** - Added mind map generation
- **v1.0.0** - Initial release with basic generation

---

## Advanced Service Details

### LLM Provider Architecture

The LLM provider system uses a flexible architecture that supports multiple providers:

#### Provider Interface Implementation

```typescript
// OpenAI Provider Example
const provider = new OpenAIProvider(apiKey, model);

// Check availability before use
if (await provider.isAvailable()) {
  const completion = await provider.generateCompletion(prompt, {
    temperature: 0.7,
    maxTokens: 2000,
    systemPrompt: "You are an expert in Jungian psychology"
  });
}

// Generate structured JSON response
const structuredData = await provider.generateStructuredResponse(
  prompt,
  moduleSchema,
  { temperature: 0.5 }
);
```

#### Rate Limiting and Token Management

```typescript
const rateLimiter = new RateLimiter({
  maxRequestsPerMinute: 20,
  maxTokensPerMinute: 40000
});

// Check before making request
if (await rateLimiter.canMakeRequest(estimatedTokens)) {
  await rateLimiter.recordRequest(actualTokens);
  // Make API call
}
```

### Enhanced Quiz Generation Features

#### Question Template System

```typescript
// Available question templates
const templates = {
  conceptIdentification: {
    stem: "Which of the following best describes {concept}?",
    requiresOptions: true,
    cognitiveLevel: 'understand'
  },
  applicationScenario: {
    stem: "In the context of {scenario}, how would {concept} manifest?",
    requiresOptions: true,
    cognitiveLevel: 'apply'
  },
  criticalAnalysis: {
    stem: "Analyze the relationship between {concept1} and {concept2}",
    requiresOptions: false,
    cognitiveLevel: 'analyze'
  }
};
```

#### Adaptive Question Generation

```typescript
// Generate questions based on performance
const adaptiveGenerator = new AdaptiveQuestionGenerator();

const nextQuestions = await adaptiveGenerator.generateNext({
  performanceHistory: [
    { questionId: 'q1', correct: true, difficulty: 'easy', timeSpent: 30 },
    { questionId: 'q2', correct: false, difficulty: 'medium', timeSpent: 45 }
  ],
  targetDifficulty: 'progressive',
  conceptsCovered: ['shadow', 'persona'],
  conceptsRemaining: ['anima', 'self']
});
```

#### Study Guide Generation

```typescript
interface StudyGuide {
  focusAreas: Array<{
    concept: string;
    strengthLevel: 'weak' | 'moderate' | 'strong';
    recommendations: string[];
    resources: Reference[];
  }>;
  personalizedPath: Array<{
    week: number;
    topics: string[];
    activities: string[];
    assessments: string[];
  }>;
  estimatedTimeToMastery: number; // hours
}
```

### Video Enrichment Advanced Features

#### Transcript Analysis

```typescript
// Analyze video transcript for educational value
const transcriptAnalysis = await videoEnricher.analyzeTranscript(videoId, {
  extractKeyMoments: true,
  identifyConcepts: true,
  assessComplexity: true
});

// Returns:
{
  keyMoments: [
    { timestamp: 120, concept: "Shadow integration", importance: 0.9 },
    { timestamp: 340, concept: "Active imagination", importance: 0.85 }
  ],
  conceptDensity: 0.75, // concepts per minute
  vocabularyLevel: 'advanced',
  educationalStructure: 'well-organized'
}
```

#### Video Recommendation Engine

```typescript
const recommendations = await videoEnricher.recommendVideos({
  completedVideos: ['video-1', 'video-2'],
  userLevel: 'intermediate',
  preferredDuration: 'medium',
  topics: ['individuation', 'dreams']
});
```

### Bibliography Advanced Features

#### Citation Network Analysis

```typescript
// Analyze citation relationships
const citationNetwork = bibliographyEnricher.analyzeCitationNetwork(references);

// Returns:
{
  mostCited: Reference[],
  citationClusters: Array<{
    theme: string;
    references: Reference[];
    centralWork: Reference;
  }>,
  timelineAnalysis: {
    periods: Array<{
      years: string;
      dominantThemes: string[];
      keyWorks: Reference[];
    }>
  }
}
```

#### Reading Difficulty Progression

```typescript
const progression = await bibliographyEnricher.createReadingProgression(
  topic,
  currentLevel,
  targetLevel,
  timeframe // weeks
);

// Returns structured reading plan with milestones
```

### Mind Map Advanced Features

#### Concept Relationship Analysis

```typescript
// Analyze relationships between concepts
const relationships = mindMapGenerator.analyzeConceptRelationships(concepts);

// Returns:
{
  strongConnections: Array<{
    concept1: string;
    concept2: string;
    strength: number;
    type: 'complementary' | 'opposing' | 'hierarchical' | 'associative';
  }>,
  clusters: Array<{
    centralConcept: string;
    relatedConcepts: string[];
    clusterType: string;
  }>
}
```

#### Interactive Mind Map Features

```typescript
// Generate interactive mind map data
const interactiveMap = mindMapGenerator.generateInteractive(module, {
  enableDrillDown: true,
  includeResources: true,
  animationEnabled: true
});

// Supports:
// - Click to expand/collapse nodes
// - Hover for detailed information
// - Resource links on nodes
// - Concept relationship visualization
```

### Module Generation Workflow Integration

#### Pipeline Configuration

```typescript
const pipeline = new ModuleGenerationPipeline({
  stages: [
    { name: 'content', weight: 0.3 },
    { name: 'quiz', weight: 0.2 },
    { name: 'videos', weight: 0.2 },
    { name: 'bibliography', weight: 0.15 },
    { name: 'mindmap', weight: 0.15 }
  ],
  parallelExecution: true,
  errorHandling: 'graceful-degradation'
});
```

#### Custom Hooks and Middleware

```typescript
// Add custom processing steps
orchestrator.addHook('pre-generation', async (options) => {
  // Validate and enhance options
  return enhancedOptions;
});

orchestrator.addHook('post-quiz', async (quiz) => {
  // Custom quiz processing
  return processedQuiz;
});

orchestrator.addMiddleware('content-filter', async (content) => {
  // Filter or modify content
  return filteredContent;
});
```

### Performance Optimization

#### Caching Strategy

```typescript
const cache = new ContentCache({
  ttl: 3600, // 1 hour
  maxSize: 100, // MB
  strategy: 'lru'
});

// Cache expensive operations
const cachedResult = await cache.getOrGenerate(
  cacheKey,
  async () => await expensiveOperation()
);
```

#### Batch Processing

```typescript
// Process multiple modules efficiently
const batchProcessor = new BatchModuleProcessor({
  concurrency: 3,
  retryAttempts: 2,
  progressCallback: (progress) => console.log(progress)
});

const results = await batchProcessor.processModules(moduleConfigs);
```

### Integration Examples

#### React Component Integration

```typescript
// Custom React hook for module generation
function useModuleGeneration() {
  const [progress, setProgress] = useState<GenerationProgress>();
  const [result, setResult] = useState<GenerationResult>();
  const [error, setError] = useState<Error>();

  const generateModule = useCallback(async (options: GenerationOptions) => {
    const orchestrator = new ModuleGenerationOrchestrator();
    
    orchestrator.on('progress', setProgress);
    
    try {
      const result = await orchestrator.generateModule(options);
      setResult(result);
    } catch (err) {
      setError(err as Error);
    }
  }, []);

  return { generateModule, progress, result, error };
}
```

#### WebSocket Real-time Updates

```typescript
// Real-time generation updates
class GenerationWebSocket {
  constructor(private ws: WebSocket) {
    this.setupOrchestrator();
  }

  private setupOrchestrator() {
    const orchestrator = new ModuleGenerationOrchestrator();
    
    orchestrator.on('progress', (progress) => {
      this.ws.send(JSON.stringify({
        type: 'progress',
        data: progress
      }));
    });
  }
}
```

### Testing Utilities

#### Mock Data Generators

```typescript
// Generate test data
const testModule = generateMockModule({
  topic: 'Test Topic',
  sectionCount: 5,
  includeQuiz: true
});

const testQuiz = generateMockQuiz({
  questionCount: 10,
  difficulty: 'mixed'
});
```

#### Service Testing Helpers

```typescript
// Test service integration
const testHelper = new ServiceTestHelper();

await testHelper.testQuizGeneration({
  validateStructure: true,
  checkDifficulty: true,
  ensureUniqueness: true
});
```

## Real-time Features

### WebSocket API

Real-time updates for module generation and collaborative features:

```typescript
// WebSocket connection setup
const ws = new WebSocket('ws://localhost:3001/ws');

ws.on('connect', () => {
  // Subscribe to generation events
  ws.send(JSON.stringify({
    type: 'subscribe',
    channel: 'generation-progress',
    moduleId: 'module-123'
  }));
});

// Handle real-time events
ws.on('message', (data) => {
  const event = JSON.parse(data);
  
  switch (event.type) {
    case 'generation-progress':
      updateProgressBar(event.data.progress);
      break;
    case 'generation-complete':
      displayModule(event.data.module);
      break;
    case 'generation-error':
      handleError(event.data.error);
      break;
  }
});
```

### Event Types

```typescript
interface GenerationEvent {
  type: 'generation-progress' | 'generation-complete' | 'generation-error';
  moduleId: string;
  timestamp: Date;
  data: any;
}

interface CollaborationEvent {
  type: 'user-joined' | 'user-left' | 'content-updated' | 'quiz-answered';
  sessionId: string;
  userId: string;
  data: any;
}
```

## API Endpoints Reference

### REST API Overview

Base URL: `https://api.jaqedu.com/v1`

#### Authentication

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "token": "jwt-token",
  "user": { ... },
  "expiresIn": 3600
}
```

#### Module Endpoints

```http
# List modules
GET /modules?page=1&limit=10&difficulty=intermediate

# Get specific module
GET /modules/:id

# Create module
POST /modules
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Shadow Work",
  "description": "...",
  "difficulty": "intermediate",
  "options": { ... }
}

# Update module
PUT /modules/:id
Authorization: Bearer {token}

# Delete module
DELETE /modules/:id
Authorization: Bearer {token}
```

#### Generation Endpoints

```http
# Generate complete module
POST /generate/module
Authorization: Bearer {token}
Content-Type: application/json

{
  "topic": "Individuation Process",
  "options": {
    "includeQuiz": true,
    "includeVideos": true,
    "includeBibliography": true,
    "includeMindMap": true
  }
}

# Generate quiz only
POST /generate/quiz
Authorization: Bearer {token}

# Generate mind map
POST /generate/mindmap
Authorization: Bearer {token}
```

#### Analytics Endpoints

```http
# Get module analytics
GET /analytics/modules/:id

# Get user progress
GET /analytics/users/:userId/progress

# Get quiz performance
GET /analytics/quizzes/:id/performance
```

## SDK Examples

### JavaScript/TypeScript SDK

```typescript
import { JaqEduSDK } from '@jaqedu/sdk';

const sdk = new JaqEduSDK({
  apiKey: 'your-api-key',
  environment: 'production'
});

// Generate a module
const module = await sdk.modules.generate({
  topic: 'The Collective Unconscious',
  difficulty: 'advanced',
  includeAll: true
});

// Track progress
await sdk.progress.track(module.id, {
  userId: 'user-123',
  completed: ['section-1', 'section-2'],
  quizScore: 85
});
```

### Python SDK

```python
from jaqedu import JaqEduClient

client = JaqEduClient(api_key='your-api-key')

# Generate module
module = client.modules.generate(
    topic='Archetypes',
    difficulty='intermediate',
    include_quiz=True,
    include_videos=True
)

# Search videos
videos = client.videos.search(
    query='Jung shadow work',
    max_results=10,
    educational_only=True
)
```

## Deployment Guide

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Configuration

```bash
# Production environment variables
NODE_ENV=production
API_URL=https://api.jaqedu.com
OPENAI_API_KEY=sk-...
YOUTUBE_API_KEY=...
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
```

### Scaling Considerations

1. **API Rate Limiting**: Implement per-user and per-IP rate limits
2. **Caching Strategy**: Use Redis for frequently accessed data
3. **CDN Integration**: Serve static content through CDN
4. **Database Optimization**: Index frequently queried fields
5. **Background Jobs**: Use queue system for heavy operations

## Security Best Practices

### API Security

1. **Authentication**: Use JWT with refresh tokens
2. **Input Validation**: Validate all inputs against schemas
3. **SQL Injection Prevention**: Use parameterized queries
4. **XSS Protection**: Sanitize user-generated content
5. **CORS Configuration**: Whitelist allowed origins

### Data Protection

```typescript
// Example: Secure data handling
class SecureDataHandler {
  // Encrypt sensitive data
  async encryptData(data: any): Promise<string> {
    return crypto.encrypt(JSON.stringify(data), this.encryptionKey);
  }

  // Validate and sanitize input
  validateInput(input: any, schema: Schema): ValidationResult {
    return validator.validate(input, schema, {
      stripUnknown: true,
      abortEarly: false
    });
  }

  // Secure API calls
  async secureApiCall(endpoint: string, data: any): Promise<any> {
    const sanitized = this.sanitizeData(data);
    const encrypted = await this.encryptData(sanitized);
    
    return fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        'X-Request-ID': generateRequestId()
      },
      body: JSON.stringify({ data: encrypted })
    });
  }
}
```

## Monitoring and Logging

### Structured Logging

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Log API requests
app.use((req, res, next) => {
  logger.info({
    type: 'api_request',
    method: req.method,
    path: req.path,
    userId: req.user?.id,
    timestamp: new Date()
  });
  next();
});
```

### Health Checks

```typescript
// Health check endpoint
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date(),
    services: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      openai: await checkOpenAI(),
      youtube: await checkYouTube()
    }
  };
  
  res.json(health);
});
```

## Migration Guide

### From v1 to v2

```typescript
// v1 API (deprecated)
const module = await api.generateModule(topic, options);

// v2 API (current)
const module = await orchestrator.generateModule({
  topic,
  objectives: ['...'],
  targetAudience: '...',
  ...options
});
```

### Database Migrations

```sql
-- Add new fields for v2
ALTER TABLE modules ADD COLUMN metadata JSONB;
ALTER TABLE quizzes ADD COLUMN adaptive_config JSONB;
ALTER TABLE videos ADD COLUMN enrichment_data JSONB;

-- Create indexes for performance
CREATE INDEX idx_modules_metadata ON modules USING GIN (metadata);
CREATE INDEX idx_quizzes_module_id ON quizzes (module_id);
```

## Support

For issues and questions:
- GitHub Issues: [jaqEdu Repository](https://github.com/yourusername/jaqedu)
- Documentation: [Developer Docs](https://jaqedu.docs.com)
- API Status: [status.jaqedu.com](https://status.jaqedu.com)
- Email: support@jaqedu.com
- Discord: [JaqEdu Community](https://discord.gg/jaqedu)