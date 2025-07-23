import { MindMapGenerator, MindMap, MindMapNode } from '../mindmap-generator';
import { ILLMProvider } from '../../provider';

// Mock the provider
jest.mock('../../provider');

describe('MindMapGenerator', () => {
  let generator: MindMapGenerator;
  let mockProvider: jest.Mocked<ILLMProvider>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockProvider = {
      generateStructuredResponse: jest.fn(),
      generateCompletion: jest.fn(),
      generateText: jest.fn(),
      isAvailable: jest.fn().mockResolvedValue(true),
      validateApiKey: jest.fn().mockReturnValue(true),
    } as any;

    generator = new MindMapGenerator(mockProvider);
  });

  describe('generateMindMap', () => {
    const mockStructure = {
      root: {
        id: 'root',
        label: 'Shadow Archetype',
        children: [
          {
            id: 'node1',
            label: 'Personal Shadow',
            category: 'concept',
            importance: 'core',
            children: [
              {
                id: 'node1-1',
                label: 'Repressed Qualities',
                category: 'concept',
                importance: 'supporting'
              },
              {
                id: 'node1-2',
                label: 'Projection',
                category: 'process',
                importance: 'supporting'
              }
            ]
          },
          {
            id: 'node2',
            label: 'Collective Shadow',
            category: 'archetype',
            importance: 'core',
            children: [
              {
                id: 'node2-1',
                label: 'Cultural Shadow',
                category: 'concept',
                importance: 'related'
              }
            ]
          }
        ]
      }
    };

    const mockConnections = [
      {
        from: 'node1',
        to: 'node2',
        type: 'associative',
        label: 'Both aspects of shadow'
      },
      {
        from: 'node1-2',
        to: 'node2-1',
        type: 'complementary',
        label: 'Individual and collective projection'
      }
    ];

    beforeEach(() => {
      // Mock structure generation
      mockProvider.generateStructuredResponse
        .mockResolvedValueOnce(mockStructure) // For structure
        .mockResolvedValueOnce(mockConnections); // For connections

      // Mock description generation
      mockProvider.generateCompletion.mockResolvedValue('Brief description of the concept in Jungian psychology');
    });

    it('should generate a complete mind map with all components', async () => {
      const mindMap = await generator.generateMindMap(
        'Shadow Archetype',
        ['personal shadow', 'projection', 'integration'],
        3,
        'comprehensive',
        'en'
      );

      expect(mindMap).toMatchObject({
        id: expect.stringMatching(/^mindmap-\d+$/),
        title: 'Shadow Archetype - Jungian Perspective',
        description: 'A visual exploration of Shadow Archetype through Jungian psychological concepts',
        rootNode: 'root',
        layout: 'radial',
        theme: 'jungian'
      });

      // Check nodes were created
      expect(Object.keys(mindMap.nodes)).toHaveLength(6); // root + 2 children + 3 grandchildren
      expect(mindMap.nodes['root']).toMatchObject({
        id: 'root',
        label: 'Shadow Archetype',
        level: 0,
        children: ['node1', 'node2']
      });

      // Check connections include both hierarchical and custom
      const hierarchicalConnections = mindMap.connections.filter(c => c.type === 'hierarchical');
      const customConnections = mindMap.connections.filter(c => c.type !== 'hierarchical');
      
      expect(hierarchicalConnections).toHaveLength(5); // All parent-child relationships
      expect(customConnections).toHaveLength(2); // Mock connections
    });

    it('should handle Portuguese language requests', async () => {
      const mindMap = await generator.generateMindMap(
        'Arquétipo da Sombra',
        ['sombra pessoal', 'projeção'],
        2,
        'simplified',
        'pt-BR'
      );

      expect(mindMap.title).toBe('Arquétipo da Sombra - Perspectiva Junguiana');
      expect(mindMap.description).toBe('Uma exploração visual de Arquétipo da Sombra através dos conceitos psicológicos junguianos');

      // Check Portuguese prompts were used
      expect(mockProvider.generateStructuredResponse).toHaveBeenCalledWith(
        expect.stringContaining('Crie uma estrutura de mapa mental'),
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should use hierarchical layout for analytical style', async () => {
      const mindMap = await generator.generateMindMap(
        'Individuation Process',
        ['ego', 'self', 'shadow'],
        3,
        'analytical'
      );

      expect(mindMap.layout).toBe('hierarchical');
    });

    it('should assign colors and icons based on categories', async () => {
      const mindMap = await generator.generateMindMap(
        'Jungian Concepts',
        ['archetypes', 'complexes'],
        2
      );

      // Check archetype node has purple color and crown icon
      const archetypeNode = mindMap.nodes['node2'];
      expect(archetypeNode.color).toBe('#7C3AED');
      expect(archetypeNode.icon).toBe('👑');

      // Check process node has blue color and cycle icon
      const processNode = mindMap.nodes['node1-2'];
      expect(processNode.color).toBe('#2563EB');
      expect(processNode.icon).toBe('🔄');
    });

    it('should generate descriptions only for important nodes', async () => {
      const mindMap = await generator.generateMindMap(
        'Test Topic',
        ['concept1'],
        3
      );

      // Core and supporting nodes should have descriptions
      expect(mindMap.nodes['node1'].description).toBeDefined();
      expect(mindMap.nodes['node1-1'].description).toBeDefined();

      // Related or deep nodes should not have descriptions
      expect(mindMap.nodes['node2-1'].description).toBeUndefined();
    });

    it('should handle errors in structure generation', async () => {
      // Reset all mocks to clear any previous setup
      mockProvider.generateStructuredResponse.mockReset();
      mockProvider.generateCompletion.mockReset();
      
      // Set up rejection for the first call
      mockProvider.generateStructuredResponse.mockRejectedValueOnce(new Error('Generation failed'));

      await expect(generator.generateMindMap(
        'Failed Topic',
        ['concept'],
        2
      )).rejects.toThrow('Generation failed');
    });
  });

  describe('generateStudyPath', () => {
    const mockMindMap: MindMap = {
      id: 'mindmap-123',
      title: 'Shadow Work - Jungian Perspective',
      description: 'Visual exploration of shadow work',
      rootNode: 'root',
      nodes: {
        'root': {
          id: 'root',
          label: 'Shadow Work',
          level: 0,
          children: ['node1', 'node2'],
          metadata: { importance: 'core', jungianCategory: 'process' }
        },
        'node1': {
          id: 'node1',
          label: 'Recognition',
          level: 1,
          parent: 'root',
          children: [],
          metadata: { importance: 'core', jungianCategory: 'process' }
        },
        'node2': {
          id: 'node2',
          label: 'Integration',
          level: 1,
          parent: 'root',
          children: [],
          metadata: { importance: 'supporting', jungianCategory: 'process' }
        }
      },
      connections: [],
      layout: 'radial',
      theme: 'jungian'
    };

    it('should generate a study path for the mind map', async () => {
      mockProvider.generateStructuredResponse.mockResolvedValue(['root', 'node1', 'node2']);

      const studyPath = await generator.generateStudyPath(mockMindMap, 'en');

      expect(studyPath).toEqual(['root', 'node1', 'node2']);
      expect(mockProvider.generateStructuredResponse).toHaveBeenCalledWith(
        expect.stringContaining('create an optimal study path'),
        [],
        { temperature: 0.4 }
      );
    });

    it('should include node importance in prompt', async () => {
      await generator.generateStudyPath(mockMindMap, 'pt-BR');

      expect(mockProvider.generateStructuredResponse).toHaveBeenCalledWith(
        expect.stringContaining('Central: Shadow Work, Recognition'),
        expect.any(Array),
        expect.any(Object)
      );
      expect(mockProvider.generateStructuredResponse).toHaveBeenCalledWith(
        expect.stringContaining('Apoio: Integration'),
        expect.any(Array),
        expect.any(Object)
      );
    });
  });

  describe('exportToD3Format', () => {
    const mockMindMap: MindMap = {
      id: 'mindmap-123',
      title: 'Test Mind Map',
      description: 'Test description',
      rootNode: 'root',
      nodes: {
        'root': {
          id: 'root',
          label: 'Main Topic',
          level: 0,
          children: ['node1'],
          metadata: { importance: 'core', jungianCategory: 'archetype' }
        },
        'node1': {
          id: 'node1',
          label: 'Sub Topic',
          level: 1,
          parent: 'root',
          children: [],
          metadata: { importance: 'supporting', jungianCategory: 'concept' }
        }
      },
      connections: [
        { from: 'root', to: 'node1', type: 'hierarchical' },
        { from: 'root', to: 'node1', type: 'associative', label: 'Related' }
      ],
      layout: 'radial',
      theme: 'jungian'
    };

    it('should export mind map to D3.js format', async () => {
      const d3Data = await generator.exportToD3Format(mockMindMap);

      expect(d3Data.nodes).toHaveLength(2);
      expect(d3Data.nodes[0]).toEqual({
        id: 'root',
        label: 'Main Topic',
        group: 'archetype',
        level: 0,
        value: 3 // core importance
      });
      expect(d3Data.nodes[1]).toEqual({
        id: 'node1',
        label: 'Sub Topic',
        group: 'concept',
        level: 1,
        value: 2 // supporting importance
      });

      expect(d3Data.links).toHaveLength(2);
      expect(d3Data.links[0]).toEqual({
        source: 'root',
        target: 'node1',
        value: 2, // hierarchical
        type: 'hierarchical'
      });
      expect(d3Data.links[1]).toEqual({
        source: 'root',
        target: 'node1',
        value: 1, // non-hierarchical
        type: 'associative'
      });
    });

    it('should handle nodes without metadata', async () => {
      const mindMapWithoutMetadata = {
        ...mockMindMap,
        nodes: {
          'node1': {
            id: 'node1',
            label: 'No Metadata Node',
            level: 0,
            children: []
          }
        }
      };

      const d3Data = await generator.exportToD3Format(mindMapWithoutMetadata);

      expect(d3Data.nodes[0]).toEqual({
        id: 'node1',
        label: 'No Metadata Node',
        group: 'concept', // default
        level: 0,
        value: 1 // default for no importance
      });
    });
  });

  describe('helper methods', () => {
    describe('getColorForCategory', () => {
      it('should return correct colors for categories', () => {
        const colorMap = {
          'archetype': '#7C3AED',
          'complex': '#DC2626',
          'process': '#2563EB',
          'concept': '#059669'
        };

        Object.entries(colorMap).forEach(([category, expectedColor]) => {
          const color = (generator as any).getColorForCategory(category);
          expect(color).toBe(expectedColor);
        });

        // Test default color
        expect((generator as any).getColorForCategory(undefined)).toBe('#6B7280');
        expect((generator as any).getColorForCategory('unknown')).toBe('#6B7280');
      });
    });

    describe('getIconForCategory', () => {
      it('should return correct icons for categories', () => {
        const iconMap = {
          'archetype': '👑',
          'complex': '💎',
          'process': '🔄',
          'concept': '💡'
        };

        Object.entries(iconMap).forEach(([category, expectedIcon]) => {
          const icon = (generator as any).getIconForCategory(category);
          expect(icon).toBe(expectedIcon);
        });

        // Test default icon
        expect((generator as any).getIconForCategory(undefined)).toBe('📍');
        expect((generator as any).getIconForCategory('unknown')).toBe('📍');
      });
    });

    describe('generateNodeDescription', () => {
      it('should generate description with context', async () => {
        mockProvider.generateCompletion.mockResolvedValue('This concept represents the hidden aspects of personality');

        const description = await (generator as any).generateNodeDescription(
          'Shadow',
          'Jungian Psychology',
          'Unconscious',
          'en'
        );

        expect(description).toBe('This concept represents the hidden aspects of personality');
        expect(mockProvider.generateCompletion).toHaveBeenCalledWith(
          expect.stringContaining('Write a brief (50-75 words) description'),
          { temperature: 0.6, maxTokens: 150 }
        );
        expect(mockProvider.generateCompletion).toHaveBeenCalledWith(
          expect.stringContaining('This is a sub-concept of "Unconscious"'),
          expect.any(Object)
        );
      });

      it('should handle Portuguese descriptions', async () => {
        await (generator as any).generateNodeDescription(
          'Sombra',
          'Psicologia Junguiana',
          undefined,
          'pt-BR'
        );

        expect(mockProvider.generateCompletion).toHaveBeenCalledWith(
          expect.stringContaining('Escreva uma breve descrição'),
          expect.any(Object)
        );
        expect(mockProvider.generateCompletion).toHaveBeenCalledWith(
          expect.stringContaining('Escreva em português brasileiro'),
          expect.any(Object)
        );
      });
    });

    describe('generateConnections', () => {
      it('should generate non-hierarchical connections', async () => {
        const nodes = {
          'node1': {
            id: 'node1',
            label: 'Conscious',
            level: 1,
            parent: 'root',
            children: [],
            metadata: { importance: 'core', jungianCategory: 'concept' }
          },
          'node2': {
            id: 'node2',
            label: 'Unconscious',
            level: 1,
            parent: 'root',
            children: [],
            metadata: { importance: 'core', jungianCategory: 'concept' }
          },
          'root': {
            id: 'root',
            label: 'Psyche',
            level: 0,
            children: ['node1', 'node2'],
            metadata: { importance: 'core', jungianCategory: 'concept' }
          }
        };

        const mockCustomConnections = [
          {
            from: 'node1',
            to: 'node2',
            type: 'opposing' as const,
            label: 'Complementary opposites'
          }
        ];

        mockProvider.generateStructuredResponse.mockResolvedValue(mockCustomConnections);

        const connections = await (generator as any).generateConnections(
          nodes,
          'Psyche Structure',
          'en'
        );

        // Should include hierarchical connections
        expect(connections).toContainEqual({
          from: 'root',
          to: 'node1',
          type: 'hierarchical'
        });
        expect(connections).toContainEqual({
          from: 'root',
          to: 'node2',
          type: 'hierarchical'
        });

        // Should include custom connections
        expect(connections).toContainEqual(mockCustomConnections[0]);
      });

      it('should limit connections to meaningful ones', async () => {
        const nodes = {
          'node1': { id: 'node1', label: 'Test1', level: 0, children: [], metadata: {} },
          'node2': { id: 'node2', label: 'Test2', level: 0, children: [], metadata: {} }
        };

        await (generator as any).generateConnections(nodes, 'Test Topic', 'pt-BR');

        expect(mockProvider.generateStructuredResponse).toHaveBeenCalledWith(
          expect.stringContaining('Limite às 5-8 conexões mais significativas'),
          expect.any(Array),
          expect.any(Object)
        );
      });
    });
  });
});