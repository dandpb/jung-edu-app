/**
 * Automatic Quiz Orchestrator
 * Coordinates the full automatic quiz generation process from content analysis to final quiz
 */

import { ILLMProvider } from '../llm/provider';
import { EnhancedQuizGenerator, EnhancedQuizOptions } from './enhancedQuizGenerator';
import { contentAnalyzer } from './contentAnalyzer';
import { quizValidator } from './quizValidator';
import { Quiz, Question } from '../../types';

export interface AutoQuizGenerationOptions {
  questionCount: number;
  targetDifficulty: 'beginner' | 'intermediate' | 'advanced';
  includeEssayQuestions: boolean;
  adaptiveDifficulty: boolean;
  qualityThreshold: number; // 0-100
  maxRetries: number;
  language: 'pt-BR' | 'en';
  cognitiveDistribution?: {
    recall: number;
    understanding: number;
    application: number;
    analysis: number;
  };
}

export interface QuizGenerationResult {
  quiz: Quiz;
  analytics: {
    contentAnalysis: any;
    generationAttempts: number;
    finalQualityScore: number;
    improvementSuggestions: string[];
    timeTaken: number;
  };
}

export class AutomaticQuizOrchestrator {
  private enhancedGenerator: EnhancedQuizGenerator;

  constructor(provider: ILLMProvider) {
    this.enhancedGenerator = new EnhancedQuizGenerator(provider);
  }

  /**
   * Main orchestration method for automatic quiz generation
   */
  async generateAutomaticQuiz(
    moduleId: string,
    topic: string,
    content: string,
    learningObjectives: string[],
    options: AutoQuizGenerationOptions
  ): Promise<QuizGenerationResult> {
    const startTime = Date.now();
    let generationAttempts = 0;
    let bestQuiz: Quiz | null = null;
    let bestScore = 0;

    // Step 1: Analyze content to extract key concepts and structure
    console.log('🔍 Analyzing content for quiz generation...');
    let contentAnalysis;
    try {
      contentAnalysis = await contentAnalyzer.analyzeContent(content, topic, options.language);
    } catch (error) {
      console.warn('Content analysis failed, using default:', error);
      // Use default content analysis if it fails
      contentAnalysis = {
        keyConcepts: ['concept1', 'concept2', 'concept3'],
        difficulty: options.targetDifficulty,
        cognitivelevels: ['understanding', 'application'],
        learningObjectives: learningObjectives,
        conceptRelationships: [],
        potentialQuestionAreas: [],
        contentStructure: { mainTopics: [], subtopics: [], examples: [], definitions: [] },
        assessmentSuggestions: { 
          recommendedQuestionCount: options.questionCount,
          difficultyDistribution: { easy: 0.3, medium: 0.5, hard: 0.2 },
          questionTypeDistribution: { 'multiple-choice': 0.8, 'essay': 0.2 }
        }
      };
    }

    // Step 2: Generate quiz with multiple attempts for quality
    for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
      generationAttempts = attempt;
      console.log(`🎯 Generation attempt ${attempt}/${options.maxRetries}...`);

      try {
        // Create enhanced quiz options based on content analysis
        const enhancedOptions: EnhancedQuizOptions = this.createEnhancedOptions(
          options,
          contentAnalysis
        );

        // Generate the quiz
        const quiz = await this.enhancedGenerator.generateEnhancedQuiz(
          moduleId,
          topic,
          content,
          learningObjectives,
          options.questionCount,
          enhancedOptions
        );

        // Validate and score the quiz
        const validationResult = quizValidator.validateQuiz(quiz);
        console.log(`📊 Quiz quality score: ${validationResult.score}%`);

        // Check if this is the best quiz so far
        if (validationResult.score > bestScore) {
          bestQuiz = quiz;
          bestScore = validationResult.score;
        }

        // If quality threshold is met, use this quiz
        if (validationResult.score >= options.qualityThreshold) {
          console.log('✅ Quality threshold met, using this quiz');
          break;
        }

        // If not the last attempt, log issues and continue
        if (attempt < options.maxRetries) {
          console.log('⚠️ Quality below threshold, retrying with improvements...');
          console.log('Issues found:', validationResult.errors.slice(0, 3));
        }

      } catch (error) {
        console.error(`❌ Error in generation attempt ${attempt}:`, error);
        
        // If all attempts failed and we have no quiz, create a fallback
        if (attempt === options.maxRetries && !bestQuiz) {
          console.log('🚨 Creating fallback quiz...');
          bestQuiz = await this.createFallbackQuiz(moduleId, topic, learningObjectives, options);
          bestScore = 50; // Basic fallback score
        }
      }
    }

    if (!bestQuiz) {
      throw new Error('Failed to generate quiz after all attempts');
    }

    // Step 3: Final validation and improvement
    const finalValidation = quizValidator.validateQuiz(bestQuiz) || {
      score: bestScore,
      suggestions: [],
      errors: [],
      warnings: []
    };
    
    const timeTaken = Date.now() - startTime;

    return {
      quiz: bestQuiz,
      analytics: {
        contentAnalysis: contentAnalysis || null, // Ensure it's at least null, not undefined
        generationAttempts,
        finalQualityScore: finalValidation.score || bestScore,
        improvementSuggestions: finalValidation.suggestions || [],
        timeTaken
      }
    };
  }

  /**
   * Create enhanced options based on content analysis
   */
  private createEnhancedOptions(
    options: AutoQuizGenerationOptions,
    contentAnalysis: any
  ): EnhancedQuizOptions {
    return {
      useTemplates: true,
      enhanceQuestions: true,
      adaptiveDifficulty: options.adaptiveDifficulty,
      includeEssayQuestions: options.includeEssayQuestions,
      contextualizeQuestions: true,
      userLevel: options.targetDifficulty
    };
  }

  /**
   * Create a fallback quiz when generation fails
   */
  private async createFallbackQuiz(
    moduleId: string,
    topic: string,
    objectives: string[],
    options: AutoQuizGenerationOptions
  ): Promise<Quiz> {
    console.log('🔄 Creating fallback quiz with basic questions...');

    const fallbackQuestions: Question[] = [];
    const questionTemplates = [
      {
        stem: `O que caracteriza o conceito de ${topic} na psicologia junguiana?`,
        correctOption: 'Um conceito fundamental da teoria analítica',
        distractors: [
          'Uma teoria secundária não essencial',
          'Aplicável apenas em casos específicos',
          'Uma crítica às teorias freudianas'
        ],
        explanation: `${topic} é um conceito central na psicologia analítica de Jung, fundamental para compreender a estrutura e dinâmica da psique humana.`,
        cognitiveLevel: 'understanding'
      },
      {
        stem: `Como ${topic} se relaciona com outros conceitos junguianos?`,
        correctOption: 'Está interconectado com outros aspectos da psique',
        distractors: [
          'Funciona de forma completamente independente',
          'Contradiz outros conceitos junguianos',
          'É irrelevante para a prática terapêutica'
        ],
        explanation: `Na teoria junguiana, todos os conceitos estão interconectados, formando um sistema coerente de compreensão da psique humana.`,
        cognitiveLevel: 'analysis'
      },
      {
        stem: `Qual é a importância de ${topic} no processo de individuação?`,
        correctOption: 'Facilita a integração de aspectos inconscientes',
        distractors: [
          'Impede o desenvolvimento psicológico',
          'É irrelevante para o processo',
          'Substitui completamente o ego consciente'
        ],
        explanation: `${topic} desempenha um papel crucial no processo de individuação, ajudando na integração de conteúdos inconscientes.`,
        cognitiveLevel: 'application'
      },
      {
        stem: `Como ${topic} se manifesta na prática clínica junguiana?`,
        correctOption: 'Através de símbolos e imagens nos sonhos e fantasias',
        distractors: [
          'Apenas em comportamentos observáveis',
          'Exclusivamente em testes psicométricos',
          'Somente através de análise textual'
        ],
        explanation: `Na prática clínica junguiana, ${topic} frequentemente se manifesta através de material simbólico.`,
        cognitiveLevel: 'understanding'
      },
      {
        stem: `Qual é a diferença entre ${topic} e conceitos similares em outras escolas psicológicas?`,
        correctOption: 'Enfatiza aspectos coletivos e arquetípicos',
        distractors: [
          'É idêntico aos conceitos freudianos',
          'Nega completamente o inconsciente',
          'Foca apenas em aspectos comportamentais'
        ],
        explanation: `A abordagem junguiana de ${topic} é única em sua ênfase nos aspectos coletivos e arquetípicos da psique.`,
        cognitiveLevel: 'analysis'
      }
    ];

    // Generate the requested number of questions
    for (let i = 0; i < options.questionCount; i++) {
      const template = questionTemplates[i % questionTemplates.length];
      const difficulty = i < options.questionCount / 3 ? 'easy' : 
                       i < (options.questionCount * 2) / 3 ? 'medium' : 'hard';
      
      fallbackQuestions.push({
        id: `fallback-${i + 1}`,
        type: 'multiple-choice',
        question: template.stem,
        options: [
          { id: `opt-1`, text: template.correctOption, isCorrect: true },
          { id: `opt-2`, text: template.distractors[0], isCorrect: false },
          { id: `opt-3`, text: template.distractors[1], isCorrect: false },
          { id: `opt-4`, text: template.distractors[2], isCorrect: false }
        ],
        correctAnswer: 0,
        explanation: template.explanation,
        points: difficulty === 'hard' ? 15 : difficulty === 'medium' ? 10 : 5,
        order: i,
        metadata: {
          difficulty,
          cognitiveLevel: template.cognitiveLevel,
          fallback: true
        }
      });
    }

    return {
      id: `quiz-${moduleId}`,
      moduleId,
      title: `${topic} - Questionário de Avaliação`,
      description: `Avaliação básica sobre ${topic} na psicologia junguiana`,
      questions: fallbackQuestions,
      passingScore: 70,
      timeLimit: 15,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        fallback: true,
        generatedAt: new Date(),
        difficulty: options.targetDifficulty,
        topic,
        componentsIncluded: ['fallback-questions']
      }
    };
  }

  /**
   * Generate quiz variations for A/B testing
   */
  async generateQuizVariations(
    moduleId: string,
    topic: string,
    content: string,
    objectives: string[],
    baseOptions: AutoQuizGenerationOptions,
    variationCount: number = 3
  ): Promise<QuizGenerationResult[]> {
    console.log(`🔄 Generating ${variationCount} quiz variations...`);

    const variations: Promise<QuizGenerationResult>[] = [];

    for (let i = 0; i < variationCount; i++) {
      // Create slight variations in options
      const variationOptions: AutoQuizGenerationOptions = {
        ...baseOptions,
        // Vary some parameters for different approaches
        targetDifficulty: i === 0 ? baseOptions.targetDifficulty : 
                         i === 1 ? 'intermediate' : 'advanced',
        includeEssayQuestions: i % 2 === 0 ? baseOptions.includeEssayQuestions : !baseOptions.includeEssayQuestions,
        cognitiveDistribution: this.getVariationCognitiveDistribution(i)
      };

      variations.push(
        this.generateAutomaticQuiz(
          `${moduleId}-var${i + 1}`,
          topic,
          content,
          objectives,
          variationOptions
        )
      );
    }

    return Promise.all(variations);
  }

  /**
   * Get different cognitive distributions for variations
   */
  private getVariationCognitiveDistribution(index: number) {
    const distributions = [
      { recall: 0.2, understanding: 0.4, application: 0.3, analysis: 0.1 }, // Balanced
      { recall: 0.1, understanding: 0.3, application: 0.4, analysis: 0.2 }, // Application-focused
      { recall: 0.1, understanding: 0.2, application: 0.3, analysis: 0.4 }  // Analysis-heavy
    ];
    
    return distributions[index] || distributions[0];
  }

  /**
   * Analyze quiz performance and suggest improvements
   */
  async analyzeQuizPerformance(
    quiz: Quiz,
    userResponses: Array<{ questionId: string; correct: boolean; timeTaken: number }>
  ): Promise<{
    overallPerformance: number;
    weakAreas: string[];
    recommendations: string[];
    nextSteps: string[];
  }> {
    const correctAnswers = userResponses.filter(r => r.correct).length;
    const overallPerformance = (correctAnswers / userResponses.length) * 100;

    // Identify weak areas based on incorrect answers
    const incorrectQuestions = userResponses
      .filter(r => !r.correct)
      .map(r => quiz.questions.find(q => q.id === r.questionId))
      .filter(Boolean);

    const weakAreas = this.extractWeakAreas(incorrectQuestions);
    const recommendations = this.generateRecommendations(overallPerformance, weakAreas);
    const nextSteps = this.generateNextSteps(overallPerformance, weakAreas);

    return {
      overallPerformance,
      weakAreas,
      recommendations,
      nextSteps
    };
  }

  private extractWeakAreas(incorrectQuestions: (Question | undefined)[]): string[] {
    const areas = new Set<string>();
    
    incorrectQuestions.forEach(q => {
      if (q?.metadata?.difficulty) {
        areas.add(`${q.metadata.difficulty} level questions`);
      }
      if (q?.metadata?.cognitiveLevel) {
        areas.add(`${q.metadata.cognitiveLevel} cognitive level`);
      }
    });

    return Array.from(areas);
  }

  private generateRecommendations(performance: number, weakAreas: string[]): string[] {
    const recommendations: string[] = [];

    if (performance < 50) {
      recommendations.push('Review fundamental concepts before retaking');
      recommendations.push('Focus on understanding core Jungian principles');
    } else if (performance < 70) {
      recommendations.push('Practice application of concepts in different contexts');
      recommendations.push('Review specific weak areas identified');
    } else if (performance < 85) {
      recommendations.push('Work on analytical and synthesis questions');
      recommendations.push('Explore advanced applications of concepts');
    }

    weakAreas.forEach(area => {
      recommendations.push(`Strengthen understanding in: ${area}`);
    });

    return recommendations;
  }

  private generateNextSteps(performance: number, weakAreas: string[]): string[] {
    const nextSteps: string[] = [];

    if (performance >= 85) {
      nextSteps.push('Progress to the next module');
      nextSteps.push('Explore advanced topics in this area');
    } else if (performance >= 70) {
      nextSteps.push('Review weak areas and retake quiz');
      nextSteps.push('Practice with additional exercises');
    } else {
      nextSteps.push('Review module content thoroughly');
      nextSteps.push('Complete practice questions');
      nextSteps.push('Retake quiz after review');
    }

    return nextSteps;
  }
}