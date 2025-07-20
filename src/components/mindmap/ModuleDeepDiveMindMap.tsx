import React, { useState, useEffect, useCallback } from 'react';
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
import { LLMMindMapGenerator, LLMGeneratedMindMap } from '../../services/mindmap/llmMindMapGenerator';
import { OpenAIProvider } from '../../services/llm/providers/openai';
import { MockLLMProvider } from '../../services/llm/providers/mock';
import { Loader2, Brain, BookOpen, Lightbulb, ArrowLeft } from 'lucide-react';
import { ModuleNode } from '../MiniMapSector';

interface ModuleDeepDiveMindMapProps {
  module: Module;
  onBack?: () => void;
}

const ModuleDeepDiveMindMap: React.FC<ModuleDeepDiveMindMapProps> = ({
  module,
  onBack
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mindMapData, setMindMapData] = useState<LLMGeneratedMindMap | null>(null);
  const [usingRealAI, setUsingRealAI] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // Define custom node types
  const nodeTypes = React.useMemo(() => ({
    module: ModuleNode,
  }), []);

  // Generate mind map on mount
  useEffect(() => {
    generateMindMap();
  }, [module]);

  const generateMindMap = async () => {
    setLoading(true);
    setError(null);

    try {
      let provider;
      
      // Check for API key in environment variables
      const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
      
      if (apiKey) {
        try {
          provider = new OpenAIProvider();
          setUsingRealAI(true);
          console.log('Using OpenAI provider with real API');
        } catch (err) {
          console.warn('Failed to initialize OpenAI provider, falling back to mock:', err);
          provider = new MockLLMProvider();
          setUsingRealAI(false);
        }
      } else {
        console.log('No API key found, using mock provider for demo');
        provider = new MockLLMProvider();
        setUsingRealAI(false);
      }

      const generator = new LLMMindMapGenerator(provider);
      const generatedMap = await generator.generateFromModuleContent(module);

      setMindMapData(generatedMap);
      setNodes(generatedMap.nodes);
      setEdges(generatedMap.edges);
    } catch (err) {
      console.error('Error generating mind map:', err);
      setError('Failed to generate mind map. Using simplified view.');
      
      // Use fallback structure
      generateFallbackMindMap();
    } finally {
      setLoading(false);
    }
  };

  const generateFallbackMindMap = () => {
    // Simple fallback structure based on module sections
    const fallbackNodes: Node[] = [
      {
        id: 'root',
        type: 'module',
        data: {
          label: module.title,
          description: module.description,
          moduleId: module.id,
          moduleCategory: 'core',
          categoryColor: '#4c51ea',
          difficulty: module.difficulty
        },
        position: { x: 400, y: 50 }
      }
    ];

    const fallbackEdges: Edge[] = [];
    
    module.content.sections.forEach((section, index) => {
      const nodeId = `section-${index}`;
      const angle = (index / module.content.sections.length) * 2 * Math.PI;
      const radius = 250;
      
      fallbackNodes.push({
        id: nodeId,
        type: 'module',
        data: {
          label: section.title,
          description: section.content.substring(0, 150) + '...',
          moduleCategory: 'primary',
          categoryColor: '#3b82f6',
          difficulty: 'intermediate'
        },
        position: {
          x: 400 + radius * Math.cos(angle),
          y: 300 + radius * Math.sin(angle)
        }
      });

      fallbackEdges.push({
        id: `edge-root-${nodeId}`,
        source: 'root',
        target: nodeId,
        type: 'default'
      });

      // Add key terms as sub-nodes
      if (section.keyTerms) {
        section.keyTerms.forEach((term, termIndex) => {
          const termId = `term-${index}-${termIndex}`;
          const termAngle = angle + (termIndex - section.keyTerms!.length / 2) * 0.2;
          const termRadius = radius + 150;
          
          fallbackNodes.push({
            id: termId,
            type: 'module',
            data: {
              label: term.term,
              description: term.definition,
              moduleCategory: 'secondary',
              categoryColor: '#10b981',
              difficulty: 'beginner'
            },
            position: {
              x: 400 + termRadius * Math.cos(termAngle),
              y: 300 + termRadius * Math.sin(termAngle)
            }
          });

          fallbackEdges.push({
            id: `edge-${nodeId}-${termId}`,
            source: nodeId,
            target: termId,
            type: 'default',
            animated: true
          });
        });
      }
    });

    setNodes(fallbackNodes);
    setEdges(fallbackEdges);
  };

  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  return (
    <div className="h-full w-full relative bg-gray-50">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white bg-opacity-90">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-700">Gerando Mapa Mental Educacional...</p>
            <p className="text-sm text-gray-500 mt-2">
              {usingRealAI ? 'Usando OpenAI para analisar o conteúdo do módulo e criar conexões' : 'Usando modo demonstração para criar conteúdo estruturado'}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-800">
            {error}
          </div>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Background color="#e5e7eb" gap={16} />
        <Controls />
        <MiniMap 
          nodeColor={(node) => {
            const color = node.data?.categoryColor || '#6b7280';
            return color;
          }}
          style={{
            backgroundColor: '#f3f4f6',
            border: '1px solid #e5e7eb',
          }}
        />

        {/* Module Info Panel */}
        <Panel position="top-left" className="bg-white p-4 rounded-lg shadow-lg max-w-sm">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900">{module.title}</h2>
              <p className="text-sm text-gray-600 mt-1">{module.description}</p>
            </div>
            {onBack && (
              <button
                onClick={onBack}
                className="ml-3 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to overview"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
          </div>

          {mindMapData && (
            <div className="space-y-2 text-xs">
              <div className="flex items-center text-gray-600">
                <Brain className="w-4 h-4 mr-1" />
                <span>{mindMapData.metadata.totalNodes} concepts</span>
              </div>
              <div className="flex items-center text-gray-600">
                <BookOpen className="w-4 h-4 mr-1" />
                <span>Depth: {mindMapData.metadata.depth} levels</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Lightbulb className="w-4 h-4 mr-1" />
                <span>{mindMapData.metadata.learningPath.length} step learning path</span>
              </div>
            </div>
          )}
        </Panel>

        {/* Selected Node Info */}
        {selectedNode && (
          <Panel position="bottom-right" className="bg-white p-4 rounded-lg shadow-lg max-w-md">
            <h3 className="font-semibold text-gray-900 mb-2">{selectedNode.data.label}</h3>
            {selectedNode.data.description && (
              <p className="text-sm text-gray-600 mb-2">{selectedNode.data.description}</p>
            )}
            {selectedNode.data.examples && selectedNode.data.examples.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-semibold text-gray-700">Examples:</p>
                <ul className="list-disc list-inside text-xs text-gray-600 mt-1">
                  {selectedNode.data.examples.map((example: string, index: number) => (
                    <li key={index}>{example}</li>
                  ))}
                </ul>
              </div>
            )}
          </Panel>
        )}

        {/* Legend */}
        <Panel position="top-right" className="bg-white p-3 rounded-lg shadow-lg">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Concept Importance</h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-purple-600 mr-2"></div>
              <span>Core Concepts</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded bg-blue-500 mr-2"></div>
              <span>Primary Ideas</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded bg-green-500 mr-2"></div>
              <span>Supporting Details</span>
            </div>
            <div className="flex items-center">
              <div className="w-0 h-0 border-t-2 border-dashed border-gray-400 mr-2" style={{ width: '16px' }}></div>
              <span>Related Concepts</span>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};

// Wrap with ReactFlowProvider
const ModuleDeepDiveMindMapWrapper: React.FC<ModuleDeepDiveMindMapProps> = (props) => {
  return (
    <ReactFlowProvider>
      <ModuleDeepDiveMindMap {...props} />
    </ReactFlowProvider>
  );
};

export default ModuleDeepDiveMindMapWrapper;