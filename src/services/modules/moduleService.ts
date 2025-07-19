/**
 * Module Management Service
 * Handles CRUD operations for educational modules using localStorage
 */

import { EducationalModule, ModuleSearchCriteria, ModuleStatus, DifficultyLevel } from '../../schemas/module.schema';
import { validateEducationalModule } from '../../schemas/module.validator';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'jungAppEducationalModules';
const DRAFT_KEY = 'jungAppDraftModules';

export class ModuleService {
  /**
   * Get all modules from localStorage
   */
  static async getAllModules(): Promise<EducationalModule[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading modules:', error);
      return [];
    }
  }

  /**
   * Get a single module by ID
   */
  static async getModuleById(id: string): Promise<EducationalModule | null> {
    const modules = await this.getAllModules();
    return modules.find(module => module.id === id) || null;
  }

  /**
   * Create a new module
   */
  static async createModule(moduleData: Partial<EducationalModule>): Promise<EducationalModule> {
    // Generate ID if not provided
    const newModule: EducationalModule = {
      ...moduleData,
      id: moduleData.id || uuidv4(),
      metadata: {
        ...moduleData.metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1.0.0',
        status: moduleData.metadata?.status || ModuleStatus.DRAFT,
        language: moduleData.metadata?.language || 'en',
        author: moduleData.metadata?.author || {
          id: 'system',
          name: 'System Generated'
        }
      }
    } as EducationalModule;

    // Validate module
    const validation = validateEducationalModule(newModule);
    if (!validation.isValid) {
      throw new Error(`Module validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    // Save to storage
    const modules = await this.getAllModules();
    modules.push(newModule);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(modules));

    return newModule;
  }

  /**
   * Update an existing module
   */
  static async updateModule(id: string, updates: Partial<EducationalModule>): Promise<EducationalModule> {
    const modules = await this.getAllModules();
    const index = modules.findIndex(module => module.id === id);

    if (index === -1) {
      throw new Error(`Module with ID ${id} not found`);
    }

    const updatedModule: EducationalModule = {
      ...modules[index],
      ...updates,
      id, // Ensure ID doesn't change
      metadata: {
        ...modules[index].metadata,
        ...updates.metadata,
        updatedAt: new Date().toISOString()
      }
    };

    // Validate updated module
    const validation = validateEducationalModule(updatedModule);
    if (!validation.isValid) {
      throw new Error(`Module validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    modules[index] = updatedModule;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(modules));

    return updatedModule;
  }

  /**
   * Delete a module
   */
  static async deleteModule(id: string): Promise<boolean> {
    const modules = await this.getAllModules();
    const filteredModules = modules.filter(module => module.id !== id);

    if (modules.length === filteredModules.length) {
      return false; // Module not found
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredModules));
    return true;
  }

  /**
   * Search modules based on criteria
   */
  static async searchModules(criteria: ModuleSearchCriteria): Promise<EducationalModule[]> {
    const modules = await this.getAllModules();

    return modules.filter(module => {
      // Text search in title and description
      if (criteria.query) {
        const query = criteria.query.toLowerCase();
        const matchesQuery = 
          module.title.toLowerCase().includes(query) ||
          module.description.toLowerCase().includes(query) ||
          module.tags.some(tag => tag.toLowerCase().includes(query));
        
        if (!matchesQuery) return false;
      }

      // Filter by tags
      if (criteria.tags && criteria.tags.length > 0) {
        const hasMatchingTag = criteria.tags.some(tag => 
          module.tags.includes(tag)
        );
        if (!hasMatchingTag) return false;
      }

      // Filter by difficulty
      if (criteria.difficultyLevel && module.difficultyLevel !== criteria.difficultyLevel) {
        return false;
      }

      // Filter by duration
      const totalMinutes = module.timeEstimate.hours * 60 + module.timeEstimate.minutes;
      if (criteria.minDuration && totalMinutes < criteria.minDuration) {
        return false;
      }
      if (criteria.maxDuration && totalMinutes > criteria.maxDuration) {
        return false;
      }

      // Filter by author
      if (criteria.author && module.metadata.author.name !== criteria.author) {
        return false;
      }

      // Filter by status
      if (criteria.status && module.metadata.status !== criteria.status) {
        return false;
      }

      // Filter by language
      if (criteria.language && module.metadata.language !== criteria.language) {
        return false;
      }

      return true;
    });
  }

  /**
   * Save draft module (auto-save functionality)
   */
  static async saveDraft(moduleData: Partial<EducationalModule>): Promise<void> {
    const drafts = await this.getDrafts();
    const existingIndex = drafts.findIndex(draft => draft.id === moduleData.id);

    const draftModule = {
      ...moduleData,
      metadata: {
        createdAt: new Date().toISOString(),
        version: '1.0.0',
        author: { id: 'user', name: 'User', email: 'user@example.com', role: 'Creator' },
        language: 'en',
        ...moduleData.metadata,
        status: ModuleStatus.DRAFT,
        updatedAt: new Date().toISOString()
      }
    };

    if (existingIndex >= 0) {
      drafts[existingIndex] = draftModule;
    } else {
      drafts.push(draftModule);
    }

    localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts));
  }

  /**
   * Get all draft modules
   */
  static async getDrafts(): Promise<Partial<EducationalModule>[]> {
    try {
      const data = localStorage.getItem(DRAFT_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading drafts:', error);
      return [];
    }
  }

  /**
   * Delete a draft
   */
  static async deleteDraft(id: string): Promise<boolean> {
    const drafts = await this.getDrafts();
    const filteredDrafts = drafts.filter(draft => draft.id !== id);

    if (drafts.length === filteredDrafts.length) {
      return false;
    }

    localStorage.setItem(DRAFT_KEY, JSON.stringify(filteredDrafts));
    return true;
  }

  /**
   * Export modules to JSON
   */
  static async exportModules(moduleIds?: string[]): Promise<string> {
    const modules = await this.getAllModules();
    const modulesToExport = moduleIds 
      ? modules.filter(m => moduleIds.includes(m.id))
      : modules;

    return JSON.stringify({
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      modules: modulesToExport
    }, null, 2);
  }

  /**
   * Import modules from JSON
   */
  static async importModules(jsonData: string, overwrite: boolean = false): Promise<number> {
    try {
      const data = JSON.parse(jsonData);
      const importedModules: EducationalModule[] = data.modules || [];

      if (!Array.isArray(importedModules)) {
        throw new Error('Invalid import format: modules must be an array');
      }

      // Validate all modules before importing
      for (const module of importedModules) {
        const validation = validateEducationalModule(module);
        if (!validation.isValid) {
          throw new Error(`Module ${module.id} validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
        }
      }

      if (overwrite) {
        // Replace all modules
        localStorage.setItem(STORAGE_KEY, JSON.stringify(importedModules));
        return importedModules.length;
      } else {
        // Merge with existing modules
        const existingModules = await this.getAllModules();
        const existingIds = new Set(existingModules.map(m => m.id));
        
        // Add only new modules
        const newModules = importedModules.filter(m => !existingIds.has(m.id));
        const mergedModules = [...existingModules, ...newModules];
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedModules));
        return newModules.length;
      }
    } catch (error) {
      throw new Error(`Import failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get module statistics
   */
  static async getStatistics(): Promise<{
    total: number;
    byStatus: Record<ModuleStatus, number>;
    byDifficulty: Record<DifficultyLevel, number>;
    byLanguage: Record<string, number>;
    avgDuration: number;
  }> {
    const modules = await this.getAllModules();

    const stats = {
      total: modules.length,
      byStatus: {
        [ModuleStatus.DRAFT]: 0,
        [ModuleStatus.REVIEW]: 0,
        [ModuleStatus.PUBLISHED]: 0,
        [ModuleStatus.ARCHIVED]: 0
      },
      byDifficulty: {
        [DifficultyLevel.BEGINNER]: 0,
        [DifficultyLevel.INTERMEDIATE]: 0,
        [DifficultyLevel.ADVANCED]: 0
      },
      byLanguage: {} as Record<string, number>,
      avgDuration: 0
    };

    let totalDuration = 0;

    modules.forEach(module => {
      // Count by status
      stats.byStatus[module.metadata.status]++;

      // Count by difficulty
      stats.byDifficulty[module.difficultyLevel]++;

      // Count by language
      const lang = module.metadata.language;
      stats.byLanguage[lang] = (stats.byLanguage[lang] || 0) + 1;

      // Sum duration
      totalDuration += module.timeEstimate.hours * 60 + module.timeEstimate.minutes;
    });

    stats.avgDuration = modules.length > 0 ? totalDuration / modules.length : 0;

    return stats;
  }

  /**
   * Clear all modules (use with caution!)
   */
  static async clearAllModules(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(DRAFT_KEY);
  }
}