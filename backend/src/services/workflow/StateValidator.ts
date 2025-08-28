import { Logger } from '../../utils/Logger';
import { 
  WorkflowState, 
  WorkflowStatus, 
  StateTransition 
} from './WorkflowStateManager';

export interface ValidationRule {
  name: string;
  description: string;
  validate: (state: WorkflowState, transition?: StateTransition) => Promise<ValidationResult>;
  priority: number; // Lower numbers = higher priority
  enabled: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  severity: 'error' | 'critical';
}

export interface ValidationWarning {
  code: string;
  message: string;
  field?: string;
}

export interface TransitionRule {
  from: WorkflowStatus[];
  to: WorkflowStatus;
  conditions?: TransitionCondition[];
  requiredFields?: string[];
  forbiddenFields?: string[];
  customValidator?: (state: WorkflowState, transition: StateTransition) => Promise<boolean>;
}

export interface TransitionCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'exists' | 'not_exists' | 'greater_than' | 'less_than';
  value: any;
}

export interface StateValidatorConfig {
  transitionRules: TransitionRule[];
  validationRules: ValidationRule[];
  strictMode: boolean; // Fail on warnings if true
  logger?: Logger;
}

export class StateValidator {
  private readonly transitionRules: Map<WorkflowStatus, TransitionRule[]>;
  private readonly validationRules: ValidationRule[];
  private readonly strictMode: boolean;
  private readonly logger: Logger;

  constructor(config: StateValidatorConfig) {
    this.strictMode = config.strictMode;
    this.logger = config.logger || new Logger('StateValidator');
    this.validationRules = config.validationRules.filter(rule => rule.enabled);
    
    // Index transition rules by target status for efficient lookup
    this.transitionRules = new Map();
    config.transitionRules.forEach(rule => {
      if (!this.transitionRules.has(rule.to)) {
        this.transitionRules.set(rule.to, []);
      }
      this.transitionRules.get(rule.to)!.push(rule);
    });

    // Sort validation rules by priority
    this.validationRules.sort((a, b) => a.priority - b.priority);

    this.logger.info(`StateValidator initialized with ${this.validationRules.length} validation rules and ${config.transitionRules.length} transition rules`);
  }

  /**
   * Validate workflow state
   */
  async validateState(state: WorkflowState): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    this.logger.debug(`Validating state: ${state.id}`);

    try {
      // Run all validation rules
      for (const rule of this.validationRules) {
        try {
          const ruleResult = await rule.validate(state);
          
          result.errors.push(...ruleResult.errors);
          result.warnings.push(...ruleResult.warnings);

          if (!ruleResult.isValid) {
            result.isValid = false;
          }

        } catch (error) {
          this.logger.error(`Validation rule '${rule.name}' failed:`, error);
          result.errors.push({
            code: 'VALIDATION_RULE_ERROR',
            message: `Validation rule '${rule.name}' encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            severity: 'error'
          });
          result.isValid = false;
        }
      }

      // In strict mode, warnings also make the state invalid
      if (this.strictMode && result.warnings.length > 0) {
        result.isValid = false;
      }

      // Basic structural validation
      await this.validateStateStructure(state, result);

      this.logger.debug(`State validation completed for ${state.id}: ${result.isValid ? 'VALID' : 'INVALID'} (${result.errors.length} errors, ${result.warnings.length} warnings)`);

      return result;

    } catch (error) {
      this.logger.error(`State validation failed for ${state.id}:`, error);
      result.errors.push({
        code: 'VALIDATION_SYSTEM_ERROR',
        message: `State validation system error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'critical'
      });
      result.isValid = false;
      return result;
    }
  }

  /**
   * Validate state transition
   */
  async validateTransition(currentState: WorkflowState, transition: StateTransition): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    this.logger.debug(`Validating transition: ${transition.from} -> ${transition.to} for state ${currentState.id}`);

    try {
      // Check if current state status matches transition 'from'
      if (currentState.status !== transition.from) {
        result.errors.push({
          code: 'INVALID_CURRENT_STATUS',
          message: `Current state status '${currentState.status}' does not match transition 'from' status '${transition.from}'`,
          field: 'status',
          severity: 'error'
        });
        result.isValid = false;
        return result;
      }

      // Find applicable transition rules
      const applicableRules = this.transitionRules.get(transition.to) || [];
      const matchingRules = applicableRules.filter(rule => rule.from.includes(transition.from));

      if (matchingRules.length === 0) {
        result.errors.push({
          code: 'FORBIDDEN_TRANSITION',
          message: `Transition from '${transition.from}' to '${transition.to}' is not allowed`,
          severity: 'error'
        });
        result.isValid = false;
        return result;
      }

      // Validate against matching rules
      for (const rule of matchingRules) {
        const ruleResult = await this.validateTransitionRule(currentState, transition, rule);
        
        result.errors.push(...ruleResult.errors);
        result.warnings.push(...ruleResult.warnings);
        
        if (!ruleResult.isValid) {
          result.isValid = false;
        }
      }

      // Run validation rules for the transition
      for (const rule of this.validationRules) {
        try {
          const ruleResult = await rule.validate(currentState, transition);
          
          result.errors.push(...ruleResult.errors);
          result.warnings.push(...ruleResult.warnings);

          if (!ruleResult.isValid) {
            result.isValid = false;
          }

        } catch (error) {
          this.logger.error(`Validation rule '${rule.name}' failed during transition:`, error);
          result.errors.push({
            code: 'TRANSITION_VALIDATION_RULE_ERROR',
            message: `Validation rule '${rule.name}' encountered an error during transition: ${error instanceof Error ? error.message : 'Unknown error'}`,
            severity: 'error'
          });
          result.isValid = false;
        }
      }

      this.logger.debug(`Transition validation completed: ${result.isValid ? 'VALID' : 'INVALID'} (${result.errors.length} errors, ${result.warnings.length} warnings)`);

      return result;

    } catch (error) {
      this.logger.error(`Transition validation failed:`, error);
      result.errors.push({
        code: 'TRANSITION_VALIDATION_SYSTEM_ERROR',
        message: `Transition validation system error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'critical'
      });
      result.isValid = false;
      return result;
    }
  }

  /**
   * Get all possible transitions from a given status
   */
  getAllowedTransitions(fromStatus: WorkflowStatus): WorkflowStatus[] {
    const allowedTransitions: Set<WorkflowStatus> = new Set();

    for (const [toStatus, rules] of this.transitionRules.entries()) {
      const hasMatchingRule = rules.some(rule => rule.from.includes(fromStatus));
      if (hasMatchingRule) {
        allowedTransitions.add(toStatus);
      }
    }

    return Array.from(allowedTransitions);
  }

  /**
   * Check if a specific transition is allowed
   */
  isTransitionAllowed(from: WorkflowStatus, to: WorkflowStatus): boolean {
    const rules = this.transitionRules.get(to) || [];
    return rules.some(rule => rule.from.includes(from));
  }

  /**
   * Add custom validation rule
   */
  addValidationRule(rule: ValidationRule): void {
    this.validationRules.push(rule);
    this.validationRules.sort((a, b) => a.priority - b.priority);
    this.logger.info(`Added validation rule: ${rule.name}`);
  }

  /**
   * Remove validation rule
   */
  removeValidationRule(ruleName: string): boolean {
    const index = this.validationRules.findIndex(rule => rule.name === ruleName);
    if (index !== -1) {
      this.validationRules.splice(index, 1);
      this.logger.info(`Removed validation rule: ${ruleName}`);
      return true;
    }
    return false;
  }

  /**
   * Private helper methods
   */
  private async validateStateStructure(state: WorkflowState, result: ValidationResult): Promise<void> {
    // Validate required fields
    if (!state.id) {
      result.errors.push({
        code: 'MISSING_STATE_ID',
        message: 'State ID is required',
        field: 'id',
        severity: 'critical'
      });
      result.isValid = false;
    }

    if (!state.workflowId) {
      result.errors.push({
        code: 'MISSING_WORKFLOW_ID',
        message: 'Workflow ID is required',
        field: 'workflowId',
        severity: 'critical'
      });
      result.isValid = false;
    }

    if (!state.status) {
      result.errors.push({
        code: 'MISSING_STATUS',
        message: 'Status is required',
        field: 'status',
        severity: 'critical'
      });
      result.isValid = false;
    }

    if (!state.currentStep) {
      result.errors.push({
        code: 'MISSING_CURRENT_STEP',
        message: 'Current step is required',
        field: 'currentStep',
        severity: 'critical'
      });
      result.isValid = false;
    }

    // Validate metadata
    if (!state.metadata) {
      result.errors.push({
        code: 'MISSING_METADATA',
        message: 'Metadata is required',
        field: 'metadata',
        severity: 'error'
      });
      result.isValid = false;
    } else {
      if (!state.metadata.createdAt) {
        result.errors.push({
          code: 'MISSING_CREATED_AT',
          message: 'Created at timestamp is required',
          field: 'metadata.createdAt',
          severity: 'error'
        });
        result.isValid = false;
      }

      if (!state.metadata.updatedAt) {
        result.errors.push({
          code: 'MISSING_UPDATED_AT',
          message: 'Updated at timestamp is required',
          field: 'metadata.updatedAt',
          severity: 'error'
        });
        result.isValid = false;
      }

      if (state.metadata.version < 1) {
        result.errors.push({
          code: 'INVALID_VERSION',
          message: 'Version must be greater than 0',
          field: 'metadata.version',
          severity: 'error'
        });
        result.isValid = false;
      }
    }

    // Validate status enum
    if (state.status && !Object.values(WorkflowStatus).includes(state.status)) {
      result.errors.push({
        code: 'INVALID_STATUS',
        message: `Invalid status: ${state.status}`,
        field: 'status',
        severity: 'error'
      });
      result.isValid = false;
    }

    // Validate history array
    if (!Array.isArray(state.history)) {
      result.errors.push({
        code: 'INVALID_HISTORY',
        message: 'History must be an array',
        field: 'history',
        severity: 'error'
      });
      result.isValid = false;
    }

    // Validate data object
    if (state.data && typeof state.data !== 'object') {
      result.errors.push({
        code: 'INVALID_DATA',
        message: 'Data must be an object',
        field: 'data',
        severity: 'error'
      });
      result.isValid = false;
    }
  }

  private async validateTransitionRule(
    currentState: WorkflowState, 
    transition: StateTransition, 
    rule: TransitionRule
  ): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Check conditions
    if (rule.conditions) {
      for (const condition of rule.conditions) {
        const isConditionMet = await this.evaluateCondition(currentState, transition, condition);
        if (!isConditionMet) {
          result.errors.push({
            code: 'CONDITION_NOT_MET',
            message: `Transition condition not met: ${condition.field} ${condition.operator} ${JSON.stringify(condition.value)}`,
            field: condition.field,
            severity: 'error'
          });
          result.isValid = false;
        }
      }
    }

    // Check required fields
    if (rule.requiredFields) {
      for (const field of rule.requiredFields) {
        const value = this.getNestedValue(transition.data || currentState.data, field);
        if (value === undefined || value === null) {
          result.errors.push({
            code: 'REQUIRED_FIELD_MISSING',
            message: `Required field '${field}' is missing for transition to '${transition.to}'`,
            field,
            severity: 'error'
          });
          result.isValid = false;
        }
      }
    }

    // Check forbidden fields
    if (rule.forbiddenFields) {
      for (const field of rule.forbiddenFields) {
        const value = this.getNestedValue(transition.data || currentState.data, field);
        if (value !== undefined && value !== null) {
          result.errors.push({
            code: 'FORBIDDEN_FIELD_PRESENT',
            message: `Forbidden field '${field}' is present for transition to '${transition.to}'`,
            field,
            severity: 'error'
          });
          result.isValid = false;
        }
      }
    }

    // Run custom validator
    if (rule.customValidator) {
      try {
        const isValid = await rule.customValidator(currentState, transition);
        if (!isValid) {
          result.errors.push({
            code: 'CUSTOM_VALIDATION_FAILED',
            message: `Custom validation failed for transition to '${transition.to}'`,
            severity: 'error'
          });
          result.isValid = false;
        }
      } catch (error) {
        result.errors.push({
          code: 'CUSTOM_VALIDATOR_ERROR',
          message: `Custom validator error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'error'
        });
        result.isValid = false;
      }
    }

    return result;
  }

  private async evaluateCondition(
    state: WorkflowState, 
    transition: StateTransition, 
    condition: TransitionCondition
  ): Promise<boolean> {
    const fieldValue = this.getNestedValue(transition.data || state.data, condition.field);

    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
        
      case 'not_equals':
        return fieldValue !== condition.value;
        
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
        
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
        
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null;
        
      case 'not_exists':
        return fieldValue === undefined || fieldValue === null;
        
      case 'greater_than':
        return typeof fieldValue === 'number' && typeof condition.value === 'number' 
               && fieldValue > condition.value;
               
      case 'less_than':
        return typeof fieldValue === 'number' && typeof condition.value === 'number' 
               && fieldValue < condition.value;
        
      default:
        this.logger.warn(`Unknown condition operator: ${condition.operator}`);
        return false;
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }
}

/**
 * Create default state validator with common workflow patterns
 */
export function createDefaultStateValidator(config?: Partial<StateValidatorConfig>): StateValidator {
  const defaultTransitionRules: TransitionRule[] = [
    {
      from: [WorkflowStatus.PENDING],
      to: WorkflowStatus.RUNNING
    },
    {
      from: [WorkflowStatus.RUNNING],
      to: WorkflowStatus.PAUSED
    },
    {
      from: [WorkflowStatus.RUNNING, WorkflowStatus.PAUSED],
      to: WorkflowStatus.COMPLETED
    },
    {
      from: [WorkflowStatus.RUNNING, WorkflowStatus.PAUSED, WorkflowStatus.WAITING],
      to: WorkflowStatus.FAILED
    },
    {
      from: [WorkflowStatus.PENDING, WorkflowStatus.RUNNING, WorkflowStatus.PAUSED, WorkflowStatus.WAITING],
      to: WorkflowStatus.CANCELLED
    },
    {
      from: [WorkflowStatus.PAUSED],
      to: WorkflowStatus.RUNNING
    },
    {
      from: [WorkflowStatus.RUNNING],
      to: WorkflowStatus.WAITING
    },
    {
      from: [WorkflowStatus.WAITING],
      to: WorkflowStatus.RUNNING
    },
    {
      from: [WorkflowStatus.FAILED],
      to: WorkflowStatus.ROLLBACK
    },
    {
      from: [WorkflowStatus.ROLLBACK],
      to: WorkflowStatus.PENDING
    }
  ];

  const defaultValidationRules: ValidationRule[] = [
    {
      name: 'basic-structure',
      description: 'Validates basic state structure',
      priority: 1,
      enabled: true,
      validate: async (state: WorkflowState): Promise<ValidationResult> => {
        const result: ValidationResult = { isValid: true, errors: [], warnings: [] };
        
        if (!state.id || state.id.trim().length === 0) {
          result.errors.push({
            code: 'EMPTY_STATE_ID',
            message: 'State ID cannot be empty',
            field: 'id',
            severity: 'critical'
          });
          result.isValid = false;
        }

        return result;
      }
    },
    {
      name: 'data-size-check',
      description: 'Checks if state data is within reasonable size limits',
      priority: 10,
      enabled: true,
      validate: async (state: WorkflowState): Promise<ValidationResult> => {
        const result: ValidationResult = { isValid: true, errors: [], warnings: [] };
        
        const dataSize = JSON.stringify(state.data).length;
        const maxSize = 1024 * 1024; // 1MB
        
        if (dataSize > maxSize) {
          result.errors.push({
            code: 'DATA_TOO_LARGE',
            message: `State data size (${dataSize} bytes) exceeds maximum allowed size (${maxSize} bytes)`,
            field: 'data',
            severity: 'error'
          });
          result.isValid = false;
        } else if (dataSize > maxSize * 0.8) {
          result.warnings.push({
            code: 'DATA_SIZE_WARNING',
            message: `State data size (${dataSize} bytes) is approaching maximum limit`,
            field: 'data'
          });
        }

        return result;
      }
    }
  ];

  return new StateValidator({
    transitionRules: defaultTransitionRules,
    validationRules: defaultValidationRules,
    strictMode: false,
    ...config
  });
}