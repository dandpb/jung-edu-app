/**
 * Module Schema Validator
 * Provides validation utilities for educational modules
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { EducationalModule, ValidationError, DifficultyLevel, ModuleStatus } from './module.schema';
import moduleSchema from './module.schema.json';

// Initialize AJV with formats
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

// Compile the schema
const validateModule = ajv.compile(moduleSchema);

/**
 * Validates an educational module against the schema
 * @param module The module to validate
 * @returns Object with isValid boolean and errors array
 */
export function validateEducationalModule(module: any): {
  isValid: boolean;
  errors: ValidationError[];
  data?: EducationalModule;
} {
  const isValid = validateModule(module);
  
  if (isValid) {
    return {
      isValid: true,
      errors: [],
      data: module as unknown as EducationalModule
    };
  }
  
  // Transform AJV errors to our ValidationError format
  const errors: ValidationError[] = (validateModule.errors || []).map(error => ({
    field: error.instancePath || error.schemaPath,
    message: error.message || 'Validation error',
    code: error.keyword
  }));
  
  return {
    isValid: false,
    errors
  };
}

/**
 * Validates a partial module (for updates)
 * @param partialModule Partial module data
 * @returns Validation result
 */
export function validatePartialModule(partialModule: Partial<EducationalModule>): {
  isValid: boolean;
  errors: ValidationError[];
} {
  // Create a copy of the schema without required fields for partial validation
  const partialSchema = { ...moduleSchema, required: [] };
  const validatePartial = ajv.compile(partialSchema);
  
  const isValid = validatePartial(partialModule);
  
  if (isValid) {
    return { isValid: true, errors: [] };
  }
  
  const errors: ValidationError[] = (validatePartial.errors || []).map(error => ({
    field: error.instancePath || error.schemaPath,
    message: error.message || 'Validation error',
    code: error.keyword
  }));
  
  return { isValid: false, errors };
}

/**
 * Sanitizes module data before saving
 * @param module Module to sanitize
 * @returns Sanitized module
 */
export function sanitizeModule(module: EducationalModule): EducationalModule {
  // Create a deep copy to avoid mutating the original
  const sanitized = JSON.parse(JSON.stringify(module));
  
  // Ensure all string fields are trimmed
  const trimStrings = (obj: any): void => {
    Object.keys(obj).forEach(key => {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key].trim();
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        trimStrings(obj[key]);
      }
    });
  };
  
  trimStrings(sanitized);
  
  // Ensure metadata timestamps are properly formatted
  if (sanitized.metadata) {
    sanitized.metadata.updatedAt = new Date().toISOString();
  }
  
  // Sort arrays for consistency
  if (sanitized.tags) {
    sanitized.tags.sort();
  }
  
  if (sanitized.content?.sections) {
    sanitized.content.sections.sort((a: any, b: any) => a.order - b.order);
  }
  
  return sanitized;
}

/**
 * Generates a module template with default values
 * @param overrides Optional overrides for default values
 * @returns Module template
 */
export function generateModuleTemplate(overrides?: Partial<EducationalModule>): EducationalModule {
  const now = new Date().toISOString();
  
  return {
    id: `module-${Date.now()}`,
    title: 'New Module',
    description: 'Module description',
    content: {
      introduction: 'This module introduces...',
      sections: [
        {
          id: 'section-1',
          title: 'Introduction',
          content: 'Section content...',
          order: 0,
          keyTerms: [],
          images: [],
          interactiveElements: [],
          estimatedTime: 10
        }
      ],
      summary: '',
      keyTakeaways: []
    },
    videos: [],
    mindMaps: [],
    quiz: {
      id: 'quiz-1',
      title: 'Module Quiz',
      description: 'Test your understanding',
      questions: [],
      passingScore: 70,
      timeLimit: 30,
      shuffleQuestions: false,
      showFeedback: true,
      allowRetries: true,
      maxRetries: 3
    },
    bibliography: [],
    filmReferences: [],
    tags: ['general'],
    difficultyLevel: DifficultyLevel.BEGINNER,
    timeEstimate: {
      hours: 1,
      minutes: 0,
      description: 'Approximately 1 hour'
    },
    metadata: {
      createdAt: now,
      updatedAt: now,
      version: '1.0.0',
      author: {
        id: 'author-1',
        name: 'Default Author',
        email: 'author@example.com',
        role: 'Educator'
      },
      status: ModuleStatus.DRAFT,
      language: 'en',
      analytics: {
        views: 0,
        completions: 0,
        averageTime: 0,
        averageScore: 0,
        feedback: []
      }
    },
    prerequisites: [],
    learningObjectives: [],
    icon: 'book',
    ...overrides
  };
}

/**
 * Calculates total module duration including videos and estimated reading time
 * @param module The module to calculate duration for
 * @returns Total duration in minutes
 */
export function calculateTotalDuration(module: EducationalModule): number {
  let totalMinutes = 0;
  
  // Add base time estimate
  totalMinutes += module.timeEstimate.hours * 60 + module.timeEstimate.minutes;
  
  // Add video durations
  module.videos.forEach(video => {
    totalMinutes += video.duration.hours * 60 + video.duration.minutes + video.duration.seconds / 60;
  });
  
  // Add section estimated times
  module.content.sections.forEach(section => {
    if (section.estimatedTime) {
      totalMinutes += section.estimatedTime;
    }
  });
  
  // Add quiz time limit if applicable
  if (module.quiz.timeLimit) {
    totalMinutes += module.quiz.timeLimit;
  }
  
  return Math.round(totalMinutes);
}

/**
 * Validates module dependencies
 * @param module The module to check
 * @param availableModules Array of available module IDs
 * @returns Validation result
 */
export function validateDependencies(
  module: EducationalModule,
  availableModules: string[]
): {
  isValid: boolean;
  missingDependencies: string[];
} {
  const missingDependencies = (module.prerequisites || [])
    .filter(prereq => !availableModules.includes(prereq));
  
  return {
    isValid: missingDependencies.length === 0,
    missingDependencies
  };
}

// Export the schema for reference
export { moduleSchema };