import { ILLMProvider } from '../provider';

export interface MindMapNode {
  id: string;
  label: string;
  description?: string;
  level: number;
  parent?: string;
  children: string[];
  color?: string;
  icon?: string;
  metadata?: {
    importance: 'core' | 'supporting' | 'related';
    jungianCategory?: 'archetype' | 'complex' | 'process' | 'concept';
    references?: string[];
  };
}

export interface MindMap {
  id: string;
  title: string;
  description: string;
  rootNode: string;
  nodes: Record<string, MindMapNode>;
  connections: Array<{
    from: string;
    to: string;
    type: 'hierarchical' | 'associative' | 'opposing' | 'complementary';
    label?: string;
  }>;
  layout: 'radial' | 'hierarchical' | 'organic';
  theme: 'jungian' | 'academic' | 'colorful';
}

export class MindMapGenerator {
  constructor(private provider: ILLMProvider) {}

  async generateMindMap(
    topic: string,
    concepts: string[],
    depth: number = 3,
    style: 'comprehensive' | 'simplified' | 'analytical' = 'comprehensive',
    language: string = 'pt-BR'
  ): Promise<MindMap> {
    const structure = await this.generateStructure(topic, concepts, depth, style, language);
    const nodes = await this.enrichNodes(structure, topic, language);
    const connections = await this.generateConnections(nodes, topic, language);
    
    return {
      id: `mindmap-${Date.now()}`,
      title: language === 'pt-BR' ? `${topic} - Perspectiva Junguiana` : `${topic} - Jungian Perspective`,
      description: language === 'pt-BR' ? `Uma exploração visual de ${topic} através dos conceitos psicológicos junguianos` : `A visual exploration of ${topic} through Jungian psychological concepts`,
      rootNode: structure.rootId,
      nodes,
      connections,
      layout: style === 'analytical' ? 'hierarchical' : 'radial',
      theme: 'jungian',
    };
  }

  private async generateStructure(
    topic: string,
    concepts: string[],
    depth: number,
    style: string,
    language: string = 'pt-BR'
  ): Promise<{ rootId: string; structure: any }> {
    const prompt = language === 'pt-BR' ? `
Crie uma estrutura de mapa mental para "${topic}" em psicologia junguiana com ${depth} níveis de profundidade.

Estilo: ${style === 'comprehensive' ? 'abrangente' : style === 'simplified' ? 'simplificado' : 'analítico'}
Conceitos-chave a incluir: ${concepts.join(', ')}

Requisitos:
- Comece com o tópico principal como raiz
- Ramifique em conceitos e categorias junguianas principais
- Cada nível deve ter 3-5 ramos (exceto folhas)
- Inclua aspectos teóricos e práticos
- Mostre relações entre elementos conscientes e inconscientes
- IMPORTANTE: Todos os rótulos devem estar em português brasileiro

Formato de resposta:
{
  "root": {
    "id": "root",
    "label": "Tópico Principal",
    "children": [
      {
        "id": "node1",
        "label": "Conceito 1",
        "category": "archetype|complex|process|concept",
        "importance": "core|supporting|related",
        "children": [...]
      }
    ]
  }
}
` : `
Create a mind map structure for "${topic}" in Jungian psychology with ${depth} levels of depth.

Style: ${style}
Key concepts to include: ${concepts.join(', ')}

Requirements:
- Start with the main topic as the root
- Branch into major Jungian concepts and categories
- Each level should have 3-5 branches (except leaves)
- Include both theoretical and practical aspects
- Show relationships between conscious and unconscious elements

Response format:
{
  "root": {
    "id": "root",
    "label": "Main Topic",
    "children": [
      {
        "id": "node1",
        "label": "Concept 1",
        "category": "archetype|complex|process|concept",
        "importance": "core|supporting|related",
        "children": [...]
      }
    ]
  }
}
`;

    const structure = await this.provider.generateStructuredResponse<any>(
      prompt,
      {},
      { temperature: 0.6, maxTokens: 2000 }
    );

    return { rootId: 'root', structure: structure.root };
  }

  private async enrichNodes(
    structure: any,
    topic: string,
    language: string = 'pt-BR'
  ): Promise<Record<string, MindMapNode>> {
    const nodes: Record<string, MindMapNode> = {};

    const processNode = async (node: any, level: number = 0, parentId?: string) => {
      const enrichedNode: MindMapNode = {
        id: node.id,
        label: node.label,
        level,
        parent: parentId,
        children: node.children?.map((c: any) => c.id) || [],
        metadata: {
          importance: node.importance || 'related',
          jungianCategory: node.category,
        },
      };

      // Generate description for important nodes
      if (level <= 2 && node.importance !== 'related') {
        enrichedNode.description = await this.generateNodeDescription(
          node.label,
          topic,
          parentId ? nodes[parentId]?.label : undefined,
          language
        );
      }

      // Assign colors based on Jungian categories
      enrichedNode.color = this.getColorForCategory(node.category);
      enrichedNode.icon = this.getIconForCategory(node.category);

      nodes[node.id] = enrichedNode;

      // Process children
      if (node.children) {
        for (const child of node.children) {
          await processNode(child, level + 1, node.id);
        }
      }
    };

    await processNode(structure);
    return nodes;
  }

  private async generateNodeDescription(
    nodeLabel: string,
    mainTopic: string,
    parentLabel?: string,
    language: string = 'pt-BR'
  ): Promise<string> {
    const prompt = language === 'pt-BR' ? `
Escreva uma breve descrição (50-75 palavras) de "${nodeLabel}" no contexto de ${mainTopic} na psicologia junguiana.
${parentLabel ? `Este é um subconceito de "${parentLabel}".` : ''}

Foque em:
- Significado central na teoria junguiana
- Relação com o tópico principal
- Significância prática

Mantenha conciso e educacional.
Escreva em português brasileiro.
` : `
Write a brief (50-75 words) description of "${nodeLabel}" in the context of ${mainTopic} in Jungian psychology.
${parentLabel ? `This is a sub-concept of "${parentLabel}".` : ''}

Focus on:
- Core meaning in Jungian theory
- Relationship to the main topic
- Practical significance

Keep it concise and educational.
`;

    return await this.provider.generateCompletion(prompt, {
      temperature: 0.6,
      maxTokens: 150,
    });
  }

  private async generateConnections(
    nodes: Record<string, MindMapNode>,
    topic: string,
    language: string = 'pt-BR'
  ): Promise<MindMap['connections']> {
    const nodeList = Object.values(nodes);
    const prompt = language === 'pt-BR' ? `
Identifique conexões não hierárquicas entre conceitos neste mapa mental de psicologia junguiana sobre "${topic}".

Nós:
${nodeList.map(n => `- ${n.id}: ${n.label} (${n.metadata?.jungianCategory})`).join('\n')}

Encontre conexões que mostrem:
1. Conceitos opostos mas complementares (ex: consciente/inconsciente)
2. Conceitos associados ou relacionados que não são pai-filho
3. Conceitos que trabalham juntos em processos psicológicos

Formato de resposta:
[
  {
    "from": "nodeId1",
    "to": "nodeId2",
    "type": "opposing|associative|complementary",
    "label": "Breve descrição do relacionamento em português"
  }
]

Limite às 5-8 conexões mais significativas.
` : `
Identify non-hierarchical connections between concepts in this Jungian psychology mind map about "${topic}".

Nodes:
${nodeList.map(n => `- ${n.id}: ${n.label} (${n.metadata?.jungianCategory})`).join('\n')}

Find connections that show:
1. Opposing but complementary concepts (e.g., conscious/unconscious)
2. Associated or related concepts that aren't parent-child
3. Concepts that work together in psychological processes

Response format:
[
  {
    "from": "nodeId1",
    "to": "nodeId2",
    "type": "opposing|associative|complementary",
    "label": "Brief description of relationship"
  }
]

Limit to the most meaningful 5-8 connections.
`;

    const connections = await this.provider.generateStructuredResponse<Array<{
      from: string;
      to: string;
      type: 'opposing' | 'associative' | 'complementary';
      label: string;
    }>>(prompt, [], { temperature: 0.5 });

    // Add hierarchical connections
    const hierarchicalConnections = nodeList
      .filter(n => n.parent)
      .map(n => ({
        from: n.parent!,
        to: n.id,
        type: 'hierarchical' as const,
      }));

    return [...hierarchicalConnections, ...connections];
  }

  private getColorForCategory(category?: string): string {
    const colorMap: Record<string, string> = {
      archetype: '#7C3AED', // Purple - mysterious, deep
      complex: '#DC2626', // Red - emotional, powerful
      process: '#2563EB', // Blue - flowing, transformative
      concept: '#059669', // Green - growth, understanding
    };
    return colorMap[category || 'concept'] || '#6B7280';
  }

  private getIconForCategory(category?: string): string {
    const iconMap: Record<string, string> = {
      archetype: '👑', // Coroa - padrões universais
      complex: '💎', // Gema - multifacetado
      process: '🔄', // Cíclo - transformação
      concept: '💡', // Lâmpada - compreensão
    };
    return iconMap[category || 'concept'] || '📍';
  }

  async generateStudyPath(mindMap: MindMap, language: string = 'pt-BR'): Promise<string[]> {
    const prompt = language === 'pt-BR' ? `
Com base nesta estrutura de mapa mental para psicologia junguiana, crie um caminho de estudo ótimo.

Tópico raiz: ${mindMap.title}
Total de nós: ${Object.keys(mindMap.nodes).length}

Nós por importância:
Central: ${Object.values(mindMap.nodes).filter(n => n.metadata?.importance === 'core').map(n => n.label).join(', ')}
Apoio: ${Object.values(mindMap.nodes).filter(n => n.metadata?.importance === 'supporting').map(n => n.label).join(', ')}

Crie uma sequência de aprendizagem que:
1. Comece com conceitos fundamentais
2. Construa complexidade gradualmente
3. Mostre interconexões
4. Termine com aplicações práticas

Formato de resposta:
["node-id-1", "node-id-2", ...]
` : `
Based on this mind map structure for Jungian psychology, create an optimal study path.

Root topic: ${mindMap.title}
Total nodes: ${Object.keys(mindMap.nodes).length}

Nodes by importance:
Core: ${Object.values(mindMap.nodes).filter(n => n.metadata?.importance === 'core').map(n => n.label).join(', ')}
Supporting: ${Object.values(mindMap.nodes).filter(n => n.metadata?.importance === 'supporting').map(n => n.label).join(', ')}

Create a learning sequence that:
1. Starts with foundational concepts
2. Builds complexity gradually
3. Shows interconnections
4. Ends with practical applications

Response format:
["node-id-1", "node-id-2", ...]
`;

    return await this.provider.generateStructuredResponse<string[]>(
      prompt,
      [],
      { temperature: 0.4 }
    );
  }

  async exportToD3Format(mindMap: MindMap): Promise<any> {
    // Convert to D3.js compatible format
    const nodes = Object.values(mindMap.nodes).map(node => ({
      id: node.id,
      label: node.label,
      group: node.metadata?.jungianCategory || 'concept',
      level: node.level,
      value: node.metadata?.importance === 'core' ? 3 : 
             node.metadata?.importance === 'supporting' ? 2 : 1,
    }));

    const links = mindMap.connections.map(conn => ({
      source: conn.from,
      target: conn.to,
      value: conn.type === 'hierarchical' ? 2 : 1,
      type: conn.type,
    }));

    return { nodes, links };
  }
}