/**
 * Test Suite for VideoEnricher Service
 * Tests video enrichment and metadata generation functionality
 */

import { VideoEnricher, VideoMetadata, EnrichmentOptions } from '../videoEnricher';
import { YouTubeVideo } from '../youtubeService';
import { VideoPlatform } from '../../../schemas/module.schema';
import { ILLMProvider } from '../../llm/types';

// Mock LLM Provider
class MockLLMProvider implements ILLMProvider {
  model = 'mock-model';
  
  async generateResponse(prompt: string): Promise<string> {
    if (prompt.includes('error')) {
      throw new Error('LLM generation failed');
    }
    return JSON.stringify({
      educationalValue: 0.85,
      relevanceScore: 0.90,
      difficulty: 'intermediate',
      keyTimestamps: [
        { time: 0, topic: 'Introduction', description: 'Course overview' },
        { time: 120, topic: 'Main Content', description: 'Core concepts' }
      ],
      suggestedPrerequisites: ['Basic psychology'],
      learningOutcomes: ['Understand Jung\'s concepts'],
      relatedConcepts: ['Shadow', 'Anima', 'Individuation'],
      contentWarnings: []
    });
  }

  async generateEducationalContent(params: any): Promise<any> {
    return this.generateResponse(JSON.stringify(params));
  }

  async generateStructuredResponse(prompt: string, schema: any, options?: any): Promise<any> {
    try {
      const response = await this.generateResponse(prompt);
      return JSON.parse(response);
    } catch (error) {
      // Return default values if JSON parsing fails
      return {
        educationalValue: 0.7,
        relevanceScore: 0.7,
        difficulty: 'intermediate',
        keyTimestamps: [],
        suggestedPrerequisites: [],
        learningOutcomes: [],
        relatedConcepts: [],
        contentWarnings: []
      };
    }
  }
  
  async generateStructuredOutput(prompt: string, schema: any, options?: any): Promise<any> {
    // Special handling for keyTimestamps generation
    if (prompt.includes('Generate likely timestamps')) {
      return [
        { time: 0, topic: 'Introduction', description: 'Course overview' },
        { time: 120, topic: 'Main Content', description: 'Core concepts' }
      ];
    }
    
    try {
      const response = await this.generateResponse(prompt);
      return JSON.parse(response);
    } catch (error) {
      // Return default values if JSON parsing fails
      return {
        educationalValue: 0.7,
        relevanceScore: 0.7,
        difficulty: 'intermediate',
        keyTimestamps: [],
        suggestedPrerequisites: [],
        learningOutcomes: [],
        relatedConcepts: [],
        contentWarnings: []
      };
    }
  }

  async generateCompletion(prompt: string, options?: any): Promise<string> {
    return this.generateResponse(prompt);
  }

  validateApiKey(): boolean {
    return true;
  }

  getName(): string {
    return 'mock-provider';
  }
}

describe('VideoEnricher', () => {
  let enricher: VideoEnricher;
  let enricherWithLLM: VideoEnricher;
  let mockVideo: YouTubeVideo;
  let mockLLMProvider: MockLLMProvider;

  beforeEach(() => {
    enricher = new VideoEnricher();
    mockLLMProvider = new MockLLMProvider();
    enricherWithLLM = new VideoEnricher(mockLLMProvider);

    mockVideo = {
      videoId: 'test-video-123',
      title: 'Jung\'s Shadow Concept Explained',
      description: 'An in-depth exploration of Carl Jung\'s concept of the Shadow',
      channelId: 'channel-123',
      channelTitle: 'Psychology Insights',
      duration: 'PT15M30S',
      publishedAt: '2023-01-15T10:00:00Z',
      thumbnails: {
        default: { url: 'http://example.com/thumb.jpg', width: 120, height: 90 },
        medium: { url: 'http://example.com/thumb-m.jpg', width: 320, height: 180 },
        high: { url: 'http://example.com/thumb-h.jpg', width: 480, height: 360 }
      },
      viewCount: '10000',
      likeCount: '500',
      commentCount: '50'
    };
  });

  describe('enrichVideo', () => {
    it('should enrich a video with basic metadata', async () => {
      const result = await enricher.enrichVideo(mockVideo);

      expect(result).toMatchObject({
        id: 'video-test-video-123',
        title: expect.stringContaining('Jung\'s Shadow Concept'),
        url: 'https://youtube.com/watch?v=test-video-123',
        platform: VideoPlatform.YOUTUBE,
        metadata: {
          educationalValue: expect.any(Number),
          relevanceScore: expect.any(Number),
          difficulty: expect.stringMatching(/beginner|intermediate|advanced/),
          relatedConcepts: expect.arrayContaining(['shadow'])
        }
      });
    });

    it('should use LLM for advanced analysis when available', async () => {
      const options: EnrichmentOptions = {
        analyzeTranscript: true,
        courseContext: {
          topic: 'Jungian Psychology',
          concepts: ['Shadow', 'Collective Unconscious']
        }
      };

      const result = await enricherWithLLM.enrichVideo(mockVideo, options);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.educationalValue).toBeGreaterThan(0);
      expect(result.metadata.relevanceScore).toBeGreaterThan(0);
      expect(result.metadata.difficulty).toMatch(/beginner|intermediate|advanced/);
      expect(result.metadata.learningOutcomes).toBeDefined();
      expect(Array.isArray(result.metadata.learningOutcomes)).toBe(true);
      expect(result.metadata.relatedConcepts).toBeDefined();
      expect(Array.isArray(result.metadata.relatedConcepts)).toBe(true);
      
      // LLM should have provided these when available
      if (result.metadata.keyTimestamps) {
        expect(Array.isArray(result.metadata.keyTimestamps)).toBe(true);
      }
      if (result.metadata.suggestedPrerequisites) {
        expect(Array.isArray(result.metadata.suggestedPrerequisites)).toBe(true);
      }
    });

    it('should handle videos with different duration formats', async () => {
      const testCases = [
        { duration: 'PT5M', expected: 5 },
        { duration: 'PT1H30M', expected: 90 },
        { duration: 'PT2H15M45S', expected: 135 },
        { duration: 'PT30S', expected: 0.5 }
      ];

      for (const testCase of testCases) {
        const video = { ...mockVideo, duration: testCase.duration };
        const result = await enricher.enrichVideo(video);
        
        // Check that duration was properly converted to an object
        expect(result.duration).toBeDefined();
        expect(typeof result.duration).toBe('object');
      }
    });

    it('should enhance title based on metadata', async () => {
      const result = await enricher.enrichVideo(mockVideo);
      
      // Title should be enhanced but still contain original content
      expect(result.title).toContain('Shadow');
      expect(result.title.length).toBeGreaterThanOrEqual(mockVideo.title.length);
    });

    it('should generate enhanced description', async () => {
      const options: EnrichmentOptions = {
        targetAudience: 'psychology students',
        extractLearningOutcomes: true
      };

      const result = await enricher.enrichVideo(mockVideo, options);
      
      expect(result.description).toBeDefined();
      expect(result.description.length).toBeGreaterThan(mockVideo.description.length);
    });

    it('should handle missing video data gracefully', async () => {
      const incompleteVideo: YouTubeVideo = {
        videoId: 'test-123',
        title: 'Test Video',
        description: '',
        channelId: 'ch-123',
        channelTitle: 'Test Channel',
        duration: 'PT10M',
        publishedAt: '2023-01-01T00:00:00Z',
        thumbnails: {
          default: { url: '', width: 0, height: 0 },
          medium: { url: '', width: 0, height: 0 },
          high: { url: '', width: 0, height: 0 }
        },
        viewCount: '0',
        likeCount: '0',
        commentCount: '0'
      };

      const result = await enricher.enrichVideo(incompleteVideo);
      
      expect(result).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata.educationalValue).toBeGreaterThanOrEqual(0);
      expect(result.metadata.educationalValue).toBeLessThanOrEqual(1);
    });
  });

  describe('enrichMultipleVideos', () => {
    it('should enrich multiple videos in parallel', async () => {
      const videos = [
        mockVideo,
        { ...mockVideo, videoId: 'test-456', title: 'Anima and Animus' },
        { ...mockVideo, videoId: 'test-789', title: 'Individuation Process' }
      ];

      const results = await enricher.enrichMultipleVideos(videos);

      expect(results).toHaveLength(3);
      expect(results.every(r => r.metadata)).toBe(true);
      expect(new Set(results.map(r => r.id)).size).toBe(3); // All unique IDs
    });

    it('should sort videos by combined score', async () => {
      const videos = [
        { ...mockVideo, videoId: 'low-ed', title: 'Off-topic video' },
        { ...mockVideo, videoId: 'high-ed', title: 'Jung Core Concepts Tutorial' },
        { ...mockVideo, videoId: 'med-ed', title: 'Psychology Overview' }
      ];

      const results = await enricher.enrichMultipleVideos(videos);

      // Verify videos are sorted by score (highest first)
      for (let i = 1; i < results.length; i++) {
        const prevScore = results[i-1].metadata.relevanceScore * 0.6 + 
                         results[i-1].metadata.educationalValue * 0.4;
        const currScore = results[i].metadata.relevanceScore * 0.6 + 
                         results[i].metadata.educationalValue * 0.4;
        expect(prevScore).toBeGreaterThanOrEqual(currScore);
      }
    });

    it('should handle empty video array', async () => {
      const results = await enricher.enrichMultipleVideos([]);
      expect(results).toEqual([]);
    });

    it('should handle enrichment failures gracefully', async () => {
      const videos = [
        mockVideo,
        { ...mockVideo, videoId: 'error-video', title: 'This will error' }
      ];

      // This should not throw, but handle errors internally
      const results = await enricher.enrichMultipleVideos(videos);
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('metadata analysis', () => {
    it('should assess educational value based on video metrics', async () => {
      const highValueVideo = {
        ...mockVideo,
        viewCount: '1000000',
        likeCount: '50000',
        commentCount: '5000'
      };

      const lowValueVideo = {
        ...mockVideo,
        viewCount: '100',
        likeCount: '2',
        commentCount: '0'
      };

      const highResult = await enricher.enrichVideo(highValueVideo);
      const lowResult = await enricher.enrichVideo(lowValueVideo);

      expect(highResult.metadata.educationalValue).toBeGreaterThan(
        lowResult.metadata.educationalValue
      );
    });

    it('should determine difficulty based on title and description', async () => {
      const beginnerVideo = {
        ...mockVideo,
        title: 'Jung for Beginners: Introduction to Basic Concepts',
        description: 'A simple introduction to Jungian psychology for beginners'
      };

      const advancedVideo = {
        ...mockVideo,
        title: 'Advanced Jungian Analysis: Complex Integration',
        description: 'Deep dive into complex Jungian theories for advanced students'
      };

      const beginnerResult = await enricher.enrichVideo(beginnerVideo);
      const advancedResult = await enricher.enrichVideo(advancedVideo);

      expect(beginnerResult.metadata.difficulty).toBe('beginner');
      expect(advancedResult.metadata.difficulty).toBe('advanced');
    });

    it('should extract related concepts from content', async () => {
      const conceptVideo = {
        ...mockVideo,
        title: 'Shadow, Anima, and the Collective Unconscious',
        description: 'Exploring the shadow, anima/animus, and collective unconscious'
      };

      const result = await enricher.enrichVideo(conceptVideo);

      expect(result.metadata.relatedConcepts).toContain('shadow');
      expect(result.metadata.relatedConcepts).toContain('anima');
      expect(result.metadata.relatedConcepts).toContain('collective unconscious');
    });

    it('should calculate relevance score based on context', async () => {
      const options: EnrichmentOptions = {
        courseContext: {
          topic: 'Shadow Work',
          concepts: ['shadow', 'projection', 'integration']
        }
      };

      const relevantVideo = {
        ...mockVideo,
        title: 'Shadow Work: Integration Techniques',
        description: 'Learn how to integrate your shadow through projection work'
      };

      const irrelevantVideo = {
        ...mockVideo,
        title: 'Cooking with Shadows: Photography Tips',
        description: 'How to use shadows in food photography'
      };

      const relevantResult = await enricher.enrichVideo(relevantVideo, options);
      const irrelevantResult = await enricher.enrichVideo(irrelevantVideo, options);

      expect(relevantResult.metadata.relevanceScore).toBeGreaterThan(
        irrelevantResult.metadata.relevanceScore
      );
    });
  });

  describe('LLM integration', () => {
    it('should handle LLM failures gracefully', async () => {
      const errorProvider = new MockLLMProvider();
      errorProvider.generateResponse = jest.fn().mockRejectedValue(new Error('LLM error'));
      
      const errorEnricher = new VideoEnricher(errorProvider);
      const options: EnrichmentOptions = {
        courseContext: { topic: 'Jung', concepts: ['shadow'] }
      };

      // Should fall back to basic analysis
      const result = await errorEnricher.enrichVideo(mockVideo, options);
      expect(result).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

    it('should parse LLM response correctly', async () => {
      const options: EnrichmentOptions = {
        analyzeTranscript: true,
        generateTimestamps: true,
        assessDifficulty: true,
        extractLearningOutcomes: true,
        courseContext: {
          topic: 'Jungian Psychology',
          concepts: ['individuation', 'archetypes']
        }
      };

      const result = await enricherWithLLM.enrichVideo(mockVideo, options);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.educationalValue).toBe(0.85);
      expect(result.metadata.relevanceScore).toBe(0.90);
      expect(result.metadata.difficulty).toBe('intermediate');
      expect(result.metadata.keyTimestamps).toBeDefined();
      expect(Array.isArray(result.metadata.keyTimestamps)).toBe(true);
      expect(result.metadata.keyTimestamps.length).toBe(2);
      expect(result.metadata.suggestedPrerequisites).toEqual(['Basic psychology']);
      expect(result.metadata.learningOutcomes).toEqual(['Understand Jung\'s concepts']);
      expect(result.metadata.relatedConcepts).toEqual(['Shadow', 'Anima', 'Individuation']);
    });

    it('should handle malformed LLM responses', async () => {
      const badProvider = new MockLLMProvider();
      badProvider.generateResponse = jest.fn().mockResolvedValue('invalid json');
      
      const badEnricher = new VideoEnricher(badProvider);
      const options: EnrichmentOptions = {
        courseContext: { topic: 'Jung', concepts: ['shadow'] }
      };

      const result = await badEnricher.enrichVideo(mockVideo, options);
      expect(result).toBeDefined();
      expect(result.metadata).toBeDefined();
      // Should have fallback values
      expect(result.metadata.educationalValue).toBeGreaterThanOrEqual(0);
      expect(result.metadata.relevanceScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe('edge cases', () => {
    it('should handle very long video titles', async () => {
      const longTitleVideo = {
        ...mockVideo,
        title: 'A'.repeat(500)
      };

      const result = await enricher.enrichVideo(longTitleVideo);
      expect(result.title.length).toBeLessThanOrEqual(300); // Should truncate
    });

    it('should handle special characters in content', async () => {
      const specialVideo = {
        ...mockVideo,
        title: 'Jung\'s "Shadow" & <Anima> Concepts: 100% Explained! 🧠',
        description: 'Special chars: < > & " \' % $ # @ ! ~ ` | \\ / ? ; :'
      };

      const result = await enricher.enrichVideo(specialVideo);
      expect(result).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

    it('should handle videos in different languages', async () => {
      const foreignVideo = {
        ...mockVideo,
        title: 'La Sombra de Jung: Conceptos Básicos',
        description: 'Uma introdução aos conceitos junguianos em português'
      };

      const result = await enricher.enrichVideo(foreignVideo);
      expect(result).toBeDefined();
      expect(result.metadata.relatedConcepts.length).toBeGreaterThan(0);
    });

    it('should handle null/undefined options gracefully', async () => {
      const result1 = await enricher.enrichVideo(mockVideo, undefined);
      const result2 = await enricher.enrichVideo(mockVideo, null as any);
      const result3 = await enricher.enrichVideo(mockVideo, {});

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(result3).toBeDefined();
    });
  });
});