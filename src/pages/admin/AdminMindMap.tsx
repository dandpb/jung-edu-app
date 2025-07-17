import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ConnectionMode,
  Panel,
  NodeChange,
  EdgeChange,
  MarkerType,
  ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useAdmin } from '../../contexts/AdminContext';
import { MindMapNode, MindMapEdge } from '../../types';
import { 
  Plus, 
  Save, 
  Download, 
  Upload,
  Trash2,
  Edit2,
  X,
  Check
} from 'lucide-react';

interface NodeData {
  label: string;
  category: 'central' | 'primary' | 'secondary' | 'tertiary';
  description?: string;
}

const nodeCategories = {
  central: { color: '#6366f1', size: 'large' },
  primary: { color: '#8b5cf6', size: 'medium' },
  secondary: { color: '#ec4899', size: 'small' },
  tertiary: { color: '#f59e0b', size: 'small' }
};

const AdminMindMap: React.FC = () => {
  const { mindMapNodes, mindMapEdges, updateMindMap } = useAdmin();
  const [nodes, setNodes, onNodesChange] = useNodesState(mindMapNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(mindMapEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [showNodeForm, setShowNodeForm] = useState(false);
  const [newNodeData, setNewNodeData] = useState({
    label: '',
    category: 'primary' as keyof typeof nodeCategories,
    description: ''
  });

  useEffect(() => {
    setNodes(mindMapNodes);
    setEdges(mindMapEdges);
  }, [mindMapNodes, mindMapEdges, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        id: `edge-${Date.now()}`,
        type: 'smoothstep',
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const handleNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    setEditingNode(node.id);
    setEditLabel((node.data as NodeData).label);
    setEditDescription((node.data as NodeData).description || '');
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (editingNode) {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === editingNode) {
            return {
              ...node,
              data: {
                ...node.data,
                label: editLabel,
                description: editDescription
              }
            };
          }
          return node;
        })
      );
      setEditingNode(null);
      setEditLabel('');
      setEditDescription('');
    }
  }, [editingNode, editLabel, editDescription, setNodes]);

  const handleCancelEdit = useCallback(() => {
    setEditingNode(null);
    setEditLabel('');
    setEditDescription('');
  }, []);

  const handleAddNode = useCallback(() => {
    const centerX = window.innerWidth / 2;
    const centerY = 300;
    const randomOffset = () => (Math.random() - 0.5) * 200;

    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: 'default',
      position: {
        x: centerX + randomOffset(),
        y: centerY + randomOffset()
      },
      data: {
        label: newNodeData.label,
        category: newNodeData.category,
        description: newNodeData.description
      },
      style: {
        background: nodeCategories[newNodeData.category].color,
        color: 'white',
        borderRadius: '8px',
        fontSize: newNodeData.category === 'central' ? '16px' : '14px',
        fontWeight: newNodeData.category === 'central' ? 'bold' : 'normal',
        width: newNodeData.category === 'central' ? 200 : 150,
        textAlign: 'center',
        padding: '10px'
      }
    };

    setNodes((nds) => [...nds, newNode]);
    setShowNodeForm(false);
    setNewNodeData({ label: '', category: 'primary', description: '' });
  }, [newNodeData, setNodes]);

  const handleDeleteNode = useCallback(() => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
      setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
      setSelectedNode(null);
    }
  }, [selectedNode, setNodes, setEdges]);

  const handleSaveChanges = useCallback(() => {
    updateMindMap(nodes as MindMapNode[], edges as MindMapEdge[]);
    alert('Mind map saved successfully!');
  }, [nodes, edges, updateMindMap]);

  const handleExport = useCallback(() => {
    const data = {
      nodes,
      edges,
      timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jung-mindmap-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [nodes, edges]);

  const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          setNodes(data.nodes || []);
          setEdges(data.edges || []);
          alert('Mind map imported successfully!');
        } catch (error) {
          alert('Failed to import mind map. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  }, [setNodes, setEdges]);

  return (
    <div className="h-[calc(100vh-12rem)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
            Mind Map Editor
          </h1>
          <p className="text-gray-600">
            Create and edit the interactive concept mind map
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowNodeForm(true)}
            className="btn-secondary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Node</span>
          </button>
          <button
            onClick={handleSaveChanges}
            className="btn-primary flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={handleNodeClick}
            onNodeDoubleClick={handleNodeDoubleClick}
            connectionMode={ConnectionMode.Loose}
            fitView
          >
            <Background color="#f0f0f0" gap={20} />
            <Controls />
            
            <Panel position="top-left" className="bg-white rounded-lg shadow-lg p-4">
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Node Categories</h3>
                {Object.entries(nodeCategories).map(([category, style]) => (
                  <div key={category} className="flex items-center space-x-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: style.color }}
                    />
                    <span className="text-sm capitalize">{category}</span>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel position="bottom-left" className="bg-white rounded-lg shadow-lg p-4">
              <div className="space-y-3">
                <button
                  onClick={handleExport}
                  className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
                <label className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>Import</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                  />
                </label>
              </div>
            </Panel>

            {selectedNode && !editingNode && (
              <Panel position="top-right" className="bg-white rounded-lg shadow-lg p-4">
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900">Selected Node</h3>
                  <p className="text-sm text-gray-600">
                    {(selectedNode.data as NodeData).label}
                  </p>
                  {(selectedNode.data as NodeData).description && (
                    <p className="text-xs text-gray-500">
                      {(selectedNode.data as NodeData).description}
                    </p>
                  )}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleNodeDoubleClick({} as React.MouseEvent, selectedNode)}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleDeleteNode}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Panel>
            )}

            {editingNode && (
              <Panel position="top-right" className="bg-white rounded-lg shadow-lg p-4">
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900">Edit Node</h3>
                  <input
                    type="text"
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Node label"
                  />
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Description (optional)"
                    rows={2}
                  />
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleSaveEdit}
                      className="text-green-600 hover:text-green-700"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </Panel>
            )}
          </ReactFlow>
        </ReactFlowProvider>
      </div>

      {showNodeForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Node</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Label
                </label>
                <input
                  type="text"
                  value={newNodeData.label}
                  onChange={(e) => setNewNodeData({ ...newNodeData, label: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter node label"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={newNodeData.category}
                  onChange={(e) => setNewNodeData({ ...newNodeData, category: e.target.value as keyof typeof nodeCategories })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="central">Central</option>
                  <option value="primary">Primary</option>
                  <option value="secondary">Secondary</option>
                  <option value="tertiary">Tertiary</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={newNodeData.description}
                  onChange={(e) => setNewNodeData({ ...newNodeData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter node description"
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowNodeForm(false);
                    setNewNodeData({ label: '', category: 'primary', description: '' });
                  }}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddNode}
                  disabled={!newNodeData.label}
                  className="btn-primary"
                >
                  Add Node
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMindMap;