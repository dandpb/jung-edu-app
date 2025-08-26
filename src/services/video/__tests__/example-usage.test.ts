/**
 * Test suite for video service example usage
 * Tests video generation workflows and integration patterns
 */

import { generateVideoContent, enrichVideoMetadata, createVideoPlaylist } from '../example-usage';

describe('Video Service Example Usage', () => {
  beforeEach(() => {
    // Clear any previous console logs
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('generateVideoContent', () => {
    it('should generate video content for a topic', async () => {
      const result = await generateVideoContent('Jungian Archetypes', ['anima', 'shadow']);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('videos');
      expect(result).toHaveProperty('metadata');
      expect(Array.isArray(result.videos)).toBe(true);
      expect(result.metadata).toHaveProperty('topic', 'Jungian Archetypes');
      expect(result.metadata).toHaveProperty('concepts');
      expect(result.metadata.concepts).toEqual(['anima', 'shadow']);
    }, 10000);

    it('should handle empty concepts array', async () => {
      const result = await generateVideoContent('Test Topic', []);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('videos');
      expect(result).toHaveProperty('metadata');
      expect(result.metadata.concepts).toEqual([]);
    }, 10000);

    it('should handle invalid topics gracefully', async () => {
      await expect(generateVideoContent('', ['concept'])).rejects.toThrow();
    });
  });

  describe('enrichVideoMetadata', () => {
    it('should enrich video metadata', async () => {
      const mockVideo = {
        id: 'video-1',
        title: 'Test Video',
        url: 'https://youtube.com/watch?v=test',
        description: 'Test description'
      };

      const result = await enrichVideoMetadata([mockVideo]);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('metadata');
      }
    }, 10000);

    it('should handle empty video list', async () => {
      const result = await enrichVideoMetadata([]);
      
      expect(result).toEqual([]);
    });
  });

  describe('createVideoPlaylist', () => {
    it('should create organized video playlist', () => {
      const mockVideos = [
        { id: '1', title: 'Intro', difficulty: 'beginner', duration: 300 },
        { id: '2', title: 'Advanced', difficulty: 'advanced', duration: 600 }
      ];

      const result = createVideoPlaylist(mockVideos as any);
      
      expect(result).toHaveProperty('beginner');
      expect(result).toHaveProperty('advanced');
      expect(result.beginner).toHaveLength(1);
      expect(result.advanced).toHaveLength(1);
    });

    it('should handle videos without difficulty', () => {
      const mockVideos = [
        { id: '1', title: 'Test', duration: 300 }
      ];

      const result = createVideoPlaylist(mockVideos as any);
      
      expect(result).toHaveProperty('general');
    });
  });
});