import { ILLMProvider, LLMGenerationOptions } from '../types';

export interface MindMapNode {
  id: string;
  label: string;
  type: 'root' | 'concept' | 'subconcept';
  x?: number;
  y?: number;
  level?: number;
  children?: string[];
  importance?: number;
  category?: string;
}

export interface MindMapEdge {
  id: string;
  from: string;
  to: string;
  type: 'hierarchy' | 'association' | 'relates' | 'contains';
  strength?: 'weak' | 'medium' | 'strong';
  label?: string;
}

export interface MindMap {
  id: string;
  title: string;
  nodes: MindMapNode[];
  edges: MindMapEdge[];
  levels?: number;
  totalNodes?: number;
}

export interface HierarchicalMindMap extends Omit<MindMap, 'levels'> {
  levels: any[];
}

export interface ProgressiveMindMap {
  title: string;
  stages: {
    stage: number;
    title: string;
    concepts: string[];
    connections: any[];
  }[];
  totalNodes: number;
}

export interface MindMapComplexity {
  nodeCount: number;
  edgeCount: number;
  depth: number;
  branchingFactor: number;
  complexity: 'low' | 'medium' | 'high';
}

export class MindMapGenerator {
  constructor(private provider: ILLMProvider) {}

  async generateMindMap(
    topic: string,
    concepts: string[],
    learningObjective: string,
    difficulty: 'beginner' | 'intermediate' | 'advanced',
    language: string = 'en'
  ): Promise<MindMap> {
    this.validateInputs(topic, concepts, learningObjective);

    const prompt = this.buildMindMapPrompt(topic, concepts, learningObjective, difficulty, language);
    const schema = this.getMindMapSchema();

    try {
      const result = await this.provider.generateStructuredOutput(prompt, schema, { temperature: 0.6 });
      return this.processMindMapResult(result);
    } catch (error) {
      throw new Error('Failed to generate mind map: ' + (error as Error).message);
    }
  }

  async generateConceptMap(content: string, topic: string): Promise<MindMap> {
    const prompt = this.buildConceptMapPrompt(content, topic);
    const schema = this.getConceptMapSchema();

    try {
      const result = await this.provider.generateStructuredOutput(prompt, schema, { temperature: 0.5 });
      return this.processConceptMapResult(result, topic);
    } catch (error) {
      throw new Error('Failed to generate concept map: ' + (error as Error).message);
    }
  }

  async generateHierarchicalMap(
    topic: string,
    concepts: string[],
    maxDepth: number
  ): Promise<HierarchicalMindMap> {
    if (maxDepth < 1 || maxDepth > 10) {
      throw new Error('Depth must be between 1 and 10');
    }

    const prompt = this.buildHierarchicalPrompt(topic, concepts, maxDepth);
    const schema = this.getHierarchicalSchema();

    try {
      const result = await this.provider.generateStructuredOutput(prompt, schema, { temperature: 0.4 });
      return this.processHierarchicalResult(result);
    } catch (error) {
      throw new Error('Failed to generate hierarchical mind map: ' + (error as Error).message);
    }
  }

  async generateProgressiveMindMap(
    topic: string,
    concepts: string[],
    objectives: string[],
    stages: number
  ): Promise<ProgressiveMindMap> {
    if (stages < 1 || stages > 10) {
      throw new Error('Number of stages must be between 1 and 10');
    }

    const prompt = this.buildProgressivePrompt(topic, concepts, objectives, stages);
    const schema = this.getProgressiveSchema();

    try {
      const result = await this.provider.generateStructuredOutput(prompt, schema, { temperature: 0.5 });
      return this.processProgressiveResult(result);
    } catch (error) {
      throw new Error('Failed to generate progressive mind map: ' + (error as Error).message);
    }
  }

  async optimizeLayout(mindMap: MindMap): Promise<MindMap> {
    // Simple layout optimization - in a real implementation,
    // this would use graph layout algorithms
    const optimizedNodes = mindMap.nodes.map((node, index) => ({
      ...node,
      x: node.x ?? index * 100,
      y: node.y ?? Math.floor(index / 5) * 100
    }));

    return {
      ...mindMap,
      nodes: optimizedNodes
    };
  }

  async analyzeComplexity(mindMap: MindMap): Promise<MindMapComplexity> {
    const nodeCount = mindMap.nodes.length;
    const edgeCount = mindMap.edges.length;
    
    // Calculate depth
    const rootNodes = mindMap.nodes.filter(n => n.type === 'root');
    const depth = this.calculateDepth(mindMap.nodes, mindMap.edges, rootNodes[0]?.id || '');
    
    // Calculate branching factor
    const branchingFactor = nodeCount > 1 ? edgeCount / (nodeCount - 1) : 0;
    
    // Determine complexity
    let complexity: 'low' | 'medium' | 'high';
    if (nodeCount <= 10 && depth <= 3) {
      complexity = 'low';
    } else if (nodeCount <= 30 && depth <= 5) {
      complexity = 'medium';
    } else {
      complexity = 'high';
    }

    return {
      nodeCount,
      edgeCount,
      depth,
      branchingFactor,
      complexity
    };
  }

  private validateInputs(topic: string, concepts: string[], learningObjective: string): void {
    if (!topic.trim()) {
      throw new Error('Topic cannot be empty');
    }
    if (concepts.length === 0) {
      throw new Error('At least one concept is required');
    }
    if (!learningObjective.trim()) {
      throw new Error('Learning objective cannot be empty');
    }
  }

  private buildMindMapPrompt(
    topic: string,
    concepts: string[],
    objective: string,
    difficulty: string,
    language: string
  ): string {
    const isPortuguese = language.startsWith('pt');
    
    if (isPortuguese) {
      return `Gere um mapa mental abrangente sobre "${topic}" com os seguintes conceitos: ${concepts.join(', ')}.
      
      Objetivo de aprendizado: ${objective}
      Nível de dificuldade: ${difficulty}
      
      O mapa deve incluir:
      - Um conceito raiz central
      - Conceitos relacionados organizados hierarquicamente
      - Conexões que mostram relacionamentos
      - Importância relativa de cada conceito
      
      Limite a 30 conceitos para manter a clareza.`;
    }

    return `Generate a comprehensive mind map about "${topic}" with the following concepts: ${concepts.join(', ')}.
    
    Learning objective: ${objective}
    Difficulty level: ${difficulty}
    
    The mind map should include:
    - A central root concept
    - Related concepts organized hierarchically
    - Connections showing relationships
    - Relative importance of each concept
    
    Limit to 30 concepts to maintain clarity.`;
  }

  private buildConceptMapPrompt(content: string, topic: string): string {
    return `Extract key concepts from the following content and create a concept map for "${topic}":
    
    Content: ${content.substring(0, 2000)}...
    
    Identify the most important concepts and their relationships. Focus on:
    - Core terms and ideas
    - Relationships between concepts
    - Importance levels (0-1 scale)
    - Conceptual categories
    
    Limit to 20 most relevant concepts.`;
  }

  private buildHierarchicalPrompt(topic: string, concepts: string[], maxDepth: number): string {
    return `Create a hierarchical mind map for "${topic}" with concepts: ${concepts.join(', ')}.
    
    Structure requirements:
    - Maximum depth: ${maxDepth} levels
    - Start with the main topic as root (level 0)
    - Organize concepts into clear hierarchical levels
    - Each concept should have clear parent-child relationships
    
    Return the structure organized by levels.`;
  }

  private buildProgressivePrompt(
    topic: string,
    concepts: string[],
    objectives: string[],
    stages: number
  ): string {
    return `Create a progressive learning mind map for "${topic}" with ${stages} stages.
    
    Concepts to include: ${concepts.join(', ')}
    Learning objectives: ${objectives.join(', ')}
    
    Each stage should:
    - Build upon previous stages
    - Introduce 2-6 new concepts
    - Show connections to earlier concepts
    - Progress from basic to advanced understanding`;
  }

  private getMindMapSchema() {
    return {
      type: 'object',
      properties: {
        title: { type: 'string' },
        rootConcept: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            label: { type: 'string' },
            description: { type: 'string' },
            importance: { type: 'string' }
          },
          required: ['id', 'label', 'description', 'importance']
        },
        concepts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              label: { type: 'string' },
              description: { type: 'string' },
              parentId: { type: 'string' },
              importance: { type: 'string' },
              relationships: { type: 'array', items: { type: 'string' } }
            },
            required: ['id', 'label', 'parentId']
          }
        },
        connections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              from: { type: 'string' },
              to: { type: 'string' },
              type: { type: 'string' },
              strength: { type: 'string' }
            },
            required: ['from', 'to', 'type']
          }
        }
      },
      required: ['title', 'rootConcept', 'concepts', 'connections']
    };
  }

  private getConceptMapSchema() {
    return {
      type: 'object',
      properties: {
        title: { type: 'string' },
        extractedConcepts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              term: { type: 'string' },
              importance: { type: 'number' },
              category: { type: 'string' }
            },
            required: ['term', 'importance']
          }
        },
        relationships: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              from: { type: 'string' },
              to: { type: 'string' },
              type: { type: 'string' }
            },
            required: ['from', 'to', 'type']
          }
        }
      },
      required: ['title', 'extractedConcepts', 'relationships']
    };
  }

  private getHierarchicalSchema() {
    return {
      type: 'object',
      properties: {
        rootTopic: { type: 'string' },
        levels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              level: { type: 'number' },
              concepts: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    label: { type: 'string' },
                    children: { type: 'array', items: { type: 'string' } }
                  },
                  required: ['id', 'label', 'children']
                }
              }
            },
            required: ['level', 'concepts']
          }
        }
      },
      required: ['rootTopic', 'levels']
    };
  }

  private getProgressiveSchema() {
    return {
      type: 'object',
      properties: {
        stages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stage: { type: 'number' },
              title: { type: 'string' },
              concepts: { type: 'array', items: { type: 'string' } },
              connections: { type: 'array' }
            },
            required: ['stage', 'title', 'concepts', 'connections']
          }
        }
      },
      required: ['stages']
    };
  }

  private processMindMapResult(result: any): MindMap {
    if (!result || !result.title || !result.rootConcept || !result.concepts) {
      throw new Error('Invalid mind map structure');
    }

    const nodes: MindMapNode[] = [
      {
        id: result.rootConcept.id,
        label: result.rootConcept.label,
        type: 'root',
        x: 0,
        y: 0,
        level: 0
      }
    ];

    // Add concept nodes (limit to reasonable number)
    const limitedConcepts = result.concepts.slice(0, 50);
    limitedConcepts.forEach((concept: any, index: number) => {
      nodes.push({
        id: concept.id,
        label: concept.label,
        type: 'concept',
        level: 1,
        importance: this.parseImportance(concept.importance)
      });
    });

    // Create edges
    const edges: MindMapEdge[] = [];
    result.connections.forEach((connection: any, index: number) => {
      edges.push({
        id: `edge-${index}`,
        from: connection.from,
        to: connection.to,
        type: connection.type || 'hierarchy',
        strength: connection.strength || 'medium'
      });
    });

    return {
      id: `mindmap-${Date.now()}`,
      title: result.title,
      nodes,
      edges
    };
  }

  private processConceptMapResult(result: any, topic: string): MindMap {
    const nodes: MindMapNode[] = [];
    const edges: MindMapEdge[] = [];

    // Limit concepts to reasonable number
    const limitedConcepts = result.extractedConcepts?.slice(0, 30) || [];
    
    limitedConcepts.forEach((concept: any, index: number) => {
      nodes.push({
        id: concept.term.replace(/\s+/g, '_').toLowerCase(),
        label: concept.term,
        type: index === 0 ? 'root' : 'concept',
        importance: concept.importance,
        category: concept.category
      });
    });

    result.relationships?.forEach((rel: any, index: number) => {
      edges.push({
        id: `concept-edge-${index}`,
        from: rel.from.replace(/\s+/g, '_').toLowerCase(),
        to: rel.to.replace(/\s+/g, '_').toLowerCase(),
        type: rel.type || 'relates'
      });
    });

    return {
      id: `concept-map-${Date.now()}`,
      title: result.title || `Concept Map: ${topic}`,
      nodes,
      edges
    };
  }

  private processHierarchicalResult(result: any): HierarchicalMindMap {
    const nodes: MindMapNode[] = [];
    const edges: MindMapEdge[] = [];
    let nodeCount = 0;

    result.levels.forEach((level: any) => {
      level.concepts.forEach((concept: any) => {
        nodes.push({
          id: concept.id,
          label: concept.label,
          type: level.level === 0 ? 'root' : 'concept',
          level: level.level,
          children: concept.children
        });
        nodeCount++;

        // Create edges to children
        concept.children.forEach((childId: string) => {
          edges.push({
            id: `hier-edge-${edges.length}`,
            from: concept.id,
            to: childId,
            type: 'hierarchy'
          });
        });
      });
    });

    return {
      id: `hierarchical-${Date.now()}`,
      title: result.rootTopic,
      nodes,
      edges,
      levels: result.levels
    };
  }

  private processProgressiveResult(result: any): ProgressiveMindMap {
    let totalNodes = 0;
    result.stages.forEach((stage: any) => {
      totalNodes += stage.concepts.length;
    });

    return {
      title: result.title || 'Progressive Learning Map',
      stages: result.stages,
      totalNodes
    };
  }

  private parseImportance(importance: any): number {
    if (typeof importance === 'number') return importance;
    if (importance === 'high') return 0.8;
    if (importance === 'medium') return 0.6;
    if (importance === 'low') return 0.4;
    return 0.5;
  }

  private calculateDepth(nodes: MindMapNode[], edges: MindMapEdge[], rootId: string): number {
    if (!rootId || nodes.length === 0) return 0;

    const visited = new Set<string>();
    const queue: { id: string; depth: number }[] = [{ id: rootId, depth: 0 }];
    let maxDepth = 0;

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      
      if (visited.has(id)) continue;
      visited.add(id);
      maxDepth = Math.max(maxDepth, depth);

      // Find children
      const childEdges = edges.filter(e => e.from === id);
      childEdges.forEach(edge => {
        if (!visited.has(edge.to)) {
          queue.push({ id: edge.to, depth: depth + 1 });
        }
      });
    }

    return maxDepth;
  }
}