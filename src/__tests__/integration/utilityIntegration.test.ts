/**
 * Integration tests combining multiple utilities in realistic usage scenarios
 * Testing end-to-end workflows and utility interactions
 */

import {
  saveUserProgress,
  loadUserProgress,
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
  ensureVariedCorrectAnswerPositions,
  randomizeQuestionOptions
} from '../../utils/quizUtils';

import {
  createMockUser,
  createMockModule,
  createMockQuiz,
  createMockNote
} from '../../test-utils/helpers/testHelpers';

import { UserProgress, Module, Quiz, Note, Question } from '../../types';

// Mock localStorage for integration tests
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get store() { return store; },
    set store(newStore) { store = newStore; }
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

describe('Utility Integration Tests', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    initializeI18n();
    jest.clearAllMocks();
  });

  describe('Learning Session Workflow', () => {
    it('should complete a full learning session with internationalization', async () => {
      // Step 1: Initialize user session
      const user = createMockUser({
        name: 'Integration Test User',
        email: 'integration@test.com'
      });

      // Step 2: Set up language preference
      await switchLanguage('pt-BR');
      expect(getCurrentLanguage()).toBe('pt-BR');

      // Step 3: Create and process module content
      const moduleContent = `
        Carl Jung foi um psiquiatra suíço que fundou a psicologia analítica.
        Seus conceitos incluem o inconsciente coletivo, arquétipos e individuação.
        O processo de individuação é central para o desenvolvimento psicológico.
      `;

      const processedContent = processModuleContent(moduleContent);
      const keyTerms = extractKeyTerms(moduleContent);
      const summary = generateSummary(moduleContent);

      expect(processedContent).toBeDefined();
      expect(keyTerms.length).toBeGreaterThan(0);
      expect(summary.length).toBeGreaterThan(0);

      // Step 4: Create module with processed content
      const module = createMockModule({
        title: 'Psicologia Analítica de Jung',
        content: processedContent,
        keyTerms: keyTerms.map(term => term.term),
        level: 'intermediate'
      });

      // Step 5: Save module progress
      saveModuleProgress(module.id, false, undefined); // Started but not completed
      let moduleProgress = loadModuleProgress(module.id);
      expect(moduleProgress.completed).toBe(false);

      // Step 6: Create and take quiz
      const quiz = createMockQuiz({
        moduleId: module.id,
        title: translate('quiz.title', { interpolations: { moduleName: module.title } }),
        questionCount: 5
      });

      // Randomize quiz questions for fairness
      const randomizedQuiz = {
        ...quiz,
        questions: randomizeAllQuestionOptions(quiz.questions)
      };

      const variedQuiz = {
        ...randomizedQuiz,
        questions: ensureVariedCorrectAnswerPositions(randomizedQuiz.questions)
      };

      // Simulate taking the quiz (scoring 80%)
      const quizScore = 80;
      saveModuleProgress(module.id, true, quizScore);

      // Step 7: Create notes during learning
      const studyNotes = [
        createMockNote({
          moduleId: module.id,
          content: `Nota importante: ${translate('notes.keyInsight')} sobre individuação`,
          timestamp: new Date(),
          tags: ['individuação', 'conceito-chave']
        }),
        createMockNote({
          moduleId: module.id,
          content: 'O inconsciente coletivo contém arquétipos universais',
          timestamp: new Date(),
          tags: ['inconsciente-coletivo', 'arquétipos']
        })
      ];

      saveNotes(studyNotes);

      // Step 8: Update user progress
      const userProgress: UserProgress = {
        userId: user.id,
        completedModules: [module.id],
        quizScores: { [module.id]: quizScore },
        totalTime: 3600, // 1 hour study session
        lastAccessed: Date.now(),
        notes: studyNotes
      };

      saveUserProgress(userProgress);

      // Step 9: Verify complete learning session state
      const savedProgress = loadUserProgress();
      const savedNotes = loadNotes();
      const finalModuleProgress = loadModuleProgress(module.id);

      // Assertions
      expect(savedProgress).toBeDefined();
      expect(savedProgress!.completedModules).toContain(module.id);
      expect(savedProgress!.quizScores[module.id]).toBe(quizScore);
      expect(savedProgress!.totalTime).toBe(3600);

      expect(savedNotes).toHaveLength(2);
      expect(savedNotes[0].moduleId).toBe(module.id);
      expect(savedNotes[1].moduleId).toBe(module.id);

      expect(finalModuleProgress.completed).toBe(true);
      expect(finalModuleProgress.score).toBe(quizScore);

      // Step 10: Generate session summary with localized formatting
      const sessionSummary = {
        completedAt: formatDate(new Date(), {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        score: formatNumber(quizScore, { style: 'percent', maximumFractionDigits: 0 }),
        studyTime: formatNumber(userProgress.totalTime / 3600, {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1
        }) + ' ' + translate('time.hours'),
        notesCount: savedNotes.length,
        keyTermsLearned: keyTerms.length
      };

      expect(sessionSummary.completedAt).toBeDefined();
      expect(sessionSummary.score).toContain('%');
      expect(sessionSummary.studyTime).toContain('1.0');
      expect(sessionSummary.notesCount).toBe(2);
      expect(sessionSummary.keyTermsLearned).toBeGreaterThan(0);
    });

    it('should handle multi-language learning progression', async () => {
      const languages = ['en', 'pt-BR', 'es', 'fr'];
      const moduleContents = {
        en: 'Jung\'s analytical psychology focuses on the collective unconscious and individuation.',
        'pt-BR': 'A psicologia analítica de Jung foca no inconsciente coletivo e individuação.',
        es: 'La psicología analítica de Jung se enfoca en el inconsciente colectivo e individuación.',
        fr: 'La psychologie analytique de Jung se concentre sur l\'inconscient collectif et l\'individuation.'
      };

      const progressResults = [];

      for (const language of languages) {
        // Switch language
        await switchLanguage(language as any);
        expect(getCurrentLanguage()).toBe(language);

        // Process content in current language
        const content = moduleContents[language as keyof typeof moduleContents];
        const processed = processModuleContent(content);
        const keyTerms = extractKeyTerms(content);
        const summary = generateSummary(content);

        // Create module for this language
        const module = createMockModule({
          title: translate('modules.jungPsychology'),
          content: processed,
          keyTerms: keyTerms.map(t => t.term)
        });

        // Create and randomize quiz
        const quiz = createMockQuiz({
          moduleId: module.id,
          title: translate('quiz.title', {
            interpolations: { moduleName: module.title }
          })
        });

        const randomizedQuestions = randomizeAllQuestionOptions(quiz.questions);
        const variedQuestions = ensureVariedCorrectAnswerPositions(randomizedQuestions);

        // Save progress
        const score = 75 + Math.random() * 25; // Random score between 75-100
        saveModuleProgress(module.id, true, score);

        // Create localized note
        const note = createMockNote({
          moduleId: module.id,
          content: translate('notes.completedModule', {
            interpolations: { 
              moduleName: module.title,
              language: language.toUpperCase()
            }
          }),
          tags: [language, 'completed']
        });

        progressResults.push({
          language,
          moduleId: module.id,
          score,
          keyTermsCount: keyTerms.length,
          summaryLength: summary.length,
          questionsCount: variedQuestions.length,
          note
        });
      }

      // Create comprehensive user progress
      const userProgress: UserProgress = {
        userId: 'multilingual-user',
        completedModules: progressResults.map(p => p.moduleId),
        quizScores: Object.fromEntries(
          progressResults.map(p => [p.moduleId, p.score])
        ),
        totalTime: progressResults.length * 2400, // 40 minutes per module
        lastAccessed: Date.now(),
        notes: progressResults.map(p => p.note)
      };

      saveUserProgress(userProgress);
      const notes = progressResults.map(p => p.note);
      saveNotes(notes);

      // Verify multilingual progress
      const savedProgress = loadUserProgress();
      const savedNotes = loadNotes();

      expect(savedProgress!.completedModules).toHaveLength(languages.length);
      expect(Object.keys(savedProgress!.quizScores)).toHaveLength(languages.length);
      expect(savedNotes).toHaveLength(languages.length);

      // Verify each language has unique content
      const uniqueNoteContents = new Set(savedNotes.map(n => n.content));
      expect(uniqueNoteContents.size).toBe(languages.length);

      // Generate multilingual summary
      const multilingualSummary = {
        totalModules: savedProgress!.completedModules.length,
        averageScore: formatNumber(
          Object.values(savedProgress!.quizScores).reduce((a, b) => a + b, 0) / 
          Object.keys(savedProgress!.quizScores).length,
          { minimumFractionDigits: 1 }
        ),
        totalStudyTime: formatNumber(savedProgress!.totalTime / 3600, {
          minimumFractionDigits: 1
        }),
        languagesStudied: languages.map(lang => lang.toUpperCase()).join(', ')
      };

      expect(multilingualSummary.totalModules).toBe(4);
      expect(parseFloat(multilingualSummary.averageScore)).toBeGreaterThan(75);
      expect(parseFloat(multilingualSummary.totalStudyTime)).toBeGreaterThan(2.5);
      expect(multilingualSummary.languagesStudied).toContain('EN');
      expect(multilingualSummary.languagesStudied).toContain('PT-BR');
    });
  });

  describe('Quiz Management Workflow', () => {
    it('should create, randomize, and manage quiz sessions', () => {
      // Step 1: Create base quiz with psychological content
      const psychologyContent = `
        Carl Jung's theory of psychological types distinguishes between introverts and extroverts.
        The four psychological functions are thinking, feeling, sensation, and intuition.
        These combine to create eight distinct personality types in Jung's typology.
        Understanding these types helps in personal development and relationships.
      `;

      const processedContent = processModuleContent(psychologyContent);
      const keyTerms = extractKeyTerms(psychologyContent);

      const module = createMockModule({
        title: 'Jungian Psychological Types',
        content: processedContent,
        keyTerms: keyTerms.map(term => term.term)
      });

      // Step 2: Create comprehensive quiz
      const baseQuiz = createMockQuiz({
        moduleId: module.id,
        questionCount: 20,
        difficulty: 'medium',
        timeLimit: 1800 // 30 minutes
      });

      // Step 3: Apply randomization strategies
      const strategies = [
        'standard', 'balanced', 'challenging'
      ];

      const quizVariants = strategies.map(strategy => {
        let questions = [...baseQuiz.questions];

        // Apply different randomization based on strategy
        questions = randomizeAllQuestionOptions(questions);
        questions = ensureVariedCorrectAnswerPositions(questions);

        // For challenging variant, prefer harder questions first
        if (strategy === 'challenging') {
          questions.sort((a, b) => {
            const difficultyOrder = { hard: 3, medium: 2, easy: 1 };
            return difficultyOrder[b.difficulty] - difficultyOrder[a.difficulty];
          });
        }

        return {
          strategy,
          quiz: {
            ...baseQuiz,
            id: `${baseQuiz.id}-${strategy}`,
            questions,
            title: translate('quiz.variant', {
              interpolations: { 
                original: baseQuiz.title,
                variant: strategy.toUpperCase()
              }
            })
          }
        };
      });

      // Step 4: Simulate quiz sessions
      const sessionResults = quizVariants.map(({ strategy, quiz }) => {
        const startTime = Date.now();

        // Simulate answering questions with different accuracy by strategy
        const baseAccuracy = strategy === 'challenging' ? 0.7 : 0.85;
        let correctAnswers = 0;

        quiz.questions.forEach((question, index) => {
          const accuracy = baseAccuracy + (Math.random() - 0.5) * 0.2;
          const isCorrect = Math.random() < accuracy;
          
          if (isCorrect) {
            correctAnswers++;
          }

          // Save individual question progress (simulated)
          const questionProgress = {
            questionId: question.id,
            userAnswer: isCorrect ? question.correctAnswer : 
              (question.correctAnswer + 1) % (question.options?.length || 2),
            isCorrect,
            timeSpent: 30 + Math.random() * 60 // 30-90 seconds per question
          };
        });

        const endTime = Date.now();
        const sessionDuration = endTime - startTime;
        const score = Math.round((correctAnswers / quiz.questions.length) * 100);

        // Save quiz session results
        saveModuleProgress(quiz.moduleId, score >= baseQuiz.passingScore!, score);

        return {
          strategy,
          quizId: quiz.id,
          score,
          correctAnswers,
          totalQuestions: quiz.questions.length,
          duration: sessionDuration,
          passed: score >= baseQuiz.passingScore!
        };
      });

      // Step 5: Analyze and save session analytics
      const analytics = {
        totalSessions: sessionResults.length,
        averageScore: sessionResults.reduce((sum, result) => sum + result.score, 0) / 
          sessionResults.length,
        passRate: sessionResults.filter(r => r.passed).length / sessionResults.length,
        strategyPerformance: sessionResults.reduce((acc, result) => {
          acc[result.strategy] = {
            score: result.score,
            passed: result.passed,
            duration: result.duration
          };
          return acc;
        }, {} as Record<string, any>),
        bestStrategy: sessionResults.reduce((best, current) => 
          current.score > best.score ? current : best
        ).strategy
      };

      // Save comprehensive analytics
      const userProgress: UserProgress = {
        userId: 'quiz-analytics-user',
        completedModules: sessionResults.filter(r => r.passed).map(r => module.id),
        quizScores: Object.fromEntries(
          sessionResults.map(r => [`${module.id}-${r.strategy}`, r.score])
        ),
        totalTime: sessionResults.reduce((sum, r) => sum + r.duration, 0),
        lastAccessed: Date.now(),
        notes: [{
          id: 'analytics-note',
          moduleId: module.id,
          content: `Quiz analytics: Average ${formatNumber(analytics.averageScore)}%, ` +
            `Pass rate: ${formatNumber(analytics.passRate, { style: 'percent' })}, ` +
            `Best strategy: ${analytics.bestStrategy}`,
          timestamp: new Date(),
          tags: ['analytics', 'performance']
        }]
      };

      saveUserProgress(userProgress);

      // Verify comprehensive quiz management
      const savedProgress = loadUserProgress();
      expect(savedProgress).toBeDefined();
      expect(Object.keys(savedProgress!.quizScores)).toHaveLength(strategies.length);

      // Check that at least one session passed
      expect(sessionResults.some(r => r.passed)).toBe(true);

      // Verify analytics accuracy
      expect(analytics.averageScore).toBeGreaterThan(0);
      expect(analytics.averageScore).toBeLessThanOrEqual(100);
      expect(analytics.passRate).toBeGreaterThanOrEqual(0);
      expect(analytics.passRate).toBeLessThanOrEqual(1);
      expect(['standard', 'balanced', 'challenging']).toContain(analytics.bestStrategy);
    });
  });

  describe('Content Processing Pipeline', () => {
    it('should process content through complete pipeline with error recovery', async () => {
      // Step 1: Raw content in different formats
      const rawContents = [
        {
          format: 'plain',
          content: 'Jung believed in the collective unconscious as a shared layer of unconscious mind.'
        },
        {
          format: 'markdown',
          content: `# Jung's Theory
          
          ## Key Concepts
          - **Collective Unconscious**: Shared unconscious content
          - **Archetypes**: Universal patterns
          - **Individuation**: Personal development process
          
          ### Applications
          Jung's work applies to therapy, education, and personal growth.`
        },
        {
          format: 'structured',
          content: JSON.stringify({
            title: 'Analytical Psychology',
            sections: [
              { heading: 'Introduction', content: 'Jung founded analytical psychology...' },
              { heading: 'Key Terms', content: 'Collective unconscious, archetypes, shadow...' }
            ]
          })
        },
        {
          format: 'corrupted',
          content: 'Jung\x00\x01 invalid\x02 content\x03 with\x04 null bytes'
        }
      ];

      const pipelineResults = [];

      for (const { format, content } of rawContents) {
        try {
          // Step 2: Process content (with error handling)
          let processedContent: string;
          let keyTerms: any[];
          let summary: string;

          try {
            processedContent = processModuleContent(content);
            keyTerms = extractKeyTerms(content);
            summary = generateSummary(content);
          } catch (processingError) {
            // Fallback processing for corrupted content
            processedContent = content.replace(/[\x00-\x1F\x7F]/g, ''); // Remove control characters
            keyTerms = extractKeyTerms(processedContent);
            summary = generateSummary(processedContent);
          }

          // Step 3: Create module from processed content
          const module = createMockModule({
            title: `Module - ${format.toUpperCase()}`,
            content: processedContent,
            keyTerms: keyTerms.map(term => typeof term === 'string' ? term : term.term)
          });

          // Step 4: Generate quiz from content
          const contentQuiz = createMockQuiz({
            moduleId: module.id,
            title: `Quiz: ${module.title}`,
            questionCount: Math.max(3, Math.min(keyTerms.length, 10))
          });

          // Step 5: Randomize for assessment
          const randomizedQuiz = {
            ...contentQuiz,
            questions: randomizeAllQuestionOptions(contentQuiz.questions)
          };

          // Step 6: Create study notes
          const studyNote = createMockNote({
            moduleId: module.id,
            content: `Study notes for ${format} content: ${summary.substring(0, 100)}...`,
            tags: [format, 'processed', 'study-notes']
          });

          // Step 7: Language localization
          await switchLanguage('en');
          const localizedSummary = translate('content.summary', {
            interpolations: { 
              summary,
              keyTermCount: keyTerms.length.toString(),
              format: format.toUpperCase()
            }
          });

          pipelineResults.push({
            format,
            success: true,
            module,
            quiz: randomizedQuiz,
            note: studyNote,
            metrics: {
              originalLength: content.length,
              processedLength: processedContent.length,
              keyTermsCount: keyTerms.length,
              summaryLength: summary.length,
              questionsGenerated: randomizedQuiz.questions.length
            },
            localizedSummary
          });

        } catch (error) {
          // Record failures for analysis
          pipelineResults.push({
            format,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            metrics: {
              originalLength: content.length,
              processedLength: 0,
              keyTermsCount: 0,
              summaryLength: 0,
              questionsGenerated: 0
            }
          });
        }
      }

      // Step 8: Aggregate results and save
      const successfulResults = pipelineResults.filter(r => r.success);
      const failedResults = pipelineResults.filter(r => !r.success);

      const aggregatedProgress: UserProgress = {
        userId: 'content-pipeline-user',
        completedModules: successfulResults.map(r => r.module!.id),
        quizScores: Object.fromEntries(
          successfulResults.map((r, index) => [r.module!.id, 70 + (index * 10)])
        ),
        totalTime: successfulResults.length * 1800, // 30 minutes per successful module
        lastAccessed: Date.now(),
        notes: successfulResults.map(r => r.note!).filter(Boolean)
      };

      saveUserProgress(aggregatedProgress);
      const allNotes = successfulResults.map(r => r.note!).filter(Boolean);
      saveNotes(allNotes);

      // Step 9: Generate pipeline analytics
      const pipelineAnalytics = {
        totalProcessed: pipelineResults.length,
        successRate: successfulResults.length / pipelineResults.length,
        formatSuccess: pipelineResults.reduce((acc, result) => {
          acc[result.format] = result.success;
          return acc;
        }, {} as Record<string, boolean>),
        averageMetrics: {
          keyTermsPerContent: successfulResults.reduce((sum, r) => 
            sum + r.metrics!.keyTermsCount, 0) / successfulResults.length,
          questionsPerQuiz: successfulResults.reduce((sum, r) => 
            sum + r.metrics!.questionsGenerated, 0) / successfulResults.length,
          compressionRatio: successfulResults.reduce((sum, r) => 
            sum + (r.metrics!.summaryLength / r.metrics!.originalLength), 0) / successfulResults.length
        },
        errorFormats: failedResults.map(r => r.format),
        processingErrors: failedResults.map(r => r.error).filter(Boolean)
      };

      // Assertions
      expect(pipelineResults).toHaveLength(4);
      expect(successfulResults.length).toBeGreaterThanOrEqual(3); // Most should succeed
      expect(pipelineAnalytics.successRate).toBeGreaterThan(0.5);

      // Verify successful processing
      successfulResults.forEach(result => {
        expect(result.module).toBeDefined();
        expect(result.quiz).toBeDefined();
        expect(result.note).toBeDefined();
        expect(result.metrics!.keyTermsCount).toBeGreaterThan(0);
        expect(result.metrics!.summaryLength).toBeGreaterThan(0);
      });

      // Check saved data integrity
      const savedProgress = loadUserProgress();
      const savedNotes = loadNotes();

      expect(savedProgress!.completedModules).toHaveLength(successfulResults.length);
      expect(savedNotes).toHaveLength(successfulResults.length);

      // Verify error handling worked
      expect(pipelineAnalytics.errorFormats).toContain('corrupted');
    });
  });

  describe('Cross-Utility Error Recovery', () => {
    it('should gracefully handle cascading failures across utilities', async () => {
      // Step 1: Introduce various failure scenarios
      const failureScenarios = [
        {
          name: 'localStorage-quota-exceeded',
          setup: () => {
            // Mock localStorage to throw quota exceeded error
            const originalSetItem = mockLocalStorage.setItem;
            mockLocalStorage.setItem = () => {
              throw new DOMException('QuotaExceededError');
            };
            return () => { mockLocalStorage.setItem = originalSetItem; };
          }
        },
        {
          name: 'corrupted-content',
          content: '\x00\x01\x02\x03Invalid content with null bytes and malformed data'
        },
        {
          name: 'invalid-language-switch',
          language: 'invalid-lang-code'
        },
        {
          name: 'malformed-quiz-data',
          quiz: {
            id: '',
            questions: null,
            invalidProperty: 'should-not-exist'
          }
        }
      ];

      const recoveryResults = [];

      for (const scenario of failureScenarios) {
        let cleanup: (() => void) | undefined;
        
        try {
          // Apply failure condition
          if (scenario.setup) {
            cleanup = scenario.setup();
          }

          // Attempt normal workflow with failure conditions
          const result = {
            scenario: scenario.name,
            steps: [] as Array<{step: string, success: boolean, error?: string}>
          };

          // Step: Language switching with recovery
          try {
            if (scenario.language) {
              await switchLanguage(scenario.language as any);
            } else {
              await switchLanguage('en');
            }
            result.steps.push({ step: 'language-switch', success: true });
          } catch (error) {
            result.steps.push({ 
              step: 'language-switch', 
              success: false, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            });
            // Fallback to safe language
            await switchLanguage('en');
          }

          // Step: Content processing with recovery
          try {
            const content = scenario.content || 'Safe fallback content about Jung\'s psychology.';
            const processed = processModuleContent(content);
            const keyTerms = extractKeyTerms(processed);
            const summary = generateSummary(processed);
            
            result.steps.push({ step: 'content-processing', success: true });
          } catch (error) {
            result.steps.push({ 
              step: 'content-processing', 
              success: false, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            });
          }

          // Step: Quiz handling with recovery
          try {
            let quiz: Quiz;
            if (scenario.quiz) {
              // Try to create with malformed data
              quiz = scenario.quiz as any;
            } else {
              quiz = createMockQuiz();
            }

            const randomizedQuestions = randomizeAllQuestionOptions(quiz.questions || []);
            result.steps.push({ step: 'quiz-processing', success: true });
          } catch (error) {
            result.steps.push({ 
              step: 'quiz-processing', 
              success: false, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            });
            // Create safe fallback quiz
            const fallbackQuiz = createMockQuiz({ questionCount: 1 });
            randomizeAllQuestionOptions(fallbackQuiz.questions);
          }

          // Step: Storage operations with recovery
          try {
            const progress: UserProgress = {
              userId: `recovery-test-${scenario.name}`,
              completedModules: ['safe-module'],
              quizScores: { 'safe-module': 85 },
              totalTime: 1800,
              lastAccessed: Date.now(),
              notes: []
            };

            saveUserProgress(progress);
            const saved = loadUserProgress();
            result.steps.push({ step: 'storage-operations', success: !!saved });
          } catch (error) {
            result.steps.push({ 
              step: 'storage-operations', 
              success: false, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            });
            // Try alternative storage approach (in-memory fallback)
            console.warn('Storage failed, using in-memory fallback');
          }

          recoveryResults.push(result);

        } finally {
          // Clean up failure conditions
          if (cleanup) {
            cleanup();
          }
        }
      }

      // Analyze recovery effectiveness
      const recoveryAnalysis = {
        totalScenarios: recoveryResults.length,
        scenarioResults: recoveryResults.reduce((acc, result) => {
          acc[result.scenario] = {
            totalSteps: result.steps.length,
            successfulSteps: result.steps.filter(s => s.success).length,
            failedSteps: result.steps.filter(s => !s.success).length,
            recoveryRate: result.steps.filter(s => s.success).length / result.steps.length
          };
          return acc;
        }, {} as Record<string, any>),
        overallRecoveryRate: recoveryResults.reduce((sum, result) => 
          sum + (result.steps.filter(s => s.success).length / result.steps.length), 0
        ) / recoveryResults.length
      };

      // Assertions
      expect(recoveryResults).toHaveLength(failureScenarios.length);
      expect(recoveryAnalysis.overallRecoveryRate).toBeGreaterThan(0.5); // Should recover from most failures

      // Verify each scenario had some level of recovery
      recoveryResults.forEach(result => {
        const successfulSteps = result.steps.filter(s => s.success).length;
        expect(successfulSteps).toBeGreaterThan(0); // At least one step should succeed
      });

      // Check that critical failures are properly handled
      const criticalFailures = recoveryResults.filter(result => 
        result.steps.every(step => !step.success)
      );
      expect(criticalFailures).toHaveLength(0); // No complete system failures
    });
  });

  describe('Performance Under Integration Load', () => {
    it('should maintain performance during complex multi-utility operations', async () => {
      const startTime = performance.now();
      const operationResults = [];

      // Simulate 50 concurrent learning sessions
      const concurrentSessions = Array.from({ length: 50 }, async (_, sessionId) => {
        const sessionStart = performance.now();

        try {
          // Each session: language setup, content processing, quiz generation, progress tracking
          const language = ['en', 'pt-BR', 'es', 'fr'][sessionId % 4];
          await switchLanguage(language as any);

          const content = `Session ${sessionId} content: Jung's analytical psychology focuses on individuation.`.repeat(10);
          const processedContent = processModuleContent(content);
          const keyTerms = extractKeyTerms(content);
          const summary = generateSummary(content);

          const module = createMockModule({
            id: `integration-module-${sessionId}`,
            content: processedContent,
            keyTerms: keyTerms.map(t => t.term || t)
          });

          const quiz = createMockQuiz({
            moduleId: module.id,
            questionCount: 5
          });

          const randomizedQuiz = {
            ...quiz,
            questions: randomizeAllQuestionOptions(quiz.questions)
          };

          const note = createMockNote({
            moduleId: module.id,
            content: `Session ${sessionId} notes in ${language}`,
            tags: [language, 'integration-test']
          });

          const progress: UserProgress = {
            userId: `integration-user-${sessionId}`,
            completedModules: [module.id],
            quizScores: { [module.id]: 75 + (sessionId % 25) },
            totalTime: 1200 + (sessionId * 60),
            lastAccessed: Date.now(),
            notes: [note]
          };

          saveUserProgress(progress);
          saveNotes([note]);

          const sessionDuration = performance.now() - sessionStart;

          return {
            sessionId,
            language,
            duration: sessionDuration,
            success: true,
            moduleId: module.id,
            quizQuestions: randomizedQuiz.questions.length,
            keyTermsCount: keyTerms.length
          };

        } catch (error) {
          return {
            sessionId,
            duration: performance.now() - sessionStart,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      });

      const results = await Promise.all(concurrentSessions);
      const totalDuration = performance.now() - startTime;

      // Analyze performance results
      const performanceAnalysis = {
        totalSessions: results.length,
        successfulSessions: results.filter(r => r.success).length,
        failedSessions: results.filter(r => !r.success).length,
        averageSessionDuration: results.reduce((sum, r) => sum + r.duration, 0) / results.length,
        totalDuration,
        sessionsPerSecond: results.length / (totalDuration / 1000),
        languageDistribution: results.reduce((acc: Record<string, number>, r: any) => {
          if (r.language) {
            acc[r.language] = (acc[r.language] || 0) + 1;
          }
          return acc;
        }, {}),
        performanceMetrics: {
          fastest: Math.min(...results.map(r => r.duration)),
          slowest: Math.max(...results.map(r => r.duration)),
          p95: results.map(r => r.duration).sort()[Math.floor(results.length * 0.95)]
        }
      };

      // Performance assertions
      expect(performanceAnalysis.successfulSessions).toBeGreaterThanOrEqual(45); // 90% success rate
      expect(performanceAnalysis.totalDuration).toBeLessThan(10000); // Complete within 10 seconds
      expect(performanceAnalysis.averageSessionDuration).toBeLessThan(2000); // Average session under 2 seconds
      expect(performanceAnalysis.performanceMetrics.p95).toBeLessThan(5000); // 95% under 5 seconds

      // Verify data integrity after concurrent operations
      const finalCheck = results.filter(r => r.success).slice(0, 5); // Check first 5 successful sessions
      
      for (const session of finalCheck) {
        const moduleProgress = loadModuleProgress(session.moduleId!);
        expect(moduleProgress).toBeDefined();
      }

      // Memory usage should remain reasonable
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      if (finalMemory > 0) {
        expect(finalMemory).toBeLessThan(100 * 1024 * 1024); // Under 100MB
      }

      console.log('Integration Performance Analysis:', JSON.stringify(performanceAnalysis, null, 2));
    });
  });
});