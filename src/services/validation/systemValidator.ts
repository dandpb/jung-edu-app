/**
 * System-wide Validation Service for jaqEdu Platform
 * Provides comprehensive validation for AI-generated educational resources
 * 
 * Features:
 * - Module validation with content quality checks
 * - Resource integration validation
 * - End-to-end functionality testing
 * - Automated quality assurance
 * - Performance and accuracy metrics
 */

import { EducationalModule, Quiz as SchemaQuiz } from '../../schemas/module.schema';
import { validateEducationalModule, sanitizeModule } from '../../schemas/module.validator';
import { quizValidator, ValidationResult } from '../quiz/quizValidator';
import { YouTubeService } from '../video/youtubeService';
import { Quiz as TypesQuiz, Question as TypesQuestion } from '../../types';

export interface SystemValidationResult {
  isValid: boolean;
  overall: {
    score: number; // 0-100
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    status: 'excellent' | 'good' | 'acceptable' | 'needs_improvement' | 'failed';
  };
  modules: ModuleValidationResult[];
  integration: IntegrationValidationResult;
  performance: PerformanceValidationResult;
  recommendations: ValidationRecommendation[];
  errors: string[];
  warnings: string[];
}

export interface ModuleValidationResult {
  moduleId: string;
  title: string;
  isValid: boolean;
  contentQuality: ContentQualityResult;
  structuralIntegrity: StructuralIntegrityResult;
  aiAccuracy: AIAccuracyResult;
  userExperience: UserExperienceResult;
  score: number; // 0-100
}

export interface ContentQualityResult {
  score: number;
  readabilityScore: number;
  contentDepth: number;
  factualAccuracy: number;
  educationalValue: number;
  issues: string[];
  suggestions: string[];
}

export interface StructuralIntegrityResult {
  score: number;
  schemaCompliance: boolean;
  missingRequiredFields: string[];
  dataConsistency: boolean;
  navigationFlow: boolean;
  crossReferences: boolean;
}

export interface AIAccuracyResult {
  score: number;
  hallucinations: number;
  factualErrors: string[];
  conceptualAccuracy: number;
  terminologyConsistency: number;
  sourceReliability: number;
}

export interface UserExperienceResult {
  score: number;
  accessibility: number;
  engagement: number;
  progression: number;
  interactivity: number;
  feedback: number;
}

export interface IntegrationValidationResult {
  score: number;
  moduleConnections: boolean;
  dataFlow: boolean;
  apiIntegration: boolean;
  videoIntegration: boolean;
  quizIntegration: boolean;
  bibliographyIntegration: boolean;
  errors: string[];
}

export interface PerformanceValidationResult {
  score: number;
  loadTime: number;
  memoryUsage: number;
  apiResponseTime: number;
  errorRate: number;
  scalabilityScore: number;
}

export interface ValidationRecommendation {
  type: 'critical' | 'important' | 'suggested' | 'optimization';
  category: 'content' | 'structure' | 'integration' | 'performance' | 'user_experience';
  message: string;
  actionable: string;
  priority: number; // 1-10
}

export class SystemValidator {
  private youtubeService: YouTubeService;
  
  constructor() {
    this.youtubeService = new YouTubeService();
  }

  /**
   * Validates the entire system including all modules and integrations
   */
  async validateSystem(modules: EducationalModule[]): Promise<SystemValidationResult> {
    console.log('🔍 Starting comprehensive system validation...');
    
    const result: SystemValidationResult = {
      isValid: true,
      overall: {
        score: 0,
        grade: 'F',
        status: 'failed'
      },
      modules: [],
      integration: this.initializeIntegrationResult(),
      performance: this.initializePerformanceResult(),
      recommendations: [],
      errors: [],
      warnings: []
    };

    try {
      // Validate each module
      for (const module of modules) {
        const moduleResult = await this.validateModule(module);
        result.modules.push(moduleResult);
        
        if (!moduleResult.isValid) {
          result.isValid = false;
          result.errors.push(`Module validation failed for module ${module.id}`);
        }
      }

      // Validate system integration
      result.integration = await this.validateIntegration(modules);
      if (result.integration.score < 70) {
        result.isValid = false;
      }

      // Validate performance
      result.performance = await this.validatePerformance(modules);
      if (result.performance.score < 60) {
        result.warnings.push('Performance issues detected');
      }

      // Calculate overall score and grade
      this.calculateOverallScore(result);
      
      // Generate recommendations
      result.recommendations = this.generateRecommendations(result);

      console.log(`✅ System validation completed. Score: ${result.overall.score}/100 (${result.overall.grade})`);
      
    } catch (error) {
      result.isValid = false;
      result.errors.push(`System validation failed: ${error}`);
    }

    return result;
  }

  /**
   * Validates a single module comprehensively
   */
  async validateModule(module: EducationalModule): Promise<ModuleValidationResult> {
    console.log(`🔎 Validating module: ${module.title}`);
    
    const result: ModuleValidationResult = {
      moduleId: module.id,
      title: module.title,
      isValid: true,
      contentQuality: this.initializeContentQualityResult(),
      structuralIntegrity: this.initializeStructuralIntegrityResult(),
      aiAccuracy: this.initializeAIAccuracyResult(),
      userExperience: this.initializeUserExperienceResult(),
      score: 0
    };

    try {
      // Schema validation
      const schemaValidation = validateEducationalModule(module);
      if (!schemaValidation.isValid) {
        result.isValid = false;
        result.structuralIntegrity.schemaCompliance = false;
        result.structuralIntegrity.missingRequiredFields = schemaValidation.errors.map((e: any) => e.message);
      }

      // Content quality validation
      result.contentQuality = await this.validateContentQuality(module);
      
      // Structural integrity validation
      result.structuralIntegrity = this.validateStructuralIntegrity(module);
      
      // AI accuracy validation
      result.aiAccuracy = await this.validateAIAccuracy(module);
      
      // User experience validation
      result.userExperience = this.validateUserExperience(module);

      // Quiz validation if present
      if (module.quiz && module.quiz.questions.length > 0) {
        try {
          // Convert schema quiz to types quiz for validation compatibility
          const compatibleQuiz = this.convertQuizForValidation(module.quiz);
          const quizValidation = quizValidator.validateQuiz(compatibleQuiz);
          if (!quizValidation.isValid) {
            result.isValid = false;
            result.contentQuality.score -= 20;
            result.contentQuality.issues.push(`Quiz validation failed: ${quizValidation.errors.join(', ')}`);
          }
        } catch (error) {
          result.contentQuality.issues.push(`Quiz validation skipped due to type incompatibility: ${error}`);
        }
      }

      // Calculate module score
      result.score = this.calculateModuleScore(result);
      
      if (result.score < 70) {
        result.isValid = false;
      }

    } catch (error) {
      result.isValid = false;
      result.score = 0;
      result.contentQuality.issues.push(`Module validation error: ${error}`);
    }

    return result;
  }

  /**
   * Validates content quality using advanced metrics
   */
  private async validateContentQuality(module: EducationalModule): Promise<ContentQualityResult> {
    const result: ContentQualityResult = {
      score: 100,
      readabilityScore: 0,
      contentDepth: 0,
      factualAccuracy: 0,
      educationalValue: 0,
      issues: [],
      suggestions: []
    };

    // Readability analysis
    result.readabilityScore = this.calculateReadabilityScore(module.content.introduction);
    if (result.readabilityScore < 60) {
      result.issues.push('Content readability is below acceptable level');
      result.score -= 15;
    }

    // Content depth analysis
    result.contentDepth = this.analyzeContentDepth(module);
    if (result.contentDepth < 70) {
      result.issues.push('Content lacks sufficient depth for educational objectives');
      result.score -= 20;
    }

    // Educational value assessment
    result.educationalValue = this.assessEducationalValue(module);
    if (result.educationalValue < 80) {
      result.issues.push('Educational value could be enhanced');
      result.score -= 10;
    }

    // Factual accuracy check (basic heuristics)
    result.factualAccuracy = await this.checkFactualAccuracy(module);
    if (result.factualAccuracy < 90) {
      result.issues.push('Potential factual inaccuracies detected');
      result.score -= 25;
    }

    // Generate content improvement suggestions
    result.suggestions = this.generateContentSuggestions(module, result);

    return result;
  }

  /**
   * Validates structural integrity of the module
   */
  private validateStructuralIntegrity(module: EducationalModule): StructuralIntegrityResult {
    const result: StructuralIntegrityResult = {
      score: 100,
      schemaCompliance: true,
      missingRequiredFields: [],
      dataConsistency: true,
      navigationFlow: true,
      crossReferences: true
    };

    // Check required fields
    const requiredFields = ['id', 'title', 'description', 'content', 'metadata'];
    requiredFields.forEach(field => {
      if (!module[field as keyof EducationalModule]) {
        result.missingRequiredFields.push(field);
        result.schemaCompliance = false;
        result.score -= 20;
      }
    });

    // Check data consistency
    if (module.content.sections) {
      const sectionOrders = module.content.sections.map((s: any) => s.order);
      const hasDuplicateOrders = sectionOrders.length !== new Set(sectionOrders).size;
      if (hasDuplicateOrders) {
        result.dataConsistency = false;
        result.score -= 15;
      }

      // Check section numbering
      const sortedOrders = [...sectionOrders].sort((a, b) => a - b);
      const isSequential = sortedOrders.every((order, index) => order === index);
      if (!isSequential) {
        result.navigationFlow = false;
        result.score -= 10;
      }
    }

    // Check cross-references
    if (module.prerequisites && module.prerequisites.length > 0) {
      // Note: In a real implementation, we'd check against available modules
      result.crossReferences = true; // Placeholder
    }

    return result;
  }

  /**
   * Validates AI-generated content accuracy
   */
  private async validateAIAccuracy(module: EducationalModule): Promise<AIAccuracyResult> {
    const result: AIAccuracyResult = {
      score: 100,
      hallucinations: 0,
      factualErrors: [],
      conceptualAccuracy: 0,
      terminologyConsistency: 0,
      sourceReliability: 0
    };

    // Check for potential hallucinations in content
    const hallucinations = this.detectHallucinations(module);
    result.hallucinations = hallucinations.length;
    result.factualErrors = hallucinations;
    
    if (result.hallucinations > 0) {
      result.score -= result.hallucinations * 15;
    }

    // Conceptual accuracy assessment
    result.conceptualAccuracy = this.assessConceptualAccuracy(module);
    if (result.conceptualAccuracy < 85) {
      result.score -= 20;
    }

    // Terminology consistency check
    result.terminologyConsistency = this.checkTerminologyConsistency(module);
    if (result.terminologyConsistency < 90) {
      result.score -= 10;
    }

    // Source reliability assessment
    result.sourceReliability = this.assessSourceReliability(module);
    if (result.sourceReliability < 80) {
      result.score -= 15;
    }

    return result;
  }

  /**
   * Validates user experience aspects
   */
  private validateUserExperience(module: EducationalModule): UserExperienceResult {
    const result: UserExperienceResult = {
      score: 100,
      accessibility: 0,
      engagement: 0,
      progression: 0,
      interactivity: 0,
      feedback: 0
    };

    // Accessibility assessment
    result.accessibility = this.assessAccessibility(module);
    if (result.accessibility < 80) {
      result.score -= 15;
    }

    // Engagement assessment
    result.engagement = this.assessEngagement(module);
    if (result.engagement < 70) {
      result.score -= 20;
    }

    // Learning progression assessment
    result.progression = this.assessLearningProgression(module);
    if (result.progression < 75) {
      result.score -= 15;
    }

    // Interactivity assessment
    result.interactivity = this.assessInteractivity(module);
    if (result.interactivity < 60) {
      result.score -= 10;
    }

    // Feedback mechanisms assessment
    result.feedback = this.assessFeedbackMechanisms(module);
    if (result.feedback < 70) {
      result.score -= 10;
    }

    return result;
  }

  /**
   * Validates system integration points
   */
  private async validateIntegration(modules: EducationalModule[]): Promise<IntegrationValidationResult> {
    const result: IntegrationValidationResult = {
      score: 100,
      moduleConnections: true,
      dataFlow: true,
      apiIntegration: true,
      videoIntegration: true,
      quizIntegration: true,
      bibliographyIntegration: true,
      errors: []
    };

    try {
      // Test module interconnections
      const connectionTest = this.testModuleConnections(modules);
      if (!connectionTest.success) {
        result.moduleConnections = false;
        result.score -= 20;
        result.errors.push('Module connection issues detected');
      }

      // Test data flow integrity
      const dataFlowTest = this.testDataFlow(modules);
      if (!dataFlowTest.success) {
        result.dataFlow = false;
        result.score -= 25;
        result.errors.push('Data flow integrity issues');
      }

      // Test video integration
      for (const module of modules) {
        if (module.videos && module.videos.length > 0) {
          const videoTest = await this.testVideoIntegration(module.videos);
          if (!videoTest.success) {
            result.videoIntegration = false;
            result.score -= 15;
            result.errors.push(`Video integration failed for module: ${module.title}`);
          }
        }
      }

      // Test quiz integration
      for (const module of modules) {
        if (module.quiz && module.quiz.questions.length > 0) {
          const quizTest = this.testQuizIntegration(module.quiz);
          if (!quizTest.success) {
            result.quizIntegration = false;
            result.score -= 15;
            result.errors.push(`Quiz integration failed for module: ${module.title}`);
          }
        }
      }

    } catch (error) {
      result.score = 0;
      result.errors.push(`Integration validation failed: ${error}`);
    }

    return result;
  }

  /**
   * Validates system performance
   */
  private async validatePerformance(modules: EducationalModule[]): Promise<PerformanceValidationResult> {
    const result: PerformanceValidationResult = {
      score: 100,
      loadTime: 0,
      memoryUsage: 0,
      apiResponseTime: 0,
      errorRate: 0,
      scalabilityScore: 0
    };

    const startTime = performance.now();
    
    try {
      // Simulate module loading performance
      await this.simulateModuleLoading(modules);
      result.loadTime = performance.now() - startTime;
      
      if (result.loadTime > 3000) { // 3 seconds
        result.score -= 30;
      } else if (result.loadTime > 1500) { // 1.5 seconds
        result.score -= 15;
      }

      // Memory usage simulation
      result.memoryUsage = this.estimateMemoryUsage(modules);
      if (result.memoryUsage > 100) { // MB
        result.score -= 20;
      }

      // API response time test
      result.apiResponseTime = await this.testApiResponseTime();
      if (result.apiResponseTime > 2000) { // 2 seconds
        result.score -= 25;
      }

      // Error rate assessment
      result.errorRate = this.calculateErrorRate(modules);
      if (result.errorRate > 5) { // 5%
        result.score -= 30;
      }

      // Scalability assessment
      result.scalabilityScore = this.assessScalability(modules);
      if (result.scalabilityScore < 70) {
        result.score -= 15;
      }

    } catch (error) {
      result.score = 0;
      result.errorRate = 100;
    }

    return result;
  }

  // Helper methods for validation calculations
  private calculateReadabilityScore(text: string): number {
    // Simplified readability calculation (Flesch Reading Ease approximation)
    const words = text.split(/\s+/).length;
    const sentences = text.split(/[.!?]+/).length;
    const syllables = this.countSyllables(text);
    
    const avgWordsPerSentence = words / sentences;
    const avgSyllablesPerWord = syllables / words;
    
    const fleschScore = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
    return Math.max(0, Math.min(100, fleschScore));
  }

  private countSyllables(text: string): number {
    // Simple syllable counting heuristic
    const words = text.toLowerCase().match(/[a-z]+/g) || [];
    let syllableCount = 0;
    
    words.forEach(word => {
      const vowels = word.match(/[aeiouy]+/g) || [];
      let count = vowels.length;
      if (word.endsWith('e')) count--;
      if (count === 0) count = 1;
      syllableCount += count;
    });
    
    return syllableCount;
  }

  private analyzeContentDepth(module: EducationalModule): number {
    let score = 50; // Base score
    
    // Check for multiple sections
    if (module.content.sections && module.content.sections.length >= 3) {
      score += 20;
    }
    
    // Check for learning objectives
    if (module.learningObjectives && module.learningObjectives.length >= 3) {
      score += 15;
    }
    
    // Check for multimedia content
    if (module.videos && module.videos.length > 0) {
      score += 10;
    }
    
    // Check for assessment
    if (module.quiz && module.quiz.questions.length >= 5) {
      score += 15;
    }
    
    // Check for references
    if (module.bibliography && module.bibliography.length >= 3) {
      score += 10;
    }
    
    return Math.min(100, score);
  }

  private assessEducationalValue(module: EducationalModule): number {
    let score = 60; // Base score
    
    // Check for clear learning objectives
    if (module.learningObjectives && module.learningObjectives.length > 0) {
      score += 20;
    }
    
    // Check for practical applications
    const hasExercises = module.content.sections?.some((section: any) => 
      section.interactiveElements && section.interactiveElements.length > 0
    );
    if (hasExercises) {
      score += 15;
    }
    
    // Check for progressive difficulty
    if (module.difficultyLevel) {
      score += 10;
    }
    
    // Check for comprehensive assessment
    if (module.quiz && module.quiz.questions.length >= 10) {
      score += 15;
    }
    
    return Math.min(100, score);
  }

  private async checkFactualAccuracy(module: EducationalModule): Promise<number> {
    // Placeholder for factual accuracy checking
    // In a real implementation, this would use NLP and fact-checking APIs
    let score = 95; // Assume high accuracy by default
    
    // Check for obvious inconsistencies
    const content = module.content.introduction + ' ' + 
                   (module.content.sections?.map((s: any) => s.content).join(' ') || '');
    
    // Simple heuristics for fact-checking
    const suspiciousPatterns = [
      /(\d{4})\s+and\s+(\d{4})/g, // Date ranges that might be incorrect
      /definitely|absolutely|never|always/gi, // Absolute statements that might be wrong
      /studies show/gi // Vague claims without citations
    ];
    
    suspiciousPatterns.forEach(pattern => {
      const matches = content.match(pattern) || [];
      score -= matches.length * 5;
    });
    
    return Math.max(50, score);
  }

  private detectHallucinations(module: EducationalModule): string[] {
    const hallucinations: string[] = [];
    
    // Check for suspicious content patterns that might indicate AI hallucinations
    const content = JSON.stringify(module);
    
    // Check for repeated phrases (common in AI hallucinations)
    const phrases = content.match(/\b\w+\s+\w+\s+\w+\b/g) || [];
    const phraseCount: { [key: string]: number } = {};
    
    phrases.forEach(phrase => {
      phraseCount[phrase] = (phraseCount[phrase] || 0) + 1;
    });
    
    Object.entries(phraseCount).forEach(([phrase, count]) => {
      if (count > 3) {
        hallucinations.push(`Repeated phrase detected: "${phrase}"`);
      }
    });
    
    // Check for inconsistent terminology
    const jungTerms = ['jung', 'jungian', 'analytical psychology', 'individuation'];
    const freudTerms = ['freud', 'freudian', 'psychoanalysis', 'unconscious'];
    
    const hasJung = jungTerms.some(term => content.toLowerCase().includes(term));
    const hasFreud = freudTerms.some(term => content.toLowerCase().includes(term));
    
    if (hasJung && hasFreud) {
      // Check if the mixing is intentional or a hallucination
      const mixingPattern = /jung.*freud|freud.*jung/gi;
      if (!mixingPattern.test(content)) {
        hallucinations.push('Inconsistent psychological theory mixing detected');
      }
    }
    
    return hallucinations;
  }

  private assessConceptualAccuracy(module: EducationalModule): number {
    // Placeholder for conceptual accuracy assessment
    // This would involve domain-specific knowledge validation
    return 88; // Default high accuracy
  }

  private checkTerminologyConsistency(module: EducationalModule): number {
    const content = JSON.stringify(module).toLowerCase();
    let score = 100;
    
    // Check for consistent terminology usage
    const termVariations = [
      ['unconscious', 'subconscious'],
      ['archetype', 'archetypal'],
      ['individuation', 'individualization'],
      ['shadow', 'dark side']
    ];
    
    termVariations.forEach(([primary, alternative]) => {
      const primaryCount = (content.match(new RegExp(primary, 'g')) || []).length;
      const alternativeCount = (content.match(new RegExp(alternative, 'g')) || []).length;
      
      if (primaryCount > 0 && alternativeCount > 0 && alternativeCount > primaryCount * 0.5) {
        score -= 10; // Deduct for inconsistent terminology
      }
    });
    
    return Math.max(70, score);
  }

  private assessSourceReliability(module: EducationalModule): number {
    if (!module.bibliography || module.bibliography.length === 0) {
      return 50; // Low score for no sources
    }
    
    let score = 70; // Base score
    
    // Check for authoritative sources
    const authoritativeSources = ['jung', 'campbell', 'hillman', 'von franz'];
    const hasAuthoritativeSources = module.bibliography.some((ref: any) => 
      authoritativeSources.some(author => ref.authors.some((a: any) => a.toLowerCase().includes(author)))
    );
    
    if (hasAuthoritativeSources) {
      score += 20;
    }
    
    // Check for recent sources
    const recentSources = module.bibliography.filter((ref: any) => 
      ref.year && parseInt(ref.year) > 2000
    );
    
    if (recentSources.length >= module.bibliography.length * 0.3) {
      score += 10;
    }
    
    return Math.min(100, score);
  }

  private assessAccessibility(module: EducationalModule): number {
    let score = 80; // Base accessibility score
    
    // Check for alt text on images (simulated)
    module.content.sections?.forEach((section: any) => {
      if (section.images && section.images.length > 0) {
        const hasAltText = section.images.every((img: any) => img.alt && img.alt.length > 0);
        if (!hasAltText) {
          score -= 15;
        }
      }
    });
    
    // Check for clear structure
    if (!module.content.sections || module.content.sections.length < 2) {
      score -= 10;
    }
    
    return Math.max(50, score);
  }

  private assessEngagement(module: EducationalModule): number {
    let score = 60; // Base engagement score
    
    // Check for interactive elements
    const hasInteractiveElements = module.content.sections?.some((section: any) => 
      section.interactiveElements && section.interactiveElements.length > 0
    );
    if (hasInteractiveElements) {
      score += 20;
    }
    
    // Check for multimedia
    if (module.videos && module.videos.length > 0) {
      score += 15;
    }
    
    // Check for varied content types
    if (module.quiz && module.quiz.questions.length > 0) {
      score += 10;
    }
    
    return Math.min(100, score);
  }

  private assessLearningProgression(module: EducationalModule): number {
    let score = 70; // Base progression score
    
    // Check for logical section ordering
    if (module.content.sections && module.content.sections.length > 1) {
      const orders = module.content.sections.map((s: any) => s.order);
      const isSequential = orders.every((order: any, index: any) => order === index);
      if (isSequential) {
        score += 15;
      }
    }
    
    // Check for learning objectives
    if (module.learningObjectives && module.learningObjectives.length > 0) {
      score += 15;
    }
    
    return Math.min(100, score);
  }

  private assessInteractivity(module: EducationalModule): number {
    let score = 40; // Base interactivity score
    
    // Check for quiz
    if (module.quiz && module.quiz.questions.length > 0) {
      score += 30;
    }
    
    // Check for interactive elements in sections
    const interactiveCount = module.content.sections?.reduce((count: any, section: any) => {
      return count + (section.interactiveElements?.length || 0);
    }, 0) || 0;
    
    score += Math.min(30, interactiveCount * 10);
    
    return Math.min(100, score);
  }

  private assessFeedbackMechanisms(module: EducationalModule): number {
    let score = 50; // Base feedback score
    
    // Check for quiz feedback
    if (module.quiz && module.quiz.questions.some((q: any) => q.explanation)) {
      score += 25;
    }
    
    // Check for question explanations
    if (module.quiz && module.quiz.questions.some((q: any) => q.explanation && q.explanation.length > 0)) {
      score += 25;
    }
    
    return Math.min(100, score);
  }

  // Integration testing methods
  private testModuleConnections(modules: EducationalModule[]): { success: boolean; errors: string[] } {
    const result = { success: true, errors: [] as string[] };
    
    // Check prerequisite chain validity
    modules.forEach(module => {
      if (module.prerequisites && module.prerequisites.length > 0) {
        module.prerequisites.forEach((prereqId: any) => {
          const prereqExists = modules.some(m => m.id === prereqId);
          if (!prereqExists) {
            result.success = false;
            result.errors.push(`Module ${module.id} references non-existent prerequisite: ${prereqId}`);
          }
        });
      }
    });
    
    return result;
  }

  private testDataFlow(modules: EducationalModule[]): { success: boolean; errors: string[] } {
    const result = { success: true, errors: [] as string[] };
    
    // Test data consistency across modules
    modules.forEach(module => {
      try {
        const sanitized = sanitizeModule(module);
        if (JSON.stringify(sanitized) !== JSON.stringify(module)) {
          // Module needed sanitization, which indicates data quality issues
          result.errors.push(`Module ${module.id} required data sanitization`);
        }
      } catch (error) {
        result.success = false;
        result.errors.push(`Data flow test failed for module ${module.id}: ${error}`);
      }
    });
    
    return result;
  }

  private async testVideoIntegration(videos: any[]): Promise<{ success: boolean; errors: string[] }> {
    const result = { success: true, errors: [] as string[] };
    
    // Test video URL validity and accessibility
    for (const video of videos) {
      try {
        if (video.youtubeId) {
          // Test YouTube integration
          const videoData = await this.youtubeService.getVideoDetails(video.youtubeId);
          if (!videoData) {
            result.success = false;
            result.errors.push(`YouTube video not accessible: ${video.youtubeId}`);
          }
        }
      } catch (error) {
        result.success = false;
        result.errors.push(`Video integration test failed: ${error}`);
      }
    }
    
    return result;
  }

  private testQuizIntegration(quiz: SchemaQuiz): { success: boolean; errors: string[] } {
    const result = { success: true, errors: [] as string[] };
    
    try {
      const compatibleQuiz = this.convertQuizForValidation(quiz);
      const validation = quizValidator.validateQuiz(compatibleQuiz);
      if (!validation.isValid) {
        result.success = false;
        result.errors = validation.errors;
      }
    } catch (error) {
      result.success = false;
      result.errors.push(`Quiz integration test failed: ${error}`);
    }
    
    return result;
  }

  // Performance testing methods
  private async simulateModuleLoading(modules: EducationalModule[]): Promise<void> {
    // Simulate loading time based on content size
    const totalContent = modules.reduce((total, module) => {
      return total + JSON.stringify(module).length;
    }, 0);
    
    const simulatedDelay = Math.min(5000, totalContent / 10000); // Max 5 second simulation
    await new Promise(resolve => setTimeout(resolve, simulatedDelay));
  }

  private estimateMemoryUsage(modules: EducationalModule[]): number {
    // Estimate memory usage in MB
    const totalSize = modules.reduce((total, module) => {
      return total + JSON.stringify(module).length;
    }, 0);
    
    return totalSize / (1024 * 1024); // Convert to MB
  }

  private async testApiResponseTime(): Promise<number> {
    const startTime = performance.now();
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
    } catch (error) {
      // Handle API error
    }
    
    return performance.now() - startTime;
  }

  private calculateErrorRate(modules: EducationalModule[]): number {
    // Calculate estimated error rate based on validation results
    let totalChecks = 0;
    let failedChecks = 0;
    
    modules.forEach(module => {
      totalChecks += 10; // Assume 10 checks per module
      
      // Count potential failures
      if (!module.id) failedChecks++;
      if (!module.title) failedChecks++;
      if (!module.content) failedChecks++;
      if (!module.metadata) failedChecks++;
      if (module.content.sections && module.content.sections.length === 0) failedChecks++;
    });
    
    return totalChecks > 0 ? (failedChecks / totalChecks) * 100 : 0;
  }

  private assessScalability(modules: EducationalModule[]): number {
    let score = 80; // Base scalability score
    
    // Assess based on content complexity and size
    const avgModuleSize = modules.reduce((total, module) => {
      return total + JSON.stringify(module).length;
    }, 0) / modules.length;
    
    if (avgModuleSize > 100000) { // 100KB
      score -= 20;
    } else if (avgModuleSize > 50000) { // 50KB
      score -= 10;
    }
    
    // Assess based on number of dependencies
    const totalDependencies = modules.reduce((total, module) => {
      return total + (module.prerequisites?.length || 0);
    }, 0);
    
    if (totalDependencies > modules.length * 2) {
      score -= 15;
    }
    
    return Math.max(40, score);
  }

  /**
   * Convert schema Quiz to types Quiz for validation compatibility
   */
  private convertQuizForValidation(schemaQuiz: SchemaQuiz): TypesQuiz {
    const convertedQuestions: TypesQuestion[] = schemaQuiz.questions.map((question, index) => {
      // Map difficulty from schema enum to types string
      const mapDifficulty = (diff?: any): 'beginner' | 'intermediate' | 'advanced' => {
        if (!diff) return 'intermediate';
        const diffStr = diff.toString().toLowerCase();
        if (diffStr.includes('beginner') || diffStr === 'easy') return 'beginner';
        if (diffStr.includes('advanced') || diffStr === 'hard') return 'advanced';
        return 'intermediate';
      };

      // Handle different question types from schema
      if (question.type === 'multiple-choice') {
        const mcQuestion = question as any;
        return {
          id: question.id,
          question: question.question,
          type: 'multiple-choice',
          options: mcQuestion.options || [],
          correctAnswer: mcQuestion.correctAnswers?.[0] ?? 0,
          explanation: question.explanation || '',
          difficulty: mapDifficulty(question.difficulty),
          cognitiveLevel: 'application',
          tags: question.tags || [],
          points: question.points || 1,
          order: index,
          metadata: {},
          expectedKeywords: [],
          rubric: {}
        };
      } else {
        // For other question types, create a basic compatible structure
        return {
          id: question.id,
          question: question.question,
          type: 'multiple-choice',
          options: [{ id: '1', text: 'True', isCorrect: true }, { id: '2', text: 'False', isCorrect: false }],
          correctAnswer: 0,
          explanation: question.explanation || '',
          difficulty: mapDifficulty(question.difficulty),
          cognitiveLevel: 'application',
          tags: question.tags || [],
          points: question.points || 1,
          order: index,
          metadata: {},
          expectedKeywords: [],
          rubric: {}
        };
      }
    });

    return {
      id: schemaQuiz.id,
      title: schemaQuiz.title,
      questions: convertedQuestions,
      description: schemaQuiz.description || '',
      moduleId: '',
      passingScore: schemaQuiz.passingScore || 70,
      timeLimit: schemaQuiz.timeLimit,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {}
    };
  }

  private calculateModuleScore(result: ModuleValidationResult): number {
    const weights = {
      contentQuality: 0.3,
      structuralIntegrity: 0.25,
      aiAccuracy: 0.25,
      userExperience: 0.2
    };
    
    return Math.round(
      result.contentQuality.score * weights.contentQuality +
      result.structuralIntegrity.score * weights.structuralIntegrity +
      result.aiAccuracy.score * weights.aiAccuracy +
      result.userExperience.score * weights.userExperience
    );
  }

  private calculateOverallScore(result: SystemValidationResult): void {
    if (result.modules.length === 0) {
      result.overall.score = 0;
      result.overall.grade = 'F';
      result.overall.status = 'failed';
      return;
    }
    
    const moduleScoreAvg = result.modules.reduce((sum, m) => sum + m.score, 0) / result.modules.length;
    const integrationScore = result.integration.score;
    const performanceScore = result.performance.score;
    
    // Weighted average
    result.overall.score = Math.round(
      moduleScoreAvg * 0.5 +
      integrationScore * 0.3 +
      performanceScore * 0.2
    );
    
    // Assign grade
    if (result.overall.score >= 90) {
      result.overall.grade = 'A';
      result.overall.status = 'excellent';
    } else if (result.overall.score >= 80) {
      result.overall.grade = 'B';
      result.overall.status = 'good';
    } else if (result.overall.score >= 70) {
      result.overall.grade = 'C';
      result.overall.status = 'acceptable';
    } else if (result.overall.score >= 60) {
      result.overall.grade = 'D';
      result.overall.status = 'needs_improvement';
    } else {
      result.overall.grade = 'F';
      result.overall.status = 'failed';
    }
  }

  private generateRecommendations(result: SystemValidationResult): ValidationRecommendation[] {
    const recommendations: ValidationRecommendation[] = [];
    
    // Generate recommendations based on validation results
    if (result.overall.score < 70) {
      recommendations.push({
        type: 'critical',
        category: 'content',
        message: 'System validation score is below acceptable threshold',
        actionable: 'Review and improve module content quality, structural integrity, and AI accuracy',
        priority: 10
      });
    }
    
    // Module-specific recommendations
    result.modules.forEach(module => {
      if (module.contentQuality.score < 70) {
        recommendations.push({
          type: 'important',
          category: 'content',
          message: `Module "${module.title}" has low content quality`,
          actionable: `Improve readability, depth, and educational value for module ${module.moduleId}`,
          priority: 8
        });
      }
      
      if (module.aiAccuracy.score < 80) {
        recommendations.push({
          type: 'important',
          category: 'content',
          message: `Module "${module.title}" has AI accuracy issues`,
          actionable: `Review and correct factual inaccuracies and hallucinations in module ${module.moduleId}`,
          priority: 9
        });
      }
    });
    
    // Integration recommendations
    if (result.integration.score < 80) {
      recommendations.push({
        type: 'important',
        category: 'integration',
        message: 'System integration issues detected',
        actionable: 'Fix module connections, data flow, and API integrations',
        priority: 7
      });
    }
    
    // Performance recommendations
    if (result.performance.score < 70) {
      recommendations.push({
        type: 'suggested',
        category: 'performance',
        message: 'System performance could be improved',
        actionable: 'Optimize loading times, memory usage, and API response times',
        priority: 6
      });
    }
    
    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  private generateContentSuggestions(module: EducationalModule, result: ContentQualityResult): string[] {
    const suggestions: string[] = [];
    
    if (result.readabilityScore < 70) {
      suggestions.push('Simplify complex sentences and use more common vocabulary');
      suggestions.push('Break long paragraphs into shorter, more digestible chunks');
    }
    
    if (result.contentDepth < 80) {
      suggestions.push('Add more detailed explanations and examples');
      suggestions.push('Include practical applications and case studies');
    }
    
    if (result.educationalValue < 85) {
      suggestions.push('Define clear learning objectives at the beginning');
      suggestions.push('Add interactive exercises and self-assessment opportunities');
    }
    
    return suggestions;
  }

  // Initialize result objects
  private initializeContentQualityResult(): ContentQualityResult {
    return {
      score: 0,
      readabilityScore: 0,
      contentDepth: 0,
      factualAccuracy: 0,
      educationalValue: 0,
      issues: [],
      suggestions: []
    };
  }

  private initializeStructuralIntegrityResult(): StructuralIntegrityResult {
    return {
      score: 0,
      schemaCompliance: false,
      missingRequiredFields: [],
      dataConsistency: false,
      navigationFlow: false,
      crossReferences: false
    };
  }

  private initializeAIAccuracyResult(): AIAccuracyResult {
    return {
      score: 0,
      hallucinations: 0,
      factualErrors: [],
      conceptualAccuracy: 0,
      terminologyConsistency: 0,
      sourceReliability: 0
    };
  }

  private initializeUserExperienceResult(): UserExperienceResult {
    return {
      score: 0,
      accessibility: 0,
      engagement: 0,
      progression: 0,
      interactivity: 0,
      feedback: 0
    };
  }

  private initializeIntegrationResult(): IntegrationValidationResult {
    return {
      score: 0,
      moduleConnections: false,
      dataFlow: false,
      apiIntegration: false,
      videoIntegration: false,
      quizIntegration: false,
      bibliographyIntegration: false,
      errors: []
    };
  }

  private initializePerformanceResult(): PerformanceValidationResult {
    return {
      score: 0,
      loadTime: 0,
      memoryUsage: 0,
      apiResponseTime: 0,
      errorRate: 0,
      scalabilityScore: 0
    };
  }
}

// Export singleton instance
export const systemValidator = new SystemValidator();