/**
 * Tests for ModuleGenerationOrchestrator
 */

import { ModuleGenerationOrchestrator } from '../../../services/llm/orchestrator';
import { MockLLMProvider } from '../../../services/llm/provider';

describe('ModuleGenerationOrchestrator', () => {
  let orchestrator: ModuleGenerationOrchestrator;
  let mockProvider: MockLLMProvider;

  beforeEach(() => {
    mockProvider = new MockLLMProvider();
    orchestrator = new ModuleGenerationOrchestrator(mockProvider);
  });

  describe('extractYouTubeId', () => {
    it('should extract YouTube ID from valid URL', () => {
      // Access private method via any cast for testing
      const extractYouTubeId = (orchestrator as any).extractYouTubeId.bind(orchestrator);
      
      expect(extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
      expect(extractYouTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
      expect(extractYouTubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('should return null for invalid URLs', () => {
      const extractYouTubeId = (orchestrator as any).extractYouTubeId.bind(orchestrator);
      
      expect(extractYouTubeId('https://vimeo.com/123456')).toBeNull();
      expect(extractYouTubeId('not a url')).toBeNull();
      expect(extractYouTubeId('')).toBeNull();
    });

    it('should handle undefined and null URLs without throwing', () => {
      const extractYouTubeId = (orchestrator as any).extractYouTubeId.bind(orchestrator);
      
      expect(() => extractYouTubeId(undefined)).not.toThrow();
      expect(() => extractYouTubeId(null)).not.toThrow();
      expect(extractYouTubeId(undefined)).toBeNull();
      expect(extractYouTubeId(null)).toBeNull();
    });

    it('should handle non-string values', () => {
      const extractYouTubeId = (orchestrator as any).extractYouTubeId.bind(orchestrator);
      
      expect(extractYouTubeId(123 as any)).toBeNull();
      expect(extractYouTubeId({} as any)).toBeNull();
      expect(extractYouTubeId([] as any)).toBeNull();
    });
  });
});