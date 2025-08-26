/**
 * Module Services Export
 * Central export for all module-related services
 */

export { ModuleService } from './moduleService';
export { 
  ModuleGenerator
} from './moduleGenerator';

export type { 
  GenerationProgress,
  GenerationStage,
  GenerationOptions,
  GenerationOptions as ModuleGenerationOptions
} from './moduleGenerator';

// Re-export commonly used types from schema
export {
  type EducationalModule,
  type ModuleContent,
  type Section,
  type Video,
  type Quiz,
  type Question,
  type Bibliography,
  type FilmReference,
  type ModuleMetadata,
  type ModuleSearchCriteria,
  DifficultyLevel,
  ModuleStatus,
  PublicationType,
  VideoPlatform
} from '../../schemas/module.schema';

// Export validation utilities
export { validateEducationalModule } from '../../schemas/module.validator';

// Export example data
export { exampleModule } from '../../schemas/module.example';