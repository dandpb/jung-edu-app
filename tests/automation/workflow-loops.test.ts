import { jest } from '@jest/globals';
import { LoopExecutionEngine } from '../../src/engines/LoopExecutionEngine';
import { WorkflowRepository } from '../../src/repositories/WorkflowRepository';
import { LoopController } from '../../src/controllers/LoopController';
import { IterationManager } from '../../src/managers/IterationManager';
import { ExecutionContext } from '../../src/contexts/ExecutionContext';
import { StepExecutor } from '../../src/executors/StepExecutor';
import { LoopConditionEvaluator } from '../../src/evaluators/LoopConditionEvaluator';
import { EventEmitter } from '../../src/events/EventEmitter';
import {
  Workflow,
  LoopStep,
  LoopConfiguration,
  IterationResult,
  LoopExecutionResult,
  LoopType,
  BreakCondition
} from '../../src/types/Workflow';

// London School TDD - Focus on loop iteration behavior and control flow
describe('Workflow Loop Execution', () => {
  let loopEngine: LoopExecutionEngine;
  let mockWorkflowRepository: jest.Mocked<WorkflowRepository>;
  let mockLoopController: jest.Mocked<LoopController>;
  let mockIterationManager: jest.Mocked<IterationManager>;
  let mockExecutionContext: jest.Mocked<ExecutionContext>;
  let mockStepExecutor: jest.Mocked<StepExecutor>;
  let mockLoopConditionEvaluator: jest.Mocked<LoopConditionEvaluator>;
  let mockEventEmitter: jest.Mocked<EventEmitter>;

  const forLoopWorkflow: Workflow = {
    id: 'loop-workflow-123',
    name: 'Loop Processing Workflow',
    description: 'Workflow with various loop types',
    status: 'active',
    steps: [
      {
        id: 'setup-step',
        name: 'Setup Data',
        type: 'action',
        config: { action: 'setupData', data: { items: [1, 2, 3, 4, 5] } },
        order: 1
      },
      {
        id: 'for-loop-step',
        name: 'Process Items Loop',
        type: 'loop',
        config: {
          loopType: 'for',
          iterable: 'items',
          iteratorVariable: 'currentItem',
          indexVariable: 'index',
          steps: [
            {
              id: 'process-item',
              name: 'Process Single Item',
              type: 'action',
              config: { 
                action: 'processItem',
                input: '${currentItem}',
                index: '${index}'
              }
            },
            {
              id: 'validate-result',
              name: 'Validate Processing Result',
              type: 'validation',
              config: {
                condition: 'result.success === true'
              }
            }
          ],
          breakCondition: {
            expression: 'result.error === true',
            action: 'break'
          },
          continueCondition: {
            expression: 'currentItem < 0',
            action: 'continue'
          }
        },
        order: 2,
        dependsOn: ['setup-step']
      },
      {
        id: 'summary-step',
        name: 'Generate Summary',
        type: 'action',
        config: { action: 'generateSummary' },
        order: 3,
        dependsOn: ['for-loop-step']
      }
    ],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    version: 1
  };

  const whileLoopWorkflow: Workflow = {
    id: 'while-loop-workflow-456',
    name: 'While Loop Workflow',
    description: 'Workflow with while loop',
    status: 'active',
    steps: [
      {
        id: 'init-counter',
        name: 'Initialize Counter',
        type: 'action',
        config: { action: 'setVariable', variable: 'counter', value: 0 },
        order: 1
      },
      {
        id: 'while-loop-step',
        name: 'While Counter Less Than 10',
        type: 'loop',
        config: {
          loopType: 'while',
          condition: 'counter < 10',
          maxIterations: 100, // Safety limit
          steps: [
            {
              id: 'increment-counter',
              name: 'Increment Counter',
              type: 'action',
              config: {
                action: 'increment',
                variable: 'counter'
              }
            },
            {
              id: 'process-iteration',
              name: 'Process Current Iteration',
              type: 'action',
              config: {
                action: 'processIteration',
                iteration: '${counter}'
              }
            }
          ]
        },
        order: 2,
        dependsOn: ['init-counter']
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

    mockLoopController = {
      initializeLoop: jest.fn(),
      executeIteration: jest.fn(),
      checkBreakCondition: jest.fn(),
      checkContinueCondition: jest.fn(),
      updateLoopState: jest.fn(),
      finalizeLoop: jest.fn(),
      handleLoopError: jest.fn()
    } as jest.Mocked<LoopController>;

    mockIterationManager = {
      createIterationContext: jest.fn(),
      executeIterationSteps: jest.fn(),
      collectIterationResults: jest.fn(),
      manageIterationState: jest.fn(),
      handleIterationFailure: jest.fn(),
      getIterationMetrics: jest.fn()
    } as jest.Mocked<IterationManager>;

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

    mockStepExecutor = {
      execute: jest.fn(),
      canExecute: jest.fn(),
      getStepType: jest.fn(),
      validateStep: jest.fn(),
      cleanup: jest.fn(),
      getExecutionMetrics: jest.fn()
    } as jest.Mocked<StepExecutor>;

    mockLoopConditionEvaluator = {
      evaluateLoopCondition: jest.fn(),
      evaluateBreakCondition: jest.fn(),
      evaluateContinueCondition: jest.fn(),
      validateLoopConfiguration: jest.fn(),
      getIterationVariables: jest.fn()
    } as jest.Mocked<LoopConditionEvaluator>;

    mockEventEmitter = {
      emit: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      once: jest.fn()
    } as jest.Mocked<EventEmitter>;

    loopEngine = new LoopExecutionEngine(
      mockWorkflowRepository,
      mockLoopController,
      mockIterationManager,
      mockExecutionContext,
      mockStepExecutor,
      mockLoopConditionEvaluator,
      mockEventEmitter
    );
  });

  describe('For Loop Execution', () => {
    it('should execute for loop with proper iteration control', async () => {
      // Arrange
      mockWorkflowRepository.findById.mockResolvedValue(forLoopWorkflow);
      mockExecutionContext.getVariable.mockReturnValue([1, 2, 3, 4, 5]); // items array

      mockLoopController.initializeLoop.mockResolvedValue({
        initialized: true,
        loopState: {
          type: 'for',
          currentIndex: 0,
          totalIterations: 5,
          items: [1, 2, 3, 4, 5]
        }
      });

      // Mock each iteration execution
      const iterationResults = [
        { success: true, iteration: 0, result: { processed: 1 }, executionTime: 50 },
        { success: true, iteration: 1, result: { processed: 2 }, executionTime: 45 },
        { success: true, iteration: 2, result: { processed: 3 }, executionTime: 55 },
        { success: true, iteration: 3, result: { processed: 4 }, executionTime: 48 },
        { success: true, iteration: 4, result: { processed: 5 }, executionTime: 52 }
      ];

      mockIterationManager.executeIterationSteps.mockImplementation((iteration) => {
        return Promise.resolve(iterationResults[iteration] as IterationResult);
      });

      mockLoopConditionEvaluator.evaluateBreakCondition.mockResolvedValue(false);
      mockLoopConditionEvaluator.evaluateContinueCondition.mockResolvedValue(false);

      mockLoopController.finalizeLoop.mockResolvedValue({
        success: true,
        totalIterations: 5,
        results: iterationResults,
        executionTime: 250
      } as LoopExecutionResult);

      // Act
      const result = await loopEngine.executeWorkflow('loop-workflow-123');

      // Assert - Verify loop initialization and control interactions
      expect(mockLoopController.initializeLoop).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'for-loop-step',
          config: expect.objectContaining({
            loopType: 'for',
            iterable: 'items'
          })
        }),
        mockExecutionContext
      );

      // Verify each iteration was executed
      expect(mockIterationManager.executeIterationSteps).toHaveBeenCalledTimes(5);
      for (let i = 0; i < 5; i++) {
        expect(mockIterationManager.executeIterationSteps).toHaveBeenNthCalledWith(
          i + 1,
          i,
          expect.objectContaining({
            currentItem: i + 1,
            index: i
          }),
          expect.any(Array), // loop steps
          mockExecutionContext,
          mockStepExecutor
        );
      }

      // Verify loop control flow checks
      expect(mockLoopConditionEvaluator.evaluateBreakCondition).toHaveBeenCalledTimes(5);
      expect(mockLoopConditionEvaluator.evaluateContinueCondition).toHaveBeenCalledTimes(5);

      // Verify event emissions
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'loop.started',
        expect.objectContaining({
          stepId: 'for-loop-step',
          loopType: 'for',
          totalIterations: 5
        })
      );

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'loop.completed',
        expect.objectContaining({
          stepId: 'for-loop-step',
          totalIterations: 5,
          success: true
        })
      );

      expect(result.success).toBe(true);
      expect(result.loopResults).toBeDefined();
    });

    it('should handle break condition during for loop execution', async () => {
      // Arrange
      mockWorkflowRepository.findById.mockResolvedValue(forLoopWorkflow);
      mockExecutionContext.getVariable.mockReturnValue([1, 2, 3, 4, 5]);

      mockLoopController.initializeLoop.mockResolvedValue({
        initialized: true,
        loopState: { type: 'for', currentIndex: 0, totalIterations: 5 }
      });

      // First two iterations succeed, third triggers break condition
      mockIterationManager.executeIterationSteps
        .mockResolvedValueOnce({ success: true, iteration: 0, result: { processed: 1 } })
        .mockResolvedValueOnce({ success: true, iteration: 1, result: { processed: 2 } })
        .mockResolvedValueOnce({ success: true, iteration: 2, result: { error: true, processed: 3 } });

      // Break condition evaluates to true on third iteration
      mockLoopConditionEvaluator.evaluateBreakCondition
        .mockResolvedValueOnce(false) // iteration 0
        .mockResolvedValueOnce(false) // iteration 1  
        .mockResolvedValueOnce(true); // iteration 2 - triggers break

      mockLoopController.checkBreakCondition.mockResolvedValue({
        shouldBreak: true,
        reason: 'Error condition met'
      });

      mockLoopController.finalizeLoop.mockResolvedValue({
        success: true,
        totalIterations: 3, // Loop broke early
        results: [
          { success: true, iteration: 0, result: { processed: 1 } },
          { success: true, iteration: 1, result: { processed: 2 } },
          { success: true, iteration: 2, result: { error: true, processed: 3 } }
        ],
        earlyTermination: true,
        terminationReason: 'break'
      });

      // Act
      const result = await loopEngine.executeWorkflow('loop-workflow-123');

      // Assert - Verify break condition handling
      expect(mockIterationManager.executeIterationSteps).toHaveBeenCalledTimes(3); // Only 3 iterations
      expect(mockLoopConditionEvaluator.evaluateBreakCondition).toHaveBeenCalledTimes(3);
      expect(mockLoopController.checkBreakCondition).toHaveBeenCalledWith(
        expect.objectContaining({ error: true }),
        mockExecutionContext
      );

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'loop.break.triggered',
        expect.objectContaining({
          stepId: 'for-loop-step',
          iteration: 2,
          reason: 'Error condition met'
        })
      );

      expect(result.success).toBe(true);
      expect(result.loopResults?.earlyTermination).toBe(true);
      expect(result.loopResults?.terminationReason).toBe('break');
    });

    it('should handle continue condition during for loop execution', async () => {
      // Arrange
      mockWorkflowRepository.findById.mockResolvedValue(forLoopWorkflow);
      mockExecutionContext.getVariable.mockReturnValue([-1, 2, -3, 4, 5]); // Negative values should trigger continue

      mockLoopController.initializeLoop.mockResolvedValue({
        initialized: true,
        loopState: { type: 'for', currentIndex: 0, totalIterations: 5 }
      });

      // Continue condition evaluates to true for negative values
      mockLoopConditionEvaluator.evaluateContinueCondition
        .mockResolvedValueOnce(true)  // -1: continue
        .mockResolvedValueOnce(false) // 2: process
        .mockResolvedValueOnce(true)  // -3: continue
        .mockResolvedValueOnce(false) // 4: process
        .mockResolvedValueOnce(false); // 5: process

      mockLoopConditionEvaluator.evaluateBreakCondition.mockResolvedValue(false);

      // Only non-negative items are processed
      mockIterationManager.executeIterationSteps
        .mockResolvedValueOnce({ success: true, iteration: 1, result: { processed: 2, skipped: false } })
        .mockResolvedValueOnce({ success: true, iteration: 3, result: { processed: 4, skipped: false } })
        .mockResolvedValueOnce({ success: true, iteration: 4, result: { processed: 5, skipped: false } });

      mockLoopController.finalizeLoop.mockResolvedValue({
        success: true,
        totalIterations: 5,
        processedIterations: 3,
        skippedIterations: 2,
        results: [
          { success: true, iteration: 1, result: { processed: 2 } },
          { success: true, iteration: 3, result: { processed: 4 } },
          { success: true, iteration: 4, result: { processed: 5 } }
        ]
      });

      // Act
      const result = await loopEngine.executeWorkflow('loop-workflow-123');

      // Assert - Verify continue condition handling
      expect(mockLoopConditionEvaluator.evaluateContinueCondition).toHaveBeenCalledTimes(5);
      expect(mockIterationManager.executeIterationSteps).toHaveBeenCalledTimes(3); // Only processed items

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'loop.continue.triggered',
        expect.objectContaining({
          stepId: 'for-loop-step',
          iteration: 0,
          reason: expect.stringContaining('currentItem < 0')
        })
      );

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'loop.continue.triggered',
        expect.objectContaining({
          stepId: 'for-loop-step',
          iteration: 2,
          reason: expect.stringContaining('currentItem < 0')
        })
      );

      expect(result.success).toBe(true);
      expect(result.loopResults?.processedIterations).toBe(3);
      expect(result.loopResults?.skippedIterations).toBe(2);
    });
  });

  describe('While Loop Execution', () => {
    it('should execute while loop with condition-based termination', async () => {
      // Arrange
      mockWorkflowRepository.findById.mockResolvedValue(whileLoopWorkflow);
      mockExecutionContext.getVariable.mockReturnValue(0); // Initial counter value

      mockLoopController.initializeLoop.mockResolvedValue({
        initialized: true,
        loopState: {
          type: 'while',
          condition: 'counter < 10',
          currentIteration: 0
        }
      });

      // Mock condition evaluation - true for counter 0-9, false for counter 10
      let currentCounter = 0;
      mockLoopConditionEvaluator.evaluateLoopCondition.mockImplementation(() => {
        return Promise.resolve(currentCounter < 10);
      });

      // Mock iteration execution - increments counter each time
      mockIterationManager.executeIterationSteps.mockImplementation((iteration) => {
        currentCounter++;
        mockExecutionContext.getVariable.mockReturnValue(currentCounter);
        return Promise.resolve({
          success: true,
          iteration,
          result: { counter: currentCounter, processed: true },
          executionTime: 40
        } as IterationResult);
      });

      mockLoopController.finalizeLoop.mockResolvedValue({
        success: true,
        totalIterations: 10,
        results: Array.from({ length: 10 }, (_, i) => ({
          success: true,
          iteration: i,
          result: { counter: i + 1, processed: true }
        })),
        executionTime: 400
      });

      // Act
      const result = await loopEngine.executeWorkflow('while-loop-workflow-456');

      // Assert - Verify while loop behavior
      expect(mockLoopController.initializeLoop).toHaveBeenCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({
            loopType: 'while',
            condition: 'counter < 10'
          })
        }),
        mockExecutionContext
      );

      // Verify condition was evaluated 11 times (0-9 true, 10 false)
      expect(mockLoopConditionEvaluator.evaluateLoopCondition).toHaveBeenCalledTimes(11);
      
      // Verify 10 iterations were executed
      expect(mockIterationManager.executeIterationSteps).toHaveBeenCalledTimes(10);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'loop.started',
        expect.objectContaining({
          stepId: 'while-loop-step',
          loopType: 'while',
          condition: 'counter < 10'
        })
      );

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'loop.completed',
        expect.objectContaining({
          stepId: 'while-loop-step',
          totalIterations: 10
        })
      );

      expect(result.success).toBe(true);
    });

    it('should respect max iterations safety limit in while loop', async () => {
      // Arrange - Create while loop with condition that never becomes false
      const infiniteLoopWorkflow = {
        ...whileLoopWorkflow,
        steps: [
          {
            id: 'infinite-while-loop',
            name: 'Infinite While Loop',
            type: 'loop',
            config: {
              loopType: 'while',
              condition: 'true', // Always true - infinite loop
              maxIterations: 5, // Safety limit
              steps: [
                {
                  id: 'infinite-step',
                  name: 'Infinite Step',
                  type: 'action',
                  config: { action: 'doSomething' }
                }
              ]
            },
            order: 1
          }
        ]
      };

      mockWorkflowRepository.findById.mockResolvedValue(infiniteLoopWorkflow);
      mockLoopController.initializeLoop.mockResolvedValue({
        initialized: true,
        loopState: { type: 'while', condition: 'true', maxIterations: 5 }
      });

      // Condition always evaluates to true
      mockLoopConditionEvaluator.evaluateLoopCondition.mockResolvedValue(true);

      // Mock 5 successful iterations
      mockIterationManager.executeIterationSteps.mockResolvedValue({
        success: true,
        iteration: 0,
        result: { executed: true },
        executionTime: 50
      });

      mockLoopController.finalizeLoop.mockResolvedValue({
        success: true,
        totalIterations: 5,
        maxIterationsReached: true,
        terminationReason: 'max_iterations'
      });

      // Act
      const result = await loopEngine.executeWorkflow('while-loop-workflow-456');

      // Assert - Verify max iterations enforcement
      expect(mockIterationManager.executeIterationSteps).toHaveBeenCalledTimes(5);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'loop.max.iterations.reached',
        expect.objectContaining({
          stepId: 'infinite-while-loop',
          maxIterations: 5,
          terminationReason: 'Safety limit reached'
        })
      );

      expect(result.success).toBe(true);
      expect(result.loopResults?.maxIterationsReached).toBe(true);
    });
  });

  describe('Nested Loop Execution', () => {
    it('should handle nested loops with proper context isolation', async () => {
      // Arrange
      const nestedLoopWorkflow: Workflow = {
        id: 'nested-loop-workflow',
        name: 'Nested Loop Workflow',
        description: 'Workflow with nested loops',
        status: 'active',
        steps: [
          {
            id: 'outer-loop',
            name: 'Outer For Loop',
            type: 'loop',
            config: {
              loopType: 'for',
              iterable: 'outerItems',
              iteratorVariable: 'outerItem',
              indexVariable: 'outerIndex',
              steps: [
                {
                  id: 'inner-loop',
                  name: 'Inner For Loop',
                  type: 'loop',
                  config: {
                    loopType: 'for',
                    iterable: 'outerItem.innerItems',
                    iteratorVariable: 'innerItem',
                    indexVariable: 'innerIndex',
                    steps: [
                      {
                        id: 'process-nested-item',
                        name: 'Process Nested Item',
                        type: 'action',
                        config: {
                          action: 'processNestedItem',
                          outer: '${outerItem}',
                          inner: '${innerItem}',
                          outerIndex: '${outerIndex}',
                          innerIndex: '${innerIndex}'
                        }
                      }
                    ]
                  }
                }
              ]
            },
            order: 1
          }
        ],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        version: 1
      };

      mockWorkflowRepository.findById.mockResolvedValue(nestedLoopWorkflow);
      mockExecutionContext.getVariable.mockReturnValue([
        { value: 'A', innerItems: [1, 2] },
        { value: 'B', innerItems: [3, 4, 5] }
      ]);

      // Mock outer loop initialization
      mockLoopController.initializeLoop
        .mockResolvedValueOnce({ // Outer loop
          initialized: true,
          loopState: { type: 'for', totalIterations: 2 }
        })
        .mockResolvedValueOnce({ // Inner loop - first outer iteration
          initialized: true,
          loopState: { type: 'for', totalIterations: 2 }
        })
        .mockResolvedValueOnce({ // Inner loop - second outer iteration
          initialized: true,
          loopState: { type: 'for', totalIterations: 3 }
        });

      // Mock nested context creation
      mockExecutionContext.clone.mockImplementation(() => {
        const clonedContext = { ...mockExecutionContext };
        return clonedContext as typeof mockExecutionContext;
      });

      // Mock outer loop iterations
      mockIterationManager.executeIterationSteps
        .mockImplementationOnce(async (iteration, variables, steps, context) => {
          // First outer iteration: execute inner loop with 2 items
          return {
            success: true,
            iteration: 0,
            result: { 
              outerItem: { value: 'A', innerItems: [1, 2] },
              nestedResults: [
                { processed: 'A-1' },
                { processed: 'A-2' }
              ]
            },
            executionTime: 100
          };
        })
        .mockImplementationOnce(async (iteration, variables, steps, context) => {
          // Second outer iteration: execute inner loop with 3 items
          return {
            success: true,
            iteration: 1,
            result: {
              outerItem: { value: 'B', innerItems: [3, 4, 5] },
              nestedResults: [
                { processed: 'B-3' },
                { processed: 'B-4' },
                { processed: 'B-5' }
              ]
            },
            executionTime: 150
          };
        });

      mockLoopController.finalizeLoop.mockResolvedValue({
        success: true,
        totalIterations: 2,
        results: [
          {
            success: true,
            iteration: 0,
            result: { nestedResults: [{ processed: 'A-1' }, { processed: 'A-2' }] }
          },
          {
            success: true,
            iteration: 1,
            result: { nestedResults: [{ processed: 'B-3' }, { processed: 'B-4' }, { processed: 'B-5' }] }
          }
        ]
      });

      // Act
      const result = await loopEngine.executeWorkflow('nested-loop-workflow');

      // Assert - Verify nested loop execution
      expect(mockLoopController.initializeLoop).toHaveBeenCalledTimes(3); // 1 outer + 2 inner
      expect(mockIterationManager.executeIterationSteps).toHaveBeenCalledTimes(2); // 2 outer iterations
      expect(mockExecutionContext.clone).toHaveBeenCalledTimes(2); // Context cloned for each outer iteration

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'nested.loop.started',
        expect.objectContaining({
          outerLoop: 'outer-loop',
          innerLoop: 'inner-loop',
          depth: 1
        })
      );

      expect(result.success).toBe(true);
      expect(result.loopResults?.totalIterations).toBe(2); // Outer iterations
    });
  });

  describe('Loop Error Handling and Recovery', () => {
    it('should handle iteration failures with retry strategy', async () => {
      // Arrange
      mockWorkflowRepository.findById.mockResolvedValue(forLoopWorkflow);
      mockExecutionContext.getVariable.mockReturnValue([1, 2, 3]);

      mockLoopController.initializeLoop.mockResolvedValue({
        initialized: true,
        loopState: { type: 'for', totalIterations: 3 }
      });

      // Second iteration fails initially, succeeds on retry
      mockIterationManager.executeIterationSteps
        .mockResolvedValueOnce({ success: true, iteration: 0, result: { processed: 1 } })
        .mockRejectedValueOnce(new Error('Processing failed for item 2'))
        .mockResolvedValueOnce({ success: true, iteration: 1, result: { processed: 2 }, retried: true })
        .mockResolvedValueOnce({ success: true, iteration: 2, result: { processed: 3 } });

      mockIterationManager.handleIterationFailure.mockResolvedValue({
        action: 'retry',
        maxRetries: 3,
        retryDelay: 100
      });

      mockLoopConditionEvaluator.evaluateBreakCondition.mockResolvedValue(false);
      mockLoopConditionEvaluator.evaluateContinueCondition.mockResolvedValue(false);

      mockLoopController.finalizeLoop.mockResolvedValue({
        success: true,
        totalIterations: 3,
        results: [
          { success: true, iteration: 0, result: { processed: 1 } },
          { success: true, iteration: 1, result: { processed: 2 }, retried: true },
          { success: true, iteration: 2, result: { processed: 3 } }
        ],
        failures: 1,
        retries: 1
      });

      // Act
      const result = await loopEngine.executeWorkflow('loop-workflow-123');

      // Assert - Verify error handling and retry
      expect(mockIterationManager.handleIterationFailure).toHaveBeenCalledWith(
        1, // failed iteration
        expect.objectContaining({ message: 'Processing failed for item 2' }),
        expect.objectContaining({ retryStrategy: expect.any(Object) })
      );

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'loop.iteration.failed',
        expect.objectContaining({
          iteration: 1,
          error: expect.objectContaining({ message: 'Processing failed for item 2' })
        })
      );

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'loop.iteration.retry',
        expect.objectContaining({
          iteration: 1,
          attempt: 1
        })
      );

      expect(result.success).toBe(true);
      expect(result.loopResults?.retries).toBe(1);
    });

    it('should handle loop timeout with partial results', async () => {
      // Arrange
      mockWorkflowRepository.findById.mockResolvedValue(forLoopWorkflow);
      mockExecutionContext.getVariable.mockReturnValue([1, 2, 3, 4, 5]);

      mockLoopController.initializeLoop.mockResolvedValue({
        initialized: true,
        loopState: { type: 'for', totalIterations: 5 }
      });

      // First three iterations succeed, fourth times out
      mockIterationManager.executeIterationSteps
        .mockResolvedValueOnce({ success: true, iteration: 0, result: { processed: 1 }, executionTime: 100 })
        .mockResolvedValueOnce({ success: true, iteration: 1, result: { processed: 2 }, executionTime: 100 })
        .mockResolvedValueOnce({ success: true, iteration: 2, result: { processed: 3 }, executionTime: 100 })
        .mockRejectedValueOnce(new Error('Execution timeout'));

      mockLoopController.handleLoopError.mockResolvedValue({
        strategy: 'partial_results',
        completed: 3,
        failed: 1,
        remaining: 1
      });

      mockLoopController.finalizeLoop.mockResolvedValue({
        success: false,
        totalIterations: 5,
        completedIterations: 3,
        results: [
          { success: true, iteration: 0, result: { processed: 1 } },
          { success: true, iteration: 1, result: { processed: 2 } },
          { success: true, iteration: 2, result: { processed: 3 } }
        ],
        error: 'Loop terminated due to timeout',
        partialResults: true
      });

      // Act
      const result = await loopEngine.executeWorkflow('loop-workflow-123');

      // Assert - Verify timeout handling
      expect(mockLoopController.handleLoopError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Execution timeout' }),
        expect.objectContaining({ completedIterations: 3 })
      );

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'loop.timeout',
        expect.objectContaining({
          stepId: 'for-loop-step',
          completedIterations: 3,
          totalIterations: 5
        })
      );

      expect(result.success).toBe(false);
      expect(result.loopResults?.partialResults).toBe(true);
      expect(result.loopResults?.completedIterations).toBe(3);
    });
  });

  describe('Loop Performance and Optimization', () => {
    it('should collect loop execution metrics', async () => {
      // Arrange
      mockWorkflowRepository.findById.mockResolvedValue(forLoopWorkflow);
      mockExecutionContext.getVariable.mockReturnValue([1, 2, 3]);

      mockLoopController.initializeLoop.mockResolvedValue({
        initialized: true,
        loopState: { type: 'for', totalIterations: 3 }
      });

      mockIterationManager.executeIterationSteps.mockResolvedValue({
        success: true,
        iteration: 0,
        result: { processed: true },
        executionTime: 50
      });

      mockIterationManager.getIterationMetrics.mockReturnValue({
        averageExecutionTime: 50,
        minExecutionTime: 45,
        maxExecutionTime: 55,
        totalExecutionTime: 150,
        throughput: 20 // iterations per second
      });

      mockLoopController.finalizeLoop.mockResolvedValue({
        success: true,
        totalIterations: 3,
        results: [],
        metrics: {
          averageIterationTime: 50,
          totalExecutionTime: 150,
          throughput: 20
        }
      });

      // Act
      const result = await loopEngine.executeWorkflow('loop-workflow-123');

      // Assert - Verify metrics collection
      expect(mockIterationManager.getIterationMetrics).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'loop.metrics.collected',
        expect.objectContaining({
          stepId: 'for-loop-step',
          metrics: expect.objectContaining({
            averageIterationTime: 50,
            totalExecutionTime: 150,
            throughput: 20
          })
        })
      );

      expect(result.success).toBe(true);
      expect(result.loopResults?.metrics).toBeDefined();
    });
  });
});