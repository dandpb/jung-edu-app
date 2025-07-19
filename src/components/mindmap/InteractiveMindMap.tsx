import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  Panel,
  ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Module } from '../../types';
import { ReactFlowAdapter } from '../../services/mindmap/reactFlowAdapter';
import { LayoutType } from '../../services/mindmap/mindMapLayouts';
import { useNavigate } from 'react-router-dom';

interface InteractiveMindMapProps {
  modules: Module[];
  selectedModule?: Module;
  onNodeClick?: (moduleId: string) => void;
  showControls?: boolean;
  showMiniMap?: boolean;
  initialLayout?: LayoutType;
}

const InteractiveMindMap: React.FC<InteractiveMindMapProps> = ({
  modules,
  selectedModule,
  onNodeClick,
  showControls = true,
  showMiniMap = true,
  initialLayout = LayoutType.RADIAL
}) => {
  const navigate = useNavigate();
  const [adapter] = useState(() => new ReactFlowAdapter());
  const [currentLayout, setCurrentLayout] = useState<LayoutType>(initialLayout);
  const [studyPath, setStudyPath] = useState<string[]>([]);
  const [showStudyPath, setShowStudyPath] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Initialize nodes and edges
  const generateInitialData = useCallback(() => {
    if (selectedModule) {
      return adapter.generateFromModule(selectedModule, currentLayout);
    } else {
      return adapter.generateFromModules(modules, currentLayout);
    }
  }, [modules, selectedModule, currentLayout, adapter]);

  const initialData = generateInitialData();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialData.edges);

  // Update layout when it changes
  useEffect(() => {
    const newNodes = adapter.updateLayout(nodes, edges, currentLayout);
    setNodes(newNodes);
  }, [currentLayout, adapter]);

  // Handle node clicks
  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (node.data.moduleId) {
        if (onNodeClick) {
          onNodeClick(node.data.moduleId);
        } else {
          navigate(`/module/${node.data.moduleId}`);
        }
      }
    },
    [navigate, onNodeClick]
  );

  // Generate study path
  const handleGenerateStudyPath = useCallback(() => {
    const path = adapter.generateStudyPath(nodes, edges);
    setStudyPath(path);
    setShowStudyPath(true);

    // Highlight the path
    const pathNodeIds = nodes
      .filter(n => path.includes(n.data.moduleId))
      .map(n => n.id);
    
    const highlighted = adapter.highlightPath(nodes, edges, pathNodeIds);
    setNodes(highlighted.nodes);
    setEdges(highlighted.edges);
  }, [nodes, edges, adapter]);

  // Clear study path
  const handleClearStudyPath = useCallback(() => {
    setShowStudyPath(false);
    const data = generateInitialData();
    setNodes(data.nodes);
    setEdges(data.edges);
  }, [generateInitialData]);

  // Filter by category
  const handleCategoryFilter = useCallback((category: string) => {
    setSelectedCategories(prev => {
      const newCategories = prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category];
      
      if (newCategories.length === 0) {
        // Show all if no categories selected
        const data = generateInitialData();
        setNodes(data.nodes);
        setEdges(data.edges);
      } else {
        const filtered = adapter.filterByCategory(
          generateInitialData().nodes,
          generateInitialData().edges,
          newCategories
        );
        setNodes(filtered.nodes);
        setEdges(filtered.edges);
      }
      
      return newCategories;
    });
  }, [adapter, generateInitialData]);

  // Get layout recommendations
  const layoutRecommendations = adapter.getLayoutRecommendations(nodes, edges);

  return (
    <div className="h-full w-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        fitView
        attributionPosition="bottom-left"
      >
        <Background color="#e5e7eb" gap={16} />
        
        {showControls && <Controls />}
        
        {showMiniMap && (
          <MiniMap
            nodeColor={(node) => {
              const style = node.style as any;
              return style?.background || '#9ca3af';
            }}
            style={{
              backgroundColor: '#f3f4f6',
              border: '1px solid #e5e7eb',
            }}
          />
        )}

        <Panel position="top-left" className="bg-white p-4 rounded-lg shadow-lg">
          <div className="space-y-4">
            {/* Layout Selector */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Layout</h3>
              <div className="space-y-1">
                {layoutRecommendations.map(rec => (
                  <button
                    key={rec.type}
                    onClick={() => setCurrentLayout(rec.type)}
                    className={`block w-full text-left px-3 py-2 text-sm rounded ${
                      currentLayout === rec.type
                        ? 'bg-primary-100 text-primary-700'
                        : 'hover:bg-gray-100'
                    }`}
                    title={rec.description}
                  >
                    {rec.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Study Path */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Study Tools</h3>
              {!showStudyPath ? (
                <button
                  onClick={handleGenerateStudyPath}
                  className="w-full px-3 py-2 bg-primary-600 text-white text-sm rounded hover:bg-primary-700"
                >
                  Generate Study Path
                </button>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={handleClearStudyPath}
                    className="w-full px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                  >
                    Clear Path
                  </button>
                  <div className="text-xs text-gray-600">
                    <p className="font-semibold mb-1">Study Order:</p>
                    <ol className="list-decimal list-inside">
                      {studyPath.map((moduleId, index) => {
                        const module = modules.find(m => m.id === moduleId);
                        return (
                          <li key={moduleId} className="truncate">
                            {module?.title || moduleId}
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                </div>
              )}
            </div>

            {/* Category Filter */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Categories</h3>
              <div className="space-y-1">
                {[
                  { id: 'archetype', label: 'Archetypes', color: '#7C3AED' },
                  { id: 'complex', label: 'Complexes', color: '#DC2626' },
                  { id: 'process', label: 'Processes', color: '#2563EB' },
                  { id: 'concept', label: 'Concepts', color: '#059669' }
                ].map(cat => (
                  <label
                    key={cat.id}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat.id)}
                      onChange={() => handleCategoryFilter(cat.id)}
                      className="rounded text-primary-600"
                    />
                    <span className="text-sm flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-1"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Panel>

        <Panel position="bottom-right" className="bg-white px-3 py-2 rounded shadow">
          <div className="flex items-center space-x-4 text-xs text-gray-600">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-primary-600 rounded"></div>
              <span>Core Concepts</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 border-2 border-gray-400 rounded"></div>
              <span>Modules</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-0 border-t-2 border-gray-400" style={{ width: '20px' }}></div>
              <span>Connections</span>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};

// Wrap with ReactFlowProvider
const InteractiveMindMapWrapper: React.FC<InteractiveMindMapProps> = (props) => {
  return (
    <ReactFlowProvider>
      <InteractiveMindMap {...props} />
    </ReactFlowProvider>
  );
};

export default InteractiveMindMapWrapper;