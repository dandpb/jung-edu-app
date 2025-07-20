import { Node, Edge } from 'reactflow';
import { MindMapNode, MindMapEdge, Module } from '../../types';
import { MindMapGenerator, GeneratedMindMap } from './mindMapGenerator';
import { MindMapLayouts, LayoutType } from './mindMapLayouts';

/**
 * Adapter to convert between our mindmap format and React Flow format
 */
export class ReactFlowAdapter {
  private generator: MindMapGenerator;
  private layouts: MindMapLayouts;

  constructor() {
    this.generator = new MindMapGenerator();
    this.layouts = new MindMapLayouts();
  }

  /**
   * Generate React Flow nodes and edges from a module
   */
  generateFromModule(
    module: Module,
    layoutType: LayoutType = LayoutType.RADIAL,
    layoutConfig?: any
  ): { nodes: Node[]; edges: Edge[] } {
    const generatedMap = this.generator.generateFromModule(module);
    const layoutedNodes = this.layouts.applyLayout(
      generatedMap.nodes,
      generatedMap.edges,
      layoutType,
      layoutConfig
    );

    return {
      nodes: this.convertNodesToReactFlow(layoutedNodes),
      edges: this.convertEdgesToReactFlow(generatedMap.edges)
    };
  }

  /**
   * Generate React Flow nodes and edges from multiple modules
   */
  generateFromModules(
    modules: Module[],
    layoutType?: LayoutType,
    layoutConfig?: any
  ): { nodes: Node[]; edges: Edge[] } {
    const generatedMap = this.generator.generateFromModules(modules);
    
    // Auto-detect optimal layout if not specified
    const optimalLayout = layoutType || this.layouts.suggestOptimalLayout(
      generatedMap.nodes,
      generatedMap.edges
    );

    const layoutedNodes = this.layouts.applyLayout(
      generatedMap.nodes,
      generatedMap.edges,
      optimalLayout,
      layoutConfig
    );

    return {
      nodes: this.convertNodesToReactFlow(layoutedNodes),
      edges: this.convertEdgesToReactFlow(generatedMap.edges)
    };
  }

  /**
   * Convert MindMapNode to React Flow Node
   */
  private convertNodesToReactFlow(mindMapNodes: MindMapNode[]): Node[] {
    return mindMapNodes.map(node => ({
      id: node.id,
      data: node.data,
      position: node.position,
      type: node.type || 'default',
      style: node.style
    }));
  }

  /**
   * Convert MindMapEdge to React Flow Edge
   */
  private convertEdgesToReactFlow(mindMapEdges: MindMapEdge[]): Edge[] {
    return mindMapEdges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: typeof edge.label === 'string' ? edge.label : undefined,
      type: edge.type || 'default',
      animated: edge.animated || false,
      style: edge.type === 'dashed' ? { strokeDasharray: '5 5' } : undefined
    }));
  }

  /**
   * Update existing React Flow nodes with new layout
   */
  updateLayout(
    currentNodes: Node[],
    currentEdges: Edge[],
    layoutType: LayoutType,
    layoutConfig?: any
  ): Node[] {
    const mindMapNodes: MindMapNode[] = currentNodes.map(node => ({
      id: node.id,
      data: node.data,
      position: node.position,
      type: node.type,
      style: node.style
    }));

    const mindMapEdges: MindMapEdge[] = currentEdges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: typeof edge.label === 'string' ? edge.label : undefined,
      type: edge.type,
      animated: edge.animated
    }));

    const layoutedNodes = this.layouts.applyLayout(
      mindMapNodes,
      mindMapEdges,
      layoutType,
      layoutConfig
    );

    return this.convertNodesToReactFlow(layoutedNodes);
  }

  /**
   * Generate a study path through the mindmap
   */
  generateStudyPath(nodes: Node[], edges: Edge[]): string[] {
    // Convert to our format
    const mindMapNodes: MindMapNode[] = nodes.map(node => ({
      id: node.id,
      data: node.data,
      position: node.position,
      style: node.style
    }));

    const mindMapEdges: MindMapEdge[] = edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target
    }));

    // Use hierarchical analysis to determine order
    const visited = new Set<string>();
    const path: string[] = [];

    // Find root nodes (no incoming edges)
    const incomingEdges = new Map<string, number>();
    mindMapEdges.forEach(edge => {
      incomingEdges.set(edge.target, (incomingEdges.get(edge.target) || 0) + 1);
    });

    const rootNodes = mindMapNodes.filter(n => !incomingEdges.has(n.id));
    
    // BFS traversal for study path
    const queue: string[] = rootNodes.map(n => n.id);
    
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      if (visited.has(nodeId)) continue;
      
      visited.add(nodeId);
      const node = mindMapNodes.find(n => n.id === nodeId);
      
      // Only add nodes with moduleId to the study path
      if (node?.data.moduleId) {
        path.push(node.data.moduleId);
      }

      // Add children to queue
      const childEdges = mindMapEdges.filter(e => e.source === nodeId);
      childEdges.forEach(edge => {
        if (!visited.has(edge.target)) {
          queue.push(edge.target);
        }
      });
    }

    return path;
  }

  /**
   * Highlight a path through the mindmap
   */
  highlightPath(
    nodes: Node[],
    edges: Edge[],
    pathNodeIds: string[]
  ): { nodes: Node[]; edges: Edge[] } {
    const pathSet = new Set(pathNodeIds);
    
    // Highlight nodes in path
    const highlightedNodes = nodes.map(node => ({
      ...node,
      style: {
        ...node.style,
        opacity: pathSet.has(node.id) ? 1 : 0.3,
        border: pathSet.has(node.id) ? '3px solid #4c51ea' : node.style?.border
      }
    }));

    // Highlight edges in path
    const highlightedEdges = edges.map(edge => {
      const sourceInPath = pathSet.has(edge.source);
      const targetInPath = pathSet.has(edge.target);
      const edgeInPath = sourceInPath && targetInPath;

      return {
        ...edge,
        style: {
          ...edge.style,
          opacity: edgeInPath ? 1 : 0.3,
          stroke: edgeInPath ? '#4c51ea' : undefined,
          strokeWidth: edgeInPath ? 3 : undefined
        },
        animated: edgeInPath
      };
    });

    return {
      nodes: highlightedNodes,
      edges: highlightedEdges
    };
  }

  /**
   * Filter nodes and edges by Jungian category
   */
  filterByCategory(
    nodes: Node[],
    edges: Edge[],
    categories: string[]
  ): { nodes: Node[]; edges: Edge[] } {
    const categorySet = new Set(categories);
    
    // Filter nodes
    const filteredNodes = nodes.filter(node => {
      const category = (node.style as any)?.category;
      return !category || categorySet.has(category);
    });

    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));

    // Filter edges (keep only edges where both nodes are visible)
    const filteredEdges = edges.filter(edge => 
      filteredNodeIds.has(edge.source) && filteredNodeIds.has(edge.target)
    );

    return {
      nodes: filteredNodes,
      edges: filteredEdges
    };
  }

  /**
   * Get layout recommendations based on content
   */
  getLayoutRecommendations(
    nodes: Node[],
    edges: Edge[]
  ): Array<{ type: LayoutType; name: string; description: string }> {
    const nodeCount = nodes.length;
    const edgeCount = edges.length;

    const recommendations = [
      {
        type: LayoutType.RADIAL,
        name: 'Radial Layout',
        description: 'Best for exploring concepts from a central theme'
      },
      {
        type: LayoutType.HIERARCHICAL,
        name: 'Hierarchical Layout',
        description: 'Ideal for showing relationships and dependencies'
      },
      {
        type: LayoutType.FORCE_DIRECTED,
        name: 'Force-Directed Layout',
        description: 'Good for discovering natural groupings'
      }
    ];

    if (nodeCount < 15) {
      recommendations.push({
        type: LayoutType.CIRCULAR,
        name: 'Circular Layout',
        description: 'Simple arrangement for small concept groups'
      });
    }

    // Check for tree-like structure
    const hasHierarchy = edges.length < nodes.length * 1.5;
    if (hasHierarchy) {
      recommendations.unshift({
        type: LayoutType.TREE,
        name: 'Tree Layout',
        description: 'Perfect for hierarchical content structure'
      });
    }

    return recommendations;
  }
}