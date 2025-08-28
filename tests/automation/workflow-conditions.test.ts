import { jest } from '@jest/globals';
import { ConditionalExecutionEngine } from '../../src/engines/ConditionalExecutionEngine';
import { WorkflowRepository } from '../../src/repositories/WorkflowRepository';
import { ConditionEvaluator } from '../../src/evaluators/ConditionEvaluator';
import { ExecutionContext } from '../../src/contexts/ExecutionContext';
import { StepExecutor } from '../../src/executors/StepExecutor';
import { BranchNavigator } from '../../src/navigators/BranchNavigator';
import { EventEmitter } from '../../src/events/EventEmitter';
import {
  Workflow,
  WorkflowStep,
  ConditionalStep,
  ConditionalBranch,
  ConditionResult,
  BranchExecutionResult
} from '../../src/types/Workflow';

// London School TDD - Focus on conditional logic behavior
describe('Workflow Conditional Logic', () => {
  let conditionalEngine: ConditionalExecutionEngine;
  let mockWorkflowRepository: jest.Mocked<WorkflowRepository>;
  let mockConditionEvaluator: jest.Mocked<ConditionEvaluator>;
  let mockExecutionContext: jest.Mocked<ExecutionContext>;
  let mockStepExecutor: jest.Mocked<StepExecutor>;
  let mockBranchNavigator: jest.Mocked<BranchNavigator>;
  let mockEventEmitter: jest.Mocked<EventEmitter>;

  const conditionalWorkflow: Workflow = {
    id: 'conditional-workflow-123',
    name: 'Conditional Logic Workflow',
    description: 'Workflow with conditional branching',
    status: 'active',
    steps: [
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
            operator: 'gt',
            operands: [
              { type: 'variable', value: 'input.value' },
              { type: 'literal', value: 10 }
            ]
          },
          branches: [
            {
              id: 'true-branch',
              condition: true,
              steps: [
                {
                  id: 'high-value-processing',
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
                  id: 'low-value-processing',
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
      },
      {
        id: 'final-step',
        name: 'Final Processing',
        type: 'action',
        config: { action: 'finalize' },
        order: 3,
        dependsOn: ['condition-step']
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

    mockConditionEvaluator = {
      evaluate: jest.fn(),
      validateCondition: jest.fn(),
      parseExpression: jest.fn(),
      buildContext: jest.fn(),
      getAvailableOperators: jest.fn(),
      evaluateComplex: jest.fn()
    } as jest.Mocked<ConditionEvaluator>;

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

    mockBranchNavigator = {
      navigateBranch: jest.fn(),
      evaluateBranchConditions: jest.fn(),
      selectBranch: jest.fn(),
      mergeBranchResults: jest.fn(),
      validateBranchStructure: jest.fn()
    } as jest.Mocked<BranchNavigator>;

    mockEventEmitter = {
      emit: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      once: jest.fn()
    } as jest.Mocked<EventEmitter>;

    conditionalEngine = new ConditionalExecutionEngine(
      mockWorkflowRepository,
      mockConditionEvaluator,
      mockExecutionContext,
      mockStepExecutor,
      mockBranchNavigator,
      mockEventEmitter
    );
  });

  describe('Condition Evaluation', () => {
    it('should evaluate simple conditions and select appropriate branch', async () => {
      // Arrange
      mockWorkflowRepository.findById.mockResolvedValue(conditionalWorkflow);
      mockExecutionContext.getVariable.mockReturnValue(15); // input.value = 15

      mockConditionEvaluator.evaluate.mockResolvedValue({
        result: true,
        expression: 'input.value > 10',
        evaluatedValue: 15,
        comparisonValue: 10,
        operator: 'gt'
      } as ConditionResult);

      mockBranchNavigator.selectBranch.mockResolvedValue({
        selectedBranch: 'true-branch',
        reason: 'Condition evaluated to true'
      });

      mockStepExecutor.canExecute.mockResolvedValue(true);
      mockStepExecutor.execute.mockResolvedValue({
        success: true,
        result: { processed: 'high-value' },
        executionTime: 100
      });

      mockBranchNavigator.navigateBranch.mockResolvedValue({
        success: true,
        branchId: 'true-branch',
        executedSteps: ['high-value-processing'],
        results: { processed: 'high-value' },
        executionTime: 100
      } as BranchExecutionResult);

      // Act
      const result = await conditionalEngine.executeWorkflow('conditional-workflow-123');

      // Assert - Verify condition evaluation interactions
      expect(mockConditionEvaluator.evaluate).toHaveBeenCalledWith(
        expect.objectContaining({
          expression: 'input.value > 10',
          operator: 'gt'
        }),
        mockExecutionContext
      );

      expect(mockBranchNavigator.selectBranch).toHaveBeenCalledWith(
        expect.objectContaining({
          condition: true,
          evaluationResult: expect.objectContaining({ result: true })
        }),
        expect.any(Array) // available branches
      );

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'condition.evaluated',
        expect.objectContaining({
          stepId: 'condition-step',
          condition: expect.objectContaining({ result: true }),
          selectedBranch: 'true-branch'
        })
      );

      expect(result.success).toBe(true);
      expect(result.branchExecutions).toContainEqual(
        expect.objectContaining({ branchId: 'true-branch' })
      );
    });

    it('should handle complex conditional expressions with multiple operands', async () => {
      // Arrange
      const complexConditionalWorkflow = {
        ...conditionalWorkflow,
        steps: [
          {
            id: 'complex-condition',
            name: 'Complex Condition Check',
            type: 'conditional',
            config: {
              condition: {
                expression: '(input.value > 10 AND input.type === "premium") OR input.priority === "high"',
                operator: 'complex',
                operands: [
                  {
                    type: 'logical',
                    operator: 'AND',
                    left: { type: 'variable', value: 'input.value', operator: 'gt', comparison: 10 },
                    right: { type: 'variable', value: 'input.type', operator: 'eq', comparison: 'premium' }
                  },
                  {
                    type: 'logical',
                    operator: 'OR',
                    operand: { type: 'variable', value: 'input.priority', operator: 'eq', comparison: 'high' }
                  }
                ]
              },
              branches: [
                { id: 'premium-branch', condition: true, steps: [] },
                { id: 'standard-branch', condition: false, steps: [] }
              ]
            },
            order: 1
          }
        ]
      };

      mockWorkflowRepository.findById.mockResolvedValue(complexConditionalWorkflow);
      mockExecutionContext.getVariable
        .mockReturnValueOnce(15) // input.value
        .mockReturnValueOnce('premium') // input.type
        .mockReturnValueOnce('normal'); // input.priority

      mockConditionEvaluator.evaluateComplex.mockResolvedValue({
        result: true,
        expression: '(input.value > 10 AND input.type === "premium") OR input.priority === "high"',
        subResults: [
          { result: true, expression: 'input.value > 10' },
          { result: true, expression: 'input.type === "premium"' },
          { result: false, expression: 'input.priority === "high"' }
        ],
        finalResult: true // (true AND true) OR false = true
      });

      mockBranchNavigator.selectBranch.mockResolvedValue({
        selectedBranch: 'premium-branch',
        reason: 'Complex condition evaluated to true'
      });

      // Act
      await conditionalEngine.executeWorkflow('conditional-workflow-123');

      // Assert - Verify complex condition evaluation
      expect(mockConditionEvaluator.evaluateComplex).toHaveBeenCalledWith(
        expect.objectContaining({
          expression: expect.stringContaining('AND'),
          operator: 'complex',
          operands: expect.arrayContaining([
            expect.objectContaining({ type: 'logical', operator: 'AND' }),
            expect.objectContaining({ type: 'logical', operator: 'OR' })
          ])
        }),
        mockExecutionContext
      );

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'complex.condition.evaluated',
        expect.objectContaining({
          expression: expect.stringContaining('AND'),
          subResults: expect.arrayContaining([
            expect.objectContaining({ result: true }),
            expect.objectContaining({ result: true }),
            expect.objectContaining({ result: false })
          ]),
          finalResult: true
        })
      );
    });

    it('should validate conditions before evaluation', async () => {
      // Arrange
      mockWorkflowRepository.findById.mockResolvedValue(conditionalWorkflow);
      mockConditionEvaluator.validateCondition.mockResolvedValue({
        valid: false,
        errors: [
          { field: 'operand', message: 'Variable input.unknownField does not exist' }
        ]
      });

      // Act
      const result = await conditionalEngine.executeWorkflow('conditional-workflow-123');

      // Assert - Verify validation interaction
      expect(mockConditionEvaluator.validateCondition).toHaveBeenCalledWith(
        expect.objectContaining({
          expression: 'input.value > 10'
        }),
        mockExecutionContext
      );

      expect(mockConditionEvaluator.evaluate).not.toHaveBeenCalled();
      expect(mockBranchNavigator.selectBranch).not.toHaveBeenCalled();

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'condition.validation.failed',
        expect.objectContaining({
          stepId: 'condition-step',
          errors: expect.arrayContaining([
            expect.objectContaining({ message: expect.stringContaining('does not exist') })
          ])
        })
      );

      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ message: expect.stringContaining('does not exist') })
      );
    });
  });

  describe('Branch Navigation', () => {
    it('should navigate and execute selected branch steps', async () => {
      // Arrange
      mockWorkflowRepository.findById.mockResolvedValue(conditionalWorkflow);
      mockConditionEvaluator.evaluate.mockResolvedValue({ result: false });
      mockBranchNavigator.selectBranch.mockResolvedValue({
        selectedBranch: 'false-branch',
        reason: 'Condition evaluated to false'
      });

      const branchSteps = [
        {
          id: 'low-value-processing',
          name: 'Process Low Value',
          type: 'action',
          config: { action: 'processLowValue' }
        }
      ];

      mockBranchNavigator.navigateBranch.mockResolvedValue({
        success: true,
        branchId: 'false-branch',
        executedSteps: ['low-value-processing'],
        results: { processed: 'low-value' },
        executionTime: 75
      });

      mockStepExecutor.execute.mockResolvedValue({
        success: true,
        result: { processed: 'low-value' },
        executionTime: 75
      });

      // Act
      const result = await conditionalEngine.executeWorkflow('conditional-workflow-123');

      // Assert - Verify branch navigation interactions
      expect(mockBranchNavigator.navigateBranch).toHaveBeenCalledWith(
        'false-branch',
        branchSteps,
        mockExecutionContext,
        mockStepExecutor
      );

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'branch.navigation.started',
        expect.objectContaining({
          branchId: 'false-branch',
          stepCount: 1
        })
      );

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'branch.navigation.completed',
        expect.objectContaining({
          branchId: 'false-branch',
          executedSteps: ['low-value-processing'],
          success: true
        })
      );

      expect(result.success).toBe(true);
      expect(result.branchExecutions).toContainEqual(
        expect.objectContaining({
          branchId: 'false-branch',
          success: true
        })
      );
    });

    it('should handle multiple conditional branches in sequence', async () => {
      // Arrange
      const multiConditionalWorkflow = {
        ...conditionalWorkflow,
        steps: [
          {
            id: 'first-condition',
            name: 'First Condition',
            type: 'conditional',
            config: {
              condition: { expression: 'step1.result === "success"' },
              branches: [
                { id: 'first-true', condition: true, steps: [{ id: 'step-a', name: 'Step A', type: 'action' }] },
                { id: 'first-false', condition: false, steps: [{ id: 'step-b', name: 'Step B', type: 'action' }] }
              ]
            },
            order: 1
          },
          {
            id: 'second-condition',
            name: 'Second Condition',
            type: 'conditional',
            config: {
              condition: { expression: 'previousBranch.output > 5' },
              branches: [
                { id: 'second-true', condition: true, steps: [{ id: 'step-c', name: 'Step C', type: 'action' }] },
                { id: 'second-false', condition: false, steps: [{ id: 'step-d', name: 'Step D', type: 'action' }] }
              ]
            },
            order: 2,
            dependsOn: ['first-condition']
          }
        ]
      };

      mockWorkflowRepository.findById.mockResolvedValue(multiConditionalWorkflow);
      
      // First condition evaluates to true
      mockConditionEvaluator.evaluate
        .mockResolvedValueOnce({ result: true, expression: 'step1.result === "success"' })
        .mockResolvedValueOnce({ result: false, expression: 'previousBranch.output > 5' });

      mockBranchNavigator.selectBranch
        .mockResolvedValueOnce({ selectedBranch: 'first-true' })
        .mockResolvedValueOnce({ selectedBranch: 'second-false' });

      mockBranchNavigator.navigateBranch
        .mockResolvedValueOnce({
          success: true,
          branchId: 'first-true',
          executedSteps: ['step-a'],
          results: { output: 3 }, // This affects next condition
          executionTime: 50
        })
        .mockResolvedValueOnce({
          success: true,
          branchId: 'second-false',
          executedSteps: ['step-d'],
          results: { final: 'result' },
          executionTime: 40
        });

      // Act
      const result = await conditionalEngine.executeWorkflow('conditional-workflow-123');

      // Assert - Verify sequential conditional execution
      expect(mockConditionEvaluator.evaluate).toHaveBeenCalledTimes(2);
      expect(mockBranchNavigator.navigateBranch).toHaveBeenCalledTimes(2);

      // Verify execution order
      const navigationCalls = mockBranchNavigator.navigateBranch.mock.calls;
      expect(navigationCalls[0][0]).toBe('first-true');
      expect(navigationCalls[1][0]).toBe('second-false');

      // Verify context updates between conditions
      expect(mockExecutionContext.setVariable).toHaveBeenCalledWith(
        expect.stringContaining('previousBranch'),
        expect.objectContaining({ output: 3 })
      );

      expect(result.success).toBe(true);
      expect(result.branchExecutions).toHaveLength(2);
    });
  });

  describe('Nested Conditional Logic', () => {
    it('should handle nested conditions within branches', async () => {
      // Arrange
      const nestedConditionalWorkflow = {
        ...conditionalWorkflow,
        steps: [
          {
            id: 'outer-condition',
            name: 'Outer Condition',
            type: 'conditional',
            config: {
              condition: { expression: 'user.role === "admin"' },
              branches: [
                {
                  id: 'admin-branch',
                  condition: true,
                  steps: [
                    {
                      id: 'admin-check',
                      name: 'Admin Privileges Check',
                      type: 'action',
                      config: { action: 'checkAdminPrivileges' }
                    },
                    {
                      id: 'nested-condition',
                      name: 'Permission Level Check',
                      type: 'conditional',
                      config: {
                        condition: { expression: 'admin.permissions.level >= 5' },
                        branches: [
                          { id: 'high-permission', condition: true, steps: [{ id: 'grant-access', name: 'Grant Full Access' }] },
                          { id: 'low-permission', condition: false, steps: [{ id: 'limited-access', name: 'Grant Limited Access' }] }
                        ]
                      }
                    }
                  ]
                },
                {
                  id: 'user-branch',
                  condition: false,
                  steps: [{ id: 'user-access', name: 'Standard User Access' }]
                }
              ]
            },
            order: 1
          }
        ]
      };

      mockWorkflowRepository.findById.mockResolvedValue(nestedConditionalWorkflow);
      mockExecutionContext.getVariable
        .mockReturnValueOnce('admin') // user.role
        .mockReturnValueOnce(7); // admin.permissions.level

      // Outer condition: user is admin
      mockConditionEvaluator.evaluate
        .mockResolvedValueOnce({ result: true, expression: 'user.role === "admin"' })
        .mockResolvedValueOnce({ result: true, expression: 'admin.permissions.level >= 5' });

      mockBranchNavigator.selectBranch
        .mockResolvedValueOnce({ selectedBranch: 'admin-branch' })
        .mockResolvedValueOnce({ selectedBranch: 'high-permission' });

      // Mock nested navigation
      mockBranchNavigator.navigateBranch
        .mockImplementationOnce(async (branchId, steps, context, executor) => {
          // Simulate executing nested conditional within admin branch
          if (branchId === 'admin-branch') {
            // Execute admin-check first
            await executor.execute(steps[0], context);
            // Then handle nested conditional (this would recursively call conditionalEngine)
            return {
              success: true,
              branchId: 'admin-branch',
              executedSteps: ['admin-check', 'nested-condition'],
              results: { accessLevel: 'full' },
              executionTime: 120,
              nestedResults: [
                {
                  branchId: 'high-permission',
                  executedSteps: ['grant-access'],
                  results: { granted: 'full-access' }
                }
              ]
            };
          }
          return { success: true, branchId, executedSteps: [], results: {}, executionTime: 0 };
        });

      mockStepExecutor.execute.mockResolvedValue({
        success: true,
        result: { privileges: 'verified' },
        executionTime: 50
      });

      // Act
      const result = await conditionalEngine.executeWorkflow('conditional-workflow-123');

      // Assert - Verify nested conditional handling
      expect(mockConditionEvaluator.evaluate).toHaveBeenCalledTimes(2);
      expect(mockBranchNavigator.navigateBranch).toHaveBeenCalledWith(
        'admin-branch',
        expect.arrayContaining([
          expect.objectContaining({ id: 'admin-check' }),
          expect.objectContaining({ id: 'nested-condition', type: 'conditional' })
        ]),
        mockExecutionContext,
        mockStepExecutor
      );

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'nested.condition.executed',
        expect.objectContaining({
          parentBranch: 'admin-branch',
          nestedBranch: 'high-permission',
          depth: 1
        })
      );

      expect(result.success).toBe(true);
      expect(result.branchExecutions[0].nestedResults).toBeDefined();
    });
  });

  describe('Conditional Error Handling', () => {
    it('should handle condition evaluation errors gracefully', async () => {
      // Arrange
      mockWorkflowRepository.findById.mockResolvedValue(conditionalWorkflow);
      mockConditionEvaluator.evaluate.mockRejectedValue(
        new Error('Variable input.value is undefined')
      );

      // Act
      const result = await conditionalEngine.executeWorkflow('conditional-workflow-123');

      // Assert - Verify error handling interactions
      expect(mockConditionEvaluator.evaluate).toHaveBeenCalled();
      expect(mockBranchNavigator.selectBranch).not.toHaveBeenCalled();
      expect(mockBranchNavigator.navigateBranch).not.toHaveBeenCalled();

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'condition.evaluation.error',
        expect.objectContaining({
          stepId: 'condition-step',
          error: expect.objectContaining({
            message: 'Variable input.value is undefined'
          })
        })
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Variable input.value is undefined');
    });

    it('should handle branch execution failures with fallback strategies', async () => {
      // Arrange
      mockWorkflowRepository.findById.mockResolvedValue(conditionalWorkflow);
      mockConditionEvaluator.evaluate.mockResolvedValue({ result: true });
      mockBranchNavigator.selectBranch.mockResolvedValue({ selectedBranch: 'true-branch' });
      mockBranchNavigator.navigateBranch.mockResolvedValue({
        success: false,
        branchId: 'true-branch',
        error: new Error('Step execution failed'),
        executionTime: 50
      });

      // Mock fallback strategy
      mockBranchNavigator.selectBranch.mockResolvedValueOnce({ selectedBranch: 'false-branch' });
      mockBranchNavigator.navigateBranch.mockResolvedValueOnce({
        success: true,
        branchId: 'false-branch',
        executedSteps: ['low-value-processing'],
        results: { fallback: 'executed' },
        executionTime: 30
      });

      // Act
      const result = await conditionalEngine.executeWorkflow('conditional-workflow-123');

      // Assert - Verify fallback handling
      expect(mockBranchNavigator.navigateBranch).toHaveBeenCalledTimes(2);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'branch.execution.failed',
        expect.objectContaining({
          branchId: 'true-branch',
          error: expect.objectContaining({ message: 'Step execution failed' })
        })
      );

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'branch.fallback.executed',
        expect.objectContaining({
          originalBranch: 'true-branch',
          fallbackBranch: 'false-branch'
        })
      );

      expect(result.success).toBe(true);
      expect(result.fallbackExecuted).toBe(true);
    });
  });
});