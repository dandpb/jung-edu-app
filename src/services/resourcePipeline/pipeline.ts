/**
 * AI Resource Generation Pipeline
 * Automatically generates and links required resources when AI creates modules
 */

import { EventEmitter } from 'events';
import { ModuleGenerationOrchestrator } from '../llm/orchestrator';
import { ModuleValidator } from '../../schemas/module.validator';
import { Module, ModuleContent, Quiz, Video } from '../../types';

// Pipeline Event Types
export interface PipelineEvent {
  type: 'module_created' | 'resource_generated' | 'validation_complete' | 'pipeline_complete' | 'error';
  timestamp: Date;
  moduleId: string;
  data?: any;
  error?: Error;
}

// Resource Generation Config
export interface ResourceGenerationConfig {
  enableAutoQuiz: boolean;
  enableAutoVideos: boolean;
  enableAutoBibliography: boolean;
  enableValidation: boolean;
  enableTesting: boolean;
  autoLinking: boolean;
  maxRetries: number;
  timeoutMs: number;
}

// Resource Dependencies
export interface ResourceDependency {
  resourceType: 'quiz' | 'video' | 'bibliography' | 'mindmap' | 'test' | 'config';
  requiredFor: string[];
  dependencies: string[];
  priority: 'high' | 'medium' | 'low';
  autoGenerate: boolean;
}

// Generated Resource Result
export interface GeneratedResource {
  id: string;
  type: 'quiz' | 'video' | 'bibliography' | 'mindmap' | 'test' | 'config' | 'schema';
  moduleId: string;
  content: any;
  metadata: {
    generatedAt: Date;
    source: 'ai' | 'template' | 'manual';
    quality: number; // 0-1 score
    validated: boolean;
    linkedResources: string[];
  };
  status: 'pending' | 'generating' | 'complete' | 'failed' | 'validating';
}

/**
 * Main AI Resource Pipeline
 * Coordinates automatic resource generation for AI-created modules
 */
export class AIResourcePipeline extends EventEmitter {
  private config: ResourceGenerationConfig;
  private orchestrator: ModuleGenerationOrchestrator;
  private validator: ModuleValidator;
  private activeGenerations = new Map<string, GeneratedResource[]>();
  private resourceDependencies: ResourceDependency[] = [];

  constructor(config: Partial<ResourceGenerationConfig> = {}) {
    super();
    
    this.config = {
      enableAutoQuiz: true,
      enableAutoVideos: true,
      enableAutoBibliography: true,
      enableValidation: true,
      enableTesting: true,
      autoLinking: true,
      maxRetries: 3,
      timeoutMs: 300000, // 5 minutes
      ...config
    };

    this.orchestrator = new ModuleGenerationOrchestrator(true);
    this.validator = new ModuleValidator();
    
    this.setupResourceDependencies();
    this.setupEventListeners();
  }

  /**
   * Setup resource dependencies and generation rules
   */
  private setupResourceDependencies(): void {
    this.resourceDependencies = [
      {
        resourceType: 'quiz',
        requiredFor: ['assessment', 'validation'],
        dependencies: ['module'],
        priority: 'high',
        autoGenerate: this.config.enableAutoQuiz
      },
      {
        resourceType: 'video',
        requiredFor: ['engagement', 'multimedia'],
        dependencies: ['module'],
        priority: 'medium',
        autoGenerate: this.config.enableAutoVideos
      },
      {
        resourceType: 'bibliography',
        requiredFor: ['research', 'academic'],
        dependencies: ['module'],
        priority: 'medium',
        autoGenerate: this.config.enableAutoBibliography
      },
      {
        resourceType: 'test',
        requiredFor: ['quality', 'ci'],
        dependencies: ['module', 'quiz'],
        priority: 'high',
        autoGenerate: this.config.enableTesting
      },
      {
        resourceType: 'config',
        requiredFor: ['deployment', 'metadata'],
        dependencies: ['module'],
        priority: 'low',
        autoGenerate: true
      }
    ];
  }

  /**
   * Setup event listeners for module generation events
   */
  private setupEventListeners(): void {
    // Listen for module creation events
    this.orchestrator.on('progress', (progress) => {
      if (progress.stage === 'complete' && progress.details) {
        this.handleModuleCreated(progress.details);
      }
    });
  }

  /**
   * Main entry point - process a newly created module
   */
  async processModule(module: Module): Promise<GeneratedResource[]> {
    const pipelineId = `pipeline-${module.id}-${Date.now()}`;
    console.log(`🚀 Starting AI resource pipeline for module: ${module.title}`);
    
    this.emitEvent('module_created', module.id, { module, pipelineId });

    try {
      // Analyze module dependencies
      const dependencies = await this.analyzeModuleDependencies(module);
      console.log(`📊 Analyzed dependencies:`, dependencies);

      // Generate required resources in parallel
      const resources = await this.generateRequiredResources(module, dependencies);
      
      // Validate all resources
      if (this.config.enableValidation) {
        await this.validateResources(module, resources);
      }

      // Link resources together
      if (this.config.autoLinking) {
        await this.linkResources(module, resources);
      }

      // Store for tracking
      this.activeGenerations.set(module.id, resources);
      
      this.emitEvent('pipeline_complete', module.id, { resources, pipelineId });
      console.log(`✅ Pipeline complete for module: ${module.title}`);
      
      return resources;

    } catch (error) {
      console.error(`❌ Pipeline failed for module ${module.id}:`, error);
      this.emitEvent('error', module.id, { error, pipelineId });
      throw error;
    }
  }

  /**
   * Analyze module to determine resource dependencies
   */
  private async analyzeModuleDependencies(module: Module): Promise<ResourceDependency[]> {
    const requiredDependencies: ResourceDependency[] = [];
    
    // Analyze module content to determine what resources are needed
    const content = module.content;
    
    for (const dependency of this.resourceDependencies) {
      if (!dependency.autoGenerate) continue;

      let shouldGenerate = false;

      switch (dependency.resourceType) {
        case 'quiz':
          // Generate quiz if module has learning objectives
          shouldGenerate = content ? this.hasLearningObjectives(content) && this.config.enableAutoQuiz : false;
          break;
          
        case 'video':
          // Generate videos for complex topics
          shouldGenerate = content ? this.isComplexTopic(content) && this.config.enableAutoVideos : false;
          break;
          
        case 'bibliography':
          // Generate bibliography for academic content
          shouldGenerate = content ? this.isAcademicContent(content) && this.config.enableAutoBibliography : false;
          break;
          
        case 'test':
          // Always generate tests for quality assurance
          shouldGenerate = this.config.enableTesting;
          break;
          
        case 'config':
          // Always generate config metadata
          shouldGenerate = true;
          break;
      }

      if (shouldGenerate) {
        requiredDependencies.push(dependency);
      }
    }

    return requiredDependencies.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Generate all required resources in parallel
   */
  private async generateRequiredResources(
    module: Module, 
    dependencies: ResourceDependency[]
  ): Promise<GeneratedResource[]> {
    console.log(`🔧 Generating ${dependencies.length} resources for module: ${module.title}`);
    
    const resourcePromises = dependencies.map(dep => 
      this.generateResource(module, dep).catch(error => {
        console.error(`Failed to generate ${dep.resourceType}:`, error);
        return null;
      })
    );

    const results = await Promise.all(resourcePromises);
    return results.filter((resource): resource is GeneratedResource => resource !== null);
  }

  /**
   * Generate a specific resource
   */
  private async generateResource(
    module: Module, 
    dependency: ResourceDependency
  ): Promise<GeneratedResource> {
    const resourceId = `${dependency.resourceType}-${module.id}-${Date.now()}`;
    
    const resource: GeneratedResource = {
      id: resourceId,
      type: dependency.resourceType,
      moduleId: module.id,
      content: null,
      metadata: {
        generatedAt: new Date(),
        source: 'ai',
        quality: 0,
        validated: false,
        linkedResources: []
      },
      status: 'generating'
    };

    this.emitEvent('resource_generated', module.id, { resource, type: dependency.resourceType });

    try {
      switch (dependency.resourceType) {
        case 'quiz':
          resource.content = await this.generateQuizResource(module);
          break;
          
        case 'video':
          resource.content = await this.generateVideoResource(module);
          break;
          
        case 'bibliography':
          resource.content = await this.generateBibliographyResource(module);
          break;
          
        case 'test':
          resource.content = await this.generateTestResource(module);
          break;
          
        case 'config':
          resource.content = await this.generateConfigResource(module);
          break;
      }

      resource.status = 'complete';
      resource.metadata.quality = await this.assessResourceQuality(resource);
      
      console.log(`✅ Generated ${dependency.resourceType} for module: ${module.title}`);
      return resource;

    } catch (error) {
      resource.status = 'failed';
      console.error(`❌ Failed to generate ${dependency.resourceType}:`, error);
      throw error;
    }
  }

  /**
   * Generate quiz resource
   */
  private async generateQuizResource(module: Module): Promise<Quiz> {
    const quiz = await this.orchestrator.generateModule({
      topic: module.title,
      objectives: ['Assess understanding of ' + module.title],
      targetAudience: 'students',
      duration: 30,
      difficulty: module.difficulty,
      quizQuestions: 10,
      useRealServices: true
    });

    return quiz.quiz!;
  }

  /**
   * Generate video resource
   */
  private async generateVideoResource(module: Module): Promise<Video[]> {
    const result = await this.orchestrator.generateModule({
      topic: module.title,
      objectives: ['Provide visual learning for ' + module.title],
      targetAudience: 'visual learners',
      duration: 60,
      difficulty: module.difficulty,
      includeVideos: true,
      videoCount: 5,
      useRealServices: true
    });

    return result.videos || [];
  }

  /**
   * Generate bibliography resource
   */
  private async generateBibliographyResource(module: Module): Promise<any[]> {
    const result = await this.orchestrator.generateModule({
      topic: module.title,
      objectives: ['Provide academic references for ' + module.title],
      targetAudience: 'researchers',
      duration: 60,
      difficulty: 'advanced',
      includeBibliography: true,
      bibliographyCount: 15,
      useRealServices: true
    });

    return result.bibliography || [];
  }


  /**
   * Generate test resource
   */
  private async generateTestResource(module: Module): Promise<any> {
    return {
      id: `test-${module.id}`,
      moduleId: module.id,
      title: `Tests for ${module.title}`,
      tests: [
        {
          name: 'Module Structure Test',
          type: 'unit',
          code: `
            describe('${module.title}', () => {
              test('should have valid structure', () => {
                expect(module.id).toBeDefined();
                expect(module.title).toBe('${module.title}');
                expect(module.content).toBeDefined();
              });
              
              test('should have required content sections', () => {
                expect(module.content.introduction).toBeDefined();
                expect(module.content.sections).toHaveLength(${module.content?.sections?.length || 0});
              });
            });
          `
        },
        {
          name: 'Content Quality Test',
          type: 'integration',
          code: `
            describe('${module.title} Content Quality', () => {
              test('should have adequate content length', () => {
                const totalLength = module.content.introduction.length + 
                  module.content.sections.reduce((sum, s) => sum + s.content.length, 0);
                expect(totalLength).toBeGreaterThan(500);
              });
            });
          `
        }
      ]
    };
  }

  /**
   * Generate config resource
   */
  private async generateConfigResource(module: Module): Promise<any> {
    return {
      id: `config-${module.id}`,
      moduleId: module.id,
      title: `Configuration for ${module.title}`,
      config: {
        module: {
          id: module.id,
          title: module.title,
          difficulty: module.difficulty,
          estimatedTime: module.estimatedTime,
          category: module.category
        },
        deployment: {
          environment: 'production',
          cdn: true,
          caching: true,
          optimization: module.difficulty === 'advanced'
        },
        features: {
          quiz: !!module.content?.quiz,
          videos: !!module.content?.videos,
          bibliography: !!module.content?.bibliography,
        },
        metadata: {
          version: '1.0.0',
          createdAt: new Date().toISOString(),
          tags: this.extractTags(module),
          keywords: module.content ? this.extractKeywords(module.content) : []
        }
      }
    };
  }

  /**
   * Validate all generated resources
   */
  private async validateResources(module: Module, resources: GeneratedResource[]): Promise<void> {
    console.log(`🔍 Validating ${resources.length} resources for module: ${module.title}`);
    
    for (const resource of resources) {
      resource.status = 'validating';
      
      try {
        const isValid = await this.validateResource(resource);
        resource.metadata.validated = isValid;
        
        if (!isValid) {
          console.warn(`⚠️ Resource ${resource.type} failed validation for module: ${module.title}`);
        }
      } catch (error) {
        console.error(`❌ Validation error for ${resource.type}:`, error);
        resource.metadata.validated = false;
      }
    }

    this.emitEvent('validation_complete', module.id, { resources });
  }

  /**
   * Validate a specific resource
   */
  private async validateResource(resource: GeneratedResource): Promise<boolean> {
    switch (resource.type) {
      case 'quiz':
        return this.validateQuiz(resource.content);
      case 'video':
        return this.validateVideos(resource.content);
      case 'bibliography':
        return this.validateBibliography(resource.content);
      case 'test':
        return this.validateTest(resource.content);
      case 'config':
        return this.validateConfig(resource.content);
      default:
        return true;
    }
  }

  /**
   * Link resources together
   */
  private async linkResources(module: Module, resources: GeneratedResource[]): Promise<void> {
    console.log(`🔗 Linking ${resources.length} resources for module: ${module.title}`);
    
    // Update module content with generated resources
    const updatedContent: ModuleContent = { 
      introduction: module.content?.introduction || '',
      sections: module.content?.sections || [],
      videos: module.content?.videos,
      quiz: module.content?.quiz,
      bibliography: module.content?.bibliography,
      films: module.content?.films,
      summary: module.content?.summary,
      keyTakeaways: module.content?.keyTakeaways
    };
    
    for (const resource of resources) {
      switch (resource.type) {
        case 'quiz':
          updatedContent.quiz = resource.content;
          break;
        case 'video':
          updatedContent.videos = resource.content;
          break;
        case 'bibliography':
          updatedContent.bibliography = resource.content;
          break;
      }
      
      // Track resource links
      const linkedResourceIds = resources
        .filter(r => r.id !== resource.id)
        .map(r => r.id);
      resource.metadata.linkedResources = linkedResourceIds;
    }

    // Update module with new content
    module.content = updatedContent;
  }

  /**
   * Handle module creation event
   */
  private async handleModuleCreated(moduleData: any): Promise<void> {
    if (moduleData.module) {
      await this.processModule(moduleData.module);
    }
  }

  /**
   * Emit pipeline event
   */
  private emitEvent(type: PipelineEvent['type'], moduleId: string, data?: any): void {
    const event: PipelineEvent = {
      type,
      timestamp: new Date(),
      moduleId,
      data
    };
    
    this.emit('pipeline_event', event);
    this.emit(type, event);
  }

  /**
   * Content analysis helpers
   */
  private hasLearningObjectives(content: ModuleContent): boolean {
    return content.introduction.includes('objetivo') || 
           content.sections.some(s => s.content.includes('aprender'));
  }

  private isComplexTopic(content: ModuleContent): boolean {
    return content.sections.length > 3 || 
           content.introduction.length > 500;
  }

  private isAcademicContent(content: ModuleContent): boolean {
    const academicKeywords = ['pesquisa', 'teoria', 'estudo', 'análise', 'investigação'];
    const text = content.introduction + content.sections.map(s => s.content).join(' ');
    return academicKeywords.some(keyword => text.toLowerCase().includes(keyword));
  }

  private hasStructuredContent(content: ModuleContent): boolean {
    return content.sections.length >= 2;
  }

  /**
   * Resource quality assessment
   */
  private async assessResourceQuality(resource: GeneratedResource): Promise<number> {
    let quality = 0.5; // Base quality
    
    switch (resource.type) {
      case 'quiz':
        const quiz = resource.content as Quiz;
        if (quiz.questions && quiz.questions.length >= 5) quality += 0.2;
        if (quiz.questions?.every(q => q.explanation)) quality += 0.2;
        break;
        
      case 'video':
        const videos = resource.content as Video[];
        if (videos && videos.length >= 3) quality += 0.2;
        if (videos?.every(v => v.youtubeId)) quality += 0.2;
        break;
        
      case 'bibliography':
        const bibliography = resource.content as any[];
        if (bibliography && bibliography.length >= 5) quality += 0.2;
        if (bibliography?.every(b => b.title && b.author)) quality += 0.2;
        break;
    }
    
    return Math.min(quality, 1.0);
  }

  /**
   * Validation helpers
   */
  private validateQuiz(quiz: Quiz): boolean {
    return !!(quiz && quiz.questions && quiz.questions.length > 0 &&
              quiz.questions.every(q => q.question && q.options && q.options.length >= 2));
  }

  private validateVideos(videos: Video[]): boolean {
    return Array.isArray(videos) && videos.length > 0 &&
           videos.every(v => v.title && (v.youtubeId || v.url));
  }

  private validateBibliography(bibliography: any[]): boolean {
    return Array.isArray(bibliography) && bibliography.length > 0 &&
           bibliography.every(b => b.title);
  }


  private validateTest(test: any): boolean {
    return !!(test && test.tests && Array.isArray(test.tests));
  }

  private validateConfig(config: any): boolean {
    return !!(config && config.config && config.config.module);
  }

  /**
   * Utility methods
   */
  private extractTags(module: Module): string[] {
    const text = `${module.title} ${module.description}`.toLowerCase();
    const jungianTags = ['arquétipo', 'sombra', 'anima', 'animus', 'individuação', 'inconsciente'];
    return jungianTags.filter(tag => text.includes(tag));
  }

  private extractKeywords(content: ModuleContent): string[] {
    const text = `${content.introduction} ${content.sections.map(s => s.content).join(' ')}`.toLowerCase();
    const words = text.split(/\s+/).filter(word => word.length > 4);
    const frequency = new Map<string, number>();
    
    words.forEach(word => {
      frequency.set(word, (frequency.get(word) || 0) + 1);
    });
    
    return Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Get pipeline status
   */
  getStatus(moduleId: string): GeneratedResource[] | undefined {
    return this.activeGenerations.get(moduleId);
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<ResourceGenerationConfig>): void {
    this.config = { ...this.config, ...updates };
    this.setupResourceDependencies(); // Refresh dependencies
  }

  /**
   * Clear completed generations
   */
  clearCompleted(): void {
    for (const [moduleId, resources] of this.activeGenerations.entries()) {
      if (resources.every(r => r.status === 'complete' || r.status === 'failed')) {
        this.activeGenerations.delete(moduleId);
      }
    }
  }
}

// Export singleton instance
export const aiResourcePipeline = new AIResourcePipeline();
export default AIResourcePipeline;