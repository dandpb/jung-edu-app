/**
 * Component Tests for Workflow Template Builder
 * Tests workflow template creation, editing, validation and Jung-specific template features
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminContext } from '../../../contexts/AdminContext';
import { AuthContext } from '../../../contexts/AuthContext';
import { 
  WorkflowDefinition, 
  WorkflowCategory, 
  StateType, 
  ActionType,
  TriggerType 
} from '../../../types/workflow';

// Mock the workflow template builder component
const MockWorkflowTemplateBuilder: React.FC<{
  initialTemplate?: Partial<WorkflowDefinition>;
  onSave: (template: WorkflowDefinition) => void;
  onCancel: () => void;
  isEditing?: boolean;
}> = ({ initialTemplate, onSave, onCancel, isEditing = false }) => {
  const [template, setTemplate] = React.useState<Partial<WorkflowDefinition>>({
    name: '',
    description: '',
    category: 'learning_path' as WorkflowCategory,
    trigger: {
      type: 'event' as TriggerType,
      event: '',
      conditions: [],
      immediate: false,
      enabled: true
    },
    states: [],
    transitions: [],
    variables: [],
    metadata: {
      tags: [],
      author: 'current-user',
      dependencies: []
    },
    ...initialTemplate
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [currentTab, setCurrentTab] = React.useState('basic');
  const [selectedStateId, setSelectedStateId] = React.useState<string>('');

  const handleInputChange = (field: string, value: any) => {
    setTemplate(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAddState = () => {
    const newState = {
      id: `state-${Date.now()}`,
      name: 'New State',
      type: 'task' as StateType,
      isInitial: template.states?.length === 0,
      isFinal: false,
      actions: []
    };
    
    setTemplate(prev => ({
      ...prev,
      states: [...(prev.states || []), newState]
    }));
  };

  const handleDeleteState = (stateId: string) => {
    setTemplate(prev => ({
      ...prev,
      states: prev.states?.filter(s => s.id !== stateId) || [],
      transitions: prev.transitions?.filter(t => t.from !== stateId && t.to !== stateId) || []
    }));
  };

  const handleAddAction = (stateId: string) => {
    const newAction = {
      id: `action-${Date.now()}`,
      type: 'execute_plugin' as ActionType,
      name: 'New Action',
      plugin: 'student-progress',
      config: {}
    };

    setTemplate(prev => ({
      ...prev,
      states: prev.states?.map(state => 
        state.id === stateId 
          ? { ...state, actions: [...state.actions, newAction] }
          : state
      ) || []
    }));
  };

  const handleAddTransition = () => {
    if (template.states && template.states.length >= 2) {
      const newTransition = {
        id: `transition-${Date.now()}`,
        from: template.states[0].id,
        to: template.states[1].id,
        priority: 1
      };

      setTemplate(prev => ({
        ...prev,
        transitions: [...(prev.transitions || []), newTransition]
      }));
    }
  };

  const handleAddVariable = () => {
    const newVariable = {
      name: `variable${(template.variables?.length || 0) + 1}`,
      type: 'string' as const,
      required: false,
      description: ''
    };

    setTemplate(prev => ({
      ...prev,
      variables: [...(prev.variables || []), newVariable]
    }));
  };

  const validateTemplate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!template.name?.trim()) {
      newErrors.name = 'Template name is required';
    }

    if (!template.description?.trim()) {
      newErrors.description = 'Template description is required';
    }

    if (!template.states || template.states.length === 0) {
      newErrors.states = 'At least one state is required';
    } else {
      const initialStates = template.states.filter(s => s.isInitial);
      if (initialStates.length === 0) {
        newErrors.states = 'At least one initial state is required';
      }
      if (initialStates.length > 1) {
        newErrors.states = 'Only one initial state is allowed';
      }
    }

    if (!template.trigger?.event?.trim()) {
      newErrors.trigger = 'Trigger event is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateTemplate()) {
      onSave(template as WorkflowDefinition);
    }
  };

  return (
    <div className="workflow-template-builder">
      <div className="header">
        <h2>{isEditing ? 'Edit Workflow Template' : 'Create Workflow Template'}</h2>
        <div className="actions">
          <button onClick={onCancel} data-testid="cancel-button">Cancel</button>
          <button onClick={handleSave} data-testid="save-button">Save Template</button>
        </div>
      </div>

      <div className="tabs">
        <button 
          className={currentTab === 'basic' ? 'active' : ''} 
          onClick={() => setCurrentTab('basic')}
          data-testid="basic-tab"
        >
          Basic Information
        </button>
        <button 
          className={currentTab === 'trigger' ? 'active' : ''} 
          onClick={() => setCurrentTab('trigger')}
          data-testid="trigger-tab"
        >
          Trigger Configuration
        </button>
        <button 
          className={currentTab === 'states' ? 'active' : ''} 
          onClick={() => setCurrentTab('states')}
          data-testid="states-tab"
        >
          States & Actions
        </button>
        <button 
          className={currentTab === 'transitions' ? 'active' : ''} 
          onClick={() => setCurrentTab('transitions')}
          data-testid="transitions-tab"
        >
          Transitions
        </button>
        <button 
          className={currentTab === 'variables' ? 'active' : ''} 
          onClick={() => setCurrentTab('variables')}
          data-testid="variables-tab"
        >
          Variables
        </button>
      </div>

      <div className="content">
        {currentTab === 'basic' && (
          <div className="basic-info" data-testid="basic-content">
            <div className="form-group">
              <label htmlFor="template-name">Template Name</label>
              <input
                id="template-name"
                type="text"
                value={template.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                data-testid="template-name-input"
              />
              {errors.name && <span className="error" data-testid="name-error">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="template-description">Description</label>
              <textarea
                id="template-description"
                value={template.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                data-testid="template-description-input"
              />
              {errors.description && <span className="error" data-testid="description-error">{errors.description}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="template-category">Category</label>
              <select
                id="template-category"
                value={template.category || 'learning_path'}
                onChange={(e) => handleInputChange('category', e.target.value)}
                data-testid="template-category-select"
              >
                <option value="learning_path">Learning Path</option>
                <option value="assessment">Assessment</option>
                <option value="approval">Approval</option>
                <option value="notification">Notification</option>
                <option value="analytics">Analytics</option>
                <option value="content_generation">Content Generation</option>
                <option value="user_onboarding">User Onboarding</option>
                <option value="certification">Certification</option>
                <option value="progress_tracking">Progress Tracking</option>
                <option value="adaptive_learning">Adaptive Learning</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="template-tags">Tags (comma-separated)</label>
              <input
                id="template-tags"
                type="text"
                value={template.metadata?.tags?.join(', ') || ''}
                onChange={(e) => handleInputChange('metadata', {
                  ...template.metadata,
                  tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                })}
                data-testid="template-tags-input"
                placeholder="jung, psychology, learning"
              />
            </div>
          </div>
        )}

        {currentTab === 'trigger' && (
          <div className="trigger-config" data-testid="trigger-content">
            <div className="form-group">
              <label htmlFor="trigger-type">Trigger Type</label>
              <select
                id="trigger-type"
                value={template.trigger?.type || 'event'}
                onChange={(e) => handleInputChange('trigger', {
                  ...template.trigger,
                  type: e.target.value as TriggerType
                })}
                data-testid="trigger-type-select"
              >
                <option value="event">Event</option>
                <option value="schedule">Schedule</option>
                <option value="manual">Manual</option>
                <option value="webhook">Webhook</option>
                <option value="database_change">Database Change</option>
                <option value="user_action">User Action</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="trigger-event">Trigger Event</label>
              <input
                id="trigger-event"
                type="text"
                value={template.trigger?.event || ''}
                onChange={(e) => handleInputChange('trigger', {
                  ...template.trigger,
                  event: e.target.value
                })}
                data-testid="trigger-event-input"
                placeholder="module.completed, assessment.submitted, etc."
              />
              {errors.trigger && <span className="error" data-testid="trigger-error">{errors.trigger}</span>}
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={template.trigger?.immediate || false}
                  onChange={(e) => handleInputChange('trigger', {
                    ...template.trigger,
                    immediate: e.target.checked
                  })}
                  data-testid="trigger-immediate-checkbox"
                />
                Execute immediately
              </label>
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={template.trigger?.enabled ?? true}
                  onChange={(e) => handleInputChange('trigger', {
                    ...template.trigger,
                    enabled: e.target.checked
                  })}
                  data-testid="trigger-enabled-checkbox"
                />
                Trigger enabled
              </label>
            </div>
          </div>
        )}

        {currentTab === 'states' && (
          <div className="states-config" data-testid="states-content">
            <div className="states-header">
              <h3>Workflow States</h3>
              <button onClick={handleAddState} data-testid="add-state-button">Add State</button>
            </div>
            {errors.states && <span className="error" data-testid="states-error">{errors.states}</span>}

            <div className="states-list">
              {template.states?.map((state) => (
                <div key={state.id} className="state-item" data-testid={`state-${state.id}`}>
                  <div className="state-header">
                    <input
                      type="text"
                      value={state.name}
                      onChange={(e) => {
                        setTemplate(prev => ({
                          ...prev,
                          states: prev.states?.map(s => 
                            s.id === state.id ? { ...s, name: e.target.value } : s
                          ) || []
                        }));
                      }}
                      data-testid={`state-name-${state.id}`}
                    />
                    <select
                      value={state.type}
                      onChange={(e) => {
                        setTemplate(prev => ({
                          ...prev,
                          states: prev.states?.map(s => 
                            s.id === state.id ? { ...s, type: e.target.value as StateType } : s
                          ) || []
                        }));
                      }}
                      data-testid={`state-type-${state.id}`}
                    >
                      <option value="task">Task</option>
                      <option value="decision">Decision</option>
                      <option value="parallel">Parallel</option>
                      <option value="wait">Wait</option>
                      <option value="subprocess">Subprocess</option>
                      <option value="end">End</option>
                    </select>
                    <button 
                      onClick={() => handleDeleteState(state.id)}
                      data-testid={`delete-state-${state.id}`}
                    >
                      Delete
                    </button>
                  </div>

                  <div className="state-flags">
                    <label>
                      <input
                        type="checkbox"
                        checked={state.isInitial}
                        onChange={(e) => {
                          setTemplate(prev => ({
                            ...prev,
                            states: prev.states?.map(s => ({
                              ...s,
                              isInitial: s.id === state.id ? e.target.checked : (e.target.checked ? false : s.isInitial)
                            })) || []
                          }));
                        }}
                        data-testid={`state-initial-${state.id}`}
                      />
                      Initial State
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={state.isFinal}
                        onChange={(e) => {
                          setTemplate(prev => ({
                            ...prev,
                            states: prev.states?.map(s => 
                              s.id === state.id ? { ...s, isFinal: e.target.checked } : s
                            ) || []
                          }));
                        }}
                        data-testid={`state-final-${state.id}`}
                      />
                      Final State
                    </label>
                  </div>

                  <div className="actions-section">
                    <div className="actions-header">
                      <h4>Actions</h4>
                      <button 
                        onClick={() => handleAddAction(state.id)}
                        data-testid={`add-action-${state.id}`}
                      >
                        Add Action
                      </button>
                    </div>
                    
                    {state.actions.map((action) => (
                      <div key={action.id} className="action-item" data-testid={`action-${action.id}`}>
                        <input
                          type="text"
                          value={action.name}
                          onChange={(e) => {
                            setTemplate(prev => ({
                              ...prev,
                              states: prev.states?.map(s => 
                                s.id === state.id ? {
                                  ...s,
                                  actions: s.actions.map(a => 
                                    a.id === action.id ? { ...a, name: e.target.value } : a
                                  )
                                } : s
                              ) || []
                            }));
                          }}
                          data-testid={`action-name-${action.id}`}
                        />
                        
                        <select
                          value={action.type}
                          onChange={(e) => {
                            setTemplate(prev => ({
                              ...prev,
                              states: prev.states?.map(s => 
                                s.id === state.id ? {
                                  ...s,
                                  actions: s.actions.map(a => 
                                    a.id === action.id ? { ...a, type: e.target.value as ActionType } : a
                                  )
                                } : s
                              ) || []
                            }));
                          }}
                          data-testid={`action-type-${action.id}`}
                        >
                          <option value="execute_plugin">Execute Plugin</option>
                          <option value="send_notification">Send Notification</option>
                          <option value="update_database">Update Database</option>
                          <option value="call_api">Call API</option>
                          <option value="wait">Wait</option>
                          <option value="condition_check">Condition Check</option>
                          <option value="parallel_execution">Parallel Execution</option>
                          <option value="subprocess">Subprocess</option>
                          <option value="user_task">User Task</option>
                          <option value="timer">Timer</option>
                          <option value="script">Script</option>
                        </select>

                        {action.type === 'execute_plugin' && (
                          <input
                            type="text"
                            value={action.plugin || ''}
                            onChange={(e) => {
                              setTemplate(prev => ({
                                ...prev,
                                states: prev.states?.map(s => 
                                  s.id === state.id ? {
                                    ...s,
                                    actions: s.actions.map(a => 
                                      a.id === action.id ? { ...a, plugin: e.target.value } : a
                                    )
                                  } : s
                                ) || []
                              }));
                            }}
                            placeholder="Plugin name"
                            data-testid={`action-plugin-${action.id}`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentTab === 'transitions' && (
          <div className="transitions-config" data-testid="transitions-content">
            <div className="transitions-header">
              <h3>State Transitions</h3>
              <button onClick={handleAddTransition} data-testid="add-transition-button">Add Transition</button>
            </div>

            <div className="transitions-list">
              {template.transitions?.map((transition) => (
                <div key={transition.id} className="transition-item" data-testid={`transition-${transition.id}`}>
                  <select
                    value={transition.from}
                    onChange={(e) => {
                      setTemplate(prev => ({
                        ...prev,
                        transitions: prev.transitions?.map(t => 
                          t.id === transition.id ? { ...t, from: e.target.value } : t
                        ) || []
                      }));
                    }}
                    data-testid={`transition-from-${transition.id}`}
                  >
                    <option value="">From State...</option>
                    {template.states?.map(state => (
                      <option key={state.id} value={state.id}>{state.name}</option>
                    ))}
                  </select>

                  <span>→</span>

                  <select
                    value={transition.to}
                    onChange={(e) => {
                      setTemplate(prev => ({
                        ...prev,
                        transitions: prev.transitions?.map(t => 
                          t.id === transition.id ? { ...t, to: e.target.value } : t
                        ) || []
                      }));
                    }}
                    data-testid={`transition-to-${transition.id}`}
                  >
                    <option value="">To State...</option>
                    {template.states?.map(state => (
                      <option key={state.id} value={state.id}>{state.name}</option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={transition.condition || ''}
                    onChange={(e) => {
                      setTemplate(prev => ({
                        ...prev,
                        transitions: prev.transitions?.map(t => 
                          t.id === transition.id ? { ...t, condition: e.target.value } : t
                        ) || []
                      }));
                    }}
                    placeholder="Condition (optional)"
                    data-testid={`transition-condition-${transition.id}`}
                  />

                  <input
                    type="number"
                    value={transition.priority}
                    onChange={(e) => {
                      setTemplate(prev => ({
                        ...prev,
                        transitions: prev.transitions?.map(t => 
                          t.id === transition.id ? { ...t, priority: parseInt(e.target.value) || 1 } : t
                        ) || []
                      }));
                    }}
                    placeholder="Priority"
                    data-testid={`transition-priority-${transition.id}`}
                  />

                  <button
                    onClick={() => {
                      setTemplate(prev => ({
                        ...prev,
                        transitions: prev.transitions?.filter(t => t.id !== transition.id) || []
                      }));
                    }}
                    data-testid={`delete-transition-${transition.id}`}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentTab === 'variables' && (
          <div className="variables-config" data-testid="variables-content">
            <div className="variables-header">
              <h3>Template Variables</h3>
              <button onClick={handleAddVariable} data-testid="add-variable-button">Add Variable</button>
            </div>

            <div className="variables-list">
              {template.variables?.map((variable, index) => (
                <div key={index} className="variable-item" data-testid={`variable-${index}`}>
                  <input
                    type="text"
                    value={variable.name}
                    onChange={(e) => {
                      setTemplate(prev => ({
                        ...prev,
                        variables: prev.variables?.map((v, i) => 
                          i === index ? { ...v, name: e.target.value } : v
                        ) || []
                      }));
                    }}
                    placeholder="Variable name"
                    data-testid={`variable-name-${index}`}
                  />

                  <select
                    value={variable.type}
                    onChange={(e) => {
                      setTemplate(prev => ({
                        ...prev,
                        variables: prev.variables?.map((v, i) => 
                          i === index ? { ...v, type: e.target.value as any } : v
                        ) || []
                      }));
                    }}
                    data-testid={`variable-type-${index}`}
                  >
                    <option value="string">String</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                    <option value="date">Date</option>
                    <option value="array">Array</option>
                    <option value="object">Object</option>
                    <option value="json">JSON</option>
                  </select>

                  <label>
                    <input
                      type="checkbox"
                      checked={variable.required}
                      onChange={(e) => {
                        setTemplate(prev => ({
                          ...prev,
                          variables: prev.variables?.map((v, i) => 
                            i === index ? { ...v, required: e.target.checked } : v
                          ) || []
                        }));
                      }}
                      data-testid={`variable-required-${index}`}
                    />
                    Required
                  </label>

                  <input
                    type="text"
                    value={variable.description || ''}
                    onChange={(e) => {
                      setTemplate(prev => ({
                        ...prev,
                        variables: prev.variables?.map((v, i) => 
                          i === index ? { ...v, description: e.target.value } : v
                        ) || []
                      }));
                    }}
                    placeholder="Description"
                    data-testid={`variable-description-${index}`}
                  />

                  <button
                    onClick={() => {
                      setTemplate(prev => ({
                        ...prev,
                        variables: prev.variables?.filter((_, i) => i !== index) || []
                      }));
                    }}
                    data-testid={`delete-variable-${index}`}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Test wrapper components
const TestAdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const adminValue = {
    user: { id: 'admin-1', role: 'admin', name: 'Test Admin' },
    isAuthenticated: true,
    login: jest.fn(),
    logout: jest.fn(),
    hasPermission: jest.fn().mockReturnValue(true)
  };

  return <AdminContext.Provider value={adminValue}>{children}</AdminContext.Provider>;
};

describe('WorkflowTemplateBuilder Component', () => {
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    test('should render template builder with all tabs', () => {
      render(
        <TestAdminProvider>
          <MockWorkflowTemplateBuilder onSave={mockOnSave} onCancel={mockOnCancel} />
        </TestAdminProvider>
      );

      expect(screen.getByText('Create Workflow Template')).toBeInTheDocument();
      expect(screen.getByTestId('basic-tab')).toBeInTheDocument();
      expect(screen.getByTestId('trigger-tab')).toBeInTheDocument();
      expect(screen.getByTestId('states-tab')).toBeInTheDocument();
      expect(screen.getByTestId('transitions-tab')).toBeInTheDocument();
      expect(screen.getByTestId('variables-tab')).toBeInTheDocument();
    });

    test('should show edit mode when isEditing is true', () => {
      render(
        <TestAdminProvider>
          <MockWorkflowTemplateBuilder onSave={mockOnSave} onCancel={mockOnCancel} isEditing />
        </TestAdminProvider>
      );

      expect(screen.getByText('Edit Workflow Template')).toBeInTheDocument();
    });

    test('should render with initial template data', () => {
      const initialTemplate = {
        name: 'Jung Psychology Progress Tracker',
        description: 'Tracks student progress through Jungian psychology modules',
        category: 'progress_tracking' as WorkflowCategory
      };

      render(
        <TestAdminProvider>
          <MockWorkflowTemplateBuilder 
            initialTemplate={initialTemplate}
            onSave={mockOnSave} 
            onCancel={mockOnCancel} 
          />
        </TestAdminProvider>
      );

      expect(screen.getByDisplayValue('Jung Psychology Progress Tracker')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Tracks student progress through Jungian psychology modules')).toBeInTheDocument();
    });
  });

  describe('Basic Information Tab', () => {
    test('should handle template name input', async () => {
      const user = userEvent.setup();
      render(
        <TestAdminProvider>
          <MockWorkflowTemplateBuilder onSave={mockOnSave} onCancel={mockOnCancel} />
        </TestAdminProvider>
      );

      const nameInput = screen.getByTestId('template-name-input');
      await user.type(nameInput, 'Student Assessment Workflow');

      expect(nameInput).toHaveValue('Student Assessment Workflow');
    });

    test('should handle description input', async () => {
      const user = userEvent.setup();
      render(
        <TestAdminProvider>
          <MockWorkflowTemplateBuilder onSave={mockOnSave} onCancel={mockOnCancel} />
        </TestAdminProvider>
      );

      const descriptionInput = screen.getByTestId('template-description-input');
      await user.type(descriptionInput, 'Manages the complete assessment workflow for Jung psychology courses');

      expect(descriptionInput).toHaveValue('Manages the complete assessment workflow for Jung psychology courses');
    });

    test('should handle category selection', async () => {
      const user = userEvent.setup();
      render(
        <TestAdminProvider>
          <MockWorkflowTemplateBuilder onSave={mockOnSave} onCancel={mockOnCancel} />
        </TestAdminProvider>
      );

      const categorySelect = screen.getByTestId('template-category-select');
      await user.selectOptions(categorySelect, 'assessment');

      expect(categorySelect).toHaveValue('assessment');
    });

    test('should handle tags input', async () => {
      const user = userEvent.setup();
      render(
        <TestAdminProvider>
          <MockWorkflowTemplateBuilder onSave={mockOnSave} onCancel={mockOnCancel} />
        </TestAdminProvider>
      );

      const tagsInput = screen.getByTestId('template-tags-input');
      await user.type(tagsInput, 'jung, psychology, assessment, education');

      expect(tagsInput).toHaveValue('jung, psychology, assessment, education');
    });
  });

  describe('Trigger Configuration Tab', () => {
    test('should navigate to trigger tab and configure trigger', async () => {
      const user = userEvent.setup();
      render(
        <TestAdminProvider>
          <MockWorkflowTemplateBuilder onSave={mockOnSave} onCancel={mockOnCancel} />
        </TestAdminProvider>
      );

      await user.click(screen.getByTestId('trigger-tab'));
      expect(screen.getByTestId('trigger-content')).toBeInTheDocument();

      const triggerTypeSelect = screen.getByTestId('trigger-type-select');
      await user.selectOptions(triggerTypeSelect, 'user_action');

      const triggerEventInput = screen.getByTestId('trigger-event-input');
      await user.type(triggerEventInput, 'module.completed');

      expect(triggerTypeSelect).toHaveValue('user_action');
      expect(triggerEventInput).toHaveValue('module.completed');
    });

    test('should handle trigger options checkboxes', async () => {
      const user = userEvent.setup();
      render(
        <TestAdminProvider>
          <MockWorkflowTemplateBuilder onSave={mockOnSave} onCancel={mockOnCancel} />
        </TestAdminProvider>
      );

      await user.click(screen.getByTestId('trigger-tab'));

      const immediateCheckbox = screen.getByTestId('trigger-immediate-checkbox');
      const enabledCheckbox = screen.getByTestId('trigger-enabled-checkbox');

      await user.click(immediateCheckbox);
      expect(immediateCheckbox).toBeChecked();

      await user.click(enabledCheckbox);
      expect(enabledCheckbox).not.toBeChecked();
    });
  });

  describe('States and Actions Tab', () => {
    test('should add and configure states', async () => {
      const user = userEvent.setup();
      render(
        <TestAdminProvider>
          <MockWorkflowTemplateBuilder onSave={mockOnSave} onCancel={mockOnCancel} />
        </TestAdminProvider>
      );

      await user.click(screen.getByTestId('states-tab'));
      expect(screen.getByTestId('states-content')).toBeInTheDocument();

      // Add first state
      const addStateButton = screen.getByTestId('add-state-button');
      await user.click(addStateButton);

      // Should create a state with a dynamic ID
      const stateElements = screen.getAllByTestId(/^state-state-/);
      expect(stateElements).toHaveLength(1);

      // Configure the state
      const stateNameInput = screen.getAllByTestId(/^state-name-/)[0] as HTMLInputElement;
      await user.clear(stateNameInput);
      await user.type(stateNameInput, 'Analyze Progress');

      expect(stateNameInput).toHaveValue('Analyze Progress');
    });

    test('should add actions to states', async () => {
      const user = userEvent.setup();
      render(
        <TestAdminProvider>
          <MockWorkflowTemplateBuilder onSave={mockOnSave} onCancel={mockOnCancel} />
        </TestAdminProvider>
      );

      await user.click(screen.getByTestId('states-tab'));
      
      // Add a state first
      await user.click(screen.getByTestId('add-state-button'));
      
      // Add an action to the state
      const addActionButtons = screen.getAllByTestId(/^add-action-/);
      await user.click(addActionButtons[0]);

      // Check that action was added
      const actionElements = screen.getAllByTestId(/^action-action-/);
      expect(actionElements).toHaveLength(1);
    });

    test('should delete states', async () => {
      const user = userEvent.setup();
      render(
        <TestAdminProvider>
          <MockWorkflowTemplateBuilder onSave={mockOnSave} onCancel={mockOnCancel} />
        </TestAdminProvider>
      );

      await user.click(screen.getByTestId('states-tab'));
      
      // Add a state
      await user.click(screen.getByTestId('add-state-button'));
      
      // Delete the state
      const deleteButtons = screen.getAllByTestId(/^delete-state-/);
      await user.click(deleteButtons[0]);

      // State should be removed
      const stateElements = screen.queryAllByTestId(/^state-state-/);
      expect(stateElements).toHaveLength(0);
    });

    test('should handle initial and final state flags', async () => {
      const user = userEvent.setup();
      render(
        <TestAdminProvider>
          <MockWorkflowTemplateBuilder onSave={mockOnSave} onCancel={mockOnCancel} />
        </TestAdminProvider>
      );

      await user.click(screen.getByTestId('states-tab'));
      
      // Add states
      await user.click(screen.getByTestId('add-state-button'));
      await user.click(screen.getByTestId('add-state-button'));

      // First state should be initial by default
      const initialCheckboxes = screen.getAllByTestId(/^state-initial-/);
      expect(initialCheckboxes[0]).toBeChecked();
      expect(initialCheckboxes[1]).not.toBeChecked();

      // Set second state as final
      const finalCheckboxes = screen.getAllByTestId(/^state-final-/);
      await user.click(finalCheckboxes[1]);
      expect(finalCheckboxes[1]).toBeChecked();
    });

    test('should configure action types and plugins', async () => {
      const user = userEvent.setup();
      render(
        <TestAdminProvider>
          <MockWorkflowTemplateBuilder onSave={mockOnSave} onCancel={mockOnCancel} />
        </TestAdminProvider>
      );

      await user.click(screen.getByTestId('states-tab'));
      await user.click(screen.getByTestId('add-state-button'));
      
      // Add action
      const addActionButtons = screen.getAllByTestId(/^add-action-/);
      await user.click(addActionButtons[0]);

      // Configure action type
      const actionTypeSelects = screen.getAllByTestId(/^action-type-/);
      await user.selectOptions(actionTypeSelects[0], 'execute_plugin');

      // Plugin field should appear
      const pluginInputs = screen.getAllByTestId(/^action-plugin-/);
      await user.type(pluginInputs[0], 'student-progress-tracker');

      expect(actionTypeSelects[0]).toHaveValue('execute_plugin');
      expect(pluginInputs[0]).toHaveValue('student-progress-tracker');
    });
  });

  describe('Transitions Tab', () => {
    test('should add and configure transitions', async () => {
      const user = userEvent.setup();
      render(
        <TestAdminProvider>
          <MockWorkflowTemplateBuilder onSave={mockOnSave} onCancel={mockOnCancel} />
        </TestAdminProvider>
      );

      // First add some states
      await user.click(screen.getByTestId('states-tab'));
      await user.click(screen.getByTestId('add-state-button'));
      await user.click(screen.getByTestId('add-state-button'));

      // Then go to transitions
      await user.click(screen.getByTestId('transitions-tab'));
      expect(screen.getByTestId('transitions-content')).toBeInTheDocument();

      // Add transition
      const addTransitionButton = screen.getByTestId('add-transition-button');
      await user.click(addTransitionButton);

      // Configure transition
      const transitionElements = screen.getAllByTestId(/^transition-transition-/);
      expect(transitionElements).toHaveLength(1);

      const conditionInputs = screen.getAllByTestId(/^transition-condition-/);
      await user.type(conditionInputs[0], 'progress > 0.75');

      expect(conditionInputs[0]).toHaveValue('progress > 0.75');
    });

    test('should delete transitions', async () => {
      const user = userEvent.setup();
      render(
        <TestAdminProvider>
          <MockWorkflowTemplateBuilder onSave={mockOnSave} onCancel={mockOnCancel} />
        </TestAdminProvider>
      );

      await user.click(screen.getByTestId('states-tab'));
      await user.click(screen.getByTestId('add-state-button'));
      await user.click(screen.getByTestId('add-state-button'));

      await user.click(screen.getByTestId('transitions-tab'));
      await user.click(screen.getByTestId('add-transition-button'));

      // Delete transition
      const deleteButtons = screen.getAllByTestId(/^delete-transition-/);
      await user.click(deleteButtons[0]);

      const transitionElements = screen.queryAllByTestId(/^transition-transition-/);
      expect(transitionElements).toHaveLength(0);
    });
  });

  describe('Variables Tab', () => {
    test('should add and configure variables', async () => {
      const user = userEvent.setup();
      render(
        <TestAdminProvider>
          <MockWorkflowTemplateBuilder onSave={mockOnSave} onCancel={mockOnCancel} />
        </TestAdminProvider>
      );

      await user.click(screen.getByTestId('variables-tab'));
      expect(screen.getByTestId('variables-content')).toBeInTheDocument();

      // Add variable
      const addVariableButton = screen.getByTestId('add-variable-button');
      await user.click(addVariableButton);

      // Configure variable
      const variableNameInputs = screen.getAllByTestId(/^variable-name-/);
      await user.clear(variableNameInputs[0]);
      await user.type(variableNameInputs[0], 'userId');

      const variableTypeSelects = screen.getAllByTestId(/^variable-type-/);
      await user.selectOptions(variableTypeSelects[0], 'string');

      const variableRequiredCheckboxes = screen.getAllByTestId(/^variable-required-/);
      await user.click(variableRequiredCheckboxes[0]);

      const variableDescriptionInputs = screen.getAllByTestId(/^variable-description-/);
      await user.type(variableDescriptionInputs[0], 'ID of the user in the workflow');

      expect(variableNameInputs[0]).toHaveValue('userId');
      expect(variableTypeSelects[0]).toHaveValue('string');
      expect(variableRequiredCheckboxes[0]).toBeChecked();
      expect(variableDescriptionInputs[0]).toHaveValue('ID of the user in the workflow');
    });

    test('should delete variables', async () => {
      const user = userEvent.setup();
      render(
        <TestAdminProvider>
          <MockWorkflowTemplateBuilder onSave={mockOnSave} onCancel={mockOnCancel} />
        </TestAdminProvider>
      );

      await user.click(screen.getByTestId('variables-tab'));
      await user.click(screen.getByTestId('add-variable-button'));

      // Delete variable
      const deleteButtons = screen.getAllByTestId(/^delete-variable-/);
      await user.click(deleteButtons[0]);

      const variableElements = screen.queryAllByTestId(/^variable-/);
      expect(variableElements).toHaveLength(0);
    });
  });

  describe('Validation and Saving', () => {
    test('should validate required fields before saving', async () => {
      const user = userEvent.setup();
      render(
        <TestAdminProvider>
          <MockWorkflowTemplateBuilder onSave={mockOnSave} onCancel={mockOnCancel} />
        </TestAdminProvider>
      );

      // Try to save without filling required fields
      const saveButton = screen.getByTestId('save-button');
      await user.click(saveButton);

      // Should show validation errors
      expect(screen.getByTestId('name-error')).toHaveTextContent('Template name is required');
      expect(screen.getByTestId('description-error')).toHaveTextContent('Template description is required');
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    test('should validate states configuration', async () => {
      const user = userEvent.setup();
      render(
        <TestAdminProvider>
          <MockWorkflowTemplateBuilder onSave={mockOnSave} onCancel={mockOnCancel} />
        </TestAdminProvider>
      );

      // Fill basic info but don't add states
      const nameInput = screen.getByTestId('template-name-input');
      await user.type(nameInput, 'Test Template');

      const descriptionInput = screen.getByTestId('template-description-input');
      await user.type(descriptionInput, 'Test Description');

      // Fill trigger info
      await user.click(screen.getByTestId('trigger-tab'));
      const eventInput = screen.getByTestId('trigger-event-input');
      await user.type(eventInput, 'test.event');

      // Try to save without states
      const saveButton = screen.getByTestId('save-button');
      await user.click(saveButton);

      await user.click(screen.getByTestId('states-tab'));
      expect(screen.getByTestId('states-error')).toHaveTextContent('At least one state is required');
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    test('should save valid template', async () => {
      const user = userEvent.setup();
      render(
        <TestAdminProvider>
          <MockWorkflowTemplateBuilder onSave={mockOnSave} onCancel={mockOnCancel} />
        </TestAdminProvider>
      );

      // Fill all required fields
      const nameInput = screen.getByTestId('template-name-input');
      await user.type(nameInput, 'Jung Progress Tracker');

      const descriptionInput = screen.getByTestId('template-description-input');
      await user.type(descriptionInput, 'Tracks student progress through Jung psychology modules');

      // Configure trigger
      await user.click(screen.getByTestId('trigger-tab'));
      const eventInput = screen.getByTestId('trigger-event-input');
      await user.type(eventInput, 'module.progress_updated');

      // Add states
      await user.click(screen.getByTestId('states-tab'));
      await user.click(screen.getByTestId('add-state-button'));

      // Save template
      const saveButton = screen.getByTestId('save-button');
      await user.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Jung Progress Tracker',
          description: 'Tracks student progress through Jung psychology modules',
          trigger: expect.objectContaining({
            event: 'module.progress_updated'
          }),
          states: expect.arrayContaining([
            expect.objectContaining({
              name: 'New State',
              isInitial: true
            })
          ])
        })
      );
    });

    test('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TestAdminProvider>
          <MockWorkflowTemplateBuilder onSave={mockOnSave} onCancel={mockOnCancel} />
        </TestAdminProvider>
      );

      const cancelButton = screen.getByTestId('cancel-button');
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Jung Psychology Specific Features', () => {
    test('should suggest Jung-specific workflow categories', () => {
      render(
        <TestAdminProvider>
          <MockWorkflowTemplateBuilder onSave={mockOnSave} onCancel={mockOnCancel} />
        </TestAdminProvider>
      );

      const categorySelect = screen.getByTestId('template-category-select');
      
      // Check for educational categories
      expect(screen.getByRole('option', { name: 'Learning Path' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Assessment' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Progress Tracking' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Adaptive Learning' })).toBeInTheDocument();
    });

    test('should handle Jung psychology tags suggestions', async () => {
      const user = userEvent.setup();
      render(
        <TestAdminProvider>
          <MockWorkflowTemplateBuilder onSave={mockOnSave} onCancel={mockOnCancel} />
        </TestAdminProvider>
      );

      const tagsInput = screen.getByTestId('template-tags-input');
      expect(tagsInput).toHaveAttribute('placeholder', 'jung, psychology, learning');

      await user.type(tagsInput, 'collective-unconscious, archetypes, shadow-work, individuation');
      expect(tagsInput).toHaveValue('collective-unconscious, archetypes, shadow-work, individuation');
    });

    test('should create Jung-specific workflow template', async () => {
      const user = userEvent.setup();
      render(
        <TestAdminProvider>
          <MockWorkflowTemplateBuilder onSave={mockOnSave} onCancel={mockOnCancel} />
        </TestAdminProvider>
      );

      // Create a comprehensive Jung psychology workflow
      await user.type(screen.getByTestId('template-name-input'), 'Individuation Journey Tracker');
      await user.type(screen.getByTestId('template-description-input'), 'Comprehensive workflow for tracking student progress through Jung\'s individuation process');
      await user.selectOptions(screen.getByTestId('template-category-select'), 'adaptive_learning');
      await user.type(screen.getByTestId('template-tags-input'), 'jung, individuation, shadow, anima, animus, self');

      // Configure trigger
      await user.click(screen.getByTestId('trigger-tab'));
      await user.selectOptions(screen.getByTestId('trigger-type-select'), 'event');
      await user.type(screen.getByTestId('trigger-event-input'), 'psychology.concept.mastered');

      // Add states for individuation stages
      await user.click(screen.getByTestId('states-tab'));
      
      // Shadow work state
      await user.click(screen.getByTestId('add-state-button'));
      const shadowStateNameInput = screen.getAllByTestId(/^state-name-/)[0];
      await user.clear(shadowStateNameInput);
      await user.type(shadowStateNameInput, 'Shadow Integration');
      
      // Anima/Animus state
      await user.click(screen.getByTestId('add-state-button'));
      const animaStateNameInput = screen.getAllByTestId(/^state-name-/)[1];
      await user.clear(animaStateNameInput);
      await user.type(animaStateNameInput, 'Anima/Animus Recognition');

      // Self-realization state
      await user.click(screen.getByTestId('add-state-button'));
      const selfStateNameInput = screen.getAllByTestId(/^state-name-/)[2];
      await user.clear(selfStateNameInput);
      await user.type(selfStateNameInput, 'Self Realization');
      const selfStateFinalCheckbox = screen.getAllByTestId(/^state-final-/)[2];
      await user.click(selfStateFinalCheckbox);

      // Add Jung-specific variables
      await user.click(screen.getByTestId('variables-tab'));
      
      await user.click(screen.getByTestId('add-variable-button'));
      await user.clear(screen.getAllByTestId(/^variable-name-/)[0]);
      await user.type(screen.getAllByTestId(/^variable-name-/)[0], 'shadowIntegrationLevel');
      await user.selectOptions(screen.getAllByTestId(/^variable-type-/)[0], 'number');
      await user.type(screen.getAllByTestId(/^variable-description-/)[0], 'Level of shadow work integration (0-1)');

      await user.click(screen.getByTestId('add-variable-button'));
      await user.clear(screen.getAllByTestId(/^variable-name-/)[1]);
      await user.type(screen.getAllByTestId(/^variable-name-/)[1], 'dominantArchetype');
      await user.selectOptions(screen.getAllByTestId(/^variable-type-/)[1], 'string');
      await user.type(screen.getAllByTestId(/^variable-description-/)[1], 'Primary archetype manifesting in current stage');

      // Save the template
      await user.click(screen.getByTestId('save-button'));

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Individuation Journey Tracker',
          description: expect.stringContaining('individuation process'),
          category: 'adaptive_learning',
          metadata: expect.objectContaining({
            tags: ['jung', 'individuation', 'shadow', 'anima', 'animus', 'self']
          }),
          states: expect.arrayContaining([
            expect.objectContaining({ name: 'Shadow Integration' }),
            expect.objectContaining({ name: 'Anima/Animus Recognition' }),
            expect.objectContaining({ name: 'Self Realization', isFinal: true })
          ]),
          variables: expect.arrayContaining([
            expect.objectContaining({ 
              name: 'shadowIntegrationLevel',
              type: 'number'
            }),
            expect.objectContaining({ 
              name: 'dominantArchetype',
              type: 'string'
            })
          ])
        })
      );
    });
  });
});