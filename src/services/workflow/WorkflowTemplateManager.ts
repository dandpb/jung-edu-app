/**
 * Workflow Template Manager Service for jaqEdu Platform
 * 
 * Comprehensive service for managing workflow templates including:
 * - Template CRUD operations
 * - Template sharing and permissions
 * - Template analytics and usage tracking
 * - Integration with the template engine
 */

import { 
  WorkflowTemplate, 
  TemplateInstantiation,
  TemplateReview,
  WorkflowTemplateCategory
} from '../../types/workflow';
import { WorkflowTemplateEngine } from './WorkflowTemplateEngine';
import { workflowTemplates } from '../../data/workflowTemplates';

export interface TemplateSearchFilters {
  category?: WorkflowTemplateCategory;
  tags?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  isPublic?: boolean;
  search?: string;
  minRating?: number;
  author?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface TemplatePaginationOptions {
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'created_at' | 'usage_count' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

export interface TemplatePermission {
  userId: string;
  templateId: string;
  permission: 'view' | 'edit' | 'admin';
  grantedBy: string;
  grantedAt: Date;
}

export interface TemplateAnalytics {
  templateId: string;
  totalUsage: number;
  uniqueUsers: number;
  successRate: number;
  averageExecutionTime: number;
  popularVariableConfigurations: Array<{
    configuration: Record<string, any>;
    usageCount: number;
  }>;
  usageTrends: Array<{
    date: Date;
    count: number;
  }>;
  performanceMetrics: {
    averageCompletionTime: number;
    failureRate: number;
    retryRate: number;
  };
}

export interface TemplateUsageStats {
  totalTemplates: number;
  publicTemplates: number;
  privateTemplates: number;
  totalInstantiations: number;
  categoryCounts: Record<WorkflowTemplateCategory, number>;
  topTemplates: Array<{
    template: WorkflowTemplate;
    usageCount: number;
    rating: number;
  }>;
  recentActivity: Array<{
    templateId: string;
    templateName: string;
    action: 'created' | 'updated' | 'instantiated' | 'reviewed';
    userId: string;
    timestamp: Date;
  }>;
}

export class WorkflowTemplateManager {
  private templateEngine: WorkflowTemplateEngine;
  private templates: Map<string, WorkflowTemplate> = new Map();
  private permissions: Map<string, TemplatePermission[]> = new Map();
  private reviews: Map<string, TemplateReview[]> = new Map();
  private analytics: Map<string, TemplateAnalytics> = new Map();
  private activityLog: Array<{
    templateId: string;
    templateName: string;
    action: 'created' | 'updated' | 'instantiated' | 'reviewed';
    userId: string;
    timestamp: Date;
    metadata?: Record<string, any>;
  }> = [];

  constructor() {
    this.templateEngine = new WorkflowTemplateEngine();
    this.initializeTemplates();
  }

  // ============================================================================
  // Template CRUD Operations
  // ============================================================================

  /**
   * Create a new workflow template
   */
  async createTemplate(
    template: Omit<WorkflowTemplate, 'id' | 'created_at' | 'updated_at' | 'usage_count'>,
    userId: string
  ): Promise<string> {
    try {
      // Register with template engine for validation
      const templateId = await this.templateEngine.registerTemplate(template);
      
      // Create full template object
      const fullTemplate: WorkflowTemplate = {
        ...template,
        id: templateId,
        created_at: new Date(),
        updated_at: new Date(),
        usage_count: 0,
        created_by: userId
      };

      // Store locally
      this.templates.set(templateId, fullTemplate);

      // Set default permissions (creator has admin access)
      this.setTemplatePermission(templateId, userId, 'admin', 'system');

      // Log activity
      this.logActivity(templateId, template.name, 'created', userId);

      // Initialize analytics
      this.analytics.set(templateId, {
        templateId,
        totalUsage: 0,
        uniqueUsers: 0,
        successRate: 0,
        averageExecutionTime: 0,
        popularVariableConfigurations: [],
        usageTrends: [],
        performanceMetrics: {
          averageCompletionTime: 0,
          failureRate: 0,
          retryRate: 0
        }
      });

      return templateId;
    } catch (error: any) {
      throw new Error(`Failed to create template: ${error.message}`);
    }
  }

  /**
   * Get template by ID with permission check
   */
  async getTemplate(templateId: string, userId?: string): Promise<WorkflowTemplate | null> {
    const template = this.templates.get(templateId);
    if (!template) return null;

    // Check permissions for private templates
    if (!template.isPublic && userId) {
      const hasPermission = await this.checkTemplatePermission(templateId, userId, 'view');
      if (!hasPermission) {
        throw new Error('Access denied: Insufficient permissions to view this template');
      }
    } else if (!template.isPublic && !userId) {
      throw new Error('Access denied: Authentication required for private templates');
    }

    return template;
  }

  /**
   * Update existing template
   */
  async updateTemplate(
    templateId: string,
    updates: Partial<WorkflowTemplate>,
    userId: string
  ): Promise<void> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Check edit permissions
    const hasPermission = await this.checkTemplatePermission(templateId, userId, 'edit');
    if (!hasPermission) {
      throw new Error('Access denied: Insufficient permissions to edit this template');
    }

    const updatedTemplate = {
      ...template,
      ...updates,
      id: templateId, // Prevent ID changes
      updated_at: new Date()
    };

    // Validate updated template
    await this.templateEngine.updateTemplate(templateId, updatedTemplate);
    
    // Store locally
    this.templates.set(templateId, updatedTemplate);

    // Log activity
    this.logActivity(templateId, updatedTemplate.name, 'updated', userId, {
      fields: Object.keys(updates)
    });
  }

  /**
   * Delete template
   */
  async deleteTemplate(templateId: string, userId: string): Promise<void> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Check admin permissions
    const hasPermission = await this.checkTemplatePermission(templateId, userId, 'admin');
    if (!hasPermission) {
      throw new Error('Access denied: Admin permissions required to delete templates');
    }

    // Delete from engine
    await this.templateEngine.deleteTemplate(templateId);

    // Clean up local data
    this.templates.delete(templateId);
    this.permissions.delete(templateId);
    this.reviews.delete(templateId);
    this.analytics.delete(templateId);

    // Log activity
    this.logActivity(templateId, template.name, 'updated', userId);
  }

  /**
   * Search and filter templates
   */
  async searchTemplates(
    filters: TemplateSearchFilters = {},
    pagination: TemplatePaginationOptions = {},
    userId?: string
  ): Promise<{
    templates: WorkflowTemplate[];
    total: number;
    hasMore: boolean;
  }> {
    let filteredTemplates = Array.from(this.templates.values());

    // Apply access control - only include accessible templates
    if (userId) {
      filteredTemplates = filteredTemplates.filter(template => 
        template.isPublic || this.hasTemplateAccess(template.id, userId)
      );
    } else {
      filteredTemplates = filteredTemplates.filter(template => template.isPublic);
    }

    // Apply filters
    if (filters.category) {
      filteredTemplates = filteredTemplates.filter(t => t.category === filters.category);
    }

    if (filters.difficulty) {
      filteredTemplates = filteredTemplates.filter(t => t.difficulty === filters.difficulty);
    }

    if (filters.tags && filters.tags.length > 0) {
      filteredTemplates = filteredTemplates.filter(t =>
        filters.tags!.some(tag => t.tags.includes(tag))
      );
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredTemplates = filteredTemplates.filter(t =>
        t.name.toLowerCase().includes(searchLower) ||
        t.description.toLowerCase().includes(searchLower) ||
        t.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    if (filters.minRating) {
      filteredTemplates = filteredTemplates.filter(t => (t.rating || 0) >= filters.minRating!);
    }

    if (filters.author) {
      filteredTemplates = filteredTemplates.filter(t => t.created_by === filters.author);
    }

    if (filters.dateRange) {
      filteredTemplates = filteredTemplates.filter(t =>
        t.created_at >= filters.dateRange!.start && t.created_at <= filters.dateRange!.end
      );
    }

    // Apply sorting
    const sortBy = pagination.sortBy || 'created_at';
    const sortOrder = pagination.sortOrder || 'desc';

    filteredTemplates.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'usage_count':
          aValue = a.usage_count;
          bValue = b.usage_count;
          break;
        case 'rating':
          aValue = a.rating || 0;
          bValue = b.rating || 0;
          break;
        case 'created_at':
        default:
          aValue = a.created_at.getTime();
          bValue = b.created_at.getTime();
          break;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    // Apply pagination
    const total = filteredTemplates.length;
    const limit = pagination.limit || 50;
    const offset = pagination.offset || 0;
    
    const paginatedTemplates = filteredTemplates.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    return {
      templates: paginatedTemplates,
      total,
      hasMore
    };
  }

  // ============================================================================
  // Template Instantiation
  // ============================================================================

  /**
   * Create instance from template
   */
  async instantiateTemplate(
    templateId: string,
    variables: Record<string, any>,
    userId: string,
    options?: { execute?: boolean; instanceName?: string }
  ): Promise<TemplateInstantiation> {
    const template = await this.getTemplate(templateId, userId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Create instantiation through engine
    const { instance, workflow } = await this.templateEngine.instantiateTemplate(
      templateId,
      variables,
      userId,
      options
    );

    // Update template usage count and analytics
    template.usage_count++;
    template.updated_at = new Date();
    this.templates.set(templateId, template);

    // Update analytics
    await this.updateTemplateAnalytics(templateId, {
      instantiation: instance,
      userId,
      variables
    });

    // Log activity
    this.logActivity(templateId, template.name, 'instantiated', userId, {
      instanceId: instance.instance_id,
      variableCount: Object.keys(variables).length
    });

    return instance;
  }

  /**
   * Get template instantiations for a user
   */
  async getUserTemplateInstantiations(
    userId: string,
    templateId?: string
  ): Promise<TemplateInstantiation[]> {
    // In a real implementation, this would query the database
    // For now, we'll return empty array as this is just the service layer
    return [];
  }

  // ============================================================================
  // Template Permissions
  // ============================================================================

  /**
   * Set template permission for user
   */
  async setTemplatePermission(
    templateId: string,
    userId: string,
    permission: 'view' | 'edit' | 'admin',
    grantedBy: string
  ): Promise<void> {
    const permissions = this.permissions.get(templateId) || [];
    
    // Remove existing permission for this user
    const filteredPermissions = permissions.filter(p => p.userId !== userId);
    
    // Add new permission
    const newPermission: TemplatePermission = {
      userId,
      templateId,
      permission,
      grantedBy,
      grantedAt: new Date()
    };

    filteredPermissions.push(newPermission);
    this.permissions.set(templateId, filteredPermissions);

    // Log activity
    this.logActivity(templateId, '', 'updated', grantedBy, {
      targetUser: userId,
      permission
    });
  }

  /**
   * Check if user has specific permission
   */
  async checkTemplatePermission(
    templateId: string,
    userId: string,
    requiredPermission: 'view' | 'edit' | 'admin'
  ): Promise<boolean> {
    const template = this.templates.get(templateId);
    if (!template) return false;

    // Template owner has all permissions
    if (template.created_by === userId) return true;

    // Public templates have view permission for everyone
    if (template.isPublic && requiredPermission === 'view') return true;

    // Check explicit permissions
    const permissions = this.permissions.get(templateId) || [];
    const userPermission = permissions.find(p => p.userId === userId);
    
    if (!userPermission) return false;

    // Permission hierarchy: admin > edit > view
    const permissionLevels = { view: 1, edit: 2, admin: 3 };
    const userLevel = permissionLevels[userPermission.permission];
    const requiredLevel = permissionLevels[requiredPermission];

    return userLevel >= requiredLevel;
  }

  /**
   * Get template permissions
   */
  async getTemplatePermissions(templateId: string, userId: string): Promise<TemplatePermission[]> {
    const hasAdmin = await this.checkTemplatePermission(templateId, userId, 'admin');
    if (!hasAdmin) {
      throw new Error('Access denied: Admin permissions required to view template permissions');
    }

    return this.permissions.get(templateId) || [];
  }

  /**
   * Remove template permission
   */
  async removeTemplatePermission(
    templateId: string,
    targetUserId: string,
    requestingUserId: string
  ): Promise<void> {
    const hasAdmin = await this.checkTemplatePermission(templateId, requestingUserId, 'admin');
    if (!hasAdmin) {
      throw new Error('Access denied: Admin permissions required to remove permissions');
    }

    const permissions = this.permissions.get(templateId) || [];
    const filteredPermissions = permissions.filter(p => p.userId !== targetUserId);
    this.permissions.set(templateId, filteredPermissions);

    // Log activity
    this.logActivity(templateId, '', 'updated', requestingUserId, {
      targetUser: targetUserId
    });
  }

  // ============================================================================
  // Template Reviews and Ratings
  // ============================================================================

  /**
   * Add template review
   */
  async addTemplateReview(
    templateId: string,
    review: Omit<TemplateReview, 'id' | 'created_at' | 'helpful_count'>,
    userId: string
  ): Promise<string> {
    const template = await this.getTemplate(templateId, userId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const reviewId = `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const fullReview: TemplateReview = {
      ...review,
      id: reviewId,
      created_at: new Date(),
      helpful_count: 0
    };

    const templateReviews = this.reviews.get(templateId) || [];
    templateReviews.push(fullReview);
    this.reviews.set(templateId, templateReviews);

    // Update template average rating
    await this.updateTemplateRating(templateId);

    // Log activity
    this.logActivity(templateId, template.name, 'reviewed', userId, {
      rating: review.rating,
      reviewId
    });

    return reviewId;
  }

  /**
   * Get template reviews
   */
  async getTemplateReviews(
    templateId: string,
    userId?: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ reviews: TemplateReview[]; total: number }> {
    const template = await this.getTemplate(templateId, userId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const allReviews = this.reviews.get(templateId) || [];
    const paginatedReviews = allReviews
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(offset, offset + limit);

    return {
      reviews: paginatedReviews,
      total: allReviews.length
    };
  }

  /**
   * Update template rating based on reviews
   */
  private async updateTemplateRating(templateId: string): Promise<void> {
    const reviews = this.reviews.get(templateId) || [];
    if (reviews.length === 0) return;

    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
    
    const template = this.templates.get(templateId);
    if (template) {
      template.rating = Math.round(averageRating * 10) / 10; // Round to 1 decimal
      template.reviews = reviews;
      this.templates.set(templateId, template);
    }
  }

  // ============================================================================
  // Analytics and Usage Tracking
  // ============================================================================

  /**
   * Get template analytics
   */
  async getTemplateAnalytics(templateId: string, userId: string): Promise<TemplateAnalytics | null> {
    const hasPermission = await this.checkTemplatePermission(templateId, userId, 'view');
    if (!hasPermission) {
      throw new Error('Access denied: Permission required to view template analytics');
    }

    return this.analytics.get(templateId) || null;
  }

  /**
   * Update template analytics
   */
  private async updateTemplateAnalytics(
    templateId: string,
    data: {
      instantiation: TemplateInstantiation;
      userId: string;
      variables: Record<string, any>;
    }
  ): Promise<void> {
    const analytics = this.analytics.get(templateId) || {
      templateId,
      totalUsage: 0,
      uniqueUsers: 0,
      successRate: 0,
      averageExecutionTime: 0,
      popularVariableConfigurations: [],
      usageTrends: [],
      performanceMetrics: {
        averageCompletionTime: 0,
        failureRate: 0,
        retryRate: 0
      }
    };

    // Update usage statistics
    analytics.totalUsage++;
    
    // Update usage trends (daily aggregation)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingTrend = analytics.usageTrends.find(
      trend => trend.date.getTime() === today.getTime()
    );
    
    if (existingTrend) {
      existingTrend.count++;
    } else {
      analytics.usageTrends.push({ date: today, count: 1 });
    }

    // Keep only last 30 days of trends
    analytics.usageTrends = analytics.usageTrends
      .filter(trend => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return trend.date >= thirtyDaysAgo;
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    // Update popular variable configurations
    const configKey = JSON.stringify(data.variables);
    const existingConfig = analytics.popularVariableConfigurations.find(
      config => JSON.stringify(config.configuration) === configKey
    );

    if (existingConfig) {
      existingConfig.usageCount++;
    } else {
      analytics.popularVariableConfigurations.push({
        configuration: data.variables,
        usageCount: 1
      });
    }

    // Sort configurations by usage and keep top 10
    analytics.popularVariableConfigurations = analytics.popularVariableConfigurations
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10);

    this.analytics.set(templateId, analytics);
  }

  /**
   * Get overall template usage statistics
   */
  async getTemplateUsageStats(userId?: string): Promise<TemplateUsageStats> {
    const allTemplates = Array.from(this.templates.values());
    const accessibleTemplates = userId
      ? allTemplates.filter(t => t.isPublic || this.hasTemplateAccess(t.id, userId))
      : allTemplates.filter(t => t.isPublic);

    const stats: TemplateUsageStats = {
      totalTemplates: accessibleTemplates.length,
      publicTemplates: accessibleTemplates.filter(t => t.isPublic).length,
      privateTemplates: accessibleTemplates.filter(t => !t.isPublic).length,
      totalInstantiations: accessibleTemplates.reduce((sum, t) => sum + t.usage_count, 0),
      categoryCounts: {} as Record<WorkflowTemplateCategory, number>,
      topTemplates: accessibleTemplates
        .sort((a, b) => {
          const aScore = (a.rating || 0) * 0.7 + a.usage_count * 0.3;
          const bScore = (b.rating || 0) * 0.7 + b.usage_count * 0.3;
          return bScore - aScore;
        })
        .slice(0, 10)
        .map(template => ({
          template,
          usageCount: template.usage_count,
          rating: template.rating || 0
        })),
      recentActivity: this.activityLog
        .filter(activity => {
          const template = this.templates.get(activity.templateId);
          return template && (template.isPublic || (userId && this.hasTemplateAccess(template.id, userId)));
        })
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 20)
    };

    // Calculate category counts
    const categories: WorkflowTemplateCategory[] = [
      'enrollment', 'assessment', 'progress_tracking', 'certification',
      'communication', 'jung_psychology', 'content_delivery', 'adaptive_learning',
      'gamification', 'analytics'
    ];

    categories.forEach(category => {
      stats.categoryCounts[category] = accessibleTemplates.filter(t => t.category === category).length;
    });

    return stats;
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Check if user has access to template (helper method)
   */
  private hasTemplateAccess(templateId: string, userId: string): boolean {
    const template = this.templates.get(templateId);
    if (!template) return false;

    if (template.created_by === userId) return true;
    
    const permissions = this.permissions.get(templateId) || [];
    return permissions.some(p => p.userId === userId);
  }

  /**
   * Log activity (helper method)
   */
  private logActivity(
    templateId: string,
    templateName: string,
    action: 'created' | 'updated' | 'instantiated' | 'reviewed',
    userId: string,
    metadata?: Record<string, any>
  ): void {
    this.activityLog.push({
      templateId,
      templateName,
      action,
      userId,
      timestamp: new Date(),
      metadata
    });

    // Keep only last 1000 activities
    if (this.activityLog.length > 1000) {
      this.activityLog = this.activityLog.slice(-1000);
    }
  }

  /**
   * Initialize default templates
   */
  private initializeTemplates(): void {
    workflowTemplates.forEach(template => {
      this.templates.set(template.id, template);
      
      // Initialize analytics for each template
      this.analytics.set(template.id, {
        templateId: template.id,
        totalUsage: template.usage_count,
        uniqueUsers: Math.floor(template.usage_count * 0.7), // Estimate
        successRate: 0.85, // Default success rate
        averageExecutionTime: template.estimatedDuration * 60000, // Convert to milliseconds
        popularVariableConfigurations: [],
        usageTrends: [],
        performanceMetrics: {
          averageCompletionTime: template.estimatedDuration * 60000,
          failureRate: 0.15,
          retryRate: 0.05
        }
      });
    });
  }

  /**
   * Get template recommendations for user
   */
  async getTemplateRecommendations(
    userId: string,
    context?: {
      completedModules?: string[];
      currentDifficulty?: 'beginner' | 'intermediate' | 'advanced';
      interests?: string[];
      role?: 'student' | 'instructor' | 'admin';
    }
  ): Promise<WorkflowTemplate[]> {
    return this.templateEngine.recommendTemplates({
      completedModules: context?.completedModules,
      currentDifficulty: context?.currentDifficulty,
      interests: context?.interests,
      role: context?.role
    });
  }

  /**
   * Export template for sharing
   */
  async exportTemplate(templateId: string, userId: string): Promise<string> {
    const template = await this.getTemplate(templateId, userId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const hasPermission = await this.checkTemplatePermission(templateId, userId, 'view');
    if (!hasPermission) {
      throw new Error('Access denied: Permission required to export template');
    }

    // Create exportable version (remove sensitive data)
    const exportData = {
      ...template,
      created_by: 'exported',
      usage_count: 0,
      rating: undefined,
      reviews: undefined
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import template from JSON
   */
  async importTemplate(
    templateData: string,
    userId: string,
    options?: { makePrivate?: boolean; newName?: string }
  ): Promise<string> {
    try {
      const parsedTemplate = JSON.parse(templateData) as WorkflowTemplate;
      
      // Validate required fields
      if (!parsedTemplate.name || !parsedTemplate.definition) {
        throw new Error('Invalid template data: Missing required fields');
      }

      // Create new template from imported data
      const importedTemplate: Omit<WorkflowTemplate, 'id' | 'created_at' | 'updated_at' | 'usage_count'> = {
        ...parsedTemplate,
        name: options?.newName || `${parsedTemplate.name} (Imported)`,
        isPublic: options?.makePrivate ? false : parsedTemplate.isPublic,
        created_by: userId
      };

      return await this.createTemplate(importedTemplate, userId);
    } catch (error: any) {
      throw new Error(`Failed to import template: ${error.message}`);
    }
  }
}

export default WorkflowTemplateManager;