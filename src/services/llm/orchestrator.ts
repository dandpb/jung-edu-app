import { EventEmitter } from 'events';
import { ILLMProvider } from './types';
import { OpenAIProvider, MockLLMProvider } from './provider';
import { ConfigManager, RateLimiter } from './config';
import { ContentGenerator } from './generators/content-generator';
import { QuizGenerator } from './generators/quiz-generator';
import { VideoGenerator } from './generators/video-generator';
import { BibliographyGenerator } from './generators/bibliography-generator';
import { MindMapGenerator } from './generators/mindmap-generator';
import { Module, ModuleContent, Quiz, Video, Bibliography, Film } from '../../types/index';

// Import real services for integration
import { MindMapGenerator as RealMindMapGenerator } from '../mindmap/mindMapGenerator';
import { EnhancedQuizGenerator } from '../quiz/enhancedQuizGenerator';
import { VideoEnricher } from '../video/videoEnricher';
import { BibliographyEnricher } from '../bibliography/bibliographyEnricher';
import { QuizEnhancer } from '../quiz/quizEnhancer';

export interface GenerationProgress {
  stage: 'initializing' | 'content' | 'quiz' | 'videos' | 'bibliography' | 'films' | 'mindmap' | 'finalizing' | 'complete' | 'error';
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
  includeFilms?: boolean;
  includeMindMap?: boolean;
  quizQuestions?: number;
  videoCount?: number;
  bibliographyCount?: number;
  filmCount?: number;
  useRealServices?: boolean; // Flag to use real services instead of LLM generators
}

export interface GenerationResult {
  module: Module;
  content: ModuleContent;
  quiz?: Quiz;
  videos?: Video[];
  bibliography?: any[];
  films?: any[];
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
    
    // Initialize provider - use mock if explicitly requested
    if (!useRealServices) {
      this.provider = new MockLLMProvider(50); // Reduce delay for tests
    } else {
      this.provider = config.provider === 'openai' && config.apiKey
        ? new OpenAIProvider(config.apiKey, config.model)
        : new MockLLMProvider();
    }
    
    console.log('LLM Orchestrator initialized:', {
      provider: this.provider instanceof MockLLMProvider ? 'mock' : config.provider,
      hasApiKey: !!config.apiKey,
      model: config.model,
      usingRealProvider: this.provider instanceof OpenAIProvider,
      useRealServices: useRealServices
    });
    
    // Initialize rate limiter - use a no-op for tests
    if (!useRealServices) {
      // Create a no-op rate limiter for tests
      this.rateLimiter = {
        checkLimit: async () => {},
        recordRequest: () => {},
        incrementActive: () => {},
        decrementActive: () => {}
      } as any;
    } else {
      this.rateLimiter = new RateLimiter(config.rateLimit!);
    }
    
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

  // Helper method to extract YouTube ID from URL
  private extractYouTubeId(url: string): string | null {
    // Handle undefined or empty URLs
    if (!url || typeof url !== 'string') {
      return null;
    }
    
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  async generateModule(options: GenerationOptions): Promise<GenerationResult> {
    try {
      this.updateProgress('initializing', 0, 'Starting module generation...');

      // Generate content first
      this.updateProgress('content', 15, 'Generating educational content...');
      const content = await this.generateContent(options);

      // Create base module
      const module = {
        id: `module-${Date.now()}`,
        title: options.topic,
        description: `A comprehensive module on ${options.topic} in Jungian psychology`,
        icon: '🧠',
        difficulty: options.difficulty,
        estimatedTime: options.duration,
        prerequisites: [],
        content: content,
        category: 'psychology',
        // Additional properties not in the base Module interface
        objectives: options.objectives,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          targetAudience: options.targetAudience,
          version: 1,
          status: 'draft',
          tags: this.extractTags(options.topic, options.objectives),
          jungianConcepts: [],
        },
      } as Module & { objectives: string[]; createdAt: Date; updatedAt: Date; metadata: any };
      
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

      // Generate films
      let films: any[] | undefined;
      if (options.includeFilms) {
        this.updateProgress('films', 77, 'Finding related films...');
        films = await this.generateFilms(options, module.metadata?.jungianConcepts || []);
      }

      // Generate mind map
      let mindMap: any | undefined;
      if (options.includeMindMap) {
        this.updateProgress('mindmap', 85, 'Creating concept mind map...');
        mindMap = await this.generateMindMap(options, module.metadata?.jungianConcepts || [], module);
      }

      // Finalize - Update module content with generated resources
      this.updateProgress('finalizing', 95, 'Finalizing module...');
      
      // Update module content with all generated resources
      if (module.content) {
        if (videos) {
          module.content.videos = videos;
        }
        if (quiz) {
          module.content.quiz = quiz;
        }
        if (bibliography) {
          module.content.bibliography = bibliography;
        }
        if (films) {
          module.content.films = films;
        }
      }
      
      const result: GenerationResult = {
        module,
        content,
        quiz,
        videos,
        bibliography,
        films,
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
          (module as any).objectives,
          options.quizQuestions || 10
        );
        
        // Enhance with additional features
        const enhancedQuestions = await this.quizEnhancer.enhanceQuestions(generatedQuiz.questions, options.topic);
        const enhancedQuiz = { ...generatedQuiz, questions: enhancedQuestions };
        
        // Convert to expected format
        const quizResult = {
          id: `quiz-${module.id}`,
          title: `Assessment: ${options.topic}`,
          description: `Test your understanding of ${options.topic}`,
          questions: enhancedQuiz.questions
            .map((q: any, index: number) => {
              // Ensure questions have proper structure
              const questionBase = {
                id: q.id || `q-${index + 1}`,
                question: q.question || `Questão sobre ${options.topic}`,
                correctAnswer: q.correctAnswer || 0,
                explanation: q.explanation || `Explicação sobre ${options.topic}`
              };

              // Handle options with more flexibility
              if (q.options && Array.isArray(q.options) && q.options.length >= 2) {
                return {
                  ...questionBase,
                  options: q.options
                };
              } else {
                // Provide fallback options if missing
                console.warn(`Questão ${questionBase.id} sem opções válidas, criando opções de fallback`);
                return {
                  ...questionBase,
                  options: [
                    { id: 'opt-1', text: 'Conceito fundamental da teoria junguiana', isCorrect: true },
                    { id: 'opt-2', text: 'Aspecto secundário da personalidade', isCorrect: false },
                    { id: 'opt-3', text: 'Elemento não relacionado ao tema', isCorrect: false },
                    { id: 'opt-4', text: 'Conceito da psicologia comportamental', isCorrect: false }
                  ]
                };
              }
            })
            .filter(q => q && q.question) // Only filter out questions without content
        } as Quiz;
        
        // Add extra properties that may be used elsewhere
        (quizResult as any).moduleId = module.id;
        (quizResult as any).passingScore = 70;
        (quizResult as any).timeLimit = (options.quizQuestions || 10) * 2;
        (quizResult as any).createdAt = new Date();
        (quizResult as any).updatedAt = new Date();
        
        return quizResult;
      }
      
      // Fall back to LLM generator
      const fullContent = [
        content.introduction,
        ...content.sections.map(s => s.content),
        (content as any).summary || '',
      ].join('\n\n');

      const generatedQuiz = await this.quizGenerator.generateQuiz(
        module.id,
        options.topic,
        fullContent.substring(0, 3000), // Limit context size
        options.objectives,
        options.quizQuestions || 10
      );
      
      this.rateLimiter.recordRequest(2500);
      
      // Transform to match the expected Quiz type
      const transformedQuiz = {
        id: generatedQuiz.id,
        title: generatedQuiz.title,
        description: generatedQuiz.description || '',
        questions: generatedQuiz.questions
          .filter((q: any) => q.options && q.options.length > 0)
          .map((q: any) => ({
            id: q.id,
            question: q.question,
            options: q.options!,
            correctAnswer: q.correctAnswer || 0,
            explanation: q.explanation || ''
          }))
      } as Quiz;
      
      // Add extra properties
      (transformedQuiz as any).passingScore = generatedQuiz.passingScore || 70;
      (transformedQuiz as any).timeLimit = generatedQuiz.timeLimit;
      
      return transformedQuiz;
    } finally {
      this.rateLimiter.decrementActive();
    }
  }

  private async generateVideos(
    options: GenerationOptions,
    concepts: string[]
  ): Promise<any[]> {
    await this.rateLimiter.checkLimit(1500);
    this.rateLimiter.incrementActive();
    
    try {
      // Ensure we have at least one concept to work with
      const workingConcepts = concepts.length > 0 ? concepts : [options.topic];
      
      // Use real video enricher if available and enabled
      if (options.useRealServices && this.videoEnricher) {
        const moduleStructure = {
          title: options.topic,
          sections: workingConcepts.map(concept => ({
            title: concept,
            content: `Content about ${concept}`
          }))
        };
        
        // Use fallback method since enrichModuleWithVideos doesn't exist
        const mockVideos = await this.videoGenerator.generateVideos(
          options.topic,
          workingConcepts,
          options.targetAudience,
          options.videoCount || 5
        );
        
        // Convert to expected Video format
        return mockVideos.slice(0, options.videoCount || 5).map((video: any) => ({
          id: video.id,
          title: video.title,
          youtubeId: this.extractYouTubeId(video.url) || 'dQw4w9WgXcQ',
          description: video.description,
          duration: typeof video.duration === 'object' ? video.duration.minutes : video.duration || 15,
          url: video.url // Keep original url for reference
        }));
      }
      
      // Use LLM generator to get real YouTube videos
      const videos = await this.videoGenerator.generateVideos(
        options.topic,
        workingConcepts,
        options.targetAudience,
        options.videoCount || 5
      );
      
      this.rateLimiter.recordRequest(1000);
      
      // Transform videos to expected format
      // The video generator now returns real YouTube videos with valid IDs
      return videos.map((video: any) => ({
        id: video.id,
        title: video.title,
        youtubeId: video.youtubeId || this.extractYouTubeId(video.url) || undefined,
        description: video.description,
        duration: typeof video.duration === 'object' ? video.duration.minutes : video.duration || 15,
        url: video.url // Keep original url for reference
      })).filter(v => v.youtubeId); // Only include videos with valid YouTube IDs
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
      // Ensure we have at least one concept to work with
      const workingConcepts = concepts.length > 0 ? concepts : [options.topic];
      
      const level = options.difficulty === 'beginner' ? 'introductory' :
                    options.difficulty === 'advanced' ? 'advanced' : 'intermediate';
      
      // Generate bibliography using LLM (AI-generated recommendations)
      const aiBibliography = await this.bibliographyGenerator.generateBibliography(
        options.topic,
        workingConcepts,
        level,
        options.bibliographyCount || 10
      );
      
      console.log('✅ AI-generated bibliography entries:', aiBibliography.length);
      
      // Only use enricher as fallback if AI generation fails or returns empty
      if ((!aiBibliography || aiBibliography.length === 0) && options.useRealServices && this.bibliographyEnricher) {
        try {
          console.log('⚠️ AI bibliography empty, using enricher as fallback');
          const enrichedItems = await this.bibliographyEnricher.searchBibliography({
            concepts: workingConcepts,
            maxResults: options.bibliographyCount || 10
          });
          return enrichedItems.slice(0, options.bibliographyCount || 10);
        } catch (error) {
          console.warn('Falha ao usar enricher como fallback:', error);
          return [];
        }
      }
      
      this.rateLimiter.recordRequest(1500);
      return aiBibliography;
    } finally {
      this.rateLimiter.decrementActive();
    }
  }

  private async generateFilms(
    options: GenerationOptions,
    concepts: string[]
  ): Promise<any[]> {
    await this.rateLimiter.checkLimit(1500);
    this.rateLimiter.incrementActive();
    
    try {
      // Ensure we have at least one concept to work with
      const workingConcepts = concepts.length > 0 ? concepts : [options.topic];
      
      // Generate film suggestions using the bibliography generator
      const films = await this.bibliographyGenerator.generateFilmSuggestions(
        options.topic,
        workingConcepts,
        options.filmCount || 5
      );
      
      this.rateLimiter.recordRequest(1000);
      return films;
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
      
      // Ensure we have at least one concept to work with
      const workingConcepts = concepts.length > 0 ? concepts : [options.topic];
      
      const mindMap = await this.mindMapGenerator.generateMindMap(
        options.topic,
        workingConcepts,
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
      (content as any).summary || '',
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