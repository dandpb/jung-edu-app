import { MindMapNode, MindMapEdge } from '../../types';

/**
 * Layout algorithm types
 */
export enum LayoutType {
  HIERARCHICAL = 'hierarchical',
  RADIAL = 'radial',
  FORCE_DIRECTED = 'force_directed',
  CIRCULAR = 'circular',
  TREE = 'tree'
}

/**
 * Layout configuration options
 */
export interface LayoutConfig {
  width: number;
  height: number;
  padding: number;
  nodeSpacing: {
    x: number;
    y: number;
  };
  centerX?: number;
  centerY?: number;
}

/**
 * Node with layout metadata
 */
interface LayoutNode extends MindMapNode {
  layoutData?: {
    level?: number;
    parent?: string;
    children?: string[];
    angle?: number;
    radius?: number;
  };
}

/**
 * MindMapLayouts class for calculating optimal node positions
 */
export class MindMapLayouts {
  private defaultConfig: LayoutConfig = {
    width: 1200,
    height: 800,
    padding: 50,
    nodeSpacing: {
      x: 150,
      y: 100
    }
  };

  /**
   * Apply a layout algorithm to nodes
   */
  applyLayout(
    nodes: MindMapNode[],
    edges: MindMapEdge[],
    layoutType: LayoutType,
    config?: Partial<LayoutConfig>
  ): { nodes: MindMapNode[]; edges: MindMapEdge[] } {
    const layoutConfig = { ...this.defaultConfig, ...config };
    const layoutNodes = this.prepareNodesForLayout(nodes, edges);

    let layoutedNodes: MindMapNode[];
    
    switch (layoutType) {
      case LayoutType.HIERARCHICAL:
        layoutedNodes = this.applyHierarchicalLayout(layoutNodes, layoutConfig);
        break;
      case LayoutType.RADIAL:
        layoutedNodes = this.applyRadialLayout(layoutNodes, edges, layoutConfig);
        break;
      case LayoutType.FORCE_DIRECTED:
        layoutedNodes = this.applyForceDirectedLayout(layoutNodes, edges, layoutConfig);
        break;
      case LayoutType.CIRCULAR:
        layoutedNodes = this.applyCircularLayout(layoutNodes, layoutConfig);
        break;
      case LayoutType.TREE:
        layoutedNodes = this.applyTreeLayout(layoutNodes, edges, layoutConfig);
        break;
      default:
        layoutedNodes = nodes;
    }
    
    return { nodes: layoutedNodes, edges };
  }

  /**
   * Hierarchical layout algorithm (top-down tree structure)
   */
  private applyHierarchicalLayout(
    nodes: LayoutNode[],
    config: LayoutConfig
  ): MindMapNode[] {
    // Handle empty nodes
    if (nodes.length === 0) {
      return [];
    }

    // Find root nodes (nodes with no incoming edges)
    const rootNodes = nodes.filter(n => !n.layoutData?.parent);
    if (rootNodes.length === 0 && nodes.length > 0) {
      rootNodes.push(nodes[0]); // Fallback to first node
    }

    // Calculate levels using BFS
    const levels: LayoutNode[][] = [];
    const visited = new Set<string>();
    const queue: { node: LayoutNode; level: number }[] = 
      rootNodes.map(n => ({ node: n, level: 0 }));

    while (queue.length > 0) {
      const { node, level } = queue.shift()!;
      if (visited.has(node.id)) continue;
      visited.add(node.id);

      if (!levels[level]) levels[level] = [];
      levels[level].push(node);
      node.layoutData!.level = level;

      // Add children to queue
      const children = node.layoutData?.children || [];
      children.forEach(childId => {
        const child = nodes.find(n => n.id === childId);
        if (child && !visited.has(childId)) {
          queue.push({ node: child, level: level + 1 });
        }
      });
    }

    // Calculate positions
    const levelHeight = (config.height - 2 * config.padding) / Math.max(levels.length - 1, 1);
    
    levels.forEach((levelNodes, levelIndex) => {
      const levelWidth = (config.width - 2 * config.padding) / Math.max(levelNodes.length - 1, 1);
      
      levelNodes.forEach((node, nodeIndex) => {
        node.position = {
          x: config.padding + (levelNodes.length === 1 ? 
            (config.width - 2 * config.padding) / 2 : 
            nodeIndex * levelWidth),
          y: config.padding + levelIndex * levelHeight
        };
      });
    });

    return nodes;
  }

  /**
   * Radial layout algorithm (center-out circular arrangement)
   */
  private applyRadialLayout(
    nodes: LayoutNode[],
    edges: MindMapEdge[],
    config: LayoutConfig
  ): MindMapNode[] {
    const centerX = config.centerX || config.width / 2;
    const centerY = config.centerY || config.height / 2;
    const maxRadius = Math.min(
      config.width - 2 * config.padding,
      config.height - 2 * config.padding
    ) / 2;

    // Find central node (node with most connections)
    const connectionCounts = new Map<string, number>();
    edges.forEach(edge => {
      connectionCounts.set(edge.source, (connectionCounts.get(edge.source) || 0) + 1);
      connectionCounts.set(edge.target, (connectionCounts.get(edge.target) || 0) + 1);
    });

    const centralNode = nodes.reduce((max, node) => 
      (connectionCounts.get(node.id) || 0) > (connectionCounts.get(max.id) || 0) ? node : max
    );

    // Place central node
    centralNode.position = { x: centerX, y: centerY };

    // Calculate radial levels
    const levels = this.calculateRadialLevels(nodes, edges, centralNode.id);
    const levelCount = Math.max(...Array.from(levels.values())) + 1;
    const radiusStep = maxRadius / levelCount;

    // Group nodes by level
    const nodesByLevel = new Map<number, LayoutNode[]>();
    nodes.forEach(node => {
      const level = levels.get(node.id) || 0;
      if (!nodesByLevel.has(level)) nodesByLevel.set(level, []);
      nodesByLevel.get(level)!.push(node);
    });

    // Position nodes by level
    nodesByLevel.forEach((levelNodes, level) => {
      if (level === 0) return; // Central node already positioned

      const radius = level * radiusStep;
      const angleStep = (2 * Math.PI) / levelNodes.length;

      levelNodes.forEach((node, index) => {
        const angle = index * angleStep;
        node.position = {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle)
        };
        node.layoutData!.angle = angle;
        node.layoutData!.radius = radius;
      });
    });

    return nodes;
  }

  /**
   * Force-directed layout algorithm (physics simulation)
   */
  private applyForceDirectedLayout(
    nodes: LayoutNode[],
    edges: MindMapEdge[],
    config: LayoutConfig
  ): MindMapNode[] {
    const iterations = 50;
    const repulsionStrength = 5000;
    const attractionStrength = 0.1;
    const damping = 0.8;

    // Initialize random positions
    nodes.forEach(node => {
      if (!node.position) {
        node.position = {
          x: config.padding + Math.random() * (config.width - 2 * config.padding),
          y: config.padding + Math.random() * (config.height - 2 * config.padding)
        };
      }
    });

    // Create velocity map
    const velocities = new Map<string, { x: number; y: number }>();
    nodes.forEach(node => velocities.set(node.id, { x: 0, y: 0 }));

    // Run simulation
    for (let iteration = 0; iteration < iterations; iteration++) {
      // Calculate repulsion forces between all nodes
      nodes.forEach((node1, i) => {
        nodes.forEach((node2, j) => {
          if (i >= j) return;

          const dx = node2.position.x - node1.position.x;
          const dy = node2.position.y - node1.position.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          
          const force = repulsionStrength / (distance * distance);
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;

          const v1 = velocities.get(node1.id)!;
          const v2 = velocities.get(node2.id)!;
          
          v1.x -= fx;
          v1.y -= fy;
          v2.x += fx;
          v2.y += fy;
        });
      });

      // Calculate attraction forces along edges
      edges.forEach(edge => {
        const source = nodes.find(n => n.id === edge.source);
        const target = nodes.find(n => n.id === edge.target);
        if (!source || !target) return;

        const dx = target.position.x - source.position.x;
        const dy = target.position.y - source.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;

        const force = distance * attractionStrength;
        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;

        const v1 = velocities.get(source.id)!;
        const v2 = velocities.get(target.id)!;

        v1.x += fx;
        v1.y += fy;
        v2.x -= fx;
        v2.y -= fy;
      });

      // Apply velocities with damping
      nodes.forEach(node => {
        const velocity = velocities.get(node.id)!;
        
        node.position.x += velocity.x * damping;
        node.position.y += velocity.y * damping;

        // Keep within bounds
        node.position.x = Math.max(config.padding, 
          Math.min(config.width - config.padding, node.position.x));
        node.position.y = Math.max(config.padding, 
          Math.min(config.height - config.padding, node.position.y));

        // Apply damping to velocity
        velocity.x *= damping;
        velocity.y *= damping;
      });
    }

    return nodes;
  }

  /**
   * Circular layout algorithm (nodes arranged in a circle)
   */
  private applyCircularLayout(
    nodes: LayoutNode[],
    config: LayoutConfig
  ): MindMapNode[] {
    const centerX = config.centerX || config.width / 2;
    const centerY = config.centerY || config.height / 2;
    const radius = Math.min(
      config.width - 2 * config.padding,
      config.height - 2 * config.padding
    ) / 2;

    const angleStep = (2 * Math.PI) / nodes.length;

    nodes.forEach((node, index) => {
      const angle = index * angleStep - Math.PI / 2; // Start from top
      node.position = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      };
    });

    return nodes;
  }

  /**
   * Tree layout algorithm (hierarchical with better child distribution)
   */
  private applyTreeLayout(
    nodes: LayoutNode[],
    edges: MindMapEdge[],
    config: LayoutConfig
  ): MindMapNode[] {
    // Build tree structure
    const tree = this.buildTree(nodes, edges);
    const rootNode = tree.root;
    
    if (!rootNode) return nodes;

    // Calculate tree dimensions
    const treeDimensions = this.calculateTreeDimensions(rootNode);
    const xScale = (config.width - 2 * config.padding) / treeDimensions.width;
    const yScale = (config.height - 2 * config.padding) / treeDimensions.height;

    // Position nodes using tree traversal
    this.positionTreeNodes(rootNode, config.padding, config.padding, xScale, yScale);

    return nodes;
  }

  /**
   * Prepare nodes with layout metadata
   */
  private prepareNodesForLayout(
    nodes: MindMapNode[],
    edges: MindMapEdge[]
  ): LayoutNode[] {
    const layoutNodes: LayoutNode[] = nodes.map(node => ({
      ...node,
      layoutData: {
        children: [],
        parent: undefined
      }
    }));

    // Build parent-child relationships
    edges.forEach(edge => {
      const parent = layoutNodes.find(n => n.id === edge.source);
      const child = layoutNodes.find(n => n.id === edge.target);
      
      if (parent && child) {
        parent.layoutData!.children!.push(child.id);
        child.layoutData!.parent = parent.id;
      }
    });

    return layoutNodes;
  }

  /**
   * Calculate radial levels from a central node
   */
  private calculateRadialLevels(
    nodes: LayoutNode[],
    edges: MindMapEdge[],
    centralNodeId: string
  ): Map<string, number> {
    const levels = new Map<string, number>();
    const visited = new Set<string>();
    const queue: { nodeId: string; level: number }[] = [
      { nodeId: centralNodeId, level: 0 }
    ];

    while (queue.length > 0) {
      const { nodeId, level } = queue.shift()!;
      if (visited.has(nodeId)) continue;

      visited.add(nodeId);
      levels.set(nodeId, level);

      // Find connected nodes
      edges.forEach(edge => {
        let connectedId: string | null = null;
        if (edge.source === nodeId) connectedId = edge.target;
        else if (edge.target === nodeId) connectedId = edge.source;

        if (connectedId && !visited.has(connectedId)) {
          queue.push({ nodeId: connectedId, level: level + 1 });
        }
      });
    }

    return levels;
  }

  /**
   * Build tree structure for tree layout
   */
  private buildTree(nodes: LayoutNode[], edges: MindMapEdge[]): { root: LayoutNode | null } {
    // Find root (node with no parent)
    const root = nodes.find(n => !n.layoutData?.parent) || nodes[0];
    return { root };
  }

  /**
   * Calculate dimensions of a tree
   */
  private calculateTreeDimensions(node: LayoutNode): { width: number; height: number } {
    if (!node.layoutData?.children || node.layoutData.children.length === 0) {
      return { width: 1, height: 1 };
    }

    const childDimensions = node.layoutData.children.map(childId => {
      const child = this.findNodeById(childId);
      return child ? this.calculateTreeDimensions(child) : { width: 0, height: 0 };
    });

    const width = childDimensions.reduce((sum, dim) => sum + dim.width, 0);
    const height = 1 + Math.max(...childDimensions.map(dim => dim.height));

    return { width, height };
  }

  /**
   * Position nodes in tree layout
   */
  private positionTreeNodes(
    node: LayoutNode,
    x: number,
    y: number,
    xScale: number,
    yScale: number,
    nodeMap?: Map<string, LayoutNode>
  ) {
    if (!nodeMap) {
      nodeMap = new Map();
      this.buildNodeMap(node, nodeMap);
    }

    node.position = { x, y };

    if (node.layoutData?.children && node.layoutData.children.length > 0) {
      const childCount = node.layoutData.children.length;
      const childWidth = 100 * xScale;
      const totalWidth = childWidth * childCount;
      const startX = x - totalWidth / 2 + childWidth / 2;

      node.layoutData.children.forEach((childId, index) => {
        const child = nodeMap!.get(childId);
        if (child) {
          this.positionTreeNodes(
            child,
            startX + index * childWidth,
            y + 100 * yScale,
            xScale,
            yScale,
            nodeMap
          );
        }
      });
    }
  }

  /**
   * Helper to find node by ID
   */
  private findNodeById(nodeId: string, nodes?: LayoutNode[]): LayoutNode | null {
    // This would need to be implemented based on the actual node storage
    return null;
  }

  /**
   * Build a map of nodes for quick lookup
   */
  private buildNodeMap(node: LayoutNode, map: Map<string, LayoutNode>) {
    map.set(node.id, node);
    if (node.layoutData?.children) {
      node.layoutData.children.forEach(childId => {
        // Would need to access child nodes here
      });
    }
  }

  /**
   * Calculate optimal layout based on node count and connections
   */
  suggestOptimalLayout(nodes: MindMapNode[], edges: MindMapEdge[]): LayoutType {
    const nodeCount = nodes.length;
    const edgeCount = edges.length;
    const density = edgeCount / (nodeCount * (nodeCount - 1) / 2);

    // Hierarchical for tree-like structures
    const hasHierarchy = this.detectHierarchy(nodes, edges);
    if (hasHierarchy && density < 0.3) {
      return LayoutType.HIERARCHICAL;
    }

    // Radial for highly connected central nodes
    const hasCentralNode = this.detectCentralNode(nodes, edges);
    if (hasCentralNode) {
      return LayoutType.RADIAL;
    }

    // Force-directed for complex relationships
    if (density > 0.3) {
      return LayoutType.FORCE_DIRECTED;
    }

    // Circular for simple, evenly connected graphs
    if (nodeCount < 20 && density > 0.1) {
      return LayoutType.CIRCULAR;
    }

    // Default to hierarchical
    return LayoutType.HIERARCHICAL;
  }

  /**
   * Detect if graph has hierarchical structure
   */
  private detectHierarchy(nodes: MindMapNode[], edges: MindMapEdge[]): boolean {
    // Check for nodes with no incoming edges (roots)
    const incomingEdges = new Map<string, number>();
    edges.forEach(edge => {
      incomingEdges.set(edge.target, (incomingEdges.get(edge.target) || 0) + 1);
    });

    const rootNodes = nodes.filter(n => !incomingEdges.has(n.id));
    return rootNodes.length > 0 && rootNodes.length < nodes.length / 4;
  }

  /**
   * Detect if graph has a central node
   */
  private detectCentralNode(nodes: MindMapNode[], edges: MindMapEdge[]): boolean {
    const connectionCounts = new Map<string, number>();
    edges.forEach(edge => {
      connectionCounts.set(edge.source, (connectionCounts.get(edge.source) || 0) + 1);
      connectionCounts.set(edge.target, (connectionCounts.get(edge.target) || 0) + 1);
    });

    const maxConnections = Math.max(...Array.from(connectionCounts.values()));
    const avgConnections = edges.length * 2 / nodes.length;

    return maxConnections > avgConnections * 2;
  }
}