/**
 * Module Validator for schema validation
 */

import { EducationalModule } from './module.schema';

export class ModuleValidator {
  static validate(module: EducationalModule): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!module.id) errors.push('Module ID is required');
    if (!module.title || module.title.trim() === '') errors.push('Module title is required');
    if (!module.content) errors.push('Module content is required');
    if (!module.timeEstimate) errors.push('Time estimate is required');
    if (!module.difficultyLevel) errors.push('Difficulty level is required');
    
    // Additional validations
    if (module.timeEstimate && (module.timeEstimate.hours < 0 || module.timeEstimate.minutes < 0)) {
      errors.push('Time estimate must be non-negative');
    }
    
    if (module.content) {
      const hasIntroduction = module.content.introduction && module.content.introduction.trim() !== '';
      const hasSections = module.content.sections && module.content.sections.length > 0;
      
      if (!hasIntroduction && !hasSections) {
        errors.push('Module content must have introduction or sections');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export function validateEducationalModule(module: EducationalModule) {
  const result = ModuleValidator.validate(module);
  return {
    isValid: result.valid,
    errors: result.errors.map(msg => ({ message: msg }))
  };
}

export function sanitizeModule(module: EducationalModule): EducationalModule {
  return {
    ...module,
    title: module.title?.trim() || '',
    description: module.description?.trim() || '',
  };
}