import {
  StateValidator,
  ValidationRule,
  TransitionRule,
  createDefaultStateValidator
} from '../../../src/services/workflow/StateValidator';
import {
  WorkflowState,
  WorkflowStatus,
  StateTransition
} from '../../../src/services/workflow/WorkflowStateManager';
import { Logger } from '../../../src/utils/Logger';

jest.mock('../../../src/utils/Logger');

describe('StateValidator', () => {
  let mockLogger: jest.Mocked<Logger>;

  const createMockState = (overrides: Partial<WorkflowState> = {}): WorkflowState => ({
    id: 'test-state-1',
    workflowId: 'test-workflow-1',
    status: WorkflowStatus.PENDING,
    currentStep: 'start',
    data: { testData: 'value' },
    metadata: {
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
      version: 1,
      createdBy: 'test-user',
      updatedBy: 'test-user'
    },
    history: [],
    ...overrides
  });

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createDefaultStateValidator', () => {
    it('should create validator with default rules', () => {
      const validator = createDefaultStateValidator();
      expect(validator).toBeInstanceOf(StateValidator);
    });

    it('should accept custom configuration', () => {
      const validator = createDefaultStateValidator({
        strictMode: true,
        logger: mockLogger
      });
      expect(validator).toBeInstanceOf(StateValidator);
    });
  });

  describe('state validation', () => {
    let validator: StateValidator;

    beforeEach(() => {
      validator = createDefaultStateValidator({ logger: mockLogger });
    });

    it('should validate a correct state', async () => {
      const state = createMockState();
      const result = await validator.validateState(state);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for missing required fields', async () => {
      const state = createMockState({ id: '' });
      const result = await validator.validateState(state);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(error => error.code === 'MISSING_STATE_ID')).toBe(true);
    });

    it('should fail validation for missing workflow ID', async () => {
      const state = createMockState({ workflowId: '' });
      const result = await validator.validateState(state);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.code === 'MISSING_WORKFLOW_ID')).toBe(true);
    });

    it('should fail validation for invalid status', async () => {
      const state = createMockState({ status: 'invalid-status' as WorkflowStatus });
      const result = await validator.validateState(state);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.code === 'INVALID_STATUS')).toBe(true);
    });

    it('should fail validation for missing metadata', async () => {
      const state = createMockState();
      delete (state as any).metadata;
      const result = await validator.validateState(state);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.code === 'MISSING_METADATA')).toBe(true);
    });

    it('should fail validation for invalid version', async () => {
      const state = createMockState({
        metadata: {
          ...createMockState().metadata,
          version: 0
        }
      });
      const result = await validator.validateState(state);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.code === 'INVALID_VERSION')).toBe(true);
    });

    it('should warn about large data size', async () => {
      const largeData = { data: 'x'.repeat(900000) }; // Close to 1MB
      const state = createMockState({ data: largeData });
      const result = await validator.validateState(state);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(warning => warning.code === 'DATA_SIZE_WARNING')).toBe(true);
    });

    it('should fail validation for oversized data', async () => {
      const oversizedData = { data: 'x'.repeat(1100000) }; // Over 1MB
      const state = createMockState({ data: oversizedData });
      const result = await validator.validateState(state);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.code === 'DATA_TOO_LARGE')).toBe(true);
    });
  });

  describe('transition validation', () => {
    let validator: StateValidator;

    beforeEach(() => {
      validator = createDefaultStateValidator({ logger: mockLogger });
    });

    it('should validate allowed transitions', async () => {
      const currentState = createMockState({ status: WorkflowStatus.PENDING });
      const transition: StateTransition = {
        from: WorkflowStatus.PENDING,
        to: WorkflowStatus.RUNNING
      };

      const result = await validator.validateTransition(currentState, transition);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject forbidden transitions', async () => {
      const currentState = createMockState({ status: WorkflowStatus.PENDING });
      const transition: StateTransition = {
        from: WorkflowStatus.PENDING,
        to: WorkflowStatus.COMPLETED // Direct transition not allowed
      };

      const result = await validator.validateTransition(currentState, transition);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.code === 'FORBIDDEN_TRANSITION')).toBe(true);
    });

    it('should reject mismatched current status', async () => {
      const currentState = createMockState({ status: WorkflowStatus.RUNNING });
      const transition: StateTransition = {
        from: WorkflowStatus.PENDING,
        to: WorkflowStatus.RUNNING
      };

      const result = await validator.validateTransition(currentState, transition);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.code === 'INVALID_CURRENT_STATUS')).toBe(true);
    });

    it('should validate complex transition paths', async () => {
      // Test RUNNING -> PAUSED -> RUNNING -> COMPLETED
      let state = createMockState({ status: WorkflowStatus.RUNNING });
      
      // RUNNING -> PAUSED
      let transition: StateTransition = {
        from: WorkflowStatus.RUNNING,
        to: WorkflowStatus.PAUSED
      };
      let result = await validator.validateTransition(state, transition);
      expect(result.isValid).toBe(true);

      // PAUSED -> RUNNING
      state = createMockState({ status: WorkflowStatus.PAUSED });
      transition = {
        from: WorkflowStatus.PAUSED,
        to: WorkflowStatus.RUNNING
      };
      result = await validator.validateTransition(state, transition);
      expect(result.isValid).toBe(true);

      // RUNNING -> COMPLETED
      state = createMockState({ status: WorkflowStatus.RUNNING });
      transition = {
        from: WorkflowStatus.RUNNING,
        to: WorkflowStatus.COMPLETED
      };
      result = await validator.validateTransition(state, transition);
      expect(result.isValid).toBe(true);
    });

    it('should validate rollback transitions', async () => {
      // FAILED -> ROLLBACK
      let state = createMockState({ status: WorkflowStatus.FAILED });
      let transition: StateTransition = {
        from: WorkflowStatus.FAILED,
        to: WorkflowStatus.ROLLBACK
      };
      let result = await validator.validateTransition(state, transition);
      expect(result.isValid).toBe(true);

      // ROLLBACK -> PENDING
      state = createMockState({ status: WorkflowStatus.ROLLBACK });
      transition = {
        from: WorkflowStatus.ROLLBACK,
        to: WorkflowStatus.PENDING
      };
      result = await validator.validateTransition(state, transition);
      expect(result.isValid).toBe(true);
    });

    it('should validate cancellation from various states', async () => {
      const cancellableStates = [
        WorkflowStatus.PENDING,
        WorkflowStatus.RUNNING,
        WorkflowStatus.PAUSED,
        WorkflowStatus.WAITING
      ];

      for (const status of cancellableStates) {
        const state = createMockState({ status });
        const transition: StateTransition = {
          from: status,
          to: WorkflowStatus.CANCELLED
        };
        const result = await validator.validateTransition(state, transition);
        expect(result.isValid).toBe(true);
      }
    });
  });

  describe('custom validation rules', () => {
    it('should support custom validation rules', async () => {
      const customRule: ValidationRule = {
        name: 'custom-rule',
        description: 'Custom validation rule',
        priority: 5,
        enabled: true,
        validate: async (state) => ({
          isValid: false,
          errors: [{
            code: 'CUSTOM_ERROR',
            message: 'Custom validation failed',
            severity: 'error'
          }],
          warnings: []
        })
      };

      const validator = new StateValidator({
        transitionRules: [],
        validationRules: [customRule],
        strictMode: false,
        logger: mockLogger
      });

      const state = createMockState();
      const result = await validator.validateState(state);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.code === 'CUSTOM_ERROR')).toBe(true);
    });

    it('should handle validation rule exceptions', async () => {
      const faultyRule: ValidationRule = {
        name: 'faulty-rule',
        description: 'Rule that throws an error',
        priority: 5,
        enabled: true,
        validate: async () => {
          throw new Error('Rule error');
        }
      };

      const validator = new StateValidator({
        transitionRules: [],
        validationRules: [faultyRule],
        strictMode: false,
        logger: mockLogger
      });

      const state = createMockState();
      const result = await validator.validateState(state);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.code === 'VALIDATION_RULE_ERROR')).toBe(true);
    });
  });

  describe('custom transition rules', () => {
    it('should support custom transition rules with conditions', async () => {
      const customTransitionRule: TransitionRule = {
        from: [WorkflowStatus.PENDING],
        to: WorkflowStatus.RUNNING,
        conditions: [{
          field: 'approved',
          operator: 'equals',
          value: true
        }]
      };

      const validator = new StateValidator({
        transitionRules: [customTransitionRule],
        validationRules: [],
        strictMode: false,
        logger: mockLogger
      });

      // Test with condition not met
      let state = createMockState({ 
        status: WorkflowStatus.PENDING,
        data: { approved: false }
      });
      let transition: StateTransition = {
        from: WorkflowStatus.PENDING,
        to: WorkflowStatus.RUNNING,
        data: { approved: false }
      };
      let result = await validator.validateTransition(state, transition);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.code === 'CONDITION_NOT_MET')).toBe(true);

      // Test with condition met
      state = createMockState({ 
        status: WorkflowStatus.PENDING,
        data: { approved: true }
      });
      transition = {
        from: WorkflowStatus.PENDING,
        to: WorkflowStatus.RUNNING,
        data: { approved: true }
      };
      result = await validator.validateTransition(state, transition);
      expect(result.isValid).toBe(true);
    });

    it('should support required fields validation', async () => {
      const customTransitionRule: TransitionRule = {
        from: [WorkflowStatus.PENDING],
        to: WorkflowStatus.RUNNING,
        requiredFields: ['assignee', 'priority']
      };

      const validator = new StateValidator({
        transitionRules: [customTransitionRule],
        validationRules: [],
        strictMode: false,
        logger: mockLogger
      });

      const state = createMockState({ status: WorkflowStatus.PENDING });
      const transition: StateTransition = {
        from: WorkflowStatus.PENDING,
        to: WorkflowStatus.RUNNING,
        data: { assignee: 'john' } // missing priority
      };

      const result = await validator.validateTransition(state, transition);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.code === 'REQUIRED_FIELD_MISSING')).toBe(true);
    });

    it('should support forbidden fields validation', async () => {
      const customTransitionRule: TransitionRule = {
        from: [WorkflowStatus.RUNNING],
        to: WorkflowStatus.COMPLETED,
        forbiddenFields: ['temp_data']
      };

      const validator = new StateValidator({
        transitionRules: [customTransitionRule],
        validationRules: [],
        strictMode: false,
        logger: mockLogger
      });

      const state = createMockState({ status: WorkflowStatus.RUNNING });
      const transition: StateTransition = {
        from: WorkflowStatus.RUNNING,
        to: WorkflowStatus.COMPLETED,
        data: { temp_data: 'should not be present' }
      };

      const result = await validator.validateTransition(state, transition);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.code === 'FORBIDDEN_FIELD_PRESENT')).toBe(true);
    });

    it('should support custom validators', async () => {
      const customTransitionRule: TransitionRule = {
        from: [WorkflowStatus.PENDING],
        to: WorkflowStatus.RUNNING,
        customValidator: async (state, transition) => {
          return state.data.score > 5;
        }
      };

      const validator = new StateValidator({
        transitionRules: [customTransitionRule],
        validationRules: [],
        strictMode: false,
        logger: mockLogger
      });

      // Test with failing custom validator
      let state = createMockState({ 
        status: WorkflowStatus.PENDING,
        data: { score: 3 }
      });
      let transition: StateTransition = {
        from: WorkflowStatus.PENDING,
        to: WorkflowStatus.RUNNING
      };
      let result = await validator.validateTransition(state, transition);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.code === 'CUSTOM_VALIDATION_FAILED')).toBe(true);

      // Test with passing custom validator
      state = createMockState({ 
        status: WorkflowStatus.PENDING,
        data: { score: 8 }
      });
      result = await validator.validateTransition(state, transition);
      expect(result.isValid).toBe(true);
    });

    it('should handle custom validator errors', async () => {
      const customTransitionRule: TransitionRule = {
        from: [WorkflowStatus.PENDING],
        to: WorkflowStatus.RUNNING,
        customValidator: async () => {
          throw new Error('Validator error');
        }
      };

      const validator = new StateValidator({
        transitionRules: [customTransitionRule],
        validationRules: [],
        strictMode: false,
        logger: mockLogger
      });

      const state = createMockState({ status: WorkflowStatus.PENDING });
      const transition: StateTransition = {
        from: WorkflowStatus.PENDING,
        to: WorkflowStatus.RUNNING
      };

      const result = await validator.validateTransition(state, transition);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.code === 'CUSTOM_VALIDATOR_ERROR')).toBe(true);
    });
  });

  describe('condition evaluation', () => {
    let validator: StateValidator;

    beforeEach(() => {
      validator = new StateValidator({
        transitionRules: [{
          from: [WorkflowStatus.PENDING],
          to: WorkflowStatus.RUNNING,
          conditions: [
            { field: 'status', operator: 'equals', value: 'active' },
            { field: 'priority', operator: 'in', value: ['high', 'critical'] },
            { field: 'temp', operator: 'not_exists', value: null },
            { field: 'score', operator: 'greater_than', value: 5 }
          ]
        }],
        validationRules: [],
        strictMode: false,
        logger: mockLogger
      });
    });

    it('should evaluate equals condition', async () => {
      const state = createMockState({ status: WorkflowStatus.PENDING });
      const transition: StateTransition = {
        from: WorkflowStatus.PENDING,
        to: WorkflowStatus.RUNNING,
        data: { 
          status: 'active',
          priority: 'high',
          score: 8
        }
      };

      const result = await validator.validateTransition(state, transition);
      expect(result.isValid).toBe(true);
    });

    it('should evaluate in condition', async () => {
      const state = createMockState({ status: WorkflowStatus.PENDING });
      const transition: StateTransition = {
        from: WorkflowStatus.PENDING,
        to: WorkflowStatus.RUNNING,
        data: { 
          status: 'active',
          priority: 'medium', // Not in ['high', 'critical']
          score: 8
        }
      };

      const result = await validator.validateTransition(state, transition);
      expect(result.isValid).toBe(false);
    });

    it('should evaluate exists/not_exists conditions', async () => {
      const state = createMockState({ status: WorkflowStatus.PENDING });
      const transition: StateTransition = {
        from: WorkflowStatus.PENDING,
        to: WorkflowStatus.RUNNING,
        data: { 
          status: 'active',
          priority: 'high',
          score: 8,
          temp: 'should not exist' // Violates not_exists condition
        }
      };

      const result = await validator.validateTransition(state, transition);
      expect(result.isValid).toBe(false);
    });

    it('should evaluate numeric comparison conditions', async () => {
      const state = createMockState({ status: WorkflowStatus.PENDING });
      const transition: StateTransition = {
        from: WorkflowStatus.PENDING,
        to: WorkflowStatus.RUNNING,
        data: { 
          status: 'active',
          priority: 'high',
          score: 3 // Not greater than 5
        }
      };

      const result = await validator.validateTransition(state, transition);
      expect(result.isValid).toBe(false);
    });
  });

  describe('utility methods', () => {
    let validator: StateValidator;

    beforeEach(() => {
      validator = createDefaultStateValidator({ logger: mockLogger });
    });

    it('should get allowed transitions correctly', () => {
      const allowedFromPending = validator.getAllowedTransitions(WorkflowStatus.PENDING);
      expect(allowedFromPending).toContain(WorkflowStatus.RUNNING);
      expect(allowedFromPending).toContain(WorkflowStatus.CANCELLED);

      const allowedFromRunning = validator.getAllowedTransitions(WorkflowStatus.RUNNING);
      expect(allowedFromRunning).toContain(WorkflowStatus.PAUSED);
      expect(allowedFromRunning).toContain(WorkflowStatus.COMPLETED);
      expect(allowedFromRunning).toContain(WorkflowStatus.FAILED);
      expect(allowedFromRunning).toContain(WorkflowStatus.CANCELLED);
      expect(allowedFromRunning).toContain(WorkflowStatus.WAITING);
    });

    it('should check if specific transitions are allowed', () => {
      expect(validator.isTransitionAllowed(WorkflowStatus.PENDING, WorkflowStatus.RUNNING)).toBe(true);
      expect(validator.isTransitionAllowed(WorkflowStatus.PENDING, WorkflowStatus.COMPLETED)).toBe(false);
      expect(validator.isTransitionAllowed(WorkflowStatus.RUNNING, WorkflowStatus.PAUSED)).toBe(true);
      expect(validator.isTransitionAllowed(WorkflowStatus.COMPLETED, WorkflowStatus.RUNNING)).toBe(false);
    });
  });

  describe('strict mode', () => {
    it('should fail validation on warnings in strict mode', async () => {
      const warningRule: ValidationRule = {
        name: 'warning-rule',
        description: 'Rule that produces warnings',
        priority: 5,
        enabled: true,
        validate: async () => ({
          isValid: true,
          errors: [],
          warnings: [{
            code: 'TEST_WARNING',
            message: 'Test warning'
          }]
        })
      };

      const validator = new StateValidator({
        transitionRules: [],
        validationRules: [warningRule],
        strictMode: true,
        logger: mockLogger
      });

      const state = createMockState();
      const result = await validator.validateState(state);

      expect(result.isValid).toBe(false);
      expect(result.warnings).toHaveLength(1);
    });
  });

  describe('dynamic rule management', () => {
    let validator: StateValidator;

    beforeEach(() => {
      validator = createDefaultStateValidator({ logger: mockLogger });
    });

    it('should add validation rules dynamically', () => {
      const newRule: ValidationRule = {
        name: 'dynamic-rule',
        description: 'Dynamically added rule',
        priority: 1,
        enabled: true,
        validate: async () => ({ isValid: true, errors: [], warnings: [] })
      };

      validator.addValidationRule(newRule);
      expect(mockLogger.info).toHaveBeenCalledWith('Added validation rule: dynamic-rule');
    });

    it('should remove validation rules dynamically', () => {
      const removed = validator.removeValidationRule('basic-structure');
      expect(removed).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith('Removed validation rule: basic-structure');

      const notRemoved = validator.removeValidationRule('non-existent');
      expect(notRemoved).toBe(false);
    });
  });
});