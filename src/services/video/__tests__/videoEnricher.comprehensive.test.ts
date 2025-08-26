/**
 * Comprehensive tests for VideoEnricher service
 * Tests video analysis, metadata extraction, and enrichment capabilities
 */

import { VideoEnricher, VideoMetadata, EnrichmentOptions } from '../videoEnricher';
import { YouTubeVideo } from '../youtubeService';
import { ILLMProvider } from '../../llm/types';
import { VideoPlatform } from '../../../schemas/module.schema';

// Mock LLM Provider
const mockLLMProvider: jest.Mocked<ILLMProvider> = {
  generateCompletion: jest.fn(),
  validateApiKey: jest.fn(),
  getModelInfo: jest.fn(),
  estimateTokens: jest.fn(),
  isConfigured: jest.fn()
};

// Mock YouTube video data
const mockYouTubeVideo: YouTubeVideo = {
  videoId: 'testVideoId123',
  title: 'Introduction to Analytical Psychology',
  description: 'A comprehensive introduction to Carl Jung\'s analytical psychology covering archetypes and the collective unconscious.',
  duration: 'PT15M30S',
  publishedAt: '2024-01-15T10:00:00Z',
  channelTitle: 'Psychology Education Channel',
  viewCount: 50000,
  likeCount: 2500,
  thumbnailUrl: 'https://i.ytimg.com/vi/testVideoId123/maxresdefault.jpg',
  categoryId: '27', // Education
  tags: ['psychology', 'jung', 'archetypes', 'analytical psychology']
};

describe('VideoEnricher Comprehensive Tests', () => {
  let videoEnricher: VideoEnricher;

  beforeEach(() => {
    jest.clearAllMocks();
    videoEnricher = new VideoEnricher(mockLLMProvider);
    
    // Default LLM provider responses
    mockLLMProvider.isConfigured.mockReturnValue(true);
    mockLLMProvider.generateCompletion.mockResolvedValue(JSON.stringify({
      educationalValue: 0.9,
      relevanceScore: 0.8,
      difficulty: 'intermediate',
      keyTimestamps: [
        { time: 180, topic: 'Archetypes Introduction', description: 'Basic overview of archetypal concepts' },
        { time: 600, topic: 'Collective Unconscious', description: 'Explanation of collective unconscious theory' }
      ],
      suggestedPrerequisites: ['Basic Psychology', 'Freudian Theory'],
      learningOutcomes: ['Understand archetypal theory', 'Recognize patterns in unconscious'],
      relatedConcepts: ['persona', 'shadow', 'anima', 'animus'],
      contentWarnings: []
    }));
  });

  describe('Constructor', () => {
    it('should initialize with LLM provider', () => {
      const enricher = new VideoEnricher(mockLLMProvider);
      expect(enricher).toBeInstanceOf(VideoEnricher);
    });

    it('should initialize without LLM provider', () => {
      const enricher = new VideoEnricher();
      expect(enricher).toBeInstanceOf(VideoEnricher);
    });
  });

  describe('enrichVideo', () => {
    it('should enrich video with complete metadata', async () => {
      const options: EnrichmentOptions = {
        analyzeTranscript: true,
        generateTimestamps: true,
        assessDifficulty: true,
        extractLearningOutcomes: true,
        targetAudience: 'students',
        courseContext: {
          topic: 'Analytical Psychology',
          concepts: ['archetypes', 'collective unconscious'],
          previousTopics: ['introduction to psychology']
        }
      };

      const enrichedVideo = await videoEnricher.enrichVideo(mockYouTubeVideo, options);

      expect(enrichedVideo).toMatchObject({
        id: 'video-testVideoId123',
        title: expect.stringContaining(mockYouTubeVideo.title),
        description: expect.any(String),
        url: 'https://youtube.com/watch?v=testVideoId123',
        duration: expect.any(String),
        platform: VideoPlatform.YOUTUBE,
        metadata: {
          educationalValue: 0.9,
          relevanceScore: 0.8,
          difficulty: 'intermediate',
          keyTimestamps: expect.arrayContaining([
            expect.objectContaining({
              time: expect.any(Number),
              topic: expect.any(String),
              description: expect.any(String)
            })
          ]),
          suggestedPrerequisites: expect.arrayContaining(['Basic Psychology']),
          learningOutcomes: expect.arrayContaining([expect.any(String)]),
          relatedConcepts: expect.arrayContaining(['persona', 'shadow']),
          contentWarnings: []
        }
      });
    });

    it('should handle null/undefined options', async () => {
      const enrichedVideo = await videoEnricher.enrichVideo(mockYouTubeVideo, null as any);

      expect(enrichedVideo).toBeDefined();
      expect(enrichedVideo.id).toBe('video-testVideoId123');
      expect(enrichedVideo.metadata).toBeDefined();
    });

    it('should enrich video with minimal options', async () => {
      const enrichedVideo = await videoEnricher.enrichVideo(mockYouTubeVideo, {});

      expect(enrichedVideo).toBeDefined();
      expect(enrichedVideo.metadata).toMatchObject({
        educationalValue: expect.any(Number),
        relevanceScore: expect.any(Number),
        difficulty: expect.any(String),
        relatedConcepts: expect.any(Array)
      });
    });

    it('should handle LLM provider errors gracefully', async () => {
      mockLLMProvider.generateCompletion.mockRejectedValue(new Error('LLM API Error'));

      const enrichedVideo = await videoEnricher.enrichVideo(mockYouTubeVideo);

      expect(enrichedVideo).toBeDefined();
      expect(enrichedVideo.metadata).toMatchObject({
        educationalValue: expect.any(Number),
        relevanceScore: expect.any(Number),
        difficulty: expect.any(String),
        relatedConcepts: expect.any(Array)
      });
    });

    it('should handle invalid JSON response from LLM', async () => {
      mockLLMProvider.generateCompletion.mockResolvedValue('invalid json {');

      const enrichedVideo = await videoEnricher.enrichVideo(mockYouTubeVideo);

      expect(enrichedVideo).toBeDefined();
      expect(enrichedVideo.metadata).toBeDefined();
    });
  });

  describe('analyzeVideo', () => {
    it('should analyze video with full options', async () => {
      const options: EnrichmentOptions = {
        analyzeTranscript: true,
        generateTimestamps: true,
        assessDifficulty: true,
        extractLearningOutcomes: true,
        targetAudience: 'graduate students',
        courseContext: {
          topic: 'Advanced Psychology',
          concepts: ['analytical psychology', 'depth psychology'],
          previousTopics: ['basic psychology', 'freudian theory']
        }
      };

      // Access private method using type assertion
      const metadata = await (videoEnricher as any).analyzeVideo(mockYouTubeVideo, options);

      expect(metadata).toMatchObject({
        educationalValue: expect.any(Number),
        relevanceScore: expect.any(Number),
        difficulty: expect.any(String),
        keyTimestamps: expect.any(Array),
        suggestedPrerequisites: expect.any(Array),
        learningOutcomes: expect.any(Array),
        relatedConcepts: expect.any(Array),
        contentWarnings: expect.any(Array)
      });

      expect(mockLLMProvider.generateCompletion).toHaveBeenCalledWith(
        expect.stringContaining('analyze this educational video'),
        expect.objectContaining({
          maxTokens: expect.any(Number),
          temperature: expect.any(Number)
        })
      );
    });

    it('should handle missing LLM provider', async () => {
      const enricherWithoutLLM = new VideoEnricher();

      const metadata = await (enricherWithoutLLM as any).analyzeVideo(mockYouTubeVideo, {});

      expect(metadata).toMatchObject({
        educationalValue: expect.any(Number),
        relevanceScore: expect.any(Number),
        difficulty: expect.any(String),
        relatedConcepts: expect.any(Array)
      });
    });

    it('should extract concepts from video tags and description', async () => {
      const videoWithRichTags: YouTubeVideo = {
        ...mockYouTubeVideo,
        tags: ['jung', 'psychology', 'archetypes', 'shadow', 'anima', 'collective unconscious'],
        description: 'This video explores the persona, shadow work, and individuation process in Jungian psychology.'
      };

      const metadata = await (videoEnricher as any).analyzeVideo(videoWithRichTags, {});

      expect(metadata.relatedConcepts).toEqual(
        expect.arrayContaining(['persona', 'shadow', 'individuation', 'archetypes'])
      );
    });
  });

  describe('enhanceTitle', () => {
    it('should enhance title with difficulty indicator', () => {
      const metadata: VideoMetadata = {
        educationalValue: 0.8,
        relevanceScore: 0.7,
        difficulty: 'advanced',
        relatedConcepts: ['psychology']
      };

      const enhancedTitle = (videoEnricher as any).enhanceTitle(mockYouTubeVideo.title, metadata);

      expect(enhancedTitle).toBe(`${mockYouTubeVideo.title} (Advanced Level)`);
    });

    it('should not add difficulty for beginner level', () => {
      const metadata: VideoMetadata = {
        educationalValue: 0.6,
        relevanceScore: 0.5,
        difficulty: 'beginner',
        relatedConcepts: []
      };

      const enhancedTitle = (videoEnricher as any).enhanceTitle(mockYouTubeVideo.title, metadata);

      expect(enhancedTitle).toBe(mockYouTubeVideo.title);
    });
  });

  describe('enhanceDescription', () => {
    it('should enhance description with learning outcomes and prerequisites', async () => {
      const metadata: VideoMetadata = {
        educationalValue: 0.9,
        relevanceScore: 0.8,
        difficulty: 'intermediate',
        suggestedPrerequisites: ['Basic Psychology', 'Freudian Theory'],
        learningOutcomes: ['Understand archetypes', 'Apply Jungian concepts'],
        relatedConcepts: ['persona', 'shadow'],
        contentWarnings: ['Complex theoretical content']
      };

      const options: EnrichmentOptions = {
        targetAudience: 'psychology students'
      };

      const enhancedDescription = await (videoEnricher as any).enhanceDescription(
        mockYouTubeVideo,
        metadata,
        options
      );

      expect(enhancedDescription).toContain('Learning Outcomes:');
      expect(enhancedDescription).toContain('Prerequisites:');
      expect(enhancedDescription).toContain('Target Audience: psychology students');
      expect(enhancedDescription).toContain('Educational Value: 90%');
      expect(enhancedDescription).toContain('Difficulty: Intermediate');
    });

    it('should handle metadata without optional fields', async () => {
      const minimalMetadata: VideoMetadata = {
        educationalValue: 0.7,
        relevanceScore: 0.6,
        difficulty: 'beginner',
        relatedConcepts: ['basic concepts']
      };

      const enhancedDescription = await (videoEnricher as any).enhanceDescription(
        mockYouTubeVideo,
        minimalMetadata,
        {}
      );

      expect(enhancedDescription).toContain(mockYouTubeVideo.description);
      expect(enhancedDescription).toContain('Educational Value: 70%');
      expect(enhancedDescription).toContain('Related Concepts: basic concepts');
    });
  });

  describe('Duration Conversion Utilities', () => {
    it('should parse ISO 8601 duration correctly', () => {
      const testCases = [
        { iso: 'PT15M30S', expected: 15.5 },
        { iso: 'PT1H30M', expected: 90 },
        { iso: 'PT2H15M45S', expected: 135.75 },
        { iso: 'PT45S', expected: 0.75 },
        { iso: 'PT30M', expected: 30 },
        { iso: 'PT1H', expected: 60 }
      ];

      testCases.forEach(({ iso, expected }) => {
        const minutes = (videoEnricher as any).parseDurationToMinutes(iso);
        expect(minutes).toBe(expected);
      });
    });

    it('should handle invalid duration formats', () => {
      const invalidDurations = ['invalid', '', 'P1D', '15:30'];

      invalidDurations.forEach(duration => {
        const minutes = (videoEnricher as any).parseDurationToMinutes(duration);
        expect(minutes).toBe(0);
      });
    });

    it('should convert minutes to readable duration format', () => {
      const testCases = [
        { minutes: 15.5, expected: '15 minutes' },
        { minutes: 90, expected: '1 hour 30 minutes' },
        { minutes: 60, expected: '1 hour' },
        { minutes: 0.75, expected: '1 minute' },
        { minutes: 135, expected: '2 hours 15 minutes' }
      ];

      testCases.forEach(({ minutes, expected }) => {
        const duration = (videoEnricher as any).convertMinutesToDuration(minutes);
        expect(duration).toBe(expected);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle video with no tags', async () => {
      const videoNoTags: YouTubeVideo = {
        ...mockYouTubeVideo,
        tags: []
      };

      const enrichedVideo = await videoEnricher.enrichVideo(videoNoTags);

      expect(enrichedVideo).toBeDefined();
      expect(enrichedVideo.metadata.relatedConcepts).toEqual(
        expect.arrayContaining(['psychology', 'analytical'])
      );
    });

    it('should handle video with no description', async () => {
      const videoNoDescription: YouTubeVideo = {
        ...mockYouTubeVideo,
        description: ''
      };

      const enrichedVideo = await videoEnricher.enrichVideo(videoNoDescription);

      expect(enrichedVideo).toBeDefined();
      expect(enrichedVideo.description).toContain('Educational Value:');
    });

    it('should handle extremely long video descriptions', async () => {
      const longDescription = 'A'.repeat(5000);
      const videoLongDescription: YouTubeVideo = {
        ...mockYouTubeVideo,
        description: longDescription
      };

      const enrichedVideo = await videoEnricher.enrichVideo(videoLongDescription);

      expect(enrichedVideo).toBeDefined();
      expect(enrichedVideo.description.length).toBeGreaterThan(longDescription.length);
    });

    it('should handle LLM timeout gracefully', async () => {
      mockLLMProvider.generateCompletion.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve('{}'), 10000))
      );

      const enrichedVideo = await videoEnricher.enrichVideo(mockYouTubeVideo);

      expect(enrichedVideo).toBeDefined();
    });

    it('should handle malformed LLM response', async () => {
      mockLLMProvider.generateCompletion.mockResolvedValue('not json at all');

      const enrichedVideo = await videoEnricher.enrichVideo(mockYouTubeVideo);

      expect(enrichedVideo).toBeDefined();
      expect(enrichedVideo.metadata).toMatchObject({
        educationalValue: expect.any(Number),
        relevanceScore: expect.any(Number),
        difficulty: expect.stringMatching(/beginner|intermediate|advanced/),
        relatedConcepts: expect.any(Array)
      });
    });

    it('should extract keywords from non-English titles', async () => {
      const foreignVideo: YouTubeVideo = {
        ...mockYouTubeVideo,
        title: 'Introducción a la Psicología Analítica',
        description: 'Una introducción completa a la psicología analítica de Carl Jung'
      };

      const metadata = await (videoEnricher as any).analyzeVideo(foreignVideo, {});

      expect(metadata.relatedConcepts).toContain('psychology');
    });

    it('should handle videos with extreme durations', async () => {
      const testCases = [
        { duration: 'PT0S', expectedMinutes: 0 },
        { duration: 'PT10H', expectedMinutes: 600 },
        { duration: 'PT23H59M59S', expectedMinutes: 1439.98 }
      ];

      testCases.forEach(({ duration, expectedMinutes }) => {
        const videoWithDuration: YouTubeVideo = {
          ...mockYouTubeVideo,
          duration
        };

        const minutes = (videoEnricher as any).parseDurationToMinutes(duration);
        expect(minutes).toBeCloseTo(expectedMinutes, 2);
      });
    });
  });

  describe('Content Analysis', () => {
    it('should identify educational content accurately', async () => {
      const educationalVideo: YouTubeVideo = {
        ...mockYouTubeVideo,
        title: 'Advanced Statistical Methods in Psychology Research',
        description: 'Learn about regression analysis, ANOVA, and multivariate statistics',
        categoryId: '27', // Education
        tags: ['statistics', 'research', 'methodology', 'analysis']
      };

      const enrichedVideo = await videoEnricher.enrichVideo(educationalVideo);

      expect(enrichedVideo.metadata.educationalValue).toBeGreaterThan(0.7);
      expect(enrichedVideo.metadata.difficulty).toBe('advanced');
    });

    it('should assess relevance based on context', async () => {
      const options: EnrichmentOptions = {
        courseContext: {
          topic: 'Analytical Psychology',
          concepts: ['archetypes', 'collective unconscious', 'individuation'],
          previousTopics: ['introduction to jung']
        }
      };

      const enrichedVideo = await videoEnricher.enrichVideo(mockYouTubeVideo, options);

      expect(enrichedVideo.metadata.relevanceScore).toBeGreaterThan(0.7);
    });

    it('should generate appropriate timestamps for longer videos', async () => {
      const longVideo: YouTubeVideo = {
        ...mockYouTubeVideo,
        duration: 'PT1H30M',
        title: 'Complete Course on Jungian Psychology',
        description: 'Comprehensive coverage of Jung\'s theories including archetypes, complexes, and individuation'
      };

      const options: EnrichmentOptions = {
        generateTimestamps: true
      };

      const enrichedVideo = await videoEnricher.enrichVideo(longVideo, options);

      expect(enrichedVideo.metadata.keyTimestamps).toBeDefined();
      expect(enrichedVideo.metadata.keyTimestamps!.length).toBeGreaterThan(1);
    });
  });

  describe('Integration with Course Context', () => {
    it('should align prerequisites with course progression', async () => {
      const options: EnrichmentOptions = {
        courseContext: {
          topic: 'Advanced Jungian Analysis',
          concepts: ['shadow work', 'active imagination', 'dream analysis'],
          previousTopics: ['basic jungian theory', 'archetypal psychology']
        }
      };

      const enrichedVideo = await videoEnricher.enrichVideo(mockYouTubeVideo, options);

      expect(enrichedVideo.metadata.suggestedPrerequisites).toContain('Basic Psychology');
      expect(enrichedVideo.description).toContain('Prerequisites:');
    });

    it('should suggest relevant follow-up concepts', async () => {
      const options: EnrichmentOptions = {
        courseContext: {
          topic: 'Introduction to Jung',
          concepts: ['persona', 'shadow'],
          previousTopics: []
        }
      };

      const enrichedVideo = await videoEnricher.enrichVideo(mockYouTubeVideo, options);

      expect(enrichedVideo.metadata.relatedConcepts).toEqual(
        expect.arrayContaining(['persona', 'shadow'])
      );
    });
  });
});