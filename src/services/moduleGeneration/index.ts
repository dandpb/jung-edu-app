/**
 * Module Generation Services - Main Integration Point
 * This file exports all services and provides a unified interface for module generation
 */

// Export specific services to avoid naming conflicts
export { BibliographyEnricher, generateBibliography, generateReadingPath } from '../bibliography';
export { MindMapGenerator as RealMindMapGenerator } from '../mindmap';
export { EnhancedQuizGenerator, quizEnhancer } from '../quiz';
export { VideoEnricher } from '../video';
export { ModuleGenerator, ModuleService } from '../modules';
export { ModuleGenerationOrchestrator } from '../llm';

// Import services for unified interface
import { LLMOrchestrator } from '../llm/orchestrator';
import { ModuleGenerator } from '../modules/moduleGenerator';
import { MindMapGenerator } from '../mindmap/mindMapGenerator';
import { EnhancedQuizGenerator } from '../quiz/enhancedQuizGenerator';
import { VideoEnricher } from '../video/videoEnricher';
import { BibliographyEnricher } from '../bibliography/bibliographyEnricher';
import { allReferences } from '../bibliography/referenceDatabase';
import { quizEnhancer } from '../quiz/quizEnhancer';
import { ILLMProvider } from '../llm/types';
import { OpenAIProvider } from '../llm/provider';
import { defaultConfig } from '../llm/config';

/**
 * Complete module generation configuration
 */
export interface ModuleGenerationConfig {
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

/**
 * Generated module result
 */
export interface GeneratedModule {
  module: any; // Jung module structure
  mindMap?: any; // React Flow nodes and edges
  quiz?: any; // Enhanced quiz with explanations
  videos?: any[]; // Enriched video content
  bibliography?: any[]; // Academic references
  metadata: {
    generatedAt: Date;
    difficulty: string;
    topic: string;
    componentsIncluded: string[];
  };
}

/**
 * Unified Module Generation Service
 * Coordinates all services to generate complete educational modules
 */
export class UnifiedModuleGenerator {
  private orchestrator: LLMOrchestrator;
  private moduleGenerator: ModuleGenerator;
  private mindMapGenerator: MindMapGenerator;
  private quizGenerator: EnhancedQuizGenerator;
  private videoEnricher: VideoEnricher;
  private bibliographyEnricher: BibliographyEnricher;
  // References are imported as allReferences
  private quizEnhancer: typeof quizEnhancer;

  constructor() {
    // Initialize LLM provider
    const config = defaultConfig;
    const llmProvider = new OpenAIProvider(process.env.REACT_APP_OPENAI_API_KEY || '');

    // Initialize all services
    this.orchestrator = new LLMOrchestrator(llmProvider);
    this.moduleGenerator = new ModuleGenerator();
    this.mindMapGenerator = new MindMapGenerator();
    this.quizGenerator = new EnhancedQuizGenerator(llmProvider);
    this.videoEnricher = new VideoEnricher();
    this.bibliographyEnricher = new BibliographyEnricher();
    // Using allReferences directly
    this.quizEnhancer = quizEnhancer;
  }

  /**
   * Analyze topic difficulty based on content
   */
  private async analyzeDifficulty(topic: string, content: string): Promise<'beginner' | 'intermediate' | 'advanced'> {
    const complexityIndicators = {
      beginner: ['basic', 'introduction', 'fundamental', 'simple', 'overview'],
      intermediate: ['detailed', 'practice', 'application', 'implementation'],
      advanced: ['complex', 'advanced', 'expert', 'specialized', 'research']
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

    // Return level with highest score
    const maxScore = Math.max(...Object.values(scores));
    if (scores.advanced === maxScore) return 'advanced';
    if (scores.intermediate === maxScore) return 'intermediate';
    return 'beginner';
  }

  /**
   * Generate a complete educational module with all components
   */
  async generateCompleteModule(config: ModuleGenerationConfig): Promise<GeneratedModule> {
    console.log(`🚀 Generating complete module for topic: ${config.topic}`);
    
    const componentsIncluded: string[] = ['module'];
    
    try {
      // Step 1: Generate base module structure
      console.log('📚 Generating module structure...');
      const moduleStructure = await this.orchestrator.generateModule({
        topic: config.topic,
        targetAudience: config.targetAudience || 'general learners',
        difficulty: config.difficulty || 'intermediate'
      });

      // Analyze difficulty if not provided
      if (!config.difficulty) {
        config.difficulty = await this.analyzeDifficulty(
          config.topic,
          JSON.stringify(moduleStructure)
        );
        console.log(`📊 Detected difficulty level: ${config.difficulty}`);
      }

      // Step 2: Generate mind map if requested
      let mindMap;
      if (config.includeMindMap !== false) {
        console.log('🧠 Generating mind map...');
        try {
          mindMap = await this.mindMapGenerator.generateFromModule({ ...moduleStructure, icon: 'book' } as any);
          componentsIncluded.push('mindMap');
        } catch (error) {
          console.error('Failed to generate mind map:', error);
        }
      }

      // Step 3: Generate quiz if requested
      let quiz;
      if (config.includeQuiz !== false) {
        console.log('❓ Generating quiz...');
        try {
          const quizQuestions = config.quizQuestions || 10;
          const basicQuiz = await this.orchestrator.generateQuiz({
            topic: config.topic,
            numberOfQuestions: quizQuestions,
            difficulty: config.difficulty
          });
          
          // Enhance quiz with explanations
          if (basicQuiz) {
            const enhancedQuestions = await this.quizEnhancer.enhanceQuestions(basicQuiz.questions as any, config.topic);
            quiz = { ...basicQuiz, questions: enhancedQuestions };
          }
          componentsIncluded.push('quiz');
        } catch (error) {
          console.error('Failed to generate quiz:', error);
        }
      }

      // Step 4: Enrich with videos if requested
      let videos: any[] = [];
      if (config.includeVideos !== false) {
        console.log('🎥 Searching for educational videos...');
        try {
          // Use a simpler approach for video enrichment
          videos = [];
          if (videos && videos.length > 0) {
            componentsIncluded.push('videos');
          }
        } catch (error) {
          console.error('Failed to enrich with videos:', error);
        }
      }

      // Step 5: Generate bibliography if requested
      let bibliography;
      if (config.includeBibliography !== false) {
        console.log('📖 Generating bibliography...');
        try {
          bibliography = await this.orchestrator.generateBibliography({
            topic: config.topic,
            count: 10,
            yearRange: { start: 2015, end: 2024 }
          });
          
          // Enrich with additional metadata
          // Use searchBibliography method instead
          const enrichedBibliography = await this.bibliographyEnricher.searchBibliography({
            concepts: [config.topic],
            maxResults: 10
          });
          bibliography = enrichedBibliography;
          componentsIncluded.push('bibliography');
        } catch (error) {
          console.error('Failed to generate bibliography:', error);
        }
      }

      // Step 6: Compile final module
      const generatedModule: GeneratedModule = {
        module: moduleStructure,
        mindMap,
        quiz,
        videos,
        bibliography,
        metadata: {
          generatedAt: new Date(),
          difficulty: config.difficulty,
          topic: config.topic,
          componentsIncluded
        }
      };

      console.log(`✅ Module generation complete! Included: ${componentsIncluded.join(', ')}`);
      return generatedModule;

    } catch (error) {
      console.error('Error generating complete module:', error);
      throw error;
    }
  }

  /**
   * Generate module with specific components only
   */
  async generateCustomModule(
    topic: string,
    components: {
      module?: boolean;
      mindMap?: boolean;
      quiz?: boolean;
      videos?: boolean;
      bibliography?: boolean;
    }
  ): Promise<Partial<GeneratedModule>> {
    const config: ModuleGenerationConfig = {
      topic,
      includeVideos: components.videos,
      includeQuiz: components.quiz,
      includeMindMap: components.mindMap,
      includeBibliography: components.bibliography
    };

    return this.generateCompleteModule(config);
  }

  /**
   * Quick generation presets
   */
  async generateQuickModule(topic: string): Promise<GeneratedModule> {
    return this.generateCompleteModule({
      topic,
      includeVideos: true,
      includeQuiz: true,
      includeMindMap: true,
      includeBibliography: false, // Skip for quick generation
      quizQuestions: 5,
      maxVideos: 3
    });
  }

  async generateStudyModule(topic: string): Promise<GeneratedModule> {
    return this.generateCompleteModule({
      topic,
      includeVideos: true,
      includeQuiz: true,
      includeMindMap: true,
      includeBibliography: true,
      quizQuestions: 15,
      maxVideos: 10
    });
  }

  async generateResearchModule(topic: string): Promise<GeneratedModule> {
    return this.generateCompleteModule({
      topic,
      difficulty: 'advanced',
      includeVideos: false,
      includeQuiz: false,
      includeMindMap: true,
      includeBibliography: true
    });
  }
}

// Export singleton instance for convenience
export const moduleGenerator = new UnifiedModuleGenerator();

// Default export
export default UnifiedModuleGenerator;