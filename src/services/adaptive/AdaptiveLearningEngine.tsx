import { 
  UserProgress, 
  Module, 
  LearningPath, 
  AdaptiveLearningData, 
  ConceptMastery,
  Quiz,
  Question,
  QuestionType,
  LearningInsight
} from '../../types';

export interface AdaptiveRecommendation {
  type: 'review' | 'advance' | 'practice' | 'break';
  moduleId?: string;
  reason: string;
  confidence: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
}

export class AdaptiveLearningEngine {
  private knowledgeTracingModel: KnowledgeTracingModel;
  private collaborativeFilter: CollaborativeFilter;
  private difficultyEstimator: DifficultyEstimator;
  private forgettingCurvePredictor: ForgettingCurvePredictor;

  constructor() {
    this.knowledgeTracingModel = new KnowledgeTracingModel();
    this.collaborativeFilter = new CollaborativeFilter();
    this.difficultyEstimator = new DifficultyEstimator();
    this.forgettingCurvePredictor = new ForgettingCurvePredictor();
  }

  /**
   * Generate personalized learning path based on user's current state
   */
  generatePersonalizedPath(
    userProgress: UserProgress, 
    availableModules: Module[], 
    goals: string[] = []
  ): LearningPath {
    const adaptiveData = userProgress.adaptiveLearningData;
    const currentKnowledge = adaptiveData?.knowledgeState || {};
    
    // Analyze user's strengths and weaknesses
    const conceptAnalysis = this.analyzeConceptMastery(userProgress);
    
    // Determine optimal difficulty progression
    const optimalDifficulty = this.calculateOptimalDifficulty(userProgress);
    
    // Select and order modules based on adaptive algorithms
    const recommendedModules = this.selectOptimalModules(
      availableModules,
      currentKnowledge,
      conceptAnalysis,
      optimalDifficulty,
      goals
    );

    // Estimate completion time
    const estimatedCompletion = this.estimateCompletionTime(
      recommendedModules,
      userProgress
    );

    return {
      id: `adaptive-path-${Date.now()}`,
      name: goals.length > 0 ? `Caminho para ${goals.join(', ')}` : 'Caminho Personalizado',
      description: 'Trajetória de aprendizado otimizada com base no seu progresso e objetivos',
      modules: recommendedModules.map(m => m.id),
      currentModule: recommendedModules[0]?.id || '',
      progress: 0,
      estimatedCompletion,
      personalized: true
    };
  }

  /**
   * Calculate next optimal difficulty for a specific concept
   */
  calculateNextDifficulty(userHistory: UserProgress, concept: string): number {
    const adaptiveData = userHistory.adaptiveLearningData;
    if (!adaptiveData) return 0.5; // Default to medium difficulty

    const conceptMastery = adaptiveData.conceptMastery[concept];
    if (!conceptMastery) return 0.3; // Start with easier content for new concepts

    // Consider multiple factors
    const masteryLevel = conceptMastery.level;
    const timeSinceLastReview = this.daysSince(conceptMastery.lastReviewed);
    const forgettingFactor = this.forgettingCurvePredictor.predict(timeSinceLastReview, masteryLevel);
    const learningRate = adaptiveData.learningRate;
    
    // Adaptive difficulty calculation
    let targetDifficulty = masteryLevel * 0.8; // Slightly below mastery level
    
    // Adjust for forgetting
    targetDifficulty *= forgettingFactor;
    
    // Adjust for learning rate (faster learners can handle higher difficulty)
    targetDifficulty += learningRate * 0.2;
    
    // Ensure difficulty is within reasonable bounds
    return Math.max(0.1, Math.min(0.95, targetDifficulty));
  }

  /**
   * Recommend content based on collaborative filtering and knowledge state
   */
  recommendContent(userProfile: UserProgress, availableContent: Module[]): Module[] {
    const adaptiveData = userProfile.adaptiveLearningData;
    const currentKnowledge = adaptiveData?.knowledgeState || {};
    
    // Score each module based on multiple factors
    const scoredModules = availableContent.map(module => {
      let score = 0;
      
      // Knowledge gap analysis
      score += this.calculateKnowledgeGapScore(module, currentKnowledge);
      
      // Difficulty appropriateness
      score += this.calculateDifficultyScore(module, userProfile);
      
      // Prerequisite readiness
      score += this.calculatePrerequisiteScore(module, userProfile);
      
      // Interest alignment
      score += this.calculateInterestScore(module, userProfile);
      
      // Collaborative filtering score
      score += this.collaborativeFilter.getRecommendationScore(userProfile, module);

      return { module, score };
    });

    // Sort by score and return top recommendations
    return scoredModules
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(item => item.module);
  }

  /**
   * Identify concepts that need reinforcement
   */
  identifyWeakConcepts(quizHistory: Record<string, number>): string[] {
    const weakConcepts: string[] = [];
    const threshold = 0.7; // 70% mastery threshold
    
    Object.entries(quizHistory).forEach(([quizId, score]) => {
      if (score < threshold) {
        // Extract concepts from quiz (this would need quiz metadata)
        const concepts = this.extractConceptsFromQuiz(quizId);
        weakConcepts.push(...concepts);
      }
    });

    // Return unique weak concepts sorted by frequency
    const conceptCounts = weakConcepts.reduce((acc, concept) => {
      acc[concept] = (acc[concept] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(conceptCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([concept]) => concept);
  }

  /**
   * Generate adaptive quiz based on user's knowledge state
   */
  generateAdaptiveQuiz(
    userProgress: UserProgress,
    topic: string,
    targetQuestions: number = 10
  ): Question[] {
    const adaptiveData = userProgress.adaptiveLearningData;
    const currentDifficulty = this.calculateNextDifficulty(userProgress, topic);
    
    // Generate questions with varying difficulty
    const questions: Question[] = [];
    const difficultyDistribution = this.calculateDifficultyDistribution(
      currentDifficulty,
      targetQuestions
    );

    difficultyDistribution.forEach(({ difficulty, count }) => {
      const questionsForDifficulty = this.generateQuestionsForDifficulty(
        topic,
        difficulty,
        count,
        userProgress
      );
      questions.push(...questionsForDifficulty);
    });

    // Shuffle questions to avoid predictable patterns
    return this.shuffleArray(questions);
  }

  /**
   * Analyze learning patterns and provide insights
   */
  analyzeLearningPatterns(userProgress: UserProgress): LearningInsight[] {
    const insights: LearningInsight[] = [];
    
    if (!userProgress || !userProgress.adaptiveLearningData) return insights;
    
    const adaptiveData = userProgress.adaptiveLearningData;

    // Analyze response patterns
    const responsePatterns = this.analyzeResponsePatterns(adaptiveData.responsePatterns);
    insights.push(...responsePatterns);

    // Analyze concept mastery trends
    const masteryTrends = this.analyzeMasteryTrends(adaptiveData.conceptMastery);
    insights.push(...masteryTrends);

    // Analyze learning velocity
    const velocityInsights = this.analyzeLearningVelocity(adaptiveData.learningRate);
    insights.push(...velocityInsights);

    // Generate recommendations
    const recommendations = this.generateLearningRecommendations(userProgress);
    insights.push(...recommendations);

    return insights;
  }

  /**
   * Update user's adaptive learning data based on new performance
   */
  updateAdaptiveData(
    userProgress: UserProgress,
    quizResult: { score: number; concept: string; difficulty: number; timeSpent: number }
  ): UserProgress {
    const adaptiveData = userProgress.adaptiveLearningData || this.initializeAdaptiveData();
    
    // Update knowledge state
    const concept = quizResult.concept;
    const previousKnowledge = adaptiveData.knowledgeState[concept] || 0;
    const newKnowledge = this.knowledgeTracingModel.update(
      previousKnowledge,
      quizResult.score,
      quizResult.difficulty
    );
    adaptiveData.knowledgeState[concept] = newKnowledge;

    // Update concept mastery
    if (!adaptiveData.conceptMastery[concept]) {
      adaptiveData.conceptMastery[concept] = {
        concept,
        level: 0,
        lastReviewed: new Date(),
        reviewCount: 0,
        forgettingCurve: 1
      };
    }
    
    const mastery = adaptiveData.conceptMastery[concept];
    mastery.level = newKnowledge;
    mastery.lastReviewed = new Date();
    mastery.reviewCount++;
    mastery.forgettingCurve = this.forgettingCurvePredictor.calculateCurve(
      mastery.reviewCount,
      mastery.level
    );

    // Update learning rate
    adaptiveData.learningRate = this.calculateLearningRate(
      adaptiveData.learningRate,
      quizResult.score,
      quizResult.timeSpent
    );

    // Update response patterns
    adaptiveData.responsePatterns.push({
      questionType: 'multiple-choice', // This would come from the actual question
      avgResponseTime: quizResult.timeSpent,
      accuracy: quizResult.score / 100,
      confidence: this.estimateConfidence(quizResult.score, quizResult.timeSpent)
    });

    // Keep only recent response patterns (last 50)
    if (adaptiveData.responsePatterns.length > 50) {
      adaptiveData.responsePatterns = adaptiveData.responsePatterns.slice(-50);
    }

    return {
      ...userProgress,
      adaptiveLearningData: adaptiveData
    };
  }

  /**
   * Predict optimal review schedule for spaced repetition
   */
  predictOptimalReviewSchedule(conceptMastery: ConceptMastery): Date[] {
    const now = new Date();
    const reviewDates: Date[] = [];
    
    // Calculate intervals based on forgetting curve and mastery level
    const intervals = this.calculateSpacedRepetitionIntervals(
      conceptMastery.level,
      conceptMastery.reviewCount
    );

    intervals.forEach((interval, index) => {
      const reviewDate = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);
      reviewDates.push(reviewDate);
    });

    return reviewDates;
  }

  // Private helper methods

  private analyzeConceptMastery(userProgress: UserProgress): Record<string, number> {
    const quizScores = userProgress.quizScores;
    const conceptMastery: Record<string, number> = {};

    // Analyze quiz performance to infer concept mastery
    Object.entries(quizScores).forEach(([quizId, score]) => {
      const concepts = this.extractConceptsFromQuiz(quizId);
      concepts.forEach(concept => {
        if (!conceptMastery[concept]) conceptMastery[concept] = 0;
        conceptMastery[concept] = Math.max(conceptMastery[concept], score / 100);
      });
    });

    return conceptMastery;
  }

  private calculateOptimalDifficulty(userProgress: UserProgress): number {
    const avgScore = Object.values(userProgress.quizScores).reduce((a, b) => a + b, 0) / 
                     Object.keys(userProgress.quizScores).length || 70;
    
    // Map score to difficulty (0-1 scale)
    return Math.min(0.9, Math.max(0.1, avgScore / 100));
  }

  private selectOptimalModules(
    availableModules: Module[],
    currentKnowledge: Record<string, number>,
    conceptAnalysis: Record<string, number>,
    optimalDifficulty: number,
    goals: string[]
  ): Module[] {
    return availableModules
      .filter(module => {
        // Check prerequisites
        return (module.prerequisites || []).every(prereq => 
          currentKnowledge[prereq] >= 0.7
        );
      })
      .sort((a, b) => {
        let scoreA = this.calculateModuleScore(a, currentKnowledge, conceptAnalysis, optimalDifficulty, goals);
        let scoreB = this.calculateModuleScore(b, currentKnowledge, conceptAnalysis, optimalDifficulty, goals);
        return scoreB - scoreA;
      });
  }

  private calculateModuleScore(
    module: Module,
    knowledge: Record<string, number>,
    concepts: Record<string, number>,
    optimalDifficulty: number,
    goals: string[]
  ): number {
    let score = 0;

    // Difficulty match
    const difficultyMap = { beginner: 0.3, intermediate: 0.6, advanced: 0.9 };
    const moduleDifficulty = difficultyMap[module.difficulty];
    score += 100 - Math.abs(moduleDifficulty - optimalDifficulty) * 100;

    // Goal alignment
    goals.forEach(goal => {
      if (module.title.toLowerCase().includes(goal.toLowerCase()) ||
          module.description.toLowerCase().includes(goal.toLowerCase())) {
        score += 50;
      }
    });

    // Knowledge gap (prioritize unknown concepts)
    const moduleTopics = this.extractTopicsFromModule(module);
    moduleTopics.forEach(topic => {
      const currentKnowledge = knowledge[topic] || 0;
      score += (1 - currentKnowledge) * 30; // Higher score for less known topics
    });

    return score;
  }

  private estimateCompletionTime(modules: Module[], userProgress: UserProgress): Date {
    const totalTime = modules.reduce((sum, module) => sum + module.estimatedTime, 0);
    const learningRate = userProgress.adaptiveLearningData?.learningRate || 1;
    const adjustedTime = totalTime / learningRate;
    
    return new Date(Date.now() + adjustedTime * 60 * 60 * 1000); // Convert hours to milliseconds
  }

  private calculateKnowledgeGapScore(module: Module, knowledge: Record<string, number>): number {
    const topics = this.extractTopicsFromModule(module);
    const avgKnowledge = topics.reduce((sum, topic) => sum + (knowledge[topic] || 0), 0) / topics.length;
    return (1 - avgKnowledge) * 40; // Higher score for bigger knowledge gaps
  }

  private calculateDifficultyScore(module: Module, userProgress: UserProgress): number {
    const userLevel = this.estimateUserLevel(userProgress);
    const difficultyMap = { beginner: 1, intermediate: 2, advanced: 3 };
    const moduleDifficulty = difficultyMap[module.difficulty];
    const difference = Math.abs(moduleDifficulty - userLevel);
    return Math.max(0, 30 - difference * 10);
  }

  private calculatePrerequisiteScore(module: Module, userProgress: UserProgress): number {
    if (!module.prerequisites || module.prerequisites.length === 0) return 20;
    
    const completedModules = new Set(userProgress.completedModules);
    const metPrerequisites = module.prerequisites.filter(prereq => completedModules.has(prereq));
    
    return (metPrerequisites.length / module.prerequisites.length) * 30;
  }

  private calculateInterestScore(module: Module, userProgress: UserProgress): number {
    // This would analyze user's past behavior, time spent on similar topics, etc.
    // For now, return a base score
    return 10;
  }

  private extractConceptsFromQuiz(quizId: string): string[] {
    // This would need to be implemented based on your quiz metadata
    // For now, return some mock concepts based on quiz ID
    const conceptMap: Record<string, string[]> = {
      'intro-quiz': ['jung-biography', 'analytical-psychology'],
      'archetype-quiz': ['archetypes', 'collective-unconscious', 'shadow', 'anima-animus'],
      'types-quiz': ['psychological-types', 'introversion', 'extraversion', 'functions']
    };
    
    return conceptMap[quizId] || ['general-concept'];
  }

  private extractTopicsFromModule(module: Module): string[] {
    // Extract topics from module content, tags, learning objectives, etc.
    const topics: string[] = [];
    
    if (module.content?.sections) {
      module.content.sections.forEach(section => {
        // Extract topics from section keyTerms instead of concepts
        if (section.keyTerms) {
          topics.push(...section.keyTerms.map(term => term.term));
        }
      });
    }
    
    if (module.learningObjectives) {
      // Extract key terms from learning objectives
      topics.push(...this.extractKeyTerms(module.learningObjectives.join(' ')));
    }

    return [...new Set(topics)]; // Remove duplicates
  }

  private extractKeyTerms(text: string): string[] {
    // Simple keyword extraction - in practice, you'd use NLP
    const commonWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    return text.toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 3 && !commonWords.has(word))
      .slice(0, 5);
  }

  private estimateUserLevel(userProgress: UserProgress): number {
    const completedModules = userProgress.completedModules.length;
    const avgScore = Object.values(userProgress.quizScores).reduce((a, b) => a + b, 0) / 
                     Object.keys(userProgress.quizScores).length || 70;
    
    // Simple level estimation based on progress and performance
    if (completedModules < 2 || avgScore < 60) return 1; // Beginner
    if (completedModules < 5 || avgScore < 80) return 2; // Intermediate
    return 3; // Advanced
  }

  private daysSince(date: Date): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private initializeAdaptiveData(): AdaptiveLearningData {
    return {
      knowledgeState: {},
      learningRate: 1.0,
      difficultyPreference: 0.5,
      responsePatterns: [],
      conceptMastery: {}
    };
  }

  private calculateLearningRate(currentRate: number, score: number, timeSpent: number): number {
    // Adjust learning rate based on performance and efficiency
    const performanceFactor = score / 100;
    const efficiencyFactor = Math.max(0.5, Math.min(2, 300 / timeSpent)); // Assume 300s is baseline
    
    const newRate = currentRate * 0.9 + (performanceFactor * efficiencyFactor) * 0.1;
    return Math.max(0.1, Math.min(3.0, newRate));
  }

  private estimateConfidence(score: number, timeSpent: number): number {
    // Quick answers with high scores indicate high confidence
    const speedFactor = Math.max(0.1, Math.min(1, 60 / timeSpent)); // Assume 60s is baseline
    const accuracyFactor = score / 100;
    
    return Math.min(1, speedFactor * accuracyFactor);
  }

  private calculateDifficultyDistribution(targetDifficulty: number, totalQuestions: number): Array<{difficulty: number, count: number}> {
    // Distribute questions around target difficulty with some variance
    const distributions = [
      { difficulty: Math.max(0.1, targetDifficulty - 0.3), count: Math.floor(totalQuestions * 0.2) },
      { difficulty: Math.max(0.1, targetDifficulty - 0.1), count: Math.floor(totalQuestions * 0.3) },
      { difficulty: targetDifficulty, count: Math.floor(totalQuestions * 0.3) },
      { difficulty: Math.min(0.9, targetDifficulty + 0.1), count: Math.floor(totalQuestions * 0.2) }
    ];

    // Ensure we have exactly the right number of questions
    const assigned = distributions.reduce((sum, d) => sum + d.count, 0);
    if (assigned < totalQuestions) {
      distributions[2].count += totalQuestions - assigned;
    }

    return distributions.filter(d => d.count > 0);
  }

  private generateQuestionsForDifficulty(
    topic: string, 
    difficulty: number, 
    count: number, 
    userProgress: UserProgress
  ): Question[] {
    // This would integrate with your question generation system
    // For now, return mock questions
    return Array(count).fill(null).map((_, index) => ({
      id: `adaptive-q-${topic}-${difficulty}-${index}`,
      question: `Adaptive question about ${topic} (difficulty ${difficulty.toFixed(1)})`,
      type: 'multiple-choice' as QuestionType,
      options: [
        { id: 'a', text: 'Option A', isCorrect: true },
        { id: 'b', text: 'Option B', isCorrect: false },
        { id: 'c', text: 'Option C', isCorrect: false },
        { id: 'd', text: 'Option D', isCorrect: false }
      ],
      correctAnswer: 0,
      explanation: `This question tests your understanding of ${topic} at difficulty level ${difficulty.toFixed(1)}.`,
      difficulty: difficulty > 0.7 ? 'advanced' : difficulty > 0.4 ? 'intermediate' : 'beginner',
      tags: [topic],
      points: Math.round(difficulty * 100)
    }));
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private analyzeResponsePatterns(patterns: any[]): LearningInsight[] {
    // Analyze response patterns and generate insights
    const insights: LearningInsight[] = [];
    
    // Add sample insight
    insights.push({
      id: `insight-${Date.now()}-1`,
      type: 'strength',
      title: 'Consistent Response Pattern',
      description: 'Your response patterns show consistent understanding',
      confidence: 0.8,
      date: new Date()
    });
    
    return insights;
  }

  private analyzeMasteryTrends(conceptMastery: Record<string, ConceptMastery>): LearningInsight[] {
    // Analyze mastery trends and generate insights
    const insights: LearningInsight[] = [];
    
    // Add sample insight
    insights.push({
      id: `insight-${Date.now()}-2`,
      type: 'recommendation',
      title: 'Mastery Progress',
      description: 'You are making steady progress in your learning journey',
      confidence: 0.75,
      date: new Date()
    });
    
    return insights;
  }

  private analyzeLearningVelocity(learningRate: number): LearningInsight[] {
    // Analyze learning velocity and generate insights
    const insights: LearningInsight[] = [];
    
    if (learningRate > 0.7) {
      insights.push({
        id: `insight-${Date.now()}-3`,
        type: 'strength',
        title: 'Fast Learning Pace',
        description: 'You are learning at an excellent pace',
        confidence: 0.9,
        date: new Date()
      });
    }
    
    return insights;
  }

  private generateLearningRecommendations(userProgress: UserProgress): LearningInsight[] {
    // Generate actionable learning recommendations
    const insights: LearningInsight[] = [];
    
    insights.push({
      id: `insight-${Date.now()}-4`,
      type: 'recommendation',
      title: 'Next Steps',
      description: 'Consider exploring more advanced concepts',
      suggestedActions: ['Review Module 2', 'Practice exercises'],
      confidence: 0.85,
      date: new Date()
    });
    
    return insights;
  }

  private calculateSpacedRepetitionIntervals(masteryLevel: number, reviewCount: number): number[] {
    // Calculate optimal spaced repetition intervals
    const baseInterval = 1; // 1 day
    const intervals: number[] = [];
    
    for (let i = 0; i < 5; i++) {
      const interval = baseInterval * Math.pow(2.5, i) * (1 + masteryLevel);
      intervals.push(Math.round(interval));
    }
    
    return intervals;
  }
}

// Supporting classes

class KnowledgeTracingModel {
  update(currentKnowledge: number, score: number, difficulty: number): number {
    // Bayesian Knowledge Tracing update
    const performance = score / 100;
    const learningGain = performance * difficulty * 0.3;
    const forgetting = currentKnowledge * 0.05; // Small forgetting factor
    
    const newKnowledge = currentKnowledge + learningGain - forgetting;
    return Math.max(0, Math.min(1, newKnowledge));
  }
}

class CollaborativeFilter {
  getRecommendationScore(userProfile: UserProgress, module: Module): number {
    // Simplified collaborative filtering
    // In practice, this would compare with similar users
    return Math.random() * 20; // Mock score
  }
}

class DifficultyEstimator {
  estimate(module: Module, userProfile: UserProgress): number {
    const difficultyMap = { beginner: 0.3, intermediate: 0.6, advanced: 0.9 };
    return difficultyMap[module.difficulty];
  }
}

class ForgettingCurvePredictor {
  predict(daysSinceReview: number, initialMastery: number): number {
    // Ebbinghaus forgetting curve
    const retentionRate = Math.exp(-daysSinceReview / (10 * initialMastery));
    return Math.max(0.1, retentionRate);
  }

  calculateCurve(reviewCount: number, masteryLevel: number): number {
    // Stronger memories formed with more reviews
    const stability = Math.min(0.95, 0.5 + (reviewCount * 0.1) + (masteryLevel * 0.3));
    return stability;
  }
}

export default AdaptiveLearningEngine;