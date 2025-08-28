/**
 * Workflow Template Engine for jaqEdu Platform
 * 
 * Provides comprehensive template management including:
 * - Template definition and validation
 * - Dynamic template instantiation  
 * - Version control and management
 * - Educational workflow-specific features
 */

import { 
  WorkflowTemplate, 
  WorkflowDefinition, 
  TemplateVariable,
  TemplateInstantiation,
  WorkflowExecution,
  WorkflowError,
  WorkflowErrorCode,
  VariableValidation,
  TemplateNodeData,
  EducationalNodeContext
} from '../../types/workflow';

export class WorkflowTemplateEngine {
  private templates: Map<string, WorkflowTemplate> = new Map();
  private instantiations: Map<string, TemplateInstantiation> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
  }

  // ============================================================================
  // Template Management
  // ============================================================================

  /**
   * Register a new workflow template
   */
  async registerTemplate(template: Omit<WorkflowTemplate, 'id' | 'created_at' | 'updated_at' | 'usage_count'>): Promise<string> {
    const templateId = this.generateId();
    const now = new Date();
    
    const fullTemplate: WorkflowTemplate = {
      ...template,
      id: templateId,
      created_at: now,
      updated_at: now,
      usage_count: 0
    };

    // Validate template structure
    await this.validateTemplate(fullTemplate);
    
    this.templates.set(templateId, fullTemplate);
    
    return templateId;
  }

  /**
   * Validate template structure and configuration
   */
  async validateTemplate(template: WorkflowTemplate): Promise<void> {
    const errors: string[] = [];

    // Basic structure validation
    if (!template.name?.trim()) {
      errors.push('Template name is required');
    }

    if (!template.description?.trim()) {
      errors.push('Template description is required');
    }

    if (!template.definition) {
      errors.push('Workflow definition is required');
    }

    // Validate workflow definition structure
    if (template.definition) {
      await this.validateWorkflowDefinition(template.definition);
    }

    // Validate template variables
    if (template.variables) {
      await this.validateTemplateVariables(template.variables);
    }

    // Educational context validation
    await this.validateEducationalContext(template);

    if (errors.length > 0) {
      throw new WorkflowError(
        `Template validation failed: ${errors.join(', ')}`,
        WorkflowErrorCode.VALIDATION_ERROR,
        undefined,
        template.id
      );
    }
  }

  /**
   * Validate workflow definition structure
   */
  private async validateWorkflowDefinition(definition: WorkflowDefinition): Promise<void> {
    const errors: string[] = [];

    if (!definition.states || definition.states.length === 0) {
      errors.push('Workflow must have at least one state');
    }

    if (!definition.transitions || definition.transitions.length === 0) {
      errors.push('Workflow must have at least one transition');
    }

    // Check for initial state
    const hasInitialState = definition.states?.some(state => state.isInitial);
    if (!hasInitialState) {
      errors.push('Workflow must have exactly one initial state');
    }

    // Check for final state  
    const hasFinalState = definition.states?.some(state => state.isFinal);
    if (!hasFinalState) {
      errors.push('Workflow must have at least one final state');
    }

    // Validate state transitions
    for (const transition of definition.transitions || []) {
      const sourceExists = definition.states?.find(s => s.id === transition.from);
      const targetExists = definition.states?.find(s => s.id === transition.to);
      
      if (!sourceExists) {
        errors.push(`Transition references non-existent source state: ${transition.from}`);
      }
      
      if (!targetExists) {
        errors.push(`Transition references non-existent target state: ${transition.to}`);
      }
    }

    if (errors.length > 0) {
      throw new WorkflowError(
        `Workflow definition validation failed: ${errors.join(', ')}`,
        WorkflowErrorCode.VALIDATION_ERROR
      );
    }
  }

  /**
   * Validate template variables configuration
   */
  private async validateTemplateVariables(variables: TemplateVariable[]): Promise<void> {
    const errors: string[] = [];
    const variableNames = new Set<string>();

    for (const variable of variables) {
      // Check for duplicate names
      if (variableNames.has(variable.name)) {
        errors.push(`Duplicate variable name: ${variable.name}`);
      }
      variableNames.add(variable.name);

      // Validate variable structure
      if (!variable.name?.trim()) {
        errors.push('Variable name is required');
      }

      if (!variable.displayName?.trim()) {
        errors.push(`Display name is required for variable: ${variable.name}`);
      }

      if (!variable.type) {
        errors.push(`Type is required for variable: ${variable.name}`);
      }

      // Validate default value against type
      if (variable.defaultValue !== undefined && variable.defaultValue !== null) {
        await this.validateVariableValue(variable, variable.defaultValue);
      }

      // Validate required variable has no default null value
      if (variable.required && (variable.defaultValue === null || variable.defaultValue === undefined)) {
        errors.push(`Required variable ${variable.name} cannot have null/undefined default value`);
      }
    }

    if (errors.length > 0) {
      throw new WorkflowError(
        `Template variables validation failed: ${errors.join(', ')}`,
        WorkflowErrorCode.VALIDATION_ERROR
      );
    }
  }

  /**
   * Validate educational context for Jung psychology modules
   */
  private async validateEducationalContext(template: WorkflowTemplate): Promise<void> {
    if (template.category === 'jung_psychology') {
      const errors: string[] = [];

      // Check for educational metadata
      if (!template.metadata.use_cases || template.metadata.use_cases.length === 0) {
        errors.push('Jung psychology templates must specify use cases');
      }

      // Validate difficulty level
      if (!template.difficulty) {
        errors.push('Educational templates must specify difficulty level');
      }

      // Check for learning objectives in nodes
      const hasEducationalNodes = template.definition.states.some(state => 
        (state as any).educational_context?.learning_objectives?.length > 0
      );

      if (!hasEducationalNodes) {
        errors.push('Jung psychology templates should have states with learning objectives');
      }

      if (errors.length > 0) {
        throw new WorkflowError(
          `Educational context validation failed: ${errors.join(', ')}`,
          WorkflowErrorCode.VALIDATION_ERROR,
          undefined,
          template.id
        );
      }
    }
  }

  /**
   * Validate variable value against its type and constraints
   */
  private async validateVariableValue(variable: TemplateVariable, value: any): Promise<void> {
    const validation = variable.validation;
    
    // Type validation
    switch (variable.type) {
      case 'string':
        if (typeof value !== 'string') {
          throw new Error(`Variable ${variable.name} expects string, got ${typeof value}`);
        }
        if (validation?.min && value.length < validation.min) {
          throw new Error(`Variable ${variable.name} must be at least ${validation.min} characters`);
        }
        if (validation?.max && value.length > validation.max) {
          throw new Error(`Variable ${variable.name} must be at most ${validation.max} characters`);
        }
        if (validation?.pattern && !new RegExp(validation.pattern).test(value)) {
          throw new Error(`Variable ${variable.name} does not match required pattern`);
        }
        break;

      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          throw new Error(`Variable ${variable.name} expects number, got ${typeof value}`);
        }
        if (validation?.min && value < validation.min) {
          throw new Error(`Variable ${variable.name} must be at least ${validation.min}`);
        }
        if (validation?.max && value > validation.max) {
          throw new Error(`Variable ${variable.name} must be at most ${validation.max}`);
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          throw new Error(`Variable ${variable.name} expects boolean, got ${typeof value}`);
        }
        break;

      case 'array':
        if (!Array.isArray(value)) {
          throw new Error(`Variable ${variable.name} expects array, got ${typeof value}`);
        }
        if (validation?.min && value.length < validation.min) {
          throw new Error(`Variable ${variable.name} array must have at least ${validation.min} items`);
        }
        if (validation?.max && value.length > validation.max) {
          throw new Error(`Variable ${variable.name} array must have at most ${validation.max} items`);
        }
        break;
    }

    // Enum validation
    if (validation?.enum && !validation.enum.includes(value)) {
      throw new Error(`Variable ${variable.name} must be one of: ${validation.enum.join(', ')}`);
    }
  }

  // ============================================================================
  // Template Instantiation
  // ============================================================================

  /**
   * Create a workflow instance from a template
   */
  async instantiateTemplate(
    templateId: string, 
    variables: Record<string, any>,
    userId: string,
    options?: { 
      instanceName?: string;
      execute?: boolean;
    }
  ): Promise<{ instance: TemplateInstantiation; workflow?: WorkflowExecution }> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new WorkflowError(
        `Template not found: ${templateId}`,
        WorkflowErrorCode.WORKFLOW_NOT_FOUND,
        undefined,
        templateId
      );
    }

    // Validate provided variables
    await this.validateInstanceVariables(template, variables);

    // Merge with default values
    const mergedVariables = await this.mergeVariables(template, variables);

    // Create instantiation record
    const instanceId = this.generateId();
    const instantiation: TemplateInstantiation = {
      template_id: templateId,
      instance_id: instanceId,
      variables: mergedVariables,
      created_by: userId,
      created_at: new Date(),
      status: 'draft'
    };

    // Generate workflow definition with variables substituted
    const workflowDefinition = await this.substituteVariables(template.definition, mergedVariables);

    // Update usage count
    template.usage_count++;
    template.updated_at = new Date();
    this.templates.set(templateId, template);

    // Store instantiation
    this.instantiations.set(instanceId, instantiation);

    let workflowExecution: WorkflowExecution | undefined;

    // Execute if requested
    if (options?.execute) {
      // This would integrate with the workflow engine
      // For now, we'll create a mock execution
      workflowExecution = {
        id: this.generateId(),
        workflow_id: workflowDefinition.id,
        user_id: userId,
        status: 'pending',
        variables: mergedVariables,
        execution_history: [],
        retry_count: 0,
        started_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      };

      instantiation.workflow_execution_id = workflowExecution.id;
      instantiation.status = 'active';
    }

    return { instance: instantiation, workflow: workflowExecution };
  }

  /**
   * Validate variables provided for template instantiation
   */
  private async validateInstanceVariables(template: WorkflowTemplate, variables: Record<string, any>): Promise<void> {
    const errors: string[] = [];

    // Check required variables
    for (const templateVar of template.variables) {
      if (templateVar.required) {
        const hasValue = variables.hasOwnProperty(templateVar.name) && 
                        variables[templateVar.name] !== null && 
                        variables[templateVar.name] !== undefined;
        
        if (!hasValue && (templateVar.defaultValue === null || templateVar.defaultValue === undefined)) {
          errors.push(`Required variable missing: ${templateVar.name}`);
        }
      }

      // Validate provided values
      if (variables.hasOwnProperty(templateVar.name)) {
        try {
          await this.validateVariableValue(templateVar, variables[templateVar.name]);
        } catch (error: any) {
          errors.push(error.message);
        }
      }
    }

    // Check for unknown variables
    const knownVariableNames = new Set(template.variables.map(v => v.name));
    for (const variableName of Object.keys(variables)) {
      if (!knownVariableNames.has(variableName)) {
        errors.push(`Unknown variable: ${variableName}`);
      }
    }

    if (errors.length > 0) {
      throw new WorkflowError(
        `Variable validation failed: ${errors.join(', ')}`,
        WorkflowErrorCode.VALIDATION_ERROR,
        undefined,
        template.id
      );
    }
  }

  /**
   * Merge provided variables with template defaults
   */
  private async mergeVariables(template: WorkflowTemplate, variables: Record<string, any>): Promise<Record<string, any>> {
    const merged: Record<string, any> = {};

    // Start with default values
    for (const templateVar of template.variables) {
      if (templateVar.defaultValue !== undefined && templateVar.defaultValue !== null) {
        merged[templateVar.name] = templateVar.defaultValue;
      }
    }

    // Override with provided values
    Object.assign(merged, variables);

    return merged;
  }

  /**
   * Substitute template variables in workflow definition
   */
  private async substituteVariables(definition: WorkflowDefinition, variables: Record<string, any>): Promise<WorkflowDefinition> {
    // Deep clone the definition
    const substituted = JSON.parse(JSON.stringify(definition));

    // Recursively substitute variables in the definition
    const substituteInObject = (obj: any): any => {
      if (typeof obj === 'string') {
        return this.substituteStringVariables(obj, variables);
      } else if (Array.isArray(obj)) {
        return obj.map(item => substituteInObject(item));
      } else if (obj && typeof obj === 'object') {
        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
          result[key] = substituteInObject(value);
        }
        return result;
      }
      return obj;
    };

    return substituteInObject(substituted);
  }

  /**
   * Substitute variables in a string using template syntax ${variableName}
   */
  private substituteStringVariables(str: string, variables: Record<string, any>): string {
    return str.replace(/\$\{([^}]+)\}/g, (match, varName) => {
      const value = variables[varName];
      return value !== undefined ? String(value) : match;
    });
  }

  // ============================================================================
  // Template Queries and Management
  // ============================================================================

  /**
   * Get template by ID
   */
  getTemplate(templateId: string): WorkflowTemplate | undefined {
    return this.templates.get(templateId);
  }

  /**
   * List templates with filtering and pagination
   */
  listTemplates(options?: {
    category?: string;
    search?: string;
    tags?: string[];
    difficulty?: string;
    isPublic?: boolean;
    limit?: number;
    offset?: number;
  }): { templates: WorkflowTemplate[]; total: number } {
    let filtered = Array.from(this.templates.values());

    // Apply filters
    if (options?.category) {
      filtered = filtered.filter(t => t.category === options.category);
    }

    if (options?.search) {
      const search = options.search.toLowerCase();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(search) ||
        t.description.toLowerCase().includes(search) ||
        t.tags.some(tag => tag.toLowerCase().includes(search))
      );
    }

    if (options?.tags && options.tags.length > 0) {
      filtered = filtered.filter(t => 
        options.tags!.some(tag => t.tags.includes(tag))
      );
    }

    if (options?.difficulty) {
      filtered = filtered.filter(t => t.difficulty === options.difficulty);
    }

    if (options?.isPublic !== undefined) {
      filtered = filtered.filter(t => t.isPublic === options.isPublic);
    }

    // Sort by usage and rating
    filtered.sort((a, b) => {
      const aScore = (a.rating || 0) * 0.7 + (a.usage_count || 0) * 0.3;
      const bScore = (b.rating || 0) * 0.7 + (b.usage_count || 0) * 0.3;
      return bScore - aScore;
    });

    // Apply pagination
    const total = filtered.length;
    const offset = options?.offset || 0;
    const limit = options?.limit || 50;
    
    if (offset > 0 || limit < total) {
      filtered = filtered.slice(offset, offset + limit);
    }

    return { templates: filtered, total };
  }

  /**
   * Update template
   */
  async updateTemplate(templateId: string, updates: Partial<WorkflowTemplate>): Promise<void> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new WorkflowError(
        `Template not found: ${templateId}`,
        WorkflowErrorCode.WORKFLOW_NOT_FOUND,
        undefined,
        templateId
      );
    }

    const updatedTemplate = {
      ...template,
      ...updates,
      id: templateId, // Ensure ID can't be changed
      updated_at: new Date()
    };

    // Validate updated template
    await this.validateTemplate(updatedTemplate);
    
    this.templates.set(templateId, updatedTemplate);
  }

  /**
   * Delete template
   */
  async deleteTemplate(templateId: string): Promise<void> {
    if (!this.templates.has(templateId)) {
      throw new WorkflowError(
        `Template not found: ${templateId}`,
        WorkflowErrorCode.WORKFLOW_NOT_FOUND,
        undefined,
        templateId
      );
    }

    // Check for active instantiations
    const activeInstantiations = Array.from(this.instantiations.values())
      .filter(inst => inst.template_id === templateId && inst.status === 'active');

    if (activeInstantiations.length > 0) {
      throw new WorkflowError(
        `Cannot delete template with active instantiations`,
        WorkflowErrorCode.INVALID_STATE,
        undefined,
        templateId
      );
    }

    this.templates.delete(templateId);
  }

  /**
   * Get template instantiations
   */
  getTemplateInstantiations(templateId: string): TemplateInstantiation[] {
    return Array.from(this.instantiations.values())
      .filter(inst => inst.template_id === templateId);
  }

  // ============================================================================
  // Educational Workflow Features
  // ============================================================================

  /**
   * Get templates suitable for Jung psychology modules
   */
  getJungPsychologyTemplates(): WorkflowTemplate[] {
    return this.listTemplates({ 
      category: 'jung_psychology',
      isPublic: true 
    }).templates;
  }

  /**
   * Recommend templates based on user's learning progress
   */
  recommendTemplates(userContext: {
    completedModules?: string[];
    currentDifficulty?: 'beginner' | 'intermediate' | 'advanced';
    interests?: string[];
    role?: 'student' | 'instructor' | 'admin';
  }): WorkflowTemplate[] {
    const { templates } = this.listTemplates({ isPublic: true });
    
    // Score templates based on user context
    const scored = templates.map(template => {
      let score = 0;

      // Difficulty matching
      if (userContext.currentDifficulty === template.difficulty) {
        score += 3;
      } else if (
        (userContext.currentDifficulty === 'beginner' && template.difficulty === 'intermediate') ||
        (userContext.currentDifficulty === 'intermediate' && template.difficulty === 'advanced')
      ) {
        score += 1;
      }

      // Interest matching
      if (userContext.interests) {
        const matchingTags = template.tags.filter(tag => 
          userContext.interests!.some(interest => 
            tag.toLowerCase().includes(interest.toLowerCase()) ||
            interest.toLowerCase().includes(tag.toLowerCase())
          )
        );
        score += matchingTags.length;
      }

      // Usage and rating
      score += (template.rating || 0) * 0.5;
      score += Math.min(template.usage_count / 100, 2); // Cap usage bonus at 2

      return { template, score };
    });

    // Sort by score and return top recommendations
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(item => item.template);
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private generateId(): string {
    return 'wft_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
  }

  /**
   * Initialize default educational templates
   */
  private initializeDefaultTemplates(): void {
    // This would load default templates from configuration
    // For now, we'll leave it empty and populate via the data file
  }

  /**
   * Get template statistics
   */
  getTemplateStats(): {
    totalTemplates: number;
    publicTemplates: number;
    totalUsages: number;
    categoryCounts: Record<string, number>;
    difficultyDistribution: Record<string, number>;
  } {
    const templates = Array.from(this.templates.values());
    
    const stats = {
      totalTemplates: templates.length,
      publicTemplates: templates.filter(t => t.isPublic).length,
      totalUsages: templates.reduce((sum, t) => sum + t.usage_count, 0),
      categoryCounts: {} as Record<string, number>,
      difficultyDistribution: {} as Record<string, number>
    };

    // Count by category
    templates.forEach(template => {
      stats.categoryCounts[template.category] = (stats.categoryCounts[template.category] || 0) + 1;
      stats.difficultyDistribution[template.difficulty] = (stats.difficultyDistribution[template.difficulty] || 0) + 1;
    });

    return stats;
  }
}

export default WorkflowTemplateEngine;