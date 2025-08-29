/**
 * Module Generator Service
 * Orchestrates AI-powered module content generation
 */

import { EducationalModule, DifficultyLevel, ModuleStatus } from '../../schemas/module.schema';
import { ILLMProvider } from '../llm/types';
import { OpenAIProvider, MockLLMProvider } from '../llm/provider';
import { ModuleService } from './moduleService';
import { v4 as uuidv4 } from 'uuid';

export interface GenerationProgress {
  stage: GenerationStage;
  progress: number; // 0-100
  message: string;
  details?: any;
}

export enum GenerationStage {
  INITIALIZING = 'initializing',
  GENERATING_CONTENT = 'generating_content',
  GENERATING_QUIZ = 'generating_quiz',
  SOURCING_VIDEOS = 'sourcing_videos',
  ADDING_BIBLIOGRAPHY = 'adding_bibliography',
  FINALIZING = 'finalizing',
  COMPLETED = 'completed',
  ERROR = 'error'
}

export interface GenerationOptions {
  topic: string;
  description?: string;
  difficulty: DifficultyLevel;
  duration?: number; // Target duration in minutes
  tags?: string[];
  language?: string;
  includeVideos?: boolean;
  includeQuiz?: boolean;
  includeBibliography?: boolean;
  llmProvider?: ILLMProvider;
  onProgress?: (progress: GenerationProgress) => void;
}

export class ModuleGenerator {
  private llmProvider: ILLMProvider;
  private progressCallback?: (progress: GenerationProgress) => void;

  constructor(llmProvider?: ILLMProvider) {
    // Use mock provider if no API key is available
    this.llmProvider = llmProvider || new MockLLMProvider(1000);
  }

  /**
   * Generate a complete educational module
   */
  async generateModule(options: GenerationOptions): Promise<EducationalModule> {
    this.progressCallback = options.onProgress;
    
    try {
      // Initialize
      await this.reportProgress(GenerationStage.INITIALIZING, 0, 'Starting module generation...');

      // Create base module structure
      const moduleId = uuidv4();
      const baseModule: Partial<EducationalModule> = {
        id: moduleId,
        title: await this.generateTitle(options),
        description: options.description || await this.generateDescription(options),
        tags: options.tags || await this.generateTags(options),
        difficultyLevel: options.difficulty,
        timeEstimate: this.estimateTime(options.duration),
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: '1.0.0',
          status: ModuleStatus.DRAFT,
          language: options.language || 'en',
          author: {
            id: 'ai-generator',
            name: 'AI Module Generator',
            role: 'content_creator'
          }
        }
      };

      // Save draft early for recovery
      await ModuleService.saveDraft(baseModule);

      // Generate content sections
      await this.reportProgress(GenerationStage.GENERATING_CONTENT, 20, 'Generating module content...');
      baseModule.content = await this.generateContent(options);
      await ModuleService.saveDraft(baseModule);

      // Generate quiz if requested
      if (options.includeQuiz !== false) {
        await this.reportProgress(GenerationStage.GENERATING_QUIZ, 40, 'Creating quiz questions...');
        baseModule.quiz = await this.generateQuiz(options, baseModule.content!);
        await ModuleService.saveDraft(baseModule);
      }

      // Source videos if requested
      if (options.includeVideos !== false) {
        await this.reportProgress(GenerationStage.SOURCING_VIDEOS, 60, 'Finding relevant videos...');
        baseModule.videos = await this.sourceVideos(options);
        await ModuleService.saveDraft(baseModule);
      }


      // Add bibliography if requested
      if (options.includeBibliography !== false) {
        await this.reportProgress(GenerationStage.ADDING_BIBLIOGRAPHY, 85, 'Adding bibliography...');
        baseModule.bibliography = await this.generateBibliography(options);
        baseModule.filmReferences = await this.generateFilmReferences(options);
        await ModuleService.saveDraft(baseModule);
      }

      // Finalize module
      await this.reportProgress(GenerationStage.FINALIZING, 95, 'Finalizing module...');
      const finalModule = await this.finalizeModule(baseModule as EducationalModule);

      // Save completed module
      const savedModule = await ModuleService.createModule(finalModule);
      
      // Clean up draft
      await ModuleService.deleteDraft(moduleId);

      await this.reportProgress(GenerationStage.COMPLETED, 100, 'Module generation completed!');
      return savedModule;

    } catch (error) {
      await this.reportProgress(
        GenerationStage.ERROR, 
        0, 
        `Generation failed: ${error instanceof Error ? error.message : String(error)}`,
        { error }
      );
      throw error;
    }
  }

  /**
   * Resume generation from a draft
   */
  async resumeGeneration(draftId: string, options: GenerationOptions): Promise<EducationalModule> {
    const drafts = await ModuleService.getDrafts();
    const draft = drafts.find(d => d.id === draftId);

    if (!draft) {
      throw new Error(`Draft with ID ${draftId} not found`);
    }

    // Determine where to resume based on what's missing
    const resumeOptions = { ...options, onProgress: this.progressCallback };

    // Continue from where we left off
    if (!draft.content) {
      return this.generateModule(resumeOptions);
    }

    if (!draft.quiz && options.includeQuiz !== false) {
      draft.quiz = await this.generateQuiz(options, draft.content);
    }

    if (!draft.videos && options.includeVideos !== false) {
      draft.videos = await this.sourceVideos(options);
    }

    if (!draft.bibliography && options.includeBibliography !== false) {
      draft.bibliography = await this.generateBibliography(options);
      draft.filmReferences = await this.generateFilmReferences(options);
    }

    // Finalize and save
    const finalModule = await this.finalizeModule(draft as EducationalModule);
    const savedModule = await ModuleService.createModule(finalModule);
    
    // Clean up draft
    await ModuleService.deleteDraft(draftId);

    return savedModule;
  }

  private async reportProgress(stage: GenerationStage, progress: number, message: string, details?: any) {
    if (this.progressCallback) {
      try {
        this.progressCallback({ stage, progress, message, details });
      } catch (error) {
        // Log progress callback errors but don't fail the generation
        console.warn('Progress callback error:', error);
      }
    }
  }

  private async generateTitle(options: GenerationOptions): Promise<string> {
    const prompt = `Generate a concise, engaging title for an educational module about ${options.topic} in Jungian psychology. The title should be appropriate for ${options.difficulty} level learners.`;
    
    const response = await this.llmProvider.generateCompletion(prompt, {
      maxTokens: 50,
      temperature: 0.7
    });
    return response?.content || '';
  }

  private async generateDescription(options: GenerationOptions): Promise<string> {
    const prompt = `Write a compelling 2-3 sentence description for an educational module about ${options.topic} in Jungian psychology. The description should clearly state what learners will gain from this module.`;
    
    const response = await this.llmProvider.generateCompletion(prompt, {
      maxTokens: 150,
      temperature: 0.7
    });
    return response?.content || '';
  }

  private async generateTags(options: GenerationOptions): Promise<string[]> {
    const prompt = `Generate 5-8 relevant tags for an educational module about ${options.topic} in Jungian psychology. Return as a comma-separated list.`;
    
    const response = await this.llmProvider.generateCompletion(prompt, {
      maxTokens: 100,
      temperature: 0.5
    });

    return response?.content?.split(',').map(tag => tag.trim()) || ['psychology', 'jung', 'analytical'];
  }

  private async generateContent(options: GenerationOptions): Promise<any> {
    const prompt = `Create comprehensive educational content for a module about ${options.topic} in Jungian psychology.

The content should include:
1. An engaging introduction (200-300 words)
2. 3-5 main sections with clear headings
3. Key terms and definitions
4. Practical examples and applications
5. A summary of key takeaways

Target audience: ${options.difficulty} level
Estimated duration: ${options.duration || 60} minutes
Language: ${options.language || 'English'}

Format the response as a structured JSON object matching the ModuleContent schema.`;

    const schema = {
      introduction: 'string',
      sections: [{
        id: 'string',
        title: 'string',
        content: 'string',
        order: 'number',
        keyTerms: [{
          term: 'string',
          definition: 'string'
        }]
      }],
      summary: 'string',
      keyTakeaways: ['string']
    };

    return await this.llmProvider.generateStructuredOutput(prompt, schema, {
      maxTokens: 3000,
      temperature: 0.7
    });
  }

  private async generateQuiz(options: GenerationOptions, content: any): Promise<any> {
    const prompt = `Create a quiz based on the following educational content about ${options.topic}.

Content summary: ${content?.introduction || content?.summary || `Educational content about ${options.topic}`}

Generate 5-10 questions of varying types (multiple choice, true/false, open-ended) that test understanding of the key concepts. Include explanations for each answer.

Difficulty level: ${options.difficulty}`;

    const schema = {
      id: 'string',
      title: 'string',
      description: 'string',
      questions: [{
        id: 'string',
        type: 'string',
        question: 'string',
        points: 'number',
        explanation: 'string',
        // Additional fields based on question type
      }],
      passingScore: 'number'
    };

    return await this.llmProvider.generateStructuredOutput(prompt, schema, {
      maxTokens: 2000,
      temperature: 0.6
    });
  }

  private async sourceVideos(options: GenerationOptions): Promise<any[]> {
    // In a real implementation, this would search YouTube API or other video sources
    // For now, we'll generate mock video recommendations
    const prompt = `Recommend 3-5 educational videos about ${options.topic} in Jungian psychology. For each video, provide a title, description, estimated duration, and why it's relevant to the topic.`;

    const videos = await this.llmProvider.generateStructuredOutput(prompt, [{
      id: 'string',
      title: 'string',
      description: 'string',
      url: 'string',
      duration: {
        hours: 'number',
        minutes: 'number',
        seconds: 'number'
      }
    }], {
      maxTokens: 1000,
      temperature: 0.7
    });

    return Array.isArray(videos) ? videos : [];
  }


  private async generateBibliography(options: GenerationOptions): Promise<any[]> {
    const prompt = `Generate a bibliography of 5-8 relevant sources for studying ${options.topic} in Jungian psychology. Include books, journal articles, and other academic sources.`;

    const schema = [{
      id: 'string',
      title: 'string',
      authors: ['string'],
      year: 'number',
      type: 'string',
      relevanceNote: 'string'
    }];

    return await this.llmProvider.generateStructuredOutput(prompt, schema, {
      maxTokens: 1200,
      temperature: 0.6
    });
  }

  private async generateFilmReferences(options: GenerationOptions): Promise<any[]> {
    const prompt = `Recommend 2-3 films that relate to ${options.topic} in Jungian psychology. Explain how each film connects to the psychological concepts.`;

    const schema = [{
      id: 'string',
      title: 'string',
      director: ['string'],
      year: 'number',
      relevance: 'string'
    }];

    return await this.llmProvider.generateStructuredOutput(prompt, schema, {
      maxTokens: 800,
      temperature: 0.7
    });
  }

  private async finalizeModule(module: EducationalModule): Promise<EducationalModule> {
    // Perform any final processing or validation
    
    // Add learning objectives based on content
    if (!module.learningObjectives) {
      module.learningObjectives = await this.generateLearningObjectives(module);
    }

    // Add prerequisites if needed
    if (!module.prerequisites) {
      module.prerequisites = await this.generatePrerequisites(module);
    }

    // Update metadata - ensure it exists
    if (!module.metadata) {
      module.metadata = {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1.0.0',
        status: ModuleStatus.REVIEW,
        language: 'en',
        author: {
          id: 'ai-generator',
          name: 'AI Module Generator',
          role: 'content_creator'
        }
      };
    } else {
      module.metadata.updatedAt = new Date().toISOString();
      module.metadata.status = ModuleStatus.REVIEW;
    }

    return module;
  }

  private async generateLearningObjectives(module: EducationalModule): Promise<string[]> {
    const prompt = `Based on this module about ${module.title}, generate 3-5 clear learning objectives that describe what students will be able to do after completing the module.`;

    const response = await this.llmProvider.generateCompletion(prompt, {
      maxTokens: 300,
      temperature: 0.6
    });

    return response?.content?.split('\n').filter(obj => obj.trim().length > 0) || [];
  }

  private async generatePrerequisites(module: EducationalModule): Promise<string[]> {
    if (module.difficultyLevel === DifficultyLevel.BEGINNER) {
      return [];
    }

    const prompt = `List 2-3 prerequisites or prior knowledge needed for a ${module.difficultyLevel} level module about ${module.title}.`;

    const response = await this.llmProvider.generateCompletion(prompt, {
      maxTokens: 200,
      temperature: 0.6
    });

    return response?.content?.split('\n').filter(prereq => prereq.trim().length > 0) || [];
  }

  private estimateTime(targetMinutes?: number): { hours: number; minutes: number; description?: string } {
    const minutes = targetMinutes || 60;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    let description = '';
    if (hours > 0) {
      description = `${hours} hour${hours > 1 ? 's' : ''}`;
      if (remainingMinutes > 0) {
        description += ` ${remainingMinutes} minutes`;
      }
    } else {
      description = `${remainingMinutes} minutes`;
    }

    return {
      hours,
      minutes: remainingMinutes,
      description: `Approximately ${description} including videos and exercises`
    };
  }

  /**
   * Resume generation from a saved draft
   */
  async resumeFromDraft(draftId: string, options: GenerationOptions): Promise<EducationalModule> {
    const drafts = await ModuleService.getDrafts();
    const draft = drafts.find(d => d.id === draftId);
    
    if (!draft) {
      throw new Error(`Draft with ID ${draftId} not found`);
    }

    // Continue generation using the resumeGeneration method
    return this.resumeGeneration(draftId, options);
  }
}