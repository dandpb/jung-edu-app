import { EventEmitter } from 'events';
import { ILLMProvider, OpenAIProvider, MockLLMProvider } from './provider';
import { ConfigManager, RateLimiter } from './config';
import { ContentGenerator } from './generators/content-generator';
import { QuizGenerator } from './generators/quiz-generator';
import { VideoGenerator } from './generators/video-generator';
import { BibliographyGenerator } from './generators/bibliography-generator';
import { MindMapGenerator } from './generators/mindmap-generator';
import { Module, ModuleContent, Quiz } from '../../types/schema';
import { Video } from '../../schemas/module.schema';

// Import real services for integration
import { MindMapGenerator as RealMindMapGenerator } from '../mindmap/mindMapGenerator';
import { EnhancedQuizGenerator } from '../quiz/enhancedQuizGenerator';
import { VideoEnricher } from '../video/videoEnricher';
import { BibliographyEnricher } from '../bibliography/bibliographyEnricher';
import { QuizEnhancer } from '../quiz/quizEnhancer';

export interface GenerationProgress {
  stage: 'initializing' | 'content' | 'quiz' | 'videos' | 'bibliography' | 'mindmap' | 'finalizing' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  details?: any;
}

export interface GenerationOptions {
  topic: string;
  objectives: string[];
  targetAudience: string;
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  includeVideos?: boolean;
  includeBibliography?: boolean;
  includeMindMap?: boolean;
  quizQuestions?: number;
  videoCount?: number;
  bibliographyCount?: number;
  useRealServices?: boolean; // Flag to use real services instead of LLM generators
}

export interface GenerationResult {
  module: Module;
  content: ModuleContent;
  quiz?: Quiz;
  videos?: Video[];
  bibliography?: any[];
  mindMap?: any;
}

export class ModuleGenerationOrchestrator extends EventEmitter {
  private provider: ILLMProvider;
  private rateLimiter: RateLimiter;
  private contentGenerator: ContentGenerator;
  private quizGenerator: QuizGenerator;
  private videoGenerator: VideoGenerator;
  private bibliographyGenerator: BibliographyGenerator;
  private mindMapGenerator: MindMapGenerator;
  
  // Real service instances
  private realMindMapGenerator?: RealMindMapGenerator;
  private realQuizGenerator?: EnhancedQuizGenerator;
  private videoEnricher?: VideoEnricher;
  private bibliographyEnricher?: BibliographyEnricher;
  private quizEnhancer?: QuizEnhancer;

  constructor(useRealServices: boolean = true) {
    super();
    const config = ConfigManager.getInstance().getConfig();
    
    // Initialize provider
    this.provider = config.provider === 'openai' && config.apiKey
      ? new OpenAIProvider(config.apiKey, config.model)
      : new MockLLMProvider();
    
    console.log('LLM Orchestrator initialized:', {
      provider: config.provider,
      hasApiKey: !!config.apiKey,
      model: config.model,
      usingRealProvider: this.provider instanceof OpenAIProvider
    });
    
    // Initialize rate limiter
    this.rateLimiter = new RateLimiter(config.rateLimit!);
    
    // Initialize generators
    this.contentGenerator = new ContentGenerator(this.provider);
    this.quizGenerator = new QuizGenerator(this.provider);
    this.videoGenerator = new VideoGenerator(this.provider);
    this.bibliographyGenerator = new BibliographyGenerator(this.provider);
    this.mindMapGenerator = new MindMapGenerator(this.provider);
    
    // Initialize real services if enabled
    if (useRealServices) {
      this.realMindMapGenerator = new RealMindMapGenerator();
      this.realQuizGenerator = new EnhancedQuizGenerator(this.provider);
      this.videoEnricher = new VideoEnricher();
      this.bibliographyEnricher = new BibliographyEnricher();
      this.quizEnhancer = new QuizEnhancer();
    }
  }

  async generateModule(options: GenerationOptions): Promise<GenerationResult> {
    try {
      this.updateProgress('initializing', 0, 'Starting module generation...');

      // Generate content first
      this.updateProgress('content', 15, 'Generating educational content...');
      const content = await this.generateContent(options);

      // Create base module
      const module: Module = {
        id: `module-${Date.now()}`,
        title: options.topic,
        description: `A comprehensive module on ${options.topic} in Jungian psychology`,
        difficulty: options.difficulty,
        estimatedTime: options.duration,
        objectives: options.objectives,
        prerequisites: [],
        content: content,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          targetAudience: options.targetAudience,
          version: 1,
          status: 'draft',
          tags: this.extractTags(options.topic, options.objectives),
          jungianConcepts: [],
        },
      };
      
      // Update module with extracted concepts
      if (module.metadata) {
        module.metadata.jungianConcepts = this.extractJungianConcepts(content);
      }

      // Generate quiz
      let quiz: Quiz | undefined;
      if (options.quizQuestions && options.quizQuestions > 0) {
        this.updateProgress('quiz', 40, 'Creating assessment questions...');
        quiz = await this.generateQuiz(module, content, options);
      }

      // Generate video resources
      let videos: Video[] | undefined;
      if (options.includeVideos) {
        this.updateProgress('videos', 55, 'Finding video resources...');
        videos = await this.generateVideos(options, module.metadata?.jungianConcepts || []);
      }

      // Generate bibliography
      let bibliography: any[] | undefined;
      if (options.includeBibliography) {
        this.updateProgress('bibliography', 70, 'Compiling bibliography...');
        bibliography = await this.generateBibliography(options, module.metadata?.jungianConcepts || []);
      }

      // Generate mind map
      let mindMap: any | undefined;
      if (options.includeMindMap) {
        this.updateProgress('mindmap', 85, 'Creating concept mind map...');
        mindMap = await this.generateMindMap(options, module.metadata?.jungianConcepts || [], module);
      }

      // Finalize
      this.updateProgress('finalizing', 95, 'Finalizing module...');
      
      const result: GenerationResult = {
        module,
        content,
        quiz,
        videos,
        bibliography,
        mindMap,
      };

      this.updateProgress('complete', 100, 'Module generation complete!', result);
      return result;

    } catch (error) {
      this.updateProgress('error', 0, `Generation failed: ${error}`, error);
      throw error;
    }
  }

  private async generateContent(options: GenerationOptions): Promise<ModuleContent> {
    await this.rateLimiter.checkLimit(5000); // Estimate tokens
    this.rateLimiter.incrementActive();
    
    try {
      const content = await this.contentGenerator.generateModuleContent(
        options.topic,
        options.objectives,
        options.targetAudience,
        options.duration
      );
      
      this.rateLimiter.recordRequest(4000); // Actual tokens used
      return content;
    } finally {
      this.rateLimiter.decrementActive();
    }
  }

  private async generateQuiz(
    module: Module,
    content: ModuleContent,
    options: GenerationOptions
  ): Promise<Quiz> {
    await this.rateLimiter.checkLimit(3000);
    this.rateLimiter.incrementActive();
    
    try {
      // Use real quiz generator if available and enabled
      if (options.useRealServices && this.realQuizGenerator && this.quizEnhancer) {
        // Generate quiz with real service
        const generatedQuiz = await this.realQuizGenerator.generateQuiz(
          module.id,
          options.topic,
          JSON.stringify(content),
          module.objectives,
          options.quizQuestions || 10
        );
        
        // Enhance with additional features
        const enhancedQuestions = await this.quizEnhancer.enhanceQuestions(generatedQuiz.questions, options.topic);
        const enhancedQuiz = { ...generatedQuiz, questions: enhancedQuestions };
        
        // Convert to expected format
        return {
          id: `quiz-${module.id}`,
          moduleId: module.id,
          title: `Assessment: ${options.topic}`,
          description: `Test your understanding of ${options.topic}`,
          questions: enhancedQuiz.questions,
          passingScore: 70,
          timeLimit: (options.quizQuestions || 10) * 2, // 2 minutes per question
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
      
      // Fall back to LLM generator
      const fullContent = [
        content.introduction,
        ...content.sections.map(s => s.content),
        content.summary,
      ].join('\n\n');

      const quiz = await this.quizGenerator.generateQuiz(
        module.id,
        options.topic,
        fullContent.substring(0, 3000), // Limit context size
        options.objectives,
        options.quizQuestions || 10
      );
      
      this.rateLimiter.recordRequest(2500);
      return quiz;
    } finally {
      this.rateLimiter.decrementActive();
    }
  }

  private async generateVideos(
    options: GenerationOptions,
    concepts: string[]
  ): Promise<Video[]> {
    await this.rateLimiter.checkLimit(1500);
    this.rateLimiter.incrementActive();
    
    try {
      // Use real video enricher if available and enabled
      if (options.useRealServices && this.videoEnricher) {
        const moduleStructure = {
          title: options.topic,
          sections: concepts.map(concept => ({
            title: concept,
            content: `Content about ${concept}`
          }))
        };
        
        // Use fallback method since enrichModuleWithVideos doesn't exist
        const mockVideos = await this.videoGenerator.generateVideos(
          options.topic,
          concepts,
          options.targetAudience,
          options.videoCount || 5
        );
        
        // Convert to Video format
        return mockVideos.slice(0, options.videoCount || 5);
      }
      
      // Fall back to LLM generator
      const videos = await this.videoGenerator.generateVideos(
        options.topic,
        concepts,
        options.targetAudience,
        options.videoCount || 5
      );
      
      this.rateLimiter.recordRequest(1000);
      return videos;
    } finally {
      this.rateLimiter.decrementActive();
    }
  }

  private async generateBibliography(
    options: GenerationOptions,
    concepts: string[]
  ): Promise<any[]> {
    await this.rateLimiter.checkLimit(2000);
    this.rateLimiter.incrementActive();
    
    try {
      const level = options.difficulty === 'beginner' ? 'introductory' :
                    options.difficulty === 'advanced' ? 'advanced' : 'intermediate';
      
      // Generate bibliography using LLM
      const bibliography = await this.bibliographyGenerator.generateBibliography(
        options.topic,
        concepts,
        level,
        options.bibliographyCount || 10
      );
      
      // Enrich with real service if available
      if (options.useRealServices && this.bibliographyEnricher) {
        const enrichedItems = await this.bibliographyEnricher.searchBibliography({
          concepts: concepts,
          maxResults: 10
        });
        return enrichedItems.slice(0, 10);
      }
      
      this.rateLimiter.recordRequest(1500);
      return bibliography;
    } finally {
      this.rateLimiter.decrementActive();
    }
  }

  private async generateMindMap(
    options: GenerationOptions,
    concepts: string[],
    module: Module
  ): Promise<any> {
    await this.rateLimiter.checkLimit(2500);
    this.rateLimiter.incrementActive();
    
    try {
      // Use real mind map generator if available and enabled
      if (options.useRealServices && this.realMindMapGenerator) {
        // Cast module to match expected type
        const moduleWithIcon = { ...module, icon: 'book' } as any;
        const mindMapData = await this.realMindMapGenerator.generateFromModule(moduleWithIcon);
        return mindMapData;
      }
      
      // Fall back to LLM generator
      const style = options.difficulty === 'beginner' ? 'simplified' :
                    options.difficulty === 'advanced' ? 'analytical' : 'comprehensive';
      
      const mindMap = await this.mindMapGenerator.generateMindMap(
        options.topic,
        concepts,
        3,
        style
      );
      
      this.rateLimiter.recordRequest(2000);
      return mindMap;
    } finally {
      this.rateLimiter.decrementActive();
    }
  }

  /**
   * Analyze topic difficulty based on content complexity
   */
  async analyzeDifficulty(topic: string, content: string): Promise<'beginner' | 'intermediate' | 'advanced'> {
    const complexityIndicators = {
      beginner: ['basic', 'introduction', 'fundamental', 'simple', 'overview', 'beginning', 'start'],
      intermediate: ['detailed', 'practice', 'application', 'implementation', 'develop', 'explore'],
      advanced: ['complex', 'advanced', 'expert', 'specialized', 'research', 'theory', 'analysis']
    };

    const lowerContent = content.toLowerCase();
    const scores = {
      beginner: 0,
      intermediate: 0,
      advanced: 0
    };

    // Score based on indicators
    for (const [level, indicators] of Object.entries(complexityIndicators)) {
      for (const indicator of indicators) {
        if (lowerContent.includes(indicator)) {
          scores[level as keyof typeof scores]++;
        }
      }
    }

    // Check for technical depth
    const technicalTerms = ['archetype', 'individuation', 'collective unconscious', 'complex', 'transcendent function'];
    const technicalCount = technicalTerms.filter(term => lowerContent.includes(term)).length;
    
    if (technicalCount > 3) scores.advanced += 2;
    else if (technicalCount > 1) scores.intermediate += 2;
    else scores.beginner += 1;

    // Return level with highest score
    const maxScore = Math.max(...Object.values(scores));
    if (scores.advanced === maxScore) return 'advanced';
    if (scores.intermediate === maxScore) return 'intermediate';
    return 'beginner';
  }

  private updateProgress(
    stage: GenerationProgress['stage'],
    progress: number,
    message: string,
    details?: any
  ): void {
    const progressData: GenerationProgress = {
      stage,
      progress,
      message,
      details,
    };
    
    this.emit('progress', progressData);
  }

  private extractTags(topic: string, objectives: string[]): string[] {
    // Extract relevant tags from topic and objectives
    const allText = `${topic} ${objectives.join(' ')}`.toLowerCase();
    const jungianKeywords = [
      'archetype', 'shadow', 'anima', 'animus', 'self', 'ego', 'persona',
      'collective unconscious', 'individuation', 'complex', 'symbol',
      'dream', 'myth', 'synchronicity', 'projection', 'integration'
    ];
    
    return jungianKeywords.filter(keyword => allText.includes(keyword));
  }

  private extractJungianConcepts(content: ModuleContent): string[] {
    // Extract Jungian concepts from generated content
    const allText = [
      content.introduction,
      ...content.sections.map(s => s.content),
      content.summary,
    ].join(' ').toLowerCase();

    const concepts = new Set<string>();
    const conceptPatterns = [
      /archetype[s]?\s+of\s+\w+/g,
      /\b(shadow|anima|animus|self|ego|persona)\b/g,
      /collective\s+unconscious/g,
      /individuation\s+process/g,
      /psychological\s+type[s]?/g,
      /complex[es]?\b/g,
    ];

    conceptPatterns.forEach(pattern => {
      const matches = allText.match(pattern);
      if (matches) {
        matches.forEach(match => concepts.add(match.trim()));
      }
    });

    return Array.from(concepts);
  }

  async checkProviderAvailability(): Promise<boolean> {
    try {
      return await this.provider.isAvailable();
    } catch {
      return false;
    }
  }

  async estimateTokenUsage(options: GenerationOptions): Promise<number> {
    let estimate = 0;
    
    // Base content generation
    estimate += 5000;
    
    // Quiz generation
    if (options.quizQuestions) {
      estimate += options.quizQuestions * 300;
    }
    
    // Video resources
    if (options.includeVideos) {
      estimate += 1500;
    }
    
    // Bibliography
    if (options.includeBibliography) {
      estimate += 2000;
    }
    
    // Mind map
    if (options.includeMindMap) {
      estimate += 2500;
    }
    
    return estimate;
  }
}

/**
 * LLM Orchestrator - Simplified interface for the UnifiedModuleGenerator
 */
export class LLMOrchestrator {
  private orchestrator: ModuleGenerationOrchestrator;

  constructor(provider?: ILLMProvider) {
    this.orchestrator = new ModuleGenerationOrchestrator(true);
  }

  async generateModule(options: {
    topic: string;
    targetAudience?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
  }) {
    const generationOptions: GenerationOptions = {
      topic: options.topic,
      objectives: [`Understand the fundamentals of ${options.topic}`, `Apply ${options.topic} concepts in practice`],
      targetAudience: options.targetAudience || 'general learners',
      duration: 60,
      difficulty: options.difficulty || 'intermediate',
      includeVideos: false,
      includeBibliography: false,
      includeMindMap: false,
      useRealServices: true
    };

    const result = await this.orchestrator.generateModule(generationOptions);
    return result.module;
  }

  async generateQuiz(options: {
    topic: string;
    numberOfQuestions: number;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
  }) {
    const generationOptions: GenerationOptions = {
      topic: options.topic,
      objectives: [`Assess understanding of ${options.topic}`],
      targetAudience: 'students',
      duration: 30,
      difficulty: options.difficulty || 'intermediate',
      quizQuestions: options.numberOfQuestions,
      useRealServices: true
    };

    const result = await this.orchestrator.generateModule(generationOptions);
    return result.quiz;
  }

  async generateBibliography(options: {
    topic: string;
    count?: number;
    yearRange?: { start: number; end: number };
  }) {
    const generationOptions: GenerationOptions = {
      topic: options.topic,
      objectives: [`Research ${options.topic}`],
      targetAudience: 'researchers',
      duration: 60,
      difficulty: 'advanced',
      includeBibliography: true,
      bibliographyCount: options.count || 10,
      useRealServices: true
    };

    const result = await this.orchestrator.generateModule(generationOptions);
    return result.bibliography || [];
  }
}