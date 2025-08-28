import { jest } from '@jest/globals';
import { 
  Workflow, 
  WorkflowStep, 
  WorkflowStatus,
  ExecutionState,
  ExecutionResult,
  StepExecutionResult
} from '../../src/types/Workflow';

/**
 * Test Helpers for Workflow Automation Tests
 * Following London School TDD principles with mock-first approach
 */

// Mock Factory Functions
export const createMockWorkflow = (overrides: Partial<Workflow> = {}): Workflow => ({
  id: 'test-workflow-123',
  name: 'Test Workflow',
  description: 'A workflow for testing purposes',
  status: WorkflowStatus.DRAFT,
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

export const createMockWorkflowStep = (overrides: Partial<WorkflowStep> = {}): WorkflowStep => ({
  id: 'test-step-123',
  name: 'Test Step',
  type: 'action',
  config: { action: 'test-action' },
  order: 1,
  ...overrides
});

export const createMockExecutionState = (overrides: Partial<ExecutionState> = {}): ExecutionState => ({
  workflowId: 'test-workflow-123',
  status: 'initialized',
  currentStep: null,
  variables: new Map(),
  startTime: new Date('2024-01-01T00:00:00Z'),
  executedSteps: [],
  errors: [],
  ...overrides
});

export const createMockExecutionResult = (overrides: Partial<ExecutionResult> = {}): ExecutionResult => ({
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

export const createMockStepExecutionResult = (overrides: Partial<StepExecutionResult> = {}): StepExecutionResult => ({
  success: true,
  result: { processed: true },
  executionTime: 100,
  ...overrides
});

// Mock Repository Factory
export const createMockRepository = <T>() => ({
  findById: jest.fn<(id: string) => Promise<T | null>>(),
  save: jest.fn<(entity: T) => Promise<T>>(),
  update: jest.fn<(id: string, updates: Partial<T>) => Promise<T>>(),
  delete: jest.fn<(id: string) => Promise<boolean>>(),
  findAll: jest.fn<() => Promise<T[]>>(),
  exists: jest.fn<(identifier: string) => Promise<boolean>>()
});

// Mock Service Factory with common methods
export const createMockService = () => ({
  execute: jest.fn(),
  validate: jest.fn(),
  initialize: jest.fn(),
  cleanup: jest.fn(),
  getMetrics: jest.fn()
});

// Mock Event Emitter Factory
export const createMockEventEmitter = () => ({
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  once: jest.fn(),
  removeAllListeners: jest.fn(),
  listeners: jest.fn(),
  listenerCount: jest.fn()
});

// Mock Execution Context Factory
export const createMockExecutionContext = () => ({
  getWorkflowId: jest.fn().mockReturnValue('test-workflow-123'),
  getCurrentStep: jest.fn(),
  getVariable: jest.fn(),
  setVariable: jest.fn(),
  getExecutionState: jest.fn().mockReturnValue(createMockExecutionState()),
  updateState: jest.fn(),
  addError: jest.fn(),
  getErrors: jest.fn().mockReturnValue([]),
  clone: jest.fn(),
  reset: jest.fn()
});

// Test Data Builders
export class WorkflowBuilder {
  private workflow: Workflow;

  constructor() {
    this.workflow = createMockWorkflow();
  }

  withId(id: string): WorkflowBuilder {
    this.workflow.id = id;
    return this;
  }

  withName(name: string): WorkflowBuilder {
    this.workflow.name = name;
    return this;
  }

  withStatus(status: WorkflowStatus): WorkflowBuilder {
    this.workflow.status = status;
    return this;
  }

  withSteps(steps: WorkflowStep[]): WorkflowBuilder {
    this.workflow.steps = steps;
    return this;
  }

  addStep(step: WorkflowStep): WorkflowBuilder {
    this.workflow.steps.push(step);
    return this;
  }

  withParallelSteps(): WorkflowBuilder {
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

  withConditionalSteps(): WorkflowBuilder {
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

  withLoopSteps(): WorkflowBuilder {
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

  build(): Workflow {
    return { ...this.workflow };
  }
}

// Assertion Helpers
export const expectWorkflowInteraction = (mockFn: jest.Mock, expectedCalls: number = 1) => {
  expect(mockFn).toHaveBeenCalledTimes(expectedCalls);
};

export const expectStepExecutionOrder = (mockExecutor: jest.Mock, expectedOrder: string[]) => {
  const calls = mockExecutor.mock.calls;
  const actualOrder = calls.map(call => call[0].id);
  expect(actualOrder).toEqual(expectedOrder);
};

export const expectEventEmission = (mockEmitter: jest.Mock, eventName: string, eventData?: any) => {
  expect(mockEmitter.emit).toHaveBeenCalledWith(
    eventName,
    eventData ? expect.objectContaining(eventData) : expect.any(Object)
  );
};

export const expectServiceCollaboration = (
  mockService1: jest.Mock,
  mockService2: jest.Mock,
  expectedSequence: string[]
) => {
  const allCalls = jest.getAllMockCalls();
  const callSequence = allCalls
    .filter(call => expectedSequence.includes(call[0]))
    .map(call => call[0]);
  
  expect(callSequence).toEqual(expectedSequence);
};

// Test Scenario Helpers
export const createNetworkErrorScenario = () => {
  const networkError = new Error('Network timeout');
  networkError.code = 'NETWORK_TIMEOUT';
  return {
    error: networkError,
    shouldRetry: true,
    retryDelay: 1000,
    maxRetries: 3
  };
};

export const createValidationErrorScenario = () => {
  const validationError = new Error('Invalid input data');
  validationError.code = 'VALIDATION_ERROR';
  return {
    error: validationError,
    shouldRetry: false,
    fallbackStrategy: 'use-default-values'
  };
};

export const createCircuitBreakerScenario = () => ({
  failureThreshold: 5,
  recoveryTimeout: 60000,
  halfOpenMaxCalls: 3,
  states: ['closed', 'open', 'half-open'] as const
});

// Performance Testing Helpers
export const measureExecutionTime = async (fn: () => Promise<any>): Promise<number> => {
  const start = Date.now();
  await fn();
  return Date.now() - start;
};

export const createLoadTestScenario = (concurrency: number, requests: number) => ({
  concurrency,
  requests,
  expectedMaxResponseTime: 5000,
  expectedThroughput: concurrency * 10 // requests per second
});

// Mock State Management Helpers
export const createMockStateManager = () => ({
  initializeState: jest.fn(),
  transitionState: jest.fn(),
  updateVariables: jest.fn(),
  getState: jest.fn(),
  setState: jest.fn(),
  mergeState: jest.fn(),
  resetState: jest.fn(),
  cloneState: jest.fn()
});

export const createMockStatePersistence = () => ({
  saveState: jest.fn(),
  loadState: jest.fn(),
  createSnapshot: jest.fn(),
  restoreSnapshot: jest.fn(),
  deleteState: jest.fn(),
  getStateHistory: jest.fn(),
  compactHistory: jest.fn()
});

// Integration Test Helpers
export const setupIntegrationTestEnvironment = () => {
  const mocks = {
    repository: createMockRepository(),
    eventEmitter: createMockEventEmitter(),
    executionContext: createMockExecutionContext(),
    stateManager: createMockStateManager(),
    statePersistence: createMockStatePersistence()
  };

  const cleanup = () => {
    Object.values(mocks).forEach(mock => {
      if (typeof mock === 'object' && mock !== null) {
        Object.values(mock).forEach(fn => {
          if (jest.isMockFunction(fn)) {
            fn.mockReset();
          }
        });
      }
    });
  };

  return { mocks, cleanup };
};

// Test Configuration Constants
export const TEST_CONSTANTS = {
  DEFAULT_TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  PARALLEL_STEP_COUNT: 4,
  LOOP_ITERATIONS: 5,
  STATE_VERSIONS: 3,
  CIRCUIT_BREAKER_THRESHOLD: 5
};

// Validation Helpers
export const validateWorkflowStructure = (workflow: Workflow): boolean => {
  return (
    typeof workflow.id === 'string' &&
    typeof workflow.name === 'string' &&
    Array.isArray(workflow.steps) &&
    workflow.steps.length > 0 &&
    workflow.steps.every(step => 
      typeof step.id === 'string' &&
      typeof step.name === 'string' &&
      typeof step.type === 'string'
    )
  );
};

export const validateExecutionResult = (result: ExecutionResult): boolean => {
  return (
    typeof result.success === 'boolean' &&
    typeof result.workflowId === 'string' &&
    Array.isArray(result.executedSteps) &&
    result.results instanceof Map
  );
};