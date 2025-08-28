"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateExecutionResult = exports.validateWorkflowStructure = exports.TEST_CONSTANTS = exports.setupIntegrationTestEnvironment = exports.createMockStatePersistence = exports.createMockStateManager = exports.createLoadTestScenario = exports.measureExecutionTime = exports.createCircuitBreakerScenario = exports.createValidationErrorScenario = exports.createNetworkErrorScenario = exports.expectServiceCollaboration = exports.expectEventEmission = exports.expectStepExecutionOrder = exports.expectWorkflowInteraction = exports.WorkflowBuilder = exports.createMockExecutionContext = exports.createMockEventEmitter = exports.createMockService = exports.createMockRepository = exports.createMockStepExecutionResult = exports.createMockExecutionResult = exports.createMockExecutionState = exports.createMockWorkflowStep = exports.createMockWorkflow = void 0;
const globals_1 = require("@jest/globals");
const Workflow_1 = require("../../src/types/Workflow");
/**
 * Test Helpers for Workflow Automation Tests
 * Following London School TDD principles with mock-first approach
 */
// Mock Factory Functions
const createMockWorkflow = (overrides = {}) => ({
    id: 'test-workflow-123',
    name: 'Test Workflow',
    description: 'A workflow for testing purposes',
    status: Workflow_1.WorkflowStatus.DRAFT,
    steps: [
        {
            id: 'step-1',
            name: 'First Step',
            type: 'action',
            config: { action: 'test-action' },
            order: 1
        },
        {
            id: 'step-2',
            name: 'Second Step',
            type: 'action',
            config: { action: 'second-action' },
            order: 2,
            dependsOn: ['step-1']
        }
    ],
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    version: 1,
    ...overrides
});
exports.createMockWorkflow = createMockWorkflow;
const createMockWorkflowStep = (overrides = {}) => ({
    id: 'test-step-123',
    name: 'Test Step',
    type: 'action',
    config: { action: 'test-action' },
    order: 1,
    ...overrides
});
exports.createMockWorkflowStep = createMockWorkflowStep;
const createMockExecutionState = (overrides = {}) => ({
    workflowId: 'test-workflow-123',
    status: 'initialized',
    currentStep: null,
    variables: new Map(),
    startTime: new Date('2024-01-01T00:00:00Z'),
    executedSteps: [],
    errors: [],
    ...overrides
});
exports.createMockExecutionState = createMockExecutionState;
const createMockExecutionResult = (overrides = {}) => ({
    success: true,
    workflowId: 'test-workflow-123',
    executionId: 'exec-123',
    startTime: new Date('2024-01-01T00:00:00Z'),
    endTime: new Date('2024-01-01T00:01:00Z'),
    executedSteps: ['step-1', 'step-2'],
    results: new Map([
        ['step-1', { success: true, result: { data: 'test' } }],
        ['step-2', { success: true, result: { processed: true } }]
    ]),
    ...overrides
});
exports.createMockExecutionResult = createMockExecutionResult;
const createMockStepExecutionResult = (overrides = {}) => ({
    success: true,
    result: { processed: true },
    executionTime: 100,
    ...overrides
});
exports.createMockStepExecutionResult = createMockStepExecutionResult;
// Mock Repository Factory
const createMockRepository = () => ({
    findById: globals_1.jest.fn(),
    save: globals_1.jest.fn(),
    update: globals_1.jest.fn(),
    delete: globals_1.jest.fn(),
    findAll: globals_1.jest.fn(),
    exists: globals_1.jest.fn()
});
exports.createMockRepository = createMockRepository;
// Mock Service Factory with common methods
const createMockService = () => ({
    execute: globals_1.jest.fn(),
    validate: globals_1.jest.fn(),
    initialize: globals_1.jest.fn(),
    cleanup: globals_1.jest.fn(),
    getMetrics: globals_1.jest.fn()
});
exports.createMockService = createMockService;
// Mock Event Emitter Factory
const createMockEventEmitter = () => ({
    emit: globals_1.jest.fn(),
    on: globals_1.jest.fn(),
    off: globals_1.jest.fn(),
    once: globals_1.jest.fn(),
    removeAllListeners: globals_1.jest.fn(),
    listeners: globals_1.jest.fn(),
    listenerCount: globals_1.jest.fn()
});
exports.createMockEventEmitter = createMockEventEmitter;
// Mock Execution Context Factory
const createMockExecutionContext = () => ({
    getWorkflowId: globals_1.jest.fn().mockReturnValue('test-workflow-123'),
    getCurrentStep: globals_1.jest.fn(),
    getVariable: globals_1.jest.fn(),
    setVariable: globals_1.jest.fn(),
    getExecutionState: globals_1.jest.fn().mockReturnValue((0, exports.createMockExecutionState)()),
    updateState: globals_1.jest.fn(),
    addError: globals_1.jest.fn(),
    getErrors: globals_1.jest.fn().mockReturnValue([]),
    clone: globals_1.jest.fn(),
    reset: globals_1.jest.fn()
});
exports.createMockExecutionContext = createMockExecutionContext;
// Test Data Builders
class WorkflowBuilder {
    constructor() {
        this.workflow = (0, exports.createMockWorkflow)();
    }
    withId(id) {
        this.workflow.id = id;
        return this;
    }
    withName(name) {
        this.workflow.name = name;
        return this;
    }
    withStatus(status) {
        this.workflow.status = status;
        return this;
    }
    withSteps(steps) {
        this.workflow.steps = steps;
        return this;
    }
    addStep(step) {
        this.workflow.steps.push(step);
        return this;
    }
    withParallelSteps() {
        this.workflow.steps = [
            {
                id: 'init-step',
                name: 'Initialize',
                type: 'action',
                config: { action: 'init' },
                order: 1,
                parallelizable: false
            },
            {
                id: 'parallel-1',
                name: 'Parallel Task 1',
                type: 'action',
                config: { action: 'parallel-1' },
                order: 2,
                dependsOn: ['init-step'],
                parallelizable: true,
                parallelGroup: 'processing'
            },
            {
                id: 'parallel-2',
                name: 'Parallel Task 2',
                type: 'action',
                config: { action: 'parallel-2' },
                order: 2,
                dependsOn: ['init-step'],
                parallelizable: true,
                parallelGroup: 'processing'
            },
            {
                id: 'finalize-step',
                name: 'Finalize',
                type: 'action',
                config: { action: 'finalize' },
                order: 3,
                dependsOn: ['parallel-1', 'parallel-2'],
                parallelizable: false
            }
        ];
        return this;
    }
    withConditionalSteps() {
        this.workflow.steps = [
            {
                id: 'input-step',
                name: 'Get Input',
                type: 'action',
                config: { action: 'getInput' },
                order: 1
            },
            {
                id: 'condition-step',
                name: 'Check Condition',
                type: 'conditional',
                config: {
                    condition: {
                        expression: 'input.value > 10',
                        operator: 'gt'
                    },
                    branches: [
                        {
                            id: 'true-branch',
                            condition: true,
                            steps: [
                                {
                                    id: 'high-value-step',
                                    name: 'Process High Value',
                                    type: 'action',
                                    config: { action: 'processHighValue' }
                                }
                            ]
                        },
                        {
                            id: 'false-branch',
                            condition: false,
                            steps: [
                                {
                                    id: 'low-value-step',
                                    name: 'Process Low Value',
                                    type: 'action',
                                    config: { action: 'processLowValue' }
                                }
                            ]
                        }
                    ]
                },
                order: 2,
                dependsOn: ['input-step']
            }
        ];
        return this;
    }
    withLoopSteps() {
        this.workflow.steps = [
            {
                id: 'setup-step',
                name: 'Setup Data',
                type: 'action',
                config: { action: 'setupData' },
                order: 1
            },
            {
                id: 'loop-step',
                name: 'Process Items Loop',
                type: 'loop',
                config: {
                    loopType: 'for',
                    iterable: 'items',
                    iteratorVariable: 'item',
                    indexVariable: 'index',
                    steps: [
                        {
                            id: 'process-item',
                            name: 'Process Item',
                            type: 'action',
                            config: { action: 'processItem' }
                        }
                    ]
                },
                order: 2,
                dependsOn: ['setup-step']
            }
        ];
        return this;
    }
    build() {
        return { ...this.workflow };
    }
}
exports.WorkflowBuilder = WorkflowBuilder;
// Assertion Helpers
const expectWorkflowInteraction = (mockFn, expectedCalls = 1) => {
    expect(mockFn).toHaveBeenCalledTimes(expectedCalls);
};
exports.expectWorkflowInteraction = expectWorkflowInteraction;
const expectStepExecutionOrder = (mockExecutor, expectedOrder) => {
    const calls = mockExecutor.mock.calls;
    const actualOrder = calls.map(call => call[0].id);
    expect(actualOrder).toEqual(expectedOrder);
};
exports.expectStepExecutionOrder = expectStepExecutionOrder;
const expectEventEmission = (mockEmitter, eventName, eventData) => {
    expect(mockEmitter.emit).toHaveBeenCalledWith(eventName, eventData ? expect.objectContaining(eventData) : expect.any(Object));
};
exports.expectEventEmission = expectEventEmission;
const expectServiceCollaboration = (mockService1, mockService2, expectedSequence) => {
    const allCalls = globals_1.jest.getAllMockCalls();
    const callSequence = allCalls
        .filter(call => expectedSequence.includes(call[0]))
        .map(call => call[0]);
    expect(callSequence).toEqual(expectedSequence);
};
exports.expectServiceCollaboration = expectServiceCollaboration;
// Test Scenario Helpers
const createNetworkErrorScenario = () => {
    const networkError = new Error('Network timeout');
    networkError.code = 'NETWORK_TIMEOUT';
    return {
        error: networkError,
        shouldRetry: true,
        retryDelay: 1000,
        maxRetries: 3
    };
};
exports.createNetworkErrorScenario = createNetworkErrorScenario;
const createValidationErrorScenario = () => {
    const validationError = new Error('Invalid input data');
    validationError.code = 'VALIDATION_ERROR';
    return {
        error: validationError,
        shouldRetry: false,
        fallbackStrategy: 'use-default-values'
    };
};
exports.createValidationErrorScenario = createValidationErrorScenario;
const createCircuitBreakerScenario = () => ({
    failureThreshold: 5,
    recoveryTimeout: 60000,
    halfOpenMaxCalls: 3,
    states: ['closed', 'open', 'half-open']
});
exports.createCircuitBreakerScenario = createCircuitBreakerScenario;
// Performance Testing Helpers
const measureExecutionTime = async (fn) => {
    const start = Date.now();
    await fn();
    return Date.now() - start;
};
exports.measureExecutionTime = measureExecutionTime;
const createLoadTestScenario = (concurrency, requests) => ({
    concurrency,
    requests,
    expectedMaxResponseTime: 5000,
    expectedThroughput: concurrency * 10 // requests per second
});
exports.createLoadTestScenario = createLoadTestScenario;
// Mock State Management Helpers
const createMockStateManager = () => ({
    initializeState: globals_1.jest.fn(),
    transitionState: globals_1.jest.fn(),
    updateVariables: globals_1.jest.fn(),
    getState: globals_1.jest.fn(),
    setState: globals_1.jest.fn(),
    mergeState: globals_1.jest.fn(),
    resetState: globals_1.jest.fn(),
    cloneState: globals_1.jest.fn()
});
exports.createMockStateManager = createMockStateManager;
const createMockStatePersistence = () => ({
    saveState: globals_1.jest.fn(),
    loadState: globals_1.jest.fn(),
    createSnapshot: globals_1.jest.fn(),
    restoreSnapshot: globals_1.jest.fn(),
    deleteState: globals_1.jest.fn(),
    getStateHistory: globals_1.jest.fn(),
    compactHistory: globals_1.jest.fn()
});
exports.createMockStatePersistence = createMockStatePersistence;
// Integration Test Helpers
const setupIntegrationTestEnvironment = () => {
    const mocks = {
        repository: (0, exports.createMockRepository)(),
        eventEmitter: (0, exports.createMockEventEmitter)(),
        executionContext: (0, exports.createMockExecutionContext)(),
        stateManager: (0, exports.createMockStateManager)(),
        statePersistence: (0, exports.createMockStatePersistence)()
    };
    const cleanup = () => {
        Object.values(mocks).forEach(mock => {
            if (typeof mock === 'object' && mock !== null) {
                Object.values(mock).forEach(fn => {
                    if (globals_1.jest.isMockFunction(fn)) {
                        fn.mockReset();
                    }
                });
            }
        });
    };
    return { mocks, cleanup };
};
exports.setupIntegrationTestEnvironment = setupIntegrationTestEnvironment;
// Test Configuration Constants
exports.TEST_CONSTANTS = {
    DEFAULT_TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3,
    PARALLEL_STEP_COUNT: 4,
    LOOP_ITERATIONS: 5,
    STATE_VERSIONS: 3,
    CIRCUIT_BREAKER_THRESHOLD: 5
};
// Validation Helpers
const validateWorkflowStructure = (workflow) => {
    return (typeof workflow.id === 'string' &&
        typeof workflow.name === 'string' &&
        Array.isArray(workflow.steps) &&
        workflow.steps.length > 0 &&
        workflow.steps.every(step => typeof step.id === 'string' &&
            typeof step.name === 'string' &&
            typeof step.type === 'string'));
};
exports.validateWorkflowStructure = validateWorkflowStructure;
const validateExecutionResult = (result) => {
    return (typeof result.success === 'boolean' &&
        typeof result.workflowId === 'string' &&
        Array.isArray(result.executedSteps) &&
        result.results instanceof Map);
};
exports.validateExecutionResult = validateExecutionResult;
//# sourceMappingURL=test-helpers.js.map