/**
 * Workflow Templates Admin Page
 * 
 * Administrative interface for managing workflow templates:
 * - Browse and search templates
 * - Create new templates
 * - Edit existing templates
 * - View template analytics
 * - Manage permissions
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  WorkflowTemplate, 
  WorkflowTemplateCategory 
} from '../../types/workflow';
import { WorkflowTemplateManager, TemplateSearchFilters } from '../../services/workflow';
import { WorkflowTemplateBuilder } from '../../components/workflow';

interface WorkflowTemplatesPageProps {
  className?: string;
}

interface TemplateCardProps {
  template: WorkflowTemplate;
  onEdit: (template: WorkflowTemplate) => void;
  onView: (template: WorkflowTemplate) => void;
  onDelete: (templateId: string) => void;
  onAnalytics: (template: WorkflowTemplate) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ 
  template, 
  onEdit, 
  onView, 
  onDelete, 
  onAnalytics 
}) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: WorkflowTemplateCategory) => {
    const colors = {
      'enrollment': 'bg-blue-100 text-blue-800',
      'assessment': 'bg-purple-100 text-purple-800',
      'progress_tracking': 'bg-indigo-100 text-indigo-800',
      'jung_psychology': 'bg-pink-100 text-pink-800',
      'certification': 'bg-emerald-100 text-emerald-800',
      'communication': 'bg-cyan-100 text-cyan-800',
      'content_delivery': 'bg-orange-100 text-orange-800',
      'adaptive_learning': 'bg-violet-100 text-violet-800',
      'gamification': 'bg-lime-100 text-lime-800',
      'analytics': 'bg-teal-100 text-teal-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <span className="text-2xl mr-3">{template.icon}</span>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
            <p className="text-sm text-gray-500 mt-1">{template.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {template.rating && (
            <div className="flex items-center">
              <span className="text-yellow-400">★</span>
              <span className="text-sm text-gray-600 ml-1">{template.rating}</span>
            </div>
          )}
          {template.isPublic ? (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Public</span>
          ) : (
            <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">Private</span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(template.category)}`}>
          {template.category.replace('_', ' ')}
        </span>
        <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(template.difficulty)}`}>
          {template.difficulty}
        </span>
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
          ~{template.estimatedDuration}min
        </span>
      </div>

      <div className="flex flex-wrap gap-1 mb-4">
        {template.tags.slice(0, 3).map((tag, index) => (
          <span key={index} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">
            #{tag}
          </span>
        ))}
        {template.tags.length > 3 && (
          <span className="text-xs text-gray-500 px-2 py-1">
            +{template.tags.length - 3} more
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <span>Used {template.usage_count} times</span>
        <span>Created {template.created_at.toLocaleDateString()}</span>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => onView(template)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          View Details
        </button>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onAnalytics(template)}
            className="text-gray-600 hover:text-gray-800 text-sm"
          >
            Analytics
          </button>
          <button
            onClick={() => onEdit(template)}
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(template.id)}
            className="text-red-600 hover:text-red-800 text-sm font-medium"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export const WorkflowTemplatesPage: React.FC<WorkflowTemplatesPageProps> = ({ className = '' }) => {
  // ============================================================================
  // State Management
  // ============================================================================

  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [templateManager] = useState(() => new WorkflowTemplateManager());

  // UI State
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [activeView, setActiveView] = useState<'grid' | 'list'>('grid');

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<WorkflowTemplateCategory | ''>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'beginner' | 'intermediate' | 'advanced' | ''>('');
  const [showPublicOnly, setShowPublicOnly] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTemplates, setTotalTemplates] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const templatesPerPage = 12;

  // ============================================================================
  // Data Loading
  // ============================================================================

  const loadTemplates = useCallback(async (page: number = 1) => {
    setLoading(true);
    setError(null);

    try {
      const filters: TemplateSearchFilters = {
        search: searchQuery || undefined,
        category: selectedCategory || undefined,
        difficulty: selectedDifficulty || undefined,
        isPublic: showPublicOnly ? true : undefined
      };

      const pagination = {
        limit: templatesPerPage,
        offset: (page - 1) * templatesPerPage,
        sortBy: 'updated_at' as const,
        sortOrder: 'desc' as const
      };

      const result = await templateManager.searchTemplates(filters, pagination, 'admin');
      
      if (page === 1) {
        setTemplates(result.templates);
      } else {
        setTemplates(prev => [...prev, ...result.templates]);
      }
      
      setTotalTemplates(result.total);
      setHasMore(result.hasMore);
    } catch (error: any) {
      console.error('Failed to load templates:', error);
      setError(error.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedDifficulty, showPublicOnly, templateManager]);

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleCreateTemplate = useCallback(() => {
    setSelectedTemplate(null);
    setIsCreateMode(true);
    setIsBuilderOpen(true);
  }, []);

  const handleEditTemplate = useCallback((template: WorkflowTemplate) => {
    setSelectedTemplate(template);
    setIsCreateMode(false);
    setIsBuilderOpen(true);
  }, []);

  const handleViewTemplate = useCallback((template: WorkflowTemplate) => {
    setSelectedTemplate(template);
    setIsCreateMode(false);
    setIsBuilderOpen(true);
  }, []);

  const handleDeleteTemplate = useCallback(async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return;
    }

    try {
      await templateManager.deleteTemplate(templateId, 'admin');
      setTemplates(prev => prev.filter(t => t.id !== templateId));
    } catch (error: any) {
      console.error('Failed to delete template:', error);
      alert(`Failed to delete template: ${error.message}`);
    }
  }, [templateManager]);

  const handleSaveTemplate = useCallback(async (template: WorkflowTemplate) => {
    try {
      if (isCreateMode) {
        await templateManager.createTemplate({
          name: template.name,
          description: template.description,
          version: template.version,
          category: template.category,
          icon: template.icon,
          tags: template.tags,
          isPublic: template.isPublic,
          difficulty: template.difficulty,
          estimatedDuration: template.estimatedDuration,
          definition: template.definition,
          variables: template.variables,
          metadata: template.metadata
        }, 'admin');
      } else {
        await templateManager.updateTemplate(template.id, template, 'admin');
      }

      setIsBuilderOpen(false);
      setSelectedTemplate(null);
      loadTemplates(1); // Reload templates
    } catch (error: any) {
      console.error('Failed to save template:', error);
      alert(`Failed to save template: ${error.message}`);
    }
  }, [isCreateMode, templateManager, loadTemplates]);

  const handleCloseBuilder = useCallback(() => {
    setIsBuilderOpen(false);
    setSelectedTemplate(null);
    setIsCreateMode(false);
  }, []);

  const handleAnalytics = useCallback((template: WorkflowTemplate) => {
    // In a real implementation, this would open an analytics modal or navigate to analytics page
    alert(`Analytics for ${template.name} would be displayed here`);
  }, []);

  const handleLoadMore = useCallback(() => {
    loadTemplates(currentPage + 1);
    setCurrentPage(prev => prev + 1);
  }, [loadTemplates, currentPage]);

  // ============================================================================
  // Effects
  // ============================================================================

  useEffect(() => {
    setCurrentPage(1);
    loadTemplates(1);
  }, [loadTemplates]);

  // ============================================================================
  // Render Components
  // ============================================================================

  const renderFilters = () => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-64">
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Categories</option>
          <option value="enrollment">Enrollment</option>
          <option value="assessment">Assessment</option>
          <option value="progress_tracking">Progress Tracking</option>
          <option value="jung_psychology">Jung Psychology</option>
          <option value="certification">Certification</option>
          <option value="communication">Communication</option>
        </select>

        <select
          value={selectedDifficulty}
          onChange={(e) => setSelectedDifficulty(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Difficulties</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>

        <label className="flex items-center text-sm">
          <input
            type="checkbox"
            checked={showPublicOnly}
            onChange={(e) => setShowPublicOnly(e.target.checked)}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded mr-2"
          />
          Public only
        </label>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveView('grid')}
            className={`p-2 rounded ${activeView === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => setActiveView('list')}
            className={`p-2 rounded ${activeView === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );

  const renderTemplatesGrid = () => (
    <div className={`grid gap-6 ${activeView === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
      {templates.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          onEdit={handleEditTemplate}
          onView={handleViewTemplate}
          onDelete={handleDeleteTemplate}
          onAnalytics={handleAnalytics}
        />
      ))}
    </div>
  );

  const renderEmptyState = () => (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">📋</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
      <p className="text-gray-500 mb-6">
        {searchQuery || selectedCategory || selectedDifficulty
          ? 'Try adjusting your search filters'
          : 'Create your first workflow template to get started'}
      </p>
      <button
        onClick={handleCreateTemplate}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Create Template
      </button>
    </div>
  );

  // ============================================================================
  // Main Render
  // ============================================================================

  if (isBuilderOpen) {
    return (
      <WorkflowTemplateBuilder
        initialTemplate={selectedTemplate || undefined}
        onSave={handleSaveTemplate}
        onCancel={handleCloseBuilder}
        readonly={!isCreateMode && selectedTemplate?.created_by !== 'admin'}
        className="h-screen"
      />
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Workflow Templates</h1>
              <p className="text-gray-600 mt-1">
                Manage and create workflow templates for educational processes
              </p>
            </div>
            <button
              onClick={handleCreateTemplate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Template
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderFilters()}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {loading && templates.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : templates.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                Showing {templates.length} of {totalTemplates} templates
              </p>
            </div>

            {renderTemplatesGrid()}

            {hasMore && (
              <div className="text-center mt-8">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="px-6 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load More Templates'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default WorkflowTemplatesPage;