# LLM API Service Structure

## Directory Structure

```
src/services/llm/
├── index.ts                    # Main export file
├── types.ts                    # TypeScript interfaces and types
├── config.ts                   # Configuration and environment variables
├── providers/
│   ├── base.ts               # Abstract base provider class
│   ├── openai.ts             # OpenAI implementation
│   ├── anthropic.ts          # Claude implementation
│   ├── gemini.ts             # Google Gemini implementation
│   └── index.ts              # Provider factory
├── generators/
│   ├── content.ts            # Main content generator
│   ├── quiz.ts               # Quiz question generator
│   ├── video.ts              # Video finder/recommender
│   ├── bibliography.ts       # Bibliography generator
│   ├── metadata.ts           # Tags and difficulty assessment
│   └── index.ts              # Generator orchestrator
├── validators/
│   ├── content.ts            # Content validation
│   ├── psychology.ts         # Jung-specific validation
│   └── educational.ts        # Educational quality checks
├── utils/
│   ├── cache.ts              # Caching utilities
│   ├── rateLimiter.ts        # Rate limiting
│   ├── cost.ts               # Cost calculation
│   └── prompts.ts            # Prompt templates
└── __tests__/
    ├── providers/
    ├── generators/
    └── validators/
```

## Core Type Definitions

```typescript
// src/services/llm/types.ts

export interface ModuleGenerationRequest {
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  includeVideos: boolean;
  includeQuiz: boolean;
  includeBibliography: boolean;
  includeFilms: boolean;
  language: string;
  targetAudience?: string;
  prerequisites?: string[];
  customInstructions?: string;
  jungianConcepts?: string[];
}

export interface GenerationOptions {
  provider?: 'openai' | 'anthropic' | 'gemini' | 'auto';
  model?: string;
  temperature?: number;
  maxTokens?: number;
  streaming?: boolean;
  cache?: boolean;
}

export interface GenerationResult<T> {
  data: T;
  metadata: {
    provider: string;
    model: string;
    tokensUsed: number;
    cost: number;
    duration: number;
    cached: boolean;
  };
}

export interface GenerationProgress {
  id: string;
  stage: GenerationStage;
  progress: number;
  currentTask: string;
  estimatedTimeRemaining?: number;
  completedStages: GenerationStage[];
  errors?: GenerationError[];
}

export type GenerationStage = 
  | 'initializing' 
  | 'content' 
  | 'videos' 
  | 'quiz' 
  | 'bibliography' 
  | 'validation' 
  | 'complete';

export interface GenerationError {
  stage: GenerationStage;
  message: string;
  recoverable: boolean;
  timestamp: number;
}

export interface ProviderConfig {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
  maxRetries?: number;
  timeout?: number;
}

export interface CacheConfig {
  enabled: boolean;
  ttl: number;
  maxSize: number;
  storage: 'memory' | 'redis' | 'filesystem';
}
```

## Provider Implementation

```typescript
// src/services/llm/providers/base.ts

export abstract class LLMProvider {
  protected config: ProviderConfig;
  protected rateLimiter: RateLimiter;
  
  constructor(config: ProviderConfig) {
    this.config = config;
    this.rateLimiter = new RateLimiter(config);
  }
  
  abstract generateContent(
    prompt: string, 
    options?: GenerationOptions
  ): Promise<GenerationResult<string>>;
  
  abstract generateStructured<T>(
    prompt: string, 
    schema: z.ZodSchema<T>,
    options?: GenerationOptions
  ): Promise<GenerationResult<T>>;
  
  abstract embedText(text: string): Promise<number[]>;
  
  abstract streamContent(
    prompt: string,
    onChunk: (chunk: string) => void,
    options?: GenerationOptions
  ): Promise<GenerationResult<string>>;
  
  protected async trackUsage(
    tokensUsed: number,
    model: string
  ): Promise<void> {
    // Track token usage and costs
  }
  
  protected handleError(error: any): never {
    // Standardized error handling
    throw new LLMProviderError(error);
  }
}

// src/services/llm/providers/openai.ts

export class OpenAIProvider extends LLMProvider {
  private client: OpenAI;
  
  constructor(config: ProviderConfig) {
    super(config);
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    });
  }
  
  async generateContent(
    prompt: string,
    options: GenerationOptions = {}
  ): Promise<GenerationResult<string>> {
    const startTime = Date.now();
    
    try {
      await this.rateLimiter.acquire();
      
      const response = await this.client.chat.completions.create({
        model: options.model || this.config.defaultModel || 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens,
      });
      
      const content = response.choices[0].message.content || '';
      const tokensUsed = response.usage?.total_tokens || 0;
      
      await this.trackUsage(tokensUsed, response.model);
      
      return {
        data: content,
        metadata: {
          provider: 'openai',
          model: response.model,
          tokensUsed,
          cost: calculateCost('openai', response.model, tokensUsed),
          duration: Date.now() - startTime,
          cached: false,
        },
      };
    } catch (error) {
      this.handleError(error);
    }
  }
  
  async generateStructured<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    options: GenerationOptions = {}
  ): Promise<GenerationResult<T>> {
    // Use function calling for structured output
    const functionSchema = zodToJsonSchema(schema);
    
    const response = await this.client.chat.completions.create({
      model: options.model || 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      functions: [{
        name: 'output',
        description: 'Structured output',
        parameters: functionSchema,
      }],
      function_call: { name: 'output' },
    });
    
    const functionCall = response.choices[0].message.function_call;
    const data = JSON.parse(functionCall?.arguments || '{}');
    
    return {
      data: schema.parse(data),
      metadata: {
        // ... metadata
      },
    };
  }
}
```

## Generator Implementation

```typescript
// src/services/llm/generators/content.ts

export class ContentGenerator {
  constructor(
    private provider: LLMProvider,
    private validator: ContentValidator
  ) {}
  
  async generateModuleContent(
    request: ModuleGenerationRequest,
    onProgress?: (progress: GenerationProgress) => void
  ): Promise<ModuleContent> {
    const progressTracker = new ProgressTracker(request.topic);
    
    try {
      // Step 1: Generate outline
      progressTracker.updateStage('content', 'Generating module outline...');
      onProgress?.(progressTracker.getProgress());
      
      const outline = await this.generateOutline(request);
      
      // Step 2: Generate sections
      progressTracker.updateProgress(20, 'Generating content sections...');
      onProgress?.(progressTracker.getProgress());
      
      const sections = await this.generateSections(outline, request);
      
      // Step 3: Extract key terms
      progressTracker.updateProgress(40, 'Extracting key terms...');
      onProgress?.(progressTracker.getProgress());
      
      const keyTerms = await this.extractKeyTerms(sections);
      
      // Step 4: Generate introduction
      progressTracker.updateProgress(60, 'Creating introduction...');
      onProgress?.(progressTracker.getProgress());
      
      const introduction = await this.generateIntroduction(request, sections);
      
      // Step 5: Validate content
      progressTracker.updateProgress(80, 'Validating content...');
      onProgress?.(progressTracker.getProgress());
      
      const validatedContent = await this.validator.validate({
        introduction,
        sections,
      });
      
      progressTracker.complete();
      onProgress?.(progressTracker.getProgress());
      
      return validatedContent;
    } catch (error) {
      progressTracker.error(error.message);
      onProgress?.(progressTracker.getProgress());
      throw error;
    }
  }
  
  private async generateOutline(
    request: ModuleGenerationRequest
  ): Promise<ModuleOutline> {
    const prompt = this.buildOutlinePrompt(request);
    
    const result = await this.provider.generateStructured(
      prompt,
      ModuleOutlineSchema,
      { temperature: 0.7 }
    );
    
    return result.data;
  }
  
  private buildOutlinePrompt(request: ModuleGenerationRequest): string {
    return `
Create a comprehensive outline for an educational module about "${request.topic}" 
in the context of Carl Jung's Analytical Psychology.

Requirements:
- Difficulty level: ${request.difficulty}
- Estimated time: ${request.estimatedTime} minutes
- Target audience: ${request.targetAudience || 'General learners'}
${request.prerequisites ? `- Prerequisites: ${request.prerequisites.join(', ')}` : ''}
${request.jungianConcepts ? `- Include these Jungian concepts: ${request.jungianConcepts.join(', ')}` : ''}

Create an outline with 3-5 main sections, each with 2-4 subsections.
Focus on educational progression and practical understanding.
Include relevant Jungian concepts and their applications.
    `.trim();
  }
}
```

## Orchestrator Implementation

```typescript
// src/services/llm/generators/index.ts

export class ModuleGenerationOrchestrator {
  private contentGenerator: ContentGenerator;
  private quizGenerator: QuizGenerator;
  private videoFinder: VideoFinder;
  private bibliographyGenerator: BibliographyGenerator;
  private metadataGenerator: MetadataGenerator;
  private cache: CacheService;
  
  constructor(config: OrchestratorConfig) {
    // Initialize all generators
  }
  
  async generateModule(
    request: ModuleGenerationRequest,
    options: GenerationOptions = {}
  ): Promise<Module> {
    const jobId = generateJobId();
    const progress = new ProgressReporter(jobId);
    
    try {
      // Check cache first
      const cached = await this.cache.get(request);
      if (cached && options.cache !== false) {
        return cached;
      }
      
      // Parallel generation where possible
      const [content, videos] = await Promise.all([
        this.generateContent(request, progress),
        request.includeVideos ? this.findVideos(request, progress) : null,
      ]);
      
      // Sequential generation for dependent components
      const quiz = request.includeQuiz 
        ? await this.generateQuiz(content, request, progress)
        : null;
        
      const bibliography = request.includeBibliography
        ? await this.generateBibliography(content, request, progress)
        : null;
        
      
      const metadata = await this.generateMetadata(content, request);
      
      const module: Module = {
        id: generateModuleId(),
        title: request.topic,
        description: content.introduction.substring(0, 200) + '...',
        icon: this.selectIcon(request.topic),
        content: {
          ...content,
          videos: videos || [],
          quiz,
          bibliography: bibliography || [],
          films: request.includeFilms ? await this.findFilms(request) : [],
        },
        prerequisites: request.prerequisites,
        estimatedTime: request.estimatedTime,
        difficulty: metadata.difficulty,
        tags: metadata.tags,
      };
      
      // Cache the result
      await this.cache.set(request, module);
      
      progress.complete();
      
      return module;
    } catch (error) {
      progress.error(error);
      throw new ModuleGenerationError(error.message, jobId);
    }
  }
  
  async getProgress(jobId: string): Promise<GenerationProgress> {
    return this.progressStore.get(jobId);
  }
  
  async regenerateComponent(
    moduleId: string,
    component: keyof Module['content']
  ): Promise<Module> {
    // Regenerate specific component
  }
}
```

## Prompt Templates

```typescript
// src/services/llm/utils/prompts.ts

export const SYSTEM_PROMPTS = {
  jungianExpert: `
You are an expert in Carl Jung's Analytical Psychology with deep knowledge of:
- The collective unconscious and archetypes
- Individuation process
- Shadow work and integration
- Anima/Animus concepts
- Psychological types
- Dream analysis
- Active imagination
- Synchronicity

Always ensure psychological accuracy and educational value in your responses.
  `,
  
  educationalDesigner: `
You are an expert educational content designer specializing in:
- Progressive learning structures
- Clear explanations for complex concepts
- Engaging educational materials
- Assessment design
- Multi-modal learning approaches

Create content that is accessible, engaging, and pedagogically sound.
  `,
  
  quizDesigner: `
You are an expert assessment designer who creates:
- Questions that test understanding, not just memorization
- Clear, unambiguous question wording
- Plausible distractors for multiple choice
- Detailed explanations for correct answers
- Balanced difficulty levels
  `,
};

export const PROMPT_TEMPLATES = {
  sectionGeneration: (topic: string, outline: string, requirements: any) => `
Generate detailed educational content for the section "${topic}".

Outline context:
${outline}

Requirements:
- Write in an engaging, educational style
- Include practical examples
- Reference relevant Jungian concepts
- Approximately ${requirements.wordCount || 500} words
- Include 3-5 key terms with definitions

Format the response with clear paragraphs and educational progression.
  `,
  
  keyTermExtraction: (content: string) => `
Extract key terms from the following educational content about Jungian psychology.

Content:
${content}

For each term:
1. Identify the term (prefer Jungian terminology)
2. Provide a clear, concise definition
3. Ensure the definition is accurate and educational

Return 5-10 most important terms.
  `,
  
  quizGeneration: (content: string, config: any) => `
Create quiz questions based on this Jungian psychology content:

${content}

Requirements:
- ${config.multipleChoice} multiple choice questions
- ${config.trueFalse} true/false questions
- Focus on understanding, not memorization
- Include explanations for all answers
- Vary difficulty levels

Ensure questions test comprehension of Jungian concepts.
  `,
};
```

## Usage Example

```typescript
// Example usage in the application

import { ModuleGenerationOrchestrator } from '@/services/llm';

const orchestrator = new ModuleGenerationOrchestrator({
  providers: {
    content: 'openai',
    quiz: 'openai',
    video: 'gemini',
    bibliography: 'anthropic',
  },
  cache: {
    enabled: true,
    ttl: 3600,
  },
});

// Generate a module
const module = await orchestrator.generateModule({
  topic: 'The Shadow in Jungian Psychology',
  difficulty: 'intermediate',
  estimatedTime: 45,
  includeVideos: true,
  includeQuiz: true,
  includeBibliography: true,
  includeFilms: true,
  language: 'en',
  targetAudience: 'Psychology students',
  jungianConcepts: ['Shadow', 'Individuation', 'Projection'],
});

// Track progress
const progress = await orchestrator.getProgress(jobId);
console.log(`Generation ${progress.progress}% complete: ${progress.currentTask}`);
```

## API Integration

```typescript
// src/api/modules/generate.ts

export async function POST(req: Request) {
  const body = await req.json();
  const request = ModuleGenerationRequestSchema.parse(body);
  
  // Start generation job
  const jobId = await moduleQueue.add('generate', request);
  
  return NextResponse.json({
    jobId,
    status: 'processing',
    estimatedTime: estimateGenerationTime(request),
  });
}

// src/api/modules/[id]/progress.ts

export async function GET(req: Request, { params }) {
  const progress = await orchestrator.getProgress(params.id);
  
  return NextResponse.json(progress);
}
```

This structure provides a comprehensive, modular, and extensible system for LLM integration in the Jung Educational App.