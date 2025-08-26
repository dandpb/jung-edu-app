import { EducationalModule, ModuleContent, Quiz, DifficultyLevel, ModuleStatus } from '../../schemas/module.schema';

/**
 * Builder pattern for creating test modules with sensible defaults
 */
export class ModuleBuilder {
  private module: Partial<EducationalModule> = {};

  constructor() {
    // Set sensible defaults
    this.module = {
      id: `module-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: 'Test Module',
      description: 'A test module for unit testing',
      content: this.createDefaultContent(),
      videos: [],
      prerequisites: [],
      timeEstimate: {
        hours: 1,
        minutes: 0
      },
      difficultyLevel: DifficultyLevel.INTERMEDIATE,
      tags: ['test', 'jung'],
      learningObjectives: [],
      quiz: {
        id: 'quiz-default',
        title: 'Default Quiz',
        description: 'Default quiz for testing',
        questions: [{
          id: 'q1',
          type: 'multiple-choice',
          question: 'Default question?',
          options: [
            { id: 0, text: 'Option A', isCorrect: true },
            { id: 1, text: 'Option B', isCorrect: false },
            { id: 2, text: 'Option C', isCorrect: false },
            { id: 3, text: 'Option D', isCorrect: false }
          ],
          correctAnswers: [0],
          allowMultiple: false,
          points: 1,
          explanation: 'Default explanation'
        }],
        passingScore: 70
      },
      bibliography: [],
      filmReferences: [],
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1.0.0',
        status: ModuleStatus.DRAFT,
        language: 'en',
        author: {
          id: 'test-author',
          name: 'Test Author'
        }
      }
    };
  }

  private createDefaultContent(): ModuleContent {
    return {
      introduction: 'Default introduction for testing',
      sections: [{
        id: 'section-1',
        title: 'Default Section',
        content: 'Default section content',
        order: 0,
        keyTerms: [],
        images: [],
        interactiveElements: [],
        estimatedTime: 10
      }],
      summary: 'Default summary',
      keyTakeaways: ['Default takeaway 1', 'Default takeaway 2']
    };
  }

  private createDefaultQuiz(): Quiz {
    return {
      id: 'quiz-default',
      title: 'Default Quiz',
      description: 'Default quiz for testing',
      questions: [{
        id: 'q1',
        type: 'multiple-choice',
        question: 'Default question?',
        options: [
          { id: 0, text: 'Option A', isCorrect: true },
          { id: 1, text: 'Option B', isCorrect: false },
          { id: 2, text: 'Option C', isCorrect: false },
          { id: 3, text: 'Option D', isCorrect: false }
        ],
        correctAnswers: [0],
        allowMultiple: false,
        points: 1,
        explanation: 'Default explanation'
      }],
      passingScore: 70
    };
  }

  withId(id: string): ModuleBuilder {
    this.module.id = id;
    return this;
  }

  withTitle(title: string): ModuleBuilder {
    this.module.title = title;
    return this;
  }

  withDescription(description: string): ModuleBuilder {
    this.module.description = description;
    return this;
  }

  withDifficulty(level: 'beginner' | 'intermediate' | 'advanced' | 'expert'): ModuleBuilder {
    const difficultyMap = {
      'beginner': DifficultyLevel.BEGINNER,
      'intermediate': DifficultyLevel.INTERMEDIATE,
      'advanced': DifficultyLevel.ADVANCED,
      'expert': DifficultyLevel.ADVANCED // Map expert to advanced since there's no expert level
    };
    this.module.difficultyLevel = difficultyMap[level];
    return this;
  }

  withTags(...tags: string[]): ModuleBuilder {
    this.module.tags = tags;
    return this;
  }

  withTimeEstimate(hours: number, minutes: number = 0): ModuleBuilder {
    this.module.timeEstimate = { hours, minutes };
    return this;
  }

  withContent(content: Partial<ModuleContent>): ModuleBuilder {
    this.module.content = { ...this.module.content!, ...content };
    return this;
  }

  withSections(...sections: ModuleContent['sections']): ModuleBuilder {
    if (!this.module.content) this.module.content = this.createDefaultContent();
    this.module.content.sections = sections;
    return this;
  }

  withQuiz(quiz: Quiz): ModuleBuilder {
    this.module.quiz = quiz;
    return this;
  }

  withVideos(...videos: any[]): ModuleBuilder {
    this.module.videos = videos;
    return this;
  }


  withBibliography(...items: any[]): ModuleBuilder {
    this.module.bibliography = items;
    return this;
  }

  withFilmReferences(...items: any[]): ModuleBuilder {
    this.module.filmReferences = items;
    return this;
  }

  withStatus(status: 'draft' | 'published' | 'archived'): ModuleBuilder {
    if (this.module.metadata) {
      const statusMap = {
        'draft': ModuleStatus.DRAFT,
        'published': ModuleStatus.PUBLISHED,
        'archived': ModuleStatus.ARCHIVED
      };
      this.module.metadata.status = statusMap[status] || ModuleStatus.DRAFT;
    }
    return this;
  }

  withAuthor(id: string, name: string): ModuleBuilder {
    if (this.module.metadata) {
      this.module.metadata.author = { id, name };
    }
    return this;
  }

  build(): EducationalModule {
    // Ensure all required fields are present
    const module: EducationalModule = {
      id: this.module.id || `module-${Date.now()}`,
      title: this.module.title || 'Untitled Module',
      description: this.module.description || 'No description',
      content: this.module.content || this.createDefaultContent(),
      videos: this.module.videos || [],
      quiz: this.module.quiz || this.createDefaultQuiz(),
      bibliography: this.module.bibliography || [],
      filmReferences: this.module.filmReferences || [],
      tags: this.module.tags || [],
      difficultyLevel: this.module.difficultyLevel || DifficultyLevel.BEGINNER,
      timeEstimate: this.module.timeEstimate || { hours: 0, minutes: 30 },
      metadata: this.module.metadata || {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1.0.0',
        status: ModuleStatus.DRAFT,
        language: 'en',
        author: { id: 'system', name: 'System' }
      },
      prerequisites: this.module.prerequisites,
      learningObjectives: this.module.learningObjectives,
      icon: this.module.icon
    };
    return module;
  }

  /**
   * Creates a minimal valid module for testing
   */
  static minimal(): EducationalModule {
    return new ModuleBuilder()
      .withTitle('Minimal Module')
      .withDescription('Minimal description')
      .build();
  }

  /**
   * Creates a complete module with all fields populated
   */
  static complete(): EducationalModule {
    return new ModuleBuilder()
      .withTitle('Complete Jungian Psychology Module')
      .withDescription('A comprehensive exploration of Jungian concepts')
      .withDifficulty('advanced')
      .withTags('jung', 'psychology', 'archetypes', 'shadow')
      .withTimeEstimate(2, 30)
      .withContent({
        introduction: 'This module provides a deep dive into Carl Jung\'s analytical psychology...',
        sections: [
          {
            id: 'section-1',
            title: 'The Collective Unconscious',
            content: 'Jung\'s concept of the collective unconscious represents...',
            order: 0,
            keyTerms: [
              { term: 'collective unconscious', definition: 'A part of the unconscious mind shared by all humanity' },
              { term: 'archetypes', definition: 'Universal, archaic patterns and images' },
              { term: 'instincts', definition: 'Inherited patterns of behavior' }
            ],
            images: [{ 
              id: 'img1',
              url: 'https://example.com/image1.jpg', 
              caption: 'Jung\'s model',
              alt: 'Diagram of Jung\'s model of the psyche'
            }],
            interactiveElements: [],
            estimatedTime: 20
          },
          {
            id: 'section-2',
            title: 'Major Archetypes',
            content: 'The major archetypes include the Self, Shadow, Anima/Animus...',
            order: 1,
            keyTerms: [
              { term: 'Self', definition: 'The unified totality of conscious and unconscious' },
              { term: 'Shadow', definition: 'The repressed or undeveloped aspects of the personality' },
              { term: 'Anima', definition: 'The feminine aspect in the male psyche' },
              { term: 'Animus', definition: 'The masculine aspect in the female psyche' },
              { term: 'Persona', definition: 'The mask or social face presented to the world' }
            ],
            images: [],
            interactiveElements: [],
            estimatedTime: 25
          }
        ],
        summary: 'This module covered the fundamental concepts of Jungian psychology...',
        keyTakeaways: [
          'The collective unconscious contains universal patterns',
          'Archetypes shape our psychological experiences',
          'Individuation is the process of psychological integration'
        ]
      })
      .withVideos({
        id: 'video-1',
        title: 'Introduction to Jung',
        url: 'https://youtube.com/watch?v=example',
        duration: 600,
        platform: 'youtube',
        description: 'An introduction to Carl Jung\'s life and work'
      })
      .withBibliography({
        id: 'bib-1',
        title: 'Man and His Symbols',
        author: 'Carl G. Jung',
        year: '1964',
        type: 'book',
        relevance: 'Primary source on Jungian symbolism'
      })
      .withStatus('published')
      .build();
  }

  /**
   * Creates a module focused on a specific Jungian concept
   */
  static withConcept(concept: 'shadow' | 'anima' | 'individuation' | 'archetypes'): EducationalModule {
    const concepts = {
      shadow: {
        title: 'Understanding the Shadow',
        description: 'Exploring Jung\'s concept of the Shadow and shadow work',
        tags: ['shadow', 'jung', 'psychology', 'self-awareness']
      },
      anima: {
        title: 'Anima and Animus',
        description: 'The contrasexual aspects of the psyche',
        tags: ['anima', 'animus', 'jung', 'gender', 'psychology']
      },
      individuation: {
        title: 'The Individuation Process',
        description: 'Jung\'s path to psychological wholeness',
        tags: ['individuation', 'self', 'jung', 'development']
      },
      archetypes: {
        title: 'Archetypal Patterns',
        description: 'Universal patterns in the collective unconscious',
        tags: ['archetypes', 'collective-unconscious', 'jung', 'mythology']
      }
    };

    const config = concepts[concept];
    return new ModuleBuilder()
      .withTitle(config.title)
      .withDescription(config.description)
      .withTags(...config.tags)
      .build();
  }
}