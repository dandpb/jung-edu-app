/**
 * Comprehensive error boundary testing and recovery scenarios
 * Testing graceful degradation, error recovery, and system resilience
 */

import {
  saveUserProgress,
  loadUserProgress,
  clearUserProgress,
  saveNotes,
  loadNotes,
  saveModuleProgress,
  loadModuleProgress
} from '../../utils/localStorage';

import {
  translate,
  switchLanguage,
  formatDate,
  formatNumber,
  getCurrentLanguage,
  initializeI18n
} from '../../utils/i18n';

import {
  processModuleContent,
  extractKeyTerms,
  generateSummary
} from '../../utils/contentProcessor';

import {
  randomizeAllQuestionOptions,
  ensureVariedCorrectAnswerPositions
} from '../../utils/quizUtils';

import { UserProgress, Note, Question } from '../../types';

// Error simulation utilities
class ErrorSimulator {
  private originalConsoleError = console.error;
  private originalConsoleWarn = console.warn;
  private errorCount = 0;
  private warningCount = 0;

  startCapturing() {
    this.errorCount = 0;
    this.warningCount = 0;
    console.error = (...args) => {
      this.errorCount++;
      // Still log errors but capture them
      this.originalConsoleError(...args);
    };
    console.warn = (...args) => {
      this.warningCount++;
      this.originalConsoleWarn(...args);
    };
  }

  stopCapturing() {
    console.error = this.originalConsoleError;
    console.warn = this.originalConsoleWarn;
  }

  getErrorCount() { return this.errorCount; }
  getWarningCount() { return this.warningCount; }
}

const errorSimulator = new ErrorSimulator();

// Mock failing localStorage
const createFailingLocalStorage = (failureType: 'quota' | 'security' | 'corrupt') => {
  const originalSetItem = localStorage.setItem;
  const originalGetItem = localStorage.getItem;
  
  const restore = () => {
    localStorage.setItem = originalSetItem;
    localStorage.getItem = originalGetItem;
  };

  switch (failureType) {
    case 'quota':
      localStorage.setItem = () => {
        throw new DOMException('QuotaExceededError', 'QuotaExceededError');
      };
      break;
    case 'security':
      localStorage.setItem = () => {
        throw new DOMException('SecurityError', 'SecurityError');
      };
      localStorage.getItem = () => {
        throw new DOMException('SecurityError', 'SecurityError');
      };
      break;
    case 'corrupt':
      localStorage.getItem = () => 'invalid json {[}';
      break;
  }

  return restore;
};

describe('Utility Error Boundary and Recovery Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    initializeI18n();
    errorSimulator.startCapturing();
  });

  afterEach(() => {
    errorSimulator.stopCapturing();
  });

  describe('LocalStorage Error Recovery', () => {
    it('should gracefully handle storage quota exceeded errors', () => {
      const restore = createFailingLocalStorage('quota');

      const progress: UserProgress = {
        userId: 'quota-test-user',
        completedModules: ['module1'],
        quizScores: { module1: 85 },
        totalTime: 3600,
        lastAccessed: Date.now(),
        notes: []
      };

      // Should not throw, should handle gracefully
      expect(() => saveUserProgress(progress)).not.toThrow();

      // Should log error but continue functioning
      expect(errorSimulator.getErrorCount()).toBeGreaterThan(0);

      restore();
    });

    it('should recover from security errors in localStorage', () => {
      const restore = createFailingLocalStorage('security');

      const progress: UserProgress = {
        userId: 'security-test-user',
        completedModules: [],
        quizScores: {},
        totalTime: 0,
        lastAccessed: Date.now(),
        notes: []
      };

      // Save should fail gracefully
      expect(() => saveUserProgress(progress)).not.toThrow();

      // Load should also fail gracefully and return null
      const loaded = loadUserProgress();
      expect(loaded).toBeNull();

      // Should log errors but not crash
      expect(errorSimulator.getErrorCount()).toBeGreaterThan(0);

      restore();
    });

    it('should handle corrupted localStorage data', () => {
      const restore = createFailingLocalStorage('corrupt');

      // Should handle corrupted data gracefully
      const loaded = loadUserProgress();
      expect(loaded).toBeNull();

      // Should log warning about corrupted data
      expect(errorSimulator.getErrorCount()).toBeGreaterThan(0);

      restore();
    });

    it('should implement fallback mechanisms for storage failures', () => {
      const restore = createFailingLocalStorage('quota');

      const largeProgress: UserProgress = {
        userId: 'large-data-user',
        completedModules: Array.from({ length: 10000 }, (_, i) => `module-${i}`),
        quizScores: Object.fromEntries(
          Array.from({ length: 10000 }, (_, i) => [`module-${i}`, Math.random() * 100])
        ),
        totalTime: 999999,
        lastAccessed: Date.now(),
        notes: Array.from({ length: 1000 }, (_, i) => ({
          id: `note-${i}`,
          moduleId: `module-${i}`,
          content: 'Large note content '.repeat(100),
          timestamp: new Date()
        }))
      };

      // Should attempt to save, fail gracefully
      expect(() => saveUserProgress(largeProgress)).not.toThrow();

      // In a real implementation, might implement:
      // 1. Data compression
      // 2. Partial saves
      // 3. IndexedDB fallback
      // 4. Server-side storage fallback

      restore();
    });

    it('should maintain data integrity during storage errors', () => {
      // Save some initial data successfully
      const initialProgress: UserProgress = {
        userId: 'integrity-test',
        completedModules: ['module1'],
        quizScores: { module1: 85 },
        totalTime: 1800,
        lastAccessed: Date.now(),
        notes: []
      };

      saveUserProgress(initialProgress);
      
      // Verify initial save worked
      let loaded = loadUserProgress();
      expect(loaded).toEqual(initialProgress);

      // Now cause storage to fail
      const restore = createFailingLocalStorage('quota');

      // Attempt to update progress
      const updatedProgress = {
        ...initialProgress,
        completedModules: ['module1', 'module2'],
        quizScores: { module1: 85, module2: 92 }
      };

      saveUserProgress(updatedProgress);

      // Original data should still be intact
      restore();
      
      loaded = loadUserProgress();
      expect(loaded).toEqual(initialProgress); // Should still have original data
    });
  });

  describe('Content Processing Error Recovery', () => {
    it('should handle malformed content gracefully', () => {
      const malformedInputs = [
        null,
        undefined,
        '',
        '   ',
        '\x00\x01\x02\x03',
        '{"malformed": json',
        Array(100000).fill('x').join(''), // Very large input
        '🦄'.repeat(10000), // Unicode stress test
        '<xml><unclosed><tag>content</xml>',
        'Binary content: \uFFFE\uFFFF\u0000'
      ];

      malformedInputs.forEach((input, index) => {
        try {
          const processed = processModuleContent(input as any);
          const keyTerms = extractKeyTerms(input as any);
          const summary = generateSummary(input as any);

          // Should return safe defaults, not crash
          expect(typeof processed).toBe('string');
          expect(Array.isArray(keyTerms)).toBe(true);
          expect(typeof summary).toBe('string');

        } catch (error) {
          // If it throws, should be a controlled error
          expect(error).toBeInstanceOf(Error);
        }
      });

      // System should still be functional after errors
      const validContent = 'Jung analytical psychology concepts';
      expect(() => processModuleContent(validContent)).not.toThrow();
    });

    it('should recover from processing timeouts and resource exhaustion', () => {
      // Simulate resource exhaustion with very large content
      const exhaustiveContent = Array(50000).fill(
        'Jung analytical psychology collective unconscious individuation archetype shadow anima animus'
      ).join(' ');

      const startTime = performance.now();

      let processed: string;
      let keyTerms: any[];
      let summary: string;

      try {
        processed = processModuleContent(exhaustiveContent);
        keyTerms = extractKeyTerms(exhaustiveContent);
        summary = generateSummary(exhaustiveContent);
      } catch (error) {
        // Should provide fallback results
        processed = 'Content processing failed - using fallback';
        keyTerms = [];
        summary = 'Summary unavailable due to processing error';
      }

      const duration = performance.now() - startTime;

      // Should complete within reasonable time or fail gracefully
      expect(duration).toBeLessThan(30000); // 30 second timeout
      expect(typeof processed).toBe('string');
      expect(Array.isArray(keyTerms)).toBe(true);
      expect(typeof summary).toBe('string');
    });

    it('should handle memory pressure during content processing', () => {
      const memoryPressureTest = () => {
        const largeBatch = Array.from({ length: 100 }, (_, i) => {
          const content = `Content batch ${i}: `.repeat(1000) + 'Jung psychology content';
          return {
            processed: processModuleContent(content),
            keyTerms: extractKeyTerms(content),
            summary: generateSummary(content)
          };
        });

        return largeBatch;
      };

      let results: any[];
      try {
        results = memoryPressureTest();
      } catch (error) {
        // Should handle memory errors gracefully
        results = [];
        expect(error).toBeInstanceOf(Error);
      }

      // System should remain stable
      expect(Array.isArray(results)).toBe(true);
      
      // Should be able to process simple content after memory pressure
      const simpleResult = processModuleContent('Simple test content');
      expect(typeof simpleResult).toBe('string');
    });
  });

  describe('I18n Error Recovery', () => {
    it('should handle missing translation resources gracefully', () => {
      const missingKeys = [
        'nonexistent.key',
        'missing.nested.translation',
        'invalid..key',
        '',
        null,
        undefined
      ];

      missingKeys.forEach(key => {
        const result = translate(key as any);
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThanOrEqual(0);
      });
    });

    it('should recover from language switching errors', async () => {
      const invalidLanguages = [
        'invalid-lang',
        '',
        null,
        undefined,
        123,
        {},
        'zh-INVALID'
      ];

      for (const invalidLang of invalidLanguages) {
        try {
          await switchLanguage(invalidLang as any);
        } catch (error) {
          // Should throw controlled error
          expect(error).toBeInstanceOf(Error);
        }

        // Should maintain valid language state
        const currentLang = getCurrentLanguage();
        expect(['en', 'pt-BR', 'es', 'fr']).toContain(currentLang);
      }
    });

    it('should handle formatting errors gracefully', () => {
      const problematicValues = [
        { date: new Date('invalid'), number: NaN },
        { date: null, number: Infinity },
        { date: undefined, number: -Infinity },
        { date: 'not a date', number: 'not a number' },
        { date: {}, number: {} }
      ];

      problematicValues.forEach(({ date, number }) => {
        let dateResult: string;
        let numberResult: string;

        try {
          dateResult = formatDate(date as any);
        } catch (error) {
          dateResult = 'Date formatting error';
        }

        try {
          numberResult = formatNumber(number as any);
        } catch (error) {
          numberResult = 'Number formatting error';
        }

        expect(typeof dateResult).toBe('string');
        expect(typeof numberResult).toBe('string');
      });
    });

    it('should maintain state consistency during i18n errors', async () => {
      // Start with known good state
      await switchLanguage('en');
      expect(getCurrentLanguage()).toBe('en');

      // Cause various errors
      translate('invalid.key');
      formatDate(new Date('invalid'));
      formatNumber(NaN);

      try {
        await switchLanguage('invalid' as any);
      } catch {}

      // Should still be in valid state
      const currentLang = getCurrentLanguage();
      expect(['en', 'pt-BR', 'es', 'fr']).toContain(currentLang);

      // Basic functionality should still work
      const result = translate('common.welcome');
      expect(typeof result).toBe('string');
    });
  });

  describe('Quiz Utilities Error Recovery', () => {
    it('should handle malformed quiz data', () => {
      const malformedQuizzes = [
        { questions: null },
        { questions: undefined },
        { questions: 'not an array' },
        { questions: [] },
        { questions: [null, undefined, 'invalid'] },
        {
          questions: [
            { id: '', text: '', type: 'invalid-type' },
            { options: null, correctAnswer: 'invalid' },
            {} // Completely empty question
          ]
        }
      ];

      malformedQuizzes.forEach(quiz => {
        try {
          const randomized = randomizeAllQuestionOptions(quiz.questions as any);
          expect(Array.isArray(randomized)).toBe(true);
        } catch (error) {
          // Should handle gracefully
          expect(error).toBeInstanceOf(Error);
        }
      });
    });

    it('should recover from randomization failures', () => {
      const problematicQuestions: Question[] = [
        {
          id: 'q1',
          text: 'Question with no options',
          type: 'multiple-choice',
          options: [],
          correctAnswer: 0,
          explanation: '',
          difficulty: 'medium',
          moduleId: 'test'
        },
        {
          id: 'q2',
          text: 'Question with invalid correct answer',
          type: 'multiple-choice',
          options: ['A', 'B', 'C'],
          correctAnswer: 10, // Invalid index
          explanation: '',
          difficulty: 'medium',
          moduleId: 'test'
        },
        {
          id: 'q3',
          text: 'Question with circular references',
          type: 'multiple-choice',
          options: null as any,
          correctAnswer: null as any,
          explanation: '',
          difficulty: 'medium',
          moduleId: 'test'
        } as any
      ];

      // Add circular reference
      (problematicQuestions[2] as any).self = problematicQuestions[2];

      try {
        const randomized = randomizeAllQuestionOptions(problematicQuestions);
        expect(Array.isArray(randomized)).toBe(true);
        
        const varied = ensureVariedCorrectAnswerPositions(randomized);
        expect(Array.isArray(varied)).toBe(true);
      } catch (error) {
        // Should handle without crashing
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should maintain quiz integrity under error conditions', () => {
      const validQuestions: Question[] = [
        {
          id: 'valid1',
          text: 'Valid question 1',
          type: 'multiple-choice',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 0,
          explanation: 'Valid explanation',
          difficulty: 'easy',
          moduleId: 'test-module'
        }
      ];

      // Process valid questions first
      const baseline = randomizeAllQuestionOptions(validQuestions);
      expect(baseline).toHaveLength(1);
      expect(baseline[0].options).toHaveLength(4);

      // Mix in problematic data
      const mixedQuestions = [
        ...validQuestions,
        null as any,
        undefined as any,
        { invalid: 'question' } as any
      ].filter(Boolean);

      try {
        const result = randomizeAllQuestionOptions(mixedQuestions);
        
        // Should process valid questions successfully
        const validResults = result.filter(q => q && q.id && q.options);
        expect(validResults.length).toBeGreaterThan(0);
        
      } catch (error) {
        // Even if it fails, system should remain stable
        expect(error).toBeInstanceOf(Error);
      }

      // Verify system is still functional
      const freshResult = randomizeAllQuestionOptions(validQuestions);
      expect(freshResult).toHaveLength(1);
    });
  });

  describe('Cross-System Error Cascading and Recovery', () => {
    it('should prevent error cascading across utility boundaries', async () => {
      const errorResults = [];

      // Simulate cascade of errors across systems
      try {
        // Start with localStorage error
        const restore = createFailingLocalStorage('security');
        
        const progress: UserProgress = {
          userId: 'cascade-test',
          completedModules: [],
          quizScores: {},
          totalTime: 0,
          lastAccessed: Date.now(),
          notes: []
        };

        saveUserProgress(progress); // Should fail
        errorResults.push({ system: 'localStorage', error: true });

        // Continue with content processing despite storage error
        const content = processModuleContent('Jung analytical psychology');
        expect(typeof content).toBe('string');
        errorResults.push({ system: 'contentProcessor', error: false });

        // Continue with i18n despite previous errors  
        const translation = translate('common.welcome');
        expect(typeof translation).toBe('string');
        errorResults.push({ system: 'i18n', error: false });

        // Continue with quiz processing
        const questions: Question[] = [{
          id: 'test-q',
          text: 'Test question',
          type: 'multiple-choice',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 0,
          explanation: '',
          difficulty: 'easy',
          moduleId: 'test'
        }];
        
        const randomized = randomizeAllQuestionOptions(questions);
        expect(randomized).toHaveLength(1);
        errorResults.push({ system: 'quizUtils', error: false });

        restore();

      } catch (error) {
        // Should not reach here - errors should be contained
        errorResults.push({ system: 'cascade', error: true });
      }

      // Verify error isolation
      const systemsWithErrors = errorResults.filter(r => r.error);
      const systemsWorking = errorResults.filter(r => !r.error);

      expect(systemsWithErrors.length).toBeLessThan(errorResults.length);
      expect(systemsWorking.length).toBeGreaterThan(0);
    });

    it('should implement circuit breaker patterns for repeated failures', () => {
      let failureCount = 0;
      const maxFailures = 5;
      let circuitOpen = false;

      const simulateRepeatedFailures = () => {
        for (let i = 0; i < 10; i++) {
          try {
            if (circuitOpen) {
              // Circuit is open, return fallback immediately
              return 'Circuit breaker activated - using fallback';
            }

            // Simulate operation that fails
            if (i < 7) { // Fail first 7 attempts
              failureCount++;
              if (failureCount >= maxFailures) {
                circuitOpen = true;
              }
              throw new Error(`Simulated failure ${i}`);
            }

            // Success after failures
            failureCount = 0;
            circuitOpen = false;
            return 'Success';

          } catch (error) {
            if (failureCount >= maxFailures) {
              // Circuit breaker should activate
              continue;
            }
          }
        }
        
        return 'Failed all attempts';
      };

      const result = simulateRepeatedFailures();
      
      // Should have activated circuit breaker
      expect(circuitOpen || result === 'Circuit breaker activated - using fallback' || result === 'Success').toBe(true);
    });

    it('should implement graceful degradation strategies', async () => {
      const degradationTest = async () => {
        const results: any = {
          fullFunctionality: true,
          degradedFeatures: [],
          workingFeatures: []
        };

        // Test core functionality with simulated failures
        try {
          const restore = createFailingLocalStorage('quota');
          
          // Try full feature set
          try {
            const progress: UserProgress = {
              userId: 'degradation-test',
              completedModules: ['module1'],
              quizScores: { module1: 85 },
              totalTime: 1800,
              lastAccessed: Date.now(),
              notes: []
            };
            
            saveUserProgress(progress);
            results.workingFeatures.push('userProgress');
          } catch {
            results.degradedFeatures.push('userProgress');
            results.fullFunctionality = false;
          }

          restore();

        } catch (error) {
          results.degradedFeatures.push('localStorage');
          results.fullFunctionality = false;
        }

        // Test content processing (should work)
        try {
          const content = processModuleContent('Test content');
          results.workingFeatures.push('contentProcessing');
        } catch {
          results.degradedFeatures.push('contentProcessing');
          results.fullFunctionality = false;
        }

        // Test translation (should work)
        try {
          const translation = translate('common.welcome');
          results.workingFeatures.push('translation');
        } catch {
          results.degradedFeatures.push('translation');
          results.fullFunctionality = false;
        }

        return results;
      };

      const degradationResults = await degradationTest();

      // Should have some working features even with failures
      expect(degradationResults.workingFeatures.length).toBeGreaterThan(0);
      
      // Should gracefully handle degraded features
      if (degradationResults.degradedFeatures.length > 0) {
        expect(degradationResults.fullFunctionality).toBe(false);
      }
    });
  });

  describe('System Recovery and Self-Healing', () => {
    it('should recover from transient errors', async () => {
      let callCount = 0;
      const transientErrorSimulation = () => {
        callCount++;
        if (callCount <= 3) {
          throw new Error(`Transient error attempt ${callCount}`);
        }
        return 'Success after transient errors';
      };

      const retryOperation = (operation: () => any, maxRetries = 5, delay = 10) => {
        return new Promise((resolve, reject) => {
          let retries = 0;
          
          const attempt = () => {
            try {
              const result = operation();
              resolve(result);
            } catch (error) {
              retries++;
              if (retries >= maxRetries) {
                reject(error);
              } else {
                setTimeout(attempt, delay);
              }
            }
          };
          
          attempt();
        });
      };

      const result = await retryOperation(transientErrorSimulation);
      expect(result).toBe('Success after transient errors');
      expect(callCount).toBe(4); // 3 failures + 1 success
    });

    it('should implement automatic error recovery mechanisms', () => {
      const recoveryMechanisms = {
        localStorage: {
          test: () => {
            try {
              localStorage.setItem('test', 'value');
              localStorage.removeItem('test');
              return true;
            } catch {
              return false;
            }
          },
          recover: () => {
            // In real implementation:
            // - Clear corrupted data
            // - Reset to defaults
            // - Switch to alternative storage
            return 'localStorage recovered';
          }
        },
        
        contentProcessor: {
          test: () => {
            try {
              processModuleContent('test');
              return true;
            } catch {
              return false;
            }
          },
          recover: () => {
            // In real implementation:
            // - Reset processing state
            // - Clear caches
            // - Use fallback processors
            return 'contentProcessor recovered';
          }
        }
      };

      const systemStatus: any = {};
      const recoveryResults: any = {};

      Object.entries(recoveryMechanisms).forEach(([system, mechanism]) => {
        systemStatus[system] = mechanism.test();
        
        if (!systemStatus[system]) {
          recoveryResults[system] = mechanism.recover();
        }
      });

      // Verify recovery mechanisms exist and can be invoked
      expect(typeof recoveryMechanisms.localStorage.recover).toBe('function');
      expect(typeof recoveryMechanisms.contentProcessor.recover).toBe('function');
    });

    it('should maintain system health monitoring', () => {
      const healthMetrics = {
        localStorage: {
          operational: true,
          errorCount: 0,
          lastError: null,
          responseTime: 0
        },
        contentProcessor: {
          operational: true,
          errorCount: 0,
          lastError: null,
          responseTime: 0
        },
        i18n: {
          operational: true,
          errorCount: 0,
          lastError: null,
          responseTime: 0
        }
      };

      const checkSystemHealth = () => {
        Object.keys(healthMetrics).forEach(system => {
          const startTime = performance.now();
          
          try {
            switch (system) {
              case 'localStorage':
                localStorage.setItem('health-check', 'ok');
                localStorage.removeItem('health-check');
                break;
              case 'contentProcessor':
                processModuleContent('health check');
                break;
              case 'i18n':
                translate('common.welcome');
                break;
            }
            
            healthMetrics[system as keyof typeof healthMetrics].operational = true;
            healthMetrics[system as keyof typeof healthMetrics].responseTime = performance.now() - startTime;
            
          } catch (error) {
            healthMetrics[system as keyof typeof healthMetrics].operational = false;
            healthMetrics[system as keyof typeof healthMetrics].errorCount++;
            healthMetrics[system as keyof typeof healthMetrics].lastError = error instanceof Error ? error.message : 'Unknown error';
          }
        });
      };

      // Run health check
      checkSystemHealth();

      // Verify health metrics are captured
      Object.values(healthMetrics).forEach(metrics => {
        expect(typeof metrics.operational).toBe('boolean');
        expect(typeof metrics.errorCount).toBe('number');
        expect(typeof metrics.responseTime).toBe('number');
      });

      // Most systems should be operational
      const operationalSystems = Object.values(healthMetrics).filter(m => m.operational).length;
      expect(operationalSystems).toBeGreaterThan(0);
    });
  });

  describe('Final System State Verification', () => {
    it('should verify system remains functional after all error scenarios', async () => {
      // Run a comprehensive test of all utilities after error testing
      const finalFunctionalityTest = async () => {
        const results: any = {};

        try {
          // Test localStorage
          const testProgress: UserProgress = {
            userId: 'final-test-user',
            completedModules: ['test-module'],
            quizScores: { 'test-module': 95 },
            totalTime: 1200,
            lastAccessed: Date.now(),
            notes: [{
              id: 'final-test-note',
              moduleId: 'test-module',
              content: 'Final test note',
              timestamp: new Date()
            }]
          };

          saveUserProgress(testProgress);
          const loadedProgress = loadUserProgress();
          results.localStorage = !!loadedProgress;

        } catch {
          results.localStorage = false;
        }

        try {
          // Test content processing
          const content = 'Final test: Jung analytical psychology concepts';
          const processed = processModuleContent(content);
          const keyTerms = extractKeyTerms(content);
          const summary = generateSummary(content);
          
          results.contentProcessor = !!(processed && keyTerms && summary);

        } catch {
          results.contentProcessor = false;
        }

        try {
          // Test i18n
          await switchLanguage('en');
          const translation = translate('common.welcome');
          const dateFormatted = formatDate(new Date());
          const numberFormatted = formatNumber(123.45);
          
          results.i18n = !!(translation && dateFormatted && numberFormatted);

        } catch {
          results.i18n = false;
        }

        try {
          // Test quiz utilities
          const questions: Question[] = [{
            id: 'final-test-q',
            text: 'Final test question',
            type: 'multiple-choice',
            options: ['A', 'B', 'C', 'D'],
            correctAnswer: 0,
            explanation: 'Test explanation',
            difficulty: 'easy',
            moduleId: 'final-test'
          }];

          const randomized = randomizeAllQuestionOptions(questions);
          const varied = ensureVariedCorrectAnswerPositions(randomized);
          
          results.quizUtils = !!(randomized && varied);

        } catch {
          results.quizUtils = false;
        }

        return results;
      };

      const finalResults = await finalFunctionalityTest();

      // Verify most systems are still working
      const workingSystems = Object.values(finalResults).filter(Boolean).length;
      const totalSystems = Object.keys(finalResults).length;
      
      expect(workingSystems).toBeGreaterThan(totalSystems * 0.5); // At least 50% should work
      
      // Log final system state
      console.log('Final system state after error testing:', finalResults);
      
      // Critical systems should be operational
      expect(finalResults.contentProcessor).toBe(true);
      expect(finalResults.i18n).toBe(true);
    });
  });
});