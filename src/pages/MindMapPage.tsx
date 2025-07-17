import React, { useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Controls,
  Background,
  MiniMap,
} from 'react-flow-renderer';
import { Module } from '../types';
import { useNavigate } from 'react-router-dom';

interface MindMapPageProps {
  modules: Module[];
}

const MindMapPage: React.FC<MindMapPageProps> = ({ modules }) => {
  const navigate = useNavigate();

  const initialNodes: Node[] = [
    {
      id: 'jung-center',
      data: { label: "Jung's Analytical Psychology" },
      position: { x: 400, y: 300 },
      style: {
        background: '#4c51ea',
        color: 'white',
        fontSize: '16px',
        fontWeight: 'bold',
        padding: '20px',
        borderRadius: '8px',
        border: 'none',
      },
    },
    {
      id: 'conscious',
      data: { label: 'Conscious Mind' },
      position: { x: 100, y: 100 },
      style: {
        background: '#fef3f2',
        color: '#801f23',
        border: '2px solid #de2c2c',
        borderRadius: '8px',
        padding: '12px',
      },
    },
    {
      id: 'personal-unconscious',
      data: { label: 'Personal Unconscious' },
      position: { x: 700, y: 100 },
      style: {
        background: '#f0f4ff',
        color: '#2f2b89',
        border: '2px solid #6172f3',
        borderRadius: '8px',
        padding: '12px',
      },
    },
    {
      id: 'collective-unconscious',
      data: { label: 'Collective Unconscious' },
      position: { x: 400, y: 500 },
      style: {
        background: '#f0f4ff',
        color: '#2f2b89',
        border: '2px solid #6172f3',
        borderRadius: '8px',
        padding: '12px',
      },
    },
    ...modules.map((module, index) => ({
      id: module.id,
      data: { 
        label: module.title,
        moduleId: module.id,
      },
      position: { 
        x: 200 + (index % 3) * 250, 
        y: 200 + Math.floor(index / 3) * 150 
      },
      style: {
        background: '#ffffff',
        border: '2px solid #e5e7eb',
        borderRadius: '8px',
        padding: '10px',
        cursor: 'pointer',
      },
    })),
  ];

  const initialEdges: Edge[] = [
    { id: 'e1', source: 'jung-center', target: 'conscious', animated: true },
    { id: 'e2', source: 'jung-center', target: 'personal-unconscious', animated: true },
    { id: 'e3', source: 'jung-center', target: 'collective-unconscious', animated: true },
    { id: 'e4', source: 'collective-unconscious', target: 'collective-unconscious', label: 'Archetypes' },
    { id: 'e5', source: 'personal-unconscious', target: 'intro-jung' },
    { id: 'e6', source: 'collective-unconscious', target: 'archetypes' },
    { id: 'e7', source: 'jung-center', target: 'psychological-types' },
    { id: 'e8', source: 'archetypes', target: 'individuation' },
    { id: 'e9', source: 'collective-unconscious', target: 'dreams-symbols' },
  ];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (node.data.moduleId) {
        navigate(`/module/${node.data.moduleId}`);
      }
    },
    [navigate]
  );

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
          Conceptual Mind Map
        </h1>
        <p className="text-gray-600">
          Explore the interconnected concepts of Jung's analytical psychology. Click on any module to learn more.
        </p>
      </div>

      <div className="h-full border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          fitView
        >
          <Background color="#e5e7eb" gap={16} />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              if (node.id === 'jung-center') return '#4c51ea';
              if (node.id.includes('unconscious')) return '#6172f3';
              if (node.id === 'conscious') return '#de2c2c';
              return '#9ca3af';
            }}
            style={{
              backgroundColor: '#f3f4f6',
              border: '1px solid #e5e7eb',
            }}
          />
        </ReactFlow>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-primary-600 rounded"></div>
          <span className="text-gray-600">Central Concept</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-secondary-500 rounded"></div>
          <span className="text-gray-600">Conscious Mind</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-primary-400 rounded"></div>
          <span className="text-gray-600">Unconscious Realms</span>
        </div>
      </div>
    </div>
  );
};

export default MindMapPage;