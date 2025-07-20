/**
 * Enhanced Module Generator with AI Resource Pipeline Integration
 * Extends the existing UnifiedModuleGenerator to automatically generate resources
 */

import { UnifiedModuleGenerator, ModuleGenerationConfig, GeneratedModule } from '../moduleGeneration';
import { AIResourcePipeline, GeneratedResource } from './pipeline';
import { PipelineIntegrationHooks } from './integrationHooks';
import { PipelineMonitoringService } from './monitoring';
import { Module } from '../../types';

// Enhanced Generation Configuration
export interface EnhancedGenerationConfig extends ModuleGenerationConfig {
  enableResourcePipeline: boolean;
  enableMonitoring: boolean;
  enableHooks: boolean;
  resourceConfig: {
    enableAutoQuiz: boolean;
    enableAutoVideos: boolean;
    enableAutoBibliography: boolean;
    enableAutoMindMap: boolean;
    enableValidation: boolean;
    enableTesting: boolean;
    autoLinking: boolean;
  };
  qualityThreshold: number;
  retryFailedResources: boolean;
}

// Enhanced Generation Result
export interface EnhancedGeneratedModule extends GeneratedModule {
  pipeline: {
    enabled: boolean;
    resourcesGenerated: GeneratedResource[];
    processingTime: number;
    qualityScore: number;
    status: 'complete' | 'partial' | 'failed';
    errors: string[];
  };
  monitoring: {
    metrics: any;
    alerts: any[];
    healthStatus: string;
  };
}

/**
 * Enhanced Module Generator with Automatic Resource Pipeline
 * Combines the existing module generation with automatic resource creation
 */
export class EnhancedModuleGeneratorWithPipeline {
  private moduleGenerator: UnifiedModuleGenerator;
  private resourcePipeline!: AIResourcePipeline;
  private hooks!: PipelineIntegrationHooks;
  private monitoring!: PipelineMonitoringService;
  private isInitialized = false;

  constructor() {
    this.moduleGenerator = new UnifiedModuleGenerator();
    this.initializePipeline();
  }

  /**
   * Initialize the resource pipeline and monitoring
   */
  private initializePipeline(): void {
    console.log('🚀 Initializing Enhanced Module Generator with AI Resource Pipeline...');

    // Initialize pipeline components
    this.resourcePipeline = new AIResourcePipeline({
      enableAutoQuiz: true,
      enableAutoVideos: true,
      enableAutoBibliography: true,
      enableAutoMindMap: true,
      enableValidation: true,
      enableTesting: true,
      autoLinking: true,
      maxRetries: 3,
      timeoutMs: 300000
    });

    this.hooks = new PipelineIntegrationHooks(this.resourcePipeline);
    this.monitoring = new PipelineMonitoringService(this.resourcePipeline, this.hooks);

    this.setupIntegrationHooks();
    this.isInitialized = true;

    console.log('✅ Enhanced Module Generator initialized successfully');
  }

  /**
   * Setup integration hooks between components
   */
  private setupIntegrationHooks(): void {
    // Hook into module generation completion
    this.hooks.on('generation_complete', (data: any) => {
      console.log(`🎉 Resource generation completed for module ${data.moduleId}`);
    });

    // Hook into pipeline errors
    this.hooks.on('pipeline_error_notification', (data: any) => {
      console.error(`❌ Pipeline error for module ${data.moduleId}: ${data.error}`);
    });

    // Hook into monitoring alerts
    this.monitoring.on('alert_created', (alert: any) => {
      console.warn(`🚨 Monitoring alert: ${alert.message}`);
    });
  }

  /**
   * Generate a complete module with automatic resource generation
   */
  async generateCompleteModuleWithPipeline(
    config: EnhancedGenerationConfig
  ): Promise<EnhancedGeneratedModule> {
    if (!this.isInitialized) {
      throw new Error('Pipeline not initialized');
    }

    const startTime = Date.now();
    console.log(`🚀 Starting enhanced module generation for: ${config.topic}`);

    try {
      // Step 1: Generate base module using existing generator
      console.log('📚 Generating base module structure...');
      const baseModule = await this.moduleGenerator.generateCompleteModule(config);

      // Step 2: Process through resource pipeline if enabled
      let pipelineResults: GeneratedResource[] = [];
      let processingTime = 0;
      let qualityScore = 0.8;
      let pipelineStatus: 'complete' | 'partial' | 'failed' = 'complete';
      let pipelineErrors: string[] = [];

      if (config.enableResourcePipeline !== false) {
        console.log('🔧 Processing through AI resource pipeline...');
        
        const pipelineStartTime = Date.now();
        
        try {
          // Convert base module to Module type for pipeline
          const moduleForPipeline: Module = {
            ...baseModule.module,
            content: baseModule.module.content
          };

          pipelineResults = await this.resourcePipeline.processModule(moduleForPipeline);
          processingTime = Date.now() - pipelineStartTime;
          qualityScore = this.calculateOverallQuality(pipelineResults);
          
          console.log(`✅ Pipeline processing completed in ${processingTime}ms`);
          
        } catch (error) {
          console.error('❌ Pipeline processing failed:', error);
          pipelineStatus = 'failed';
          pipelineErrors.push(error instanceof Error ? error.message : 'Unknown pipeline error');
          
          // Attempt partial completion
          if (config.retryFailedResources !== false) {
            console.log('🔄 Attempting partial resource generation...');
            try {
              pipelineResults = await this.generatePartialResources(baseModule.module, config);
              pipelineStatus = 'partial';
            } catch (partialError) {
              console.error('❌ Partial generation also failed:', partialError);
            }
          }
        }
      }

      // Step 3: Enhance base module with pipeline results
      const enhancedModule = this.mergeModuleWithPipelineResults(
        baseModule,
        pipelineResults,
        config
      );

      // Step 4: Create enhanced result
      const result: EnhancedGeneratedModule = {
        ...enhancedModule,
        pipeline: {
          enabled: config.enableResourcePipeline !== false,
          resourcesGenerated: pipelineResults,
          processingTime,
          qualityScore,
          status: pipelineStatus,
          errors: pipelineErrors
        },
        monitoring: {
          metrics: config.enableMonitoring ? this.monitoring.getMetrics() : {},
          alerts: config.enableMonitoring ? this.monitoring.getAlerts() : [],
          healthStatus: config.enableMonitoring ? this.monitoring.getStatus().isRunning ? 'healthy' : 'unhealthy' : 'disabled'
        }
      };

      const totalTime = Date.now() - startTime;
      console.log(`🎯 Enhanced module generation completed in ${totalTime}ms`);
      console.log(`📊 Generated ${pipelineResults.length} additional resources`);
      console.log(`🎨 Overall quality score: ${qualityScore.toFixed(2)}`);

      return result;

    } catch (error) {
      console.error('❌ Enhanced module generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate specific resources for an existing module
   */
  async generateResourcesForExistingModule(
    module: Module,
    resourceTypes: string[]
  ): Promise<GeneratedResource[]> {
    console.log(`🔧 Generating ${resourceTypes.join(', ')} for existing module: ${module.title}`);

    try {
      // Create a filtered pipeline configuration
      const filteredConfig = {
        enableAutoQuiz: resourceTypes.includes('quiz'),
        enableAutoVideos: resourceTypes.includes('video'),
        enableAutoBibliography: resourceTypes.includes('bibliography'),
        enableAutoMindMap: resourceTypes.includes('mindmap'),
        enableValidation: true,
        enableTesting: resourceTypes.includes('test'),
        autoLinking: true,
        maxRetries: 3,
        timeoutMs: 300000
      };

      // Update pipeline configuration
      this.resourcePipeline.updateConfig(filteredConfig);

      // Process the module
      const resources = await this.resourcePipeline.processModule(module);
      
      // Filter results to only requested types
      const filteredResources = resources.filter(r => resourceTypes.includes(r.type));

      console.log(`✅ Generated ${filteredResources.length} resources for module: ${module.title}`);
      return filteredResources;

    } catch (error) {
      console.error(`❌ Resource generation failed for module ${module.id}:`, error);
      throw error;
    }
  }

  /**
   * Generate partial resources when full pipeline fails
   */
  private async generatePartialResources(
    module: any,
    config: EnhancedGenerationConfig
  ): Promise<GeneratedResource[]> {
    const partialResources: GeneratedResource[] = [];

    // Try to generate at least a basic quiz and config
    try {
      if (config.resourceConfig?.enableAutoQuiz) {
        console.log('🔄 Generating fallback quiz...');
        const quiz = await this.moduleGenerator.generateCustomModule(module.title, { quiz: true });
        if (quiz.quiz) {
          partialResources.push({
            id: `quiz-${module.id}-fallback`,
            type: 'quiz',
            moduleId: module.id,
            content: quiz.quiz,
            metadata: {
              generatedAt: new Date(),
              source: 'ai',
              quality: 0.6,
              validated: false,
              linkedResources: []
            },
            status: 'complete'
          });
        }
      }

      // Generate basic config
      partialResources.push({
        id: `config-${module.id}-fallback`,
        type: 'config',
        moduleId: module.id,
        content: {
          module: { id: module.id, title: module.title },
          fallback: true,
          generatedAt: new Date()
        },
        metadata: {
          generatedAt: new Date(),
          source: 'manual',
          quality: 0.5,
          validated: true,
          linkedResources: []
        },
        status: 'complete'
      });

    } catch (error) {
      console.error('❌ Fallback resource generation failed:', error);
    }

    return partialResources;
  }

  /**
   * Merge base module with pipeline results
   */
  private mergeModuleWithPipelineResults(
    baseModule: GeneratedModule,
    pipelineResults: GeneratedResource[],
    config: EnhancedGenerationConfig
  ): GeneratedModule {
    const enhanced = { ...baseModule };

    // Merge pipeline-generated resources
    for (const resource of pipelineResults) {
      switch (resource.type) {
        case 'quiz':
          if (!enhanced.quiz && resource.content) {
            enhanced.quiz = resource.content;
          }
          break;
          
        case 'video':
          if (!enhanced.videos && resource.content) {
            enhanced.videos = resource.content;
          }
          break;
          
        case 'bibliography':
          if (!enhanced.bibliography && resource.content) {
            enhanced.bibliography = resource.content;
          }
          break;
          
        case 'mindmap':
          if (!enhanced.mindMap && resource.content) {
            enhanced.mindMap = resource.content;
          }
          break;
      }
    }

    // Update metadata with pipeline information
    enhanced.metadata = {
      ...enhanced.metadata,
      pipelineProcessed: true,
      pipelineResources: pipelineResults.length,
      qualityEnhanced: config.qualityThreshold ? 
        pipelineResults.some(r => r.metadata.quality >= config.qualityThreshold) : false
    } as any;

    return enhanced;
  }

  /**
   * Calculate overall quality score from pipeline results
   */
  private calculateOverallQuality(resources: GeneratedResource[]): number {
    if (resources.length === 0) return 0.5;

    const qualityScores = resources
      .map(r => r.metadata.quality)
      .filter(q => q !== undefined) as number[];

    if (qualityScores.length === 0) return 0.5;

    return qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;
  }

  /**
   * Get pipeline status and metrics
   */
  getPipelineStatus(): any {
    return {
      pipeline: this.resourcePipeline ? {
        initialized: this.isInitialized,
        activeGenerations: 'Available via monitoring'
      } : null,
      monitoring: this.monitoring ? {
        status: this.monitoring.getStatus(),
        metrics: this.monitoring.getMetrics(),
        alerts: this.monitoring.getAlerts().length
      } : null,
      hooks: this.hooks ? {
        activeHooks: this.hooks.getActiveHooksCount()
      } : null
    };
  }

  /**
   * Update pipeline configuration
   */
  updatePipelineConfig(config: Partial<EnhancedGenerationConfig>): void {
    if (config.resourceConfig && this.resourcePipeline) {
      this.resourcePipeline.updateConfig(config.resourceConfig);
    }

    if (config.enableMonitoring !== undefined && this.monitoring) {
      this.monitoring.updateConfig({
        enableMetrics: config.enableMonitoring,
        enableAlerts: config.enableMonitoring
      });
    }
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.monitoring) {
      this.monitoring.stop();
    }
    
    if (this.resourcePipeline) {
      this.resourcePipeline.clearCompleted();
    }
  }

  /**
   * Quick generation presets with pipeline
   */
  async generateQuickModuleWithPipeline(topic: string): Promise<EnhancedGeneratedModule> {
    return this.generateCompleteModuleWithPipeline({
      topic,
      includeVideos: true,
      includeQuiz: true,
      includeMindMap: true,
      includeBibliography: false,
      quizQuestions: 5,
      maxVideos: 3,
      enableResourcePipeline: true,
      enableMonitoring: true,
      enableHooks: true,
      resourceConfig: {
        enableAutoQuiz: true,
        enableAutoVideos: true,
        enableAutoBibliography: false,
        enableAutoMindMap: true,
        enableValidation: true,
        enableTesting: true,
        autoLinking: true
      },
      qualityThreshold: 0.7,
      retryFailedResources: true
    });
  }

  async generateStudyModuleWithPipeline(topic: string): Promise<EnhancedGeneratedModule> {
    return this.generateCompleteModuleWithPipeline({
      topic,
      includeVideos: true,
      includeQuiz: true,
      includeMindMap: true,
      includeBibliography: true,
      quizQuestions: 15,
      maxVideos: 10,
      enableResourcePipeline: true,
      enableMonitoring: true,
      enableHooks: true,
      resourceConfig: {
        enableAutoQuiz: true,
        enableAutoVideos: true,
        enableAutoBibliography: true,
        enableAutoMindMap: true,
        enableValidation: true,
        enableTesting: true,
        autoLinking: true
      },
      qualityThreshold: 0.8,
      retryFailedResources: true
    });
  }

  async generateResearchModuleWithPipeline(topic: string): Promise<EnhancedGeneratedModule> {
    return this.generateCompleteModuleWithPipeline({
      topic,
      difficulty: 'advanced',
      includeVideos: false,
      includeQuiz: false,
      includeMindMap: true,
      includeBibliography: true,
      enableResourcePipeline: true,
      enableMonitoring: true,
      enableHooks: true,
      resourceConfig: {
        enableAutoQuiz: false,
        enableAutoVideos: false,
        enableAutoBibliography: true,
        enableAutoMindMap: true,
        enableValidation: true,
        enableTesting: true,
        autoLinking: true
      },
      qualityThreshold: 0.9,
      retryFailedResources: true
    });
  }
}

// Export singleton instance
export const enhancedModuleGenerator = new EnhancedModuleGeneratorWithPipeline();
export default EnhancedModuleGeneratorWithPipeline;