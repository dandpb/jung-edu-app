import { ILLMProvider, LLMGenerationOptions } from '../llm/types';

export interface JungianArchetype {
  name: string;
  description: string;
  symbolism: string[];
  manifestations: string[];
  relationships: string[];
}

export interface EducationalMindMap {
  id: string;
  title: string;
  subject: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  nodes: EducationalNode[];
  edges: EducationalEdge[];
  learningObjectives: string[];
  prerequisites: string[];
  assessmentPoints: string[];
}

export interface EducationalNode {
  id: string;
  label: string;
  type: 'concept' | 'skill' | 'knowledge' | 'application' | 'synthesis';
  cognitiveLevel: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
  content: {
    definition: string;
    examples: string[];
    keyPoints: string[];
  };
  jungianContext?: {
    archetype?: string;
    psycheLevel: 'conscious' | 'personal-unconscious' | 'collective-unconscious';
    symbolism?: string[];
  };
  position: { x: number; y: number };
  difficulty: number; // 0-1 scale
  importance: number; // 0-1 scale
}

export interface EducationalEdge {
  id: string;
  from: string;
  to: string;
  type: 'prerequisite' | 'supports' | 'contradicts' | 'examples' | 'relates' | 'builds-on';
  strength: 'weak' | 'medium' | 'strong';
  label?: string;
  learningPath?: boolean;
}

export interface InteractiveMindMapFeatures {
  zoomEnabled: boolean;
  panEnabled: boolean;
  nodeExpansion: boolean;
  searchHighlight: boolean;
  pathTracing: boolean;
  progressTracking: boolean;
}

export interface MindMapVisualizationData {
  theme: 'light' | 'dark' | 'jung' | 'educational';
  nodeStyles: {
    [key: string]: {
      color: string;
      shape: string;
      size: number;
    };
  };
  edgeStyles: {
    [key: string]: {
      color: string;
      width: number;
      style: 'solid' | 'dashed' | 'dotted';
    };
  };
  layout: 'hierarchical' | 'radial' | 'force-directed' | 'circular';
  animations: boolean;
}

export interface LayoutAlgorithmConfig {
  algorithm: 'hierarchical' | 'force-directed' | 'radial' | 'circular' | 'layered';
  parameters: {
    nodeSpacing?: number;
    levelSeparation?: number;
    centerForce?: number;
    repulsionForce?: number;
    attractionForce?: number;
    iterations?: number;
  };
}

export interface ConceptMappingAnalysis {
  conceptDensity: number;
  relationshipComplexity: number;
  hierarchyDepth: number;
  crossConnections: number;
  cognitiveLoad: number;
  learningEfficiency: number;
}

export class LLMMindMapGenerator {
  constructor(private provider: ILLMProvider) {}

  /**
   * Generates an educational mind map focused on Jung's analytical psychology
   */
  async generateJungianMindMap(
    topic: string,
    focusAreas: string[],
    difficulty: 'beginner' | 'intermediate' | 'advanced',
    language: string = 'en'
  ): Promise<EducationalMindMap> {
    this.validateJungianInputs(topic, focusAreas);

    const prompt = this.buildJungianPrompt(topic, focusAreas, difficulty, language);
    const schema = this.getJungianMindMapSchema();

    try {
      const result = await this.provider.generateStructuredOutput(
        prompt,
        schema,
        { temperature: 0.4, maxTokens: 3000 }
      );

      return this.processJungianResult(result, topic, difficulty);
    } catch (error) {
      throw new Error(`Failed to generate Jungian mind map: ${(error as Error).message}`);
    }
  }

  /**
   * Generates concept relationships using Jung's psychological frameworks
   */
  async generateConceptRelationships(
    concepts: string[],
    jungianFramework: 'archetypes' | 'complexes' | 'psychological-types' | 'individuation'
  ): Promise<EducationalEdge[]> {
    if (concepts.length < 2) {
      throw new Error('At least 2 concepts required for relationship generation');
    }

    const prompt = this.buildRelationshipPrompt(concepts, jungianFramework);
    const schema = this.getRelationshipSchema();

    try {
      const result = await this.provider.generateStructuredOutput(
        prompt,
        schema,
        { temperature: 0.3 }
      );

      return this.processRelationshipResult(result);
    } catch (error) {
      throw new Error(`Failed to generate concept relationships: ${(error as Error).message}`);
    }
  }

  /**
   * Applies layout algorithms for optimal visualization
   */
  async optimizeLayout(
    mindMap: EducationalMindMap,
    config: LayoutAlgorithmConfig
  ): Promise<EducationalMindMap> {
    const optimizedNodes = await this.applyLayoutAlgorithm(mindMap.nodes, mindMap.edges, config);

    return {
      ...mindMap,
      nodes: optimizedNodes
    };
  }

  /**
   * Analyzes cognitive load and educational effectiveness
   */
  async analyzeConceptMapping(mindMap: EducationalMindMap): Promise<ConceptMappingAnalysis> {
    const conceptDensity = this.calculateConceptDensity(mindMap.nodes);
    const relationshipComplexity = this.calculateRelationshipComplexity(mindMap.edges);
    const hierarchyDepth = this.calculateHierarchyDepth(mindMap.nodes, mindMap.edges);
    const crossConnections = this.calculateCrossConnections(mindMap.edges);
    
    // Cognitive load assessment based on Miller's 7±2 rule and educational psychology
    const cognitiveLoad = this.assessCognitiveLoad(
      conceptDensity,
      relationshipComplexity,
      hierarchyDepth
    );
    
    const learningEfficiency = this.calculateLearningEfficiency(
      conceptDensity,
      relationshipComplexity,
      cognitiveLoad
    );

    return {
      conceptDensity,
      relationshipComplexity,
      hierarchyDepth,
      crossConnections,
      cognitiveLoad,
      learningEfficiency
    };
  }

  /**
   * Generates visualization data for interactive features
   */
  generateVisualizationData(
    mindMap: EducationalMindMap,
    interactiveFeatures: InteractiveMindMapFeatures
  ): MindMapVisualizationData {
    const theme = mindMap.subject.toLowerCase().includes('jung') ? 'jung' : 'educational';
    
    return {
      theme,
      nodeStyles: this.generateNodeStyles(mindMap.nodes, theme),
      edgeStyles: this.generateEdgeStyles(mindMap.edges, theme),
      layout: this.determineOptimalLayout(mindMap),
      animations: interactiveFeatures.nodeExpansion
    };
  }

  /**
   * Creates progressive learning paths through the mind map
   */
  async generateLearningPath(
    mindMap: EducationalMindMap,
    startConcept: string,
    endConcept: string
  ): Promise<string[]> {
    const startNode = mindMap.nodes.find(n => n.id === startConcept);
    const endNode = mindMap.nodes.find(n => n.id === endConcept);

    if (!startNode || !endNode) {
      throw new Error('Start or end concept not found in mind map');
    }

    // Use Dijkstra's algorithm with educational weighting
    return this.calculateOptimalLearningPath(
      mindMap.nodes,
      mindMap.edges,
      startConcept,
      endConcept
    );
  }

  // Private helper methods
  private validateJungianInputs(topic: string, focusAreas: string[]): void {
    if (!topic.trim()) {
      throw new Error('Topic cannot be empty');
    }
    if (focusAreas.length === 0) {
      throw new Error('At least one focus area is required');
    }
    if (focusAreas.length > 10) {
      throw new Error('Too many focus areas (maximum 10)');
    }
  }

  private buildJungianPrompt(
    topic: string,
    focusAreas: string[],
    difficulty: string,
    language: string
  ): string {
    const isPortuguese = language.startsWith('pt');
    
    const jungianConcepts = {
      archetypes: ['Shadow', 'Anima/Animus', 'Persona', 'Self', 'Hero', 'Trickster', 'Wise Old Man', 'Great Mother'],
      complexes: ['Mother Complex', 'Father Complex', 'Inferiority Complex', 'Power Complex'],
      psycheStructure: ['Conscious', 'Personal Unconscious', 'Collective Unconscious'],
      functions: ['Thinking', 'Feeling', 'Sensation', 'Intuition'],
      attitudes: ['Extraversion', 'Introversion'],
      individuation: ['Integration', 'Self-realization', 'Wholeness', 'Transcendence']
    };

    if (isPortuguese) {
      return `Crie um mapa mental educacional detalhado sobre "${topic}" focando em: ${focusAreas.join(', ')}.
      
      Contexto Jungiano:
      - Integre conceitos da psicologia analítica de Carl Jung
      - Conecte com arquétipos, complexos, e estruturas da psique
      - Considere o processo de individuação
      
      Nível: ${difficulty}
      
      O mapa deve incluir:
      - Nós educacionais com níveis cognitivos (lembrar, compreender, aplicar, analisar, avaliar, criar)
      - Conexões que mostram pré-requisitos e relacionamentos conceituais
      - Contexto junguiano para conceitos relevantes
      - Objetivos de aprendizagem claros
      - Pontos de avaliação
      
      Limite a 25 conceitos principais para otimizar a carga cognitiva.`;
    }

    return `Create a detailed educational mind map about "${topic}" focusing on: ${focusAreas.join(', ')}.
    
    Jungian Context:
    - Integrate concepts from Carl Jung's analytical psychology
    - Connect with archetypes, complexes, and psyche structures
    - Consider the individuation process
    
    Difficulty Level: ${difficulty}
    
    The mind map should include:
    - Educational nodes with cognitive levels (remember, understand, apply, analyze, evaluate, create)
    - Connections showing prerequisites and conceptual relationships
    - Jungian context for relevant concepts
    - Clear learning objectives
    - Assessment points
    
    Limit to 25 core concepts to optimize cognitive load.`;
  }

  private buildRelationshipPrompt(
    concepts: string[],
    framework: string
  ): string {
    return `Analyze the relationships between these concepts using Jung's ${framework} framework: ${concepts.join(', ')}.
    
    Create educational connections that show:
    - Prerequisites (what must be learned first)
    - Supporting relationships (concepts that reinforce each other)
    - Building relationships (concepts that build upon others)
    - Contradictory relationships (concepts that create tension)
    - Examples relationships (concrete to abstract connections)
    
    Consider Jung's understanding of:
    - Psychological dynamics
    - Compensatory relationships
    - Archetypal patterns
    - Individuation process
    
    Each relationship should have educational significance and clear learning implications.`;
  }

  private getJungianMindMapSchema() {
    return {
      type: 'object',
      properties: {
        title: { type: 'string' },
        subject: { type: 'string' },
        nodes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              label: { type: 'string' },
              type: { type: 'string', enum: ['concept', 'skill', 'knowledge', 'application', 'synthesis'] },
              cognitiveLevel: { type: 'string', enum: ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'] },
              content: {
                type: 'object',
                properties: {
                  definition: { type: 'string' },
                  examples: { type: 'array', items: { type: 'string' } },
                  keyPoints: { type: 'array', items: { type: 'string' } }
                },
                required: ['definition', 'examples', 'keyPoints']
              },
              jungianContext: {
                type: 'object',
                properties: {
                  archetype: { type: 'string' },
                  psycheLevel: { type: 'string', enum: ['conscious', 'personal-unconscious', 'collective-unconscious'] },
                  symbolism: { type: 'array', items: { type: 'string' } }
                }
              },
              difficulty: { type: 'number', minimum: 0, maximum: 1 },
              importance: { type: 'number', minimum: 0, maximum: 1 }
            },
            required: ['id', 'label', 'type', 'cognitiveLevel', 'content', 'difficulty', 'importance']
          }
        },
        edges: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              from: { type: 'string' },
              to: { type: 'string' },
              type: { type: 'string', enum: ['prerequisite', 'supports', 'contradicts', 'examples', 'relates', 'builds-on'] },
              strength: { type: 'string', enum: ['weak', 'medium', 'strong'] },
              learningPath: { type: 'boolean' }
            },
            required: ['from', 'to', 'type', 'strength']
          }
        },
        learningObjectives: { type: 'array', items: { type: 'string' } },
        prerequisites: { type: 'array', items: { type: 'string' } },
        assessmentPoints: { type: 'array', items: { type: 'string' } }
      },
      required: ['title', 'subject', 'nodes', 'edges', 'learningObjectives']
    };
  }

  private getRelationshipSchema() {
    return {
      type: 'object',
      properties: {
        relationships: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              from: { type: 'string' },
              to: { type: 'string' },
              type: { type: 'string' },
              strength: { type: 'string' },
              explanation: { type: 'string' },
              educationalSignificance: { type: 'string' }
            },
            required: ['from', 'to', 'type', 'strength', 'explanation']
          }
        }
      },
      required: ['relationships']
    };
  }

  private processJungianResult(result: any, topic: string, difficulty: string): EducationalMindMap {
    if (!result || !result.nodes || !result.edges) {
      throw new Error('Invalid Jungian mind map structure');
    }

    const nodes: EducationalNode[] = result.nodes.map((node: any, index: number) => ({
      ...node,
      position: { x: 0, y: 0 }, // Will be set by layout algorithm
      difficulty: node.difficulty || this.getDefaultDifficulty(difficulty),
      importance: node.importance || 0.5
    }));

    const edges: EducationalEdge[] = result.edges.map((edge: any, index: number) => ({
      id: `edge-${index}`,
      from: edge.from,
      to: edge.to,
      type: edge.type,
      strength: edge.strength,
      label: edge.label,
      learningPath: edge.learningPath || false
    }));

    return {
      id: `jungian-mindmap-${Date.now()}`,
      title: result.title || topic,
      subject: result.subject || 'Jungian Psychology',
      level: difficulty as any,
      nodes,
      edges,
      learningObjectives: result.learningObjectives || [],
      prerequisites: result.prerequisites || [],
      assessmentPoints: result.assessmentPoints || []
    };
  }

  private processRelationshipResult(result: any): EducationalEdge[] {
    if (!result || !result.relationships) {
      return [];
    }

    return result.relationships.map((rel: any, index: number) => ({
      id: `rel-${index}`,
      from: rel.from,
      to: rel.to,
      type: rel.type,
      strength: rel.strength,
      label: rel.explanation,
      learningPath: rel.type === 'prerequisite'
    }));
  }

  private async applyLayoutAlgorithm(
    nodes: EducationalNode[],
    edges: EducationalEdge[],
    config: LayoutAlgorithmConfig
  ): Promise<EducationalNode[]> {
    switch (config.algorithm) {
      case 'hierarchical':
        return this.applyHierarchicalLayout(nodes, edges, config.parameters);
      case 'force-directed':
        return this.applyForceDirectedLayout(nodes, edges, config.parameters);
      case 'radial':
        return this.applyRadialLayout(nodes, edges, config.parameters);
      case 'circular':
        return this.applyCircularLayout(nodes, config.parameters);
      case 'layered':
        return this.applyLayeredLayout(nodes, edges, config.parameters);
      default:
        throw new Error(`Unsupported layout algorithm: ${config.algorithm}`);
    }
  }

  private applyHierarchicalLayout(
    nodes: EducationalNode[],
    edges: EducationalEdge[],
    params: any
  ): EducationalNode[] {
    const nodeSpacing = params.nodeSpacing || 150;
    const levelSeparation = params.levelSeparation || 100;
    
    // Find root nodes (nodes with no incoming prerequisites)
    const hasIncomingEdge = new Set(edges.filter(e => e.type === 'prerequisite').map(e => e.to));
    const rootNodes = nodes.filter(n => !hasIncomingEdge.has(n.id));
    
    const levels: EducationalNode[][] = [];
    const visited = new Set<string>();
    const queue: { node: EducationalNode; level: number }[] = rootNodes.map(node => ({ node, level: 0 }));
    
    while (queue.length > 0) {
      const { node, level } = queue.shift()!;
      
      if (visited.has(node.id)) continue;
      visited.add(node.id);
      
      if (!levels[level]) levels[level] = [];
      levels[level].push(node);
      
      // Find child nodes
      const childEdges = edges.filter(e => e.from === node.id && e.type === 'prerequisite');
      childEdges.forEach(edge => {
        const childNode = nodes.find(n => n.id === edge.to);
        if (childNode && !visited.has(childNode.id)) {
          queue.push({ node: childNode, level: level + 1 });
        }
      });
    }
    
    // Position nodes
    return nodes.map(node => {
      const levelIndex = levels.findIndex(level => level.includes(node));
      const positionInLevel = levels[levelIndex]?.indexOf(node) || 0;
      const levelWidth = (levels[levelIndex]?.length || 1) * nodeSpacing;
      
      return {
        ...node,
        position: {
          x: positionInLevel * nodeSpacing - levelWidth / 2,
          y: levelIndex * levelSeparation
        }
      };
    });
  }

  private applyForceDirectedLayout(
    nodes: EducationalNode[],
    edges: EducationalEdge[],
    params: any
  ): EducationalNode[] {
    const iterations = params.iterations || 50;
    const centerForce = params.centerForce || 0.1;
    const repulsionForce = params.repulsionForce || 1000;
    const attractionForce = params.attractionForce || 0.01;
    
    let positionedNodes = nodes.map(node => ({
      ...node,
      position: node.position.x === 0 && node.position.y === 0 
        ? { x: Math.random() * 500 - 250, y: Math.random() * 500 - 250 }
        : node.position,
      velocity: { x: 0, y: 0 }
    }));
    
    for (let i = 0; i < iterations; i++) {
      // Reset forces
      positionedNodes.forEach(node => {
        (node as any).velocity = { x: 0, y: 0 };
      });
      
      // Repulsion between all nodes
      for (let j = 0; j < positionedNodes.length; j++) {
        for (let k = j + 1; k < positionedNodes.length; k++) {
          const nodeA = positionedNodes[j];
          const nodeB = positionedNodes[k];
          const dx = nodeA.position.x - nodeB.position.x;
          const dy = nodeA.position.y - nodeB.position.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = repulsionForce / (distance * distance);
          
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;
          
          (nodeA as any).velocity.x += fx;
          (nodeA as any).velocity.y += fy;
          (nodeB as any).velocity.x -= fx;
          (nodeB as any).velocity.y -= fy;
        }
      }
      
      // Attraction along edges
      edges.forEach(edge => {
        const nodeA = positionedNodes.find(n => n.id === edge.from);
        const nodeB = positionedNodes.find(n => n.id === edge.to);
        
        if (nodeA && nodeB) {
          const dx = nodeB.position.x - nodeA.position.x;
          const dy = nodeB.position.y - nodeA.position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          const force = distance * attractionForce;
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;
          
          (nodeA as any).velocity.x += fx;
          (nodeA as any).velocity.y += fy;
          (nodeB as any).velocity.x -= fx;
          (nodeB as any).velocity.y -= fy;
        }
      });
      
      // Center force
      positionedNodes.forEach(node => {
        (node as any).velocity.x -= node.position.x * centerForce;
        (node as any).velocity.y -= node.position.y * centerForce;
      });
      
      // Update positions
      positionedNodes.forEach(node => {
        node.position.x += (node as any).velocity.x;
        node.position.y += (node as any).velocity.y;
      });
    }
    
    return positionedNodes.map(({ velocity, ...node }: any) => node);
  }

  private applyRadialLayout(
    nodes: EducationalNode[],
    edges: EducationalEdge[],
    params: any
  ): EducationalNode[] {
    const centerNode = nodes.find(n => n.type === 'concept' && n.importance > 0.8) || nodes[0];
    const radius = params.radius || 200;
    const angleStep = (2 * Math.PI) / (nodes.length - 1);
    
    return nodes.map((node, index) => {
      if (node.id === centerNode.id) {
        return { ...node, position: { x: 0, y: 0 } };
      }
      
      const adjustedIndex = index > nodes.indexOf(centerNode) ? index - 1 : index;
      const angle = adjustedIndex * angleStep;
      
      return {
        ...node,
        position: {
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius
        }
      };
    });
  }

  private applyCircularLayout(nodes: EducationalNode[], params: any): EducationalNode[] {
    const radius = params.radius || 200;
    const angleStep = (2 * Math.PI) / nodes.length;
    
    return nodes.map((node, index) => ({
      ...node,
      position: {
        x: Math.cos(index * angleStep) * radius,
        y: Math.sin(index * angleStep) * radius
      }
    }));
  }

  private applyLayeredLayout(
    nodes: EducationalNode[],
    edges: EducationalEdge[],
    params: any
  ): EducationalNode[] {
    // Group nodes by cognitive level
    const levels = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];
    const layerSpacing = params.layerSpacing || 120;
    const nodeSpacing = params.nodeSpacing || 150;
    
    const layers: { [key: string]: EducationalNode[] } = {};
    levels.forEach(level => {
      layers[level] = nodes.filter(n => n.cognitiveLevel === level);
    });
    
    return nodes.map(node => {
      const levelIndex = levels.indexOf(node.cognitiveLevel);
      const layerNodes = layers[node.cognitiveLevel];
      const positionInLayer = layerNodes.indexOf(node);
      const layerWidth = layerNodes.length * nodeSpacing;
      
      return {
        ...node,
        position: {
          x: positionInLayer * nodeSpacing - layerWidth / 2,
          y: levelIndex * layerSpacing
        }
      };
    });
  }

  private calculateConceptDensity(nodes: EducationalNode[]): number {
    return Math.min(nodes.length / 15, 1); // Normalize to 0-1, with 15 as optimal density
  }

  private calculateRelationshipComplexity(edges: EducationalEdge[]): number {
    const typeWeights = {
      'prerequisite': 1,
      'supports': 0.8,
      'relates': 0.6,
      'examples': 0.4,
      'contradicts': 1.2,
      'builds-on': 1
    };
    
    const totalComplexity = edges.reduce((sum, edge) => {
      return sum + (typeWeights[edge.type] || 0.5);
    }, 0);
    
    return Math.min(totalComplexity / edges.length, 2) / 2; // Normalize to 0-1
  }

  private calculateHierarchyDepth(nodes: EducationalNode[], edges: EducationalEdge[]): number {
    const hasIncomingEdge = new Set(edges.filter(e => e.type === 'prerequisite').map(e => e.to));
    const rootNodes = nodes.filter(n => !hasIncomingEdge.has(n.id));
    
    let maxDepth = 0;
    
    rootNodes.forEach(root => {
      const depth = this.getNodeDepth(root.id, edges, new Set());
      maxDepth = Math.max(maxDepth, depth);
    });
    
    return maxDepth;
  }

  private getNodeDepth(nodeId: string, edges: EducationalEdge[], visited: Set<string>): number {
    if (visited.has(nodeId)) return 0;
    visited.add(nodeId);
    
    const childEdges = edges.filter(e => e.from === nodeId && e.type === 'prerequisite');
    if (childEdges.length === 0) return 1;
    
    const childDepths = childEdges.map(edge => this.getNodeDepth(edge.to, edges, visited));
    return 1 + Math.max(...childDepths);
  }

  private calculateCrossConnections(edges: EducationalEdge[]): number {
    const nonHierarchicalEdges = edges.filter(e => e.type !== 'prerequisite' && e.type !== 'builds-on');
    return nonHierarchicalEdges.length;
  }

  private assessCognitiveLoad(density: number, complexity: number, depth: number): number {
    // Based on cognitive load theory and educational psychology research
    const intrinsicLoad = density * 0.4;
    const extrinsicLoad = complexity * 0.3;
    const germaneLoad = Math.min(depth / 7, 1) * 0.3; // Miller's 7±2 rule
    
    return Math.min(intrinsicLoad + extrinsicLoad + germaneLoad, 1);
  }

  private calculateLearningEfficiency(density: number, complexity: number, cognitiveLoad: number): number {
    // Optimal learning occurs at moderate cognitive load
    const optimalLoad = 0.6;
    const loadEfficiency = 1 - Math.abs(cognitiveLoad - optimalLoad);
    
    // Balance between information density and comprehensibility
    const informationBalance = density * (1 - complexity);
    
    return (loadEfficiency * 0.6 + informationBalance * 0.4);
  }

  private generateNodeStyles(nodes: EducationalNode[], theme: string): any {
    const baseStyles = {
      jung: {
        conscious: { color: '#FFD700', shape: 'circle', size: 40 },
        'personal-unconscious': { color: '#FF6B6B', shape: 'hexagon', size: 35 },
        'collective-unconscious': { color: '#4ECDC4', shape: 'diamond', size: 45 }
      },
      educational: {
        remember: { color: '#E3F2FD', shape: 'rectangle', size: 30 },
        understand: { color: '#BBDEFB', shape: 'rectangle', size: 35 },
        apply: { color: '#90CAF9', shape: 'ellipse', size: 40 },
        analyze: { color: '#64B5F6', shape: 'hexagon', size: 45 },
        evaluate: { color: '#42A5F5', shape: 'diamond', size: 50 },
        create: { color: '#2196F3', shape: 'star', size: 55 }
      }
    };

    const styles: any = {};
    nodes.forEach(node => {
      if (theme === 'jung' && node.jungianContext?.psycheLevel) {
        styles[node.id] = baseStyles.jung[node.jungianContext.psycheLevel];
      } else {
        styles[node.id] = baseStyles.educational[node.cognitiveLevel];
      }
    });

    return styles;
  }

  private generateEdgeStyles(edges: EducationalEdge[], theme: string): any {
    const baseStyles = {
      prerequisite: { color: '#2196F3', width: 3, style: 'solid' as const },
      supports: { color: '#4CAF50', width: 2, style: 'dashed' as const },
      relates: { color: '#FF9800', width: 1, style: 'dotted' as const },
      examples: { color: '#9C27B0', width: 1, style: 'dashed' as const },
      contradicts: { color: '#F44336', width: 2, style: 'solid' as const },
      'builds-on': { color: '#00BCD4', width: 2, style: 'solid' as const }
    };

    const styles: any = {};
    edges.forEach(edge => {
      styles[edge.id] = baseStyles[edge.type] || baseStyles.relates;
    });

    return styles;
  }

  private determineOptimalLayout(mindMap: EducationalMindMap): 'hierarchical' | 'radial' | 'force-directed' | 'circular' {
    const nodeCount = mindMap.nodes.length;
    const edgeCount = mindMap.edges.length;
    const hierarchicalEdges = mindMap.edges.filter(e => e.type === 'prerequisite' || e.type === 'builds-on').length;
    
    // If mostly hierarchical relationships, use hierarchical layout
    if (hierarchicalEdges / edgeCount > 0.7) return 'hierarchical';
    
    // For small maps, radial works well
    if (nodeCount <= 10) return 'radial';
    
    // For dense networks, force-directed
    if (edgeCount / nodeCount > 1.5) return 'force-directed';
    
    // Default to hierarchical for educational content
    return 'hierarchical';
  }

  private calculateOptimalLearningPath(
    nodes: EducationalNode[],
    edges: EducationalEdge[],
    startId: string,
    endId: string
  ): string[] {
    // Dijkstra's algorithm with educational weighting
    const distances: { [key: string]: number } = {};
    const previous: { [key: string]: string | undefined } = {};
    const unvisited = new Set(nodes.map(n => n.id));
    
    // Initialize distances
    nodes.forEach(node => {
      distances[node.id] = node.id === startId ? 0 : Infinity;
    });
    
    while (unvisited.size > 0) {
      // Find unvisited node with minimum distance
      const current = Array.from(unvisited)
        .reduce((min, nodeId) => distances[nodeId] < distances[min] ? nodeId : min);
      
      if (current === endId) break;
      
      unvisited.delete(current);
      
      // Check neighbors
      const outgoingEdges = edges.filter(e => e.from === current);
      outgoingEdges.forEach(edge => {
        if (unvisited.has(edge.to)) {
          // Calculate weight based on educational factors
          const targetNode = nodes.find(n => n.id === edge.to)!;
          const edgeWeight = this.calculateEducationalWeight(edge, targetNode);
          const newDistance = distances[current] + edgeWeight;
          
          if (newDistance < distances[edge.to]) {
            distances[edge.to] = newDistance;
            previous[edge.to] = current;
          }
        }
      });
    }
    
    // Reconstruct path
    const path: string[] = [];
    let currentNode = endId;
    
    while (currentNode !== undefined) {
      path.unshift(currentNode);
      currentNode = previous[currentNode]!;
    }
    
    return path;
  }

  private calculateEducationalWeight(edge: EducationalEdge, targetNode: EducationalNode): number {
    let weight = 1;
    
    // Prerequisite edges have lower weight (preferred path)
    if (edge.type === 'prerequisite') weight *= 0.5;
    if (edge.type === 'builds-on') weight *= 0.7;
    
    // Stronger connections have lower weight
    if (edge.strength === 'strong') weight *= 0.7;
    if (edge.strength === 'weak') weight *= 1.3;
    
    // Difficulty gradient affects weight
    weight *= (1 + targetNode.difficulty);
    
    return weight;
  }

  private getDefaultDifficulty(level: string): number {
    switch (level) {
      case 'beginner': return 0.3;
      case 'intermediate': return 0.6;
      case 'advanced': return 0.9;
      default: return 0.5;
    }
  }
}