"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testDataFactories = exports.testDataFactory = exports.TestDataFactory = void 0;
const faker_1 = require("@faker-js/faker");
const uuid_1 = require("uuid");
// Factory sequences for consistent data generation
class FactorySequence {
    constructor() {
        this.sequences = new Map();
    }
    next(key, start = 1) {
        const current = this.sequences.get(key) || start - 1;
        const next = current + 1;
        this.sequences.set(key, next);
        return next;
    }
    reset(key) {
        if (key) {
            this.sequences.delete(key);
        }
        else {
            this.sequences.clear();
        }
    }
}
// Test data factory class
class TestDataFactory {
    constructor(config = {}) {
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
        faker_1.faker.setLocale(this.config.locale);
        if (this.config.seed) {
            faker_1.faker.seed(this.config.seed);
        }
        this.sequence = new FactorySequence();
    }
    /**
     * Generate a test user
     */
    createUser(overrides = {}) {
        const roles = ['student', 'instructor', 'admin'];
        const timestamp = this.generateTimestamp();
        return {
            id: this.generateId(),
            email: faker_1.faker.internet.email().toLowerCase(),
            password_hash: faker_1.faker.datatype.hexadecimal({ length: 64, prefix: '' }),
            role: faker_1.faker.helpers.arrayElement(roles),
            profile: {
                firstName: faker_1.faker.name.firstName(),
                lastName: faker_1.faker.name.lastName(),
                avatar: faker_1.faker.image.avatar(),
                preferences: {
                    language: faker_1.faker.helpers.arrayElement(['en', 'es', 'fr', 'de']),
                    timezone: faker_1.faker.address.timeZone(),
                    notifications: faker_1.faker.datatype.boolean(),
                    theme: faker_1.faker.helpers.arrayElement(['light', 'dark'])
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
    createModule(overrides = {}) {
        const difficulties = ['beginner', 'intermediate', 'advanced'];
        const statuses = ['draft', 'published', 'archived'];
        const timestamp = this.generateTimestamp();
        const sectionCount = faker_1.faker.datatype.number({ min: 3, max: 8 });
        return {
            id: this.generateId(),
            title: faker_1.faker.lorem.sentence({ min: 3, max: 8 }).replace('.', ''),
            description: faker_1.faker.lorem.paragraphs(2),
            content: {
                sections: Array.from({ length: sectionCount }, (_, i) => this.createModuleSection({ order: i + 1 })),
                resources: Array.from({ length: faker_1.faker.datatype.number({ min: 2, max: 5 }) }, () => this.createResource()),
                objectives: Array.from({ length: faker_1.faker.datatype.number({ min: 3, max: 6 }) }, () => faker_1.faker.lorem.sentence({ min: 4, max: 10 }).replace('.', ''))
            },
            author_id: this.generateId(),
            difficulty_level: faker_1.faker.helpers.arrayElement(difficulties),
            estimated_duration: faker_1.faker.datatype.number({ min: 15, max: 240 }),
            tags: Array.from({ length: faker_1.faker.datatype.number({ min: 2, max: 6 }) }, () => faker_1.faker.lorem.word()),
            status: faker_1.faker.helpers.arrayElement(statuses),
            created_at: timestamp,
            updated_at: timestamp,
            ...overrides
        };
    }
    /**
     * Generate a module section
     */
    createModuleSection(overrides = {}) {
        const types = ['text', 'video', 'interactive', 'quiz'];
        return {
            id: this.generateId(),
            title: faker_1.faker.lorem.sentence({ min: 2, max: 6 }).replace('.', ''),
            content: faker_1.faker.lorem.paragraphs(faker_1.faker.datatype.number({ min: 2, max: 5 })),
            type: faker_1.faker.helpers.arrayElement(types),
            order: 1,
            resources: Array.from({ length: faker_1.faker.datatype.number({ min: 0, max: 3 }) }, () => this.createResource()),
            ...overrides
        };
    }
    /**
     * Generate a resource
     */
    createResource(overrides = {}) {
        const types = ['pdf', 'video', 'audio', 'link', 'image'];
        const type = faker_1.faker.helpers.arrayElement(types);
        return {
            id: this.generateId(),
            type,
            title: faker_1.faker.lorem.sentence({ min: 2, max: 8 }).replace('.', ''),
            url: this.generateResourceUrl(type),
            description: faker_1.faker.lorem.sentence(),
            metadata: {
                size: faker_1.faker.datatype.number({ min: 1024, max: 10485760 }),
                duration: type === 'video' || type === 'audio' ? faker_1.faker.datatype.number({ min: 30, max: 1800 }) : undefined,
                format: this.getResourceFormat(type)
            },
            ...overrides
        };
    }
    /**
     * Generate a test quiz
     */
    createQuiz(overrides = {}) {
        const timestamp = this.generateTimestamp();
        const questionCount = faker_1.faker.datatype.number({ min: 5, max: 20 });
        return {
            id: this.generateId(),
            module_id: this.generateId(),
            title: faker_1.faker.lorem.sentence({ min: 3, max: 8 }).replace('.', ''),
            description: faker_1.faker.lorem.paragraph(),
            questions: Array.from({ length: questionCount }, (_, i) => this.createQuizQuestion({ order: i + 1 })),
            settings: {
                timeLimit: faker_1.faker.helpers.maybe(() => faker_1.faker.datatype.number({ min: 10, max: 120 })),
                attempts: faker_1.faker.datatype.number({ min: 1, max: 5 }),
                randomizeQuestions: faker_1.faker.datatype.boolean(),
                showCorrectAnswers: faker_1.faker.datatype.boolean(),
                passingScore: faker_1.faker.datatype.number({ min: 60, max: 90 })
            },
            created_at: timestamp,
            updated_at: timestamp,
            ...overrides
        };
    }
    /**
     * Generate a quiz question
     */
    createQuizQuestion(overrides = {}) {
        const types = ['multiple_choice', 'true_false', 'short_answer', 'essay', 'matching'];
        const type = faker_1.faker.helpers.arrayElement(types);
        const question = {
            id: this.generateId(),
            type,
            question: faker_1.faker.lorem.sentence() + '?',
            points: faker_1.faker.datatype.number({ min: 1, max: 10 }),
            order: 1,
            explanation: faker_1.faker.lorem.sentence(),
            ...overrides
        };
        // Add type-specific properties
        switch (type) {
            case 'multiple_choice':
                question.options = Array.from({ length: 4 }, (_, i) => ({
                    id: this.generateId(),
                    text: faker_1.faker.lorem.words(faker_1.faker.datatype.number({ min: 2, max: 8 })),
                    isCorrect: i === 0 // First option is correct
                }));
                break;
            case 'true_false':
                question.options = [
                    { id: this.generateId(), text: 'True', isCorrect: faker_1.faker.datatype.boolean() },
                    { id: this.generateId(), text: 'False', isCorrect: false }
                ];
                // Ensure exactly one is correct
                question.options[1].isCorrect = !question.options[0].isCorrect;
                break;
            case 'short_answer':
            case 'essay':
                question.correctAnswer = faker_1.faker.lorem.words(faker_1.faker.datatype.number({ min: 3, max: 10 }));
                break;
            case 'matching':
                const matchCount = faker_1.faker.datatype.number({ min: 3, max: 6 });
                question.options = Array.from({ length: matchCount * 2 }, (_, i) => ({
                    id: this.generateId(),
                    text: faker_1.faker.lorem.words(faker_1.faker.datatype.number({ min: 2, max: 5 })),
                    isCorrect: false // Matching logic is more complex
                }));
                break;
        }
        return question;
    }
    /**
     * Generate a test workflow
     */
    createWorkflow(overrides = {}) {
        const statuses = ['draft', 'active', 'paused', 'archived'];
        const timestamp = this.generateTimestamp();
        const nodeCount = faker_1.faker.datatype.number({ min: 3, max: 10 });
        const nodes = Array.from({ length: nodeCount }, (_, i) => this.createWorkflowNode({ position: { x: i * 200, y: faker_1.faker.datatype.number({ min: 0, max: 400 }) } }));
        const edges = Array.from({ length: nodeCount - 1 }, (_, i) => this.createWorkflowEdge({
            source: nodes[i].id,
            target: nodes[i + 1].id
        }));
        return {
            id: this.generateId(),
            name: faker_1.faker.lorem.words(faker_1.faker.datatype.number({ min: 2, max: 6 })),
            description: faker_1.faker.lorem.paragraph(),
            definition: {
                nodes,
                edges,
                triggers: [this.createWorkflowTrigger()]
            },
            status: faker_1.faker.helpers.arrayElement(statuses),
            metadata: {
                version: faker_1.faker.system.semver(),
                author: faker_1.faker.name.fullName(),
                tags: Array.from({ length: faker_1.faker.datatype.number({ min: 1, max: 5 }) }, () => faker_1.faker.lorem.word())
            },
            created_at: timestamp,
            updated_at: timestamp,
            ...overrides
        };
    }
    /**
     * Generate a workflow node
     */
    createWorkflowNode(overrides = {}) {
        const types = ['trigger', 'action', 'condition', 'delay'];
        const type = faker_1.faker.helpers.arrayElement(types);
        return {
            id: this.generateId(),
            type,
            config: this.generateNodeConfig(type),
            position: { x: faker_1.faker.datatype.number({ min: 0, max: 800 }), y: faker_1.faker.datatype.number({ min: 0, max: 600 }) },
            ...overrides
        };
    }
    /**
     * Generate a workflow edge
     */
    createWorkflowEdge(overrides = {}) {
        return {
            id: this.generateId(),
            source: this.generateId(),
            target: this.generateId(),
            condition: faker_1.faker.helpers.maybe(() => faker_1.faker.lorem.words(3)),
            ...overrides
        };
    }
    /**
     * Generate a workflow trigger
     */
    createWorkflowTrigger(overrides = {}) {
        const types = ['schedule', 'webhook', 'user_action', 'system_event'];
        const type = faker_1.faker.helpers.arrayElement(types);
        return {
            type,
            config: this.generateTriggerConfig(type),
            ...overrides
        };
    }
    /**
     * Generate a batch of entities
     */
    createBatch(factory, count) {
        return Array.from({ length: count }, () => factory());
    }
    /**
     * Create related entities (e.g., user with modules and quizzes)
     */
    createUserWithModules(moduleCount = 3) {
        const user = this.createUser({ role: 'instructor' });
        const modules = this.createBatch(() => this.createModule({ author_id: user.id }), moduleCount);
        const quizzes = modules.map(module => this.createQuiz({ module_id: module.id }));
        return { user, modules, quizzes };
    }
    /**
     * Create a complete course structure
     */
    createCourseStructure() {
        const instructor = this.createUser({ role: 'instructor' });
        const studentCount = faker_1.faker.datatype.number({ min: 5, max: 15 });
        const students = this.createBatch(() => this.createUser({ role: 'student' }), studentCount);
        const moduleCount = faker_1.faker.datatype.number({ min: 5, max: 10 });
        const modules = this.createBatch(() => this.createModule({ author_id: instructor.id }), moduleCount);
        const quizzes = modules.map(module => this.createQuiz({ module_id: module.id }));
        const workflows = this.createBatch(() => this.createWorkflow(), faker_1.faker.datatype.number({ min: 2, max: 5 }));
        return { instructor, students, modules, quizzes, workflows };
    }
    /**
     * Reset factory state
     */
    reset() {
        this.sequence.reset();
        if (this.config.seed) {
            faker_1.faker.seed(this.config.seed);
        }
    }
    /**
     * Generate a unique ID
     */
    generateId() {
        return this.config.generateIds ? (0, uuid_1.v4)() : `id_${this.sequence.next('global')}`;
    }
    /**
     * Generate a timestamp within the configured range
     */
    generateTimestamp() {
        if (!this.config.timestampRange) {
            return new Date();
        }
        return faker_1.faker.date.between(this.config.timestampRange.start, this.config.timestampRange.end);
    }
    /**
     * Generate a resource URL based on type
     */
    generateResourceUrl(type) {
        switch (type) {
            case 'pdf':
                return faker_1.faker.internet.url() + '/document.pdf';
            case 'video':
                return faker_1.faker.internet.url() + '/video.mp4';
            case 'audio':
                return faker_1.faker.internet.url() + '/audio.mp3';
            case 'image':
                return faker_1.faker.image.imageUrl();
            case 'link':
                return faker_1.faker.internet.url();
            default:
                return faker_1.faker.internet.url();
        }
    }
    /**
     * Get resource format based on type
     */
    getResourceFormat(type) {
        switch (type) {
            case 'pdf':
                return 'application/pdf';
            case 'video':
                return faker_1.faker.helpers.arrayElement(['video/mp4', 'video/webm', 'video/ogg']);
            case 'audio':
                return faker_1.faker.helpers.arrayElement(['audio/mp3', 'audio/wav', 'audio/ogg']);
            case 'image':
                return faker_1.faker.helpers.arrayElement(['image/jpeg', 'image/png', 'image/gif']);
            case 'link':
                return 'text/html';
            default:
                return 'application/octet-stream';
        }
    }
    /**
     * Generate node configuration based on type
     */
    generateNodeConfig(type) {
        switch (type) {
            case 'trigger':
                return {
                    event: faker_1.faker.helpers.arrayElement(['user_login', 'module_completed', 'quiz_submitted']),
                    conditions: faker_1.faker.lorem.words(3)
                };
            case 'action':
                return {
                    type: faker_1.faker.helpers.arrayElement(['send_email', 'update_progress', 'generate_certificate']),
                    parameters: {
                        template: faker_1.faker.lorem.words(2),
                        recipient: faker_1.faker.internet.email()
                    }
                };
            case 'condition':
                return {
                    expression: faker_1.faker.lorem.words(5),
                    operator: faker_1.faker.helpers.arrayElement(['equals', 'greater_than', 'contains'])
                };
            case 'delay':
                return {
                    duration: faker_1.faker.datatype.number({ min: 1, max: 60 }),
                    unit: faker_1.faker.helpers.arrayElement(['seconds', 'minutes', 'hours', 'days'])
                };
            default:
                return {};
        }
    }
    /**
     * Generate trigger configuration based on type
     */
    generateTriggerConfig(type) {
        switch (type) {
            case 'schedule':
                return {
                    cron: '0 9 * * *', // Daily at 9 AM
                    timezone: faker_1.faker.address.timeZone()
                };
            case 'webhook':
                return {
                    url: faker_1.faker.internet.url(),
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer token'
                    }
                };
            case 'user_action':
                return {
                    action: faker_1.faker.helpers.arrayElement(['login', 'logout', 'complete_module', 'submit_quiz']),
                    conditions: faker_1.faker.lorem.words(3)
                };
            case 'system_event':
                return {
                    event: faker_1.faker.helpers.arrayElement(['backup_completed', 'maintenance_started', 'error_occurred']),
                    severity: faker_1.faker.helpers.arrayElement(['low', 'medium', 'high', 'critical'])
                };
            default:
                return {};
        }
    }
}
exports.TestDataFactory = TestDataFactory;
// Export factory instance with default configuration
exports.testDataFactory = new TestDataFactory();
// Export factory with specific configurations
exports.testDataFactories = {
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
//# sourceMappingURL=test-data-factory.js.map