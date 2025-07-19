import { Module, MindMapNode, MindMapEdge } from '../../types';

/**
 * Interface for generated mind map data
 */
export interface GeneratedMindMap {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
  metadata: {
    totalNodes: number;
    depth: number;
    categorization: Record<string, string[]>;
  };
}

/**
 * Jungian archetype categories for node classification
 */
export enum JungianCategory {
  SELF = 'self',
  SHADOW = 'shadow',
  ANIMA_ANIMUS = 'anima_animus',
  PERSONA = 'persona',
  HERO = 'hero',
  WISE_OLD = 'wise_old',
  TRICKSTER = 'trickster',
  MOTHER = 'mother',
  CHILD = 'child',
  COLLECTIVE = 'collective',
  PERSONAL = 'personal',
  PROCESS = 'process',
  CONCEPT = 'concept'
}

/**
 * Category color mapping for visual representation
 */
const CATEGORY_COLORS: Record<JungianCategory, string> = {
  [JungianCategory.SELF]: '#4c51ea',
  [JungianCategory.SHADOW]: '#374151',
  [JungianCategory.ANIMA_ANIMUS]: '#ec4899',
  [JungianCategory.PERSONA]: '#3b82f6',
  [JungianCategory.HERO]: '#ef4444',
  [JungianCategory.WISE_OLD]: '#8b5cf6',
  [JungianCategory.TRICKSTER]: '#f59e0b',
  [JungianCategory.MOTHER]: '#10b981',
  [JungianCategory.CHILD]: '#fbbf24',
  [JungianCategory.COLLECTIVE]: '#6366f1',
  [JungianCategory.PERSONAL]: '#06b6d4',
  [JungianCategory.PROCESS]: '#14b8a6',
  [JungianCategory.CONCEPT]: '#6b7280'
};

/**
 * Node importance levels for sizing and emphasis
 */
export enum NodeImportance {
  CORE = 'core',
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  TERTIARY = 'tertiary'
}

/**
 * MindMapGenerator class for creating mind maps from module content
 */
export class MindMapGenerator {
  private nodeIdCounter = 0;
  private edgeIdCounter = 0;

  /**
   * Generate a mind map from a single module
   */
  generateFromModule(module: Module): GeneratedMindMap {
    const nodes: MindMapNode[] = [];
    const edges: MindMapEdge[] = [];
    const categorization: Record<string, string[]> = {};

    // Create root node for the module
    const rootNode = this.createNode(
      module.title,
      module.description,
      { x: 400, y: 300 },
      NodeImportance.CORE,
      this.categorizeContent(module.title, module.content.introduction),
      module.id
    );
    nodes.push(rootNode);

    // Process sections as primary nodes
    module.content.sections.forEach((section, index) => {
      const angle = (index / module.content.sections.length) * 2 * Math.PI;
      const radius = 250;
      const position = {
        x: 400 + radius * Math.cos(angle),
        y: 300 + radius * Math.sin(angle)
      };

      const sectionNode = this.createNode(
        section.title,
        section.content.substring(0, 150) + '...',
        position,
        NodeImportance.PRIMARY,
        this.categorizeContent(section.title, section.content)
      );
      nodes.push(sectionNode);
      edges.push(this.createEdge(rootNode.id, sectionNode.id, 'contains'));

      // Add key terms as secondary nodes
      if (section.keyTerms) {
        section.keyTerms.slice(0, 3).forEach((term, termIndex) => {
          const termAngle = angle + (termIndex - 1) * 0.2;
          const termRadius = 150;
          const termPosition = {
            x: position.x + termRadius * Math.cos(termAngle),
            y: position.y + termRadius * Math.sin(termAngle)
          };

          const termNode = this.createNode(
            term.term,
            term.definition,
            termPosition,
            NodeImportance.SECONDARY,
            JungianCategory.CONCEPT
          );
          nodes.push(termNode);
          edges.push(this.createEdge(sectionNode.id, termNode.id, 'defines'));
        });
      }
    });

    // Add connections between related concepts
    this.addConceptualConnections(nodes, edges);

    // Build categorization metadata
    nodes.forEach(node => {
      const category = (node.style as any)?.category || JungianCategory.CONCEPT;
      if (!categorization[category]) {
        categorization[category] = [];
      }
      categorization[category].push(node.id);
    });

    return {
      nodes,
      edges,
      metadata: {
        totalNodes: nodes.length,
        depth: 3,
        categorization
      }
    };
  }

  /**
   * Generate a comprehensive mind map from multiple modules
   */
  generateFromModules(modules: Module[]): GeneratedMindMap {
    const nodes: MindMapNode[] = [];
    const edges: MindMapEdge[] = [];
    const categorization: Record<string, string[]> = {};

    // Create central Jung node
    const centralNode = this.createNode(
      "Jung's Analytical Psychology",
      "Comprehensive exploration of Jungian concepts",
      { x: 500, y: 400 },
      NodeImportance.CORE,
      JungianCategory.SELF
    );
    nodes.push(centralNode);

    // Create main category nodes
    const categories = [
      { id: 'conscious', label: 'Conscious Mind', category: JungianCategory.PERSONA, position: { x: 200, y: 200 } },
      { id: 'personal-unconscious', label: 'Personal Unconscious', category: JungianCategory.PERSONAL, position: { x: 800, y: 200 } },
      { id: 'collective-unconscious', label: 'Collective Unconscious', category: JungianCategory.COLLECTIVE, position: { x: 500, y: 600 } }
    ];

    categories.forEach(cat => {
      const catNode = this.createNode(
        cat.label,
        '',
        cat.position,
        NodeImportance.PRIMARY,
        cat.category
      );
      nodes.push(catNode);
      edges.push(this.createEdge(centralNode.id, catNode.id, 'encompasses', true));
    });

    // Add modules distributed across categories
    modules.forEach((module, index) => {
      const categoryIndex = this.assignModuleToCategory(module);
      const baseCategory = categories[categoryIndex];
      const angle = (index / modules.length) * 2 * Math.PI;
      const radius = 200;
      
      const position = {
        x: baseCategory.position.x + radius * Math.cos(angle),
        y: baseCategory.position.y + radius * Math.sin(angle)
      };

      const moduleNode = this.createNode(
        module.title,
        module.description,
        position,
        NodeImportance.SECONDARY,
        this.categorizeModule(module),
        module.id
      );
      nodes.push(moduleNode);
      
      // Find the category node to connect to
      const categoryNode = nodes.find(n => n.data.label === baseCategory.label);
      if (categoryNode) {
        edges.push(this.createEdge(categoryNode.id, moduleNode.id, 'explores'));
      }
    });

    // Add cross-connections based on prerequisites
    modules.forEach(module => {
      if (module.prerequisites) {
        const moduleNode = nodes.find(n => n.data.moduleId === module.id);
        module.prerequisites.forEach(prereqId => {
          const prereqNode = nodes.find(n => n.data.moduleId === prereqId);
          if (moduleNode && prereqNode) {
            edges.push(this.createEdge(prereqNode.id, moduleNode.id, 'prerequisite', false, 'dashed'));
          }
        });
      }
    });

    // Build categorization metadata
    nodes.forEach(node => {
      const category = (node.style as any)?.category || JungianCategory.CONCEPT;
      if (!categorization[category]) {
        categorization[category] = [];
      }
      categorization[category].push(node.id);
    });

    return {
      nodes,
      edges,
      metadata: {
        totalNodes: nodes.length,
        depth: 3,
        categorization
      }
    };
  }

  /**
   * Create a node with Jungian styling
   */
  private createNode(
    label: string,
    description: string,
    position: { x: number; y: number },
    importance: NodeImportance,
    category: JungianCategory,
    moduleId?: string
  ): MindMapNode {
    const nodeId = `node-${this.nodeIdCounter++}`;
    const color = CATEGORY_COLORS[category];
    
    const sizeMap = {
      [NodeImportance.CORE]: { padding: '20px', fontSize: '16px', fontWeight: 'bold' },
      [NodeImportance.PRIMARY]: { padding: '14px', fontSize: '14px', fontWeight: '600' },
      [NodeImportance.SECONDARY]: { padding: '10px', fontSize: '12px', fontWeight: 'normal' },
      [NodeImportance.TERTIARY]: { padding: '8px', fontSize: '11px', fontWeight: 'normal' }
    };

    const style = {
      background: importance === NodeImportance.CORE ? color : '#ffffff',
      color: importance === NodeImportance.CORE ? 'white' : color,
      border: importance !== NodeImportance.CORE ? `2px solid ${color}` : 'none',
      borderRadius: '8px',
      cursor: moduleId ? 'pointer' : 'default',
      category,
      ...sizeMap[importance]
    };

    return {
      id: nodeId,
      data: {
        label,
        description,
        moduleId,
        level: this.getNodeLevel(importance),
        category: category.toString(),
        expandable: false,
        onClick: undefined,
        onHover: undefined,
        interactive: false
      },
      position,
      style: {
        ...style,
        backgroundColor: style.background || '#ffffff',
        strokeWidth: 2
      }
    };
  }

  /**
   * Create an edge with styling
   */
  private createEdge(
    source: string,
    target: string,
    label?: string,
    animated?: boolean,
    type?: string
  ): MindMapEdge {
    return {
      id: `edge-${this.edgeIdCounter++}`,
      source,
      target,
      label,
      animated,
      type,
      style: {}
    };
  }

  /**
   * Get node level based on importance
   */
  private getNodeLevel(importance: NodeImportance): number {
    switch (importance) {
      case NodeImportance.CORE:
        return 0;
      case NodeImportance.PRIMARY:
        return 1;
      case NodeImportance.SECONDARY:
        return 2;
      case NodeImportance.TERTIARY:
        return 3;
      default:
        return 1;
    }
  }

  /**
   * Categorize content based on Jungian concepts
   */
  private categorizeContent(title: string, content: string): JungianCategory {
    const text = (title + ' ' + content).toLowerCase();
    
    if (text.includes('self') && text.includes('realization')) return JungianCategory.SELF;
    if (text.includes('shadow')) return JungianCategory.SHADOW;
    if (text.includes('anima') || text.includes('animus')) return JungianCategory.ANIMA_ANIMUS;
    if (text.includes('persona')) return JungianCategory.PERSONA;
    if (text.includes('hero')) return JungianCategory.HERO;
    if (text.includes('wise old') || text.includes('senex')) return JungianCategory.WISE_OLD;
    if (text.includes('trickster')) return JungianCategory.TRICKSTER;
    if (text.includes('mother') || text.includes('great mother')) return JungianCategory.MOTHER;
    if (text.includes('child') || text.includes('puer')) return JungianCategory.CHILD;
    if (text.includes('collective unconscious')) return JungianCategory.COLLECTIVE;
    if (text.includes('personal unconscious')) return JungianCategory.PERSONAL;
    if (text.includes('individuation') || text.includes('process')) return JungianCategory.PROCESS;
    
    return JungianCategory.CONCEPT;
  }

  /**
   * Categorize an entire module
   */
  private categorizeModule(module: Module): JungianCategory {
    const fullText = [
      module.title,
      module.description,
      module.content.introduction,
      ...module.content.sections.map((s: any) => s.title + ' ' + s.content)
    ].join(' ');

    return this.categorizeContent(module.title, fullText);
  }

  /**
   * Assign module to a main category (0: conscious, 1: personal unconscious, 2: collective unconscious)
   */
  private assignModuleToCategory(module: Module): number {
    const category = this.categorizeModule(module);
    
    if ([JungianCategory.PERSONA, JungianCategory.CONCEPT].includes(category)) {
      return 0; // Conscious
    } else if ([JungianCategory.PERSONAL, JungianCategory.SHADOW, JungianCategory.PROCESS].includes(category)) {
      return 1; // Personal Unconscious
    } else {
      return 2; // Collective Unconscious
    }
  }

  /**
   * Add conceptual connections between related nodes
   */
  private addConceptualConnections(nodes: MindMapNode[], edges: MindMapEdge[]) {
    // Add connections between archetypes
    const archetypeCategories = [
      JungianCategory.SHADOW,
      JungianCategory.ANIMA_ANIMUS,
      JungianCategory.HERO,
      JungianCategory.WISE_OLD,
      JungianCategory.TRICKSTER,
      JungianCategory.MOTHER,
      JungianCategory.CHILD
    ];

    const archetypeNodes = nodes.filter(n => 
      archetypeCategories.includes((n.style as any)?.category)
    );

    // Connect complementary archetypes
    const complementaryPairs = [
      [JungianCategory.SHADOW, JungianCategory.PERSONA],
      [JungianCategory.ANIMA_ANIMUS, JungianCategory.SELF],
      [JungianCategory.CHILD, JungianCategory.WISE_OLD],
      [JungianCategory.HERO, JungianCategory.TRICKSTER]
    ];

    complementaryPairs.forEach(([cat1, cat2]) => {
      const node1 = nodes.find(n => (n.style as any)?.category === cat1);
      const node2 = nodes.find(n => (n.style as any)?.category === cat2);
      if (node1 && node2 && !edges.some(e => 
        (e.source === node1.id && e.target === node2.id) ||
        (e.source === node2.id && e.target === node1.id)
      )) {
        edges.push(this.createEdge(node1.id, node2.id, 'complements', false, 'dashed'));
      }
    });
  }

  /**
   * Generate a mind map from concepts with a root concept
   */
  generateMindMap(
    concepts: string[], 
    rootConcept: string, 
    options: {
      layout?: 'hierarchical' | 'radial' | 'force-directed';
      direction?: 'TB' | 'LR' | 'BT' | 'RL';
      interactive?: boolean;
      nodeStyles?: any;
      edgeStyles?: any;
    } = {}
  ): GeneratedMindMap {
    // Validate inputs
    if (!concepts || !Array.isArray(concepts)) {
      throw new Error('Invalid concepts array');
    }
    if (!rootConcept || typeof rootConcept !== 'string' || rootConcept.trim() === '') {
      throw new Error('Invalid root concept');
    }
    
    // Validate layout option
    if (options.layout && !['hierarchical', 'radial', 'force-directed'].includes(options.layout)) {
      throw new Error('Invalid layout type');
    }
    const nodes: MindMapNode[] = [];
    const edges: MindMapEdge[] = [];
    const categorization: Record<string, string[]> = {};

    // Create root node
    const rootNode = this.createNode(
      rootConcept,
      `Central concept: ${rootConcept}`,
      { x: 400, y: 300 },
      NodeImportance.CORE,
      this.categorizeContent(rootConcept, ''),
      undefined
    );
    
    // Set main category for root
    rootNode.data.category = 'main';
    
    // Apply custom node styles for root
    if (options.nodeStyles) {
      if (options.nodeStyles['main']) {
        rootNode.style = { ...rootNode.style, ...options.nodeStyles['main'] };
      } else if (options.nodeStyles[rootConcept]) {
        rootNode.style = { ...rootNode.style, ...options.nodeStyles[rootConcept] };
      }
    }
    
    // Add interactive properties to root if needed
    if (options.interactive) {
      rootNode.data.interactive = true;
      rootNode.data.onClick = () => console.log(`Clicked: ${rootConcept}`);
      rootNode.data.onHover = () => console.log(`Hovered: ${rootConcept}`);
      rootNode.data.expandable = false;
    }
    
    nodes.push(rootNode);

    // Remove duplicates and filter out root concept
    const uniqueConcepts = [...new Set(concepts)].filter(c => c !== rootConcept);
    
    // Add concept nodes based on layout
    uniqueConcepts.forEach((concept, index) => {
      let position: { x: number; y: number };
      
      if (options.layout === 'radial') {
        const angle = (index / uniqueConcepts.length) * 2 * Math.PI;
        const radius = 200;
        position = {
          x: 400 + radius * Math.cos(angle),
          y: 300 + radius * Math.sin(angle)
        };
      } else if (options.layout === 'hierarchical') {
        const level = Math.floor(index / 3) + 1;
        const indexInLevel = index % 3;
        const baseY = options.direction === 'TB' ? 300 : 300;
        const offsetY = options.direction === 'TB' ? level * 150 : 0;
        position = {
          x: 250 + (indexInLevel * 150),
          y: baseY + offsetY
        };
      } else {
        // force-directed or default
        position = {
          x: 200 + Math.random() * 400,
          y: 200 + Math.random() * 200
        };
      }
      
      const level = Math.floor(index / 3) + 1;
      const conceptNode = this.createNode(
        concept,
        `Concept: ${concept}`,
        position,
        NodeImportance.PRIMARY,
        this.categorizeContent(concept, ''),
        undefined
      );
      conceptNode.data.level = level;
      conceptNode.data.category = index < 3 ? 'core-concept' : index < 6 ? 'sub-concept' : 'detail';
      
      // Apply custom node styles
      const nodeCategory = conceptNode.data.category || 'concept';
      if (options.nodeStyles) {
        if (options.nodeStyles[nodeCategory]) {
          conceptNode.style = { ...conceptNode.style, ...options.nodeStyles[nodeCategory] };
        } else if (options.nodeStyles[concept]) {
          conceptNode.style = { ...conceptNode.style, ...options.nodeStyles[concept] };
        }
      }
      
        // Add interactive properties
      if (options.interactive) {
        conceptNode.data.interactive = true;
        conceptNode.data.onClick = () => console.log(`Clicked: ${concept}`);
        conceptNode.data.onHover = () => console.log(`Hovered: ${concept}`);
        conceptNode.data.expandable = false;
      }
      
      nodes.push(conceptNode);
      
      // Create edge
      const edge = this.createEdge(rootNode.id, conceptNode.id, 'relates to');
      
      // Apply custom edge styles
      if (options.edgeStyles) {
        if (options.edgeStyles.default) {
          edge.style = {
            strokeWidth: options.edgeStyles.default.strokeWidth || 2,
            stroke: options.edgeStyles.default.stroke || '#999999'
          };
        } else {
          // Apply directly if not nested under 'default'
          edge.style = {
            strokeWidth: options.edgeStyles.strokeWidth || 2,
            stroke: options.edgeStyles.stroke || '#999999'
          };
        }
      }
      
      edges.push(edge);
    });
    
    // Mark nodes with children as expandable
    if (options.interactive) {
      nodes.forEach(node => {
        const hasChildren = edges.some(e => e.source === node.id);
        node.data.expandable = hasChildren;
      });
    }

    // Build categorization
    nodes.forEach(node => {
      const category = (node.style as any)?.category || JungianCategory.CONCEPT;
      if (!categorization[category]) {
        categorization[category] = [];
      }
      categorization[category].push(node.id);
    });

    return {
      nodes,
      edges,
      metadata: {
        totalNodes: nodes.length,
        depth: 2,
        categorization
      }
    };
  }

  /**
   * Generate a concept map from related concepts
   */
  generateConceptMap(concepts: Record<string, string[]>): GeneratedMindMap {
    const nodes: MindMapNode[] = [];
    const edges: MindMapEdge[] = [];
    const categorization: Record<string, string[]> = {};
    const nodeMap: Record<string, MindMapNode> = {};

    // Create nodes for all concepts (main concepts and their related concepts)
    const allConcepts = new Set<string>();
    Object.keys(concepts).forEach(concept => {
      allConcepts.add(concept);
      concepts[concept].forEach(related => allConcepts.add(related));
    });
    
    // Create nodes for all unique concepts
    [...allConcepts].forEach((concept, index) => {
      const angle = (index / allConcepts.size) * 2 * Math.PI;
      const radius = 250;
      const position = {
        x: 400 + radius * Math.cos(angle),
        y: 300 + radius * Math.sin(angle)
      };

      const node = this.createNode(
        concept,
        `Core concept: ${concept}`,
        position,
        NodeImportance.PRIMARY,
        this.categorizeContent(concept, concepts[concept]?.join(' ') || ''),
        undefined
      );
      
      nodes.push(node);
      nodeMap[concept] = node;
    });

    // Create edges based on relationships
    Object.entries(concepts).forEach(([concept, relatedConcepts]) => {
      const sourceNode = nodeMap[concept];
      
      relatedConcepts.forEach(related => {
        // Check if the related concept exists as a node
        if (nodeMap[related]) {
          // Avoid duplicate edges
          const edgeExists = edges.some(e => 
            (e.source === sourceNode.id && e.target === nodeMap[related].id) ||
            (e.source === nodeMap[related].id && e.target === sourceNode.id)
          );
          
          if (!edgeExists) {
            edges.push(this.createEdge(sourceNode.id, nodeMap[related].id, 'connects to'));
          }
        }
      });
    });

    // Build categorization
    nodes.forEach(node => {
      const category = (node.style as any)?.category || JungianCategory.CONCEPT;
      if (!categorization[category]) {
        categorization[category] = [];
      }
      categorization[category].push(node.id);
    });

    return {
      nodes,
      edges,
      metadata: {
        totalNodes: nodes.length,
        depth: 1,
        categorization
      }
    };
  }

  /**
   * Export mind map to JSON format
   */
  exportToJSON(mindMap: GeneratedMindMap): string {
    return JSON.stringify(mindMap, null, 2);
  }

  /**
   * Export mind map to DOT format for Graphviz
   */
  exportToDOT(mindMap: GeneratedMindMap): string {
    let dot = 'digraph MindMap {\n';
    dot += '  rankdir=TB;\n';
    dot += '  node [shape=box, style=rounded];\n\n';
    
    // Add nodes
    mindMap.nodes.forEach(node => {
      const label = node.data.label.replace(/"/g, '\\"');
      dot += `  "${node.id}" [label="${label}"];\n`;
    });
    
    dot += '\n';
    
    // Add edges
    mindMap.edges.forEach(edge => {
      const label = edge.label ? ` [label="${edge.label}"]` : '';
      dot += `  "${edge.source}" -> "${edge.target}"${label};\n`;
    });
    
    dot += '}';
    return dot;
  }

  /**
   * Export mind map to SVG format
   */
  exportToSVG(mindMap: GeneratedMindMap): string {
    // Simple SVG export - in production, use a proper SVG library
    let svg = '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">\n';
    
    // Add edges as lines
    mindMap.edges.forEach(edge => {
      const sourceNode = mindMap.nodes.find(n => n.id === edge.source);
      const targetNode = mindMap.nodes.find(n => n.id === edge.target);
      if (sourceNode && targetNode) {
        svg += `  <line x1="${sourceNode.position.x}" y1="${sourceNode.position.y}" `;
        svg += `x2="${targetNode.position.x}" y2="${targetNode.position.y}" `;
        svg += 'stroke="gray" stroke-width="1"/>\n';
      }
    });
    
    // Add nodes as rectangles with text
    mindMap.nodes.forEach(node => {
      const { x, y } = node.position;
      const width = 120;
      const height = 40;
      
      svg += `  <rect x="${x - width/2}" y="${y - height/2}" `;
      svg += `width="${width}" height="${height}" `;
      svg += 'fill="white" stroke="black" stroke-width="2" rx="5"/>\n';
      
      svg += `  <text x="${x}" y="${y}" `;
      svg += 'text-anchor="middle" dominant-baseline="middle" ';
      svg += `font-family="Arial" font-size="12">${node.data.label}</text>\n`;
    });
    
    svg += '</svg>';
    return svg;
  }
}