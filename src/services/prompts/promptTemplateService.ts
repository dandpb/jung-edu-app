import { promptTemplateServiceMock } from './promptTemplateServiceMock';

// Uncomment when database tables are created:
// import { supabase } from '../../config/supabase';
// const supabaseAny = supabase as any;

export interface PromptVariable {
  name: string;
  type: 'text' | 'number' | 'array' | 'boolean';
  description: string;
  required: boolean;
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
  };
}

export interface PromptTemplate {
  id: string;
  key: string;
  category: string;
  name: string;
  description?: string;
  template: string;
  variables: PromptVariable[];
  language: string;
  isActive: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface PromptTemplateVersion {
  id: string;
  templateId: string;
  version: number;
  template: string;
  variables: PromptVariable[];
  changeDescription?: string;
  createdAt: Date;
  createdBy?: string;
}

export interface PromptExecutionLog {
  id: string;
  templateId: string;
  executedAt: Date;
  inputVariables?: Record<string, any>;
  responseTimeMs?: number;
  tokenCount?: number;
  success: boolean;
  errorMessage?: string;
  userId?: string;
}

export interface PromptCategory {
  id: string;
  key: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  displayOrder: number;
}

// Commented out since we're using the mock service
// Uncomment when database tables are created
/*
class PromptTemplateService {
  private cache: Map<string, PromptTemplate> = new Map();
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes
  private lastCacheUpdate: number = 0;

  async getTemplates(category?: string): Promise<PromptTemplate[]> {
    try {
      let query = supabaseAny
        .from('prompt_templates')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('display_order', { ascending: true });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;
      return this.mapToPromptTemplates(data || []);
    } catch (error) {
      console.error('Error fetching prompt templates:', error);
      throw error;
    }
  }

  async getTemplateByKey(key: string): Promise<PromptTemplate | null> {
    // Check cache first
    if (this.isCacheValid() && this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    try {
      const { data, error } = await supabaseAny
        .from('prompt_templates')
        .select('*')
        .eq('key', key)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - try default prompts
          return this.getDefaultPrompt(key);
        }
        throw error;
      }

      const template = this.mapToPromptTemplate(data);
      
      // Update cache
      this.cache.set(key, template);
      this.lastCacheUpdate = Date.now();
      
      return template;
    } catch (error) {
      console.error('Error fetching prompt template:', error);
      return this.getDefaultPrompt(key);
    }
  }

  private async getDefaultPrompt(key: string): Promise<PromptTemplate | null> {
    try {
      const { data, error } = await supabaseAny
        .from('default_prompts')
        .select('*')
        .eq('key', key)
        .single();

      if (error) return null;

      return {
        id: data.id,
        key: data.key,
        category: data.category,
        name: key.replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        template: data.template,
        variables: data.variables || [],
        language: data.language,
        isActive: true,
        version: 1,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.created_at)
      };
    } catch (error) {
      console.error('Error fetching default prompt:', error);
      return null;
    }
  }

  async createTemplate(template: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<PromptTemplate> {
    try {
      const { data: userData } = await supabaseAny.auth.getUser();
      
      const { data, error } = await supabaseAny
        .from('prompt_templates')
        .insert({
          key: template.key,
          category: template.category,
          name: template.name,
          description: template.description,
          template: template.template,
          variables: template.variables,
          language: template.language,
          is_active: template.isActive,
          created_by: userData?.user?.id,
          updated_by: userData?.user?.id
        })
        .select()
        .single();

      if (error) throw error;
      
      // Clear cache
      this.clearCache();
      
      return this.mapToPromptTemplate(data);
    } catch (error) {
      console.error('Error creating prompt template:', error);
      throw error;
    }
  }

  async updateTemplate(id: string, updates: Partial<PromptTemplate>): Promise<PromptTemplate> {
    try {
      const { data: userData } = await supabaseAny.auth.getUser();
      
      const { data, error } = await supabaseAny
        .from('prompt_templates')
        .update({
          ...updates,
          updated_by: userData?.user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Clear cache
      this.clearCache();
      
      return this.mapToPromptTemplate(data);
    } catch (error) {
      console.error('Error updating prompt template:', error);
      throw error;
    }
  }

  async deleteTemplate(id: string): Promise<void> {
    try {
      const { error } = await supabaseAny
        .from('prompt_templates')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      
      // Clear cache
      this.clearCache();
    } catch (error) {
      console.error('Error deleting prompt template:', error);
      throw error;
    }
  }

  async getTemplateVersions(templateId: string): Promise<PromptTemplateVersion[]> {
    try {
      const { data, error } = await supabaseAny
        .from('prompt_template_versions')
        .select('*')
        .eq('template_id', templateId)
        .order('version', { ascending: false });

      if (error) throw error;
      return this.mapToPromptTemplateVersions(data || []);
    } catch (error) {
      console.error('Error fetching template versions:', error);
      throw error;
    }
  }

  async rollbackToVersion(templateId: string, versionId: string): Promise<PromptTemplate> {
    try {
      // Get the version details
      const { data: versionData, error: versionError } = await supabaseAny
        .from('prompt_template_versions')
        .select('*')
        .eq('id', versionId)
        .single();

      if (versionError) throw versionError;

      // Update the template with the version's content
      return this.updateTemplate(templateId, {
        template: versionData.template,
        variables: versionData.variables
      });
    } catch (error) {
      console.error('Error rolling back template version:', error);
      throw error;
    }
  }

  async getCategories(): Promise<PromptCategory[]> {
    try {
      const { data, error } = await supabaseAny
        .from('prompt_categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return this.mapToPromptCategories(data || []);
    } catch (error) {
      console.error('Error fetching prompt categories:', error);
      throw error;
    }
  }

  async logExecution(
    templateId: string,
    inputVariables: Record<string, any>,
    responseTimeMs: number,
    tokenCount?: number,
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    try {
      const { data: userData } = await supabaseAny.auth.getUser();
      
      await supabaseAny
        .from('prompt_execution_logs')
        .insert({
          template_id: templateId,
          input_variables: inputVariables,
          response_time_ms: responseTimeMs,
          token_count: tokenCount,
          success,
          error_message: errorMessage,
          user_id: userData?.user?.id
        });
    } catch (error) {
      console.error('Error logging prompt execution:', error);
      // Don't throw - logging failures shouldn't break the app
    }
  }

  async getExecutionStats(templateId: string, days: number = 30): Promise<{
    totalExecutions: number;
    averageResponseTime: number;
    successRate: number;
    averageTokens: number;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabaseAny
        .from('prompt_execution_logs')
        .select('response_time_ms, token_count, success')
        .eq('template_id', templateId)
        .gte('executed_at', startDate.toISOString());

      if (error) throw error;

      const logs = data || [];
      const successCount = logs.filter((l: any) => l.success).length;
      const totalResponseTime = logs.reduce((sum: number, l: any) => sum + (l.response_time_ms || 0), 0);
      const totalTokens = logs.reduce((sum: number, l: any) => sum + (l.token_count || 0), 0);

      return {
        totalExecutions: logs.length,
        averageResponseTime: logs.length > 0 ? totalResponseTime / logs.length : 0,
        successRate: logs.length > 0 ? (successCount / logs.length) * 100 : 0,
        averageTokens: logs.length > 0 ? totalTokens / logs.length : 0
      };
    } catch (error) {
      console.error('Error fetching execution stats:', error);
      throw error;
    }
  }

  compilePrompt(template: string, variables: Record<string, any>): string {
    let compiled = template;

    // Replace placeholders like {{variable}} with actual values
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      let replacementValue = value;

      // Handle arrays by joining them
      if (Array.isArray(value)) {
        replacementValue = value.join(', ');
      }
      // Handle objects by stringifying
      else if (typeof value === 'object' && value !== null) {
        replacementValue = JSON.stringify(value, null, 2);
      }

      compiled = compiled.replace(placeholder, String(replacementValue));
    });

    return compiled;
  }

  validateVariables(template: PromptTemplate, variables: Record<string, any>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    template.variables.forEach(varDef => {
      const value = variables[varDef.name];

      // Check required fields
      if (varDef.required && (value === undefined || value === null || value === '')) {
        errors.push(`Variable '${varDef.name}' is required`);
        return;
      }

      // Skip validation for optional empty fields
      if (!varDef.required && (value === undefined || value === null)) {
        return;
      }

      // Type validation
      if (varDef.type === 'number' && typeof value !== 'number') {
        errors.push(`Variable '${varDef.name}' must be a number`);
      }
      if (varDef.type === 'array' && !Array.isArray(value)) {
        errors.push(`Variable '${varDef.name}' must be an array`);
      }
      if (varDef.type === 'boolean' && typeof value !== 'boolean') {
        errors.push(`Variable '${varDef.name}' must be a boolean`);
      }

      // Additional validation
      if (varDef.validation) {
        if (varDef.validation.min !== undefined && value < varDef.validation.min) {
          errors.push(`Variable '${varDef.name}' must be at least ${varDef.validation.min}`);
        }
        if (varDef.validation.max !== undefined && value > varDef.validation.max) {
          errors.push(`Variable '${varDef.name}' must be at most ${varDef.validation.max}`);
        }
        if (varDef.validation.pattern) {
          const regex = new RegExp(varDef.validation.pattern);
          if (!regex.test(String(value))) {
            errors.push(`Variable '${varDef.name}' does not match required pattern`);
          }
        }
        if (varDef.validation.options && !varDef.validation.options.includes(String(value))) {
          errors.push(`Variable '${varDef.name}' must be one of: ${varDef.validation.options.join(', ')}`);
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private clearCache(): void {
    this.cache.clear();
    this.lastCacheUpdate = 0;
  }

  private isCacheValid(): boolean {
    return Date.now() - this.lastCacheUpdate < this.cacheExpiry;
  }

  private mapToPromptTemplates(data: any[]): PromptTemplate[] {
    return data.map(item => this.mapToPromptTemplate(item));
  }

  private mapToPromptTemplate(data: any): PromptTemplate {
    return {
      id: data.id,
      key: data.key,
      category: data.category,
      name: data.name,
      description: data.description,
      template: data.template,
      variables: data.variables || [],
      language: data.language,
      isActive: data.is_active,
      version: data.version,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      createdBy: data.created_by,
      updatedBy: data.updated_by
    };
  }

  private mapToPromptTemplateVersions(data: any[]): PromptTemplateVersion[] {
    return data.map(item => ({
      id: item.id,
      templateId: item.template_id,
      version: item.version,
      template: item.template,
      variables: item.variables || [],
      changeDescription: item.change_description,
      createdAt: new Date(item.created_at),
      createdBy: item.created_by
    }));
  }

  private mapToPromptCategories(data: any[]): PromptCategory[] {
    return data.map(item => ({
      id: item.id,
      key: item.key,
      name: item.name,
      description: item.description,
      icon: item.icon,
      color: item.color,
      displayOrder: item.display_order
    }));
  }
}
*/

// Use mock service for now since database tables don't exist yet
// Once tables are created, uncomment the class above and switch to: new PromptTemplateService()
export const promptTemplateService = promptTemplateServiceMock;