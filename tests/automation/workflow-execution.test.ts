import { jest } from '@jest/globals';
import { WorkflowExecutionEngine } from '../../src/engines/WorkflowExecutionEngine';
import { WorkflowRepository } from '../../src/repositories/WorkflowRepository';
import { StepExecutor } from '../../src/executors/StepExecutor';
import { ExecutionContext } from '../../src/contexts/ExecutionContext';
import { ExecutionLogger } from '../../src/logging/ExecutionLogger';
import { EventEmitter } from '../../src/events/EventEmitter';
import { 
  Workflow, 
  WorkflowStatus, 
  ExecutionResult, 
  StepExecutionResult,
  WorkflowStep,
  ExecutionState
} from '../../src/types/Workflow';

// London School TDD - Focus on behavior and interactions
describe('Workflow Execution Engine', () => {
  let executionEngine: WorkflowExecutionEngine;
  let mockWorkflowRepository: jest.Mocked<WorkflowRepository>;
  let mockStepExecutor: jest.Mocked<StepExecutor>;
  let mockExecutionContext: jest.Mocked<ExecutionContext>;
  let mockExecutionLogger: jest.Mocked<ExecutionLogger>;
  let mockEventEmitter: jest.Mocked<EventEmitter>;

  const sampleWorkflow: Workflow = {
    id: 'workflow-exec-123',
    name: 'Test Execution Workflow',
    description: 'Workflow for execution testing',
    status: WorkflowStatus.ACTIVE,
    steps: [
      {
        id: 'step-1',
        name: 'Initialize Data',
        type: 'action',
        config: { action: 'initialize', data: { value: 'test' } },
        order: 1
      },
      {
        id: 'step-2',
        name: 'Process Data',
        type: 'transformation',
        config: { transform: 'uppercase' },
        order: 2,
        dependsOn: ['step-1']
      },
      {
        id: 'step-3',
        name: 'Save Result',
        type: 'action',
        config: { action: 'save' },
        order: 3,
        dependsOn: ['step-2']
      }
    ],
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    version: 1
  };

  const mockExecutionState: ExecutionState = {
    workflowId: 'workflow-exec-123',
    status: 'running',
    currentStep: 'step-1',
    variables: new Map(),
    startTime: new Date(),
    executedSteps: [],
    errors: []
  };

  beforeEach(() => {
    // Create comprehensive mocks
    mockWorkflowRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      findAll: jest.fn(),
      findByName: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      findByStatus: jest.fn(),
      getWorkflowHistory: jest.fn()
    } as jest.Mocked<WorkflowRepository>;

    mockStepExecutor = {
      execute: jest.fn(),
      canExecute: jest.fn(),
      getStepType: jest.fn(),
      validateStep: jest.fn(),
      cleanup: jest.fn(),
      getExecutionMetrics: jest.fn()
    } as jest.Mocked<StepExecutor>;

    mockExecutionContext = {
      getWorkflowId: jest.fn(),
      getCurrentStep: jest.fn(),
      getVariable: jest.fn(),
      setVariable: jest.fn(),
      getExecutionState: jest.fn(),
      updateState: jest.fn(),
      addError: jest.fn(),
      getErrors: jest.fn(),
      clone: jest.fn(),
      reset: jest.fn()
    } as jest.Mocked<ExecutionContext>;

    mockExecutionLogger = {
      logStepStart: jest.fn(),
      logStepComplete: jest.fn(),
      logStepError: jest.fn(),
      logWorkflowStart: jest.fn(),
      logWorkflowComplete: jest.fn(),
      logWorkflowError: jest.fn(),
      getExecutionHistory: jest.fn()
    } as jest.Mocked<ExecutionLogger>;

    mockEventEmitter = {
      emit: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      once: jest.fn()
    } as jest.Mocked<EventEmitter>;

    executionEngine = new WorkflowExecutionEngine(
      mockWorkflowRepository,
      mockStepExecutor,
      mockExecutionContext,
      mockExecutionLogger,
      mockEventEmitter
    );
  });

  describe('Workflow Execution Lifecycle', () => {
    it('should execute workflow with proper initialization sequence', async () => {
      // Arrange
      mockWorkflowRepository.findById.mockResolvedValue(sampleWorkflow);
      mockExecutionContext.getExecutionState.mockReturnValue(mockExecutionState);
      mockStepExecutor.canExecute.mockResolvedValue(true);
      mockStepExecutor.execute.mockResolvedValue({
        success: true,
        result: { data: 'processed' },
        executionTime: 100
      } as StepExecutionResult);

      // Act
      const result = await executionEngine.executeWorkflow('workflow-exec-123');

      // Assert - Verify initialization sequence
      expect(mockWorkflowRepository.findById).toHaveBeenCalledWith('workflow-exec-123');
      expect(mockExecutionLogger.logWorkflowStart).toHaveBeenCalledWith(
        'workflow-exec-123',
        expect.any(Date)
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'workflow.execution.started',
        expect.objectContaining({ workflowId: 'workflow-exec-123' })
      );

      expect(result.success).toBe(true);
      expect(result.workflowId).toBe('workflow-exec-123');
    });

    it('should execute steps in correct dependency order', async () => {
      // Arrange
      mockWorkflowRepository.findById.mockResolvedValue(sampleWorkflow);
      mockExecutionContext.getExecutionState.mockReturnValue(mockExecutionState);
      mockStepExecutor.canExecute.mockResolvedValue(true);
      
      const stepResults = new Map([
        ['step-1', { success: true, result: { initialized: true }, executionTime: 50 }],
        ['step-2', { success: true, result: { transformed: 'TEST' }, executionTime: 75 }],
        ['step-3', { success: true, result: { saved: true }, executionTime: 25 }]
      ]);

      mockStepExecutor.execute.mockImplementation((step) => {
        return Promise.resolve(stepResults.get(step.id) as StepExecutionResult);
      });

      // Act
      const result = await executionEngine.executeWorkflow('workflow-exec-123');

      // Assert - Verify step execution order and interactions
      const executeCalls = mockStepExecutor.execute.mock.calls;
      expect(executeCalls).toHaveLength(3);
      expect(executeCalls[0][0].id).toBe('step-1'); // First step has no dependencies
      expect(executeCalls[1][0].id).toBe('step-2'); // Depends on step-1
      expect(executeCalls[2][0].id).toBe('step-3'); // Depends on step-2

      // Verify logging interactions for each step
      expect(mockExecutionLogger.logStepStart).toHaveBeenCalledTimes(3);
      expect(mockExecutionLogger.logStepComplete).toHaveBeenCalledTimes(3);
      
      expect(result.success).toBe(true);
      expect(result.executedSteps).toHaveLength(3);
    });

    it('should handle step execution failures gracefully', async () => {
      // Arrange
      mockWorkflowRepository.findById.mockResolvedValue(sampleWorkflow);
      mockExecutionContext.getExecutionState.mockReturnValue(mockExecutionState);
      mockStepExecutor.canExecute.mockResolvedValue(true);
      
      // First step succeeds, second fails
      mockStepExecutor.execute
        .mockResolvedValueOnce({
          success: true,
          result: { initialized: true },
          executionTime: 50
        })
        .mockResolvedValueOnce({
          success: false,
          error: new Error('Processing failed'),
          executionTime: 30
        });

      // Act
      const result = await executionEngine.executeWorkflow('workflow-exec-123');

      // Assert - Verify failure handling interactions
      expect(mockStepExecutor.execute).toHaveBeenCalledTimes(2); // Stops after failure
      expect(mockExecutionLogger.logStepError).toHaveBeenCalledWith(
        'step-2',
        expect.any(Error),
        expect.any(Date)
      );
      expect(mockExecutionContext.addError).toHaveBeenCalledWith(
        expect.objectContaining({ stepId: 'step-2' })
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'workflow.execution.failed',
        expect.objectContaining({ 
          workflowId: 'workflow-exec-123',
          failedStep: 'step-2'
        })
      );

      expect(result.success).toBe(false);
      expect(result.failedStep).toBe('step-2');
    });
  });

  describe('Step Execution Orchestration', () => {
    it('should coordinate step execution with context management', async () => {
      // Arrange
      const simpleWorkflow = {
        ...sampleWorkflow,
        steps: [sampleWorkflow.steps[0]] // Single step for focused testing
      };

      mockWorkflowRepository.findById.mockResolvedValue(simpleWorkflow);
      mockExecutionContext.getExecutionState.mockReturnValue(mockExecutionState);
      mockStepExecutor.canExecute.mockResolvedValue(true);
      mockStepExecutor.execute.mockResolvedValue({
        success: true,
        result: { processed: true },
        executionTime: 100,
        variables: { outputVar: 'value' }
      });

      // Act
      await executionEngine.executeWorkflow('workflow-exec-123');

      // Assert - Verify step execution coordination
      expect(mockExecutionLogger.logStepStart).toHaveBeenCalledWith(
        'step-1',
        expect.any(Date)
      );
      expect(mockStepExecutor.canExecute).toHaveBeenCalledWith(
        sampleWorkflow.steps[0],
        mockExecutionContext
      );
      expect(mockStepExecutor.execute).toHaveBeenCalledWith(
        sampleWorkflow.steps[0],
        mockExecutionContext
      );
      expect(mockExecutionContext.setVariable).toHaveBeenCalledWith(
        'outputVar',
        'value'
      );
      expect(mockExecutionLogger.logStepComplete).toHaveBeenCalledWith(
        'step-1',
        expect.objectContaining({ success: true }),
        expect.any(Date)
      );
    });

    it('should validate step prerequisites before execution', async () => {
      // Arrange
      mockWorkflowRepository.findById.mockResolvedValue(sampleWorkflow);
      mockExecutionContext.getExecutionState.mockReturnValue(mockExecutionState);
      mockStepExecutor.canExecute.mockResolvedValueOnce(false); // Prerequisites not met

      // Act
      const result = await executionEngine.executeWorkflow('workflow-exec-123');

      // Assert
      expect(mockStepExecutor.canExecute).toHaveBeenCalledWith(
        sampleWorkflow.steps[0],
        mockExecutionContext
      );
      expect(mockStepExecutor.execute).not.toHaveBeenCalled();
      expect(mockExecutionLogger.logStepError).toHaveBeenCalledWith(
        'step-1',
        expect.objectContaining({ message: expect.stringContaining('Prerequisites not met') }),
        expect.any(Date)
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Prerequisites not met');
    });

    it('should handle step timeout scenarios', async () => {
      // Arrange
      mockWorkflowRepository.findById.mockResolvedValue(sampleWorkflow);
      mockExecutionContext.getExecutionState.mockReturnValue(mockExecutionState);
      mockStepExecutor.canExecute.mockResolvedValue(true);
      mockStepExecutor.execute.mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Step execution timeout')), 100);
        });
      });

      // Act
      const result = await executionEngine.executeWorkflow('workflow-exec-123', { timeout: 50 });

      // Assert
      expect(mockStepExecutor.execute).toHaveBeenCalled();
      expect(mockExecutionLogger.logStepError).toHaveBeenCalledWith(
        'step-1',
        expect.objectContaining({ message: expect.stringContaining('timeout') }),
        expect.any(Date)
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'step.execution.timeout',
        expect.objectContaining({ stepId: 'step-1' })
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    });
  });

  describe('Execution Context Management', () => {
    it('should maintain execution state throughout workflow', async () => {
      // Arrange
      const contextUpdates: ExecutionState[] = [];
      mockWorkflowRepository.findById.mockResolvedValue(sampleWorkflow);
      mockExecutionContext.getExecutionState.mockReturnValue(mockExecutionState);
      mockExecutionContext.updateState.mockImplementation((updates) => {
        contextUpdates.push({ ...mockExecutionState, ...updates });
      });
      mockStepExecutor.canExecute.mockResolvedValue(true);
      mockStepExecutor.execute.mockResolvedValue({
        success: true,
        result: {},
        executionTime: 50
      });

      // Act
      await executionEngine.executeWorkflow('workflow-exec-123');

      // Assert - Verify context state management
      expect(mockExecutionContext.updateState).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'running' })
      );
      expect(mockExecutionContext.updateState).toHaveBeenCalledWith(
        expect.objectContaining({ currentStep: expect.any(String) })
      );
      expect(mockExecutionContext.updateState).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: 'completed' })
      );

      // Verify context updates sequence
      expect(contextUpdates.length).toBeGreaterThan(0);
    });

    it('should propagate variables between steps', async () => {
      // Arrange
      const workflowWithVariables = {
        ...sampleWorkflow,
        steps: [
          {
            id: 'step-1',
            name: 'Producer Step',
            type: 'action',
            config: { action: 'produce', output: 'sharedVar' },
            order: 1
          },
          {
            id: 'step-2',
            name: 'Consumer Step',
            type: 'action',
            config: { action: 'consume', input: 'sharedVar' },
            order: 2,
            dependsOn: ['step-1']
          }
        ]
      };

      mockWorkflowRepository.findById.mockResolvedValue(workflowWithVariables);
      mockExecutionContext.getExecutionState.mockReturnValue(mockExecutionState);
      mockStepExecutor.canExecute.mockResolvedValue(true);
      
      // First step produces a variable
      mockStepExecutor.execute
        .mockResolvedValueOnce({
          success: true,
          result: { produced: 'data' },
          executionTime: 50,
          variables: { sharedVar: 'shared_data' }
        })
        .mockResolvedValueOnce({
          success: true,
          result: { consumed: 'data' },
          executionTime: 30
        });

      mockExecutionContext.getVariable.mockReturnValue('shared_data');

      // Act
      await executionEngine.executeWorkflow('workflow-exec-123');

      // Assert - Verify variable propagation
      expect(mockExecutionContext.setVariable).toHaveBeenCalledWith(
        'sharedVar',
        'shared_data'
      );
      expect(mockExecutionContext.getVariable).toHaveBeenCalledWith('sharedVar');
      
      // Verify both steps executed with proper context
      expect(mockStepExecutor.execute).toHaveBeenCalledTimes(2);
      expect(mockStepExecutor.execute).toHaveBeenNthCalledWith(
        2,
        workflowWithVariables.steps[1],
        mockExecutionContext
      );
    });
  });

  describe('Error Recovery and Cleanup', () => {
    it('should perform cleanup after workflow completion', async () => {
      // Arrange
      mockWorkflowRepository.findById.mockResolvedValue(sampleWorkflow);
      mockExecutionContext.getExecutionState.mockReturnValue(mockExecutionState);
      mockStepExecutor.canExecute.mockResolvedValue(true);
      mockStepExecutor.execute.mockResolvedValue({
        success: true,
        result: {},
        executionTime: 50
      });

      // Act
      await executionEngine.executeWorkflow('workflow-exec-123');

      // Assert - Verify cleanup interactions
      expect(mockStepExecutor.cleanup).toHaveBeenCalled();
      expect(mockExecutionLogger.logWorkflowComplete).toHaveBeenCalledWith(
        'workflow-exec-123',
        expect.objectContaining({ success: true }),
        expect.any(Date)
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'workflow.execution.completed',
        expect.objectContaining({ workflowId: 'workflow-exec-123' })
      );
    });

    it('should handle execution engine failures gracefully', async () => {
      // Arrange
      mockWorkflowRepository.findById.mockResolvedValue(sampleWorkflow);
      mockExecutionContext.getExecutionState.mockReturnValue(mockExecutionState);
      mockStepExecutor.canExecute.mockRejectedValue(new Error('Engine failure'));

      // Act
      const result = await executionEngine.executeWorkflow('workflow-exec-123');

      // Assert - Verify error handling
      expect(mockExecutionLogger.logWorkflowError).toHaveBeenCalledWith(
        'workflow-exec-123',
        expect.objectContaining({ message: 'Engine failure' }),
        expect.any(Date)
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'workflow.execution.error',
        expect.objectContaining({ 
          workflowId: 'workflow-exec-123',
          error: 'Engine failure'
        })
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Engine failure');
    });
  });

  describe('Execution Monitoring and Metrics', () => {
    it('should collect and report execution metrics', async () => {
      // Arrange
      mockWorkflowRepository.findById.mockResolvedValue(sampleWorkflow);
      mockExecutionContext.getExecutionState.mockReturnValue(mockExecutionState);
      mockStepExecutor.canExecute.mockResolvedValue(true);
      mockStepExecutor.execute.mockResolvedValue({
        success: true,
        result: {},
        executionTime: 150
      });
      mockStepExecutor.getExecutionMetrics.mockReturnValue({
        totalSteps: 3,
        executedSteps: 3,
        averageExecutionTime: 100,
        totalExecutionTime: 300
      });

      // Act
      const result = await executionEngine.executeWorkflow('workflow-exec-123');

      // Assert
      expect(mockStepExecutor.getExecutionMetrics).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'workflow.metrics.collected',
        expect.objectContaining({
          workflowId: 'workflow-exec-123',
          metrics: expect.objectContaining({
            totalExecutionTime: expect.any(Number),
            stepCount: expect.any(Number)
          })
        })
      );

      expect(result.metrics).toBeDefined();
      expect(result.metrics?.totalExecutionTime).toBeDefined();
    });
  });
});