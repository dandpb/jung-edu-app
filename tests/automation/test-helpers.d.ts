import { jest } from '@jest/globals';
import { Workflow, WorkflowStep, WorkflowStatus, ExecutionState, ExecutionResult, StepExecutionResult } from '../../src/types/Workflow';
/**
 * Test Helpers for Workflow Automation Tests
 * Following London School TDD principles with mock-first approach
 */
export declare const createMockWorkflow: (overrides?: Partial<Workflow>) => Workflow;
export declare const createMockWorkflowStep: (overrides?: Partial<WorkflowStep>) => WorkflowStep;
export declare const createMockExecutionState: (overrides?: Partial<ExecutionState>) => ExecutionState;
export declare const createMockExecutionResult: (overrides?: Partial<ExecutionResult>) => ExecutionResult;
export declare const createMockStepExecutionResult: (overrides?: Partial<StepExecutionResult>) => StepExecutionResult;
export declare const createMockRepository: <T>() => {
    findById: import("jest-mock").Mock<(id: string) => Promise<T | null>>;
    save: import("jest-mock").Mock<(entity: T) => Promise<T>>;
    update: import("jest-mock").Mock<(id: string, updates: Partial<T>) => Promise<T>>;
    delete: import("jest-mock").Mock<(id: string) => Promise<boolean>>;
    findAll: import("jest-mock").Mock<() => Promise<T[]>>;
    exists: import("jest-mock").Mock<(identifier: string) => Promise<boolean>>;
};
export declare const createMockService: () => {
    execute: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    validate: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    initialize: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    cleanup: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    getMetrics: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
};
export declare const createMockEventEmitter: () => {
    emit: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    on: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    off: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    once: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    removeAllListeners: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    listeners: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    listenerCount: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
};
export declare const createMockExecutionContext: () => {
    getWorkflowId: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    getCurrentStep: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    getVariable: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    setVariable: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    getExecutionState: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    updateState: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    addError: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    getErrors: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    clone: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    reset: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
};
export declare class WorkflowBuilder {
    private workflow;
    constructor();
    withId(id: string): WorkflowBuilder;
    withName(name: string): WorkflowBuilder;
    withStatus(status: WorkflowStatus): WorkflowBuilder;
    withSteps(steps: WorkflowStep[]): WorkflowBuilder;
    addStep(step: WorkflowStep): WorkflowBuilder;
    withParallelSteps(): WorkflowBuilder;
    withConditionalSteps(): WorkflowBuilder;
    withLoopSteps(): WorkflowBuilder;
    build(): Workflow;
}
export declare const expectWorkflowInteraction: (mockFn: jest.Mock, expectedCalls?: number) => void;
export declare const expectStepExecutionOrder: (mockExecutor: jest.Mock, expectedOrder: string[]) => void;
export declare const expectEventEmission: (mockEmitter: jest.Mock, eventName: string, eventData?: any) => void;
export declare const expectServiceCollaboration: (mockService1: jest.Mock, mockService2: jest.Mock, expectedSequence: string[]) => void;
export declare const createNetworkErrorScenario: () => {
    error: Error;
    shouldRetry: boolean;
    retryDelay: number;
    maxRetries: number;
};
export declare const createValidationErrorScenario: () => {
    error: Error;
    shouldRetry: boolean;
    fallbackStrategy: string;
};
export declare const createCircuitBreakerScenario: () => {
    failureThreshold: number;
    recoveryTimeout: number;
    halfOpenMaxCalls: number;
    states: readonly ["closed", "open", "half-open"];
};
export declare const measureExecutionTime: (fn: () => Promise<any>) => Promise<number>;
export declare const createLoadTestScenario: (concurrency: number, requests: number) => {
    concurrency: number;
    requests: number;
    expectedMaxResponseTime: number;
    expectedThroughput: number;
};
export declare const createMockStateManager: () => {
    initializeState: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    transitionState: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    updateVariables: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    getState: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    setState: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    mergeState: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    resetState: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    cloneState: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
};
export declare const createMockStatePersistence: () => {
    saveState: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    loadState: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    createSnapshot: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    restoreSnapshot: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    deleteState: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    getStateHistory: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    compactHistory: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
};
export declare const setupIntegrationTestEnvironment: () => {
    mocks: {
        repository: {
            findById: import("jest-mock").Mock<(id: string) => Promise<unknown>>;
            save: import("jest-mock").Mock<(entity: unknown) => Promise<unknown>>;
            update: import("jest-mock").Mock<(id: string, updates: Partial<unknown>) => Promise<unknown>>;
            delete: import("jest-mock").Mock<(id: string) => Promise<boolean>>;
            findAll: import("jest-mock").Mock<() => Promise<unknown[]>>;
            exists: import("jest-mock").Mock<(identifier: string) => Promise<boolean>>;
        };
        eventEmitter: {
            emit: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
            on: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
            off: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
            once: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
            removeAllListeners: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
            listeners: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
            listenerCount: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
        };
        executionContext: {
            getWorkflowId: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
            getCurrentStep: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
            getVariable: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
            setVariable: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
            getExecutionState: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
            updateState: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
            addError: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
            getErrors: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
            clone: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
            reset: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
        };
        stateManager: {
            initializeState: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
            transitionState: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
            updateVariables: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
            getState: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
            setState: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
            mergeState: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
            resetState: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
            cloneState: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
        };
        statePersistence: {
            saveState: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
            loadState: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
            createSnapshot: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
            restoreSnapshot: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
            deleteState: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
            getStateHistory: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
            compactHistory: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
        };
    };
    cleanup: () => void;
};
export declare const TEST_CONSTANTS: {
    DEFAULT_TIMEOUT: number;
    RETRY_ATTEMPTS: number;
    PARALLEL_STEP_COUNT: number;
    LOOP_ITERATIONS: number;
    STATE_VERSIONS: number;
    CIRCUIT_BREAKER_THRESHOLD: number;
};
export declare const validateWorkflowStructure: (workflow: Workflow) => boolean;
export declare const validateExecutionResult: (result: ExecutionResult) => boolean;
//# sourceMappingURL=test-helpers.d.ts.map