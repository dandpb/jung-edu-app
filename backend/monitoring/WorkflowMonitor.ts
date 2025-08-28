import { EventEmitter } from 'events';
import { MonitoringService } from './MonitoringService';

export interface WorkflowExecution {
  id: string;
  name: string;
  type: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'timeout';
  steps: WorkflowStep[];
  metadata: Record<string, any>;
  error?: Error;
  metrics: WorkflowMetrics;
}

export interface WorkflowStep {
  id: string;
  name: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  input?: any;
  output?: any;
  error?: Error;
  retries: number;
  maxRetries: number;
}

export interface WorkflowMetrics {
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  skippedSteps: number;
  averageStepDuration: number;
  resourceUsage: {
    cpu: number;
    memory: number;
    io: number;
  };
}

export class WorkflowMonitor extends EventEmitter {
  private monitoringService: MonitoringService;
  private activeExecutions: Map<string, WorkflowExecution> = new Map();
  private completedExecutions: WorkflowExecution[] = [];
  private maxCompletedExecutions: number = 1000;

  constructor(monitoringService: MonitoringService) {
    super();
    this.monitoringService = monitoringService;
  }

  // Start monitoring a workflow execution
  startWorkflow(
    id: string, 
    name: string, 
    type: string, 
    metadata: Record<string, any> = {}
  ): WorkflowExecution {
    const execution: WorkflowExecution = {
      id,
      name,
      type,
      startTime: new Date(),
      status: 'running',
      steps: [],
      metadata,
      metrics: {
        totalSteps: 0,
        completedSteps: 0,
        failedSteps: 0,
        skippedSteps: 0,
        averageStepDuration: 0,
        resourceUsage: {
          cpu: 0,
          memory: 0,
          io: 0,
        },
      },
    };

    this.activeExecutions.set(id, execution);
    
    // Start tracing
    this.monitoringService.traceWorkflow(
      `workflow.${type}`,
      id,
      () => this.waitForWorkflowCompletion(id)
    );

    // Log workflow start
    this.monitoringService.logWorkflow(id, 'started', 'running', {
      workflow_name: name,
      workflow_type: type,
      metadata,
    });

    this.emit('workflow_started', execution);
    return execution;
  }

  // Add a step to workflow
  addStep(
    workflowId: string,
    stepId: string,
    stepName: string,
    maxRetries: number = 0
  ): WorkflowStep | null {
    const execution = this.activeExecutions.get(workflowId);
    if (!execution) {
      return null;
    }

    const step: WorkflowStep = {
      id: stepId,
      name: stepName,
      startTime: new Date(),
      status: 'pending',
      retries: 0,
      maxRetries,
    };

    execution.steps.push(step);
    execution.metrics.totalSteps++;

    this.emit('step_added', { workflowId, step });
    return step;
  }

  // Start executing a step
  startStep(workflowId: string, stepId: string, input?: any): boolean {
    const execution = this.activeExecutions.get(workflowId);
    if (!execution) {
      return false;
    }

    const step = execution.steps.find(s => s.id === stepId);
    if (!step) {
      return false;
    }

    step.status = 'running';
    step.startTime = new Date();
    step.input = input;

    // Log step start
    this.monitoringService.logWorkflow(
      workflowId, 
      `step_started:${stepId}`, 
      'running',
      {
        step_name: step.name,
        step_input: input,
        retry_count: step.retries,
      }
    );

    this.emit('step_started', { workflowId, stepId, step });
    return true;
  }

  // Complete a step successfully
  completeStep(workflowId: string, stepId: string, output?: any): boolean {
    const execution = this.activeExecutions.get(workflowId);
    if (!execution) {
      return false;
    }

    const step = execution.steps.find(s => s.id === stepId);
    if (!step) {
      return false;
    }

    step.status = 'completed';
    step.endTime = new Date();
    step.duration = step.endTime.getTime() - step.startTime.getTime();
    step.output = output;

    // Update metrics
    execution.metrics.completedSteps++;
    this.updateAverageStepDuration(execution);

    // Log step completion
    this.monitoringService.logWorkflow(
      workflowId, 
      `step_completed:${stepId}`, 
      'completed',
      {
        step_name: step.name,
        step_duration: step.duration,
        step_output: output,
      }
    );

    this.emit('step_completed', { workflowId, stepId, step });

    // Check if workflow is complete
    this.checkWorkflowCompletion(workflowId);
    return true;
  }

  // Fail a step
  failStep(workflowId: string, stepId: string, error: Error): boolean {
    const execution = this.activeExecutions.get(workflowId);
    if (!execution) {
      return false;
    }

    const step = execution.steps.find(s => s.id === stepId);
    if (!step) {
      return false;
    }

    step.error = error;
    step.endTime = new Date();
    step.duration = step.endTime.getTime() - step.startTime.getTime();

    // Check for retries
    if (step.retries < step.maxRetries) {
      step.retries++;
      step.status = 'pending';
      step.startTime = new Date();
      
      this.monitoringService.logWorkflow(
        workflowId,
        `step_retry:${stepId}`,
        'retry',
        {
          step_name: step.name,
          retry_count: step.retries,
          error_message: error.message,
        }
      );

      this.emit('step_retry', { workflowId, stepId, step, error });
      return true;
    }

    // No more retries, mark as failed
    step.status = 'failed';
    execution.metrics.failedSteps++;

    // Record error
    this.monitoringService.recordError(`workflow_step_failure`, 'high');

    // Log step failure
    this.monitoringService.logWorkflow(
      workflowId,
      `step_failed:${stepId}`,
      'failed',
      {
        step_name: step.name,
        error_message: error.message,
        error_stack: error.stack,
        retry_count: step.retries,
      }
    );

    this.emit('step_failed', { workflowId, stepId, step, error });

    // Check if workflow should be marked as failed
    this.checkWorkflowCompletion(workflowId);
    return true;
  }

  // Skip a step
  skipStep(workflowId: string, stepId: string, reason: string): boolean {
    const execution = this.activeExecutions.get(workflowId);
    if (!execution) {
      return false;
    }

    const step = execution.steps.find(s => s.id === stepId);
    if (!step) {
      return false;
    }

    step.status = 'skipped';
    step.endTime = new Date();
    step.duration = step.endTime.getTime() - step.startTime.getTime();

    execution.metrics.skippedSteps++;

    // Log step skip
    this.monitoringService.logWorkflow(
      workflowId,
      `step_skipped:${stepId}`,
      'skipped',
      {
        step_name: step.name,
        skip_reason: reason,
      }
    );

    this.emit('step_skipped', { workflowId, stepId, step, reason });

    // Check workflow completion
    this.checkWorkflowCompletion(workflowId);
    return true;
  }

  // Update resource usage for workflow
  updateResourceUsage(workflowId: string, usage: { cpu?: number; memory?: number; io?: number }): void {
    const execution = this.activeExecutions.get(workflowId);
    if (!execution) {
      return;
    }

    if (usage.cpu !== undefined) {
      execution.metrics.resourceUsage.cpu = usage.cpu;
    }
    if (usage.memory !== undefined) {
      execution.metrics.resourceUsage.memory = usage.memory;
    }
    if (usage.io !== undefined) {
      execution.metrics.resourceUsage.io = usage.io;
    }

    this.emit('resource_usage_updated', { workflowId, usage });
  }

  // Check if workflow is complete
  private checkWorkflowCompletion(workflowId: string): void {
    const execution = this.activeExecutions.get(workflowId);
    if (!execution) {
      return;
    }

    const pendingSteps = execution.steps.filter(step => 
      step.status === 'pending' || step.status === 'running'
    );

    if (pendingSteps.length === 0) {
      // All steps are done, determine final status
      const failedSteps = execution.steps.filter(step => step.status === 'failed');
      
      if (failedSteps.length > 0) {
        this.failWorkflow(workflowId, new Error(`Workflow failed with ${failedSteps.length} failed steps`));
      } else {
        this.completeWorkflow(workflowId);
      }
    }
  }

  // Complete workflow successfully
  private completeWorkflow(workflowId: string): void {
    const execution = this.activeExecutions.get(workflowId);
    if (!execution) {
      return;
    }

    execution.status = 'completed';
    execution.endTime = new Date();
    execution.duration = execution.endTime.getTime() - execution.startTime.getTime();

    // Record metrics
    this.monitoringService.recordWorkflowMetric(execution.type, 'success', execution.duration);

    // Log completion
    this.monitoringService.logWorkflow(
      workflowId,
      'completed',
      'completed',
      {
        total_duration: execution.duration,
        total_steps: execution.metrics.totalSteps,
        completed_steps: execution.metrics.completedSteps,
        failed_steps: execution.metrics.failedSteps,
        skipped_steps: execution.metrics.skippedSteps,
        average_step_duration: execution.metrics.averageStepDuration,
      }
    );

    this.moveToCompleted(execution);
    this.emit('workflow_completed', execution);
  }

  // Fail workflow
  private failWorkflow(workflowId: string, error: Error): void {
    const execution = this.activeExecutions.get(workflowId);
    if (!execution) {
      return;
    }

    execution.status = 'failed';
    execution.endTime = new Date();
    execution.duration = execution.endTime.getTime() - execution.startTime.getTime();
    execution.error = error;

    // Record metrics
    this.monitoringService.recordWorkflowMetric(execution.type, 'failure', execution.duration);
    this.monitoringService.recordError('workflow_failure', 'critical');

    // Log failure
    this.monitoringService.logWorkflow(
      workflowId,
      'failed',
      'failed',
      {
        total_duration: execution.duration,
        error_message: error.message,
        error_stack: error.stack,
        completed_steps: execution.metrics.completedSteps,
        failed_steps: execution.metrics.failedSteps,
      }
    );

    this.moveToCompleted(execution);
    this.emit('workflow_failed', { execution, error });
  }

  // Timeout workflow
  timeoutWorkflow(workflowId: string): void {
    const execution = this.activeExecutions.get(workflowId);
    if (!execution) {
      return;
    }

    execution.status = 'timeout';
    execution.endTime = new Date();
    execution.duration = execution.endTime.getTime() - execution.startTime.getTime();

    // Mark running steps as failed
    execution.steps
      .filter(step => step.status === 'running')
      .forEach(step => {
        step.status = 'failed';
        step.endTime = execution.endTime;
        step.duration = step.endTime!.getTime() - step.startTime.getTime();
        step.error = new Error('Step timed out');
        execution.metrics.failedSteps++;
      });

    // Record metrics
    this.monitoringService.recordWorkflowMetric(execution.type, 'timeout', execution.duration);
    this.monitoringService.recordError('workflow_timeout', 'high');

    // Log timeout
    this.monitoringService.logWorkflow(
      workflowId,
      'timeout',
      'timeout',
      {
        total_duration: execution.duration,
        completed_steps: execution.metrics.completedSteps,
        failed_steps: execution.metrics.failedSteps,
        timeout_steps: execution.steps.filter(s => s.status === 'running').length,
      }
    );

    this.moveToCompleted(execution);
    this.emit('workflow_timeout', execution);
  }

  // Move execution to completed list
  private moveToCompleted(execution: WorkflowExecution): void {
    this.activeExecutions.delete(execution.id);
    this.completedExecutions.push(execution);

    // Maintain max completed executions
    if (this.completedExecutions.length > this.maxCompletedExecutions) {
      this.completedExecutions.shift();
    }
  }

  // Update average step duration
  private updateAverageStepDuration(execution: WorkflowExecution): void {
    const completedSteps = execution.steps.filter(step => 
      step.status === 'completed' && step.duration !== undefined
    );

    if (completedSteps.length > 0) {
      const totalDuration = completedSteps.reduce((sum, step) => sum + (step.duration || 0), 0);
      execution.metrics.averageStepDuration = totalDuration / completedSteps.length;
    }
  }

  // Wait for workflow completion (for tracing)
  private async waitForWorkflowCompletion(workflowId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const checkCompletion = () => {
        const execution = this.activeExecutions.get(workflowId) || 
                         this.completedExecutions.find(e => e.id === workflowId);
        
        if (execution) {
          if (execution.status === 'completed') {
            resolve();
          } else if (['failed', 'timeout'].includes(execution.status)) {
            reject(execution.error || new Error(`Workflow ${execution.status}`));
          } else {
            // Still running, check again later
            setTimeout(checkCompletion, 100);
          }
        } else {
          reject(new Error('Workflow not found'));
        }
      };

      checkCompletion();
    });
  }

  // Get active executions
  getActiveExecutions(): WorkflowExecution[] {
    return Array.from(this.activeExecutions.values());
  }

  // Get completed executions
  getCompletedExecutions(limit?: number): WorkflowExecution[] {
    return limit ? this.completedExecutions.slice(-limit) : this.completedExecutions;
  }

  // Get execution by ID
  getExecution(workflowId: string): WorkflowExecution | null {
    return this.activeExecutions.get(workflowId) || 
           this.completedExecutions.find(e => e.id === workflowId) || 
           null;
  }

  // Get workflow statistics
  getStatistics(): {
    active: number;
    completed: number;
    failed: number;
    averageDuration: number;
    successRate: number;
    totalSteps: number;
    avgStepsPerWorkflow: number;
  } {
    const completed = this.completedExecutions;
    const failed = completed.filter(e => e.status === 'failed' || e.status === 'timeout');
    const successful = completed.filter(e => e.status === 'completed');
    
    const durations = completed
      .filter(e => e.duration !== undefined)
      .map(e => e.duration!);
    
    const averageDuration = durations.length > 0 
      ? durations.reduce((a, b) => a + b, 0) / durations.length 
      : 0;

    const totalSteps = completed.reduce((sum, e) => sum + e.metrics.totalSteps, 0);
    const avgStepsPerWorkflow = completed.length > 0 
      ? totalSteps / completed.length 
      : 0;

    return {
      active: this.activeExecutions.size,
      completed: completed.length,
      failed: failed.length,
      averageDuration,
      successRate: completed.length > 0 ? successful.length / completed.length : 0,
      totalSteps,
      avgStepsPerWorkflow,
    };
  }

  // Health check
  getHealthStatus(): { status: 'healthy' | 'unhealthy'; message: string } {
    try {
      const stats = this.getStatistics();
      return {
        status: 'healthy',
        message: `Workflow monitor operational. Active: ${stats.active}, Completed: ${stats.completed}`,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Workflow monitor error: ${error}`,
      };
    }
  }

  // Cleanup old executions
  cleanup(maxAge: number = 3600000): void { // Default 1 hour
    const cutoff = Date.now() - maxAge;
    
    const initialLength = this.completedExecutions.length;
    this.completedExecutions = this.completedExecutions.filter(execution =>
      (execution.endTime?.getTime() || execution.startTime.getTime()) > cutoff
    );
    
    const cleaned = initialLength - this.completedExecutions.length;
    
    this.emit('cleanup_completed', {
      executionsCleaned: cleaned,
      remainingExecutions: this.completedExecutions.length,
    });
  }
}