// Re-export the existing mind map generator from the LLM generators directory
// This maintains backward compatibility while organizing the codebase

export * from '../llm/generators/mindmap-generator';

// Additional exports for the new LLM-based generator
export * from './llmMindMapGenerator';

// Type exports for convenience
export type {
  MindMapNode,
  MindMapEdge,
  MindMap,
  HierarchicalMindMap,
  ProgressiveMindMap,
  MindMapComplexity
} from '../llm/generators/mindmap-generator';

export type {
  JungianArchetype,
  EducationalMindMap,
  EducationalNode,
  EducationalEdge,
  InteractiveMindMapFeatures,
  MindMapVisualizationData,
  LayoutAlgorithmConfig,
  ConceptMappingAnalysis
} from './llmMindMapGenerator';

// Default export for convenience
import { MindMapGenerator } from '../llm/generators/mindmap-generator';
import { LLMMindMapGenerator } from './llmMindMapGenerator';

export { MindMapGenerator, LLMMindMapGenerator };
export default MindMapGenerator;