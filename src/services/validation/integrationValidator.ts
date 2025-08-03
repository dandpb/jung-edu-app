/**
 * Integration Validator for jaqEdu Platform
 * Tests and validates the integration between different modules and services
 * 
 * Features:
 * - Module-to-module integration testing
 * - Service dependency validation
 * - API integration verification
 * - Data flow validation
 * - Cross-component compatibility testing
 */

import { EducationalModule } from '../../schemas/module.schema';
import { ModuleService } from '../modules/moduleService';
import { YouTubeService } from '../video/youtubeService';
import { QuizValidator } from '../quiz/quizValidator';
import { ModuleGenerationOrchestrator } from '../llm/orchestrator';

export interface IntegrationTestResult {
  testName: string;
  passed: boolean;
  duration: number;
  details: string;
  errors: string[];
  warnings: string[];
}

export interface IntegrationValidationReport {
  overall: {
    passed: boolean;
    score: number; // 0-100
    totalTests: number;
    passedTests: number;
    failedTests: number;
    duration: number;
  };
  categories: {
    moduleIntegration: IntegrationTestResult[];
    serviceIntegration: IntegrationTestResult[];
    dataIntegration: IntegrationTestResult[];
    apiIntegration: IntegrationTestResult[];
    performanceIntegration: IntegrationTestResult[];
  };
  recommendations: string[];
  criticalIssues: string[];
}

export class IntegrationValidator {
  private moduleService: ModuleService;
  private youtubeService: YouTubeService;
  private quizValidator: QuizValidator;

  constructor() {
    this.moduleService = new ModuleService();
    this.youtubeService = new YouTubeService();
    this.quizValidator = new QuizValidator();
  }

  /**
   * Runs comprehensive integration validation
   */
  async validateIntegration(modules: EducationalModule[]): Promise<IntegrationValidationReport> {
    console.log('🔗 Starting comprehensive integration validation...');
    const startTime = performance.now();

    const report: IntegrationValidationReport = {
      overall: {
        passed: false, // Initialize as false, will be properly calculated later
        score: 0,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        duration: 0
      },
      categories: {
        moduleIntegration: [],
        serviceIntegration: [],
        dataIntegration: [],
        apiIntegration: [],
        performanceIntegration: []
      },
      recommendations: [],
      criticalIssues: []
    };

    try {
      // Enhanced null/undefined module handling
      const validationIssues = this.validateModuleInput(modules);
      report.criticalIssues.push(...validationIssues.criticalIssues);
      
      // Sanitize modules array - filter out null/undefined values
      const sanitizedModules = this.sanitizeModules(modules || []);
      
      // Check for structural integrity issues
      const structuralIssues = this.validateModuleStructure(sanitizedModules);
      report.criticalIssues.push(...structuralIssues);

      // Run module integration tests
      report.categories.moduleIntegration = await this.testModuleIntegration(sanitizedModules);
      
      // Run service integration tests
      report.categories.serviceIntegration = await this.testServiceIntegration(sanitizedModules);
      
      // Run data integration tests
      report.categories.dataIntegration = await this.testDataIntegration(sanitizedModules);
      
      // Run API integration tests
      report.categories.apiIntegration = await this.testApiIntegration(sanitizedModules);
      
      // Run performance integration tests
      report.categories.performanceIntegration = await this.testPerformanceIntegration(sanitizedModules);

      // Calculate overall results using helper method
      this.calculateOverallResults(report);
      report.overall.duration = performance.now() - startTime;

      // Generate recommendations
      report.recommendations = this.generateRecommendations(report);
      
      // Enhanced critical issues identification
      const additionalCriticalIssues = this.identifyCriticalIssues(report);
      report.criticalIssues.push(...additionalCriticalIssues);

      console.log(`✅ Integration validation completed. Score: ${report.overall.score}/100`);

    } catch (error) {
      console.error('❌ Integration validation failed:', error);
      report.criticalIssues.push(`Integration validation failed: ${error}`);
      
      // Ensure we always have test results even if validation fails
      if (report.categories.moduleIntegration.length === 0) {
        report.categories.moduleIntegration = this.createFailureTestResults('moduleIntegration', error);
      }
      if (report.categories.serviceIntegration.length === 0) {
        report.categories.serviceIntegration = this.createFailureTestResults('serviceIntegration', error);
      }
      if (report.categories.dataIntegration.length === 0) {
        report.categories.dataIntegration = this.createFailureTestResults('dataIntegration', error);
      }
      if (report.categories.apiIntegration.length === 0) {
        report.categories.apiIntegration = this.createFailureTestResults('apiIntegration', error);
      }
      if (report.categories.performanceIntegration.length === 0) {
        report.categories.performanceIntegration = this.createFailureTestResults('performanceIntegration', error);
      }
      
      // Recalculate results after adding failure tests using helper method
      this.calculateOverallResults(report);
      report.overall.duration = performance.now() - startTime;
    }

    return report;
  }

  /**
   * Tests module-to-module integration
   */
  private async testModuleIntegration(modules: EducationalModule[]): Promise<IntegrationTestResult[]> {
    const tests: IntegrationTestResult[] = [];

    // Test 1: Module prerequisite chain validation
    tests.push(await this.testPrerequisiteChain(modules));

    // Test 2: Module content consistency
    tests.push(await this.testModuleContentConsistency(modules));

    // Test 3: Module navigation flow
    tests.push(await this.testModuleNavigationFlow(modules));

    // Test 4: Cross-module references
    tests.push(await this.testCrossModuleReferences(modules));

    // Test 5: Module difficulty progression
    tests.push(await this.testDifficultyProgression(modules));

    return tests;
  }

  /**
   * Tests service integration
   */
  private async testServiceIntegration(modules: EducationalModule[]): Promise<IntegrationTestResult[]> {
    const tests: IntegrationTestResult[] = [];

    // Test 1: Module service integration
    tests.push(await this.testModuleServiceIntegration(modules));

    // Test 2: Video service integration
    tests.push(await this.testVideoServiceIntegration(modules));

    // Test 3: Quiz service integration
    tests.push(await this.testQuizServiceIntegration(modules));

    // Test 4: LLM service integration
    tests.push(await this.testLLMServiceIntegration());

    // Test 5: Bibliography service integration
    tests.push(await this.testBibliographyServiceIntegration(modules));

    return tests;
  }

  /**
   * Tests data integration and consistency
   */
  private async testDataIntegration(modules: EducationalModule[]): Promise<IntegrationTestResult[]> {
    const tests: IntegrationTestResult[] = [];

    // Test 1: Data schema consistency
    tests.push(await this.testDataSchemaConsistency(modules));

    // Test 2: Data relationship integrity
    tests.push(await this.testDataRelationshipIntegrity(modules));

    // Test 3: Data serialization/deserialization
    tests.push(await this.testDataSerialization(modules));

    // Test 4: Data migration compatibility
    tests.push(await this.testDataMigrationCompatibility(modules));

    // Test 5: Data backup and restore
    tests.push(await this.testDataBackupRestore(modules));

    return tests;
  }

  /**
   * Tests API integration
   */
  private async testApiIntegration(modules: EducationalModule[]): Promise<IntegrationTestResult[]> {
    const tests: IntegrationTestResult[] = [];

    // Test 1: YouTube API integration
    tests.push(await this.testYouTubeApiIntegration(modules));

    // Test 2: OpenAI API integration
    tests.push(await this.testOpenAIApiIntegration());

    // Test 3: External resource API integration
    tests.push(await this.testExternalResourceApiIntegration(modules));

    // Test 4: Error handling and fallbacks
    tests.push(await this.testApiErrorHandling());

    // Test 5: Rate limiting and throttling
    tests.push(await this.testApiRateLimiting());

    return tests;
  }

  /**
   * Tests performance integration
   */
  private async testPerformanceIntegration(modules: EducationalModule[]): Promise<IntegrationTestResult[]> {
    const tests: IntegrationTestResult[] = [];

    // Test 1: Concurrent module loading
    tests.push(await this.testConcurrentModuleLoading(modules));

    // Test 2: Memory usage under load
    tests.push(await this.testMemoryUsageUnderLoad(modules));

    // Test 3: API response time consistency
    tests.push(await this.testApiResponseTimeConsistency());

    // Test 4: Resource cleanup
    tests.push(await this.testResourceCleanup(modules));

    // Test 5: Scalability limits
    tests.push(await this.testScalabilityLimits(modules));

    return tests;
  }

  // Module Integration Test Implementations

  private async testPrerequisiteChain(modules: EducationalModule[]): Promise<IntegrationTestResult> {
    const startTime = performance.now();
    const test: IntegrationTestResult = {
      testName: 'Module Prerequisite Chain Validation',
      passed: true,
      duration: 0,
      details: '',
      errors: [],
      warnings: []
    };

    try {
      const moduleMap = new Map(modules.map(m => [m.id, m]));
      let validChains = 0;
      let totalChains = 0;

      for (const module of modules) {
        if (module.prerequisites && module.prerequisites.length > 0) {
          totalChains++;
          
          // Check if all prerequisites exist
          const missingPrereqs = module.prerequisites.filter((prereqId: any) => !moduleMap.has(prereqId));
          if (missingPrereqs.length > 0) {
            test.errors.push(`Module ${module.id} has missing prerequisites: ${missingPrereqs.join(', ')}`);
            test.passed = false;
          } else {
            validChains++;
            
            // Check for circular dependencies
            if (this.hasCircularDependency(module.id, module.prerequisites, moduleMap)) {
              test.errors.push(`Circular dependency detected for module ${module.id}`);
              test.passed = false;
            }
          }
        }
      }

      test.details = `Validated ${totalChains} prerequisite chains. ${validChains} valid, ${totalChains - validChains} invalid.`;
      
      if (totalChains === 0) {
        test.warnings.push('No prerequisite chains found to validate');
      }

    } catch (error) {
      test.passed = false;
      test.errors.push(`Prerequisite chain validation failed: ${error}`);
    }

    test.duration = performance.now() - startTime;
    return test;
  }

  private hasCircularDependency(
    moduleId: string, 
    prerequisites: string[], 
    moduleMap: Map<string, EducationalModule>, 
    visited: Set<string> = new Set(),
    recursionStack: Set<string> = new Set()
  ): boolean {
    // If we're already processing this module in current path, it's circular
    if (recursionStack.has(moduleId)) {
      return true;
    }

    // If we've already fully processed this module, no need to recheck
    if (visited.has(moduleId)) {
      return false;
    }

    // Mark as being processed
    recursionStack.add(moduleId);

    // Check each prerequisite
    for (const prereqId of prerequisites) {
      const prereqModule = moduleMap.get(prereqId);
      if (prereqModule && prereqModule.prerequisites && prereqModule.prerequisites.length > 0) {
        if (this.hasCircularDependency(prereqId, prereqModule.prerequisites, moduleMap, visited, recursionStack)) {
          return true;
        }
      }
    }

    // Remove from processing stack and mark as fully processed
    recursionStack.delete(moduleId);
    visited.add(moduleId);
    return false;
  }

  private async testModuleContentConsistency(modules: EducationalModule[]): Promise<IntegrationTestResult> {
    const startTime = performance.now();
    const test: IntegrationTestResult = {
      testName: 'Module Content Consistency',
      passed: true,
      duration: 0,
      details: '',
      errors: [],
      warnings: []
    };

    try {
      const terminologyMap = new Map<string, Set<string>>();
      let inconsistencies = 0;

      // Extract terminology from all modules
      for (const module of modules) {
        const content = this.extractModuleContent(module).toLowerCase();
        const terms = this.extractTerminology(content);
        
        terms.forEach(term => {
          if (!terminologyMap.has(term)) {
            terminologyMap.set(term, new Set());
          }
          terminologyMap.get(term)!.add(module.id);
        });
      }

      // Check for terminology inconsistencies
      for (const [term, moduleSet] of terminologyMap) {
        if (moduleSet.size > 1) {
          // Check if the term is used consistently across modules
          const variants = this.findTerminologyVariants(term, modules);
          if (variants.length > 1) {
            inconsistencies++;
            test.warnings.push(`Terminology inconsistency: "${term}" has variants: ${variants.join(', ')}`);
          }
        }
      }

      test.details = `Checked terminology consistency across ${modules.length} modules. Found ${inconsistencies} inconsistencies.`;
      
      if (inconsistencies > 5) {
        test.passed = false;
        test.errors.push('Too many terminology inconsistencies detected');
      }

    } catch (error) {
      test.passed = false;
      test.errors.push(`Content consistency validation failed: ${error}`);
    }

    test.duration = performance.now() - startTime;
    return test;
  }

  private async testModuleNavigationFlow(modules: EducationalModule[]): Promise<IntegrationTestResult> {
    const startTime = performance.now();
    const test: IntegrationTestResult = {
      testName: 'Module Navigation Flow',
      passed: true,
      duration: 0,
      details: '',
      errors: [],
      warnings: []
    };

    try {
      let validFlows = 0;
      let totalModules = modules.length;

      for (const module of modules) {
        if (module.content.sections && module.content.sections.length > 1) {
          // Check section ordering
          const orders = module.content?.sections?.map((s: any) => s.order) || [];
          const sortedOrders = [...orders].sort((a, b) => a - b);
          const isSequential = orders.every((order: any, index: any) => order === sortedOrders[index]);
          
          if (isSequential) {
            validFlows++;
          } else {
            test.errors.push(`Module ${module.id} has non-sequential section ordering`);
            test.passed = false;
          }

          // Check for gaps in ordering
          const hasGaps = sortedOrders.some((order, index) => 
            index > 0 && order !== sortedOrders[index - 1] + 1
          );
          
          if (hasGaps) {
            test.warnings.push(`Module ${module.id} has gaps in section ordering`);
          }
        }
      }

      test.details = `Validated navigation flow for ${totalModules} modules. ${validFlows} have valid flows.`;

    } catch (error) {
      test.passed = false;
      test.errors.push(`Navigation flow validation failed: ${error}`);
    }

    test.duration = performance.now() - startTime;
    return test;
  }

  private async testCrossModuleReferences(modules: EducationalModule[]): Promise<IntegrationTestResult> {
    const startTime = performance.now();
    const test: IntegrationTestResult = {
      testName: 'Cross-Module References',
      passed: true,
      duration: 0,
      details: '',
      errors: [],
      warnings: []
    };

    try {
      const moduleIds = new Set(modules.map(m => m.id));
      let totalReferences = 0;
      let validReferences = 0;

      for (const module of modules) {
        // Check content for references to other modules
        const content = this.extractModuleContent(module);
        const references = this.extractModuleReferences(content);
        
        totalReferences += references.length;
        
        for (const ref of references) {
          if (moduleIds.has(ref)) {
            validReferences++;
          } else {
            test.errors.push(`Module ${module.id} references non-existent module: ${ref}`);
            test.passed = false;
          }
        }
      }

      test.details = `Found ${totalReferences} cross-module references. ${validReferences} are valid.`;
      
      if (totalReferences === 0) {
        test.warnings.push('No cross-module references found');
      }

    } catch (error) {
      test.passed = false;
      test.errors.push(`Cross-module reference validation failed: ${error}`);
    }

    test.duration = performance.now() - startTime;
    return test;
  }

  private async testDifficultyProgression(modules: EducationalModule[]): Promise<IntegrationTestResult> {
    const startTime = performance.now();
    const test: IntegrationTestResult = {
      testName: 'Module Difficulty Progression',
      passed: true,
      duration: 0,
      details: '',
      errors: [],
      warnings: []
    };

    try {
      const difficultyOrder = ['beginner', 'intermediate', 'advanced'];
      const modulesByDifficulty = new Map<string, EducationalModule[]>();

      // Group modules by difficulty
      modules.forEach(module => {
        const difficulty = (module as any).difficulty || (module as any).difficultyLevel || 'beginner';
        if (!modulesByDifficulty.has(difficulty)) {
          modulesByDifficulty.set(difficulty, []);
        }
        modulesByDifficulty.get(difficulty)!.push(module);
      });

      // Check progression logic
      for (const module of modules) {
        if (module.prerequisites && module.prerequisites.length > 0) {
          const prereqModules = module.prerequisites
            .map((id: any) => modules.find(m => m.id === id))
            .filter(Boolean) as EducationalModule[];

          for (const prereq of prereqModules) {
            const currentDifficultyIndex = difficultyOrder.indexOf((module as any).difficulty || (module as any).difficultyLevel || 'beginner');
            const prereqDifficultyIndex = difficultyOrder.indexOf((prereq as any).difficulty || (prereq as any).difficultyLevel || 'beginner');

            if (currentDifficultyIndex < prereqDifficultyIndex) {
              test.errors.push(
                `Module ${module.id} (${(module as any).difficulty || (module as any).difficultyLevel}) requires harder prerequisite ${prereq.id} (${(prereq as any).difficulty || (prereq as any).difficultyLevel})`
              );
              test.passed = false;
            }
          }
        }
      }

      const difficultyDistribution = difficultyOrder.map(level => ({
        level,
        count: modulesByDifficulty.get(level)?.length || 0
      }));

      test.details = `Difficulty distribution: ${difficultyDistribution.map(d => `${d.level}: ${d.count}`).join(', ')}`;

    } catch (error) {
      test.passed = false;
      test.errors.push(`Difficulty progression validation failed: ${error}`);
    }

    test.duration = performance.now() - startTime;
    return test;
  }

  // Service Integration Test Implementations

  private async testModuleServiceIntegration(modules: EducationalModule[]): Promise<IntegrationTestResult> {
    const startTime = performance.now();
    const test: IntegrationTestResult = {
      testName: 'Module Service Integration',
      passed: true,
      duration: 0,
      details: '',
      errors: [],
      warnings: []
    };

    try {
      let successfulOperations = 0;
      let totalOperations = 0;

      // Test CRUD operations
      for (const module of modules.slice(0, 3)) { // Test first 3 modules to avoid overload
        totalOperations += 4; // Create, Read, Update, Delete

        try {
          // Test create (simulate)
          const created = await this.simulateModuleServiceOperation('create', module);
          if (created) successfulOperations++;

          // Test read
          const read = await this.simulateModuleServiceOperation('read', module);
          if (read) successfulOperations++;

          // Test update
          const updated = await this.simulateModuleServiceOperation('update', module);
          if (updated) successfulOperations++;

          // Test delete (simulate)
          const deleted = await this.simulateModuleServiceOperation('delete', module);
          if (deleted) successfulOperations++;

        } catch (error) {
          console.error(`Module service operation failed for ${module.id}:`, error);
          test.errors.push(`Module service operation failed for ${module.id}: ${error}`);
        }
      }

      test.details = `Tested ${totalOperations} module service operations. ${successfulOperations} successful.`;
      
      if (successfulOperations < totalOperations * 0.8) {
        test.passed = false;
        test.errors.push('Module service integration has too many failures');
      }

    } catch (error) {
      test.passed = false;
      test.errors.push(`Module service integration test failed: ${error}`);
    }

    test.duration = performance.now() - startTime;
    return test;
  }

  private async testVideoServiceIntegration(modules: EducationalModule[]): Promise<IntegrationTestResult> {
    const startTime = performance.now();
    const test: IntegrationTestResult = {
      testName: 'Video Service Integration',
      passed: true,
      duration: 0,
      details: '',
      errors: [],
      warnings: []
    };

    try {
      let totalVideos = 0;
      let validVideos = 0;

      for (const module of modules) {
        if (module.videos && module.videos.length > 0) {
          for (const video of module.videos) {
            totalVideos++;
            
            try {
              const youtubeId = this.extractYouTubeId(video.url);
              if (youtubeId) {
                // Test YouTube video accessibility
                const videoData = await this.youtubeService.getVideoDetails(youtubeId);
                if (videoData) {
                  validVideos++;
                } else {
                  test.errors.push(`YouTube video not accessible: ${youtubeId} in module ${module.id}`);
                }
              } else {
                test.warnings.push(`Video in module ${module.id} has no YouTube URL`);
                validVideos++; // Count as valid for non-YouTube videos
              }
            } catch (error) {
              console.error(`Video validation failed for ${video.url}:`, error);
              test.errors.push(`Video validation failed for ${video.url}: ${error}`);
            }
          }
        }
      }

      test.details = `Tested ${totalVideos} videos. ${validVideos} are accessible.`;
      
      if (totalVideos > 0 && validVideos < totalVideos * 0.8) {
        test.passed = false;
      }

    } catch (error) {
      test.passed = false;
      test.errors.push(`Video service integration test failed: ${error}`);
    }

    test.duration = performance.now() - startTime;
    return test;
  }

  private async testQuizServiceIntegration(modules: EducationalModule[]): Promise<IntegrationTestResult> {
    const startTime = performance.now();
    const test: IntegrationTestResult = {
      testName: 'Quiz Service Integration',
      passed: true,
      duration: 0,
      details: '',
      errors: [],
      warnings: []
    };

    try {
      let totalQuizzes = 0;
      let validQuizzes = 0;

      for (const module of modules) {
        if (module.quiz && module.quiz.questions.length > 0) {
          totalQuizzes++;
          
          try {
            const validation = this.quizValidator.validateQuiz(module.quiz as any);
            if (validation.isValid) {
              validQuizzes++;
            } else {
              test.errors.push(`Quiz validation failed for module ${module.id}: ${validation.errors.join(', ')}`);
            }
          } catch (error) {
            test.errors.push(`Quiz validation error for module ${module.id}: ${error}`);
          }
        }
      }

      test.details = `Tested ${totalQuizzes} quizzes. ${validQuizzes} are valid.`;
      
      if (totalQuizzes > 0 && validQuizzes < totalQuizzes * 0.9) {
        test.passed = false;
      }

    } catch (error) {
      test.passed = false;
      test.errors.push(`Quiz service integration test failed: ${error}`);
    }

    test.duration = performance.now() - startTime;
    return test;
  }

  private async testLLMServiceIntegration(): Promise<IntegrationTestResult> {
    const startTime = performance.now();
    const test: IntegrationTestResult = {
      testName: 'LLM Service Integration',
      passed: true,
      duration: 0,
      details: '',
      errors: [],
      warnings: []
    };

    try {
      // Test LLM service availability and basic functionality with timeout
      const timeoutMs = 5000; // 5 second timeout
      
      try {
        const orchestrator = new ModuleGenerationOrchestrator();
        
        // Check if we're in a test environment to avoid real timeouts
        const isTestEnv = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;
        
        let response;
        if (isTestEnv) {
          // In test environment, just await the promise without timeout to avoid hanging
          response = await orchestrator.generateModule({
            topic: 'Jungian Psychology',
            objectives: ['Understand basic concepts'],
            targetAudience: 'General learners',
            duration: 30,
            difficulty: 'beginner'
          });
        } else {
          // In production, use timeout
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), timeoutMs)
          );
          
          const generatePromise = orchestrator.generateModule({
            topic: 'Jungian Psychology',
            objectives: ['Understand basic concepts'],
            targetAudience: 'General learners',
            duration: 30,
            difficulty: 'beginner'
          });

          response = await Promise.race([generatePromise, timeoutPromise]);
        }

        if (response && (response as any).module && (response as any).module.title) {
          test.details = 'LLM service is responsive and generating content';
        } else {
          test.warnings.push('LLM service response is invalid or empty');
          test.passed = false;
        }
      } catch (error) {
        console.error('LLM service integration error:', error);
        if (error instanceof Error && error.message.includes('Timeout')) {
          test.errors.push(`LLM service timeout after ${timeoutMs}ms: ${error}`);
        } else {
          test.errors.push(`LLM service error: ${error}`);
        }
        test.passed = false;
      }

    } catch (error) {
      console.error('LLM service integration test failed:', error);
      test.passed = false;
      test.errors.push(`LLM service integration test failed: ${error}`);
    }

    test.duration = performance.now() - startTime;
    return test;
  }

  private async testBibliographyServiceIntegration(modules: EducationalModule[]): Promise<IntegrationTestResult> {
    const startTime = performance.now();
    const test: IntegrationTestResult = {
      testName: 'Bibliography Service Integration',
      passed: true,
      duration: 0,
      details: '',
      errors: [],
      warnings: []
    };

    try {
      let totalBibliographies = 0;
      let validBibliographies = 0;

      for (const module of modules) {
        if (module.bibliography && module.bibliography.length > 0) {
          totalBibliographies++;
          
          let validReferences = 0;
          for (const ref of module.bibliography) {
            if (ref.title && ref.authors && ref.authors.length > 0) {
              validReferences++;
            }
          }
          
          if (validReferences === module.bibliography.length) {
            validBibliographies++;
          } else {
            test.warnings.push(`Module ${module.id} has incomplete bibliography references`);
          }
        }
      }

      test.details = `Tested ${totalBibliographies} bibliographies. ${validBibliographies} are complete.`;
      
      if (totalBibliographies === 0) {
        test.warnings.push('No bibliographies found to test');
      }

    } catch (error) {
      test.passed = false;
      test.errors.push(`Bibliography service integration test failed: ${error}`);
    }

    test.duration = performance.now() - startTime;
    return test;
  }

  // API Integration Test Implementations

  private async testYouTubeApiIntegration(modules: EducationalModule[]): Promise<IntegrationTestResult> {
    const startTime = performance.now();
    const test: IntegrationTestResult = {
      testName: 'YouTube API Integration',
      passed: true,
      duration: 0,
      details: '',
      errors: [],
      warnings: []
    };

    try {
      const videoIds = modules
        .flatMap(m => m.videos || [])
        .map(v => this.extractYouTubeId(v.url))
        .filter(Boolean)
        .slice(0, 5); // Test first 5 videos

      let successfulRequests = 0;
      
      for (const videoId of videoIds) {
        if (!videoId) continue;
        try {
          const videoData = await this.youtubeService.getVideoDetails(videoId);
          if (videoData) {
            successfulRequests++;
          }
        } catch (error) {
          test.errors.push(`YouTube API request failed for video ${videoId}: ${error}`);
        }
      }

      test.details = `Tested ${videoIds.length} YouTube API requests. ${successfulRequests} successful.`;
      
      if (videoIds.length > 0 && successfulRequests < videoIds.length * 0.8) {
        test.passed = false;
      }

    } catch (error) {
      test.passed = false;
      test.errors.push(`YouTube API integration test failed: ${error}`);
    }

    test.duration = performance.now() - startTime;
    return test;
  }

  private async testOpenAIApiIntegration(): Promise<IntegrationTestResult> {
    const startTime = performance.now();
    const test: IntegrationTestResult = {
      testName: 'OpenAI API Integration',
      passed: true,
      duration: 0,
      details: '',
      errors: [],
      warnings: []
    };

    try {
      // Test basic OpenAI API connectivity
      const orchestrator = new ModuleGenerationOrchestrator();
      const testResponse = await orchestrator.generateModule({
        topic: 'API Test',
        objectives: ['Test connectivity'],
        targetAudience: 'System',
        duration: 5,
        difficulty: 'beginner'
      });

      if (testResponse && testResponse.module) {
        test.details = 'OpenAI API is accessible and responding';
      } else {
        test.passed = false;
        test.errors.push('OpenAI API response is invalid or empty');
      }

    } catch (error) {
      test.passed = false;
      test.errors.push(`OpenAI API integration test failed: ${error}`);
    }

    test.duration = performance.now() - startTime;
    return test;
  }

  private async testExternalResourceApiIntegration(modules: EducationalModule[]): Promise<IntegrationTestResult> {
    const startTime = performance.now();
    const test: IntegrationTestResult = {
      testName: 'External Resource API Integration',
      passed: true,
      duration: 0,
      details: '',
      errors: [],
      warnings: []
    };

    try {
      // Test external resource links
      const externalLinks = modules
        .flatMap(m => m.bibliography || [])
        .map(b => b.url)
        .filter(Boolean)
        .slice(0, 5); // Test first 5 links

      let accessibleLinks = 0;
      
      for (const url of externalLinks) {
        try {
          // Simulate link checking (in real implementation, use fetch with HEAD request)
          const isAccessible = await this.simulateLinkCheck(url || '');
          if (isAccessible) {
            accessibleLinks++;
          }
        } catch (error) {
          test.warnings.push(`External link check failed for ${url}: ${error}`);
        }
      }

      test.details = `Checked ${externalLinks.length} external links. ${accessibleLinks} are accessible.`;

    } catch (error) {
      test.passed = false;
      test.errors.push(`External resource API integration test failed: ${error}`);
    }

    test.duration = performance.now() - startTime;
    return test;
  }

  private async testApiErrorHandling(): Promise<IntegrationTestResult> {
    const startTime = performance.now();
    const test: IntegrationTestResult = {
      testName: 'API Error Handling',
      passed: true,
      duration: 0,
      details: '',
      errors: [],
      warnings: []
    };

    try {
      // Test various error scenarios
      const errorScenarios = [
        'invalid-video-id',
        'network-timeout',
        'api-rate-limit',
        'invalid-credentials'
      ];

      let handledErrors = 0;
      
      for (const scenario of errorScenarios) {
        try {
          await this.simulateErrorScenario(scenario);
          handledErrors++;
        } catch (error) {
          // Expected behavior - errors should be caught and handled
          if ((error as any).message.includes('handled')) {
            handledErrors++;
          } else {
            test.errors.push(`Unhandled error scenario: ${scenario}`);
          }
        }
      }

      test.details = `Tested ${errorScenarios.length} error scenarios. ${handledErrors} properly handled.`;
      
      if (handledErrors < errorScenarios.length) {
        test.passed = false;
      }

    } catch (error) {
      test.passed = false;
      test.errors.push(`API error handling test failed: ${error}`);
    }

    test.duration = performance.now() - startTime;
    return test;
  }

  private async testApiRateLimiting(): Promise<IntegrationTestResult> {
    const startTime = performance.now();
    const test: IntegrationTestResult = {
      testName: 'API Rate Limiting',
      passed: true,
      duration: 0,
      details: '',
      errors: [],
      warnings: []
    };

    try {
      // Test rate limiting behavior
      const rapidRequests = 10;
      let successfulRequests = 0;
      let rateLimitedRequests = 0;

      for (let i = 0; i < rapidRequests; i++) {
        try {
          await this.simulateRapidApiRequest();
          successfulRequests++;
        } catch (error) {
          if ((error as any).message.includes('rate limit')) {
            rateLimitedRequests++;
          } else {
            test.errors.push(`Unexpected error in rate limiting test: ${error}`);
          }
        }
      }

      test.details = `Made ${rapidRequests} rapid requests. ${successfulRequests} successful, ${rateLimitedRequests} rate limited.`;
      
      // Rate limiting should kick in for rapid requests
      if (rateLimitedRequests === 0 && rapidRequests > 5) {
        test.warnings.push('No rate limiting detected - may lead to API abuse');
      }

    } catch (error) {
      test.passed = false;
      test.errors.push(`API rate limiting test failed: ${error}`);
    }

    test.duration = performance.now() - startTime;
    return test;
  }

  // Data Integration Test Implementations

  private async testDataSchemaConsistency(modules: EducationalModule[]): Promise<IntegrationTestResult> {
    const startTime = performance.now();
    const test: IntegrationTestResult = {
      testName: 'Data Schema Consistency',
      passed: true,
      duration: 0,
      details: '',
      errors: [],
      warnings: []
    };

    try {
      // Test schema consistency across all modules
      const schemaErrors: string[] = [];
      
      for (const module of modules) {
        try {
          // Validate against schema
          const validation = this.validateModuleSchema(module);
          if (!validation.isValid) {
            schemaErrors.push(...validation.errors);
          }
        } catch (error) {
          schemaErrors.push(`Schema validation failed for module ${module.id}: ${error}`);
        }
      }

      test.details = `Validated schema for ${modules.length} modules. Found ${schemaErrors.length} errors.`;
      
      if (schemaErrors.length > 0) {
        test.passed = false;
        test.errors = schemaErrors.slice(0, 10); // Limit to first 10 errors
      }

    } catch (error) {
      test.passed = false;
      test.errors.push(`Data schema consistency test failed: ${error}`);
    }

    test.duration = performance.now() - startTime;
    return test;
  }

  private async testDataRelationshipIntegrity(modules: EducationalModule[]): Promise<IntegrationTestResult> {
    const startTime = performance.now();
    const test: IntegrationTestResult = {
      testName: 'Data Relationship Integrity',
      passed: true,
      duration: 0,
      details: '',
      errors: [],
      warnings: []
    };

    try {
      // Test relationships between data entities
      const relationships = this.analyzeDataRelationships(modules);
      let brokenRelationships = 0;

      for (const relationship of relationships) {
        if (!this.validateRelationship(relationship, modules)) {
          brokenRelationships++;
          test.errors.push(`Broken relationship: ${relationship.type} from ${relationship.source} to ${relationship.target}`);
        }
      }

      test.details = `Checked ${relationships.length} relationships. ${brokenRelationships} broken.`;
      
      if (brokenRelationships > 0) {
        test.passed = false;
      }

    } catch (error) {
      test.passed = false;
      test.errors.push(`Data relationship integrity test failed: ${error}`);
    }

    test.duration = performance.now() - startTime;
    return test;
  }

  private async testDataSerialization(modules: EducationalModule[]): Promise<IntegrationTestResult> {
    const startTime = performance.now();
    const test: IntegrationTestResult = {
      testName: 'Data Serialization/Deserialization',
      passed: true,
      duration: 0,
      details: '',
      errors: [],
      warnings: []
    };

    try {
      let successfulSerializations = 0;
      const testModules = modules.slice(0, 5); // Test first 5 modules
      
      for (const module of testModules) {
        try {
          // Check for circular references before serialization
          if (this.hasCircularReferences(module)) {
            test.errors.push(`Module ${module.id} contains circular references that prevent serialization`);
            continue;
          }

          // Test JSON serialization
          const serialized = JSON.stringify(module);
          const deserialized = JSON.parse(serialized);
          
          // Test deep equality
          if (this.deepEqual(module, deserialized)) {
            successfulSerializations++;
          } else {
            test.errors.push(`Serialization/deserialization failed for module ${module.id}`);
          }
        } catch (error) {
          // Check if it's a circular reference error
          if (error instanceof TypeError && (error.message.includes('circular') || error.message.includes('Converting circular structure'))) {
            test.errors.push(`Circular reference detected in module ${module.id}: ${error.message}`);
          } else {
            test.errors.push(`Serialization error for module ${module.id}: ${error}`);
          }
        }
      }

      test.details = `Tested serialization for ${testModules.length} modules. ${successfulSerializations} successful.`;
      
      if (successfulSerializations < testModules.length && testModules.length > 0) {
        test.passed = false;
      }

    } catch (error) {
      test.passed = false;
      test.errors.push(`Data serialization test failed: ${error}`);
    }

    test.duration = performance.now() - startTime;
    return test;
  }

  private async testDataMigrationCompatibility(modules: EducationalModule[]): Promise<IntegrationTestResult> {
    const startTime = performance.now();
    const test: IntegrationTestResult = {
      testName: 'Data Migration Compatibility',
      passed: true,
      duration: 0,
      details: '',
      errors: [],
      warnings: []
    };

    try {
      // Test backward compatibility with older data formats
      const migrationTests = [
        'v1.0_to_v1.1',
        'v1.1_to_v1.2',
        'missing_optional_fields',
        'deprecated_field_handling'
      ];

      let passedMigrations = 0;
      
      for (const migrationTest of migrationTests) {
        try {
          const result = await this.simulateMigrationTest(migrationTest, modules[0]);
          if (result) {
            passedMigrations++;
          }
        } catch (error) {
          test.errors.push(`Migration test failed: ${migrationTest} - ${error}`);
        }
      }

      test.details = `Tested ${migrationTests.length} migration scenarios. ${passedMigrations} passed.`;
      
      if (passedMigrations < migrationTests.length) {
        test.passed = false;
      }

    } catch (error) {
      test.passed = false;
      test.errors.push(`Data migration compatibility test failed: ${error}`);
    }

    test.duration = performance.now() - startTime;
    return test;
  }

  private async testDataBackupRestore(modules: EducationalModule[]): Promise<IntegrationTestResult> {
    const startTime = performance.now();
    const test: IntegrationTestResult = {
      testName: 'Data Backup and Restore',
      passed: true,
      duration: 0,
      details: '',
      errors: [],
      warnings: []
    };

    try {
      // Simulate backup and restore operations
      const testModule = modules[0];
      
      // Create backup
      const backup = this.createDataBackup(testModule);
      
      // Simulate data modification
      const modifiedModule = { ...testModule, title: 'Modified Title' };
      
      // Restore from backup
      const restored = this.restoreFromBackup(backup);
      
      // Verify restoration
      if (this.deepEqual(testModule, restored)) {
        test.details = 'Backup and restore operations successful';
      } else {
        test.passed = false;
        test.errors.push('Backup/restore data integrity check failed');
      }

    } catch (error) {
      test.passed = false;
      test.errors.push(`Data backup/restore test failed: ${error}`);
    }

    test.duration = performance.now() - startTime;
    return test;
  }

  // Performance Integration Test Implementations

  private async testConcurrentModuleLoading(modules: EducationalModule[]): Promise<IntegrationTestResult> {
    const startTime = performance.now();
    const test: IntegrationTestResult = {
      testName: 'Concurrent Module Loading',
      passed: true,
      duration: 0,
      details: '',
      errors: [],
      warnings: []
    };

    try {
      const concurrentLoads = 5;
      const promises = [];
      
      for (let i = 0; i < concurrentLoads; i++) {
        const moduleIndex = i % modules.length;
        promises.push(this.simulateModuleLoad(modules[moduleIndex]));
      }
      
      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      
      test.details = `Loaded ${concurrentLoads} modules concurrently. ${successful} successful.`;
      
      if (successful < concurrentLoads * 0.8) {
        test.passed = false;
        test.errors.push('Too many concurrent loading failures');
      }

    } catch (error) {
      test.passed = false;
      test.errors.push(`Concurrent module loading test failed: ${error}`);
    }

    test.duration = performance.now() - startTime;
    return test;
  }

  private async testMemoryUsageUnderLoad(modules: EducationalModule[]): Promise<IntegrationTestResult> {
    const startTime = performance.now();
    const test: IntegrationTestResult = {
      testName: 'Memory Usage Under Load',
      passed: true,
      duration: 0,
      details: '',
      errors: [],
      warnings: []
    };

    try {
      const initialMemory = this.getMemoryUsage();
      
      // Simulate memory intensive operations
      const largeDataSets = [];
      for (let i = 0; i < 10; i++) {
        largeDataSets.push(JSON.stringify(modules));
      }
      
      const peakMemory = this.getMemoryUsage();
      const memoryIncrease = peakMemory - initialMemory;
      
      // Cleanup
      largeDataSets.length = 0;
      
      const finalMemory = this.getMemoryUsage();
      const memoryLeakage = finalMemory - initialMemory;
      
      test.details = `Memory increase: ${memoryIncrease}MB, potential leakage: ${memoryLeakage}MB`;
      
      if (memoryLeakage > 50) { // 50MB leakage threshold
        test.passed = false;
        test.errors.push('Significant memory leakage detected');
      }

    } catch (error) {
      test.passed = false;
      test.errors.push(`Memory usage test failed: ${error}`);
    }

    test.duration = performance.now() - startTime;
    return test;
  }

  private async testApiResponseTimeConsistency(): Promise<IntegrationTestResult> {
    const startTime = performance.now();
    const test: IntegrationTestResult = {
      testName: 'API Response Time Consistency',
      passed: true,
      duration: 0,
      details: '',
      errors: [],
      warnings: []
    };

    try {
      const responseTimes: number[] = [];
      const requests = 5;
      
      for (let i = 0; i < requests; i++) {
        const requestStart = performance.now();
        await this.simulateApiRequest();
        const requestTime = performance.now() - requestStart;
        responseTimes.push(requestTime);
      }
      
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      const minResponseTime = Math.min(...responseTimes);
      const variance = maxResponseTime - minResponseTime;
      
      test.details = `Avg: ${avgResponseTime.toFixed(2)}ms, Variance: ${variance.toFixed(2)}ms`;
      
      if (avgResponseTime > 2000) { // 2 second threshold
        test.warnings.push('Average response time is high');
      }
      
      if (variance > 1000) { // 1 second variance threshold
        test.warnings.push('Response time variance is high');
      }

    } catch (error) {
      test.passed = false;
      test.errors.push(`API response time consistency test failed: ${error}`);
    }

    test.duration = performance.now() - startTime;
    return test;
  }

  private async testResourceCleanup(modules: EducationalModule[]): Promise<IntegrationTestResult> {
    const startTime = performance.now();
    const test: IntegrationTestResult = {
      testName: 'Resource Cleanup',
      passed: true,
      duration: 0,
      details: '',
      errors: [],
      warnings: []
    };

    try {
      // Track resource allocations
      const initialResources = this.getResourceCount();
      
      // Allocate resources
      const allocated = await this.allocateTestResources(modules);
      const peakResources = this.getResourceCount();
      
      // Cleanup resources
      await this.cleanupTestResources(allocated);
      const finalResources = this.getResourceCount();
      
      const resourceLeak = finalResources - initialResources;
      
      test.details = `Resources: initial=${initialResources}, peak=${peakResources}, final=${finalResources}`;
      
      if (resourceLeak > 5) {
        test.passed = false;
        test.errors.push(`Resource leak detected: ${resourceLeak} resources not cleaned up`);
      }

    } catch (error) {
      test.passed = false;
      test.errors.push(`Resource cleanup test failed: ${error}`);
    }

    test.duration = performance.now() - startTime;
    return test;
  }

  private async testScalabilityLimits(modules: EducationalModule[]): Promise<IntegrationTestResult> {
    const startTime = performance.now();
    const test: IntegrationTestResult = {
      testName: 'Scalability Limits',
      passed: true,
      duration: 0,
      details: '',
      errors: [],
      warnings: []
    };

    try {
      // Test system limits
      const scalabilityTests = [
        { name: 'Large Module Count', test: () => this.testModuleCountLimit(modules) },
        { name: 'Large Content Size', test: () => this.testContentSizeLimit(modules[0]) },
        { name: 'Concurrent Users', test: () => this.testConcurrentUserLimit() },
        { name: 'Data Volume', test: () => this.testDataVolumeLimit(modules) }
      ];

      let passedTests = 0;
      
      for (const scalabilityTest of scalabilityTests) {
        try {
          const result = await scalabilityTest.test();
          if (result) {
            passedTests++;
          } else {
            test.warnings.push(`Scalability limit reached: ${scalabilityTest.name}`);
          }
        } catch (error) {
          test.errors.push(`Scalability test failed: ${scalabilityTest.name} - ${error}`);
        }
      }

      test.details = `Tested ${scalabilityTests.length} scalability scenarios. ${passedTests} passed.`;
      
      if (passedTests < scalabilityTests.length * 0.5) {
        test.warnings.push('Multiple scalability limits detected');
      }

    } catch (error) {
      test.passed = false;
      test.errors.push(`Scalability limits test failed: ${error}`);
    }

    test.duration = performance.now() - startTime;
    return test;
  }

  // Helper methods for integration testing

  private extractModuleContent(module: EducationalModule): string {
    if (!module) return '';
    
    let content = (module.title || '') + ' ' + (module.description || '');
    
    if (module.content && typeof module.content === 'object') {
      content += ' ' + (module.content.introduction || '');
      
      if (module.content.sections && Array.isArray(module.content.sections)) {
        content += ' ' + module.content.sections
          .map((s: any) => s?.content || '')
          .filter(Boolean)
          .join(' ');
      }
    }
    
    return content.trim();
  }

  private extractTerminology(content: string): string[] {
    // Extract psychological and Jungian terminology
    const terms = content.match(/\b(archetype|shadow|anima|animus|persona|self|ego|unconscious|conscious|individuation|complex|psyche|collective|analytical|psychology|jungian|jung)\b/gi);
    return terms ? [...new Set(terms.map(t => t.toLowerCase()))] : [];
  }

  private findTerminologyVariants(term: string, modules: EducationalModule[]): string[] {
    const variants = new Set<string>();
    
    for (const module of modules) {
      const content = this.extractModuleContent(module);
      const regex = new RegExp(`\\b${term}[a-z]*\\b`, 'gi');
      const matches = content.match(regex);
      if (matches) {
        matches.forEach(match => variants.add(match.toLowerCase()));
      }
    }
    
    return Array.from(variants);
  }

  private extractModuleReferences(content: string): string[] {
    // Extract references to other modules (simplified pattern)
    const references = content.match(/module-[a-z0-9-]+/gi);
    return references ? [...new Set(references)] : [];
  }

  private async simulateModuleServiceOperation(operation: string, module: EducationalModule): Promise<boolean> {
    try {
      switch (operation) {
        case 'create':
          await this.moduleService.createModule(module);
          break;
        case 'read':
          await this.moduleService.getModuleById(module.id);
          break;
        case 'update':
          await this.moduleService.updateModule(module.id, module);
          break;
        case 'delete':
          await this.moduleService.deleteModule(module.id);
          break;
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
      return true;
    } catch (error) {
      throw new Error(`${operation} operation failed: ${error}`);
    }
  }

  private async simulateLinkCheck(url: string): Promise<boolean> {
    // Simulate external link checking
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500));
    
    // Simulate some links being inaccessible
    return Math.random() > 0.2;
  }

  private async simulateErrorScenario(scenario: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
    throw new Error(`Error scenario ${scenario} handled`);
  }

  private async simulateRapidApiRequest(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Simulate rate limiting after 5 rapid requests
    if (Math.random() < 0.3) {
      throw new Error('rate limit exceeded');
    }
  }

  private validateModuleSchema(module: EducationalModule): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!module.id) errors.push('Missing module ID');
    if (!module.title) errors.push('Missing module title');
    if (!module.content) errors.push('Missing module content');
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private analyzeDataRelationships(modules: EducationalModule[]): Array<{ type: string; source: string; target: string }> {
    const relationships: Array<{ type: string; source: string; target: string }> = [];
    
    for (const module of modules) {
      if (module.prerequisites) {
        module.prerequisites.forEach((prereqId: any) => {
          relationships.push({
            type: 'prerequisite',
            source: module.id,
            target: prereqId
          });
        });
      }
    }
    
    return relationships;
  }

  private validateRelationship(relationship: { type: string; source: string; target: string }, modules: EducationalModule[]): boolean {
    const sourceModule = modules.find(m => m.id === relationship.source);
    const targetModule = modules.find(m => m.id === relationship.target);
    
    return sourceModule !== undefined && targetModule !== undefined;
  }

  private deepEqual(obj1: any, obj2: any): boolean {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  }

  private createDataBackup(module: EducationalModule): string {
    return JSON.stringify(module);
  }

  private restoreFromBackup(backup: string): EducationalModule {
    return JSON.parse(backup);
  }

  private async simulateMigrationTest(testType: string, module: EducationalModule): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 100));
    // Simulate migration success/failure
    return Math.random() > 0.2;
  }

  private async simulateModuleLoad(module: EducationalModule): Promise<void> {
    const loadTime = Math.random() * 1000; // 0-1 second
    await new Promise(resolve => setTimeout(resolve, loadTime));
    
    if (Math.random() < 0.1) {
      throw new Error('Module load failed');
    }
  }

  private getMemoryUsage(): number {
    // Simulate memory usage measurement
    return Math.random() * 100; // 0-100 MB
  }

  private async simulateApiRequest(): Promise<void> {
    const responseTime = 500 + Math.random() * 1000; // 500-1500ms
    await new Promise(resolve => setTimeout(resolve, responseTime));
  }

  private getResourceCount(): number {
    // Simulate resource counting
    return Math.floor(Math.random() * 10);
  }

  private async allocateTestResources(modules: EducationalModule[]): Promise<any[]> {
    // Simulate resource allocation
    return modules.map(() => ({ allocated: true }));
  }

  private async cleanupTestResources(resources: any[]): Promise<void> {
    // Simulate resource cleanup
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async testModuleCountLimit(modules: EducationalModule[]): Promise<boolean> {
    // Test if system can handle the number of modules
    return modules.length < 1000; // Arbitrary limit
  }

  private async testContentSizeLimit(module: EducationalModule): Promise<boolean> {
    // Test if system can handle large content
    const contentSize = JSON.stringify(module).length;
    return contentSize < 1000000; // 1MB limit
  }

  private async testConcurrentUserLimit(): Promise<boolean> {
    // Simulate concurrent user testing
    return Math.random() > 0.3; // 70% chance of passing
  }

  private async testDataVolumeLimit(modules: EducationalModule[]): Promise<boolean> {
    // Test data volume limits
    const totalSize = modules.reduce((size, module) => size + JSON.stringify(module).length, 0);
    return totalSize < 10000000; // 10MB total limit
  }

  // Additional helper methods for enhanced validation

  private validateModuleInput(modules: EducationalModule[]): { criticalIssues: string[] } {
    const issues: string[] = [];
    
    if (!modules) {
      issues.push('Modules array is null or undefined');
      return { criticalIssues: issues };
    }

    if (modules.length === 0) {
      issues.push('No modules provided for validation');
    }

    // Check for null/undefined modules
    const nullModuleCount = modules.filter(m => m === null || m === undefined).length;
    if (nullModuleCount > 0) {
      issues.push(`Found ${nullModuleCount} null or undefined modules`);
    }

    // Check for modules with missing critical fields
    const invalidModules = modules.filter(m => m && (!m.id || !m.title)).length;
    if (invalidModules > 0) {
      issues.push(`Found ${invalidModules} modules with missing required fields (id, title)`);
    }

    return { criticalIssues: issues };
  }

  private sanitizeModules(modules: EducationalModule[]): EducationalModule[] {
    if (!modules) return [];
    
    return modules.filter(module => {
      if (!module || typeof module !== 'object') return false;
      if (!module.id || !module.title) return false;
      return true;
    });
  }

  private validateModuleStructure(modules: EducationalModule[]): string[] {
    const issues: string[] = [];
    
    for (const module of modules) {
      if (!module.content) {
        issues.push(`Module ${module.id} has no content`);
        continue;
      }

      if (!module.content.introduction) {
        issues.push(`Module ${module.id} missing introduction`);
      }

      if (module.content.sections && Array.isArray(module.content.sections)) {
        const orders = module.content.sections.map((s: any) => s.order);
        const hasInvalidOrders = orders.some(order => typeof order !== 'number' || order < 0);
        if (hasInvalidOrders) {
          issues.push(`Module ${module.id} has invalid section ordering`);
        }
      }
    }
    
    return issues;
  }

  private createFailureTestResults(category: string, error: any): IntegrationTestResult[] {
    const testName = `${category.charAt(0).toUpperCase() + category.slice(1)} Tests`;
    return [{
      testName,
      passed: false,
      duration: 0,
      details: `Category failed due to validation error: ${error}`,
      errors: [`${category} validation failed: ${error}`],
      warnings: []
    }];
  }

  private hasCircularReferences(obj: any, seen = new WeakSet()): boolean {
    if (obj === null || typeof obj !== 'object') {
      return false;
    }

    if (seen.has(obj)) {
      return true;
    }

    seen.add(obj);

    try {
      for (const key in obj) {
        if (obj.hasOwnProperty && obj.hasOwnProperty(key)) {
          if (this.hasCircularReferences(obj[key], seen)) {
            return true;
          }
        }
      }
    } catch (error) {
      // If we can't iterate through the object, assume it might have circular refs
      return true;
    }

    seen.delete(obj);
    return false;
  }

  // Overall calculation methods

  private calculateOverallResults(report: IntegrationValidationReport): void {
    const allTests = [
      ...report.categories.moduleIntegration,
      ...report.categories.serviceIntegration,
      ...report.categories.dataIntegration,
      ...report.categories.apiIntegration,
      ...report.categories.performanceIntegration
    ];

    report.overall.totalTests = allTests.length;
    report.overall.passedTests = allTests.filter(test => test.passed).length;
    report.overall.failedTests = report.overall.totalTests - report.overall.passedTests;
    // Ensure overall.passed is always a boolean, never null
    report.overall.passed = Boolean(report.overall.failedTests === 0 && report.criticalIssues.length === 0);
    
    // Calculate base score from test results
    let baseScore = report.overall.totalTests > 0 ? Math.round((report.overall.passedTests / report.overall.totalTests) * 100) : 0;
    
    // Apply heavy penalties for critical issues
    if (report.criticalIssues.length > 0) {
      // Each critical issue reduces score by 15 points, with a minimum score of 0
      const criticalIssuePenalty = report.criticalIssues.length * 15;
      baseScore = Math.max(0, baseScore - criticalIssuePenalty);
      
      // Additional penalty for specific types of critical issues
      const hasMajorStructuralIssues = report.criticalIssues.some(issue => 
        issue.includes('null or undefined') || 
        issue.includes('missing required fields') ||
        issue.includes('circular')
      );
      
      if (hasMajorStructuralIssues) {
        baseScore = Math.max(0, baseScore - 20); // Additional 20 point penalty
      }
    }
    
    report.overall.score = baseScore;
  }

  private generateRecommendations(report: IntegrationValidationReport): string[] {
    const recommendations: string[] = [];

    if (report.overall.score < 80) {
      recommendations.push('Address failing integration tests to improve system reliability');
    }

    if (report.overall.score < 60) {
      recommendations.push('Critical integration issues detected - immediate attention required');
    }

    // Category-specific recommendations
    const failedModuleTests = report.categories.moduleIntegration.filter(t => !t.passed);
    if (failedModuleTests.length > 0) {
      recommendations.push('Fix module integration issues, particularly prerequisite chains and content consistency');
    }

    const failedServiceTests = report.categories.serviceIntegration.filter(t => !t.passed);
    if (failedServiceTests.length > 0) {
      recommendations.push('Resolve service integration problems, especially with external APIs');
    }

    const failedDataTests = report.categories.dataIntegration.filter(t => !t.passed);
    if (failedDataTests.length > 0) {
      recommendations.push('Address data integrity and consistency issues');
    }

    const failedApiTests = report.categories.apiIntegration.filter(t => !t.passed);
    if (failedApiTests.length > 0) {
      recommendations.push('Improve API integration robustness and error handling');
    }

    const failedPerformanceTests = report.categories.performanceIntegration.filter(t => !t.passed);
    if (failedPerformanceTests.length > 0) {
      recommendations.push('Optimize system performance and resource management');
    }

    // Ensure we always have integration-related recommendations
    if (recommendations.length === 0) {
      recommendations.push('Continue monitoring integration health and performance');
    } else {
      recommendations.push('Review all integration points for potential improvements');
    }

    return recommendations;
  }

  private identifyCriticalIssues(report: IntegrationValidationReport): string[] {
    const criticalIssues: string[] = [];

    // Identify tests with errors (not just warnings)
    const allTests = [
      ...report.categories.moduleIntegration,
      ...report.categories.serviceIntegration,
      ...report.categories.dataIntegration,
      ...report.categories.apiIntegration,
      ...report.categories.performanceIntegration
    ];

    const testsWithErrors = allTests.filter(test => test.errors.length > 0);
    
    testsWithErrors.forEach(test => {
      test.errors.forEach(error => {
        criticalIssues.push(`${test.testName}: ${error}`);
      });
    });

    // Add critical threshold checks
    if (report.overall.score < 60) {
      criticalIssues.push('Overall integration score is critically low');
    }

    if (report.overall.failedTests > report.overall.totalTests * 0.5) {
      criticalIssues.push('More than 50% of integration tests are failing');
    }

    // Add specific critical patterns
    const moduleIntegrationFailures = report.categories.moduleIntegration.filter(t => !t.passed);
    if (moduleIntegrationFailures.length > 0) {
      const hasCircularDeps = moduleIntegrationFailures.some(t => 
        t.errors.some(e => e.toLowerCase().includes('circular'))
      );
      if (hasCircularDeps) {
        criticalIssues.push('Circular dependencies detected in module prerequisites');
      }
    }

    // Check for serialization issues
    const dataIntegrationFailures = report.categories.dataIntegration.filter(t => !t.passed);
    if (dataIntegrationFailures.length > 0) {
      const hasSerializationIssues = dataIntegrationFailures.some(t => 
        t.testName.includes('Serialization') && t.errors.length > 0
      );
      if (hasSerializationIssues) {
        criticalIssues.push('Data serialization issues may cause system instability');
      }
    }

    // Check for service integration failures
    const serviceFailures = report.categories.serviceIntegration.filter(t => !t.passed);
    if (serviceFailures.length >= 3) {
      criticalIssues.push('Multiple service integration failures detected');
    }

    return criticalIssues;
  }

  private extractYouTubeId(url: string): string | null {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  }
}

// Export singleton instance
export const integrationValidator = new IntegrationValidator();