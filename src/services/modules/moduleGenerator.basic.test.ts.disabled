/**
 * Basic ModuleGenerator Tests
 * Focused on core functionality and infrastructure validation
 */

import { ModuleGenerator, GenerationOptions } from './moduleGenerator';
import { MockLLMProvider } from '../llm/providers/mock';
import { DifficultyLevel, ModuleStatus } from '../../schemas/module.schema';

// Mock the ModuleService to avoid database operations
jest.mock('./moduleService', () => ({
  ModuleService: {
    saveDraft: jest.fn().mockResolvedValue(undefined),
    getDrafts: jest.fn().mockResolvedValue([]),
    deleteDraft: jest.fn().mockResolvedValue(undefined),
    createModule: jest.fn().mockImplementation((module) => Promise.resolve(module))
  }
}));

describe('ModuleGenerator Basic Tests', () => {
  let generator: ModuleGenerator;
  let mockLLMProvider: jest.Mocked<MockLLMProvider>;

  beforeEach(() => {
    mockLLMProvider = new MockLLMProvider(0) as jest.Mocked<MockLLMProvider>;
    generator = new ModuleGenerator(mockLLMProvider);
  });

  it('should create instance with provider', () => {
    expect(generator).toBeDefined();
    expect(generator).toBeInstanceOf(ModuleGenerator);
  });

  it('should create instance with default MockLLMProvider', () => {
    const defaultGenerator = new ModuleGenerator();
    expect(defaultGenerator).toBeDefined();
  });

  it('should generate basic module with required fields', async () => {
    const options: GenerationOptions = {
      topic: 'Shadow Psychology',
      difficulty: DifficultyLevel.INTERMEDIATE,
      duration: 60,
      language: 'en',
      includeVideos: false,
      includeQuiz: false,
      includeBibliography: false
    };

    const result = await generator.generateModule(options);
    
    // Test basic structure
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.title).toBeDefined();
    expect(result.description).toBeDefined();
    expect(result.difficultyLevel).toBe(DifficultyLevel.INTERMEDIATE);
    expect(result.tags).toBeDefined();
    expect(Array.isArray(result.tags)).toBe(true);
    
    // Test time estimation
    expect(result.timeEstimate).toBeDefined();
    expect(result.timeEstimate.hours).toBe(1);
    expect(result.timeEstimate.minutes).toBe(0);
    
    // Test metadata
    expect(result.metadata).toBeDefined();
    expect(result.metadata.language).toBe('en');
    expect(result.metadata.status).toBe(ModuleStatus.PUBLISHED);
    expect(result.metadata.createdAt).toBeDefined();
    expect(result.metadata.updatedAt).toBeDefined();
  });

  it('should handle different difficulty levels', async () => {
    const beginnerOptions: GenerationOptions = {
      topic: 'Introduction to Jung',
      difficulty: DifficultyLevel.BEGINNER,
      duration: 30
    };

    const result = await generator.generateModule(beginnerOptions);
    expect(result.difficultyLevel).toBe(DifficultyLevel.BEGINNER);
  });

  it('should handle time estimation correctly', async () => {
    const longOptions: GenerationOptions = {
      topic: 'Advanced Jungian Concepts',
      difficulty: DifficultyLevel.ADVANCED,
      duration: 120
    };

    const result = await generator.generateModule(longOptions);
    expect(result.timeEstimate.hours).toBe(2);
    expect(result.timeEstimate.minutes).toBe(0);
  });

  it('should handle progress callbacks safely', async () => {
    const progressCallback = jest.fn();
    const options: GenerationOptions = {
      topic: 'Anima and Animus',
      difficulty: DifficultyLevel.INTERMEDIATE,
      duration: 60,
      onProgress: progressCallback
    };

    await generator.generateModule(options);
    
    // Progress should be called multiple times during generation
    expect(progressCallback).toHaveBeenCalled();
    expect(progressCallback.mock.calls.length).toBeGreaterThan(0);
  });

  it('should handle error in progress callback gracefully', async () => {
    const errorCallback = jest.fn().mockImplementation(() => {
      throw new Error('Callback Error');
    });
    
    const options: GenerationOptions = {
      topic: 'Collective Unconscious',
      difficulty: DifficultyLevel.INTERMEDIATE,
      duration: 60,
      onProgress: errorCallback
    };

    // Should not throw error even if callback fails
    const result = await generator.generateModule(options);
    expect(result).toBeDefined();
  });

  it('should generate appropriate content structure', async () => {
    const options: GenerationOptions = {
      topic: 'Individuation Process',
      difficulty: DifficultyLevel.ADVANCED,
      duration: 90,
      includeVideos: true,
      includeQuiz: true,
      includeBibliography: true
    };

    const result = await generator.generateModule(options);
    
    expect(result.content).toBeDefined();
    expect(result.quiz).toBeDefined();
    expect(result.videos).toBeDefined();
    expect(result.bibliography).toBeDefined();
  });
});