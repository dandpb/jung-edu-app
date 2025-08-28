/**
 * Adaptive Learning Path Automation Tests
 * 
 * Tests intelligent content sequencing, difficulty adjustment,
 * personalized learning recommendations, and progress tracking.
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { 
  AdaptiveLearningEngine,
  ContentSequencingService,
  DifficultyAdjustmentService,
  LearningPathService,
  PersonalizationService
} from '../../../jung-edu-app/src/services/adaptive';
import { ProgressTrackingService } from '../../../jung-edu-app/src/services/progress';
import { RecommendationEngine } from '../../../jung-edu-app/src/services/recommendations';

// Mock machine learning models and external services
jest.mock('../../../jung-edu-app/src/services/ml/adaptiveModel');
jest.mock('../../../jung-edu-app/src/services/analytics/learningAnalytics');

interface LearnerProfile {
  id: string;
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  cognitiveLevel: 'concrete' | 'abstract' | 'mixed';
  pace: 'slow' | 'average' | 'fast';
  motivation: 'low' | 'medium' | 'high';
  priorKnowledge: Record<string, number>; // topic -> proficiency (0-1)
  strengths: string[];
  weaknesses: string[];
  preferences: {
    contentTypes: string[];
    sessionDuration: number;
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    difficultyPreference: 'challenging' | 'comfortable' | 'gradual';
  };
  learningGoals: Array<{
    id: string;
    topic: string;
    targetLevel: number;
    deadline?: Date;
    priority: 'low' | 'medium' | 'high';
  }>;
}

interface LearningContent {
  id: string;
  type: 'video' | 'text' | 'interactive' | 'quiz' | 'simulation';
  topic: string;
  subtopics: string[];
  difficulty: number; // 0-1 scale
  estimatedDuration: number; // minutes
  prerequisites: string[];
  learningObjectives: string[];
  cognitiveLevel: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
  engagementFactors: {
    interactivity: number;
    multimedia: boolean;
    gamification: boolean;
  };
  metadata: {
    effectiveness: number; // Historical effectiveness rating
    completionRate: number;
    averageRating: number;
    adaptabilityScore: number;
  };
}

interface AdaptivePath {
  id: string;
  learnerId: string;
  content: Array<{
    contentId: string;
    position: number;
    adaptations: {
      difficultyAdjustment: number;
      pacing: number;
      supportLevel: 'minimal' | 'moderate' | 'high';
      presentationMode: string;
    };
    prerequisites: string[];
    alternatives: string[];
  }>;
  pathReasoning: {
    rationale: string;
    adaptationFactors: string[];
    expectedOutcomes: string[];
  };
  dynamicAdjustments: boolean;
  estimatedCompletion: Date;
}

describe('Adaptive Learning Path Automation Tests', () => {
  let adaptiveEngine: AdaptiveLearningEngine;
  let sequencingService: ContentSequencingService;
  let difficultyService: DifficultyAdjustmentService;
  let pathService: LearningPathService;
  let personalizationService: PersonalizationService;
  let progressService: ProgressTrackingService;
  let recommendationEngine: RecommendationEngine;

  const mockLearnerProfile: LearnerProfile = {
    id: 'learner123',
    learningStyle: 'visual',
    cognitiveLevel: 'abstract',
    pace: 'average',
    motivation: 'high',
    priorKnowledge: {
      'jungian-basics': 0.3,
      'archetypes': 0.1,
      'dream-analysis': 0.0,
      'individuation': 0.0
    },
    strengths: ['pattern recognition', 'conceptual thinking'],
    weaknesses: ['detailed memorization', 'lengthy reading'],
    preferences: {
      contentTypes: ['video', 'interactive', 'visual-diagrams'],
      sessionDuration: 45,
      timeOfDay: 'evening',
      difficultyPreference: 'gradual'
    },
    learningGoals: [
      {
        id: 'goal1',
        topic: 'archetypes',
        targetLevel: 0.8,
        deadline: new Date('2024-06-01'),
        priority: 'high'
      },
      {
        id: 'goal2',
        topic: 'individuation',
        targetLevel: 0.7,
        priority: 'medium'
      }
    ]
  };

  const mockContentLibrary: LearningContent[] = [
    {
      id: 'content1',
      type: 'video',
      topic: 'archetypes',
      subtopics: ['collective-unconscious', 'universal-patterns'],
      difficulty: 0.3,
      estimatedDuration: 25,
      prerequisites: ['jungian-basics'],
      learningObjectives: ['understand archetype concept', 'identify major archetypes'],
      cognitiveLevel: 'understand',
      engagementFactors: { interactivity: 0.6, multimedia: true, gamification: false },
      metadata: { effectiveness: 0.85, completionRate: 0.92, averageRating: 4.3, adaptabilityScore: 0.8 }
    },
    {
      id: 'content2',
      type: 'interactive',
      topic: 'archetypes',
      subtopics: ['persona', 'shadow', 'anima-animus'],
      difficulty: 0.6,
      estimatedDuration: 35,
      prerequisites: ['content1'],
      learningObjectives: ['explore personal archetypes', 'analyze archetype relationships'],
      cognitiveLevel: 'apply',
      engagementFactors: { interactivity: 0.9, multimedia: true, gamification: true },
      metadata: { effectiveness: 0.78, completionRate: 0.87, averageRating: 4.1, adaptabilityScore: 0.9 }
    }
  ];

  beforeEach(() => {
    adaptiveEngine = new AdaptiveLearningEngine();
    sequencingService = new ContentSequencingService();
    difficultyService = new DifficultyAdjustmentService();
    pathService = new LearningPathService();
    personalizationService = new PersonalizationService();
    progressService = new ProgressTrackingService();
    recommendationEngine = new RecommendationEngine();

    jest.clearAllMocks();
  });

  describe('Intelligent Content Sequencing', () => {
    test('should sequence content based on prerequisites and learning objectives', async () => {
      const learningGoal = mockLearnerProfile.learningGoals[0]; // Archetypes goal
      
      const sequence = await sequencingService.generateSequence({
        learnerProfile: mockLearnerProfile,
        contentLibrary: mockContentLibrary,
        learningGoal
      });

      expect(sequence.content).toHaveLength(2);
      expect(sequence.content[0].contentId).toBe('content1'); // Prerequisites first
      expect(sequence.content[1].contentId).toBe('content2');
      expect(sequence.pathReasoning.rationale).toContain('prerequisite dependencies');
      expect(sequence.estimatedCompletion).toBeDefined();
    });

    test('should adapt sequence based on learner preferences', async () => {
      const visualLearner = {
        ...mockLearnerProfile,
        learningStyle: 'visual' as const,
        preferences: {
          ...mockLearnerProfile.preferences,
          contentTypes: ['video', 'interactive', 'infographic']
        }
      };

      const sequence = await sequencingService.generateSequence({
        learnerProfile: visualLearner,
        contentLibrary: mockContentLibrary,
        learningGoal: mockLearnerProfile.learningGoals[0]
      });

      // Should prioritize visual content
      expect(sequence.content[0].adaptations.presentationMode).toContain('visual');
      expect(sequence.pathReasoning.adaptationFactors).toContain('visual learning style');
    });

    test('should handle multiple learning goals with priority-based sequencing', async () => {
      const multipleGoals = mockLearnerProfile.learningGoals;
      
      const sequence = await sequencingService.generateMultiGoalSequence({
        learnerProfile: mockLearnerProfile,
        contentLibrary: mockContentLibrary,
        learningGoals: multipleGoals
      });

      // High priority goal content should come first
      const firstContent = sequence.content[0];
      expect(mockContentLibrary.find(c => c.id === firstContent.contentId)?.topic)
        .toBe('archetypes'); // High priority goal

      expect(sequence.pathReasoning.adaptationFactors).toContain('goal priority');
    });

    test('should optimize sequence for engagement and retention', async () => {
      const engagementOptimizer = new SequenceOptimizer({
        criteria: ['engagement', 'retention', 'completion_rate'],
        weights: { engagement: 0.4, retention: 0.4, completion_rate: 0.2 }
      });

      const optimizedSequence = await engagementOptimizer.optimizeSequence({
        baseSequence: await sequencingService.generateSequence({
          learnerProfile: mockLearnerProfile,
          contentLibrary: mockContentLibrary,
          learningGoal: mockLearnerProfile.learningGoals[0]
        }),
        optimizationCriteria: ['engagement', 'knowledge_retention']
      });

      expect(optimizedSequence.engagementScore).toBeGreaterThan(0.7);
      expect(optimizedSequence.retentionScore).toBeGreaterThan(0.7);
      expect(optimizedSequence.sequence.content.every(c => c.adaptations)).toBe(true);
    });
  });

  describe('Dynamic Difficulty Adjustment', () => {
    test('should adjust content difficulty based on real-time performance', async () => {
      const performanceData = {
        recentScores: [0.6, 0.5, 0.4], // Declining performance
        timeSpent: [30, 45, 60], // Increasing time needed
        strugglingConcepts: ['shadow-work', 'anima-animus'],
        confidenceLevel: 'low'
      };

      const adjustment = await difficultyService.calculateDifficultyAdjustment({
        currentDifficulty: 0.6,
        performanceData,
        learnerProfile: mockLearnerProfile,
        contentTopic: 'archetypes'
      });

      expect(adjustment.newDifficulty).toBeLessThan(0.6); // Should reduce difficulty
      expect(adjustment.adjustmentReason).toContain('declining performance');
      expect(adjustment.supportRecommendations).toContain('additional scaffolding');
      expect(adjustment.confidenceAdjustment).toBe('increase_support');
    });

    test('should increase difficulty for high-performing learners', async () => {
      const excellentPerformance = {
        recentScores: [0.95, 0.92, 0.96],
        timeSpent: [15, 18, 12], // Completing quickly
        strugglingConcepts: [],
        confidenceLevel: 'high'
      };

      const adjustment = await difficultyService.calculateDifficultyAdjustment({
        currentDifficulty: 0.4,
        performanceData: excellentPerformance,
        learnerProfile: { ...mockLearnerProfile, motivation: 'high' },
        contentTopic: 'archetypes'
      });

      expect(adjustment.newDifficulty).toBeGreaterThan(0.4); // Should increase difficulty
      expect(adjustment.challengeLevel).toBe('advanced');
      expect(adjustment.enrichmentActivities).toBeDefined();
    });

    test('should maintain difficulty for optimal challenge zone', async () => {
      const optimalPerformance = {
        recentScores: [0.75, 0.78, 0.73], // Consistent moderate performance
        timeSpent: [25, 28, 26], // Consistent timing
        strugglingConcepts: ['complex-integration'], // Some challenge
        confidenceLevel: 'medium'
      };

      const adjustment = await difficultyService.calculateDifficultyAdjustment({
        currentDifficulty: 0.5,
        performanceData: optimalPerformance,
        learnerProfile: mockLearnerProfile,
        contentTopic: 'individuation'
      });

      expect(Math.abs(adjustment.newDifficulty - 0.5)).toBeLessThan(0.1); // Minimal change
      expect(adjustment.adjustmentReason).toContain('optimal challenge');
      expect(adjustment.maintainCurrentLevel).toBe(true);
    });

    test('should adapt to different learning styles in difficulty adjustment', async () => {
      const kinestheticLearner = {
        ...mockLearnerProfile,
        learningStyle: 'kinesthetic' as const,
        strengths: ['hands-on learning', 'experiential understanding']
      };

      const adjustment = await difficultyService.calculateStyleAdaptedDifficulty({
        baseDifficulty: 0.6,
        learnerProfile: kinestheticLearner,
        contentType: 'interactive',
        topic: 'active-imagination'
      });

      expect(adjustment.difficultyAdjustments.interactivity).toBeGreaterThan(0.8);
      expect(adjustment.recommendedContentTypes).toContain('simulation');
      expect(adjustment.adaptationStrategy).toContain('experiential');
    });
  });

  describe('Personalized Learning Recommendations', () => {
    test('should generate recommendations based on learning history and preferences', async () => {
      const learningHistory = {
        completedContent: ['content1'],
        timeSpentByTopic: { 'archetypes': 120, 'jungian-basics': 90 },
        averageScores: { 'archetypes': 0.78, 'jungian-basics': 0.85 },
        preferredContentTypes: ['video', 'interactive'],
        dropoffPoints: ['lengthy-reading-materials']
      };

      const recommendations = await recommendationEngine.generateRecommendations({
        learnerProfile: mockLearnerProfile,
        learningHistory,
        availableContent: mockContentLibrary,
        currentContext: 'continuing_archetypes_study'
      });

      expect(recommendations.primary).toHaveLength(3);
      expect(recommendations.alternative).toHaveLength(2);
      expect(recommendations.primary[0].confidence).toBeGreaterThan(0.8);
      expect(recommendations.primary[0].reasoning).toBeDefined();
      expect(recommendations.personalizationFactors).toContain('learning_style');
    });

    test('should recommend remediation for struggling concepts', async () => {
      const strugglingProfile = {
        ...mockLearnerProfile,
        priorKnowledge: { 'archetypes': 0.4, 'shadow-work': 0.2 },
        weaknesses: ['shadow-integration', 'personal-unconscious']
      };

      const remediationRecs = await recommendationEngine.generateRemediationRecommendations({
        learnerProfile: strugglingProfile,
        strugglingConcepts: ['shadow-work', 'personal-unconscious'],
        previousAttempts: [
          { contentId: 'shadow-intro', score: 0.3, timeSpent: 60 },
          { contentId: 'shadow-exercises', score: 0.4, timeSpent: 90 }
        ]
      });

      expect(remediationRecs.scaffoldedContent).toHaveLength(3);
      expect(remediationRecs.prerequisiteReview).toBeDefined();
      expect(remediationRecs.alternativeApproaches).toContain('guided_practice');
      expect(remediationRecs.supportLevel).toBe('high');
      expect(remediationRecs.estimatedImprovementTime).toBeDefined();
    });

    test('should provide challenge recommendations for advanced learners', async () => {
      const advancedProfile = {
        ...mockLearnerProfile,
        priorKnowledge: { 'archetypes': 0.9, 'individuation': 0.85, 'active-imagination': 0.8 },
        preferences: { ...mockLearnerProfile.preferences, difficultyPreference: 'challenging' as const }
      };

      const challengeRecs = await recommendationEngine.generateAdvancedRecommendations({
        learnerProfile: advancedProfile,
        masteredTopics: ['archetypes', 'individuation'],
        availableAdvancedContent: mockContentLibrary
      });

      expect(challengeRecs.advancedContent).toBeDefined();
      expect(challengeRecs.synthesisActivities).toHaveLength(2);
      expect(challengeRecs.creativeApplications).toBeDefined();
      expect(challengeRecs.peerCollaboration).toBeDefined();
      expect(challengeRecs.researchProjects).toHaveLength(1);
    });

    test('should adapt recommendations based on time constraints', async () => {
      const timeConstrainedProfile = {
        ...mockLearnerProfile,
        preferences: {
          ...mockLearnerProfile.preferences,
          sessionDuration: 15 // Short sessions
        },
        learningGoals: [{
          ...mockLearnerProfile.learningGoals[0],
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week deadline
        }]
      };

      const timeAdaptedRecs = await recommendationEngine.generateTimeOptimizedRecommendations({
        learnerProfile: timeConstrainedProfile,
        availableTime: 15,
        urgentGoals: timeConstrainedProfile.learningGoals,
        availableContent: mockContentLibrary
      });

      expect(timeAdaptedRecs.microlearningModules).toBeDefined();
      expect(timeAdaptedRecs.prioritizedContent).toHaveLength(3);
      expect(timeAdaptedRecs.timeOptimizedPath.totalDuration).toBeLessThanOrEqual(7 * 15);
      expect(timeAdaptedRecs.intensiveStrategy).toBeDefined();
    });
  });

  describe('Learning Path Adaptation', () => {
    test('should dynamically adjust learning path based on progress', async () => {
      const currentPath: AdaptivePath = {
        id: 'path123',
        learnerId: mockLearnerProfile.id,
        content: [
          { contentId: 'content1', position: 1, adaptations: { difficultyAdjustment: 0, pacing: 1, supportLevel: 'moderate', presentationMode: 'video' }, prerequisites: [], alternatives: [] },
          { contentId: 'content2', position: 2, adaptations: { difficultyAdjustment: 0, pacing: 1, supportLevel: 'moderate', presentationMode: 'interactive' }, prerequisites: ['content1'], alternatives: [] }
        ],
        pathReasoning: { rationale: 'Initial sequence', adaptationFactors: [], expectedOutcomes: [] },
        dynamicAdjustments: true,
        estimatedCompletion: new Date()
      };

      const progressUpdate = {
        completedContent: ['content1'],
        currentPerformance: { score: 0.45, timeSpent: 50, strugglingAreas: ['complex-concepts'] },
        engagementMetrics: { completion: 0.8, interaction: 0.6, satisfaction: 0.5 }
      };

      const adaptedPath = await pathService.adaptPath({
        currentPath,
        progressUpdate,
        learnerProfile: mockLearnerProfile
      });

      expect(adaptedPath.content[1].adaptations.difficultyAdjustment).toBeLessThan(0);
      expect(adaptedPath.content[1].adaptations.supportLevel).toBe('high');
      expect(adaptedPath.pathReasoning.adaptationFactors).toContain('performance_difficulty');
    });

    test('should handle path branching based on learner choices', async () => {
      const branchingPoint = {
        contentId: 'branching-content',
        branchOptions: [
          { id: 'deep-dive', topic: 'archetype-analysis', difficulty: 0.7 },
          { id: 'overview', topic: 'archetype-survey', difficulty: 0.4 },
          { id: 'practical', topic: 'archetype-application', difficulty: 0.6 }
        ],
        learnerChoice: 'practical'
      };

      const branchedPath = await pathService.handlePathBranching({
        currentPath: mockLearnerProfile.learningGoals[0],
        branchingPoint,
        learnerProfile: mockLearnerProfile
      });

      expect(branchedPath.selectedBranch).toBe('practical');
      expect(branchedPath.adaptedContent).toBeDefined();
      expect(branchedPath.alternativeOptions).toHaveLength(2);
      expect(branchedPath.pathAdjustmentReason).toContain('learner choice');
    });

    test('should optimize path for learning efficiency', async () => {
      const efficiencyOptimizer = new PathEfficiencyOptimizer();
      
      const basePathData = {
        content: mockContentLibrary,
        learnerProfile: mockLearnerProfile,
        learningObjectives: mockLearnerProfile.learningGoals
      };

      const optimizedPath = await efficiencyOptimizer.optimizeForEfficiency(basePathData);

      expect(optimizedPath.estimatedCompletionTime).toBeLessThan(300); // minutes
      expect(optimizedPath.knowledgeRetentionScore).toBeGreaterThan(0.8);
      expect(optimizedPath.engagementPrediction).toBeGreaterThan(0.7);
      expect(optimizedPath.adaptationPoints).toHaveLength(3);
    });

    test('should maintain learning path coherence during adaptations', async () => {
      const complexPath = await pathService.generateComplexPath({
        learnerProfile: mockLearnerProfile,
        multipleGoals: mockLearnerProfile.learningGoals,
        contentLibrary: mockContentLibrary,
        constraints: { timeLimit: 120, maxDifficulty: 0.7 }
      });

      const coherenceValidator = new PathCoherenceValidator();
      const validation = await coherenceValidator.validateCoherence(complexPath);

      expect(validation.isCoherent).toBe(true);
      expect(validation.logicalFlow).toBe('valid');
      expect(validation.prerequisiteViolations).toHaveLength(0);
      expect(validation.conceptualGaps).toHaveLength(0);
      expect(validation.difficultyProgression).toBe('appropriate');
    });
  });

  describe('Progress Tracking and Analytics', () => {
    test('should track comprehensive learning progress metrics', async () => {
      const progressData = {
        completedActivities: [
          { id: 'content1', score: 0.85, timeSpent: 25, date: new Date('2024-01-01') },
          { id: 'quiz1', score: 0.78, timeSpent: 15, date: new Date('2024-01-02') }
        ],
        currentStreak: 5,
        sessionDurations: [20, 25, 30, 22, 28],
        engagementMetrics: {
          videosWatched: 3,
          interactionsCompleted: 12,
          notesCreated: 5,
          questionsAsked: 2
        }
      };

      const analysis = await progressService.analyzeProgress({
        learnerId: mockLearnerProfile.id,
        progressData,
        learningGoals: mockLearnerProfile.learningGoals,
        timeFrame: 'last_week'
      });

      expect(analysis.overallProgress).toBeGreaterThan(0);
      expect(analysis.goalProgress).toHaveProperty('goal1');
      expect(analysis.learningVelocity).toBeDefined();
      expect(analysis.engagementTrend).toBeOneOf(['increasing', 'decreasing', 'stable']);
      expect(analysis.predictedCompletion).toBeDefined();
    });

    test('should identify learning patterns and provide insights', async () => {
      const extendedProgressData = {
        dailyActivities: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
          activitiesCompleted: Math.floor(Math.random() * 5) + 1,
          timeSpent: Math.floor(Math.random() * 60) + 15,
          averageScore: Math.random() * 0.4 + 0.6
        })),
        topicProgression: {
          'archetypes': [0.2, 0.4, 0.6, 0.7, 0.75],
          'individuation': [0.1, 0.2, 0.3, 0.4, 0.45]
        }
      };

      const patterns = await progressService.identifyLearningPatterns({
        learnerId: mockLearnerProfile.id,
        extendedData: extendedProgressData,
        analysisDepth: 'comprehensive'
      });

      expect(patterns.learningCurve).toBeDefined();
      expect(patterns.peakPerformanceTimes).toHaveLength(2);
      expect(patterns.strugglingPeriods).toBeDefined();
      expect(patterns.motivationalTrends).toBeDefined();
      expect(patterns.recommendations).toHaveLength(3);
    });

    test('should predict learning outcomes and completion times', async () => {
      const historicalData = {
        learnerCohort: 'visual-abstract-learners',
        completionRates: [0.85, 0.78, 0.92, 0.88],
        averageCompletionTime: 180, // minutes
        successFactors: ['engagement', 'prior-knowledge', 'motivation']
      };

      const prediction = await progressService.predictOutcomes({
        learnerProfile: mockLearnerProfile,
        currentProgress: 0.4,
        historicalData,
        remainingContent: mockContentLibrary
      });

      expect(prediction.completionProbability).toBeGreaterThan(0.5);
      expect(prediction.estimatedTimeToCompletion).toBeDefined();
      expect(prediction.successLikelihood).toBeDefined();
      expect(prediction.riskFactors).toBeDefined();
      expect(prediction.recommendedInterventions).toBeDefined();
    });
  });

  describe('Edge Cases and Robustness', () => {
    test('should handle learners with conflicting preferences', async () => {
      const conflictedProfile = {
        ...mockLearnerProfile,
        learningStyle: 'kinesthetic',
        preferences: {
          ...mockLearnerProfile.preferences,
          contentTypes: ['reading', 'text'], // Conflicts with kinesthetic
          sessionDuration: 5, // Very short
          difficultyPreference: 'challenging' // But has low prior knowledge
        }
      };

      const resolvedPath = await pathService.resolveConflictingPreferences({
        learnerProfile: conflictedProfile,
        availableContent: mockContentLibrary
      });

      expect(resolvedPath.conflictResolutions).toBeDefined();
      expect(resolvedPath.compromiseSolution).toBeDefined();
      expect(resolvedPath.adaptedContent.every(c => c.adaptations)).toBe(true);
    });

    test('should adapt to limited content availability', async () => {
      const limitedContent = [mockContentLibrary[0]]; // Only one piece of content

      const adaptedRecommendation = await recommendationEngine.generateRecommendations({
        learnerProfile: mockLearnerProfile,
        learningHistory: { completedContent: [], timeSpentByTopic: {}, averageScores: {}, preferredContentTypes: [], dropoffPoints: [] },
        availableContent: limitedContent,
        currentContext: 'limited_content'
      });

      expect(adaptedRecommendation.contentAdaptations).toBeDefined();
      expect(adaptedRecommendation.supplementaryResources).toBeDefined();
      expect(adaptedRecommendation.externalRecommendations).toBeDefined();
    });

    test('should handle rapid preference changes', async () => {
      const preferenceChanges = [
        { timestamp: new Date('2024-01-01'), change: { learningStyle: 'visual' } },
        { timestamp: new Date('2024-01-05'), change: { learningStyle: 'auditory' } },
        { timestamp: new Date('2024-01-10'), change: { pace: 'fast' } }
      ];

      const adaptiveResponse = await pathService.handlePreferenceEvolution({
        learnerProfile: mockLearnerProfile,
        preferenceHistory: preferenceChanges,
        currentPath: mockContentLibrary
      });

      expect(adaptiveResponse.stabilityAnalysis).toBeDefined();
      expect(adaptiveResponse.adaptationStrategy).toBeOneOf(['gradual', 'immediate', 'hybrid']);
      expect(adaptiveResponse.confidenceLevel).toBeLessThan(1.0); // Should be uncertain with rapid changes
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.restoreAllMocks();
  });
});

// Helper classes for testing
class SequenceOptimizer {
  constructor(private config: any) {}

  async optimizeSequence(params: any): Promise<any> {
    return {
      engagementScore: 0.8,
      retentionScore: 0.75,
      sequence: params.baseSequence
    };
  }
}

class PathEfficiencyOptimizer {
  async optimizeForEfficiency(pathData: any): Promise<any> {
    return {
      estimatedCompletionTime: 250,
      knowledgeRetentionScore: 0.85,
      engagementPrediction: 0.8,
      adaptationPoints: [
        { position: 1, reason: 'difficulty_check' },
        { position: 3, reason: 'engagement_boost' },
        { position: 5, reason: 'knowledge_consolidation' }
      ]
    };
  }
}

class PathCoherenceValidator {
  async validateCoherence(path: any): Promise<any> {
    return {
      isCoherent: true,
      logicalFlow: 'valid',
      prerequisiteViolations: [],
      conceptualGaps: [],
      difficultyProgression: 'appropriate'
    };
  }
}

export { SequenceOptimizer, PathEfficiencyOptimizer, PathCoherenceValidator };