/**
 * Mock ModuleService for integration tests
 */

import { DifficultyLevel, ModuleStatus, PublicationType } from '../../../schemas/module.schema';

// Mock module store
let mockModuleStore: any = {};

const createMockModule = (moduleData: any, id: string) => ({
  id,
  title: moduleData.title || 'Mock Module',
  description: moduleData.description || 'Mock description',
  content: {
    introduction: moduleData.content?.introduction || 'Mock introduction',
    sections: moduleData.content?.sections || []
  },
  videos: moduleData.videos || [],
  quiz: moduleData.quiz || {
    id: `quiz-${id}`,
    title: 'Mock Quiz',
    description: 'Mock quiz description',
    questions: [],
    passingScore: 70
  },
  bibliography: moduleData.bibliography || [],
  filmReferences: moduleData.filmReferences || [],
  tags: moduleData.tags || ['mock'],
  difficultyLevel: moduleData.difficultyLevel || DifficultyLevel.BEGINNER,
  timeEstimate: moduleData.timeEstimate || { hours: 1, minutes: 0 },
  metadata: {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: moduleData.metadata?.version || '1.0.0',
    author: moduleData.metadata?.author || {
      id: 'mock-author',
      name: 'Mock Author',
      email: 'mock@example.com',
      role: 'Instructor'
    },
    status: moduleData.metadata?.status || ModuleStatus.DRAFT,
    language: moduleData.metadata?.language || 'en',
    ...moduleData.metadata
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...moduleData
});

export class ModuleService {
  // Static methods for the service
  static async createModule(moduleData: any): Promise<any> {
    console.log('Mock ModuleService.createModule called with:', moduleData);
    const id = `module-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const module = createMockModule(moduleData, id);
    mockModuleStore[id] = module;
    
    // Simulate localStorage persistence
    const modules = JSON.parse(localStorage.getItem('jungApp_modules') || '[]');
    modules.push(module);
    localStorage.setItem('jungApp_modules', JSON.stringify(modules));
    
    console.log('Mock ModuleService.createModule returning:', module);
    return module;
  }

  static async getModuleById(id: string): Promise<any> {
    console.log('Mock ModuleService.getModuleById called with:', id);
    if (mockModuleStore[id]) {
      console.log('Mock ModuleService.getModuleById returning existing:', mockModuleStore[id]);
      return mockModuleStore[id];
    }
    
    // Create a mock module if not found
    const module = createMockModule({
      title: 'Mock Module',
      description: 'Mock description for retrieved module'
    }, id);
    
    mockModuleStore[id] = module;
    console.log('Mock ModuleService.getModuleById returning new:', module);
    return module;
  }

  static async updateModule(id: string, updates: any): Promise<any> {
    console.log('Mock ModuleService.updateModule called with:', id, updates);
    const existingModule = mockModuleStore[id];
    if (!existingModule) {
      throw new Error(`Module with id ${id} not found`);
    }
    
    const updatedModule = {
      ...existingModule,
      ...updates,
      id: existingModule.id, // Preserve original ID
      createdAt: existingModule.createdAt, // Preserve creation date
      updatedAt: new Date().toISOString(), // Update modification date
      metadata: {
        ...existingModule.metadata,
        ...updates.metadata,
        updatedAt: new Date().toISOString()
      }
    };
    
    mockModuleStore[id] = updatedModule;
    
    // Update localStorage
    const modules = JSON.parse(localStorage.getItem('jungApp_modules') || '[]');
    const index = modules.findIndex((m: any) => m.id === id);
    if (index !== -1) {
      modules[index] = updatedModule;
      localStorage.setItem('jungApp_modules', JSON.stringify(modules));
    }
    
    console.log('Mock ModuleService.updateModule returning:', updatedModule);
    return updatedModule;
  }

  static async getAllModules(): Promise<any[]> {
    console.log('Mock ModuleService.getAllModules called');
    let modules = Object.values(mockModuleStore);
    
    if (modules.length === 0) {
      // Create default modules if store is empty
      const defaultModule = createMockModule({
        title: 'Default Module',
        description: 'Default module for getAllModules',
        metadata: { status: ModuleStatus.PUBLISHED }
      }, 'default-1');
      
      mockModuleStore['default-1'] = defaultModule;
      modules = [defaultModule];
    }
    
    console.log('Mock ModuleService.getAllModules returning:', modules);
    return modules;
  }

  static async searchModules(searchParams: any = {}): Promise<any[]> {
    console.log('Mock ModuleService.searchModules called with:', searchParams);
    const allModules = Object.values(mockModuleStore);
    const query = searchParams.query || '';
    
    // Simple search implementation
    let results = allModules.filter((module: any) => 
      !query || module.title.toLowerCase().includes(query.toLowerCase())
    );
    
    if (results.length === 0) {
      // Return a default search result
      const defaultResult = createMockModule({
        title: query ? `Jung Module for "${query}"` : 'Jung Module',
        description: 'Default search result',
        metadata: { status: ModuleStatus.PUBLISHED }
      }, 'search-result-1');
      
      results = [defaultResult];
    }
    
    console.log('Mock ModuleService.searchModules returning:', results);
    return results;
  }

  static async getStatistics(): Promise<any> {
    console.log('Mock ModuleService.getStatistics called');
    return {
      total: Object.keys(mockModuleStore).length || 1,
      byStatus: { [ModuleStatus.PUBLISHED]: 1 },
      byDifficulty: { [DifficultyLevel.BEGINNER]: 1 },
      avgDuration: 90
    };
  }

  static async saveDraft(draftData: any): Promise<any> {
    console.log('Mock ModuleService.saveDraft called with:', draftData);
    const id = draftData.id || `draft-${Date.now()}`;
    const draft = createMockModule({
      ...draftData,
      metadata: {
        ...draftData.metadata,
        status: ModuleStatus.DRAFT
      }
    }, id);
    
    mockModuleStore[id] = draft;
    return draft;
  }

  static async getDrafts(): Promise<any[]> {
    console.log('Mock ModuleService.getDrafts called');
    return Object.values(mockModuleStore).filter((module: any) => 
      module.metadata?.status === ModuleStatus.DRAFT
    );
  }

  static async exportModules(ids: string[]): Promise<string> {
    console.log('Mock ModuleService.exportModules called with:', ids);
    const modules = ids.map((id: string) => mockModuleStore[id] || createMockModule({ title: 'Exported' }, id));
    const result = JSON.stringify({ 
      modules,
      version: '1.0.0',
      exportDate: new Date().toISOString()
    });
    console.log('Mock ModuleService.exportModules returning:', result);
    return result;
  }

  static async importModules(data: string): Promise<number> {
    console.log('Mock ModuleService.importModules called with data length:', data.length);
    const parsed = JSON.parse(data);
    let count = 0;
    for (const module of parsed.modules) {
      mockModuleStore[module.id] = module;
      count++;
    }
    return count;
  }

  static async clearAllModules(): Promise<void> {
    console.log('Mock ModuleService.clearAllModules called');
    mockModuleStore = {};
    localStorage.removeItem('jungApp_modules');
  }
}