import { AdaptiveLearningEngine } from '../AdaptiveLearningEngine';
import { 
  UserProgress, 
  Module, 
  LearningInsight, 
  AdaptiveLearningData,
  ConceptMastery,
  ResponsePattern 
} from '../../../types';

// Mock the internal classes
jest.mock('../AdaptiveLearningEngine', () => {
  const originalModule = jest.requireActual('../AdaptiveLearningEngine');
  
  class MockKnowledgeTracingModel {
    update(currentKnowledge: number, score: number, difficulty: number): number {
      const performance = score / 100;
      const learningGain = performance * difficulty * 0.3;
      const forgetting = currentKnowledge * 0.05;
      const newKnowledge = currentKnowledge + learningGain - forgetting;
      return Math.max(0, Math.min(1, newKnowledge));
    }
  }

  class MockCollaborativeFilter {
    getRecommendationScore(userProfile: any, module: any): number {
      return Math.random() * 20;
    }
  }

  class MockDifficultyEstimator {
    estimate(module: any, userProfile: any): number {
      const difficultyMap = { beginner: 0.3, intermediate: 0.6, advanced: 0.9 };
      return difficultyMap[module.difficulty];
    }
  }

  class MockForgettingCurvePredictor {
    predict(daysSinceReview: number, initialMastery: number): number {
      const retentionRate = Math.exp(-daysSinceReview / (10 * initialMastery));
      return Math.max(0.1, retentionRate);
    }

    calculateCurve(reviewCount: number, masteryLevel: number): number {
      const stability = Math.min(0.95, 0.5 + (reviewCount * 0.1) + (masteryLevel * 0.3));
      return stability;
    }
  }

  return {
    ...originalModule,
    KnowledgeTracingModel: MockKnowledgeTracingModel,
    CollaborativeFilter: MockCollaborativeFilter,
    DifficultyEstimator: MockDifficultyEstimator,
    ForgettingCurvePredictor: MockForgettingCurvePredictor
  };
});

describe('AdaptiveLearningEngine', () => {
  let engine: AdaptiveLearningEngine;
  let mockUserProgress: UserProgress;
  let mockModules: Module[];
  let mockAdaptiveLearningData: AdaptiveLearningData;

  beforeEach(() => {
    engine = new AdaptiveLearningEngine();

    // Mock adaptive learning data
    mockAdaptiveLearningData = {
      knowledgeState: {
        'jung-biography': 0.8,
        'analytical-psychology': 0.6,
        'archetypes': 0.4,
        'collective-unconscious': 0.7
      },
      learningRate: 1.2,
      difficultyPreference: 0.6,
      responsePatterns: [
        {
          questionType: 'multiple-choice',
          avgResponseTime: 30,
          accuracy: 0.85,
          confidence: 0.9
        },
        {
          questionType: 'true-false',
          avgResponseTime: 15,
          accuracy: 0.92,
          confidence: 0.95
        }
      ],
      conceptMastery: {
        'jung-biography': {
          concept: 'jung-biography',
          level: 0.8,
          lastReviewed: new Date('2024-01-15'),
          reviewCount: 5,
          forgettingCurve: 0.85
        },
        'analytical-psychology': {
          concept: 'analytical-psychology',
          level: 0.6,
          lastReviewed: new Date('2024-01-10'),
          reviewCount: 3,
          forgettingCurve: 0.75
        }
      }
    };

    // Mock user progress
    mockUserProgress = {
      userId: 'test-user-123',
      completedModules: ['module-1', 'module-2'],
      quizScores: {
        'intro-quiz': 85,
        'archetype-quiz': 75,
        'types-quiz': 90
      },
      totalTime: 7200, // 2 hours
      lastAccessed: Date.now(),
      notes: [],
      adaptiveLearningData: mockAdaptiveLearningData
    };

    // Mock modules
    mockModules = [
      {
        id: 'module-1',
        title: 'Introduction to Jung',
        description: 'Basic introduction to Jungian psychology',
        difficulty: 'beginner',
        estimatedTime: 60,
        prerequisites: [],
        learningObjectives: ['Understand Jung basics', 'Learn key concepts'],
        content: {
          introduction: 'Introduction text',
          sections: [
            {
              id: 'section-1',
              title: 'Jung Biography',
              content: 'Content about Jung',
              order: 1,
              concepts: ['jung-biography', 'early-life']
            }
          ]
        }
      },
      {
        id: 'module-2',
        title: 'Advanced Archetypes',
        description: 'Deep dive into Jungian archetypes',
        difficulty: 'advanced',
        estimatedTime: 90,
        prerequisites: ['module-1'],
        learningObjectives: ['Master archetypes', 'Apply concepts'],
        content: {
          introduction: 'Advanced introduction',
          sections: [
            {
              id: 'section-2',
              title: 'Shadow and Anima',
              content: 'Advanced archetype content',
              order: 1,
              concepts: ['shadow', 'anima-animus', 'collective-unconscious']
            }
          ]
        }
      },
      {
        id: 'module-3',
        title: 'Psychological Types',
        description: 'Understanding Jung psychological types',
        difficulty: 'intermediate',
        estimatedTime: 75,
        prerequisites: ['module-1'],
        learningObjectives: ['Understand types', 'Identify patterns'],
        content: {
          introduction: 'Types introduction',
          sections: [
            {
              id: 'section-3',
              title: 'Introversion vs Extraversion',
              content: 'Types content',
              order: 1,
              concepts: ['psychological-types', 'introversion', 'extraversion']
            }
          ]
        }
      }
    ];
  });

  describe('analyzeLearningPatterns', () => {
    it('should return learning insights for user with adaptive data', () => {
      const insights = engine.analyzeLearningPatterns(mockUserProgress);

      expect(insights).toBeInstanceOf(Array);
      expect(insights.length).toBeGreaterThan(0);

      // Verify insight structure
      insights.forEach(insight => {
        expect(insight).toHaveProperty('id');
        expect(insight).toHaveProperty('type');
        expect(insight).toHaveProperty('title');
        expect(insight).toHaveProperty('description');
        expect(insight).toHaveProperty('confidence');
        expect(insight).toHaveProperty('date');
        expect(insight.date).toBeInstanceOf(Date);
        
        expect(['strength', 'weakness', 'recommendation', 'milestone']).toContain(insight.type);
        expect(typeof insight.confidence).toBe('number');
        expect(insight.confidence).toBeGreaterThanOrEqual(0);
        expect(insight.confidence).toBeLessThanOrEqual(1);
      });
    });

    it('should return empty array for user without adaptive data', () => {
      const userWithoutAdaptiveData: UserProgress = {
        ...mockUserProgress,
        adaptiveLearningData: undefined
      };

      const insights = engine.analyzeLearningPatterns(userWithoutAdaptiveData);

      expect(insights).toEqual([]);
    });

    it('should include insights about response patterns', () => {
      const insights = engine.analyzeLearningPatterns(mockUserProgress);
      
      const responsePatternInsights = insights.filter(
        insight => insight.title.toLowerCase().includes('response') || 
                  insight.description.toLowerCase().includes('pattern')
      );

      expect(responsePatternInsights.length).toBeGreaterThan(0);
    });

    it('should include insights about mastery trends', () => {
      const insights = engine.analyzeLearningPatterns(mockUserProgress);
      
      const masteryInsights = insights.filter(
        insight => insight.title.toLowerCase().includes('mastery') || 
                  insight.description.toLowerCase().includes('progress')
      );

      expect(masteryInsights.length).toBeGreaterThan(0);
    });

    it('should include insights about learning velocity for fast learners', () => {
      const fastLearnerProgress: UserProgress = {
        ...mockUserProgress,
        adaptiveLearningData: {
          ...mockAdaptiveLearningData,
          learningRate: 1.5 // High learning rate
        }
      };

      const insights = engine.analyzeLearningPatterns(fastLearnerProgress);
      
      const velocityInsights = insights.filter(
        insight => insight.title.toLowerCase().includes('pace') || 
                  insight.description.toLowerCase().includes('learning')
      );

      expect(velocityInsights.length).toBeGreaterThan(0);
    });
  });

  describe('recommendContent', () => {
    it('should recommend appropriate modules based on user profile', () => {
      const recommendations = engine.recommendContent(mockUserProgress, mockModules);

      expect(recommendations).toBeInstanceOf(Array);
      expect(recommendations.length).toBeLessThanOrEqual(5);
      expect(recommendations.length).toBeGreaterThan(0);

      recommendations.forEach(module => {
        expect(module).toHaveProperty('id');
        expect(module).toHaveProperty('title');
        expect(module).toHaveProperty('difficulty');
        expect(['beginner', 'intermediate', 'advanced']).toContain(module.difficulty);
      });
    });

    it('should prioritize modules matching knowledge gaps', () => {
      const userWithLowKnowledge: UserProgress = {
        ...mockUserProgress,
        adaptiveLearningData: {
          ...mockAdaptiveLearningData,
          knowledgeState: {
            'archetypes': 0.1, // Very low knowledge
            'jung-biography': 0.9 // High knowledge
          }
        }
      };

      const recommendations = engine.recommendContent(userWithLowKnowledge, mockModules);

      // Should recommend modules covering archetypes over jung-biography
      const archetypeModules = recommendations.filter(
        module => module.content?.sections?.some(
          section => section.keyTerms?.some(term => 
            term.term === 'shadow' || term.term === 'anima-animus'
          )
        )
      );

      expect(archetypeModules.length).toBeGreaterThan(0);
    });

    it('should handle empty available content gracefully', () => {
      const recommendations = engine.recommendContent(mockUserProgress, []);

      expect(recommendations).toEqual([]);
    });

    it('should handle user without adaptive data', () => {
      const userWithoutData: UserProgress = {
        ...mockUserProgress,
        adaptiveLearningData: undefined
      };

      const recommendations = engine.recommendContent(userWithoutData, mockModules);

      expect(recommendations).toBeInstanceOf(Array);
      expect(recommendations.length).toBeLessThanOrEqual(5);
    });

    it('should use collaborative filtering in scoring', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.5);

      const recommendations = engine.recommendContent(mockUserProgress, mockModules);

      expect(recommendations.length).toBeGreaterThan(0);
      
      jest.restoreAllMocks();
    });
  });

  describe('calculateNextDifficulty', () => {
    it('should calculate appropriate difficulty for known concept', () => {
      const difficulty = engine.calculateNextDifficulty(mockUserProgress, 'jung-biography');

      expect(typeof difficulty).toBe('number');
      expect(difficulty).toBeGreaterThanOrEqual(0.1);
      expect(difficulty).toBeLessThanOrEqual(0.95);
    });

    it('should return default difficulty for user without adaptive data', () => {
      const userWithoutData: UserProgress = {
        ...mockUserProgress,
        adaptiveLearningData: undefined
      };

      const difficulty = engine.calculateNextDifficulty(userWithoutData, 'any-concept');

      expect(difficulty).toBe(0.5);
    });

    it('should return easier difficulty for new concepts', () => {
      const difficulty = engine.calculateNextDifficulty(mockUserProgress, 'unknown-concept');

      expect(difficulty).toBe(0.3);
    });

    it('should consider forgetting curve in difficulty calculation', () => {
      const oldConceptData: UserProgress = {
        ...mockUserProgress,
        adaptiveLearningData: {
          ...mockAdaptiveLearningData,
          conceptMastery: {
            'old-concept': {
              concept: 'old-concept',
              level: 0.8,
              lastReviewed: new Date('2023-01-01'), // Very old review
              reviewCount: 1,
              forgettingCurve: 0.3
            }
          }
        }
      };

      const difficulty = engine.calculateNextDifficulty(oldConceptData, 'old-concept');

      expect(difficulty).toBeLessThan(0.8); // Should be lower due to forgetting
    });

    it('should adjust for learning rate', () => {
      const fastLearnerData: UserProgress = {
        ...mockUserProgress,
        adaptiveLearningData: {
          ...mockAdaptiveLearningData,
          learningRate: 2.0 // Very fast learner
        }
      };

      const difficulty = engine.calculateNextDifficulty(fastLearnerData, 'jung-biography');

      expect(difficulty).toBeGreaterThan(0.1);
      expect(difficulty).toBeLessThanOrEqual(0.95);
    });
  });

  describe('updateAdaptiveData', () => {
    const mockQuizResult = {
      score: 85,
      concept: 'analytical-psychology',
      difficulty: 0.7,
      timeSpent: 45
    };

    it('should update user progress with new quiz result', () => {
      const updatedProgress = engine.updateAdaptiveData(mockUserProgress, mockQuizResult);

      expect(updatedProgress).toHaveProperty('adaptiveLearningData');
      expect(updatedProgress.adaptiveLearningData).toBeDefined();

      const adaptiveData = updatedProgress.adaptiveLearningData!;
      
      // Check knowledge state update
      expect(adaptiveData.knowledgeState).toHaveProperty('analytical-psychology');
      expect(typeof adaptiveData.knowledgeState['analytical-psychology']).toBe('number');

      // Check concept mastery update
      expect(adaptiveData.conceptMastery).toHaveProperty('analytical-psychology');
      const mastery = adaptiveData.conceptMastery['analytical-psychology'];
      expect(mastery.concept).toBe('analytical-psychology');
      expect(mastery.reviewCount).toBeGreaterThan(0);
      expect(mastery.lastReviewed).toBeInstanceOf(Date);
      expect(typeof mastery.level).toBe('number');
      expect(typeof mastery.forgettingCurve).toBe('number');

      // Check learning rate update
      expect(typeof adaptiveData.learningRate).toBe('number');
      expect(adaptiveData.learningRate).toBeGreaterThan(0.1);
      expect(adaptiveData.learningRate).toBeLessThanOrEqual(3.0);

      // Check response patterns update
      expect(adaptiveData.responsePatterns.length).toBeGreaterThan(0);
      const latestPattern = adaptiveData.responsePatterns[adaptiveData.responsePatterns.length - 1];
      expect(latestPattern.avgResponseTime).toBe(mockQuizResult.timeSpent);
      expect(latestPattern.accuracy).toBe(mockQuizResult.score / 100);
      expect(typeof latestPattern.confidence).toBe('number');
    });

    it('should initialize adaptive data for user without existing data', () => {
      const userWithoutData: UserProgress = {
        ...mockUserProgress,
        adaptiveLearningData: undefined
      };

      const updatedProgress = engine.updateAdaptiveData(userWithoutData, mockQuizResult);

      expect(updatedProgress.adaptiveLearningData).toBeDefined();
      const adaptiveData = updatedProgress.adaptiveLearningData!;

      expect(adaptiveData.knowledgeState).toHaveProperty('analytical-psychology');
      expect(adaptiveData.knowledgeState['analytical-psychology']).toBeGreaterThan(0);
      expect(adaptiveData.learningRate).toBe(1.0);
      expect(adaptiveData.difficultyPreference).toBe(0.5);
      expect(adaptiveData.responsePatterns).toHaveLength(1);
      expect(adaptiveData.conceptMastery).toHaveProperty('analytical-psychology');
    });

    it('should limit response patterns to last 50 entries', () => {
      const userWithManyPatterns: UserProgress = {
        ...mockUserProgress,
        adaptiveLearningData: {
          ...mockAdaptiveLearningData,
          responsePatterns: new Array(55).fill({
            questionType: 'multiple-choice',
            avgResponseTime: 30,
            accuracy: 0.8,
            confidence: 0.85
          })
        }
      };

      const updatedProgress = engine.updateAdaptiveData(userWithManyPatterns, mockQuizResult);

      expect(updatedProgress.adaptiveLearningData!.responsePatterns.length).toBe(50);
    });

    it('should handle new concepts correctly', () => {
      const newConceptResult = {
        score: 70,
        concept: 'completely-new-concept',
        difficulty: 0.5,
        timeSpent: 60
      };

      const updatedProgress = engine.updateAdaptiveData(mockUserProgress, newConceptResult);
      const adaptiveData = updatedProgress.adaptiveLearningData!;

      expect(adaptiveData.knowledgeState).toHaveProperty('completely-new-concept');
      expect(adaptiveData.conceptMastery).toHaveProperty('completely-new-concept');

      const newConceptMastery = adaptiveData.conceptMastery['completely-new-concept'];
      expect(newConceptMastery.concept).toBe('completely-new-concept');
      expect(newConceptMastery.reviewCount).toBe(1);
      expect(newConceptMastery.level).toBeGreaterThanOrEqual(0);
      expect(newConceptMastery.level).toBeLessThanOrEqual(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null/undefined user progress gracefully', () => {
      expect(() => {
        engine.analyzeLearningPatterns(null as any);
      }).not.toThrow();

      expect(() => {
        engine.recommendContent(null as any, mockModules);
      }).not.toThrow();

      expect(() => {
        engine.calculateNextDifficulty(null as any, 'concept');
      }).not.toThrow();
    });

    it('should handle empty quiz scores', () => {
      const userWithEmptyScores: UserProgress = {
        ...mockUserProgress,
        quizScores: {}
      };

      const recommendations = engine.recommendContent(userWithEmptyScores, mockModules);
      expect(recommendations).toBeInstanceOf(Array);

      const difficulty = engine.calculateNextDifficulty(userWithEmptyScores, 'concept');
      expect(typeof difficulty).toBe('number');
    });

    it('should handle extreme learning rates', () => {
      const extremeUserData: UserProgress = {
        ...mockUserProgress,
        adaptiveLearningData: {
          ...mockAdaptiveLearningData,
          learningRate: 100 // Extreme learning rate
        }
      };

      const quizResult = { score: 95, concept: 'test', difficulty: 0.8, timeSpent: 10 };
      const updatedProgress = engine.updateAdaptiveData(extremeUserData, quizResult);

      expect(updatedProgress.adaptiveLearningData!.learningRate).toBeLessThanOrEqual(3.0);
      expect(updatedProgress.adaptiveLearningData!.learningRate).toBeGreaterThanOrEqual(0.1);
    });

    it('should handle invalid concept mastery data', () => {
      const invalidMasteryData: UserProgress = {
        ...mockUserProgress,
        adaptiveLearningData: {
          ...mockAdaptiveLearningData,
          conceptMastery: {
            'invalid-concept': {
              concept: 'invalid-concept',
              level: -1, // Invalid level
              lastReviewed: new Date('invalid-date'),
              reviewCount: -5, // Invalid count
              forgettingCurve: 2 // Invalid curve
            }
          }
        }
      };

      expect(() => {
        engine.analyzeLearningPatterns(invalidMasteryData);
      }).not.toThrow();

      expect(() => {
        engine.calculateNextDifficulty(invalidMasteryData, 'invalid-concept');
      }).not.toThrow();
    });
  });

  describe('Collaborative Filtering', () => {
    it('should incorporate collaborative filtering scores in recommendations', () => {
      const mockRandomValue = 0.8;
      jest.spyOn(Math, 'random').mockReturnValue(mockRandomValue);

      const recommendations = engine.recommendContent(mockUserProgress, mockModules);

      expect(recommendations.length).toBeGreaterThan(0);
      
      jest.restoreAllMocks();
    });

    it('should handle collaborative filtering with similar user patterns', () => {
      // Test that collaborative filtering component is being called
      const recommendations = engine.recommendContent(mockUserProgress, mockModules);

      expect(recommendations).toBeInstanceOf(Array);
      recommendations.forEach(module => {
        expect(module).toHaveProperty('id');
        expect(module).toHaveProperty('difficulty');
      });
    });
  });

  describe('Knowledge Tracing Model', () => {
    it('should update knowledge state using Bayesian knowledge tracing', () => {
      const initialKnowledge = 0.5;
      const score = 80;
      const difficulty = 0.7;

      const result = engine.updateAdaptiveData(mockUserProgress, {
        score,
        concept: 'test-concept',
        difficulty,
        timeSpent: 30
      });

      const updatedKnowledge = result.adaptiveLearningData!.knowledgeState['test-concept'];
      expect(typeof updatedKnowledge).toBe('number');
      expect(updatedKnowledge).toBeGreaterThanOrEqual(0);
      expect(updatedKnowledge).toBeLessThanOrEqual(1);
    });

    it('should apply learning gain and forgetting factors', () => {
      const highPerformanceResult = {
        score: 95,
        concept: 'high-perf-concept',
        difficulty: 0.8,
        timeSpent: 25
      };

      const lowPerformanceResult = {
        score: 40,
        concept: 'low-perf-concept',
        difficulty: 0.8,
        timeSpent: 60
      };

      const highPerfProgress = engine.updateAdaptiveData(mockUserProgress, highPerformanceResult);
      const lowPerfProgress = engine.updateAdaptiveData(mockUserProgress, lowPerformanceResult);

      const highKnowledge = highPerfProgress.adaptiveLearningData!.knowledgeState['high-perf-concept'];
      const lowKnowledge = lowPerfProgress.adaptiveLearningData!.knowledgeState['low-perf-concept'];

      // High performance should result in higher knowledge gain
      expect(highKnowledge).toBeGreaterThan(lowKnowledge);
    });
  });

  describe('Performance and Integration', () => {
    it('should handle large datasets efficiently', () => {
      const largeModuleSet = Array.from({ length: 1000 }, (_, i) => ({
        ...mockModules[0],
        id: `module-${i}`,
        title: `Module ${i}`
      }));

      const start = performance.now();
      const recommendations = engine.recommendContent(mockUserProgress, largeModuleSet);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      expect(recommendations.length).toBeLessThanOrEqual(5);
    });

    it('should provide consistent results for same inputs', () => {
      const result1 = engine.calculateNextDifficulty(mockUserProgress, 'jung-biography');
      const result2 = engine.calculateNextDifficulty(mockUserProgress, 'jung-biography');

      expect(result1).toBe(result2);
    });

    it('should maintain data integrity across multiple updates', () => {
      let progress = mockUserProgress;
      const concepts = ['concept-1', 'concept-2', 'concept-3'];

      concepts.forEach((concept, index) => {
        progress = engine.updateAdaptiveData(progress, {
          score: 75 + (index * 5),
          concept,
          difficulty: 0.5 + (index * 0.1),
          timeSpent: 30 + (index * 10)
        });
      });

      const adaptiveData = progress.adaptiveLearningData!;
      
      expect(Object.keys(adaptiveData.knowledgeState)).toHaveLength(7); // 4 from mock + 3 new concepts
      
      expect(Object.keys(adaptiveData.conceptMastery)).toHaveLength(
        Object.keys(mockAdaptiveLearningData.conceptMastery).length + concepts.length
      );

      concepts.forEach(concept => {
        expect(adaptiveData.knowledgeState).toHaveProperty(concept);
        expect(adaptiveData.conceptMastery).toHaveProperty(concept);
        expect(adaptiveData.conceptMastery[concept].reviewCount).toBe(1);
      });
    });
  });
});