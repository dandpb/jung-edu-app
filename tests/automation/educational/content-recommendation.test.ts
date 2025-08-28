/**
 * Content Recommendation System Automation Tests
 * 
 * Tests intelligent content suggestion algorithms, personalized learning paths,
 * collaborative filtering, and adaptive recommendation engines.
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { 
  ContentRecommendationEngine,
  CollaborativeFilteringService,
  ContentBasedFilteringService,
  HybridRecommendationService,
  PersonalizationService,
  RecommendationAnalyticsService
} from '../../../jung-edu-app/src/services/recommendations';
import { MachineLearningService } from '../../../jung-edu-app/src/services/ml';
import { UserProfileService } from '../../../jung-edu-app/src/services/profile';

// Mock ML and external services
jest.mock('../../../jung-edu-app/src/services/ml');
jest.mock('../../../jung-edu-app/src/services/profile');

interface Content {
  id: string;
  title: string;
  type: 'video' | 'article' | 'interactive' | 'quiz' | 'simulation' | 'case_study';
  topic: string;
  subtopics: string[];
  difficulty: number; // 0-1 scale
  duration: number; // minutes
  prerequisites: string[];
  learningObjectives: string[];
  tags: string[];
  metadata: {
    popularity: number;
    rating: number;
    completionRate: number;
    effectivenessScore: number;
    authorId: string;
    createdAt: Date;
    lastUpdated: Date;
  };
  features: {
    hasVideo: boolean;
    hasAudio: boolean;
    hasText: boolean;
    hasInteractivity: boolean;
    hasAssessment: boolean;
  };
  analytics: {
    views: number;
    completions: number;
    averageTimeSpent: number;
    userRatings: number[];
    engagementMetrics: {
      clickThrough: number;
      timeOnContent: number;
      interactionRate: number;
    };
  };
}

interface UserProfile {
  id: string;
  demographics: {
    age?: number;
    education?: string;
    background?: string;
  };
  learningProfile: {
    style: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
    pace: 'slow' | 'medium' | 'fast';
    preferredDifficulty: 'beginner' | 'intermediate' | 'advanced';
    sessionDuration: number;
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'flexible';
  };
  interests: {
    primary: string[];
    secondary: string[];
    emerging: string[];
  };
  goals: {
    shortTerm: string[];
    longTerm: string[];
    career: string[];
  };
  behavior: {
    loginFrequency: number;
    averageSessionTime: number;
    preferredContentTypes: string[];
    completionRate: number;
    engagementPatterns: Record<string, number>;
  };
  preferences: {
    contentTypes: string[];
    difficultyProgression: 'linear' | 'adaptive' | 'challenge';
    feedbackFrequency: 'immediate' | 'periodic' | 'minimal';
    collaborationLevel: 'solo' | 'peer' | 'group';
  };
  history: {
    viewedContent: string[];
    completedContent: string[];
    ratedContent: Record<string, number>;
    bookmarkedContent: string[];
    searchHistory: string[];
    pathsTaken: string[];
  };
}

interface RecommendationResult {
  contentId: string;
  score: number; // 0-1 confidence score
  reason: string;
  category: 'suggested' | 'trending' | 'similar' | 'next_steps' | 'remedial';
  personalizationFactors: string[];
  metadata: {
    estimatedRelevance: number;
    difficultyMatch: number;
    interestAlignment: number;
    goalAlignment: number;
    timeEstimate: number;
  };
}

interface RecommendationContext {
  sessionType: 'browse' | 'study' | 'review' | 'explore';
  currentContent?: string;
  recentActivity: string[];
  timeAvailable?: number;
  specificNeeds?: string[];
  groupContext?: {
    peers: string[];
    sharedGoals: string[];
  };
}

describe('Content Recommendation System Automation Tests', () => {
  let recommendationEngine: ContentRecommendationEngine;
  let collaborativeService: CollaborativeFilteringService;
  let contentBasedService: ContentBasedFilteringService;
  let hybridService: HybridRecommendationService;
  let personalizationService: PersonalizationService;
  let analyticsService: RecommendationAnalyticsService;
  let mlService: jest.Mocked<MachineLearningService>;
  let profileService: jest.Mocked<UserProfileService>;

  const mockContent: Content[] = [
    {
      id: 'content1',
      title: 'Introduction to Jungian Archetypes',
      type: 'video',
      topic: 'archetypes',
      subtopics: ['collective-unconscious', 'universal-patterns'],
      difficulty: 0.3,
      duration: 25,
      prerequisites: ['basics-jung'],
      learningObjectives: ['understand archetypes', 'identify major archetypes'],
      tags: ['jung', 'psychology', 'archetypes', 'introductory'],
      metadata: {
        popularity: 0.85,
        rating: 4.3,
        completionRate: 0.78,
        effectivenessScore: 0.82,
        authorId: 'instructor1',
        createdAt: new Date('2024-01-15'),
        lastUpdated: new Date('2024-02-01')
      },
      features: {
        hasVideo: true,
        hasAudio: true,
        hasText: true,
        hasInteractivity: false,
        hasAssessment: false
      },
      analytics: {
        views: 1250,
        completions: 975,
        averageTimeSpent: 28,
        userRatings: [4, 5, 4, 5, 3, 4, 5],
        engagementMetrics: {
          clickThrough: 0.85,
          timeOnContent: 0.89,
          interactionRate: 0.65
        }
      }
    },
    {
      id: 'content2',
      title: 'Advanced Shadow Work Techniques',
      type: 'interactive',
      topic: 'shadow-work',
      subtopics: ['shadow-integration', 'personal-unconscious'],
      difficulty: 0.8,
      duration: 45,
      prerequisites: ['content1', 'shadow-basics'],
      learningObjectives: ['practice shadow work', 'integrate shadow aspects'],
      tags: ['shadow', 'advanced', 'practical', 'therapeutic'],
      metadata: {
        popularity: 0.65,
        rating: 4.7,
        completionRate: 0.62,
        effectivenessScore: 0.88,
        authorId: 'instructor2',
        createdAt: new Date('2024-02-10'),
        lastUpdated: new Date('2024-02-20')
      },
      features: {
        hasVideo: false,
        hasAudio: true,
        hasText: true,
        hasInteractivity: true,
        hasAssessment: true
      },
      analytics: {
        views: 650,
        completions: 403,
        averageTimeSpent: 52,
        userRatings: [5, 4, 5, 5, 4],
        engagementMetrics: {
          clickThrough: 0.72,
          timeOnContent: 0.94,
          interactionRate: 0.88
        }
      }
    }
  ];

  const mockUserProfile: UserProfile = {
    id: 'user123',
    demographics: {
      age: 28,
      education: 'bachelor',
      background: 'psychology-student'
    },
    learningProfile: {
      style: 'visual',
      pace: 'medium',
      preferredDifficulty: 'intermediate',
      sessionDuration: 45,
      timeOfDay: 'evening'
    },
    interests: {
      primary: ['jungian-psychology', 'dream-analysis'],
      secondary: ['therapeutic-techniques', 'mythology'],
      emerging: ['active-imagination']
    },
    goals: {
      shortTerm: ['understand-archetypes', 'learn-shadow-work'],
      longTerm: ['become-therapist', 'integrate-jungian-approach'],
      career: ['clinical-psychology', 'analytical-psychology']
    },
    behavior: {
      loginFrequency: 4, // days per week
      averageSessionTime: 42, // minutes
      preferredContentTypes: ['video', 'interactive'],
      completionRate: 0.78,
      engagementPatterns: {
        'evening_study': 0.9,
        'visual_content': 0.85,
        'interactive_exercises': 0.82
      }
    },
    preferences: {
      contentTypes: ['video', 'interactive', 'case_study'],
      difficultyProgression: 'adaptive',
      feedbackFrequency: 'periodic',
      collaborationLevel: 'peer'
    },
    history: {
      viewedContent: ['content1', 'basics-jung', 'intro-psychology'],
      completedContent: ['basics-jung', 'intro-psychology'],
      ratedContent: { 'content1': 4, 'basics-jung': 5 },
      bookmarkedContent: ['content1'],
      searchHistory: ['archetypes', 'shadow work', 'jung theories'],
      pathsTaken: ['beginner-jung-path']
    }
  };

  beforeEach(() => {
    mlService = new MachineLearningService() as jest.Mocked<MachineLearningService>;
    profileService = new UserProfileService() as jest.Mocked<UserProfileService>;

    recommendationEngine = new ContentRecommendationEngine(mlService);
    collaborativeService = new CollaborativeFilteringService();
    contentBasedService = new ContentBasedFilteringService();
    hybridService = new HybridRecommendationService(
      collaborativeService,
      contentBasedService
    );
    personalizationService = new PersonalizationService(profileService);
    analyticsService = new RecommendationAnalyticsService();

    jest.clearAllMocks();
  });

  describe('Content-Based Filtering', () => {
    test('should recommend content based on user preferences and history', async () => {
      profileService.getUserProfile.mockResolvedValue(mockUserProfile);

      const recommendations = await contentBasedService.generateRecommendations({
        userId: mockUserProfile.id,
        availableContent: mockContent,
        maxRecommendations: 5
      });

      expect(recommendations).toHaveLength(2);
      
      // Should prioritize content matching user's interests and difficulty level
      const archetyeContent = recommendations.find(r => r.contentId === 'content1');
      expect(archetyeContent).toBeDefined();
      expect(archetyeContent?.personalizationFactors).toContain('interest_match');
      expect(archetyeContent?.personalizationFactors).toContain('difficulty_appropriate');
    });

    test('should weight content features based on user learning style', async () => {
      const visualLearnerProfile = {
        ...mockUserProfile,
        learningProfile: { ...mockUserProfile.learningProfile, style: 'visual' as const }
      };

      profileService.getUserProfile.mockResolvedValue(visualLearnerProfile);

      const recommendations = await contentBasedService.generateRecommendations({
        userId: visualLearnerProfile.id,
        availableContent: mockContent,
        considerLearningStyle: true
      });

      // Video content should score higher for visual learner
      const videoRec = recommendations.find(r => {
        const content = mockContent.find(c => c.id === r.contentId);
        return content?.features.hasVideo;
      });

      expect(videoRec?.metadata.interestAlignment).toBeGreaterThan(0.8);
      expect(videoRec?.personalizationFactors).toContain('learning_style_match');
    });

    test('should consider content prerequisites and learning progression', async () => {
      const userWithPrereqs = {
        ...mockUserProfile,
        history: {
          ...mockUserProfile.history,
          completedContent: ['basics-jung'] // Has prerequisite for content1
        }
      };

      profileService.getUserProfile.mockResolvedValue(userWithPrereqs);

      const recommendations = await contentBasedService.generateRecommendations({
        userId: userWithPrereqs.id,
        availableContent: mockContent,
        respectPrerequisites: true
      });

      // Should recommend content1 since prerequisites are met
      const eligibleRec = recommendations.find(r => r.contentId === 'content1');
      expect(eligibleRec).toBeDefined();

      // Should not recommend content2 as it requires content1 completion
      const ineligibleRec = recommendations.find(r => r.contentId === 'content2');
      expect(ineligibleRec?.score).toBeLessThan(0.5); // Low score due to missing prereqs
    });

    test('should adapt to user feedback and ratings', async () => {
      const feedbackData = {
        userId: mockUserProfile.id,
        contentRatings: {
          'content1': 5, // Highly rated
          'similar-content': 2 // Poorly rated
        },
        implicitFeedback: {
          'content1': { timeSpent: 30, completed: true },
          'similar-content': { timeSpent: 5, completed: false }
        }
      };

      await contentBasedService.updateUserFeedback(feedbackData);

      const adaptedRecommendations = await contentBasedService.generateRecommendations({
        userId: mockUserProfile.id,
        availableContent: mockContent,
        adaptToFeedback: true
      });

      // Should boost similar content to highly rated items
      const boostedRec = adaptedRecommendations.find(r => r.contentId === 'content1');
      expect(boostedRec?.score).toBeGreaterThan(0.8);
      expect(boostedRec?.personalizationFactors).toContain('positive_feedback');
    });
  });

  describe('Collaborative Filtering', () => {
    test('should recommend content based on similar users\' preferences', async () => {
      const similarUsers = [
        { id: 'user456', similarity: 0.85, preferences: ['archetypes', 'dream-analysis'] },
        { id: 'user789', similarity: 0.78, preferences: ['shadow-work', 'active-imagination'] }
      ];

      mlService.findSimilarUsers.mockResolvedValue(similarUsers);

      const collaborativeRecs = await collaborativeService.generateCollaborativeRecommendations({
        userId: mockUserProfile.id,
        availableContent: mockContent,
        similarityThreshold: 0.7
      });

      expect(mlService.findSimilarUsers).toHaveBeenCalledWith(
        mockUserProfile.id,
        expect.objectContaining({ minSimilarity: 0.7 })
      );

      expect(collaborativeRecs).toHaveLength(2);
      expect(collaborativeRecs[0].personalizationFactors).toContain('similar_users');
      expect(collaborativeRecs[0].metadata.estimatedRelevance).toBeGreaterThan(0.7);
    });

    test('should handle user cold start problem with hybrid approach', async () => {
      const newUserProfile = {
        ...mockUserProfile,
        history: {
          viewedContent: [],
          completedContent: [],
          ratedContent: {},
          bookmarkedContent: [],
          searchHistory: [],
          pathsTaken: []
        }
      };

      // No similar users found for new user
      mlService.findSimilarUsers.mockResolvedValue([]);

      const coldStartRecs = await collaborativeService.generateColdStartRecommendations({
        userId: newUserProfile.id,
        userProfile: newUserProfile,
        availableContent: mockContent,
        fallbackToPopular: true
      });

      // Should fall back to popular/trending content
      expect(coldStartRecs).toHaveLength(2);
      expect(coldStartRecs[0].category).toBe('trending');
      expect(coldStartRecs[0].reason).toContain('popular');
    });

    test('should implement item-based collaborative filtering', async () => {
      const itemSimilarities = {
        'content1': [
          { itemId: 'content2', similarity: 0.65 },
          { itemId: 'related-content', similarity: 0.78 }
        ]
      };

      mlService.calculateItemSimilarities.mockResolvedValue(itemSimilarities);

      // User has interacted with content1
      const itemBasedRecs = await collaborativeService.generateItemBasedRecommendations({
        userId: mockUserProfile.id,
        interactedContent: ['content1'],
        availableContent: mockContent
      });

      expect(itemBasedRecs.some(r => r.contentId === 'content2')).toBe(true);
      expect(itemBasedRecs[0].reason).toContain('similar to content1');
      expect(itemBasedRecs[0].category).toBe('similar');
    });

    test('should consider temporal patterns in collaborative filtering', async () => {
      const temporalData = {
        recentTrends: ['shadow-work', 'active-imagination'],
        seasonalPatterns: { 'spring': ['growth', 'renewal'], 'winter': ['introspection'] },
        currentSeason: 'winter'
      };

      const temporalRecs = await collaborativeService.generateTemporalRecommendations({
        userId: mockUserProfile.id,
        availableContent: mockContent,
        temporalContext: temporalData,
        weightRecent: 0.7
      });

      // Should boost content aligned with seasonal patterns
      const seasonalRec = temporalRecs.find(r => 
        r.personalizationFactors.includes('seasonal_relevance')
      );
      expect(seasonalRec).toBeDefined();
    });
  });

  describe('Hybrid Recommendation System', () => {
    test('should combine multiple recommendation strategies', async () => {
      profileService.getUserProfile.mockResolvedValue(mockUserProfile);
      mlService.findSimilarUsers.mockResolvedValue([
        { id: 'user456', similarity: 0.82, preferences: ['archetypes'] }
      ]);

      const hybridRecs = await hybridService.generateHybridRecommendations({
        userId: mockUserProfile.id,
        availableContent: mockContent,
        strategies: {
          contentBased: { weight: 0.4 },
          collaborative: { weight: 0.35 },
          knowledgeBased: { weight: 0.15 },
          demographic: { weight: 0.1 }
        }
      });

      expect(hybridRecs).toHaveLength(2);
      expect(hybridRecs[0].personalizationFactors).toContain('hybrid_approach');
      
      // Scores should reflect weighted combination
      expect(hybridRecs[0].score).toBeGreaterThan(0.7);
      expect(hybridRecs[0].metadata.estimatedRelevance).toBeGreaterThan(0.75);
    });

    test('should dynamically adjust strategy weights based on context', async () => {
      const browsing Context: RecommendationContext = {
        sessionType: 'explore',
        recentActivity: ['search:shadow', 'view:content1'],
        timeAvailable: 30,
        specificNeeds: ['quick-overview']
      };

      const contextualRecs = await hybridService.generateContextualRecommendations({
        userId: mockUserProfile.id,
        context: browsingContext,
        availableContent: mockContent,
        adaptWeights: true
      });

      // For exploration context, should boost diversity and reduce collaborative weight
      expect(contextualRecs[0].metadata.timeEstimate).toBeLessThanOrEqual(30);
      expect(contextualRecs.map(r => r.contentId)).toHaveLength(
        new Set(contextualRecs.map(r => r.contentId)).size
      ); // Should be diverse
    });

    test('should handle recommendation explanation and transparency', async () => {
      const explainableRecs = await hybridService.generateExplainableRecommendations({
        userId: mockUserProfile.id,
        availableContent: mockContent,
        includeExplanations: true,
        explainationDetail: 'detailed'
      });

      expect(explainableRecs[0].reason).toBeDefined();
      expect(explainableRecs[0].personalizationFactors).toHaveLength(3);
      
      // Should provide specific explanations
      expect(explainableRecs[0].reason).toMatch(
        /because you (showed interest in|completed|rated highly)/i
      );
    });

    test('should optimize for engagement and learning outcomes', async () => {
      const learningObjectives = ['understand-shadow', 'practice-techniques'];
      
      const outcomeOptimizedRecs = await hybridService.generateOutcomeOptimizedRecommendations({
        userId: mockUserProfile.id,
        availableContent: mockContent,
        learningObjectives,
        optimizeFor: 'learning_effectiveness'
      });

      // Should prioritize content with high effectiveness scores
      const effectiveRec = outcomeOptimizedRecs.find(r => {
        const content = mockContent.find(c => c.id === r.contentId);
        return content?.metadata.effectivenessScore > 0.8;
      });

      expect(effectiveRec).toBeDefined();
      expect(effectiveRec?.personalizationFactors).toContain('learning_objective_match');
    });
  });

  describe('Personalization and Adaptation', () => {
    test('should personalize recommendations based on learning progress', async () => {
      const progressData = {
        userId: mockUserProfile.id,
        completedTopics: ['basics-jung'],
        currentLevel: 'beginner',
        strugglingAreas: ['complex-theory'],
        strengths: ['visual-learning', 'practical-application']
      };

      const personalizedRecs = await personalizationService.personalizeByProgress({
        baseRecommendations: await contentBasedService.generateRecommendations({
          userId: mockUserProfile.id,
          availableContent: mockContent
        }),
        progressData,
        adaptDifficulty: true
      });

      // Should avoid content in struggling areas or provide remedial support
      const supportiveRec = personalizedRecs.find(r => 
        r.category === 'remedial' || r.personalizationFactors.includes('remedial_support')
      );
      expect(supportiveRec).toBeDefined();
    });

    test('should adapt to real-time user behavior', async () => {
      const realTimeBehavior = {
        currentSession: {
          startTime: new Date(),
          contentViewed: ['content1'],
          timeSpent: [15], // minutes
          interactions: ['play', 'pause', 'seek'],
          engagement: 0.7
        },
        recentSessions: [
          { date: new Date(Date.now() - 86400000), engagement: 0.8 },
          { date: new Date(Date.now() - 172800000), engagement: 0.6 }
        ]
      };

      const adaptiveRecs = await personalizationService.adaptToRealtimeBehavior({
        userId: mockUserProfile.id,
        availableContent: mockContent,
        behaviorData: realTimeBehavior,
        responsiveness: 'high'
      });

      // Should adjust based on current engagement patterns
      expect(adaptiveRecs[0].metadata.estimatedRelevance).toBeGreaterThan(0.75);
      expect(adaptiveRecs[0].personalizationFactors).toContain('realtime_adaptation');
    });

    test('should provide diversity in recommendations', async () => {
      const diversityConfig = {
        topicDiversity: 0.6, // 60% different topics
        typeDiversity: 0.4, // 40% different content types
        difficultySpread: 0.3, // Include range of difficulties
        authorDiversity: 0.2 // Different instructors
      };

      const diverseRecs = await personalizationService.enhanceDiversity({
        baseRecommendations: await contentBasedService.generateRecommendations({
          userId: mockUserProfile.id,
          availableContent: mockContent
        }),
        diversityConfig,
        maintainRelevance: true
      });

      // Check topic diversity
      const topics = diverseRecs.map(r => {
        const content = mockContent.find(c => c.id === r.contentId);
        return content?.topic;
      });
      const uniqueTopics = new Set(topics);
      expect(uniqueTopics.size / topics.length).toBeGreaterThanOrEqual(0.5);
    });

    test('should handle group-based personalization', async () => {
      const groupContext = {
        groupId: 'study-group-123',
        members: ['user123', 'user456', 'user789'],
        sharedGoals: ['jung-certification'],
        groupDynamics: {
          averageLevel: 'intermediate',
          preferredPace: 'medium',
          collaborationStyle: 'discussion-based'
        }
      };

      const groupRecs = await personalizationService.generateGroupRecommendations({
        groupContext,
        availableContent: mockContent,
        individualProfiles: [mockUserProfile], // Would include all member profiles
        optimizeForGroup: true
      });

      expect(groupRecs[0].personalizationFactors).toContain('group_optimization');
      expect(groupRecs[0].reason).toContain('group');
      
      // Should consider group collaboration features
      const collaborativeContent = groupRecs.find(r => {
        const content = mockContent.find(c => c.id === r.contentId);
        return content?.type === 'interactive' || content?.features.hasAssessment;
      });
      expect(collaborativeContent).toBeDefined();
    });
  });

  describe('Recommendation Analytics and Optimization', () => {
    test('should track recommendation performance metrics', async () => {
      const recommendationSession = {
        userId: mockUserProfile.id,
        sessionId: 'session123',
        recommendations: [
          { contentId: 'content1', score: 0.85, position: 1 },
          { contentId: 'content2', score: 0.72, position: 2 }
        ],
        timestamp: new Date()
      };

      await analyticsService.trackRecommendationSession(recommendationSession);

      // Simulate user actions
      await analyticsService.trackUserAction({
        userId: mockUserProfile.id,
        sessionId: 'session123',
        action: 'click',
        contentId: 'content1',
        position: 1,
        timestamp: new Date()
      });

      const metrics = await analyticsService.getRecommendationMetrics({
        userId: mockUserProfile.id,
        timeframe: 'last_week'
      });

      expect(metrics.clickThroughRate).toBeGreaterThan(0);
      expect(metrics.averagePosition).toBeDefined();
      expect(metrics.diversityScore).toBeDefined();
    });

    test('should perform A/B testing on recommendation algorithms', async () => {
      const abTestConfig = {
        testId: 'recommendation-algorithm-test',
        variants: [
          { name: 'content-based', weight: 0.5 },
          { name: 'collaborative', weight: 0.3 },
          { name: 'hybrid', weight: 0.2 }
        ],
        metrics: ['ctr', 'engagement', 'completion_rate'],
        duration: 30 // days
      };

      const testAssignment = await analyticsService.assignToABTest({
        userId: mockUserProfile.id,
        testConfig: abTestConfig
      });

      expect(testAssignment.variant).toBeOneOf(['content-based', 'collaborative', 'hybrid']);
      expect(testAssignment.testId).toBe('recommendation-algorithm-test');

      // Generate recommendations based on assigned variant
      const testRecommendations = await recommendationEngine.generateRecommendations({
        userId: mockUserProfile.id,
        algorithm: testAssignment.variant,
        availableContent: mockContent
      });

      expect(testRecommendations[0].metadata).toHaveProperty('testVariant');
    });

    test('should optimize recommendation parameters using machine learning', async () => {
      const historicalPerformance = {
        userId: mockUserProfile.id,
        sessions: [
          { recommendations: [{ score: 0.8, ctr: 0.15 }], satisfaction: 0.7 },
          { recommendations: [{ score: 0.9, ctr: 0.25 }], satisfaction: 0.8 }
        ]
      };

      mlService.optimizeRecommendationParameters.mockResolvedValue({
        optimalWeights: { contentBased: 0.45, collaborative: 0.35, demographic: 0.2 },
        expectedImprovement: 0.15,
        confidence: 0.85
      });

      const optimization = await analyticsService.optimizeForUser({
        userId: mockUserProfile.id,
        historicalData: historicalPerformance,
        optimizationGoal: 'user_satisfaction'
      });

      expect(optimization.optimalWeights).toBeDefined();
      expect(optimization.expectedImprovement).toBeGreaterThan(0);
      expect(mlService.optimizeRecommendationParameters).toHaveBeenCalled();
    });

    test('should detect and handle recommendation bias', async () => {
      const biasAnalysis = await analyticsService.analyzeBias({
        userId: mockUserProfile.id,
        recommendations: [
          { contentId: 'content1', author: 'instructor1', topic: 'archetypes' },
          { contentId: 'content2', author: 'instructor1', topic: 'shadow-work' }
        ],
        biasTypes: ['author_bias', 'topic_bias', 'recency_bias']
      });

      expect(biasAnalysis.detectedBiases).toBeDefined();
      if (biasAnalysis.detectedBiases.includes('author_bias')) {
        expect(biasAnalysis.recommendations).toContain('diversify_authors');
      }

      // Should provide debiased recommendations
      const debiasedRecs = await analyticsService.generateDebiasedRecommendations({
        userId: mockUserProfile.id,
        originalRecommendations: await contentBasedService.generateRecommendations({
          userId: mockUserProfile.id,
          availableContent: mockContent
        }),
        biasAnalysis
      });

      const authors = debiasedRecs.map(r => {
        const content = mockContent.find(c => c.id === r.contentId);
        return content?.metadata.authorId;
      });
      expect(new Set(authors).size).toBeGreaterThan(1); // More diverse authors
    });
  });

  describe('Edge Cases and Robustness', () => {
    test('should handle sparse data scenarios', async () => {
      const sparseUser = {
        ...mockUserProfile,
        history: {
          viewedContent: ['content1'],
          completedContent: [],
          ratedContent: {},
          bookmarkedContent: [],
          searchHistory: ['jung'],
          pathsTaken: []
        }
      };

      const sparseDataRecs = await recommendationEngine.generateRecommendations({
        userId: sparseUser.id,
        availableContent: mockContent,
        userProfile: sparseUser,
        handleSparseData: true
      });

      // Should still provide reasonable recommendations
      expect(sparseDataRecs).toHaveLength(2);
      expect(sparseDataRecs[0].score).toBeGreaterThan(0.3);
      expect(sparseDataRecs[0].reason).toContain('limited data');
    });

    test('should handle recommendation system overload', async () => {
      // Simulate high load with many concurrent requests
      const concurrentRequests = Array.from({ length: 100 }, (_, i) => 
        recommendationEngine.generateRecommendations({
          userId: `user${i}`,
          availableContent: mockContent,
          maxRecommendations: 3
        })
      );

      const results = await Promise.allSettled(concurrentRequests);
      const successful = results.filter(r => r.status === 'fulfilled');

      // Should handle load gracefully with circuit breaker or caching
      expect(successful.length).toBeGreaterThan(80); // At least 80% success rate
    });

    test('should handle malformed or missing content data', async () => {
      const corruptedContent = [
        { ...mockContent[0], metadata: null }, // Missing metadata
        { ...mockContent[1], difficulty: undefined }, // Missing difficulty
        { id: 'corrupt', title: undefined } // Severely malformed
      ];

      const robustRecs = await recommendationEngine.generateRecommendations({
        userId: mockUserProfile.id,
        availableContent: corruptedContent as Content[],
        validateContent: true,
        fallbackOnErrors: true
      });

      // Should filter out corrupted content and still provide recommendations
      expect(robustRecs.length).toBeGreaterThan(0);
      expect(robustRecs.every(r => r.contentId !== 'corrupt')).toBe(true);
    });

    test('should handle recommendation cold restart after system failure', async () => {
      // Simulate system restart with lost cache/state
      jest.clearAllMocks();
      
      const coldRestartRecs = await recommendationEngine.generateRecommendations({
        userId: mockUserProfile.id,
        availableContent: mockContent,
        coldStart: true,
        rebuildCache: true
      });

      // Should rebuild recommendations from persistent data
      expect(coldRestartRecs).toHaveLength(2);
      expect(coldRestartRecs[0].score).toBeGreaterThan(0.5);
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.restoreAllMocks();
  });
});

// Helper interfaces and types for testing
interface SimilarUser {
  id: string;
  similarity: number;
  preferences: string[];
}

interface ItemSimilarity {
  itemId: string;
  similarity: number;
}

interface OptimizationResult {
  optimalWeights: Record<string, number>;
  expectedImprovement: number;
  confidence: number;
}

interface BiasAnalysis {
  detectedBiases: string[];
  recommendations: string[];
}

export { 
  SimilarUser, 
  ItemSimilarity, 
  OptimizationResult, 
  BiasAnalysis,
  RecommendationContext 
};