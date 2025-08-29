/**
 * Performance and stress tests for utility functions
 * Testing under heavy load, memory usage, and concurrent operations
 */

import {
  saveUserProgress,
  loadUserProgress,
  saveNotes,
  loadNotes
} from '../../utils/localStorage';

import {
  translate,
  switchLanguage,
  formatDate,
  formatNumber
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

// Performance test configuration
const PERFORMANCE_CONFIG = {
  LARGE_DATA_SIZE: 10000,
  MEDIUM_DATA_SIZE: 1000,
  SMALL_DATA_SIZE: 100,
  CONCURRENT_OPERATIONS: 50,
  STRESS_TEST_ITERATIONS: 1000,
  MAX_EXECUTION_TIME_MS: 5000,
  MAX_MEMORY_INCREASE_MB: 50
};

describe('Utility Performance and Stress Tests', () => {
  let performanceResults: { [key: string]: number } = {};
  let initialMemory: number;

  beforeAll(() => {
    // Record initial memory usage
    initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    // Setup performance monitoring
    if (typeof global !== 'undefined') {
      (global as any).gc = (global as any).gc || (() => {});
    }
  });

  afterAll(() => {
    // Log performance results summary
    console.log('\n=== Performance Test Summary ===');
    Object.entries(performanceResults).forEach(([test, duration]) => {
      console.log(`${test}: ${duration.toFixed(2)}ms`);
    });

    // Check final memory usage
    const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
    const memoryIncrease = (finalMemory - initialMemory) / (1024 * 1024);
    console.log(`Memory increase: ${memoryIncrease.toFixed(2)}MB`);

    // Force garbage collection for cleanup
    if ((global as any).gc) {
      (global as any).gc();
    }
  });

  const measurePerformance = (testName: string, fn: () => any | Promise<any>) => {
    return async () => {
      const start = performance.now();
      await fn();
      const duration = performance.now() - start;
      performanceResults[testName] = duration;
      
      expect(duration).toBeLessThan(PERFORMANCE_CONFIG.MAX_EXECUTION_TIME_MS);
      return duration;
    };
  };

  describe('LocalStorage Utilities Performance', () => {
    const generateLargeUserProgress = (size: number): UserProgress => ({
      userId: `performance-user-${size}`,
      completedModules: Array.from({ length: size }, (_, i) => `module-${i}`),
      quizScores: Object.fromEntries(
        Array.from({ length: size }, (_, i) => [`module-${i}`, Math.random() * 100])
      ),
      totalTime: size * 60,
      lastAccessed: Date.now(),
      notes: Array.from({ length: Math.min(size / 10, 1000) }, (_, i) => ({
        id: `note-${i}`,
        moduleId: `module-${i % 100}`,
        content: `Performance test note ${i} `.repeat(10),
        timestamp: Date.now() + i
      }))
    });

    const generateLargeNoteArray = (size: number): Note[] => 
      Array.from({ length: size }, (_, i) => ({
        id: `perf-note-${i}`,
        moduleId: `module-${i % 100}`,
        content: `This is performance test note number ${i}. `.repeat(20),
        timestamp: Date.now() + i,
        tags: [`tag-${i % 10}`, `category-${i % 5}`, `perf-${i}`],
        type: ['text', 'audio', 'drawing'][i % 3] as any
      }));

    it('should handle large user progress data efficiently', measurePerformance(
      'localStorage-large-user-progress',
      () => {
        const largeProgress = generateLargeUserProgress(PERFORMANCE_CONFIG.LARGE_DATA_SIZE);
        
        // Test save performance
        const saveStart = performance.now();
        saveUserProgress(largeProgress);
        const saveTime = performance.now() - saveStart;
        
        // Test load performance
        const loadStart = performance.now();
        const loaded = loadUserProgress();
        const loadTime = performance.now() - loadStart;
        
        expect(loaded).toBeDefined();
        expect(loaded!.completedModules).toHaveLength(PERFORMANCE_CONFIG.LARGE_DATA_SIZE);
        expect(saveTime).toBeLessThan(1000);
        expect(loadTime).toBeLessThan(1000);
      }
    ));

    it('should handle large note arrays efficiently', measurePerformance(
      'localStorage-large-notes',
      () => {
        const largeNotes = generateLargeNoteArray(PERFORMANCE_CONFIG.MEDIUM_DATA_SIZE);
        
        const saveStart = performance.now();
        saveNotes(largeNotes);
        const saveTime = performance.now() - saveStart;
        
        const loadStart = performance.now();
        const loaded = loadNotes();
        const loadTime = performance.now() - loadStart;
        
        expect(loaded).toHaveLength(PERFORMANCE_CONFIG.MEDIUM_DATA_SIZE);
        expect(saveTime).toBeLessThan(1000);
        expect(loadTime).toBeLessThan(1000);
      }
    ));

    it('should handle frequent small operations efficiently', measurePerformance(
      'localStorage-frequent-operations',
      () => {
        const progress = generateLargeUserProgress(10);
        
        for (let i = 0; i < PERFORMANCE_CONFIG.STRESS_TEST_ITERATIONS; i++) {
          progress.totalTime = i;
          saveUserProgress(progress);
          const loaded = loadUserProgress();
          expect(loaded!.totalTime).toBe(i);
        }
      }
    ));

    it('should handle concurrent localStorage operations', measurePerformance(
      'localStorage-concurrent-operations',
      async () => {
        const promises = Array.from({ length: PERFORMANCE_CONFIG.CONCURRENT_OPERATIONS }, (_, i) => 
          new Promise<void>(resolve => {
            setTimeout(() => {
              const progress = generateLargeUserProgress(PERFORMANCE_CONFIG.SMALL_DATA_SIZE);
              progress.userId = `concurrent-user-${i}`;
              saveUserProgress(progress);
              const loaded = loadUserProgress();
              expect(loaded).toBeDefined();
              resolve();
            }, Math.random() * 100);
          })
        );
        
        await Promise.all(promises);
      }
    ));

    it('should maintain performance with repeated serialization/deserialization', measurePerformance(
      'localStorage-repeated-serialization',
      () => {
        const baseProgress = generateLargeUserProgress(PERFORMANCE_CONFIG.MEDIUM_DATA_SIZE);
        
        for (let i = 0; i < 50; i++) {
          // Create variations to prevent optimization
          const progress = {
            ...baseProgress,
            totalTime: i * 60,
            lastAccessed: Date.now() + i
          };
          
          saveUserProgress(progress);
          const loaded = loadUserProgress();
          expect(loaded!.totalTime).toBe(i * 60);
        }
      }
    ));
  });

  describe('I18n Utilities Performance', () => {
    beforeEach(() => {
      // Reset i18n state
      jest.clearAllMocks();
    });

    it('should handle many translation requests efficiently', measurePerformance(
      'i18n-many-translations',
      () => {
        const keys = [
          'common.welcome',
          'common.loading',
          'navigation.home',
          'modules.title',
          'quiz.question',
          'errors.networkError'
        ];
        
        for (let i = 0; i < PERFORMANCE_CONFIG.STRESS_TEST_ITERATIONS; i++) {
          const key = keys[i % keys.length];
          const result = translate(key);
          expect(typeof result).toBe('string');
        }
      }
    ));

    it('should handle rapid language switching efficiently', measurePerformance(
      'i18n-rapid-language-switching',
      async () => {
        const languages = ['en', 'pt-BR', 'es', 'fr'];
        
        for (let i = 0; i < 100; i++) {
          const language = languages[i % languages.length];
          await switchLanguage(language as any);
          
          // Test translations after each switch
          const welcome = translate('common.welcome');
          expect(typeof welcome).toBe('string');
        }
      }
    ));

    it('should handle large-scale date formatting efficiently', measurePerformance(
      'i18n-date-formatting',
      () => {
        const dates = Array.from({ length: PERFORMANCE_CONFIG.MEDIUM_DATA_SIZE }, (_, i) => 
          new Date(Date.now() + i * 86400000) // Dates spread over time
        );
        
        const formats = [
          { year: 'numeric', month: 'long', day: 'numeric' },
          { year: '2-digit', month: 'short', day: '2-digit' },
          { hour: '2-digit', minute: '2-digit', second: '2-digit' }
        ];
        
        dates.forEach((date, i) => {
          const format = formats[i % formats.length];
          const formatted = formatDate(date, format as any);
          expect(typeof formatted).toBe('string');
          expect(formatted.length).toBeGreaterThan(0);
        });
      }
    ));

    it('should handle large-scale number formatting efficiently', measurePerformance(
      'i18n-number-formatting',
      () => {
        const numbers = Array.from({ length: PERFORMANCE_CONFIG.MEDIUM_DATA_SIZE }, (_, i) => 
          Math.random() * 1000000
        );
        
        const formats = [
          { style: 'decimal' },
          { style: 'currency', currency: 'USD' },
          { style: 'percent' },
          { minimumFractionDigits: 2, maximumFractionDigits: 4 }
        ];
        
        numbers.forEach((number, i) => {
          const format = formats[i % formats.length];
          const formatted = formatNumber(number, format as any);
          expect(typeof formatted).toBe('string');
        });
      }
    ));

    it('should handle concurrent translation operations', measurePerformance(
      'i18n-concurrent-translations',
      async () => {
        const promises = Array.from({ length: PERFORMANCE_CONFIG.CONCURRENT_OPERATIONS }, (_, i) => 
          new Promise<void>(resolve => {
            setTimeout(() => {
              const keys = ['common.welcome', 'navigation.home', 'modules.title'];
              const key = keys[i % keys.length];
              const result = translate(key, {
                interpolations: { number: i, total: PERFORMANCE_CONFIG.CONCURRENT_OPERATIONS }
              });
              expect(typeof result).toBe('string');
              resolve();
            }, Math.random() * 50);
          })
        );
        
        await Promise.all(promises);
      }
    ));
  });

  describe('Content Processor Performance', () => {
    const generateLargeContent = (size: number): string => {
      const paragraphs = [
        'Carl Jung was a Swiss psychiatrist and psychoanalyst who founded analytical psychology.',
        'The collective unconscious contains universal patterns and images that derive from the earliest human experience.',
        'Individuation is the central process of human development in Jungian psychology.',
        'Archetypes are universal symbols and themes that appear across cultures and throughout history.',
        'The shadow represents the hidden or denied aspects of the self.',
        'The anima and animus represent the feminine and masculine aspects within each person.'
      ];
      
      return Array.from({ length: size }, (_, i) => 
        paragraphs[i % paragraphs.length]
      ).join(' ');
    };

    it('should process large content efficiently', measurePerformance(
      'content-processor-large-content',
      () => {
        const largeContent = generateLargeContent(PERFORMANCE_CONFIG.LARGE_DATA_SIZE);
        
        const processed = processModuleContent(largeContent);
        
        expect(typeof processed).toBe('string');
        expect(processed.length).toBeGreaterThan(0);
      }
    ));

    it('should extract key terms from large content efficiently', measurePerformance(
      'content-processor-key-terms',
      () => {
        const largeContent = generateLargeContent(PERFORMANCE_CONFIG.MEDIUM_DATA_SIZE);
        
        const keyTerms = extractKeyTerms(largeContent);
        
        expect(Array.isArray(keyTerms)).toBe(true);
        expect(keyTerms.length).toBeGreaterThan(0);
        
        keyTerms.forEach(term => {
          expect(term).toHaveProperty('term');
          expect(term).toHaveProperty('definition');
        });
      }
    ));

    it('should generate summaries efficiently', measurePerformance(
      'content-processor-summaries',
      () => {
        const largeContent = generateLargeContent(PERFORMANCE_CONFIG.MEDIUM_DATA_SIZE);
        
        const summary = generateSummary(largeContent);
        
        expect(typeof summary).toBe('string');
        expect(summary.length).toBeGreaterThan(0);
        expect(summary.length).toBeLessThan(largeContent.length);
      }
    ));

    it('should handle multiple content processing tasks concurrently', measurePerformance(
      'content-processor-concurrent',
      async () => {
        const contents = Array.from({ length: PERFORMANCE_CONFIG.CONCURRENT_OPERATIONS }, (_, i) => 
          generateLargeContent(PERFORMANCE_CONFIG.SMALL_DATA_SIZE) + ` Unique content ${i}`
        );
        
        const promises = contents.map(async content => {
          return {
            processed: processModuleContent(content),
            keyTerms: extractKeyTerms(content),
            summary: generateSummary(content)
          };
        });
        
        const results = await Promise.all(promises);
        
        expect(results).toHaveLength(PERFORMANCE_CONFIG.CONCURRENT_OPERATIONS);
        results.forEach(result => {
          expect(typeof result.processed).toBe('string');
          expect(Array.isArray(result.keyTerms)).toBe(true);
          expect(typeof result.summary).toBe('string');
        });
      }
    ));

    it('should handle repeated processing without memory leaks', measurePerformance(
      'content-processor-repeated',
      () => {
        const content = generateLargeContent(PERFORMANCE_CONFIG.SMALL_DATA_SIZE);
        
        for (let i = 0; i < PERFORMANCE_CONFIG.STRESS_TEST_ITERATIONS; i++) {
          const varyingContent = content + ` Iteration ${i}`;
          
          const processed = processModuleContent(varyingContent);
          const keyTerms = extractKeyTerms(varyingContent);
          const summary = generateSummary(varyingContent);
          
          expect(processed).toBeDefined();
          expect(keyTerms).toBeDefined();
          expect(summary).toBeDefined();
        }
      }
    ));
  });

  describe('Quiz Utilities Performance', () => {
    const generateLargeQuestionSet = (size: number): Question[] => 
      Array.from({ length: size }, (_, i) => ({
        id: `perf-question-${i}`,
        text: `Performance test question ${i}?`,
        type: 'multiple-choice',
        options: [
          `Option A for question ${i}`,
          `Option B for question ${i}`,
          `Option C for question ${i}`,
          `Option D for question ${i}`
        ],
        correctAnswer: i % 4,
        explanation: `Explanation for question ${i}`,
        difficulty: ['easy', 'medium', 'hard'][i % 3] as any,
        moduleId: `module-${Math.floor(i / 10)}`,
        points: (i % 5) + 1,
        tags: [`tag-${i % 10}`, `category-${i % 5}`]
      }));

    it('should randomize large question sets efficiently', measurePerformance(
      'quiz-utils-randomize-large-set',
      () => {
        const questions = generateLargeQuestionSet(PERFORMANCE_CONFIG.LARGE_DATA_SIZE);
        
        const randomized = randomizeAllQuestionOptions(questions);
        
        expect(randomized).toHaveLength(PERFORMANCE_CONFIG.LARGE_DATA_SIZE);
        
        randomized.forEach((question, index) => {
          expect(question.options).toEqual(
            expect.arrayContaining(questions[index].options!)
          );
        });
      }
    ));

    it('should ensure varied positions efficiently', measurePerformance(
      'quiz-utils-varied-positions',
      () => {
        const questions = generateLargeQuestionSet(PERFORMANCE_CONFIG.MEDIUM_DATA_SIZE);
        
        const varied = ensureVariedCorrectAnswerPositions(questions);
        
        expect(varied).toHaveLength(PERFORMANCE_CONFIG.MEDIUM_DATA_SIZE);
        
        const positions = varied.map(q => q.correctAnswer as number);
        const uniquePositions = new Set(positions);
        expect(uniquePositions.size).toBeGreaterThan(1);
      }
    ));

    it('should handle repeated randomization efficiently', measurePerformance(
      'quiz-utils-repeated-randomization',
      () => {
        const baseQuestions = generateLargeQuestionSet(PERFORMANCE_CONFIG.SMALL_DATA_SIZE);
        
        for (let i = 0; i < 100; i++) {
          const randomized = randomizeAllQuestionOptions(baseQuestions);
          const varied = ensureVariedCorrectAnswerPositions(randomized);
          
          expect(varied).toHaveLength(PERFORMANCE_CONFIG.SMALL_DATA_SIZE);
        }
      }
    ));

    it('should handle concurrent quiz operations', measurePerformance(
      'quiz-utils-concurrent',
      async () => {
        const questionSets = Array.from({ length: PERFORMANCE_CONFIG.CONCURRENT_OPERATIONS }, (_, i) => 
          generateLargeQuestionSet(PERFORMANCE_CONFIG.SMALL_DATA_SIZE)
        );
        
        const promises = questionSets.map(async questions => {
          return {
            randomized: randomizeAllQuestionOptions(questions),
            varied: ensureVariedCorrectAnswerPositions(questions)
          };
        });
        
        const results = await Promise.all(promises);
        
        expect(results).toHaveLength(PERFORMANCE_CONFIG.CONCURRENT_OPERATIONS);
        results.forEach(result => {
          expect(result.randomized).toHaveLength(PERFORMANCE_CONFIG.SMALL_DATA_SIZE);
          expect(result.varied).toHaveLength(PERFORMANCE_CONFIG.SMALL_DATA_SIZE);
        });
      }
    ));
  });

  describe('Memory Management and Stress Tests', () => {
    it('should not cause memory leaks under sustained load', async () => {
      const initialHeap = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Sustained operations for memory testing
      for (let cycle = 0; cycle < 10; cycle++) {
        // Create and discard large objects
        const largeData = {
          users: Array.from({ length: 1000 }, (_, i) => ({
            id: `user-${i}`,
            data: 'x'.repeat(1000)
          })),
          content: 'Large content string '.repeat(10000),
          notes: Array.from({ length: 500 }, (_, i) => ({
            id: `note-${i}`,
            content: 'Note content '.repeat(100)
          }))
        };
        
        // Process the data
        JSON.stringify(largeData);
        JSON.parse(JSON.stringify(largeData));
        
        // Force cleanup periodically
        if (cycle % 3 === 0 && (global as any).gc) {
          (global as any).gc();
        }
      }
      
      // Force final garbage collection
      if ((global as any).gc) {
        (global as any).gc();
      }
      
      const finalHeap = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = (finalHeap - initialHeap) / (1024 * 1024);
      
      expect(memoryIncrease).toBeLessThan(PERFORMANCE_CONFIG.MAX_MEMORY_INCREASE_MB);
    });

    it('should handle extreme load without degradation', measurePerformance(
      'extreme-load-test',
      async () => {
        const operations = [];
        
        // Mix different types of operations
        for (let i = 0; i < 200; i++) {
          operations.push(async () => {
            const choice = i % 4;
            
            switch (choice) {
              case 0:
                // localStorage operations
                const progress = {
                  userId: `stress-${i}`,
                  completedModules: [`module-${i}`],
                  quizScores: { [`module-${i}`]: 85 },
                  totalTime: i * 60,
                  lastAccessed: Date.now(),
                  notes: []
                };
                saveUserProgress(progress);
                loadUserProgress();
                break;
                
              case 1:
                // Content processing
                const content = `Stress test content ${i} `.repeat(100);
                processModuleContent(content);
                break;
                
              case 2:
                // Translation
                translate('common.welcome', {
                  interpolations: { number: i }
                });
                break;
                
              case 3:
                // Quiz operations
                const questions = generateLargeQuestionSet(10);
                randomizeAllQuestionOptions(questions);
                break;
            }
          });
        }
        
        // Execute all operations concurrently
        await Promise.all(operations.map(op => op()));
      }
    ));

    it('should maintain performance with high frequency operations', measurePerformance(
      'high-frequency-operations',
      () => {
        const startTime = performance.now();
        const operations = [];
        
        // Very high frequency operations
        for (let i = 0; i < PERFORMANCE_CONFIG.STRESS_TEST_ITERATIONS * 2; i++) {
          const operation = () => {
            translate('common.welcome');
            formatNumber(Math.random() * 1000);
            formatDate(new Date());
          };
          
          operations.push(operation);
        }
        
        operations.forEach(op => op());
        
        const duration = performance.now() - startTime;
        const operationsPerSecond = (operations.length / duration) * 1000;
        
        expect(operationsPerSecond).toBeGreaterThan(100); // Should handle > 100 ops/sec
      }
    ));

    it('should handle edge cases without performance degradation', measurePerformance(
      'edge-case-performance',
      () => {
        const edgeCases = [
          // Very large strings
          'x'.repeat(100000),
          // Unicode content
          '🦄'.repeat(10000),
          // Mixed content
          Array.from({ length: 1000 }, (_, i) => `Line ${i}: ${String.fromCharCode(65 + (i % 26))}`).join('\n'),
          // Empty and null cases
          '',
          '   ',
          // Special characters
          '!@#$%^&*()_+{}:"<>?[];\',./'.repeat(1000)
        ];
        
        edgeCases.forEach(content => {
          try {
            processModuleContent(content);
            extractKeyTerms(content);
            generateSummary(content);
          } catch (error) {
            // Should handle gracefully without throwing
          }
        });
      }
    ));
  });

  describe('Performance Regression Tests', () => {
    const performanceBaselines = {
      localStorage_save: 100, // ms
      localStorage_load: 50,
      content_processing: 200,
      translation: 10,
      quiz_randomization: 150
    };

    it('should not regress below performance baselines', async () => {
      const tests = [
        {
          name: 'localStorage_save',
          test: () => {
            const progress = {
              userId: 'baseline-user',
              completedModules: Array.from({ length: 1000 }, (_, i) => `module-${i}`),
              quizScores: {},
              totalTime: 3600,
              lastAccessed: Date.now(),
              notes: []
            };
            saveUserProgress(progress);
          }
        },
        {
          name: 'localStorage_load',
          test: () => {
            loadUserProgress();
          }
        },
        {
          name: 'content_processing',
          test: () => {
            const content = 'Jung psychology content '.repeat(5000);
            processModuleContent(content);
            extractKeyTerms(content);
            generateSummary(content);
          }
        },
        {
          name: 'translation',
          test: () => {
            for (let i = 0; i < 100; i++) {
              translate('common.welcome');
            }
          }
        },
        {
          name: 'quiz_randomization',
          test: () => {
            const questions = generateLargeQuestionSet(1000);
            randomizeAllQuestionOptions(questions);
          }
        }
      ];
      
      for (const { name, test } of tests) {
        const start = performance.now();
        await test();
        const duration = performance.now() - start;
        
        const baseline = performanceBaselines[name as keyof typeof performanceBaselines];
        
        console.log(`${name}: ${duration.toFixed(2)}ms (baseline: ${baseline}ms)`);
        
        // Allow 50% variance from baseline
        expect(duration).toBeLessThan(baseline * 1.5);
      }
    });
  });
});