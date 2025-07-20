/**
 * Adaptive Quiz Engine
 * Dynamically adjusts quiz difficulty and content based on user performance
 */

import { Quiz, Question } from '../../types';
import { QuizGenerator } from '../llm/generators/quiz-generator';
import { ILLMProvider } from '../llm/provider';

export interface UserPerformanceProfile {
  userId: string;
  overallScore: number;
  strengthAreas: string[];
  weaknessAreas: string[];
  preferredDifficulty: 'easy' | 'medium' | 'hard';
  cognitiveProfile: {
    recall: number;
    understanding: number;
    application: number;
    analysis: number;
  };
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
  responseHistory: Array<{
    questionId: string;
    correct: boolean;
    timeTaken: number;
    difficulty: string;
    cognitiveLevel: string;
    date: Date;
  }>;
}

export interface AdaptiveQuizOptions {
  initialDifficulty: 'easy' | 'medium' | 'hard';
  adaptationStrategy: 'performance' | 'time' | 'combined';
  maxQuestions: number;
  minQuestions: number;
  targetAccuracy: number; // 0-1
  confidenceThreshold: number; // 0-1
  includeRemediation: boolean;
}

export interface AdaptiveQuizSession {
  sessionId: string;
  userId: string;
  topic: string;
  currentDifficulty: string;
  questionsAsked: Question[];
  responses: Array<{
    questionId: string;
    userAnswer: any;
    correct: boolean;
    timeTaken: number;
    confidence: number;
  }>;
  currentAccuracy: number;
  recommendedNextDifficulty: string;
  shouldContinue: boolean;
  masteryLevel: number; // 0-1
}

export class AdaptiveQuizEngine {
  private quizGenerator: QuizGenerator;
  private activeSessions: Map<string, AdaptiveQuizSession> = new Map();

  constructor(provider: ILLMProvider) {
    this.quizGenerator = new QuizGenerator(provider);
  }

  /**
   * Start a new adaptive quiz session
   */
  async startAdaptiveSession(
    userId: string,
    topic: string,
    content: string,
    objectives: string[],
    userProfile: UserPerformanceProfile,
    options: AdaptiveQuizOptions
  ): Promise<AdaptiveQuizSession> {
    const sessionId = `adaptive-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Determine initial difficulty based on user profile and options
    const initialDifficulty = this.determineInitialDifficulty(userProfile, options);

    // Generate initial questions
    const initialQuestions = await this.generateAdaptiveQuestions(
      topic,
      content,
      objectives,
      initialDifficulty,
      3 // Start with 3 questions
    );

    const session: AdaptiveQuizSession = {
      sessionId,
      userId,
      topic,
      currentDifficulty: initialDifficulty,
      questionsAsked: initialQuestions,
      responses: [],
      currentAccuracy: 0,
      recommendedNextDifficulty: initialDifficulty,
      shouldContinue: true,
      masteryLevel: 0
    };

    this.activeSessions.set(sessionId, session);
    console.log(`🎯 Started adaptive session ${sessionId} for user ${userId} on topic ${topic}`);

    return session;
  }

  /**
   * Process user response and adapt accordingly
   */
  async processResponse(
    sessionId: string,
    questionId: string,
    userAnswer: any,
    timeTaken: number,
    userConfidence: number = 0.5
  ): Promise<{
    session: AdaptiveQuizSession;
    nextQuestions: Question[];
    feedback: string;
    adaptationReason: string;
  }> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Find the question
    const question = session.questionsAsked.find(q => q.id === questionId);
    if (!question) {
      throw new Error(`Question ${questionId} not found in session`);
    }

    // Evaluate response
    const isCorrect = this.evaluateResponse(question, userAnswer);

    // Record response
    session.responses.push({
      questionId,
      userAnswer,
      correct: isCorrect,
      timeTaken,
      confidence: userConfidence
    });

    // Update session metrics
    this.updateSessionMetrics(session);

    // Determine next difficulty and questions
    const adaptationResult = await this.adaptDifficulty(session);

    // Generate feedback
    const feedback = this.generateFeedback(question, isCorrect, session.currentAccuracy);

    console.log(`📊 Session ${sessionId}: Accuracy ${session.currentAccuracy.toFixed(2)}, Next difficulty: ${adaptationResult.nextDifficulty}`);

    return {
      session,
      nextQuestions: adaptationResult.nextQuestions,
      feedback,
      adaptationReason: adaptationResult.reason
    };
  }

  /**
   * Determine initial difficulty based on user profile
   */
  private determineInitialDifficulty(
    userProfile: UserPerformanceProfile,
    options: AdaptiveQuizOptions
  ): 'easy' | 'medium' | 'hard' {
    // If user has performance history, use that
    if (userProfile.responseHistory.length > 5) {
      const recentAccuracy = this.calculateRecentAccuracy(userProfile.responseHistory, 10);
      
      if (recentAccuracy >= 0.8) return 'hard';
      if (recentAccuracy >= 0.6) return 'medium';
      return 'easy';
    }

    // Otherwise use overall score or default
    if (userProfile.overallScore >= 85) return 'hard';
    if (userProfile.overallScore >= 70) return 'medium';
    if (userProfile.overallScore > 0) return 'easy';

    // Fallback to options
    return options.initialDifficulty;
  }

  /**
   * Generate adaptive questions based on current session state
   */
  private async generateAdaptiveQuestions(
    topic: string,
    content: string,
    objectives: string[],
    difficulty: string,
    count: number
  ): Promise<Question[]> {
    try {
      // Use the existing quiz generator with adaptive parameters
      const questions = await this.quizGenerator.generateAdaptiveQuestions(
        topic,
        [], // No previous responses for initial generation
        count
      );

      // Enhance questions with adaptive metadata
      return questions.map((q, index) => ({
        ...q,
        metadata: {
          ...q.metadata,
          adaptiveDifficulty: difficulty,
          adaptiveOrder: index,
          generatedAt: new Date()
        }
      }));
    } catch (error) {
      console.error('Error generating adaptive questions:', error);
      // Return fallback questions
      return this.generateFallbackQuestions(topic, difficulty, count);
    }
  }

  /**
   * Evaluate user response correctness
   */
  private evaluateResponse(question: Question, userAnswer: any): boolean {
    switch (question.type) {
      case 'multiple-choice':
        return userAnswer === question.correctAnswer;
      case 'true-false':
        return userAnswer === question.correctAnswer;
      case 'short-answer':
        // For short answers, check if key concepts are present
        if (question.expectedKeywords) {
          const answerLower = String(userAnswer).toLowerCase();
          return question.expectedKeywords.some((keyword: string) => 
            answerLower.includes(keyword.toLowerCase())
          );
        }
        return false;
      default:
        return false;
    }
  }

  /**
   * Update session performance metrics
   */
  private updateSessionMetrics(session: AdaptiveQuizSession): void {
    const totalResponses = session.responses.length;
    const correctResponses = session.responses.filter(r => r.correct).length;
    
    session.currentAccuracy = totalResponses > 0 ? correctResponses / totalResponses : 0;
    
    // Calculate mastery level based on recent performance
    const recentResponses = session.responses.slice(-5);
    const recentCorrect = recentResponses.filter(r => r.correct).length;
    session.masteryLevel = recentResponses.length > 0 ? recentCorrect / recentResponses.length : 0;
  }

  /**
   * Adapt difficulty based on performance
   */
  private async adaptDifficulty(session: AdaptiveQuizSession): Promise<{
    nextDifficulty: string;
    nextQuestions: Question[];
    reason: string;
  }> {
    const recentResponses = session.responses.slice(-3);
    const recentAccuracy = recentResponses.length > 0 ? 
      recentResponses.filter(r => r.correct).length / recentResponses.length : 0;

    let nextDifficulty = session.currentDifficulty;
    let reason = 'Mantendo nível atual';

    // Adaptation logic
    if (recentAccuracy >= 0.8 && session.currentDifficulty !== 'hard') {
      nextDifficulty = session.currentDifficulty === 'easy' ? 'medium' : 'hard';
      reason = `Aumentando dificuldade devido à alta performance (${(recentAccuracy * 100).toFixed(0)}%)`;
    } else if (recentAccuracy <= 0.4 && session.currentDifficulty !== 'easy') {
      nextDifficulty = session.currentDifficulty === 'hard' ? 'medium' : 'easy';
      reason = `Diminuindo dificuldade devido à baixa performance (${(recentAccuracy * 100).toFixed(0)}%)`;
    }

    // Update session
    session.currentDifficulty = nextDifficulty;
    session.recommendedNextDifficulty = nextDifficulty;

    // Check if session should continue
    session.shouldContinue = this.shouldContinueSession(session);

    let nextQuestions: Question[] = [];
    if (session.shouldContinue) {
      // Generate next questions
      nextQuestions = await this.generateAdaptiveQuestions(
        session.topic,
        '', // Content would be passed from context
        [], // Objectives would be passed from context
        nextDifficulty,
        2 // Generate 2 more questions
      );

      session.questionsAsked.push(...nextQuestions);
    }

    return {
      nextDifficulty,
      nextQuestions,
      reason
    };
  }

  /**
   * Determine if session should continue
   */
  private shouldContinueSession(session: AdaptiveQuizSession): boolean {
    const totalQuestions = session.questionsAsked.length;
    const responses = session.responses.length;

    // Stop if we've asked enough questions and have sufficient data
    if (responses >= 8 && session.masteryLevel > 0.8) {
      return false; // High mastery achieved
    }

    if (responses >= 15) {
      return false; // Maximum questions reached
    }

    if (responses >= 5 && session.masteryLevel < 0.3) {
      return false; // Low performance, need different approach
    }

    return true;
  }

  /**
   * Generate feedback for user response
   */
  private generateFeedback(question: Question, isCorrect: boolean, accuracy: number): string {
    if (isCorrect) {
      if (accuracy >= 0.8) {
        return '🎉 Excelente! Você está demonstrando ótimo domínio do assunto.';
      } else {
        return '✅ Correto! Continue assim para melhorar ainda mais.';
      }
    } else {
      if (accuracy <= 0.4) {
        return '🤔 Não foi desta vez. Considere revisar o material antes de continuar.';
      } else {
        return '❌ Resposta incorreta, mas você está no caminho certo. Vamos continuar!';
      }
    }
  }

  /**
   * Calculate recent accuracy from response history
   */
  private calculateRecentAccuracy(history: any[], count: number): number {
    const recent = history.slice(-count);
    if (recent.length === 0) return 0;
    
    const correct = recent.filter(r => r.correct).length;
    return correct / recent.length;
  }

  /**
   * Generate fallback questions when AI generation fails
   */
  private generateFallbackQuestions(topic: string, difficulty: string, count: number): Question[] {
    const questions: Question[] = [];
    
    for (let i = 0; i < count; i++) {
      questions.push({
        id: `fallback-adaptive-${i + 1}`,
        type: 'multiple-choice',
        question: `Qual é um aspecto importante de ${topic} (Questão ${difficulty})?`,
        options: [
          { id: 'opt-1', text: 'É um conceito fundamental na psicologia', isCorrect: true },
          { id: 'opt-2', text: 'Não tem relevância prática', isCorrect: false },
          { id: 'opt-3', text: 'Aplica-se apenas em casos raros', isCorrect: false },
          { id: 'opt-4', text: 'Foi refutado por estudos recentes', isCorrect: false }
        ],
        correctAnswer: 0,
        explanation: `${topic} é um conceito importante na psicologia junguiana com várias aplicações práticas.`,
        points: difficulty === 'hard' ? 15 : difficulty === 'medium' ? 10 : 5,
        order: i,
        metadata: {
          difficulty,
          adaptiveFallback: true
        }
      });
    }

    return questions;
  }

  /**
   * Get session analytics
   */
  getSessionAnalytics(sessionId: string): {
    performance: number;
    difficultyProgression: string[];
    responsePattern: Array<{ correct: boolean; time: number; difficulty: string }>;
    recommendations: string[];
  } {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const difficultyProgression = session.questionsAsked
      .map(q => q.metadata?.adaptiveDifficulty || q.metadata?.difficulty || 'medium');

    const responsePattern = session.responses.map(r => ({
      correct: r.correct,
      time: r.timeTaken,
      difficulty: session.questionsAsked.find(q => q.id === r.questionId)?.metadata?.difficulty || 'medium'
    }));

    const recommendations = this.generateRecommendations(session);

    return {
      performance: session.currentAccuracy,
      difficultyProgression,
      responsePattern,
      recommendations
    };
  }

  /**
   * Generate learning recommendations based on session data
   */
  private generateRecommendations(session: AdaptiveQuizSession): string[] {
    const recommendations: string[] = [];
    const accuracy = session.currentAccuracy;
    const responses = session.responses;

    if (accuracy >= 0.9) {
      recommendations.push('Excelente performance! Considere avançar para tópicos mais complexos.');
    } else if (accuracy >= 0.7) {
      recommendations.push('Boa compreensão. Pratique com mais exercícios para consolidar o conhecimento.');
    } else if (accuracy >= 0.5) {
      recommendations.push('Progresso moderado. Revise o material e tente novamente.');
    } else {
      recommendations.push('Recomenda-se revisar os conceitos fundamentais antes de continuar.');
    }

    // Analyze response times
    const avgTime = responses.reduce((sum, r) => sum + r.timeTaken, 0) / responses.length;
    if (avgTime < 30) {
      recommendations.push('Você responde rapidamente. Considere dedicar mais tempo para reflexão.');
    } else if (avgTime > 180) {
      recommendations.push('Tome seu tempo para responder, mas tente ser mais decisivo.');
    }

    // Analyze confidence patterns
    const avgConfidence = responses.reduce((sum, r) => sum + r.confidence, 0) / responses.length;
    if (avgConfidence < 0.3) {
      recommendations.push('Trabalhe na confiança com mais prática e revisão dos conceitos.');
    }

    return recommendations;
  }

  /**
   * End adaptive session and return final results
   */
  endSession(sessionId: string): {
    finalScore: number;
    masteryLevel: number;
    totalQuestions: number;
    timeSpent: number;
    strongAreas: string[];
    improvementAreas: string[];
  } {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const totalTime = session.responses.reduce((sum, r) => sum + r.timeTaken, 0);
    const finalScore = session.currentAccuracy * 100;

    // Analyze areas of strength and improvement
    const { strongAreas, improvementAreas } = this.analyzePerformanceAreas(session);

    // Clean up session
    this.activeSessions.delete(sessionId);

    return {
      finalScore,
      masteryLevel: session.masteryLevel,
      totalQuestions: session.responses.length,
      timeSpent: totalTime,
      strongAreas,
      improvementAreas
    };
  }

  /**
   * Analyze performance areas
   */
  private analyzePerformanceAreas(session: AdaptiveQuizSession): {
    strongAreas: string[];
    improvementAreas: string[];
  } {
    const difficultyPerformance: { [key: string]: { correct: number; total: number } } = {};
    
    session.responses.forEach(response => {
      const question = session.questionsAsked.find(q => q.id === response.questionId);
      const difficulty = question?.metadata?.difficulty || 'medium';
      
      if (!difficultyPerformance[difficulty]) {
        difficultyPerformance[difficulty] = { correct: 0, total: 0 };
      }
      
      difficultyPerformance[difficulty].total++;
      if (response.correct) {
        difficultyPerformance[difficulty].correct++;
      }
    });

    const strongAreas: string[] = [];
    const improvementAreas: string[] = [];

    Object.entries(difficultyPerformance).forEach(([difficulty, perf]) => {
      const accuracy = perf.correct / perf.total;
      if (accuracy >= 0.7) {
        strongAreas.push(`Questões de nível ${difficulty}`);
      } else if (accuracy < 0.5) {
        improvementAreas.push(`Questões de nível ${difficulty}`);
      }
    });

    return { strongAreas, improvementAreas };
  }
}