import {
  Module,
  ModuleContent,
  Section,
  KeyTerm,
  Image,
  Video,
  Quiz,
  Option,
  Question,
  Bibliography,
  Film,
  Note,
  UserProgress,
  AdminUser,
  AppSettings,
  PublicationType,
  DifficultyLevel
} from '../../types';

describe('Types - index.ts', () => {
  describe('Module Type', () => {
    it('should accept valid module objects', () => {
      const validModule: Module = {
        id: 'module-1',
        title: 'Test Module',
        description: 'A test module',
        estimatedTime: 60,
        difficulty: 'beginner'
      };

      expect(validModule).toBeDefined();
      expect(validModule.difficulty).toMatch(/^(beginner|intermediate|advanced)$/);
    });

    it('should accept module with all optional fields', () => {
      const fullModule: Module = {
        id: 'module-2',
        title: 'Full Module',
        description: 'A complete module',
        icon: 'icon.png',
        content: {
          introduction: 'Introduction text',
          sections: []
        },
        sections: [],
        prerequisites: ['module-1'],
        learningObjectives: ['Learn TypeScript'],
        estimatedTime: 120,
        difficulty: 'intermediate',
        category: 'Programming',
        quiz: {
          id: 'quiz-1',
          title: 'Test Quiz',
          questions: []
        },
        practicalExercises: [
          {
            id: 'exercise-1',
            title: 'Practice Exercise',
            description: 'Do something practical',
            duration: 30
          }
        ]
      };

      expect(fullModule).toBeDefined();
      expect(fullModule.practicalExercises).toHaveLength(1);
    });
  });

  describe('ModuleContent Type', () => {
    it('should accept valid module content', () => {
      const content: ModuleContent = {
        introduction: 'Welcome to the module',
        sections: [
          {
            id: 'section-1',
            title: 'First Section',
            content: 'Section content',
            order: 1
          }
        ]
      };

      expect(content).toBeDefined();
      expect(content.sections).toHaveLength(1);
    });

    it('should accept module content with all optional fields', () => {
      const fullContent: ModuleContent = {
        introduction: 'Introduction',
        sections: [],
        videos: [
          {
            id: 'video-1',
            title: 'Video Title',
            description: 'Video description',
            duration: 300
          }
        ],
        quiz: {
          id: 'quiz-1',
          title: 'Quiz',
          questions: []
        },
        bibliography: [
          {
            id: 'bib-1',
            title: 'Book Title',
            authors: ['Author Name'],
            year: 2023,
            type: 'book'
          }
        ],
        films: [
          {
            id: 'film-1',
            title: 'Film Title',
            director: 'Director Name',
            year: 2023,
            relevance: 'Highly relevant'
          }
        ],
        summary: 'Module summary',
        keyTakeaways: ['Key point 1', 'Key point 2']
      };

      expect(fullContent).toBeDefined();
      expect(fullContent.videos).toHaveLength(1);
      expect(fullContent.bibliography).toHaveLength(1);
    });
  });

  describe('Section Type', () => {
    it('should accept valid section objects', () => {
      const section: Section = {
        id: 'section-1',
        title: 'Introduction',
        content: 'This is the introduction',
        order: 1
      };

      expect(section).toBeDefined();
      expect(section.order).toBeGreaterThan(0);
    });

    it('should accept section with optional fields', () => {
      const fullSection: Section = {
        id: 'section-2',
        title: 'Advanced Topics',
        content: 'Advanced content',
        order: 2,
        keyTerms: [
          { term: 'TypeScript', definition: 'A typed superset of JavaScript' }
        ],
        images: [
          {
            id: 'img-1',
            url: 'https://example.com/image.png',
            caption: 'Example image',
            alt: 'Alt text'
          }
        ],
        concepts: ['Concept 1', 'Concept 2'],
        interactiveElements: [{ type: 'quiz', id: 'quiz-1' }],
        estimatedTime: 30
      };

      expect(fullSection.keyTerms).toHaveLength(1);
      expect(fullSection.images).toHaveLength(1);
    });
  });

  describe('Video Type', () => {
    it('should accept video with numeric duration', () => {
      const video: Video = {
        id: 'video-1',
        title: 'Tutorial Video',
        description: 'A helpful tutorial',
        duration: 600
      };

      expect(video).toBeDefined();
      expect(typeof video.duration).toBe('number');
    });

    it('should accept video with object duration', () => {
      const video: Video = {
        id: 'video-2',
        title: 'Long Tutorial',
        description: 'A longer tutorial',
        duration: { hours: 1, minutes: 30, seconds: 45 }
      };

      expect(video).toBeDefined();
      expect(video.duration).toHaveProperty('hours');
      expect(video.duration).toHaveProperty('minutes');
      expect(video.duration).toHaveProperty('seconds');
    });

    it('should accept video with YouTube ID', () => {
      const video: Video = {
        id: 'video-3',
        title: 'YouTube Video',
        youtubeId: 'dQw4w9WgXcQ',
        description: 'A YouTube video',
        duration: 212
      };

      expect(video.youtubeId).toBeDefined();
    });
  });

  describe('Quiz and Question Types', () => {
    it('should accept valid quiz objects', () => {
      const quiz: Quiz = {
        id: 'quiz-1',
        title: 'Module Quiz',
        questions: [
          {
            id: 'q1',
            question: 'What is TypeScript?',
            type: 'multiple-choice',
            options: [
              { id: 'opt1', text: 'A programming language' },
              { id: 'opt2', text: 'A typed superset of JavaScript', isCorrect: true }
            ],
            correctAnswer: 1,
            explanation: 'TypeScript is a typed superset of JavaScript'
          }
        ]
      };

      expect(quiz).toBeDefined();
      expect(quiz.questions).toHaveLength(1);
    });

    it('should accept quiz with all optional fields', () => {
      const fullQuiz: Quiz = {
        id: 'quiz-2',
        title: 'Complete Quiz',
        questions: [],
        description: 'A comprehensive quiz',
        moduleId: 'module-1',
        passingScore: 80,
        timeLimit: 3600,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: { version: 1 }
      };

      expect(fullQuiz.passingScore).toBe(80);
      expect(fullQuiz.timeLimit).toBe(3600);
    });

    it('should accept question with all optional fields', () => {
      const question: Question = {
        id: 'q2',
        question: 'Complex question',
        type: 'essay',
        options: [],
        correctAnswer: 0,
        explanation: 'Detailed explanation',
        difficulty: 'advanced',
        cognitiveLevel: 'analysis',
        tags: ['typescript', 'programming'],
        points: 10,
        order: 1,
        metadata: { category: 'technical' },
        expectedKeywords: ['interface', 'type'],
        rubric: { criteria: 'Clear explanation' }
      };

      expect(question.difficulty).toBe('advanced');
      expect(question.tags).toContain('typescript');
    });
  });

  describe('Bibliography Type', () => {
    it('should accept valid bibliography entries', () => {
      const bibliography: Bibliography = {
        id: 'bib-1',
        title: 'TypeScript Handbook',
        authors: ['Microsoft'],
        year: 2023,
        type: 'online'
      };

      expect(bibliography).toBeDefined();
      expect(bibliography.type).toMatch(/^(book|article|journal|online|thesis)$/);
    });

    it('should accept bibliography with optional fields', () => {
      const fullBibliography: Bibliography = {
        id: 'bib-2',
        title: 'Advanced TypeScript',
        authors: ['John Doe', 'Jane Smith'],
        year: 2023,
        publisher: 'Tech Press',
        type: 'book',
        url: 'https://example.com/book',
        summary: 'A comprehensive guide to TypeScript'
      };

      expect(fullBibliography.publisher).toBe('Tech Press');
      expect(fullBibliography.url).toBeDefined();
    });
  });

  describe('Film Type', () => {
    it('should accept valid film objects', () => {
      const film: Film = {
        id: 'film-1',
        title: 'The Social Network',
        director: 'David Fincher',
        year: 2010,
        relevance: 'Shows the creation of Facebook'
      };

      expect(film).toBeDefined();
      expect(film.year).toBeGreaterThan(1900);
    });

    it('should accept film with optional fields', () => {
      const fullFilm: Film = {
        id: 'film-2',
        title: 'Documentary',
        director: 'Director Name',
        year: 2023,
        relevance: 'Educational content',
        trailer: 'https://youtube.com/watch?v=123',
        streamingUrl: 'https://netflix.com/watch/123',
        type: 'documentary'
      };

      expect(fullFilm.type).toBe('documentary');
      expect(fullFilm.type).toMatch(/^(documentary|fiction|educational|biographical)$/);
    });
  });

  describe('UserProgress Type', () => {
    it('should accept valid user progress', () => {
      const progress: UserProgress = {
        userId: 'user-1',
        completedModules: ['module-1', 'module-2'],
        quizScores: { 'quiz-1': 85, 'quiz-2': 92 },
        totalTime: 7200,
        lastAccessed: Date.now(),
        notes: []
      };

      expect(progress).toBeDefined();
      expect(progress.completedModules).toHaveLength(2);
      expect(progress.quizScores['quiz-1']).toBe(85);
    });

    it('should accept user progress with notes', () => {
      const note: Note = {
        id: 'note-1',
        moduleId: 'module-1',
        content: 'Important concept to remember',
        timestamp: Date.now(),
        tags: ['important', 'concept']
      };

      const progressWithNotes: UserProgress = {
        userId: 'user-2',
        completedModules: [],
        quizScores: {},
        totalTime: 0,
        lastAccessed: Date.now(),
        notes: [note]
      };

      expect(progressWithNotes.notes).toHaveLength(1);
      expect(progressWithNotes.notes[0].tags).toContain('important');
    });
  });


  describe('AdminUser Type', () => {
    it('should accept valid admin user', () => {
      const admin: AdminUser = {
        id: 'admin-1',
        username: 'admin',
        password: 'hashed_password',
        role: 'admin'
      };

      expect(admin).toBeDefined();
      expect(admin.role).toBe('admin');
    });

    it('should accept admin user with last login', () => {
      const adminWithLogin: AdminUser = {
        id: 'admin-2',
        username: 'superadmin',
        password: 'another_hashed_password',
        role: 'admin',
        lastLogin: Date.now()
      };

      expect(adminWithLogin.lastLogin).toBeDefined();
      expect(adminWithLogin.lastLogin).toBeGreaterThan(0);
    });
  });

  describe('AppSettings Type', () => {
    it('should accept valid app settings', () => {
      const settings: AppSettings = {
        modules: [],
        mindMapNodes: [],
        mindMapEdges: [],
        adminUsers: []
      };

      expect(settings).toBeDefined();
      expect(Array.isArray(settings.modules)).toBe(true);
    });

    it('should accept app settings with data', () => {
      const populatedSettings: AppSettings = {
        modules: [
          {
            id: 'module-1',
            title: 'Test Module',
            description: 'A test module',
            estimatedTime: 60,
            difficulty: 'beginner'
          }
        ],
        mindMapNodes: [
          {
            id: 'node-1',
            data: { label: 'Test Node' },
            position: { x: 0, y: 0 }
          }
        ],
        mindMapEdges: [
          {
            id: 'edge-1',
            source: 'node-1',
            target: 'node-2'
          }
        ],
        adminUsers: [
          {
            id: 'admin-1',
            username: 'admin',
            password: 'password',
            role: 'admin'
          }
        ]
      };

      expect(populatedSettings.modules).toHaveLength(1);
      expect(populatedSettings.mindMapNodes).toHaveLength(1);
      expect(populatedSettings.mindMapEdges).toHaveLength(1);
      expect(populatedSettings.adminUsers).toHaveLength(1);
    });
  });

  describe('Type Aliases', () => {
    it('should validate PublicationType values', () => {
      const types: PublicationType[] = ['book', 'article', 'journal', 'online', 'thesis'];
      
      types.forEach(type => {
        expect(type).toMatch(/^(book|article|journal|online|thesis)$/);
      });
    });

    it('should validate DifficultyLevel values', () => {
      const levels: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced'];
      
      levels.forEach(level => {
        expect(level).toMatch(/^(beginner|intermediate|advanced)$/);
      });
    });
  });

  describe('Type Factory Functions', () => {
    // Helper functions to create valid objects
    const createModule = (overrides?: Partial<Module>): Module => ({
      id: 'default-module',
      title: 'Default Module',
      description: 'Default description',
      estimatedTime: 60,
      difficulty: 'beginner',
      ...overrides
    });

    const createQuiz = (overrides?: Partial<Quiz>): Quiz => ({
      id: 'default-quiz',
      title: 'Default Quiz',
      questions: [],
      ...overrides
    });

    const createQuestion = (overrides?: Partial<Question>): Question => ({
      id: 'default-question',
      question: 'Default question?',
      type: 'multiple-choice',
      options: [],
      correctAnswer: 0,
      explanation: 'Default explanation',
      ...overrides
    });

    it('should create valid modules using factory', () => {
      const module1 = createModule();
      const module2 = createModule({ 
        title: 'Advanced Module', 
        difficulty: 'advanced' 
      });

      expect(module1.difficulty).toBe('beginner');
      expect(module2.difficulty).toBe('advanced');
      expect(module2.title).toBe('Advanced Module');
    });

    it('should create valid quizzes using factory', () => {
      const quiz = createQuiz({
        questions: [
          createQuestion({ 
            question: 'What is TypeScript?',
            options: [
              { id: '1', text: 'A language' },
              { id: '2', text: 'A framework' }
            ]
          })
        ]
      });

      expect(quiz.questions).toHaveLength(1);
      expect(quiz.questions[0].question).toBe('What is TypeScript?');
    });
  });

  describe('Type Guards', () => {
    // Type guard functions
    const isModule = (obj: any): obj is Module => {
      return obj &&
        typeof obj.id === 'string' &&
        typeof obj.title === 'string' &&
        typeof obj.description === 'string' &&
        typeof obj.estimatedTime === 'number' &&
        ['beginner', 'intermediate', 'advanced'].includes(obj.difficulty);
    };

    const isVideo = (obj: any): obj is Video => {
      return obj &&
        typeof obj.id === 'string' &&
        typeof obj.title === 'string' &&
        typeof obj.description === 'string' &&
        (typeof obj.duration === 'number' || 
         (typeof obj.duration === 'object' && 
          'hours' in obj.duration && 
          'minutes' in obj.duration && 
          'seconds' in obj.duration));
    };

    it('should correctly identify Module objects', () => {
      const validModule = {
        id: 'mod-1',
        title: 'Test',
        description: 'Test module',
        estimatedTime: 60,
        difficulty: 'beginner'
      };

      const invalidModule = {
        id: 'mod-1',
        title: 'Test',
        // missing required fields
      };

      expect(isModule(validModule)).toBe(true);
      expect(isModule(invalidModule)).toBe(false);
      expect(isModule(null)).toBeFalsy();
      expect(isModule(undefined)).toBeFalsy();
    });

    it('should correctly identify Video objects', () => {
      const videoWithNumericDuration = {
        id: 'vid-1',
        title: 'Video',
        description: 'A video',
        duration: 300
      };

      const videoWithObjectDuration = {
        id: 'vid-2',
        title: 'Video',
        description: 'A video',
        duration: { hours: 1, minutes: 30, seconds: 0 }
      };

      const invalidVideo = {
        id: 'vid-3',
        title: 'Video',
        // missing description and duration
      };

      expect(isVideo(videoWithNumericDuration)).toBe(true);
      expect(isVideo(videoWithObjectDuration)).toBe(true);
      expect(isVideo(invalidVideo)).toBe(false);
    });
  });
});