import { jest } from '@jest/globals';
import { ParallelExecutionEngine } from '../../src/engines/ParallelExecutionEngine';
import { WorkflowRepository } from '../../src/repositories/WorkflowRepository';
import { StepExecutor } from '../../src/executors/StepExecutor';
import { ExecutionContext } from '../../src/contexts/ExecutionContext';
import { ExecutionCoordinator } from '../../src/coordinators/ExecutionCoordinator';
import { ResourceManager } from '../../src/managers/ResourceManager';
import { EventEmitter } from '../../src/events/EventEmitter';
import {
  Workflow,
  WorkflowStep,
  ParallelExecutionResult,
  StepExecutionResult,
  ExecutionState,
  ResourceAllocation
} from '../../src/types/Workflow';

// London School TDD - Focus on parallel coordination behavior
describe('Parallel Workflow Execution', () => {
  let parallelEngine: ParallelExecutionEngine;
  let mockWorkflowRepository: jest.Mocked<WorkflowRepository>;
  let mockStepExecutor: jest.Mocked<StepExecutor>;
  let mockExecutionContext: jest.Mocked<ExecutionContext>;
  let mockExecutionCoordinator: jest.Mocked<ExecutionCoordinator>;
  let mockResourceManager: jest.Mocked<ResourceManager>;
  let mockEventEmitter: jest.Mocked<EventEmitter>;

  const parallelWorkflow: Workflow = {
    id: 'parallel-workflow-123',
    name: 'Parallel Processing Workflow',
    description: 'Workflow with parallel execution capabilities',
    status: 'active',
    steps: [
      {
        id: 'init-step',
        name: 'Initialize',
        type: 'action',
        config: { action: 'initialize' },
        order: 1,
        parallelizable: false
      },
      {
        id: 'parallel-step-1',
        name: 'Process A',
        type: 'action',
        config: { action: 'processA' },
        order: 2,
        dependsOn: ['init-step'],
        parallelizable: true,
        parallelGroup: 'processing'
      },
      {
        id: 'parallel-step-2',
        name: 'Process B',
        type: 'action',
        config: { action: 'processB' },
        order: 2,
        dependsOn: ['init-step'],
        parallelizable: true,
        parallelGroup: 'processing'
      },
      {
        id: 'parallel-step-3',
        name: 'Process C',
        type: 'action',
        config: { action: 'processC' },
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
        dependsOn: ['parallel-step-1', 'parallel-step-2', 'parallel-step-3'],
        parallelizable: false
      }
    ],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    version: 1
  };

  beforeEach(() => {
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

    mockExecutionCoordinator = {
      coordinateParallelExecution: jest.fn(),
      synchronizeSteps: jest.fn(),
      manageStepDependencies: jest.fn(),
      allocateResources: jest.fn(),
      collectResults: jest.fn(),
      handleParallelFailures: jest.fn()
    } as jest.Mocked<ExecutionCoordinator>;

    mockResourceManager = {
      allocateResources: jest.fn(),
      releaseResources: jest.fn(),
      getAvailableResources: jest.fn(),
      optimizeAllocation: jest.fn(),
      monitorResourceUsage: jest.fn()
    } as jest.Mocked<ResourceManager>;

    mockEventEmitter = {
      emit: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      once: jest.fn()
    } as jest.Mocked<EventEmitter>;

    parallelEngine = new ParallelExecutionEngine(
      mockWorkflowRepository,
      mockStepExecutor,
      mockExecutionContext,
      mockExecutionCoordinator,
      mockResourceManager,
      mockEventEmitter
    );
  });

  describe('Parallel Execution Coordination', () => {
    it('should coordinate parallel step execution with proper resource allocation', async () => {
      // Arrange
      mockWorkflowRepository.findById.mockResolvedValue(parallelWorkflow);
      mockResourceManager.getAvailableResources.mockResolvedValue({
        cpu: 8,
        memory: 16000,
        workers: 4
      });
      mockResourceManager.allocateResources.mockResolvedValue({
        allocated: true,
        resources: { workers: 3, memory: 12000 }
      } as ResourceAllocation);

      const parallelSteps = parallelWorkflow.steps.filter(s => s.parallelGroup === 'processing');
      mockExecutionCoordinator.coordinateParallelExecution.mockResolvedValue({
        success: true,
        results: new Map([
          ['parallel-step-1', { success: true, result: { processedA: true }, executionTime: 100 }],
          ['parallel-step-2', { success: true, result: { processedB: true }, executionTime: 150 }],
          ['parallel-step-3', { success: true, result: { processedC: true }, executionTime: 120 }]
        ]),
        executionTime: 150 // Max of parallel executions
      });

      mockStepExecutor.canExecute.mockResolvedValue(true);
      mockStepExecutor.execute
        .mockResolvedValueOnce({ // init-step
          success: true,
          result: { initialized: true },
          executionTime: 50
        })
        .mockResolvedValueOnce({ // finalize-step
          success: true,
          result: { finalized: true },
          executionTime: 75
        });

      // Act
      const result = await parallelEngine.executeWorkflow('parallel-workflow-123');

      // Assert - Verify parallel coordination interactions
      expect(mockResourceManager.getAvailableResources).toHaveBeenCalled();
      expect(mockResourceManager.allocateResources).toHaveBeenCalledWith(
        expect.objectContaining({
          stepCount: 3,
          estimatedResources: expect.any(Object)
        })
      );
      expect(mockExecutionCoordinator.coordinateParallelExecution).toHaveBeenCalledWith(
        parallelSteps,
        mockExecutionContext,
        expect.objectContaining({ workers: 3 })
      );

      // Verify event emissions for parallel execution
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'parallel.execution.started',
        expect.objectContaining({
          workflowId: 'parallel-workflow-123',
          parallelSteps: 3
        })
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'parallel.execution.completed',
        expect.objectContaining({
          workflowId: 'parallel-workflow-123',
          results: expect.any(Map)
        })
      );

      expect(result.success).toBe(true);
      expect(result.parallelResults).toBeDefined();
    });

    it('should execute steps in correct dependency phases', async () => {
      // Arrange
      mockWorkflowRepository.findById.mockResolvedValue(parallelWorkflow);
      mockResourceManager.getAvailableResources.mockResolvedValue({ workers: 4 });
      mockResourceManager.allocateResources.mockResolvedValue({ allocated: true });
      
      mockStepExecutor.canExecute.mockResolvedValue(true);
      
      // Track execution order
      const executionOrder: string[] = [];
      mockStepExecutor.execute.mockImplementation((step) => {
        executionOrder.push(step.id);
        return Promise.resolve({
          success: true,
          result: { [step.id]: 'completed' },
          executionTime: 50
        });
      });

      mockExecutionCoordinator.coordinateParallelExecution.mockImplementation((steps) => {
        steps.forEach(step => executionOrder.push(`parallel:${step.id}`));
        return Promise.resolve({
          success: true,
          results: new Map(steps.map(s => [s.id, { success: true, result: {}, executionTime: 100 }])),
          executionTime: 100
        });
      });

      // Act
      await parallelEngine.executeWorkflow('parallel-workflow-123');

      // Assert - Verify execution phases and dependency order
      expect(executionOrder[0]).toBe('init-step'); // First phase: initialization
      
      // Second phase: parallel execution (order within parallel group doesn't matter)
      const parallelExecutions = executionOrder.filter(id => id.startsWith('parallel:'));
      expect(parallelExecutions).toHaveLength(3);
      expect(parallelExecutions).toContain('parallel:parallel-step-1');
      expect(parallelExecutions).toContain('parallel:parallel-step-2');
      expect(parallelExecutions).toContain('parallel:parallel-step-3');
      
      expect(executionOrder[executionOrder.length - 1]).toBe('finalize-step'); // Final phase

      // Verify dependency management was called
      expect(mockExecutionCoordinator.manageStepDependencies).toHaveBeenCalledWith(
        parallelWorkflow.steps,
        expect.any(Object)
      );
    });

    it('should synchronize parallel step completion before dependent steps', async () => {
      // Arrange
      mockWorkflowRepository.findById.mockResolvedValue(parallelWorkflow);
      mockResourceManager.allocateResources.mockResolvedValue({ allocated: true });
      mockStepExecutor.canExecute.mockResolvedValue(true);
      mockStepExecutor.execute.mockResolvedValue({ success: true, result: {}, executionTime: 50 });

      // Simulate parallel execution with synchronization
      mockExecutionCoordinator.coordinateParallelExecution.mockResolvedValue({
        success: true,
        results: new Map([
          ['parallel-step-1', { success: true, result: {}, executionTime: 100 }],
          ['parallel-step-2', { success: true, result: {}, executionTime: 150 }],
          ['parallel-step-3', { success: true, result: {}, executionTime: 120 }]
        ]),
        executionTime: 150
      });

      mockExecutionCoordinator.synchronizeSteps.mockResolvedValue({
        synchronized: true,
        completedSteps: ['parallel-step-1', 'parallel-step-2', 'parallel-step-3']
      });

      // Act
      await parallelEngine.executeWorkflow('parallel-workflow-123');

      // Assert - Verify synchronization behavior
      expect(mockExecutionCoordinator.synchronizeSteps).toHaveBeenCalledWith(
        ['parallel-step-1', 'parallel-step-2', 'parallel-step-3'],
        mockExecutionContext
      );

      // Verify finalize step only executed after synchronization
      const finalizeStepExecution = mockStepExecutor.execute.mock.calls.find(
        call => call[0].id === 'finalize-step'
      );
      expect(finalizeStepExecution).toBeDefined();

      // Verify synchronization event emission
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'parallel.steps.synchronized',
        expect.objectContaining({
          completedSteps: expect.arrayContaining([
            'parallel-step-1', 'parallel-step-2', 'parallel-step-3'
          ])
        })
      );
    });
  });

  describe('Resource Management', () => {
    it('should optimize resource allocation based on parallel step requirements', async () => {
      // Arrange
      const resourceIntensiveWorkflow = {
        ...parallelWorkflow,
        steps: parallelWorkflow.steps.map(step => ({
          ...step,
          resourceRequirements: step.parallelGroup === 'processing' ? {
            cpu: 2,
            memory: 4000,
            priority: 'high'
          } : { cpu: 1, memory: 1000, priority: 'normal' }
        }))
      };

      mockWorkflowRepository.findById.mockResolvedValue(resourceIntensiveWorkflow);
      mockResourceManager.getAvailableResources.mockResolvedValue({
        cpu: 16,
        memory: 32000,
        workers: 8
      });
      mockResourceManager.optimizeAllocation.mockResolvedValue({
        optimized: true,
        allocation: {
          'parallel-step-1': { cpu: 2, memory: 4000, worker: 'worker-1' },
          'parallel-step-2': { cpu: 2, memory: 4000, worker: 'worker-2' },
          'parallel-step-3': { cpu: 2, memory: 4000, worker: 'worker-3' }
        }
      });

      mockStepExecutor.canExecute.mockResolvedValue(true);
      mockStepExecutor.execute.mockResolvedValue({ success: true, result: {}, executionTime: 50 });
      mockExecutionCoordinator.coordinateParallelExecution.mockResolvedValue({
        success: true,
        results: new Map(),
        executionTime: 100
      });

      // Act
      await parallelEngine.executeWorkflow('parallel-workflow-123');

      // Assert - Verify resource optimization interactions
      expect(mockResourceManager.optimizeAllocation).toHaveBeenCalledWith(
        expect.objectContaining({
          steps: expect.arrayContaining([
            expect.objectContaining({ id: 'parallel-step-1' }),
            expect.objectContaining({ id: 'parallel-step-2' }),
            expect.objectContaining({ id: 'parallel-step-3' })
          ]),
          availableResources: expect.objectContaining({
            cpu: 16,
            memory: 32000,
            workers: 8
          })
        })
      );

      expect(mockResourceManager.allocateResources).toHaveBeenCalledWith(
        expect.objectContaining({
          optimizedAllocation: expect.any(Object)
        })
      );

      // Verify resource monitoring
      expect(mockResourceManager.monitorResourceUsage).toHaveBeenCalledWith(
        'parallel-workflow-123'
      );
    });

    it('should handle resource constraints by queuing parallel steps', async () => {
      // Arrange
      mockWorkflowRepository.findById.mockResolvedValue(parallelWorkflow);
      mockResourceManager.getAvailableResources.mockResolvedValue({
        cpu: 4,
        memory: 8000,
        workers: 2 // Limited workers
      });
      mockResourceManager.allocateResources.mockResolvedValue({
        allocated: false,
        reason: 'Insufficient workers',
        queuedSteps: ['parallel-step-3']
      });

      mockExecutionCoordinator.coordinateParallelExecution
        .mockResolvedValueOnce({ // First batch: step-1, step-2
          success: true,
          results: new Map([
            ['parallel-step-1', { success: true, result: {}, executionTime: 100 }],
            ['parallel-step-2', { success: true, result: {}, executionTime: 120 }]
          ]),
          executionTime: 120
        })
        .mockResolvedValueOnce({ // Second batch: step-3
          success: true,
          results: new Map([
            ['parallel-step-3', { success: true, result: {}, executionTime: 90 }]
          ]),
          executionTime: 90
        });

      mockStepExecutor.canExecute.mockResolvedValue(true);
      mockStepExecutor.execute.mockResolvedValue({ success: true, result: {}, executionTime: 50 });

      // Act
      await parallelEngine.executeWorkflow('parallel-workflow-123');

      // Assert - Verify resource constraint handling
      expect(mockExecutionCoordinator.coordinateParallelExecution).toHaveBeenCalledTimes(2);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'parallel.steps.queued',
        expect.objectContaining({
          queuedSteps: ['parallel-step-3'],
          reason: 'Insufficient workers'
        })
      );

      // Verify resource release and reallocation
      expect(mockResourceManager.releaseResources).toHaveBeenCalled();
      expect(mockResourceManager.allocateResources).toHaveBeenCalledTimes(2);
    });
  });

  describe('Parallel Execution Failure Handling', () => {
    it('should handle individual parallel step failures gracefully', async () => {
      // Arrange
      mockWorkflowRepository.findById.mockResolvedValue(parallelWorkflow);
      mockResourceManager.allocateResources.mockResolvedValue({ allocated: true });
      mockStepExecutor.canExecute.mockResolvedValue(true);
      mockStepExecutor.execute.mockResolvedValue({ success: true, result: {}, executionTime: 50 });

      // One parallel step fails
      mockExecutionCoordinator.coordinateParallelExecution.mockResolvedValue({
        success: false,
        results: new Map([
          ['parallel-step-1', { success: true, result: {}, executionTime: 100 }],
          ['parallel-step-2', { success: false, error: new Error('Process B failed'), executionTime: 75 }],
          ['parallel-step-3', { success: true, result: {}, executionTime: 120 }]
        ]),
        executionTime: 120,
        failedSteps: ['parallel-step-2']
      });

      mockExecutionCoordinator.handleParallelFailures.mockResolvedValue({
        strategy: 'fail-fast',
        recovered: false,
        affectedSteps: ['finalize-step']
      });

      // Act
      const result = await parallelEngine.executeWorkflow('parallel-workflow-123');

      // Assert - Verify failure handling interactions
      expect(mockExecutionCoordinator.handleParallelFailures).toHaveBeenCalledWith(
        ['parallel-step-2'],
        mockExecutionContext,
        expect.objectContaining({ strategy: expect.any(String) })
      );

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'parallel.execution.failed',
        expect.objectContaining({
          workflowId: 'parallel-workflow-123',
          failedSteps: ['parallel-step-2'],
          successfulSteps: ['parallel-step-1', 'parallel-step-3']
        })
      );

      // Verify cleanup after parallel failure
      expect(mockResourceManager.releaseResources).toHaveBeenCalled();
      
      expect(result.success).toBe(false);
      expect(result.failedSteps).toContain('parallel-step-2');
    });

    it('should implement retry strategy for transient parallel failures', async () => {
      // Arrange
      mockWorkflowRepository.findById.mockResolvedValue(parallelWorkflow);
      mockResourceManager.allocateResources.mockResolvedValue({ allocated: true });
      mockStepExecutor.canExecute.mockResolvedValue(true);
      mockStepExecutor.execute.mockResolvedValue({ success: true, result: {}, executionTime: 50 });

      // First attempt fails, second succeeds
      mockExecutionCoordinator.coordinateParallelExecution
        .mockResolvedValueOnce({
          success: false,
          results: new Map([
            ['parallel-step-1', { success: false, error: new Error('Transient failure'), executionTime: 50 }]
          ]),
          executionTime: 50,
          failedSteps: ['parallel-step-1']
        })
        .mockResolvedValueOnce({
          success: true,
          results: new Map([
            ['parallel-step-1', { success: true, result: {}, executionTime: 100 }],
            ['parallel-step-2', { success: true, result: {}, executionTime: 120 }],
            ['parallel-step-3', { success: true, result: {}, executionTime: 90 }]
          ]),
          executionTime: 120
        });

      mockExecutionCoordinator.handleParallelFailures.mockResolvedValue({
        strategy: 'retry',
        recovered: true,
        retryAttempts: 1
      });

      // Act
      const result = await parallelEngine.executeWorkflow('parallel-workflow-123');

      // Assert - Verify retry mechanism
      expect(mockExecutionCoordinator.coordinateParallelExecution).toHaveBeenCalledTimes(2);
      expect(mockExecutionCoordinator.handleParallelFailures).toHaveBeenCalledWith(
        ['parallel-step-1'],
        mockExecutionContext,
        expect.objectContaining({ strategy: expect.any(String) })
      );

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'parallel.execution.retrying',
        expect.objectContaining({
          failedSteps: ['parallel-step-1'],
          attempt: 1
        })
      );

      expect(result.success).toBe(true);
      expect(result.retryAttempts).toBe(1);
    });
  });

  describe('Performance Optimization', () => {
    it('should optimize parallel execution based on step characteristics', async () => {
      // Arrange
      const mixedWorkflow = {
        ...parallelWorkflow,
        steps: [
          {
            id: 'cpu-intensive',
            name: 'CPU Processing',
            type: 'computation',
            config: { complexity: 'high' },
            order: 1,
            parallelizable: true,
            parallelGroup: 'mixed',
            characteristics: { type: 'cpu-bound', priority: 'high' }
          },
          {
            id: 'io-intensive',
            name: 'IO Processing',
            type: 'io',
            config: { operations: 'file-read' },
            order: 1,
            parallelizable: true,
            parallelGroup: 'mixed',
            characteristics: { type: 'io-bound', priority: 'medium' }
          }
        ]
      };

      mockWorkflowRepository.findById.mockResolvedValue(mixedWorkflow);
      mockResourceManager.optimizeAllocation.mockResolvedValue({
        optimized: true,
        allocation: {
          'cpu-intensive': { cpu: 4, memory: 8000, worker: 'cpu-worker' },
          'io-intensive': { cpu: 1, memory: 2000, worker: 'io-worker' }
        },
        strategy: 'mixed-workload'
      });

      mockExecutionCoordinator.coordinateParallelExecution.mockResolvedValue({
        success: true,
        results: new Map([
          ['cpu-intensive', { success: true, result: {}, executionTime: 200 }],
          ['io-intensive', { success: true, result: {}, executionTime: 300 }]
        ]),
        executionTime: 300,
        optimizations: { loadBalanced: true, resourceEfficient: true }
      });

      // Act
      await parallelEngine.executeWorkflow('parallel-workflow-123');

      // Assert - Verify performance optimization interactions
      expect(mockResourceManager.optimizeAllocation).toHaveBeenCalledWith(
        expect.objectContaining({
          steps: expect.arrayContaining([
            expect.objectContaining({ 
              characteristics: expect.objectContaining({ type: 'cpu-bound' })
            }),
            expect.objectContaining({ 
              characteristics: expect.objectContaining({ type: 'io-bound' })
            })
          ])
        })
      );

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'parallel.execution.optimized',
        expect.objectContaining({
          strategy: 'mixed-workload',
          optimizations: expect.objectContaining({
            loadBalanced: true,
            resourceEfficient: true
          })
        })
      );
    });
  });
});