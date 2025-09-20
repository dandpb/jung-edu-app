import { EducationalModule, Quiz, Question, Reference } from '../schema';

describe('Schema Types', () => {
  describe('EducationalModule', () => {
    it('should allow creating a valid EducationalModule', () => {
      const module: EducationalModule = {
        id: 'test-module',
        title: 'Test Educational Module',
        description: 'A comprehensive test module',
        duration: 120,
        level: 'Intermediário',
        objectives: [
          'Understand basic concepts',
          'Apply knowledge in practice',
          'Analyze complex scenarios'
        ],
        content: {
          sections: [
            {
              id: 'section-1',
              title: 'Introduction',
              content: 'This is the introduction section',
              keyTerms: [
                {
                  term: 'Analytical Psychology',
                  definition: 'Carl Jung\'s approach to depth psychology'
                }
              ]
            }
          ],
          videos: [
            {
              id: 'video-1',
              title: 'Introduction Video',
              youtubeId: 'abc123def456',
              description: 'An introductory video about the concepts',
              duration: 15
            }
          ],
          bibliography: [
            {
              author: 'Jung, Carl Gustav',
              title: 'The Archetypes and the Collective Unconscious',
              year: 1959,
              type: 'book',
              link: 'https://example.com/book'
            }
          ],
          films: [
            {
              title: 'A Documentary on Jung',
              director: 'Film Director',
              year: 2020,
              relevance: 'Provides visual context to Jungian concepts',
              link: 'https://example.com/film'
            }
          ],
          quiz: {
            id: 'quiz-1',
            title: 'Module Assessment',
            questions: [
              {
                id: 'q1',
                question: 'What is the main focus of analytical psychology?',
                type: 'multiple-choice',
                options: [
                  { id: 'a', text: 'Unconscious processes', isCorrect: true },
                  { id: 'b', text: 'Behavioral conditioning', isCorrect: false },
                  { id: 'c', text: 'Cognitive patterns', isCorrect: false },
                  { id: 'd', text: 'Social interactions', isCorrect: false }
                ],
                correctAnswer: 0,
                explanation: 'Analytical psychology focuses on unconscious processes and their integration'
              }
            ]
          }
        }
      };

      expect(module).toBeDefined();
      expect(module.id).toBe('test-module');
      expect(module.title).toBe('Test Educational Module');
      expect(module.duration).toBe(120);
      expect(module.level).toBe('Intermediário');
      expect(module.objectives).toHaveLength(3);
      expect(module.content.sections).toHaveLength(1);
      expect(module.content.videos).toHaveLength(1);
      expect(module.content.bibliography).toHaveLength(1);
      expect(module.content.films).toHaveLength(1);
      expect(module.content.quiz).toBeDefined();
    });

    it('should support optional properties', () => {
      const minimalModule: EducationalModule = {
        id: 'minimal',
        title: 'Minimal Module',
        description: 'Basic module',
        duration: 30,
        level: 'Básico',
        objectives: ['Learn basics'],
        content: {
          sections: []
        }
      };

      expect(minimalModule).toBeDefined();
      expect(minimalModule.content.videos).toBeUndefined();
      expect(minimalModule.content.bibliography).toBeUndefined();
      expect(minimalModule.content.films).toBeUndefined();
      expect(minimalModule.content.quiz).toBeUndefined();
    });

    it('should support different education levels', () => {
      const levels: Array<EducationalModule['level']> = [
        'Básico',
        'Intermediário',
        'Avançado',
        'Especialista'
      ];

      levels.forEach(level => {
        const module: EducationalModule = {
          id: `module-${level}`,
          title: `Module ${level}`,
          description: `A ${level} level module`,
          duration: 60,
          level,
          objectives: [`Master ${level} concepts`],
          content: { sections: [] }
        };

        expect(module.level).toBe(level);
      });
    });
  });

  describe('Quiz', () => {
    it('should allow creating a comprehensive quiz', () => {
      const quiz: Quiz = {
        id: 'comprehensive-quiz',
        title: 'Comprehensive Assessment',
        questions: [
          {
            id: 'q1',
            question: 'Multiple choice question',
            type: 'multiple-choice',
            options: [
              { id: 'a', text: 'Option A', isCorrect: true },
              { id: 'b', text: 'Option B', isCorrect: false }
            ],
            correctAnswer: 0,
            explanation: 'Explanation for correct answer'
          },
          {
            id: 'q2',
            question: 'True or false question',
            type: 'true-false',
            options: [
              { id: 'true', text: 'True', isCorrect: false },
              { id: 'false', text: 'False', isCorrect: true }
            ],
            correctAnswer: 1,
            explanation: 'This statement is false because...'
          },
          {
            id: 'q3',
            question: 'Essay question about analytical psychology',
            type: 'essay',
            options: [],
            correctAnswer: 0,
            explanation: 'Look for key concepts in the answer',
            expectedKeywords: ['unconscious', 'individuation', 'archetypes'],
            rubric: {
              excellent: 'Demonstrates deep understanding',
              good: 'Shows adequate knowledge',
              needs_improvement: 'Missing key concepts'
            }
          }
        ]
      };

      expect(quiz.questions).toHaveLength(3);
      expect(quiz.questions[0].type).toBe('multiple-choice');
      expect(quiz.questions[1].type).toBe('true-false');
      expect(quiz.questions[2].type).toBe('essay');
      expect(quiz.questions[2].expectedKeywords).toEqual(['unconscious', 'individuation', 'archetypes']);
      expect(quiz.questions[2].rubric).toBeDefined();
    });

    it('should handle different question types', () => {
      const questionTypes: Array<Question['type']> = [
        'multiple-choice',
        'true-false',
        'essay',
        'fill-in-blank'
      ];

      questionTypes.forEach(type => {
        const question: Question = {
          id: `q-${type}`,
          question: `Sample ${type} question`,
          type,
          options: [],
          correctAnswer: 0,
          explanation: 'Sample explanation'
        };

        expect(question.type).toBe(type);
      });
    });
  });

  describe('Reference', () => {
    it('should support different reference types', () => {
      const bookReference: Reference = {
        author: 'Jung, C.G.',
        title: 'Psychological Types',
        year: 1921,
        type: 'book',
        link: 'https://example.com/book'
      };

      const articleReference: Reference = {
        author: 'Smith, J.',
        title: 'Modern Applications of Jungian Theory',
        year: 2023,
        type: 'article',
        link: 'https://example.com/article',
        journal: 'Journal of Analytical Psychology'
      };

      const webReference: Reference = {
        author: 'Online Author',
        title: 'Web Resource on Jung',
        year: 2024,
        type: 'website',
        link: 'https://example.com/web-resource'
      };

      expect(bookReference.type).toBe('book');
      expect(articleReference.type).toBe('article');
      expect(articleReference.journal).toBe('Journal of Analytical Psychology');
      expect(webReference.type).toBe('website');
    });

    it('should handle references with optional properties', () => {
      const minimalReference: Reference = {
        author: 'Author Name',
        title: 'Reference Title',
        year: 2023,
        type: 'book',
        link: 'https://example.com'
      };

      const detailedReference: Reference = {
        author: 'Detailed Author',
        title: 'Detailed Reference',
        year: 2023,
        type: 'article',
        link: 'https://example.com',
        journal: 'Psychology Journal',
        volume: '45',
        issue: '3',
        pages: '123-145',
        doi: '10.1234/example.doi'
      };

      expect(minimalReference.journal).toBeUndefined();
      expect(minimalReference.volume).toBeUndefined();
      expect(detailedReference.journal).toBe('Psychology Journal');
      expect(detailedReference.volume).toBe('45');
      expect(detailedReference.issue).toBe('3');
      expect(detailedReference.pages).toBe('123-145');
      expect(detailedReference.doi).toBe('10.1234/example.doi');
    });
  });

  describe('Content Structure', () => {
    it('should support complex section structures', () => {
      const complexSection = {
        id: 'complex-section',
        title: 'Complex Learning Section',
        content: 'Detailed content about Jungian concepts',
        keyTerms: [
          {
            term: 'Collective Unconscious',
            definition: 'The deepest layer of unconscious shared by all humanity'
          },
          {
            term: 'Individuation',
            definition: 'The process of psychological integration and self-realization'
          }
        ],
        learningObjectives: [
          'Understand the concept of collective unconscious',
          'Recognize archetypal patterns',
          'Apply individuation principles'
        ],
        activities: [
          {
            type: 'reflection',
            title: 'Personal Shadow Work',
            description: 'Reflect on your own shadow aspects',
            duration: 20
          },
          {
            type: 'analysis',
            title: 'Dream Analysis Exercise',
            description: 'Analyze a dream using Jungian methods',
            duration: 30
          }
        ],
        resources: [
          {
            type: 'pdf',
            title: 'Jung\'s Theory Overview',
            url: 'https://example.com/jung-overview.pdf'
          },
          {
            type: 'video',
            title: 'Documentary on Jung',
            url: 'https://example.com/jung-doc'
          }
        ]
      };

      expect(complexSection.keyTerms).toHaveLength(2);
      expect(complexSection.learningObjectives).toHaveLength(3);
      expect(complexSection.activities).toHaveLength(2);
      expect(complexSection.resources).toHaveLength(2);
      expect(complexSection.activities[0].type).toBe('reflection');
      expect(complexSection.activities[1].type).toBe('analysis');
    });

    it('should support video metadata', () => {
      const detailedVideo = {
        id: 'detailed-video',
        title: 'In-depth Jung Analysis',
        youtubeId: 'abcdef123456',
        description: 'A comprehensive analysis of Jung\'s major works',
        duration: 45,
        transcript: 'Full transcript of the video content...',
        chapters: [
          {
            title: 'Introduction to Jung',
            startTime: 0,
            endTime: 300
          },
          {
            title: 'The Collective Unconscious',
            startTime: 300,
            endTime: 900
          },
          {
            title: 'Archetypes Explained',
            startTime: 900,
            endTime: 1500
          }
        ],
        keywords: ['jung', 'analytical psychology', 'unconscious', 'archetypes'],
        difficulty: 'intermediate',
        prerequisites: ['basic-psychology', 'intro-to-jung']
      };

      expect(detailedVideo.chapters).toHaveLength(3);
      expect(detailedVideo.keywords).toContain('analytical psychology');
      expect(detailedVideo.difficulty).toBe('intermediate');
      expect(detailedVideo.prerequisites).toEqual(['basic-psychology', 'intro-to-jung']);
    });
  });

  describe('Type Validation', () => {
    it('should ensure proper typing for educational content', () => {
      // This test validates that TypeScript types are working correctly
      const moduleContent = {
        sections: [
          {
            id: 'test-section',
            title: 'Test Section',
            content: 'Test content',
            keyTerms: [
              { term: 'Test Term', definition: 'Test Definition' }
            ]
          }
        ],
        videos: [
          {
            id: 'test-video',
            title: 'Test Video',
            youtubeId: 'test123',
            description: 'Test description',
            duration: 10
          }
        ]
      };

      // These type assertions should pass if our types are correct
      expect(typeof moduleContent.sections[0].id).toBe('string');
      expect(typeof moduleContent.sections[0].title).toBe('string');
      expect(typeof moduleContent.videos[0].duration).toBe('number');
      expect(Array.isArray(moduleContent.sections[0].keyTerms)).toBe(true);
    });

    it('should handle optional fields correctly', () => {
      const partialModule: Partial<EducationalModule> = {
        id: 'partial',
        title: 'Partial Module'
      };

      // Should be able to access defined properties
      expect(partialModule.id).toBe('partial');
      expect(partialModule.title).toBe('Partial Module');
      
      // Undefined properties should be undefined
      expect(partialModule.duration).toBeUndefined();
      expect(partialModule.level).toBeUndefined();
    });
  });
});