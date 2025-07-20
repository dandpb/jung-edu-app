# AI-Powered Module Deep Dive Mind Maps

## Overview

The Jung Education platform now features AI-powered deep dive mind maps that automatically generate detailed, educational concept maps when users click on any module. This feature uses LLM technology to analyze module content and create didactic structures that enhance learning.

## How It Works

### 1. Module Click Interaction
When a user clicks on any module in the main mind map:
- The system captures the module's complete content
- Transitions to a dedicated deep-dive view
- Generates a detailed concept map specific to that module

### 2. AI Content Analysis
The LLM analyzer performs several steps:
- **Concept Extraction**: Identifies key concepts, principles, and ideas from the module
- **Hierarchical Structuring**: Organizes concepts from foundational to advanced
- **Relationship Mapping**: Creates connections between related concepts
- **Example Generation**: Adds practical examples to concepts
- **Learning Path Creation**: Suggests an optimal order for studying concepts

### 3. Visual Representation
The generated mind map includes:
- **Core Concepts** (Large purple nodes): Main ideas of the module
- **Primary Ideas** (Blue nodes): Key supporting concepts
- **Secondary Details** (Green nodes): Specific details and examples
- **Connections**: Solid lines for hierarchy, dashed for relationships

## Features

### Intelligent Content Analysis
- Extracts 15-30 concepts per module
- Categorizes by importance and type
- Creates multi-level hierarchies
- Identifies cross-concept relationships

### Educational Structure
- Follows pedagogical principles
- Builds from simple to complex
- Groups related concepts
- Provides clear learning progression

### Interactive Elements
- Click nodes to see detailed descriptions
- View examples and applications
- Navigate through suggested learning paths
- Real-time generation with loading states

### Visual Design
- Color-coded by concept importance
- Size indicates concept significance
- Mini-map for navigation
- Legend for easy understanding

## Implementation Details

### Components

1. **LLMMindMapGenerator** (`src/services/mindmap/llmMindMapGenerator.ts`)
   - Core AI logic for concept extraction
   - Hierarchical structure generation
   - Visual element creation
   - Learning path algorithm

2. **ModuleDeepDiveMindMap** (`src/components/mindmap/ModuleDeepDiveMindMap.tsx`)
   - Deep dive view component
   - Loading and error states
   - Node interaction handling
   - Visual rendering

3. **EnhancedMindMapPage** (`src/pages/EnhancedMindMapPage.tsx`)
   - Main page with overview/detail switching
   - Module selection handling
   - Navigation and breadcrumbs

### AI Integration

The system supports two modes:
- **OpenAI Mode**: Full AI analysis with GPT models (requires API key)
- **Demo Mode**: Pre-structured fallback for testing without API key

### Data Flow

1. User clicks module → `handleNodeClick`
2. Module data passed to `LLMMindMapGenerator`
3. LLM analyzes content → returns structured concepts
4. Concepts transformed to visual nodes/edges
5. ReactFlow renders interactive mind map

## Usage Instructions

### For Users

1. Navigate to "AI Mind Map" in the navigation
2. Click on any module node to generate its concept map
3. Explore the generated concepts:
   - Click nodes for details
   - Follow visual connections
   - Use mini-map for navigation
   - Click back to return to overview

### For Developers

To enable full AI features:
```javascript
// Set OpenAI API key in localStorage
localStorage.setItem('openai_api_key', 'your-api-key');
```

To customize concept extraction:
```javascript
// Modify prompt in extractKeyConcepts method
private async extractKeyConcepts(module: Module): Promise<ConceptNode[]> {
  const prompt = `Your custom prompt here...`;
  // ...
}
```

## Example Generated Structure

For a module on "The Collective Unconscious":
```
Collective Unconscious (Core)
├── Definition & Nature (Primary)
│   ├── Inherited Patterns (Secondary)
│   └── Universal Symbols (Secondary)
├── Archetypes (Primary)
│   ├── Shadow (Secondary)
│   ├── Anima/Animus (Secondary)
│   └── Self (Secondary)
└── Evidence & Manifestations (Primary)
    ├── Dreams (Secondary)
    ├── Myths (Secondary)
    └── Art & Culture (Secondary)
```

## Future Enhancements

### Planned Features
- Save generated mind maps
- Export as image/PDF
- Collaborative annotations
- Custom concept highlighting
- Progress tracking per concept
- Quiz generation from concepts

### Technical Improvements
- Caching generated structures
- Batch concept processing
- Enhanced layout algorithms
- Real-time collaboration
- Mobile-optimized views

## API Response Example

```json
{
  "concepts": [
    {
      "id": "core-1",
      "label": "Collective Unconscious",
      "description": "The deepest layer of the psyche containing universal patterns",
      "importance": "core",
      "category": "theoretical",
      "parent": null,
      "examples": ["Universal flood myths", "Hero's journey pattern"],
      "connections": ["primary-1", "primary-2"]
    },
    {
      "id": "primary-1",
      "label": "Archetypes",
      "description": "Universal, inherited patterns or images",
      "importance": "primary",
      "category": "theoretical",
      "parent": "core-1",
      "examples": ["The Mother", "The Shadow"],
      "connections": ["secondary-1", "secondary-2"]
    }
  ]
}
```

## Benefits for Learning

1. **Structured Understanding**: Concepts organized hierarchically
2. **Visual Learning**: Spatial representation aids memory
3. **Relationship Clarity**: See how ideas connect
4. **Progressive Complexity**: Start simple, build up
5. **Active Exploration**: Interactive discovery of content
6. **Personalized Paths**: AI suggests learning sequences

## Troubleshooting

### Common Issues

1. **"Failed to generate mind map"**
   - Check API key is set correctly
   - Verify internet connection
   - Falls back to demo mode automatically

2. **Slow generation**
   - Normal for complex modules (5-10 seconds)
   - Check console for specific errors

3. **Missing concepts**
   - Some modules may have limited content
   - Fallback structure ensures minimum viable map

### Debug Mode

Enable debug logging:
```javascript
// In browser console
localStorage.setItem('mindmap_debug', 'true');
```

This feature represents a significant advancement in educational technology, combining Jung's psychological concepts with modern AI to create personalized, intuitive learning experiences.