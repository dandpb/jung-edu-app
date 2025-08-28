import { faker } from '@faker-js/faker';
import { v4 as uuidv4 } from 'uuid';

// Base entity interfaces
export interface TestUser {
  id: string;
  email: string;
  password_hash: string;
  role: 'student' | 'instructor' | 'admin';
  profile?: {
    firstName: string;
    lastName: string;
    avatar?: string;
    preferences: Record<string, any>;
  };
  created_at: Date;
  updated_at: Date;
}

export interface TestModule {
  id: string;
  title: string;
  description: string;
  content: {
    sections: TestModuleSection[];
    resources: TestResource[];
    objectives: string[];
  };
  author_id: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration: number; // minutes
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  created_at: Date;
  updated_at: Date;
}

export interface TestModuleSection {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'video' | 'interactive' | 'quiz';
  order: number;
  resources?: TestResource[];
}

export interface TestResource {
  id: string;
  type: 'pdf' | 'video' | 'audio' | 'link' | 'image';
  title: string;
  url: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface TestQuiz {
  id: string;
  module_id: string;
  title: string;
  description?: string;
  questions: TestQuizQuestion[];
  settings: {
    timeLimit?: number; // minutes
    attempts: number;
    randomizeQuestions: boolean;
    showCorrectAnswers: boolean;
    passingScore: number; // percentage
  };
  created_at: Date;
  updated_at: Date;
}

export interface TestQuizQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'matching';
  question: string;
  options?: TestQuizOption[];
  correctAnswer?: string | string[];
  explanation?: string;
  points: number;
  order: number;
}

export interface TestQuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface TestWorkflow {
  id: string;
  name: string;
  description?: string;
  definition: {
    nodes: TestWorkflowNode[];
    edges: TestWorkflowEdge[];
    triggers: TestWorkflowTrigger[];
  };
  status: 'draft' | 'active' | 'paused' | 'archived';
  metadata: {
    version: string;
    author: string;
    tags: string[];
  };
  created_at: Date;
  updated_at: Date;
}

export interface TestWorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'delay';
  config: Record<string, any>;
  position: { x: number; y: number };
}

export interface TestWorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
}

export interface TestWorkflowTrigger {
  type: 'schedule' | 'webhook' | 'user_action' | 'system_event';
  config: Record<string, any>;
}

// Factory configuration
export interface FactoryConfig {
  locale?: string;
  seed?: number;
  generateIds?: boolean;
  timestampRange?: {
    start: Date;
    end: Date;
  };
}

// Factory sequences for consistent data generation
class FactorySequence {
  private sequences: Map<string, number> = new Map();

  next(key: string, start: number = 1): number {
    const current = this.sequences.get(key) || start - 1;
    const next = current + 1;
    this.sequences.set(key, next);
    return next;
  }

  reset(key?: string): void {
    if (key) {
      this.sequences.delete(key);
    } else {
      this.sequences.clear();
    }
  }
}

// Test data factory class
export class TestDataFactory {
  private config: FactoryConfig;
  private sequence: FactorySequence;

  constructor(config: FactoryConfig = {}) {
    this.config = {
      locale: 'en',
      generateIds: true,
      timestampRange: {
        start: new Date('2023-01-01'),
        end: new Date()
      },
      ...config
    };

    // Set faker locale and seed
    faker.setLocale(this.config.locale!);
    if (this.config.seed) {
      faker.seed(this.config.seed);
    }

    this.sequence = new FactorySequence();
  }

  /**
   * Generate a test user
   */
  createUser(overrides: Partial<TestUser> = {}): TestUser {
    const roles: TestUser['role'][] = ['student', 'instructor', 'admin'];
    const timestamp = this.generateTimestamp();

    return {
      id: this.generateId(),
      email: faker.internet.email().toLowerCase(),
      password_hash: faker.datatype.hexadecimal({ length: 64, prefix: '' }),
      role: faker.helpers.arrayElement(roles),
      profile: {
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        avatar: faker.image.avatar(),
        preferences: {
          language: faker.helpers.arrayElement(['en', 'es', 'fr', 'de']),
          timezone: faker.address.timeZone(),
          notifications: faker.datatype.boolean(),
          theme: faker.helpers.arrayElement(['light', 'dark'])
        }
      },
      created_at: timestamp,
      updated_at: timestamp,
      ...overrides
    };
  }

  /**
   * Generate a test module
   */
  createModule(overrides: Partial<TestModule> = {}): TestModule {
    const difficulties: TestModule['difficulty_level'][] = ['beginner', 'intermediate', 'advanced'];
    const statuses: TestModule['status'][] = ['draft', 'published', 'archived'];
    const timestamp = this.generateTimestamp();
    const sectionCount = faker.datatype.number({ min: 3, max: 8 });

    return {
      id: this.generateId(),
      title: faker.lorem.sentence({ min: 3, max: 8 }).replace('.', ''),
      description: faker.lorem.paragraphs(2),
      content: {
        sections: Array.from({ length: sectionCount }, (_, i) => 
          this.createModuleSection({ order: i + 1 })
        ),
        resources: Array.from({ length: faker.datatype.number({ min: 2, max: 5 }) }, () =>
          this.createResource()
        ),
        objectives: Array.from({ length: faker.datatype.number({ min: 3, max: 6 }) }, () =>
          faker.lorem.sentence({ min: 4, max: 10 }).replace('.', '')
        )
      },
      author_id: this.generateId(),
      difficulty_level: faker.helpers.arrayElement(difficulties),
      estimated_duration: faker.datatype.number({ min: 15, max: 240 }),
      tags: Array.from({ length: faker.datatype.number({ min: 2, max: 6 }) }, () =>
        faker.lorem.word()
      ),
      status: faker.helpers.arrayElement(statuses),
      created_at: timestamp,
      updated_at: timestamp,
      ...overrides
    };
  }

  /**
   * Generate a module section
   */
  createModuleSection(overrides: Partial<TestModuleSection> = {}): TestModuleSection {
    const types: TestModuleSection['type'][] = ['text', 'video', 'interactive', 'quiz'];

    return {
      id: this.generateId(),
      title: faker.lorem.sentence({ min: 2, max: 6 }).replace('.', ''),
      content: faker.lorem.paragraphs(faker.datatype.number({ min: 2, max: 5 })),
      type: faker.helpers.arrayElement(types),
      order: 1,
      resources: Array.from({ length: faker.datatype.number({ min: 0, max: 3 }) }, () =>
        this.createResource()
      ),
      ...overrides
    };
  }

  /**
   * Generate a resource
   */
  createResource(overrides: Partial<TestResource> = {}): TestResource {
    const types: TestResource['type'][] = ['pdf', 'video', 'audio', 'link', 'image'];
    const type = faker.helpers.arrayElement(types);

    return {
      id: this.generateId(),
      type,
      title: faker.lorem.sentence({ min: 2, max: 8 }).replace('.', ''),
      url: this.generateResourceUrl(type),
      description: faker.lorem.sentence(),
      metadata: {
        size: faker.datatype.number({ min: 1024, max: 10485760 }),
        duration: type === 'video' || type === 'audio' ? faker.datatype.number({ min: 30, max: 1800 }) : undefined,
        format: this.getResourceFormat(type)
      },
      ...overrides
    };
  }

  /**
   * Generate a test quiz
   */
  createQuiz(overrides: Partial<TestQuiz> = {}): TestQuiz {
    const timestamp = this.generateTimestamp();
    const questionCount = faker.datatype.number({ min: 5, max: 20 });

    return {
      id: this.generateId(),
      module_id: this.generateId(),
      title: faker.lorem.sentence({ min: 3, max: 8 }).replace('.', ''),
      description: faker.lorem.paragraph(),
      questions: Array.from({ length: questionCount }, (_, i) =>
        this.createQuizQuestion({ order: i + 1 })
      ),
      settings: {
        timeLimit: faker.helpers.maybe(() => faker.datatype.number({ min: 10, max: 120 })),
        attempts: faker.datatype.number({ min: 1, max: 5 }),
        randomizeQuestions: faker.datatype.boolean(),
        showCorrectAnswers: faker.datatype.boolean(),
        passingScore: faker.datatype.number({ min: 60, max: 90 })
      },
      created_at: timestamp,
      updated_at: timestamp,
      ...overrides
    };
  }

  /**
   * Generate a quiz question
   */
  createQuizQuestion(overrides: Partial<TestQuizQuestion> = {}): TestQuizQuestion {
    const types: TestQuizQuestion['type'][] = ['multiple_choice', 'true_false', 'short_answer', 'essay', 'matching'];
    const type = faker.helpers.arrayElement(types);

    const question: TestQuizQuestion = {
      id: this.generateId(),
      type,
      question: faker.lorem.sentence() + '?',
      points: faker.datatype.number({ min: 1, max: 10 }),
      order: 1,
      explanation: faker.lorem.sentence(),
      ...overrides
    };

    // Add type-specific properties
    switch (type) {
      case 'multiple_choice':
        question.options = Array.from({ length: 4 }, (_, i) => ({
          id: this.generateId(),
          text: faker.lorem.words(faker.datatype.number({ min: 2, max: 8 })),
          isCorrect: i === 0 // First option is correct
        }));
        break;

      case 'true_false':
        question.options = [
          { id: this.generateId(), text: 'True', isCorrect: faker.datatype.boolean() },
          { id: this.generateId(), text: 'False', isCorrect: false }
        ];
        // Ensure exactly one is correct
        question.options[1].isCorrect = !question.options[0].isCorrect;
        break;

      case 'short_answer':
      case 'essay':
        question.correctAnswer = faker.lorem.words(faker.datatype.number({ min: 3, max: 10 }));
        break;

      case 'matching':
        const matchCount = faker.datatype.number({ min: 3, max: 6 });
        question.options = Array.from({ length: matchCount * 2 }, (_, i) => ({
          id: this.generateId(),
          text: faker.lorem.words(faker.datatype.number({ min: 2, max: 5 })),
          isCorrect: false // Matching logic is more complex
        }));
        break;
    }

    return question;
  }

  /**
   * Generate a test workflow
   */
  createWorkflow(overrides: Partial<TestWorkflow> = {}): TestWorkflow {
    const statuses: TestWorkflow['status'][] = ['draft', 'active', 'paused', 'archived'];
    const timestamp = this.generateTimestamp();
    const nodeCount = faker.datatype.number({ min: 3, max: 10 });

    const nodes = Array.from({ length: nodeCount }, (_, i) => 
      this.createWorkflowNode({ position: { x: i * 200, y: faker.datatype.number({ min: 0, max: 400 }) } })
    );

    const edges = Array.from({ length: nodeCount - 1 }, (_, i) => 
      this.createWorkflowEdge({
        source: nodes[i].id,
        target: nodes[i + 1].id
      })
    );

    return {
      id: this.generateId(),
      name: faker.lorem.words(faker.datatype.number({ min: 2, max: 6 })),
      description: faker.lorem.paragraph(),
      definition: {
        nodes,
        edges,
        triggers: [this.createWorkflowTrigger()]
      },
      status: faker.helpers.arrayElement(statuses),
      metadata: {
        version: faker.system.semver(),
        author: faker.name.fullName(),
        tags: Array.from({ length: faker.datatype.number({ min: 1, max: 5 }) }, () =>
          faker.lorem.word()
        )
      },
      created_at: timestamp,
      updated_at: timestamp,
      ...overrides
    };
  }

  /**
   * Generate a workflow node
   */
  createWorkflowNode(overrides: Partial<TestWorkflowNode> = {}): TestWorkflowNode {
    const types: TestWorkflowNode['type'][] = ['trigger', 'action', 'condition', 'delay'];
    const type = faker.helpers.arrayElement(types);

    return {
      id: this.generateId(),
      type,
      config: this.generateNodeConfig(type),
      position: { x: faker.datatype.number({ min: 0, max: 800 }), y: faker.datatype.number({ min: 0, max: 600 }) },
      ...overrides
    };
  }

  /**
   * Generate a workflow edge
   */
  createWorkflowEdge(overrides: Partial<TestWorkflowEdge> = {}): TestWorkflowEdge {
    return {
      id: this.generateId(),
      source: this.generateId(),
      target: this.generateId(),
      condition: faker.helpers.maybe(() => faker.lorem.words(3)),
      ...overrides
    };
  }

  /**
   * Generate a workflow trigger
   */
  createWorkflowTrigger(overrides: Partial<TestWorkflowTrigger> = {}): TestWorkflowTrigger {
    const types: TestWorkflowTrigger['type'][] = ['schedule', 'webhook', 'user_action', 'system_event'];
    const type = faker.helpers.arrayElement(types);

    return {
      type,
      config: this.generateTriggerConfig(type),
      ...overrides
    };
  }

  /**
   * Generate a batch of entities
   */
  createBatch<T>(factory: () => T, count: number): T[] {
    return Array.from({ length: count }, () => factory());
  }

  /**
   * Create related entities (e.g., user with modules and quizzes)
   */
  createUserWithModules(moduleCount: number = 3): { user: TestUser; modules: TestModule[]; quizzes: TestQuiz[] } {
    const user = this.createUser({ role: 'instructor' });
    const modules = this.createBatch(() => this.createModule({ author_id: user.id }), moduleCount);
    const quizzes = modules.map(module => this.createQuiz({ module_id: module.id }));

    return { user, modules, quizzes };
  }

  /**
   * Create a complete course structure
   */
  createCourseStructure(): {
    instructor: TestUser;
    students: TestUser[];
    modules: TestModule[];
    quizzes: TestQuiz[];
    workflows: TestWorkflow[];
  } {
    const instructor = this.createUser({ role: 'instructor' });
    const studentCount = faker.datatype.number({ min: 5, max: 15 });
    const students = this.createBatch(() => this.createUser({ role: 'student' }), studentCount);
    const moduleCount = faker.datatype.number({ min: 5, max: 10 });
    const modules = this.createBatch(() => this.createModule({ author_id: instructor.id }), moduleCount);
    const quizzes = modules.map(module => this.createQuiz({ module_id: module.id }));
    const workflows = this.createBatch(() => this.createWorkflow(), faker.datatype.number({ min: 2, max: 5 }));

    return { instructor, students, modules, quizzes, workflows };
  }

  /**
   * Reset factory state
   */
  reset(): void {
    this.sequence.reset();
    if (this.config.seed) {
      faker.seed(this.config.seed);
    }
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return this.config.generateIds ? uuidv4() : `id_${this.sequence.next('global')}`;
  }

  /**
   * Generate a timestamp within the configured range
   */
  private generateTimestamp(): Date {
    if (!this.config.timestampRange) {
      return new Date();
    }

    return faker.date.between(
      this.config.timestampRange.start,
      this.config.timestampRange.end
    );
  }

  /**
   * Generate a resource URL based on type
   */
  private generateResourceUrl(type: TestResource['type']): string {
    switch (type) {
      case 'pdf':
        return faker.internet.url() + '/document.pdf';
      case 'video':
        return faker.internet.url() + '/video.mp4';
      case 'audio':
        return faker.internet.url() + '/audio.mp3';
      case 'image':
        return faker.image.imageUrl();
      case 'link':
        return faker.internet.url();
      default:
        return faker.internet.url();
    }
  }

  /**
   * Get resource format based on type
   */
  private getResourceFormat(type: TestResource['type']): string {
    switch (type) {
      case 'pdf':
        return 'application/pdf';
      case 'video':
        return faker.helpers.arrayElement(['video/mp4', 'video/webm', 'video/ogg']);
      case 'audio':
        return faker.helpers.arrayElement(['audio/mp3', 'audio/wav', 'audio/ogg']);
      case 'image':
        return faker.helpers.arrayElement(['image/jpeg', 'image/png', 'image/gif']);
      case 'link':
        return 'text/html';
      default:
        return 'application/octet-stream';
    }
  }

  /**
   * Generate node configuration based on type
   */
  private generateNodeConfig(type: TestWorkflowNode['type']): Record<string, any> {
    switch (type) {
      case 'trigger':
        return {
          event: faker.helpers.arrayElement(['user_login', 'module_completed', 'quiz_submitted']),
          conditions: faker.lorem.words(3)
        };
      case 'action':
        return {
          type: faker.helpers.arrayElement(['send_email', 'update_progress', 'generate_certificate']),
          parameters: {
            template: faker.lorem.words(2),
            recipient: faker.internet.email()
          }
        };
      case 'condition':
        return {
          expression: faker.lorem.words(5),
          operator: faker.helpers.arrayElement(['equals', 'greater_than', 'contains'])
        };
      case 'delay':
        return {
          duration: faker.datatype.number({ min: 1, max: 60 }),
          unit: faker.helpers.arrayElement(['seconds', 'minutes', 'hours', 'days'])
        };
      default:
        return {};
    }
  }

  /**
   * Generate trigger configuration based on type
   */
  private generateTriggerConfig(type: TestWorkflowTrigger['type']): Record<string, any> {
    switch (type) {
      case 'schedule':
        return {
          cron: '0 9 * * *', // Daily at 9 AM
          timezone: faker.address.timeZone()
        };
      case 'webhook':
        return {
          url: faker.internet.url(),
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer token'
          }
        };
      case 'user_action':
        return {
          action: faker.helpers.arrayElement(['login', 'logout', 'complete_module', 'submit_quiz']),
          conditions: faker.lorem.words(3)
        };
      case 'system_event':
        return {
          event: faker.helpers.arrayElement(['backup_completed', 'maintenance_started', 'error_occurred']),
          severity: faker.helpers.arrayElement(['low', 'medium', 'high', 'critical'])
        };
      default:
        return {};
    }
  }
}

// Export factory instance with default configuration
export const testDataFactory = new TestDataFactory();

// Export factory with specific configurations
export const testDataFactories = {
  local: new TestDataFactory({ seed: 12345, locale: 'en' }),
  ci: new TestDataFactory({ seed: 54321, locale: 'en', generateIds: false }),
  staging: new TestDataFactory({ locale: 'en' }),
  performance: new TestDataFactory({
    seed: 99999,
    timestampRange: {
      start: new Date('2020-01-01'),
      end: new Date('2024-12-31')
    }
  })
};