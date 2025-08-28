/**
 * Workflow Template Builder Component for jaqEdu Platform
 * 
 * Visual drag-and-drop interface for creating and editing workflow templates.
 * Features:
 * - Drag-and-drop workflow designer
 * - Real-time template validation
 * - Educational workflow-specific components
 * - Integration with existing jaqEdu UI patterns
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  WorkflowTemplate, 
  WorkflowTemplateBuilder as BuilderState,
  TemplateNode, 
  TemplateConnection,
  TemplateVariable,
  TemplateNodeData,
  EducationalNodeContext 
} from '../../types/workflow';

// Mock React Flow types (in real implementation, import from reactflow)
interface Position {
  x: number;
  y: number;
}

interface Node {
  id: string;
  type: string;
  position: Position;
  data: any;
  style?: React.CSSProperties;
}

interface Edge {
  id: string;
  source: string;
  target: string;
  label?: string;
  style?: React.CSSProperties;
}

interface WorkflowTemplateBuilderProps {
  initialTemplate?: WorkflowTemplate;
  onSave: (template: WorkflowTemplate) => Promise<void>;
  onCancel: () => void;
  readonly?: boolean;
  className?: string;
}

interface ValidationError {
  type: 'error' | 'warning';
  message: string;
  nodeId?: string;
  field?: string;
}

interface NodePalette {
  category: string;
  nodes: {
    type: string;
    label: string;
    icon: string;
    description: string;
    defaultData: Partial<TemplateNodeData>;
  }[];
}

export const WorkflowTemplateBuilder: React.FC<WorkflowTemplateBuilderProps> = ({
  initialTemplate,
  onSave,
  onCancel,
  readonly = false,
  className = ''
}) => {
  // ============================================================================
  // State Management
  // ============================================================================

  const [template, setTemplate] = useState<Partial<WorkflowTemplate>>(() => ({
    name: '',
    description: '',
    category: 'learning_path',
    icon: '🔄',
    tags: [],
    isPublic: false,
    difficulty: 'beginner',
    estimatedDuration: 30,
    variables: [],
    ...initialTemplate
  }));

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'design' | 'variables' | 'settings' | 'preview'>('design');

  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggedNodeType, setDraggedNodeType] = useState<string | null>(null);

  // ============================================================================
  // Node Palette Configuration
  // ============================================================================

  const nodePalette: NodePalette[] = [
    {
      category: 'Core Workflow',
      nodes: [
        {
          type: 'start',
          label: 'Start',
          icon: '▶️',
          description: 'Workflow starting point',
          defaultData: {
            label: 'Start Workflow',
            config: {}
          }
        },
        {
          type: 'end',
          label: 'End',
          icon: '⏹️',
          description: 'Workflow completion',
          defaultData: {
            label: 'Complete',
            config: {}
          }
        },
        {
          type: 'task',
          label: 'Task',
          icon: '⚙️',
          description: 'Execute an action or operation',
          defaultData: {
            label: 'Execute Task',
            config: {
              timeout: 300000,
              retryPolicy: {
                maxAttempts: 3,
                backoffStrategy: 'exponential',
                initialDelay: 1000,
                maxDelay: 10000
              }
            }
          }
        },
        {
          type: 'decision',
          label: 'Decision',
          icon: '🔀',
          description: 'Conditional branching logic',
          defaultData: {
            label: 'Decision Point',
            config: {
              condition: 'result == "success"'
            }
          }
        }
      ]
    },
    {
      category: 'Educational',
      nodes: [
        {
          type: 'assessment',
          label: 'Assessment',
          icon: '📝',
          description: 'Quiz or test component',
          defaultData: {
            label: 'Assessment',
            config: {
              type: 'quiz',
              timeLimit: 1800,
              passingScore: 0.7
            },
            educational_context: {
              learning_objectives: ['Assess understanding'],
              assessment_criteria: ['Accuracy', 'Completeness'],
              difficulty_level: 'intermediate',
              time_estimate: 30
            }
          }
        },
        {
          type: 'content_delivery',
          label: 'Content',
          icon: '📚',
          description: 'Deliver educational content',
          defaultData: {
            label: 'Content Delivery',
            config: {
              contentType: 'text',
              adaptive: true,
              trackProgress: true
            },
            educational_context: {
              learning_objectives: ['Understand concept'],
              difficulty_level: 'beginner',
              time_estimate: 15
            }
          }
        },
        {
          type: 'reflection',
          label: 'Reflection',
          icon: '🤔',
          description: 'Self-reflection exercise',
          defaultData: {
            label: 'Self-Reflection',
            config: {
              prompts: [],
              minTime: 300,
              optional: false
            },
            educational_context: {
              learning_objectives: ['Self-awareness', 'Integration'],
              difficulty_level: 'intermediate',
              time_estimate: 10,
              jung_concepts: ['shadow', 'individuation']
            }
          }
        }
      ]
    },
    {
      category: 'Communication',
      nodes: [
        {
          type: 'notification',
          label: 'Notification',
          icon: '📧',
          description: 'Send notification to user',
          defaultData: {
            label: 'Send Notification',
            config: {
              type: 'email',
              template: 'default',
              priority: 'normal'
            }
          }
        },
        {
          type: 'approval',
          label: 'Approval',
          icon: '✅',
          description: 'Human approval step',
          defaultData: {
            label: 'Approval Required',
            config: {
              approvers: [],
              timeout: 172800000, // 48 hours
              autoApprove: false
            }
          }
        }
      ]
    }
  ];

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleDragStart = useCallback((nodeType: string) => {
    setDraggedNodeType(nodeType);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedNodeType(null);
  }, []);

  const handleCanvasDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    
    if (!draggedNodeType || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const position = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };

    const nodeTemplate = nodePalette
      .flatMap(category => category.nodes)
      .find(node => node.type === draggedNodeType);

    if (!nodeTemplate) return;

    const newNode: Node = {
      id: `node_${Date.now()}`,
      type: draggedNodeType,
      position,
      data: {
        ...nodeTemplate.defaultData,
        onEdit: () => handleNodeSelect(newNode)
      },
      style: {
        border: '2px solid #e2e8f0',
        borderRadius: '8px',
        padding: '12px',
        backgroundColor: 'white',
        minWidth: '120px',
        textAlign: 'center',
        cursor: 'pointer',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }
    };

    setNodes(prev => [...prev, newNode]);
    setDraggedNodeType(null);
    validateTemplate([...nodes, newNode], edges);
  }, [draggedNodeType, nodes, edges]);

  const handleCanvasDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const handleNodeSelect = useCallback((node: Node) => {
    setSelectedNode(node);
  }, []);

  const handleNodeUpdate = useCallback((nodeId: string, updates: Partial<TemplateNodeData>) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId 
        ? { ...node, data: { ...node.data, ...updates } }
        : node
    ));
    validateTemplate(nodes, edges);
  }, [nodes, edges]);

  const handleNodeDelete = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId));
    setEdges(prev => prev.filter(edge => edge.source !== nodeId && edge.target !== nodeId));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  }, [selectedNode]);

  const handleConnectionCreate = useCallback((sourceId: string, targetId: string) => {
    const newEdge: Edge = {
      id: `edge_${sourceId}_${targetId}`,
      source: sourceId,
      target: targetId,
      style: {
        stroke: '#6366f1',
        strokeWidth: 2
      }
    };

    setEdges(prev => [...prev, newEdge]);
    validateTemplate(nodes, [...edges, newEdge]);
  }, [nodes, edges]);

  const handleVariableAdd = useCallback(() => {
    const newVariable: TemplateVariable = {
      name: `variable_${Date.now()}`,
      type: 'string',
      displayName: 'New Variable',
      description: 'Variable description',
      defaultValue: '',
      required: false,
      group: 'general',
      order: (template.variables?.length || 0) + 1
    };

    setTemplate(prev => ({
      ...prev,
      variables: [...(prev.variables || []), newVariable]
    }));
  }, [template.variables]);

  const handleVariableUpdate = useCallback((index: number, updates: Partial<TemplateVariable>) => {
    setTemplate(prev => ({
      ...prev,
      variables: prev.variables?.map((variable, i) => 
        i === index ? { ...variable, ...updates } : variable
      ) || []
    }));
  }, []);

  const handleVariableDelete = useCallback((index: number) => {
    setTemplate(prev => ({
      ...prev,
      variables: prev.variables?.filter((_, i) => i !== index) || []
    }));
  }, []);

  // ============================================================================
  // Validation Logic
  // ============================================================================

  const validateTemplate = useCallback((currentNodes: Node[], currentEdges: Edge[]) => {
    setIsValidating(true);
    const errors: ValidationError[] = [];

    // Check for required elements
    const hasStartNode = currentNodes.some(node => node.type === 'start');
    const hasEndNode = currentNodes.some(node => node.type === 'end');

    if (!hasStartNode) {
      errors.push({
        type: 'error',
        message: 'Workflow must have at least one start node'
      });
    }

    if (!hasEndNode) {
      errors.push({
        type: 'error',
        message: 'Workflow must have at least one end node'
      });
    }

    // Check node connections
    currentNodes.forEach(node => {
      if (node.type === 'start') return;
      
      const hasIncomingEdge = currentEdges.some(edge => edge.target === node.id);
      if (!hasIncomingEdge) {
        errors.push({
          type: 'warning',
          message: `Node "${node.data?.label || node.id}" has no incoming connections`,
          nodeId: node.id
        });
      }
    });

    // Check for orphaned nodes (except start nodes)
    currentNodes.forEach(node => {
      if (node.type === 'end') return;
      
      const hasOutgoingEdge = currentEdges.some(edge => edge.source === node.id);
      if (!hasOutgoingEdge) {
        errors.push({
          type: 'warning',
          message: `Node "${node.data?.label || node.id}" has no outgoing connections`,
          nodeId: node.id
        });
      }
    });

    // Validate educational context for Jung psychology templates
    if (template.category === 'jung_psychology') {
      const educationalNodes = currentNodes.filter(node => 
        node.data?.educational_context
      );

      if (educationalNodes.length === 0) {
        errors.push({
          type: 'warning',
          message: 'Jung psychology templates should include educational context for learning nodes'
        });
      }
    }

    setValidationErrors(errors);
    setIsValidating(false);
  }, [template.category]);

  // ============================================================================
  // Save Logic
  // ============================================================================

  const handleSave = useCallback(async () => {
    if (validationErrors.filter(error => error.type === 'error').length > 0) {
      alert('Please fix all errors before saving');
      return;
    }

    setIsSaving(true);
    try {
      // Convert nodes and edges to workflow definition
      const states = nodes.map(node => ({
        id: node.id,
        name: node.data?.label || node.id,
        type: node.type as any,
        isInitial: node.type === 'start',
        isFinal: node.type === 'end',
        actions: [],
        ...(node.data?.config || {})
      }));

      const transitions = edges.map(edge => ({
        id: edge.id,
        from: edge.source,
        to: edge.target,
        priority: 1,
        ...(edge.label ? { condition: edge.label } : {})
      }));

      const workflowDefinition = {
        id: template.name?.toLowerCase().replace(/\s+/g, '-') || 'unnamed',
        name: template.name || 'Unnamed Workflow',
        description: template.description || '',
        version: '1.0.0',
        category: template.category || 'learning_path',
        trigger: {
          type: 'event' as const,
          event: 'workflow_triggered',
          conditions: [],
          immediate: true,
          enabled: true
        },
        states,
        transitions,
        variables: template.variables?.map(v => ({
          name: v.name,
          type: v.type,
          defaultValue: v.defaultValue,
          required: v.required,
          description: v.description
        })) || [],
        metadata: {
          tags: template.tags || [],
          author: 'Template Builder',
          documentation: template.description || ''
        },
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'user',
        is_active: true
      };

      const completeTemplate: WorkflowTemplate = {
        id: initialTemplate?.id || `template_${Date.now()}`,
        name: template.name || 'Unnamed Template',
        description: template.description || '',
        version: '1.0.0',
        category: template.category || 'learning_path',
        icon: template.icon || '🔄',
        tags: template.tags || [],
        isPublic: template.isPublic || false,
        difficulty: template.difficulty || 'beginner',
        estimatedDuration: template.estimatedDuration || 30,
        definition: workflowDefinition,
        variables: template.variables || [],
        metadata: {
          tags: template.tags || [],
          author: 'Template Builder',
          documentation: template.description || '',
          use_cases: []
        },
        created_at: initialTemplate?.created_at || new Date(),
        updated_at: new Date(),
        created_by: initialTemplate?.created_by || 'user',
        usage_count: initialTemplate?.usage_count || 0,
        rating: initialTemplate?.rating
      };

      await onSave(completeTemplate);
    } catch (error) {
      console.error('Failed to save template:', error);
      alert('Failed to save template. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [template, nodes, edges, validationErrors, initialTemplate, onSave]);

  // ============================================================================
  // Effects
  // ============================================================================

  useEffect(() => {
    if (initialTemplate?.definition) {
      // Convert workflow definition back to nodes and edges
      const initialNodes: Node[] = initialTemplate.definition.states?.map(state => ({
        id: state.id,
        type: state.type,
        position: { x: Math.random() * 400, y: Math.random() * 300 }, // Random positioning
        data: {
          label: state.name,
          config: state.actions?.[0]?.config || {}
        }
      })) || [];

      const initialEdges: Edge[] = initialTemplate.definition.transitions?.map(transition => ({
        id: transition.id,
        source: transition.from,
        target: transition.to,
        label: transition.condition
      })) || [];

      setNodes(initialNodes);
      setEdges(initialEdges);
    }
  }, [initialTemplate]);

  useEffect(() => {
    validateTemplate(nodes, edges);
  }, [nodes, edges, validateTemplate]);

  // ============================================================================
  // Render Components
  // ============================================================================

  const renderNodePalette = () => (
    <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
      <h3 className="font-semibold text-gray-900 mb-4">Components</h3>
      {nodePalette.map((category, categoryIndex) => (
        <div key={categoryIndex} className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">{category.category}</h4>
          {category.nodes.map((node, nodeIndex) => (
            <div
              key={nodeIndex}
              draggable={!readonly}
              onDragStart={() => handleDragStart(node.type)}
              onDragEnd={handleDragEnd}
              className={`
                p-3 mb-2 rounded-lg border border-gray-200 cursor-grab
                hover:border-blue-300 hover:bg-blue-50 transition-colors
                ${readonly ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              title={node.description}
            >
              <div className="flex items-center">
                <span className="text-lg mr-2">{node.icon}</span>
                <div>
                  <div className="text-sm font-medium text-gray-900">{node.label}</div>
                  <div className="text-xs text-gray-500">{node.description}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  const renderCanvas = () => (
    <div className="flex-1 relative">
      <div
        ref={canvasRef}
        className="w-full h-full bg-gray-50 relative overflow-auto"
        onDrop={handleCanvasDrop}
        onDragOver={handleCanvasDragOver}
      >
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(#e5e7eb 1px, transparent 1px),
              linear-gradient(90deg, #e5e7eb 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}
        />
        
        {/* Render nodes */}
        {nodes.map(node => (
          <div
            key={node.id}
            className={`
              absolute bg-white border-2 rounded-lg p-3 cursor-pointer select-none
              shadow-sm hover:shadow-md transition-all
              ${selectedNode?.id === node.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
            `}
            style={{
              left: node.position.x,
              top: node.position.y,
              minWidth: '120px'
            }}
            onClick={() => handleNodeSelect(node)}
          >
            <div className="text-center">
              <div className="text-lg mb-1">
                {nodePalette
                  .flatMap(cat => cat.nodes)
                  .find(n => n.type === node.type)?.icon || '⚙️'}
              </div>
              <div className="text-sm font-medium text-gray-900">
                {node.data?.label || node.type}
              </div>
              {!readonly && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNodeDelete(node.id);
                  }}
                  className="absolute top-1 right-1 text-red-400 hover:text-red-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Render connections (simplified) */}
        {edges.map(edge => {
          const sourceNode = nodes.find(n => n.id === edge.source);
          const targetNode = nodes.find(n => n.id === edge.target);
          
          if (!sourceNode || !targetNode) return null;

          const sourceX = sourceNode.position.x + 60; // Center of node
          const sourceY = sourceNode.position.y + 40;
          const targetX = targetNode.position.x + 60;
          const targetY = targetNode.position.y + 40;

          return (
            <svg
              key={edge.id}
              className="absolute inset-0 pointer-events-none"
              style={{ zIndex: 1 }}
            >
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7" 
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 10 3.5, 0 7"
                    fill="#6366f1"
                  />
                </marker>
              </defs>
              <line
                x1={sourceX}
                y1={sourceY}
                x2={targetX}
                y2={targetY}
                stroke="#6366f1"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
              />
            </svg>
          );
        })}
      </div>
    </div>
  );

  const renderNodeProperties = () => {
    if (!selectedNode) return null;

    return (
      <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
        <h3 className="font-semibold text-gray-900 mb-4">Properties</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Label
            </label>
            <input
              type="text"
              value={selectedNode.data?.label || ''}
              onChange={(e) => handleNodeUpdate(selectedNode.id, { label: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              disabled={readonly}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={selectedNode.data?.description || ''}
              onChange={(e) => handleNodeUpdate(selectedNode.id, { description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              rows={3}
              disabled={readonly}
            />
          </div>

          {/* Educational context for Jung psychology */}
          {template.category === 'jung_psychology' && (
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-2">Educational Context</h4>
              
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Learning Objectives
                </label>
                <textarea
                  value={selectedNode.data?.educational_context?.learning_objectives?.join('\n') || ''}
                  onChange={(e) => {
                    const objectives = e.target.value.split('\n').filter(o => o.trim());
                    handleNodeUpdate(selectedNode.id, {
                      educational_context: {
                        ...selectedNode.data?.educational_context,
                        learning_objectives: objectives
                      }
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  rows={3}
                  placeholder="One objective per line"
                  disabled={readonly}
                />
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jung Concepts
                </label>
                <input
                  type="text"
                  value={selectedNode.data?.educational_context?.jung_concepts?.join(', ') || ''}
                  onChange={(e) => {
                    const concepts = e.target.value.split(',').map(c => c.trim()).filter(c => c);
                    handleNodeUpdate(selectedNode.id, {
                      educational_context: {
                        ...selectedNode.data?.educational_context,
                        jung_concepts: concepts
                      }
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="shadow, anima, individuation..."
                  disabled={readonly}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderValidationPanel = () => {
    if (validationErrors.length === 0) return null;

    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-yellow-400">⚠️</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Validation Issues ({validationErrors.length})
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <ul className="list-disc space-y-1 pl-5">
                {validationErrors.map((error, index) => (
                  <li key={index} className={error.type === 'error' ? 'text-red-600' : 'text-yellow-600'}>
                    {error.message}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <div className={`flex flex-col h-full bg-gray-100 ${className}`}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {initialTemplate ? 'Edit' : 'Create'} Workflow Template
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {template.name || 'Unnamed Template'}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                activeTab === 'settings' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Settings
            </button>
            <button
              onClick={() => setActiveTab('variables')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                activeTab === 'variables' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Variables ({template.variables?.length || 0})
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            {!readonly && (
              <button
                onClick={handleSave}
                disabled={isSaving || validationErrors.some(e => e.type === 'error')}
                className={`px-4 py-2 rounded-md text-sm font-medium text-white ${
                  isSaving || validationErrors.some(e => e.type === 'error')
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isSaving ? 'Saving...' : 'Save Template'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Validation Panel */}
      {renderValidationPanel()}

      {/* Main Content */}
      <div className="flex-1 flex">
        {activeTab === 'design' && (
          <>
            {renderNodePalette()}
            {renderCanvas()}
            {renderNodeProperties()}
          </>
        )}

        {activeTab === 'settings' && (
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  value={template.name || ''}
                  onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled={readonly}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={template.description || ''}
                  onChange={(e) => setTemplate(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={4}
                  disabled={readonly}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={template.category || 'learning_path'}
                    onChange={(e) => setTemplate(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    disabled={readonly}
                  >
                    <option value="enrollment">Enrollment</option>
                    <option value="assessment">Assessment</option>
                    <option value="progress_tracking">Progress Tracking</option>
                    <option value="jung_psychology">Jung Psychology</option>
                    <option value="communication">Communication</option>
                    <option value="adaptive_learning">Adaptive Learning</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={template.difficulty || 'beginner'}
                    onChange={(e) => setTemplate(prev => ({ ...prev, difficulty: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    disabled={readonly}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={template.tags?.join(', ') || ''}
                  onChange={(e) => {
                    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
                    setTemplate(prev => ({ ...prev, tags }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled={readonly}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={template.isPublic || false}
                  onChange={(e) => setTemplate(prev => ({ ...prev, isPublic: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  disabled={readonly}
                />
                <label htmlFor="isPublic" className="ml-2 text-sm text-gray-700">
                  Make this template public
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'variables' && (
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Template Variables</h2>
                {!readonly && (
                  <button
                    onClick={handleVariableAdd}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                  >
                    Add Variable
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {(template.variables || []).map((variable, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Variable Name
                        </label>
                        <input
                          type="text"
                          value={variable.name}
                          onChange={(e) => handleVariableUpdate(index, { name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          disabled={readonly}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Display Name
                        </label>
                        <input
                          type="text"
                          value={variable.displayName}
                          onChange={(e) => handleVariableUpdate(index, { displayName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          disabled={readonly}
                        />
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Type
                        </label>
                        <select
                          value={variable.type}
                          onChange={(e) => handleVariableUpdate(index, { type: e.target.value as any })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          disabled={readonly}
                        >
                          <option value="string">String</option>
                          <option value="number">Number</option>
                          <option value="boolean">Boolean</option>
                          <option value="array">Array</option>
                          <option value="object">Object</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Default Value
                        </label>
                        <input
                          type="text"
                          value={variable.defaultValue?.toString() || ''}
                          onChange={(e) => handleVariableUpdate(index, { defaultValue: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          disabled={readonly}
                        />
                      </div>
                      <div className="flex items-center space-x-4 pt-6">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={variable.required}
                            onChange={(e) => handleVariableUpdate(index, { required: e.target.checked })}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                            disabled={readonly}
                          />
                          <span className="ml-2 text-sm text-gray-700">Required</span>
                        </label>
                        {!readonly && (
                          <button
                            onClick={() => handleVariableDelete(index)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={variable.description}
                        onChange={(e) => handleVariableUpdate(index, { description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        rows={2}
                        disabled={readonly}
                      />
                    </div>
                  </div>
                ))}

                {(template.variables || []).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No variables defined. Add variables to make your template configurable.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowTemplateBuilder;