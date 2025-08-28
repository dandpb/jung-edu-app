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
    estimated_duration: number;
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
        timeLimit?: number;
        attempts: number;
        randomizeQuestions: boolean;
        showCorrectAnswers: boolean;
        passingScore: number;
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
    position: {
        x: number;
        y: number;
    };
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
export interface FactoryConfig {
    locale?: string;
    seed?: number;
    generateIds?: boolean;
    timestampRange?: {
        start: Date;
        end: Date;
    };
}
export declare class TestDataFactory {
    private config;
    private sequence;
    constructor(config?: FactoryConfig);
    /**
     * Generate a test user
     */
    createUser(overrides?: Partial<TestUser>): TestUser;
    /**
     * Generate a test module
     */
    createModule(overrides?: Partial<TestModule>): TestModule;
    /**
     * Generate a module section
     */
    createModuleSection(overrides?: Partial<TestModuleSection>): TestModuleSection;
    /**
     * Generate a resource
     */
    createResource(overrides?: Partial<TestResource>): TestResource;
    /**
     * Generate a test quiz
     */
    createQuiz(overrides?: Partial<TestQuiz>): TestQuiz;
    /**
     * Generate a quiz question
     */
    createQuizQuestion(overrides?: Partial<TestQuizQuestion>): TestQuizQuestion;
    /**
     * Generate a test workflow
     */
    createWorkflow(overrides?: Partial<TestWorkflow>): TestWorkflow;
    /**
     * Generate a workflow node
     */
    createWorkflowNode(overrides?: Partial<TestWorkflowNode>): TestWorkflowNode;
    /**
     * Generate a workflow edge
     */
    createWorkflowEdge(overrides?: Partial<TestWorkflowEdge>): TestWorkflowEdge;
    /**
     * Generate a workflow trigger
     */
    createWorkflowTrigger(overrides?: Partial<TestWorkflowTrigger>): TestWorkflowTrigger;
    /**
     * Generate a batch of entities
     */
    createBatch<T>(factory: () => T, count: number): T[];
    /**
     * Create related entities (e.g., user with modules and quizzes)
     */
    createUserWithModules(moduleCount?: number): {
        user: TestUser;
        modules: TestModule[];
        quizzes: TestQuiz[];
    };
    /**
     * Create a complete course structure
     */
    createCourseStructure(): {
        instructor: TestUser;
        students: TestUser[];
        modules: TestModule[];
        quizzes: TestQuiz[];
        workflows: TestWorkflow[];
    };
    /**
     * Reset factory state
     */
    reset(): void;
    /**
     * Generate a unique ID
     */
    private generateId;
    /**
     * Generate a timestamp within the configured range
     */
    private generateTimestamp;
    /**
     * Generate a resource URL based on type
     */
    private generateResourceUrl;
    /**
     * Get resource format based on type
     */
    private getResourceFormat;
    /**
     * Generate node configuration based on type
     */
    private generateNodeConfig;
    /**
     * Generate trigger configuration based on type
     */
    private generateTriggerConfig;
}
export declare const testDataFactory: TestDataFactory;
export declare const testDataFactories: {
    local: TestDataFactory;
    ci: TestDataFactory;
    staging: TestDataFactory;
    performance: TestDataFactory;
};
//# sourceMappingURL=test-data-factory.d.ts.map