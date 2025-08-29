import { ILLMProvider } from '../llm/types';

// Mind Map Types
export interface MindMapNode {
  id: string;
  label: string;
  level: number;
  parentId?: string;
  children: MindMapNode[];
  x?: number;
  y?: number;
  color?: string;
  size?: number;
  type?: 'concept' | 'detail' | 'example' | 'connection';
  metadata?: {
    description?: string;
    keywords?: string[];
    connections?: string[];
    importance?: number;
  };
}

export interface MindMapLayout {
  nodes: MindMapNode[];
  connections: MindMapConnection[];
  bounds: {
    width: number;
    height: number;
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
  layoutType: 'radial' | 'hierarchical' | 'force-directed' | 'circular';
}

export interface MindMapConnection {
  id: string;
  sourceId: string;
  targetId: string;
  type?: 'hierarchy' | 'association' | 'dependency' | 'similarity';
  strength?: number;
  label?: string;
}

export interface MindMapGenerationOptions {
  topic: string;
  complexity?: 'simple' | 'moderate' | 'complex' | 'comprehensive';
  maxDepth?: number;
  maxNodesPerLevel?: number;
  focusAreas?: string[];
  layoutType?: 'radial' | 'hierarchical' | 'force-directed' | 'circular';
  includeExamples?: boolean;
  includeCrossConnections?: boolean;
  language?: string;
  targetAudience?: 'beginner' | 'intermediate' | 'advanced';
  visualStyle?: {
    colorScheme?: string[];
    nodeSize?: 'small' | 'medium' | 'large';
    connectionStyle?: 'straight' | 'curved' | 'organic';
  };
}

export interface LLMGeneratedContent {
  structure: {
    centralConcept: string;
    mainBranches: {
      id: string;
      title: string;
      concepts: string[];
      examples?: string[];
      connections?: string[];
    }[];
    crossConnections?: {
      from: string;
      to: string;
      relationship: string;
    }[];
  };
  metadata: {
    complexity: string;
    estimatedNodes: number;
    suggestedLayout: string;
    keyInsights: string[];
  };
}

/**
 * LLM-powered mind map generator for Jungian psychology concepts
 * Generates structured mind maps with intelligent layout and semantic connections
 */
export class LLMMindMapGenerator {
  constructor(private provider: ILLMProvider) {}

  /**
   * Generate a complete mind map from a topic
   */
  async generateMindMap(
    topicOrOptions: string | MindMapGenerationOptions
  ): Promise<MindMapLayout> {
    let options: MindMapGenerationOptions;
    
    if (typeof topicOrOptions === 'string') {
      options = {
        topic: topicOrOptions,
        complexity: 'moderate',
        maxDepth: 3,
        maxNodesPerLevel: 6,
        layoutType: 'radial',
        includeExamples: true,
        includeCrossConnections: true,
        language: 'pt-BR',
        targetAudience: 'intermediate'
      };
    } else {
      options = {
        complexity: 'moderate',
        maxDepth: 3,
        maxNodesPerLevel: 6,
        layoutType: 'radial',
        includeExamples: true,
        includeCrossConnections: true,
        language: 'pt-BR',
        targetAudience: 'intermediate',
        ...topicOrOptions
      };
    }

    // Step 1: Generate structured content from LLM
    const generatedContent = await this.generateStructuredContent(options);
    
    // Step 2: Parse and validate the generated content
    const parsedContent = await this.parseGeneratedContent(generatedContent);
    
    // Step 3: Create node structure
    const nodes = this.createNodeStructure(parsedContent, options);
    
    // Step 4: Generate connections
    const connections = this.generateConnections(nodes, parsedContent, options);
    
    // Step 5: Apply layout algorithm
    const layoutNodes = await this.applyLayout(nodes, connections, options.layoutType || 'radial');
    
    // Step 6: Validate the final structure
    const layout = this.validateMindMapStructure({
      nodes: layoutNodes,
      connections,
      bounds: this.calculateBounds(layoutNodes),
      layoutType: options.layoutType || 'radial'
    });
    
    return layout;
  }

  /**
   * Parse and structure LLM-generated content
   */
  async parseGeneratedContent(content: string | LLMGeneratedContent): Promise<LLMGeneratedContent> {
    if (typeof content === 'object') {
      return content;
    }
    
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(content);
      if (this.isValidGeneratedContent(parsed)) {
        return parsed;
      }
    } catch (error) {
      // If JSON parsing fails, use LLM to structure the content
    }
    
    // Use LLM to convert unstructured content to structured format
    const structuredContent = await this.convertToStructuredContent(content);
    return structuredContent;
  }

  /**
   * Validate mind map structure and fix common issues
   */
  validateMindMapStructure(layout: MindMapLayout): MindMapLayout {
    const validatedLayout = { ...layout };
    
    // Ensure all nodes have valid IDs and positions
    validatedLayout.nodes = layout.nodes.map((node, index) => ({
      ...node,
      id: node.id || `node-${index}`,
      x: typeof node.x === 'number' ? node.x : 0,
      y: typeof node.y === 'number' ? node.y : 0,
      level: typeof node.level === 'number' ? node.level : 0
    }));
    
    // Validate connections reference existing nodes
    const nodeIds = new Set(validatedLayout.nodes.map(n => n.id));
    validatedLayout.connections = layout.connections.filter(conn => 
      nodeIds.has(conn.sourceId) && nodeIds.has(conn.targetId)
    );
    
    // Ensure bounds are calculated correctly
    validatedLayout.bounds = this.calculateBounds(validatedLayout.nodes);
    
    // Validate node hierarchy
    this.validateNodeHierarchy(validatedLayout.nodes);
    
    return validatedLayout;
  }

  /**
   * Generate structured content using LLM
   */
  private async generateStructuredContent(options: MindMapGenerationOptions): Promise<LLMGeneratedContent> {
    const complexityConfig = this.getComplexityConfiguration(options.complexity || 'moderate');
    
    const prompt = this.buildGenerationPrompt(options, complexityConfig);
    
    const schema = {
      type: 'object',
      properties: {
        structure: {
          type: 'object',
          properties: {
            centralConcept: { type: 'string' },
            mainBranches: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  title: { type: 'string' },
                  concepts: {
                    type: 'array',
                    items: { type: 'string' }
                  },
                  examples: {
                    type: 'array',
                    items: { type: 'string' }
                  },
                  connections: {
                    type: 'array',
                    items: { type: 'string' }
                  }
                },
                required: ['id', 'title', 'concepts']
              }
            },
            crossConnections: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  from: { type: 'string' },
                  to: { type: 'string' },
                  relationship: { type: 'string' }
                },
                required: ['from', 'to', 'relationship']
              }
            }
          },
          required: ['centralConcept', 'mainBranches']
        },
        metadata: {
          type: 'object',
          properties: {
            complexity: { type: 'string' },
            estimatedNodes: { type: 'number' },
            suggestedLayout: { type: 'string' },
            keyInsights: {
              type: 'array',
              items: { type: 'string' }
            }
          },
          required: ['complexity', 'estimatedNodes', 'suggestedLayout', 'keyInsights']
        }
      },
      required: ['structure', 'metadata']
    };

    try {
      const response = await this.provider.generateStructuredOutput<LLMGeneratedContent>(
        prompt,
        schema,
        {
          temperature: 0.7,
          maxTokens: 2000
        }
      );
      
      return response;
    } catch (error) {
      throw new Error(`Failed to generate mind map content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build LLM generation prompt based on options
   */
  private buildGenerationPrompt(options: MindMapGenerationOptions, complexityConfig: any): string {
    const language = options.language || 'pt-BR';
    const isPortuguese = language === 'pt-BR';
    
    const basePrompt = isPortuguese ? `
Crie uma estrutura de mapa mental detalhada para o tópico de psicologia junguiana: "${options.topic}"

Configurações:
- Complexidade: ${options.complexity} (${complexityConfig.description})
- Profundidade máxima: ${options.maxDepth} níveis
- Público-alvo: ${this.translateAudience(options.targetAudience || 'intermediate', true)}
- Incluir exemplos: ${options.includeExamples ? 'Sim' : 'Não'}
- Incluir conexões cruzadas: ${options.includeCrossConnections ? 'Sim' : 'Não'}

Áreas de foco específicas:
${options.focusAreas?.map(area => `- ${area}`).join('\n') || '- Conceitos fundamentais'}

IMPORTANTE: Responda com uma estrutura JSON válida contendo:
1. structure.centralConcept: O conceito central do mapa mental
2. structure.mainBranches: Array de ramos principais (${complexityConfig.branches} ramos)
3. structure.crossConnections: Conexões entre diferentes ramos (se solicitado)
4. metadata: Informações sobre complexidade, número estimado de nós, layout sugerido e insights-chave

Cada ramo principal deve ter:
- id: Identificador único
- title: Título descritivo
- concepts: Array de conceitos relacionados (${complexityConfig.conceptsPerBranch} por ramo)
- examples: Exemplos práticos (se solicitado)
- connections: IDs de outros ramos com conexões conceituais

Garanta que todo o conteúdo seja em português brasileiro e focado na psicologia junguiana.` : `
Create a detailed mind map structure for the Jungian psychology topic: "${options.topic}"

Settings:
- Complexity: ${options.complexity} (${complexityConfig.description})
- Maximum depth: ${options.maxDepth} levels
- Target audience: ${this.translateAudience(options.targetAudience || 'intermediate', false)}
- Include examples: ${options.includeExamples ? 'Yes' : 'No'}
- Include cross connections: ${options.includeCrossConnections ? 'Yes' : 'No'}

Specific focus areas:
${options.focusAreas?.map(area => `- ${area}`).join('\n') || '- Fundamental concepts'}

IMPORTANT: Respond with a valid JSON structure containing:
1. structure.centralConcept: The central concept of the mind map
2. structure.mainBranches: Array of main branches (${complexityConfig.branches} branches)
3. structure.crossConnections: Connections between different branches (if requested)
4. metadata: Information about complexity, estimated nodes, suggested layout and key insights

Each main branch should have:
- id: Unique identifier
- title: Descriptive title
- concepts: Array of related concepts (${complexityConfig.conceptsPerBranch} per branch)
- examples: Practical examples (if requested)
- connections: IDs of other branches with conceptual connections

Ensure all content is focused on Jungian psychology.`;

    return basePrompt;
  }

  /**
   * Get complexity configuration
   */
  private getComplexityConfiguration(complexity: string) {
    const configs = {
      simple: {
        description: 'Estrutura básica com conceitos principais',
        branches: '3-4',
        conceptsPerBranch: '2-3',
        maxNodes: 15
      },
      moderate: {
        description: 'Estrutura equilibrada com boa profundidade',
        branches: '4-6',
        conceptsPerBranch: '3-5',
        maxNodes: 30
      },
      complex: {
        description: 'Estrutura rica com múltiplas conexões',
        branches: '6-8',
        conceptsPerBranch: '4-6',
        maxNodes: 50
      },
      comprehensive: {
        description: 'Estrutura completa e detalhada',
        branches: '8-10',
        conceptsPerBranch: '5-8',
        maxNodes: 80
      }
    };
    
    return configs[complexity as keyof typeof configs] || configs.moderate;
  }

  /**
   * Translate audience level
   */
  private translateAudience(audience: string, isPortuguese: boolean): string {
    const translations = {
      beginner: isPortuguese ? 'iniciante' : 'beginner',
      intermediate: isPortuguese ? 'intermediário' : 'intermediate',
      advanced: isPortuguese ? 'avançado' : 'advanced'
    };
    
    return translations[audience as keyof typeof translations] || translations.intermediate;
  }

  /**
   * Convert unstructured content to structured format
   */
  private async convertToStructuredContent(content: string): Promise<LLMGeneratedContent> {
    const prompt = `
Convert the following unstructured mind map content into a valid JSON structure:

${content}

Return a JSON object with the following structure:
{
  "structure": {
    "centralConcept": "main topic",
    "mainBranches": [
      {
        "id": "branch-1",
        "title": "Branch Title",
        "concepts": ["concept1", "concept2"],
        "examples": ["example1"],
        "connections": ["branch-2"]
      }
    ],
    "crossConnections": [
      {
        "from": "branch-1",
        "to": "branch-2", 
        "relationship": "relationship description"
      }
    ]
  },
  "metadata": {
    "complexity": "moderate",
    "estimatedNodes": 25,
    "suggestedLayout": "radial",
    "keyInsights": ["insight1", "insight2"]
  }
}`;

    try {
      const response = await this.provider.generateCompletion(prompt, {
        temperature: 0.3,
        maxTokens: 1500
      });
      
      return JSON.parse(response.content);
    } catch (error) {
      throw new Error(`Failed to convert content to structured format: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if content is valid generated content
   */
  private isValidGeneratedContent(content: any): content is LLMGeneratedContent {
    return (
      content !== null &&
      content !== undefined &&
      typeof content === 'object' &&
      content.structure &&
      content.structure.centralConcept &&
      Array.isArray(content.structure.mainBranches) &&
      content.metadata &&
      typeof content.metadata.estimatedNodes === 'number'
    );
  }

  /**
   * Create node structure from parsed content
   */
  private createNodeStructure(content: LLMGeneratedContent, options: MindMapGenerationOptions): MindMapNode[] {
    const nodes: MindMapNode[] = [];
    
    // Create central node
    const centralNode: MindMapNode = {
      id: 'central',
      label: content.structure.centralConcept,
      level: 0,
      children: [],
      type: 'concept',
      color: '#FF6B6B',
      size: 40,
      metadata: {
        importance: 1,
        keywords: [content.structure.centralConcept],
        description: `Central concept: ${content.structure.centralConcept}`
      }
    };
    nodes.push(centralNode);

    // Create main branch nodes
    content.structure.mainBranches.forEach((branch, branchIndex) => {
      const branchNode: MindMapNode = {
        id: branch.id,
        label: branch.title,
        level: 1,
        parentId: 'central',
        children: [],
        type: 'concept',
        color: this.getBranchColor(branchIndex),
        size: 30,
        metadata: {
          importance: 0.8,
          keywords: [branch.title, ...branch.concepts.slice(0, 3)],
          description: `Main branch: ${branch.title}`
        }
      };
      nodes.push(branchNode);
      centralNode.children.push(branchNode);

      // Create concept nodes for each branch
      branch.concepts.forEach((concept, conceptIndex) => {
        const conceptNode: MindMapNode = {
          id: `${branch.id}-concept-${conceptIndex}`,
          label: concept,
          level: 2,
          parentId: branch.id,
          children: [],
          type: 'detail',
          color: this.lightenColor(this.getBranchColor(branchIndex), 0.3),
          size: 20,
          metadata: {
            importance: 0.6,
            keywords: [concept],
            description: `Concept under ${branch.title}`
          }
        };
        nodes.push(conceptNode);
        branchNode.children.push(conceptNode);
      });

      // Create example nodes if requested
      if (options.includeExamples && branch.examples) {
        branch.examples.forEach((example, exampleIndex) => {
          const exampleNode: MindMapNode = {
            id: `${branch.id}-example-${exampleIndex}`,
            label: example,
            level: 3,
            parentId: branch.id,
            children: [],
            type: 'example',
            color: this.lightenColor(this.getBranchColor(branchIndex), 0.5),
            size: 15,
            metadata: {
              importance: 0.4,
              keywords: [example],
              description: `Example for ${branch.title}`
            }
          };
          nodes.push(exampleNode);
          branchNode.children.push(exampleNode);
        });
      }
    });

    return nodes;
  }

  /**
   * Generate connections between nodes
   */
  private generateConnections(
    nodes: MindMapNode[], 
    content: LLMGeneratedContent, 
    options: MindMapGenerationOptions
  ): MindMapConnection[] {
    const connections: MindMapConnection[] = [];
    
    // Create hierarchical connections (parent-child)
    nodes.forEach(node => {
      if (node.parentId) {
        connections.push({
          id: `${node.parentId}-${node.id}`,
          sourceId: node.parentId,
          targetId: node.id,
          type: 'hierarchy',
          strength: 1.0
        });
      }
    });

    // Create cross connections if requested
    if (options.includeCrossConnections && content.structure.crossConnections) {
      content.structure.crossConnections.forEach((crossConn, index) => {
        // Find nodes that match the connection
        const sourceNode = nodes.find(n => n.id === crossConn.from || n.label.toLowerCase().includes(crossConn.from.toLowerCase()));
        const targetNode = nodes.find(n => n.id === crossConn.to || n.label.toLowerCase().includes(crossConn.to.toLowerCase()));
        
        if (sourceNode && targetNode) {
          connections.push({
            id: `cross-${index}`,
            sourceId: sourceNode.id,
            targetId: targetNode.id,
            type: 'association',
            strength: 0.7,
            label: crossConn.relationship
          });
        }
      });
    }

    return connections;
  }

  /**
   * Apply layout algorithm to position nodes
   */
  private async applyLayout(
    nodes: MindMapNode[], 
    connections: MindMapConnection[], 
    layoutType: string
  ): Promise<MindMapNode[]> {
    switch (layoutType) {
      case 'radial':
        return this.applyRadialLayout(nodes, connections);
      case 'hierarchical':
        return this.applyHierarchicalLayout(nodes);
      case 'force-directed':
        return this.applyForceDirectedLayout(nodes, connections);
      case 'circular':
        return this.applyCircularLayout(nodes);
      default:
        return this.applyRadialLayout(nodes, connections);
    }
  }

  /**
   * Apply radial layout
   */
  private applyRadialLayout(nodes: MindMapNode[], connections: MindMapConnection[]): MindMapNode[] {
    const positionedNodes = nodes.map(node => ({ ...node }));
    const centerX = 400;
    const centerY = 300;
    
    // Position central node
    const centralNode = positionedNodes.find(n => n.level === 0);
    if (centralNode) {
      centralNode.x = centerX;
      centralNode.y = centerY;
    }

    // Position level 1 nodes (main branches) in a circle
    const level1Nodes = positionedNodes.filter(n => n.level === 1);
    const radius1 = 200;
    
    level1Nodes.forEach((node, index) => {
      const angle = (2 * Math.PI * index) / level1Nodes.length;
      node.x = centerX + radius1 * Math.cos(angle);
      node.y = centerY + radius1 * Math.sin(angle);
    });

    // Position deeper level nodes
    level1Nodes.forEach((branchNode) => {
      const childNodes = positionedNodes.filter(n => n.parentId === branchNode.id);
      if (childNodes.length === 0) return;

      const branchAngle = Math.atan2(branchNode.y! - centerY, branchNode.x! - centerX);
      const radius2 = 120;
      
      childNodes.forEach((childNode, index) => {
        const offsetAngle = (index - (childNodes.length - 1) / 2) * (Math.PI / 6);
        const finalAngle = branchAngle + offsetAngle;
        
        childNode.x = branchNode.x! + radius2 * Math.cos(finalAngle);
        childNode.y = branchNode.y! + radius2 * Math.sin(finalAngle);
      });
    });

    return positionedNodes;
  }

  /**
   * Apply hierarchical layout
   */
  private applyHierarchicalLayout(nodes: MindMapNode[]): MindMapNode[] {
    const positionedNodes = nodes.map(node => ({ ...node }));
    const levelHeight = 150;
    const nodeSpacing = 120;
    
    // Group nodes by level
    const nodesByLevel = new Map<number, MindMapNode[]>();
    positionedNodes.forEach(node => {
      if (!nodesByLevel.has(node.level)) {
        nodesByLevel.set(node.level, []);
      }
      nodesByLevel.get(node.level)!.push(node);
    });

    // Position nodes level by level
    nodesByLevel.forEach((levelNodes, level) => {
      const totalWidth = (levelNodes.length - 1) * nodeSpacing;
      const startX = 400 - totalWidth / 2;
      
      levelNodes.forEach((node, index) => {
        node.x = startX + index * nodeSpacing;
        node.y = 100 + level * levelHeight;
      });
    });

    return positionedNodes;
  }

  /**
   * Apply force-directed layout (simplified version)
   */
  private applyForceDirectedLayout(nodes: MindMapNode[], connections: MindMapConnection[]): MindMapNode[] {
    const positionedNodes = nodes.map(node => ({
      ...node,
      x: node.x || Math.random() * 800,
      y: node.y || Math.random() * 600
    }));

    // Simple force-directed algorithm
    const iterations = 100;
    const repulsionStrength = 5000;
    const attractionStrength = 0.1;

    for (let i = 0; i < iterations; i++) {
      // Apply repulsion between all nodes
      for (let j = 0; j < positionedNodes.length; j++) {
        for (let k = j + 1; k < positionedNodes.length; k++) {
          const node1 = positionedNodes[j];
          const node2 = positionedNodes[k];
          
          const dx = node2.x! - node1.x!;
          const dy = node2.y! - node1.y!;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          
          const force = repulsionStrength / (distance * distance);
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;
          
          node1.x! -= fx;
          node1.y! -= fy;
          node2.x! += fx;
          node2.y! += fy;
        }
      }

      // Apply attraction along connections
      connections.forEach(conn => {
        const source = positionedNodes.find(n => n.id === conn.sourceId);
        const target = positionedNodes.find(n => n.id === conn.targetId);
        
        if (source && target) {
          const dx = target.x! - source.x!;
          const dy = target.y! - source.y!;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          
          const force = distance * attractionStrength * (conn.strength || 1);
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;
          
          source.x! += fx * 0.5;
          source.y! += fy * 0.5;
          target.x! -= fx * 0.5;
          target.y! -= fy * 0.5;
        }
      });
    }

    return positionedNodes;
  }

  /**
   * Apply circular layout
   */
  private applyCircularLayout(nodes: MindMapNode[]): MindMapNode[] {
    const positionedNodes = nodes.map(node => ({ ...node }));
    const centerX = 400;
    const centerY = 300;
    const radius = 250;
    
    // Position central node
    const centralNode = positionedNodes.find(n => n.level === 0);
    if (centralNode) {
      centralNode.x = centerX;
      centralNode.y = centerY;
    }

    // Position all other nodes in concentric circles
    const nonCentralNodes = positionedNodes.filter(n => n.level > 0);
    
    nonCentralNodes.forEach((node, index) => {
      const angle = (2 * Math.PI * index) / nonCentralNodes.length;
      const nodeRadius = radius * (1 + node.level * 0.3);
      
      node.x = centerX + nodeRadius * Math.cos(angle);
      node.y = centerY + nodeRadius * Math.sin(angle);
    });

    return positionedNodes;
  }

  /**
   * Calculate bounding box for nodes
   */
  private calculateBounds(nodes: MindMapNode[]) {
    const xCoords = nodes.map(n => n.x || 0);
    const yCoords = nodes.map(n => n.y || 0);
    
    const minX = Math.min(...xCoords) - 50;
    const maxX = Math.max(...xCoords) + 50;
    const minY = Math.min(...yCoords) - 50;
    const maxY = Math.max(...yCoords) + 50;
    
    return {
      minX,
      maxX,
      minY,
      maxY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  /**
   * Validate node hierarchy
   */
  private validateNodeHierarchy(nodes: MindMapNode[]): void {
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    
    nodes.forEach(node => {
      if (node.parentId) {
        const parent = nodeMap.get(node.parentId);
        if (!parent) {
          throw new Error(`Node ${node.id} references non-existent parent ${node.parentId}`);
        }
        if (parent.level >= node.level) {
          throw new Error(`Invalid hierarchy: parent ${node.parentId} level ${parent.level} >= child ${node.id} level ${node.level}`);
        }
      }
    });
  }

  /**
   * Get color for branch by index
   */
  private getBranchColor(index: number): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
      '#FECA57', '#FF9FF3', '#54A0FF', '#5F27CD',
      '#00D2D3', '#FF9F43', '#EA2027', '#006BA6'
    ];
    return colors[index % colors.length];
  }

  /**
   * Lighten color by factor
   */
  private lightenColor(color: string, factor: number): string {
    // Simple color lightening - in a real implementation you'd use a proper color library
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const newR = Math.min(255, Math.floor(r + (255 - r) * factor));
    const newG = Math.min(255, Math.floor(g + (255 - g) * factor));
    const newB = Math.min(255, Math.floor(b + (255 - b) * factor));
    
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }

  /**
   * Process nodes with additional intelligence
   */
  async processNodes(nodes: MindMapNode[], options?: {
    enhanceLabels?: boolean;
    detectClusters?: boolean;
    optimizePositions?: boolean;
  }): Promise<MindMapNode[]> {
    let processedNodes = [...nodes];
    
    if (options?.enhanceLabels) {
      processedNodes = await this.enhanceNodeLabels(processedNodes);
    }
    
    if (options?.detectClusters) {
      processedNodes = this.detectNodeClusters(processedNodes);
    }
    
    if (options?.optimizePositions) {
      processedNodes = this.optimizeNodePositions(processedNodes);
    }
    
    return processedNodes;
  }

  /**
   * Enhance node labels with better formatting
   */
  private async enhanceNodeLabels(nodes: MindMapNode[]): Promise<MindMapNode[]> {
    // In a real implementation, this could use LLM to improve labels
    return nodes.map(node => ({
      ...node,
      label: this.capitalizeFirstLetter(node.label.trim())
    }));
  }

  /**
   * Detect clusters in nodes
   */
  private detectNodeClusters(nodes: MindMapNode[]): MindMapNode[] {
    // Simple clustering based on node types and levels
    const clusters = new Map<string, MindMapNode[]>();
    
    nodes.forEach(node => {
      const clusterKey = `${node.type}-${node.level}`;
      if (!clusters.has(clusterKey)) {
        clusters.set(clusterKey, []);
      }
      clusters.get(clusterKey)!.push(node);
    });
    
    // Add cluster information to node metadata
    return nodes.map(node => ({
      ...node,
      metadata: {
        ...node.metadata,
        clusterId: `${node.type}-${node.level}`,
        clusterSize: clusters.get(`${node.type}-${node.level}`)?.length || 1
      }
    }));
  }

  /**
   * Optimize node positions to avoid overlaps
   */
  private optimizeNodePositions(nodes: MindMapNode[]): MindMapNode[] {
    const optimizedNodes = [...nodes];
    const minDistance = 50;
    
    // Simple overlap avoidance
    for (let i = 0; i < optimizedNodes.length; i++) {
      for (let j = i + 1; j < optimizedNodes.length; j++) {
        const node1 = optimizedNodes[i];
        const node2 = optimizedNodes[j];
        
        if (node1.x !== undefined && node1.y !== undefined && 
            node2.x !== undefined && node2.y !== undefined) {
          
          const dx = node2.x - node1.x;
          const dy = node2.y - node1.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < minDistance) {
            const angle = Math.atan2(dy, dx);
            const pushDistance = (minDistance - distance) / 2;
            
            node1.x -= pushDistance * Math.cos(angle);
            node1.y -= pushDistance * Math.sin(angle);
            node2.x += pushDistance * Math.cos(angle);
            node2.y += pushDistance * Math.sin(angle);
          }
        }
      }
    }
    
    return optimizedNodes;
  }

  /**
   * Capitalize first letter of string
   */
  private capitalizeFirstLetter(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  /**
   * Generate layout with different algorithms
   */
  async generateLayout(
    nodes: MindMapNode[], 
    connections: MindMapConnection[], 
    layoutType: 'radial' | 'hierarchical' | 'force-directed' | 'circular' = 'radial'
  ): Promise<MindMapLayout> {
    const layoutNodes = await this.applyLayout(nodes, connections, layoutType);
    
    return {
      nodes: layoutNodes,
      connections,
      bounds: this.calculateBounds(layoutNodes),
      layoutType
    };
  }
}