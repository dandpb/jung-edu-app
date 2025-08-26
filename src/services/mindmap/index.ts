// Mind Map Services Index
// Comprehensive mind mapping functionality for Jung education

// Core generators
export { MindMapGenerator } from '../llm/generators/mindmap-generator';
export { LLMMindMapGenerator } from './llmMindMapGenerator';

// Type exports
export type {
  // Basic mind map types
  MindMapNode,
  MindMapEdge,
  MindMap,
  HierarchicalMindMap,
  ProgressiveMindMap,
  MindMapComplexity
} from '../llm/generators/mindmap-generator';

export type {
  // Educational and Jungian specific types
  JungianArchetype,
  EducationalMindMap,
  EducationalNode,
  EducationalEdge,
  InteractiveMindMapFeatures,
  MindMapVisualizationData,
  LayoutAlgorithmConfig,
  ConceptMappingAnalysis
} from './llmMindMapGenerator';

// Re-export from main generator file for convenience
export * from './mindMapGenerator';

// Service utilities and helpers
export const MindMapServiceUtils = {
  /**
   * Create a new basic mind map generator instance
   */
  createBasicGenerator: (provider: any) => new (require('../llm/generators/mindmap-generator').MindMapGenerator)(provider),
  
  /**
   * Create a new LLM-enhanced mind map generator instance
   */
  createLLMGenerator: (provider: any) => new (require('./llmMindMapGenerator').LLMMindMapGenerator)(provider),
  
  /**
   * Determine which generator to use based on requirements
   */
  selectOptimalGenerator: (requirements: {
    hasJungianContent?: boolean;
    needsEducationalFeatures?: boolean;
    requiresInteractivity?: boolean;
    complexityLevel?: 'basic' | 'intermediate' | 'advanced';
  }, provider: any) => {
    if (requirements.hasJungianContent || 
        requirements.needsEducationalFeatures || 
        requirements.requiresInteractivity ||
        requirements.complexityLevel === 'advanced') {
      return new (require('./llmMindMapGenerator').LLMMindMapGenerator)(provider);
    }
    return new (require('../llm/generators/mindmap-generator').MindMapGenerator)(provider);
  }
};

// Default exports for convenience
import { MindMapGenerator } from '../llm/generators/mindmap-generator';
import { LLMMindMapGenerator } from './llmMindMapGenerator';

export { MindMapGenerator as BasicMindMapGenerator };
export { LLMMindMapGenerator as EnhancedMindMapGenerator };
export default LLMMindMapGenerator;