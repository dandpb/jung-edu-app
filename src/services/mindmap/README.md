# Mind Map Generation Service

This service provides advanced mind map generation capabilities for the Jung Educational App, integrating with React Flow for interactive visualization.

## Features

### 1. Mind Map Generator (`mindMapGenerator.ts`)
- **Generate from single module**: Creates a focused mind map from one module's content
- **Generate from multiple modules**: Creates a comprehensive map showing relationships
- **Jungian categorization**: Automatically categorizes nodes into Jungian archetypes
- **Smart connections**: Creates logical relationships between concepts
- **Visual hierarchy**: Uses color, size, and styling to indicate importance

### 2. Layout Algorithms (`mindMapLayouts.ts`)
- **Hierarchical Layout**: Top-down tree structure for clear dependencies
- **Radial Layout**: Center-out arrangement for exploring from core concepts
- **Force-Directed Layout**: Physics-based layout for natural groupings
- **Circular Layout**: Simple arrangement for small concept groups
- **Tree Layout**: Optimized hierarchical layout with better child distribution

### 3. React Flow Integration (`reactFlowAdapter.ts`)
- Seamless conversion between internal format and React Flow
- Dynamic layout switching without losing data
- Study path generation for guided learning
- Category filtering for focused exploration
- Path highlighting for visual learning routes

## Usage Examples

### Basic Mind Map from Modules

```typescript
import { InteractiveMindMap } from '../components/mindmap/InteractiveMindMap';
import { modules } from '../data/modules';

function MindMapPage() {
  return (
    <InteractiveMindMap
      modules={modules}
      initialLayout={LayoutType.RADIAL}
      showControls={true}
      showMiniMap={true}
      onNodeClick={(moduleId) => {
        // Handle module click
        console.log('Module clicked:', moduleId);
      }}
    />
  );
}
```

### Generate Mind Map Programmatically

```typescript
import { MindMapGenerator } from '../services/mindmap';
import { modules } from '../data/modules';

const generator = new MindMapGenerator();

// Generate from single module
const singleModuleMap = generator.generateFromModule(modules[0]);

// Generate from all modules
const fullMap = generator.generateFromModules(modules);

// Access generated data
console.log('Nodes:', fullMap.nodes);
console.log('Edges:', fullMap.edges);
console.log('Categories:', fullMap.metadata.categorization);
```

### Apply Different Layouts

```typescript
import { MindMapLayouts, LayoutType } from '../services/mindmap';

const layouts = new MindMapLayouts();

// Apply hierarchical layout
const hierarchicalNodes = layouts.applyLayout(
  nodes,
  edges,
  LayoutType.HIERARCHICAL,
  {
    width: 1200,
    height: 800,
    nodeSpacing: { x: 150, y: 100 }
  }
);

// Get layout recommendation
const optimalLayout = layouts.suggestOptimalLayout(nodes, edges);
```

### Use React Flow Adapter

```typescript
import { ReactFlowAdapter } from '../services/mindmap/reactFlowAdapter';
import { modules } from '../data/modules';

const adapter = new ReactFlowAdapter();

// Generate React Flow compatible data
const { nodes, edges } = adapter.generateFromModules(
  modules,
  LayoutType.RADIAL
);

// Generate study path
const studyPath = adapter.generateStudyPath(nodes, edges);

// Highlight a path
const highlighted = adapter.highlightPath(nodes, edges, ['node-1', 'node-2']);

// Filter by category
const filtered = adapter.filterByCategory(nodes, edges, ['archetype', 'process']);
```

## Jungian Categories

The generator automatically categorizes content into these Jungian concepts:

- **Self**: Self-realization, wholeness
- **Shadow**: Repressed aspects, dark side
- **Anima/Animus**: Contrasexual aspects
- **Persona**: Social mask, public face
- **Hero**: Journey, transformation
- **Wise Old**: Wisdom, guidance
- **Trickster**: Chaos, change
- **Mother**: Nurturing, creation
- **Child**: Innocence, potential
- **Collective**: Collective unconscious
- **Personal**: Personal unconscious
- **Process**: Individuation, development
- **Concept**: General concepts

## Integration with Existing App

The mind map services integrate seamlessly with the existing React Flow implementation:

1. **Replace static data**: Instead of hardcoded nodes/edges, use the generator
2. **Dynamic content**: Generate maps based on actual module content
3. **Interactive features**: Study paths, filtering, layout switching
4. **Consistent styling**: Uses the app's color scheme and design system

## Advanced Features

### Custom Node Types
You can extend the generator to create custom node types:

```typescript
const customNode = generator.createNode(
  'Custom Label',
  'Description',
  { x: 100, y: 100 },
  NodeImportance.PRIMARY,
  JungianCategory.ARCHETYPE,
  'module-id'
);
```

### Connection Analysis
The generator analyzes content to create meaningful connections:

- Prerequisites create dependency edges
- Similar concepts create associative edges
- Opposing concepts create complementary edges

### Performance Optimization
- Efficient layout algorithms with O(n log n) complexity
- Lazy loading for large mind maps
- Memoized calculations for layout switching

## Best Practices

1. **Module Organization**: Ensure modules have clear titles and descriptions
2. **Content Structure**: Use sections and key terms for better node generation
3. **Prerequisites**: Define module prerequisites for dependency visualization
4. **Categories**: Use descriptive content that maps to Jungian categories
5. **Performance**: For large maps (>100 nodes), use force-directed or hierarchical layouts

## Future Enhancements

- AI-powered connection discovery
- 3D visualization options
- Collaborative mind mapping
- Export to various formats (SVG, PNG, PDF)
- Animation between layouts
- Custom node templates
- Search and highlight functionality