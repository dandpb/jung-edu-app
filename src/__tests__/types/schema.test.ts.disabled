import {
  EducationalModule,
  ValidationError,
  Quiz
} from '../../types/schema';

describe('Types - schema.ts', () => {
  describe('EducationalModule Type', () => {
    it('should accept valid educational module', () => {
      const module: EducationalModule = {
        id: 'edu-module-1',
        title: 'Introduction to Psychology',
        description: 'Basic concepts of psychology',
        content: {
          introduction: 'Welcome to psychology'
        },
        estimatedTime: 90,
        difficulty: 'beginner'
      };

      expect(module).toBeDefined();
      expect(module.content.introduction).toBe('Welcome to psychology');
    });

    it('should accept educational module with sections', () => {
      const moduleWithSections: EducationalModule = {
        id: 'edu-module-2',
        title: 'Advanced Psychology',
        description: 'Deep dive into psychology',
        content: {
          introduction: 'Advanced topics',
          sections: [
            {
              id: 'section-1',
              title: 'Cognitive Psychology',
              content: 'Study of mental processes',
              order: 1,
              keyTerms: [
                { term: 'Cognition', definition: 'Mental action or process' }
              ],
              images: [
                {
                  id: 'img-1',
                  url: 'https://example.com/brain.jpg',
                  alt: 'Brain diagram',
                  caption: 'The human brain'
                }
              ],
              estimatedTime: 30
            }
          ]
        },
        estimatedTime: 120,
        difficulty: 'intermediate'
      };

      expect(moduleWithSections.content.sections).toHaveLength(1);
      expect(moduleWithSections.content.sections![0].keyTerms).toHaveLength(1);
    });

    it('should accept educational module with videos', () => {
      const moduleWithVideos: EducationalModule = {
        id: 'edu-module-3',
        title: 'Video Learning',
        description: 'Learn through videos',
        content: {
          introduction: 'Video-based learning',
          videos: [
            {
              id: 'video-1',
              title: 'Introduction Video',
              youtubeId: 'abc123',
              description: 'Getting started',
              duration: 600
            },
            {
              id: 'video-2',
              title: 'Advanced Concepts',
              url: 'https://example.com/video.mp4',
              description: 'Deep dive',
              duration: { hours: 1, minutes: 30, seconds: 0 },
              transcript: 'Full transcript here...',
              keyMoments: [{ time: 300, label: 'Key concept' }]
            }
          ]
        },
        estimatedTime: 180,
        difficulty: 'advanced',
        videos: [
          {
            id: 'video-3',
            title: 'Module-level video',
            description: 'Additional video',
            duration: 300
          }
        ]
      };

      expect(moduleWithVideos.content.videos).toHaveLength(2);
      expect(moduleWithVideos.videos).toHaveLength(1);
    });

    it('should accept educational module with quiz', () => {
      const moduleWithQuiz: EducationalModule = {
        id: 'edu-module-4',
        title: 'Quiz Module',
        description: 'Module with assessment',
        content: {
          introduction: 'Test your knowledge',
          summary: 'Key concepts covered',
          keyTakeaways: ['Concept 1', 'Concept 2', 'Concept 3']
        },
        quiz: {
          id: 'quiz-1',
          title: 'Module Assessment',
          questions: [
            {
              id: 'q1',
              question: 'What is psychology?',
              type: 'multiple-choice',
              options: [
                { id: 'opt1', text: 'Study of mind', isCorrect: true },
                { id: 'opt2', text: 'Study of rocks' }
              ],
              correctAnswer: 0,
              explanation: 'Psychology is the study of mind and behavior',
              difficulty: 'beginner',
              cognitiveLevel: 'recall',
              tags: ['definition', 'basics']
            }
          ]
        },
        estimatedTime: 60,
        difficulty: 'beginner'
      };

      expect(moduleWithQuiz.quiz).toBeDefined();
      expect(moduleWithQuiz.quiz!.questions).toHaveLength(1);
      expect(moduleWithQuiz.content.keyTakeaways).toHaveLength(3);
    });

    it('should accept educational module with bibliography', () => {
      const moduleWithBibliography: EducationalModule = {
        id: 'edu-module-5',
        title: 'Research Module',
        description: 'Module with references',
        content: {
          introduction: 'Academic content'
        },
        bibliography: [
          {
            id: 'ref-1',
            title: 'Psychology: The Science of Mind and Behaviour',
            authors: ['Richard Gross'],
            year: 2020,
            publisher: 'Hodder Education',
            type: 'book'
          },
          {
            id: 'ref-2',
            title: 'Cognitive Psychology: A Student\'s Handbook',
            authors: ['Michael W. Eysenck', 'Mark T. Keane'],
            year: 2020,
            publisher: 'Psychology Press',
            type: 'book',
            url: 'https://example.com/book',
            summary: 'Comprehensive guide to cognitive psychology'
          },
          {
            id: 'ref-3',
            title: 'The Role of Memory in Learning',
            authors: ['Jane Doe'],
            year: 2021,
            type: 'article',
            url: 'https://example.com/article'
          }
        ],
        estimatedTime: 120,
        difficulty: 'intermediate'
      };

      expect(moduleWithBibliography.bibliography).toHaveLength(3);
      expect(moduleWithBibliography.bibliography![0].type).toBe('book');
      expect(moduleWithBibliography.bibliography![2].type).toBe('article');
    });


    it('should accept educational module with all optional fields', () => {
      const fullModule: EducationalModule = {
        id: 'edu-module-full',
        title: 'Complete Module',
        description: 'A module with all features',
        content: {
          introduction: 'Welcome',
          sections: [{
            id: 's1',
            title: 'Section 1',
            content: 'Content',
            order: 1,
            keyTerms: [{ term: 'Term', definition: 'Definition' }],
            images: [{ id: 'img1', url: 'url', alt: 'alt', caption: 'caption' }],
            interactiveElements: [{ type: 'quiz' }],
            estimatedTime: 15
          }],
          videos: [{
            id: 'v1',
            title: 'Video',
            description: 'Description',
            duration: 300
          }],
          summary: 'Summary text',
          keyTakeaways: ['Takeaway 1', 'Takeaway 2']
        },
        quiz: {
          id: 'q1',
          title: 'Quiz',
          questions: []
        },
        bibliography: [{
          id: 'b1',
          title: 'Book',
          authors: ['Author'],
          year: 2023,
          type: 'book'
        }],
        videos: [{
          id: 'v2',
          title: 'Module Video',
          description: 'Desc',
          duration: 600
        }],
        prerequisites: ['module-1', 'module-2'],
        estimatedTime: 240,
        difficulty: 'advanced',
        category: 'Psychology',
        tags: ['cognitive', 'behavioral', 'neuroscience'],
        learningObjectives: [
          'Understand basic concepts',
          'Apply theories to practice',
          'Analyze case studies'
        ],
        metadata: {
          generatedAt: new Date().toISOString(),
          difficulty: 'advanced',
          topic: 'Cognitive Psychology',
          pipelineProcessed: true,
          pipelineResources: 5,
          qualityEnhanced: true,
          componentsIncluded: ['videos', 'quiz', 'bibliography']
        }
      };

      expect(fullModule.prerequisites).toHaveLength(2);
      expect(fullModule.tags).toHaveLength(3);
      expect(fullModule.learningObjectives).toHaveLength(3);
      expect(fullModule.metadata!.pipelineProcessed).toBe(true);
      expect(fullModule.metadata!.componentsIncluded).toContain('videos');
    });
  });

  describe('ValidationError Type', () => {
    it('should accept error severity levels', () => {
      const error: ValidationError = {
        field: 'title',
        message: 'Title is required',
        severity: 'error'
      };

      const warning: ValidationError = {
        field: 'description',
        message: 'Description is too short',
        severity: 'warning'
      };

      const info: ValidationError = {
        field: 'tags',
        message: 'Consider adding more tags',
        severity: 'info'
      };

      expect(error.severity).toBe('error');
      expect(warning.severity).toBe('warning');
      expect(info.severity).toBe('info');
    });

    it('should work in validation error arrays', () => {
      const errors: ValidationError[] = [
        { field: 'id', message: 'ID is required', severity: 'error' },
        { field: 'title', message: 'Title too long', severity: 'warning' },
        { field: 'content', message: 'Content could be improved', severity: 'info' }
      ];

      expect(errors).toHaveLength(3);
      expect(errors.filter(e => e.severity === 'error')).toHaveLength(1);
      expect(errors.filter(e => e.severity === 'warning')).toHaveLength(1);
      expect(errors.filter(e => e.severity === 'info')).toHaveLength(1);
    });
  });

  describe('Quiz Type (schema version)', () => {
    it('should accept valid quiz structure', () => {
      const quiz: Quiz = {
        id: 'quiz-schema-1',
        title: 'Psychology Quiz',
        questions: [
          {
            id: 'q1',
            question: 'What is behaviorism?',
            type: 'multiple-choice',
            options: [
              { id: 'a', text: 'Study of behavior', isCorrect: true },
              { id: 'b', text: 'Study of thoughts' },
              { id: 'c', text: 'Study of emotions' },
              { id: 'd', text: 'Study of dreams' }
            ],
            correctAnswer: 0,
            explanation: 'Behaviorism focuses on observable behavior'
          }
        ]
      };

      expect(quiz).toBeDefined();
      expect(quiz.questions[0].options).toHaveLength(4);
    });

    it('should accept quiz questions with optional fields', () => {
      const quiz: Quiz = {
        id: 'quiz-schema-2',
        title: 'Advanced Quiz',
        questions: [
          {
            id: 'q1',
            question: 'Explain cognitive dissonance',
            type: 'essay',
            options: [],
            correctAnswer: -1,
            explanation: 'Cognitive dissonance is...',
            difficulty: 'advanced',
            cognitiveLevel: 'synthesis',
            tags: ['cognitive', 'theory', 'festinger']
          },
          {
            id: 'q2',
            question: 'Match the theorists to their theories',
            type: 'matching',
            options: [
              { id: 'freud', text: 'Sigmund Freud' },
              { id: 'skinner', text: 'B.F. Skinner' },
              { id: 'psycho', text: 'Psychoanalysis', isCorrect: true },
              { id: 'operant', text: 'Operant Conditioning', isCorrect: true }
            ],
            correctAnswer: 2,
            explanation: 'Match each theorist with their contribution',
            difficulty: 'intermediate',
            cognitiveLevel: 'application'
          }
        ]
      };

      expect(quiz.questions).toHaveLength(2);
      expect(quiz.questions[0].difficulty).toBe('advanced');
      expect(quiz.questions[1].cognitiveLevel).toBe('application');
    });
  });

  describe('Type Validation Helpers', () => {
    // Helper function to validate EducationalModule
    const validateEducationalModule = (module: any): ValidationError[] => {
      const errors: ValidationError[] = [];

      if (!module.id) {
        errors.push({ field: 'id', message: 'ID is required', severity: 'error' });
      }
      if (!module.title) {
        errors.push({ field: 'title', message: 'Title is required', severity: 'error' });
      }
      if (!module.description) {
        errors.push({ field: 'description', message: 'Description is required', severity: 'error' });
      }
      if (!module.content || !module.content.introduction) {
        errors.push({ field: 'content.introduction', message: 'Introduction is required', severity: 'error' });
      }
      if (!module.estimatedTime || module.estimatedTime <= 0) {
        errors.push({ field: 'estimatedTime', message: 'Estimated time must be positive', severity: 'error' });
      }
      if (!['beginner', 'intermediate', 'advanced'].includes(module.difficulty)) {
        errors.push({ field: 'difficulty', message: 'Invalid difficulty level', severity: 'error' });
      }

      // Warnings
      if (module.description && module.description.length < 10) {
        errors.push({ field: 'description', message: 'Description is very short', severity: 'warning' });
      }
      if (!module.learningObjectives || module.learningObjectives.length === 0) {
        errors.push({ field: 'learningObjectives', message: 'Consider adding learning objectives', severity: 'info' });
      }

      return errors;
    };

    it('should validate valid educational module', () => {
      const validModule: EducationalModule = {
        id: 'valid-1',
        title: 'Valid Module',
        description: 'This is a valid module description',
        content: { introduction: 'Introduction text' },
        estimatedTime: 60,
        difficulty: 'beginner'
      };

      const errors = validateEducationalModule(validModule);
      expect(errors.filter(e => e.severity === 'error')).toHaveLength(0);
    });

    it('should catch validation errors', () => {
      const invalidModule = {
        title: 'Missing ID',
        description: 'Short',
        content: {},
        estimatedTime: -30,
        difficulty: 'expert' // invalid
      };

      const errors = validateEducationalModule(invalidModule);
      const errorMessages = errors.filter(e => e.severity === 'error');
      
      expect(errorMessages).toHaveLength(4); // id, introduction, estimatedTime, difficulty
      expect(errors.find(e => e.field === 'id')).toBeDefined();
      expect(errors.find(e => e.field === 'content.introduction')).toBeDefined();
      expect(errors.find(e => e.field === 'estimatedTime')).toBeDefined();
      expect(errors.find(e => e.field === 'difficulty')).toBeDefined();
    });

    it('should provide warnings and info', () => {
      const moduleWithWarnings: EducationalModule = {
        id: 'warn-1',
        title: 'Module with Warnings',
        description: 'Too short', // Warning: very short
        content: { introduction: 'Intro' },
        estimatedTime: 30,
        difficulty: 'beginner'
        // Info: no learning objectives
      };

      const errors = validateEducationalModule(moduleWithWarnings);
      expect(errors.find(e => e.severity === 'warning' && e.field === 'description')).toBeDefined();
      expect(errors.find(e => e.severity === 'info' && e.field === 'learningObjectives')).toBeDefined();
    });
  });

  describe('Type Compatibility Tests', () => {
    it('should allow EducationalModule to be used as Module-like structure', () => {
      const eduModule: EducationalModule = {
        id: 'edu-1',
        title: 'Educational Module',
        description: 'Description',
        content: { introduction: 'Intro' },
        estimatedTime: 60,
        difficulty: 'intermediate'
      };

      // Test that common properties are accessible
      expect(eduModule.id).toBeDefined();
      expect(eduModule.title).toBeDefined();
      expect(eduModule.description).toBeDefined();
      expect(eduModule.estimatedTime).toBe(60);
      expect(eduModule.difficulty).toBe('intermediate');
    });

    it('should handle different video duration formats', () => {
      const numericDuration: number = 300;
      const objectDuration: { hours: number; minutes: number; seconds: number } = {
        hours: 0,
        minutes: 5,
        seconds: 0
      };

      // Convert object duration to seconds
      const toSeconds = (duration: typeof objectDuration): number => {
        return duration.hours * 3600 + duration.minutes * 60 + duration.seconds;
      };

      expect(numericDuration).toBe(300);
      expect(toSeconds(objectDuration)).toBe(300);
    });
  });

  describe('Schema Factory Functions', () => {
    const createEducationalModule = (overrides?: Partial<EducationalModule>): EducationalModule => ({
      id: 'default-edu-module',
      title: 'Default Educational Module',
      description: 'Default educational module for testing',
      content: {
        introduction: 'Welcome to this educational module'
      },
      estimatedTime: 60,
      difficulty: 'beginner',
      ...overrides
    });

    const createValidationError = (
      field: string,
      message: string,
      severity: ValidationError['severity'] = 'error'
    ): ValidationError => ({
      field,
      message,
      severity
    });

    it('should create educational modules with factory', () => {
      const basicModule = createEducationalModule();
      const advancedModule = createEducationalModule({
        title: 'Advanced Topics',
        difficulty: 'advanced',
        prerequisites: ['basic-module'],
        metadata: {
          generatedAt: new Date(),
          difficulty: 'advanced',
          topic: 'Advanced Concepts',
          componentsIncluded: ['quiz', 'videos']
        }
      });

      expect(basicModule.difficulty).toBe('beginner');
      expect(advancedModule.difficulty).toBe('advanced');
      expect(advancedModule.prerequisites).toHaveLength(1);
      expect(advancedModule.metadata!.componentsIncluded).toContain('quiz');
    });

    it('should create validation errors with factory', () => {
      const errors: ValidationError[] = [
        createValidationError('id', 'ID is required'),
        createValidationError('title', 'Title too short', 'warning'),
        createValidationError('tags', 'Consider adding tags', 'info')
      ];

      expect(errors).toHaveLength(3);
      expect(errors[0].severity).toBe('error');
      expect(errors[1].severity).toBe('warning');
      expect(errors[2].severity).toBe('info');
    });
  });
});