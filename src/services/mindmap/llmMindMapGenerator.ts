import { Module, MindMapNode, MindMapEdge } from '../../types';
import { ILLMProvider } from '../llm/types';
import { JungianCategory, CATEGORY_COLORS } from './mindMapGenerator';

export interface LLMGeneratedMindMap {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
  metadata: {
    module: string;
    totalNodes: number;
    depth: number;
    concepts: string[];
    learningPath: string[];
  };
}

export interface ConceptNode {
  id: string;
  label: string;
  description: string;
  importance: 'core' | 'primary' | 'secondary' | 'detail';
  category: string;
  parent?: string | null;
  children?: string[];
  examples?: string[];
  connections?: string[];
}

export class LLMMindMapGenerator {
  private nodeIdCounter = 0;
  private edgeIdCounter = 0;

  constructor(private llmProvider: ILLMProvider) {}

  /**
   * Generate a didactic mind map from module content using LLM
   */
  async generateFromModuleContent(module: Module): Promise<LLMGeneratedMindMap> {
    try {
      // Step 1: Analyze module content and extract key concepts
      const concepts = await this.extractKeyConcepts(module);
      
      // Step 2: Generate hierarchical structure
      const structure = await this.generateHierarchicalStructure(module, concepts);
      
      // Step 3: Create visual nodes and edges
      const { nodes, edges } = this.createVisualElements(structure, module);
      
      // Step 4: Generate learning path
      const learningPath = this.generateLearningPath(structure);
      
      return {
        nodes,
        edges,
        metadata: {
          module: module.title,
          totalNodes: nodes.length,
          depth: this.calculateDepth(structure),
          concepts: concepts.map(c => c.label),
          learningPath
        }
      };
    } catch (error) {
      console.error('Error generating LLM mind map:', error);
      // Fallback to basic structure
      return this.generateFallbackStructure(module);
    }
  }

  /**
   * Extract key concepts from module content using LLM
   */
  private async extractKeyConcepts(module: Module): Promise<ConceptNode[]> {
    const prompt = `
Analyze this educational module about Jungian psychology and extract key concepts for a mind map.

Module: ${module.title}
Description: ${module.description}

Content:
${module.content.introduction}

Sections:
${module.content.sections.map(s => `- ${s.title}: ${s.content.substring(0, 200)}...`).join('\n')}

Key Terms:
${module.content.sections.flatMap(s => s.keyTerms || []).map(kt => `- ${kt.term}: ${kt.definition}`).join('\n')}

Please provide a structured list of concepts with the following format for each:
1. Main concepts (3-5 core ideas)
2. Sub-concepts for each main concept (2-4 per main concept)
3. Supporting details or examples (1-2 per sub-concept)
4. Connections between concepts

Focus on creating a didactic structure that helps learners understand the relationships between ideas.
Format as JSON with this structure:
{
  "concepts": [
    {
      "id": "unique_id",
      "label": "Concept Name",
      "description": "Brief explanation",
      "importance": "core|primary|secondary|detail",
      "category": "theoretical|practical|historical|clinical",
      "parent": "parent_id or null",
      "examples": ["example1", "example2"],
      "connections": ["related_concept_id1", "related_concept_id2"]
    }
  ]
}`;

    try {
      const response = await this.llmProvider.generateStructuredOutput(prompt, {
        type: 'object',
        properties: {
          concepts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                label: { type: 'string' },
                description: { type: 'string' },
                importance: { type: 'string', enum: ['core', 'primary', 'secondary', 'detail'] },
                category: { type: 'string' },
                parent: { type: 'string', nullable: true },
                examples: { type: 'array', items: { type: 'string' } },
                connections: { type: 'array', items: { type: 'string' } }
              },
              required: ['id', 'label', 'description', 'importance', 'category']
            }
          }
        },
        required: ['concepts']
      });

      return (response as any).concepts || [];
    } catch (error) {
      console.error('Error extracting concepts:', error);
      return this.extractConceptsFallback(module);
    }
  }

  /**
   * Generate hierarchical structure for better learning
   */
  private async generateHierarchicalStructure(
    module: Module, 
    concepts: ConceptNode[]
  ): Promise<ConceptNode[]> {
    const prompt = `
Organize these concepts into a hierarchical learning structure for the module "${module.title}".

Current concepts:
${concepts.map(c => `- ${c.label}: ${c.description}`).join('\n')}

Create a didactic hierarchy that:
1. Starts with foundational concepts
2. Builds complexity gradually
3. Shows clear relationships between ideas
4. Groups related concepts together
5. Follows a logical learning progression

Reorganize the concepts with proper parent-child relationships and add any missing connecting concepts.
Return the same JSON structure but with updated parent relationships and potentially new bridging concepts.`;

    try {
      const response = await this.llmProvider.generateStructuredOutput(prompt, {
        type: 'object',
        properties: {
          concepts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                label: { type: 'string' },
                description: { type: 'string' },
                importance: { type: 'string' },
                category: { type: 'string' },
                parent: { type: 'string', nullable: true },
                children: { type: 'array', items: { type: 'string' } },
                examples: { type: 'array', items: { type: 'string' } },
                connections: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        }
      });

      return (response as any).concepts || concepts;
    } catch (error) {
      console.error('Error generating hierarchy:', error);
      return concepts;
    }
  }

  /**
   * Create visual nodes and edges from concept structure
   */
  private createVisualElements(
    concepts: ConceptNode[], 
    module: Module
  ): { nodes: MindMapNode[], edges: MindMapEdge[] } {
    const nodes: MindMapNode[] = [];
    const edges: MindMapEdge[] = [];
    
    // Create root node for the module
    const rootNode = this.createNode(
      'root',
      module.title,
      module.description,
      { x: 400, y: 300 },
      'core',
      this.getJungianCategory(module.title),
      module.id
    );
    nodes.push(rootNode);

    // Create concept nodes with hierarchical positioning
    const nodeMap = new Map<string, MindMapNode>();
    nodeMap.set('root', rootNode);

    // First pass: create all nodes
    concepts.forEach((concept) => {
      const level = this.getConceptLevel(concept, concepts);
      const position = this.calculateNodePosition(concept, concepts, level);
      
      const node = this.createNode(
        concept.id,
        concept.label,
        concept.description,
        position,
        concept.importance,
        this.getJungianCategory(concept.label + ' ' + concept.description),
        module.id,
        concept.examples
      );
      
      nodes.push(node);
      nodeMap.set(concept.id, node);
    });

    // Second pass: create edges
    concepts.forEach((concept) => {
      // Parent-child relationships
      if (concept.parent) {
        const parentId = concept.parent === null ? 'root' : concept.parent;
        edges.push(this.createEdge(parentId, concept.id, 'contains'));
      } else if (!concept.parent) {
        // Connect top-level concepts to root
        edges.push(this.createEdge('root', concept.id, 'includes'));
      }

      // Cross-connections
      if (concept.connections) {
        concept.connections.forEach(targetId => {
          if (nodeMap.has(targetId)) {
            edges.push(this.createEdge(
              concept.id, 
              targetId, 
              'relates to',
              true,
              'dashed'
            ));
          }
        });
      }
    });

    return { nodes, edges };
  }

  /**
   * Calculate node position based on hierarchy and importance
   */
  private calculateNodePosition(
    concept: ConceptNode,
    allConcepts: ConceptNode[],
    level: number
  ): { x: number, y: number } {
    // Group concepts by level
    const levelConcepts = allConcepts.filter(c => 
      this.getConceptLevel(c, allConcepts) === level
    );
    
    const index = levelConcepts.indexOf(concept);
    const total = levelConcepts.length;
    
    // Calculate radial or hierarchical position based on level
    if (level === 0) {
      return { x: 400, y: 300 }; // Center
    } else if (level === 1) {
      // Primary concepts in a circle
      const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
      const radius = 200;
      return {
        x: 400 + radius * Math.cos(angle),
        y: 300 + radius * Math.sin(angle)
      };
    } else {
      // Secondary and detail concepts in layers
      const parentConcept = allConcepts.find(c => c.id === concept.parent);
      if (parentConcept) {
        const parentPos = this.calculateNodePosition(parentConcept, allConcepts, level - 1);
        const offset = 150;
        const spread = 100;
        const siblingIndex = levelConcepts.filter(c => c.parent === concept.parent).indexOf(concept);
        const totalSiblings = levelConcepts.filter(c => c.parent === concept.parent).length;
        
        return {
          x: parentPos.x + (siblingIndex - totalSiblings / 2) * spread,
          y: parentPos.y + offset
        };
      }
    }
    
    // Fallback position
    return {
      x: 200 + (index * 150),
      y: 100 + (level * 150)
    };
  }

  /**
   * Get concept level in hierarchy
   */
  private getConceptLevel(concept: ConceptNode, allConcepts: ConceptNode[]): number {
    if (!concept.parent || concept.parent === 'root') return 1;
    
    const parent = allConcepts.find(c => c.id === concept.parent);
    if (!parent) return 1;
    
    return this.getConceptLevel(parent, allConcepts) + 1;
  }

  /**
   * Generate learning path through concepts
   */
  private generateLearningPath(concepts: ConceptNode[]): string[] {
    const path: string[] = [];
    const visited = new Set<string>();
    
    // Start with core concepts
    const coreConcepts = concepts.filter(c => c.importance === 'core');
    coreConcepts.forEach(c => {
      if (!visited.has(c.id)) {
        path.push(c.id);
        visited.add(c.id);
      }
    });
    
    // Then primary concepts
    const primaryConcepts = concepts.filter(c => c.importance === 'primary');
    primaryConcepts.forEach(c => {
      if (!visited.has(c.id)) {
        path.push(c.id);
        visited.add(c.id);
      }
    });
    
    // Finally secondary and details
    concepts.filter(c => !visited.has(c.id)).forEach(c => {
      path.push(c.id);
    });
    
    return path;
  }

  /**
   * Create a mind map node
   */
  private createNode(
    id: string,
    label: string,
    description: string,
    position: { x: number, y: number },
    importance: string,
    category: JungianCategory,
    moduleId?: string,
    examples?: string[]
  ): MindMapNode {
    const nodeId = `node-${id}`;
    
    const importanceStyles = {
      core: { width: 180, height: 80, fontSize: 16, fontWeight: 'bold' },
      primary: { width: 150, height: 60, fontSize: 14, fontWeight: 'semibold' },
      secondary: { width: 120, height: 50, fontSize: 12, fontWeight: 'normal' },
      detail: { width: 100, height: 40, fontSize: 11, fontWeight: 'normal' }
    };
    
    const style = {
      background: CATEGORY_COLORS[category] || '#6b7280',
      color: '#ffffff',
      border: `2px solid ${CATEGORY_COLORS[category] || '#6b7280'}`,
      borderRadius: 8,
      padding: 10,
      cursor: 'pointer',
      ...importanceStyles[importance as keyof typeof importanceStyles] || importanceStyles.secondary
    };

    return {
      id: nodeId,
      type: 'module',
      data: {
        label,
        description,
        moduleId,
        level: importance === 'core' ? 0 : importance === 'primary' ? 1 : 2,
        category: category.toString(),
        expandable: true,
        moduleCategory: category.toString(),
        categoryColor: style.background,
        difficulty: importance === 'core' ? 'advanced' : importance === 'primary' ? 'intermediate' : 'beginner',
        moduleInfo: description,
        examples
      },
      position,
      style: style as any
    };
  }

  /**
   * Create an edge
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
      source: source.startsWith('node-') ? source : `node-${source}`,
      target: target.startsWith('node-') ? target : `node-${target}`,
      label,
      animated,
      type: type || 'default',
      style: type === 'dashed' ? { strokeDasharray: '5 5' } : {}
    };
  }

  /**
   * Map content to Jungian categories
   */
  private getJungianCategory(text: string): JungianCategory {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('self') && lowerText.includes('realization')) return JungianCategory.SELF;
    if (lowerText.includes('shadow')) return JungianCategory.SHADOW;
    if (lowerText.includes('anima') || lowerText.includes('animus')) return JungianCategory.ANIMA_ANIMUS;
    if (lowerText.includes('persona')) return JungianCategory.PERSONA;
    if (lowerText.includes('collective')) return JungianCategory.COLLECTIVE;
    if (lowerText.includes('personal')) return JungianCategory.PERSONAL;
    if (lowerText.includes('individuation')) return JungianCategory.PROCESS;
    
    return JungianCategory.CONCEPT;
  }

  /**
   * Calculate depth of concept tree
   */
  private calculateDepth(concepts: ConceptNode[]): number {
    let maxDepth = 0;
    concepts.forEach(concept => {
      const depth = this.getConceptLevel(concept, concepts);
      maxDepth = Math.max(maxDepth, depth);
    });
    return maxDepth;
  }

  /**
   * Fallback concept extraction without LLM
   */
  private extractConceptsFallback(module: Module): ConceptNode[] {
    const concepts: ConceptNode[] = [];
    let idCounter = 0;

    // Add main module concept
    concepts.push({
      id: `concept-${idCounter++}`,
      label: module.title,
      description: module.description,
      importance: 'core',
      category: 'theoretical',
      parent: null
    });

    // Add section concepts
    module.content.sections.forEach(section => {
      const sectionConcept: ConceptNode = {
        id: `concept-${idCounter++}`,
        label: section.title,
        description: section.content.substring(0, 200),
        importance: 'primary',
        category: 'theoretical',
        parent: 'concept-0'
      };
      concepts.push(sectionConcept);

      // Add key terms as secondary concepts
      if (section.keyTerms) {
        section.keyTerms.forEach(term => {
          concepts.push({
            id: `concept-${idCounter++}`,
            label: term.term,
            description: term.definition,
            importance: 'secondary',
            category: 'theoretical',
            parent: sectionConcept.id
          });
        });
      }
    });

    return concepts;
  }

  /**
   * Generate fallback structure when LLM fails
   */
  private generateFallbackStructure(module: Module): LLMGeneratedMindMap {
    const concepts = this.extractConceptsFallback(module);
    const { nodes, edges } = this.createVisualElements(concepts, module);
    
    return {
      nodes,
      edges,
      metadata: {
        module: module.title,
        totalNodes: nodes.length,
        depth: 3,
        concepts: concepts.map(c => c.label),
        learningPath: concepts.map(c => c.id)
      }
    };
  }
}