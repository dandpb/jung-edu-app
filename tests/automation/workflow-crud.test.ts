import { jest } from '@jest/globals';
import { WorkflowService } from '../../src/services/WorkflowService';
import { WorkflowRepository } from '../../src/repositories/WorkflowRepository';
import { WorkflowValidator } from '../../src/validators/WorkflowValidator';
import { EventEmitter } from '../../src/events/EventEmitter';
import { Workflow, WorkflowStatus, WorkflowStep } from '../../src/types/Workflow';

// London School TDD - Mock-driven development
describe('Workflow CRUD Operations', () => {
  let workflowService: WorkflowService;
  let mockRepository: jest.Mocked<WorkflowRepository>;
  let mockValidator: jest.Mocked<WorkflowValidator>;
  let mockEventEmitter: jest.Mocked<EventEmitter>;

  const sampleWorkflow: Workflow = {
    id: 'workflow-123',
    name: 'Test Workflow',
    description: 'A test workflow for CRUD operations',
    status: WorkflowStatus.DRAFT,
    steps: [
      {
        id: 'step-1',
        name: 'Initialize',
        type: 'action',
        config: { action: 'initialize' },
        order: 1
      }
    ],
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    version: 1
  };

  beforeEach(() => {
    // Create mocks with proper typing
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      findByStatus: jest.fn(),
      getWorkflowHistory: jest.fn()
    } as jest.Mocked<WorkflowRepository>;

    mockValidator = {
      validateWorkflow: jest.fn(),
      validateStep: jest.fn(),
      validateWorkflowName: jest.fn(),
      validateStepOrder: jest.fn()
    } as jest.Mocked<WorkflowValidator>;

    mockEventEmitter = {
      emit: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      once: jest.fn()
    } as jest.Mocked<EventEmitter>;

    // Initialize service with mocked dependencies
    workflowService = new WorkflowService(
      mockRepository,
      mockValidator,
      mockEventEmitter
    );
  });

  describe('Create Workflow', () => {
    const workflowInput = {
      name: 'New Workflow',
      description: 'A new workflow',
      steps: [
        {
          name: 'First Step',
          type: 'action' as const,
          config: { action: 'start' },
          order: 1
        }
      ]
    };

    it('should create workflow with valid input', async () => {
      // Arrange
      const expectedWorkflow = { ...sampleWorkflow, ...workflowInput };
      mockValidator.validateWorkflow.mockResolvedValue({ valid: true, errors: [] });
      mockRepository.exists.mockResolvedValue(false);
      mockRepository.save.mockResolvedValue(expectedWorkflow);

      // Act
      const result = await workflowService.createWorkflow(workflowInput);

      // Assert - Verify interactions (London School focus)
      expect(mockValidator.validateWorkflow).toHaveBeenCalledWith(
        expect.objectContaining({
          name: workflowInput.name,
          description: workflowInput.description
        })
      );
      expect(mockRepository.exists).toHaveBeenCalledWith(workflowInput.name);
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: workflowInput.name,
          status: WorkflowStatus.DRAFT
        })
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'workflow.created',
        expect.objectContaining({ id: expectedWorkflow.id })
      );
      
      // Verify result
      expect(result.success).toBe(true);
      expect(result.workflow).toEqual(expectedWorkflow);
    });

    it('should reject workflow with invalid data', async () => {
      // Arrange
      const validationErrors = [{ field: 'name', message: 'Name is required' }];
      mockValidator.validateWorkflow.mockResolvedValue({
        valid: false,
        errors: validationErrors
      });

      // Act
      const result = await workflowService.createWorkflow(workflowInput);

      // Assert - Verify validation interaction
      expect(mockValidator.validateWorkflow).toHaveBeenCalledWith(
        expect.objectContaining(workflowInput)
      );
      expect(mockRepository.save).not.toHaveBeenCalled();
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
      
      expect(result.success).toBe(false);
      expect(result.errors).toEqual(validationErrors);
    });

    it('should reject workflow with duplicate name', async () => {
      // Arrange
      mockValidator.validateWorkflow.mockResolvedValue({ valid: true, errors: [] });
      mockRepository.exists.mockResolvedValue(true);

      // Act
      const result = await workflowService.createWorkflow(workflowInput);

      // Assert - Verify proper interaction sequence
      expect(mockValidator.validateWorkflow).toHaveBeenCalledBefore(
        mockRepository.exists as jest.Mock
      );
      expect(mockRepository.exists).toHaveBeenCalledWith(workflowInput.name);
      expect(mockRepository.save).not.toHaveBeenCalled();
      
      expect(result.success).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'name' })
      );
    });

    it('should handle repository save failures', async () => {
      // Arrange
      mockValidator.validateWorkflow.mockResolvedValue({ valid: true, errors: [] });
      mockRepository.exists.mockResolvedValue(false);
      mockRepository.save.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(workflowService.createWorkflow(workflowInput))
        .rejects.toThrow('Database connection failed');
      
      // Verify interactions occurred before failure
      expect(mockValidator.validateWorkflow).toHaveBeenCalled();
      expect(mockRepository.exists).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });
  });

  describe('Read Workflow', () => {
    it('should retrieve workflow by ID', async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(sampleWorkflow);

      // Act
      const result = await workflowService.getWorkflow('workflow-123');

      // Assert
      expect(mockRepository.findById).toHaveBeenCalledWith('workflow-123');
      expect(result).toEqual(sampleWorkflow);
    });

    it('should return null for non-existent workflow', async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(null);

      // Act
      const result = await workflowService.getWorkflow('non-existent');

      // Assert
      expect(mockRepository.findById).toHaveBeenCalledWith('non-existent');
      expect(result).toBeNull();
    });

    it('should retrieve all workflows with pagination', async () => {
      // Arrange
      const workflows = [sampleWorkflow];
      const pagination = { page: 1, limit: 10 };
      mockRepository.findAll.mockResolvedValue({
        workflows,
        total: 1,
        page: 1,
        totalPages: 1
      });

      // Act
      const result = await workflowService.getAllWorkflows(pagination);

      // Assert
      expect(mockRepository.findAll).toHaveBeenCalledWith(pagination);
      expect(result.workflows).toEqual(workflows);
      expect(result.total).toBe(1);
    });

    it('should filter workflows by status', async () => {
      // Arrange
      const activeWorkflows = [{ ...sampleWorkflow, status: WorkflowStatus.ACTIVE }];
      mockRepository.findByStatus.mockResolvedValue(activeWorkflows);

      // Act
      const result = await workflowService.getWorkflowsByStatus(WorkflowStatus.ACTIVE);

      // Assert
      expect(mockRepository.findByStatus).toHaveBeenCalledWith(WorkflowStatus.ACTIVE);
      expect(result).toEqual(activeWorkflows);
    });
  });

  describe('Update Workflow', () => {
    const updateData = {
      name: 'Updated Workflow',
      description: 'Updated description',
      steps: [
        {
          id: 'step-1',
          name: 'Updated Step',
          type: 'action' as const,
          config: { action: 'updated_action' },
          order: 1
        }
      ]
    };

    it('should update workflow successfully', async () => {
      // Arrange
      const updatedWorkflow = { ...sampleWorkflow, ...updateData };
      mockRepository.findById.mockResolvedValue(sampleWorkflow);
      mockValidator.validateWorkflow.mockResolvedValue({ valid: true, errors: [] });
      mockRepository.update.mockResolvedValue(updatedWorkflow);

      // Act
      const result = await workflowService.updateWorkflow('workflow-123', updateData);

      // Assert - Verify interaction sequence
      expect(mockRepository.findById).toHaveBeenCalledWith('workflow-123');
      expect(mockValidator.validateWorkflow).toHaveBeenCalledWith(
        expect.objectContaining(updateData)
      );
      expect(mockRepository.update).toHaveBeenCalledWith(
        'workflow-123',
        expect.objectContaining({
          ...updateData,
          updatedAt: expect.any(Date),
          version: sampleWorkflow.version + 1
        })
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'workflow.updated',
        expect.objectContaining({ id: 'workflow-123' })
      );

      expect(result.success).toBe(true);
      expect(result.workflow).toEqual(updatedWorkflow);
    });

    it('should reject update for non-existent workflow', async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(null);

      // Act
      const result = await workflowService.updateWorkflow('non-existent', updateData);

      // Assert
      expect(mockRepository.findById).toHaveBeenCalledWith('non-existent');
      expect(mockValidator.validateWorkflow).not.toHaveBeenCalled();
      expect(mockRepository.update).not.toHaveBeenCalled();
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Workflow not found');
    });

    it('should reject update with invalid data', async () => {
      // Arrange
      const validationErrors = [{ field: 'steps', message: 'At least one step required' }];
      mockRepository.findById.mockResolvedValue(sampleWorkflow);
      mockValidator.validateWorkflow.mockResolvedValue({
        valid: false,
        errors: validationErrors
      });

      // Act
      const result = await workflowService.updateWorkflow('workflow-123', updateData);

      // Assert
      expect(mockRepository.findById).toHaveBeenCalledWith('workflow-123');
      expect(mockValidator.validateWorkflow).toHaveBeenCalled();
      expect(mockRepository.update).not.toHaveBeenCalled();
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();

      expect(result.success).toBe(false);
      expect(result.errors).toEqual(validationErrors);
    });

    it('should prevent update of active workflow', async () => {
      // Arrange
      const activeWorkflow = { ...sampleWorkflow, status: WorkflowStatus.RUNNING };
      mockRepository.findById.mockResolvedValue(activeWorkflow);

      // Act
      const result = await workflowService.updateWorkflow('workflow-123', updateData);

      // Assert
      expect(mockRepository.findById).toHaveBeenCalledWith('workflow-123');
      expect(mockValidator.validateWorkflow).not.toHaveBeenCalled();
      expect(mockRepository.update).not.toHaveBeenCalled();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot update running workflow');
    });
  });

  describe('Delete Workflow', () => {
    it('should delete workflow successfully', async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(sampleWorkflow);
      mockRepository.delete.mockResolvedValue(true);

      // Act
      const result = await workflowService.deleteWorkflow('workflow-123');

      // Assert
      expect(mockRepository.findById).toHaveBeenCalledWith('workflow-123');
      expect(mockRepository.delete).toHaveBeenCalledWith('workflow-123');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'workflow.deleted',
        expect.objectContaining({ id: 'workflow-123' })
      );

      expect(result.success).toBe(true);
    });

    it('should reject deletion of non-existent workflow', async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(null);

      // Act
      const result = await workflowService.deleteWorkflow('non-existent');

      // Assert
      expect(mockRepository.findById).toHaveBeenCalledWith('non-existent');
      expect(mockRepository.delete).not.toHaveBeenCalled();
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Workflow not found');
    });

    it('should prevent deletion of running workflow', async () => {
      // Arrange
      const runningWorkflow = { ...sampleWorkflow, status: WorkflowStatus.RUNNING };
      mockRepository.findById.mockResolvedValue(runningWorkflow);

      // Act
      const result = await workflowService.deleteWorkflow('workflow-123');

      // Assert
      expect(mockRepository.findById).toHaveBeenCalledWith('workflow-123');
      expect(mockRepository.delete).not.toHaveBeenCalled();
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot delete running workflow');
    });

    it('should handle repository delete failures', async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(sampleWorkflow);
      mockRepository.delete.mockRejectedValue(new Error('Foreign key constraint'));

      // Act & Assert
      await expect(workflowService.deleteWorkflow('workflow-123'))
        .rejects.toThrow('Foreign key constraint');

      expect(mockRepository.findById).toHaveBeenCalledWith('workflow-123');
      expect(mockRepository.delete).toHaveBeenCalledWith('workflow-123');
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });
  });

  describe('Workflow Collaboration Patterns', () => {
    it('should coordinate workflow creation with multiple services', async () => {
      // Arrange
      const workflowInput = {
        name: 'Complex Workflow',
        description: 'Multi-service workflow',
        steps: []
      };

      mockValidator.validateWorkflow.mockResolvedValue({ valid: true, errors: [] });
      mockRepository.exists.mockResolvedValue(false);
      mockRepository.save.mockResolvedValue({ ...sampleWorkflow, ...workflowInput });

      // Act
      const result = await workflowService.createWorkflow(workflowInput);

      // Assert - Verify service collaboration sequence
      const allCalls = jest.getAllMockCalls();
      expect(allCalls).toEqual([
        ['mockValidator.validateWorkflow', [expect.objectContaining(workflowInput)]],
        ['mockRepository.exists', [workflowInput.name]],
        ['mockRepository.save', [expect.objectContaining(workflowInput)]],
        ['mockEventEmitter.emit', ['workflow.created', expect.any(Object)]]
      ]);
    });

    it('should handle concurrent workflow operations', async () => {
      // Arrange
      const workflow1 = { ...workflowInput, name: 'Workflow 1' };
      const workflow2 = { ...workflowInput, name: 'Workflow 2' };

      mockValidator.validateWorkflow.mockResolvedValue({ valid: true, errors: [] });
      mockRepository.exists.mockResolvedValue(false);
      mockRepository.save
        .mockResolvedValueOnce({ ...sampleWorkflow, name: 'Workflow 1' })
        .mockResolvedValueOnce({ ...sampleWorkflow, name: 'Workflow 2' });

      // Act
      const [result1, result2] = await Promise.all([
        workflowService.createWorkflow(workflow1),
        workflowService.createWorkflow(workflow2)
      ]);

      // Assert
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(mockRepository.save).toHaveBeenCalledTimes(2);
      expect(mockEventEmitter.emit).toHaveBeenCalledTimes(2);
    });
  });
});