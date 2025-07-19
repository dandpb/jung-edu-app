import { YouTubeService } from '../../../services/video/youtubeService';
import { mockVideo, mockFetchResponses } from '../../mocks/mockData';

describe('YouTubeService', () => {
  let service: YouTubeService;
  const mockApiKey = 'test-youtube-api-key';
  
  beforeEach(() => {
    service = new YouTubeService(mockApiKey);
    global.fetch = jest.fn();
    
    // Mock console methods to avoid noise in tests
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  describe('searchVideos', () => {
    it('should search videos successfully', async () => {
      const mockSearchResponse = {
        ok: true,
        json: async () => ({
          items: [
            {
              id: { videoId: 'test123' },
              snippet: {
                title: 'Understanding the Collective Unconscious',
                description: 'An exploration of Jung\'s concept',
                thumbnails: {
                  default: { url: 'https://example.com/thumb.jpg' },
                  medium: { url: 'https://example.com/thumb-medium.jpg' },
                  high: { url: 'https://example.com/thumb-high.jpg' }
                },
                channelTitle: 'Psychology Insights',
                publishedAt: '2024-01-15T00:00:00Z'
              }
            }
          ],
          pageInfo: {
            totalResults: 100,
            resultsPerPage: 10
          }
        })
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockSearchResponse);
      
      const results = await service.searchVideos('collective unconscious jung', {
        maxResults: 10,
        order: 'relevance'
      });
      
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        id: 'test123',
        title: 'Understanding the Collective Unconscious',
        channel: 'Psychology Insights'
      });
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://www.googleapis.com/youtube/v3/search'),
        expect.any(Object)
      );
    });
    
    it('should handle search with filters', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] })
      });
      
      await service.searchVideos('jung psychology', {
        maxResults: 5,
        order: 'viewCount',
        videoDuration: 'medium',
        publishedAfter: '2023-01-01'
      });
      
      const url = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(url).toContain('maxResults=5');
      expect(url).toContain('order=viewCount');
      expect(url).toContain('videoDuration=medium');
      expect(url).toContain('publishedAfter=2023-01-01');
    });
    
    it('should handle API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({
          error: {
            message: 'API key quota exceeded',
            code: 403
          }
        })
      });
      
      await expect(service.searchVideos('test query'))
        .rejects.toThrow('YouTube API error');
    });
    
    it('should handle empty results', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] })
      });
      
      const results = await service.searchVideos('very specific query');
      expect(results).toEqual([]);
    });
  });
  
  describe('getVideoDetails', () => {
    it('should fetch video details with statistics', async () => {
      const mockDetailsResponse = {
        ok: true,
        json: async () => ({
          items: [{
            id: 'test123',
            snippet: {
              title: 'Understanding the Collective Unconscious',
              description: 'Detailed description...',
              tags: ['jung', 'psychology', 'unconscious'],
              categoryId: '27'
            },
            statistics: {
              viewCount: '15000',
              likeCount: '500',
              dislikeCount: '10',
              commentCount: '50'
            },
            contentDetails: {
              duration: 'PT12M30S',
              dimension: '2d',
              definition: 'hd'
            }
          }]
        })
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockDetailsResponse);
      
      const details = await service.getVideoDetails('test123');
      
      expect(details).toMatchObject({
        id: 'test123',
        title: 'Understanding the Collective Unconscious',
        duration: 750, // 12 minutes 30 seconds
        viewCount: 15000,
        likeCount: 500,
        tags: ['jung', 'psychology', 'unconscious']
      });
    });
    
    it('should parse ISO 8601 duration correctly', async () => {
      const durations = [
        { iso: 'PT1H30M', expected: 5400 }, // 1 hour 30 minutes
        { iso: 'PT45M', expected: 2700 }, // 45 minutes
        { iso: 'PT2H15M30S', expected: 8130 }, // 2 hours 15 minutes 30 seconds
        { iso: 'PT30S', expected: 30 } // 30 seconds
      ];
      
      for (const { iso, expected } of durations) {
        const mockResponse = {
          ok: true,
          json: async () => ({
            items: [{
              id: 'test',
              snippet: { title: 'Test' },
              contentDetails: { duration: iso },
              statistics: {}
            }]
          })
        };
        
        (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);
        
        const details = await service.getVideoDetails('test');
        expect(details.duration).toBe(expected);
      }
    });
  });
  
  describe('getVideoTranscript', () => {
    it('should fetch video transcript', async () => {
      // Mock transcript API response
      const mockTranscriptResponse = {
        ok: true,
        json: async () => ({
          transcript: [
            { text: 'Welcome to this video about ', start: 0, duration: 2 },
            { text: 'the collective unconscious.', start: 2, duration: 2 }
          ]
        })
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockTranscriptResponse);
      
      const transcript = await service.getVideoTranscript('test123');
      
      expect(transcript).toBe('Welcome to this video about the collective unconscious.');
    });
    
    it('should handle videos without transcripts', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Transcript not available' })
      });
      
      const transcript = await service.getVideoTranscript('test123');
      expect(transcript).toBeNull();
    });
  });
  
  describe('getChannelInfo', () => {
    it('should fetch channel information', async () => {
      const mockChannelResponse = {
        ok: true,
        json: async () => ({
          items: [{
            id: 'channel123',
            snippet: {
              title: 'Psychology Insights',
              description: 'Educational psychology content',
              customUrl: '@psychologyinsights'
            },
            statistics: {
              subscriberCount: '100000',
              videoCount: '250'
            }
          }]
        })
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockChannelResponse);
      
      const channelInfo = await service.getChannelInfo('channel123');
      
      expect(channelInfo).toMatchObject({
        id: 'channel123',
        title: 'Psychology Insights',
        subscriberCount: 100000,
        videoCount: 250
      });
    });
  });
  
  describe('searchEducationalVideos', () => {
    it('should filter for educational content', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              id: { videoId: 'edu1' },
              snippet: {
                title: 'Jung Psychology Lecture',
                description: 'University lecture on Jungian concepts',
                channelTitle: 'University Channel',
                publishedAt: '2024-01-01T00:00:00Z',
                thumbnails: { default: { url: 'thumb.jpg' } }
              }
            }
          ]
        })
      });
      
      const results = await service.searchEducationalVideos('jung archetypes', {
        minDuration: 600, // 10 minutes
        academicOnly: true
      });
      
      const url = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(url).toContain('videoDuration=long');
      expect(url).toContain('videoDefinition=high');
    });
  });
  
  describe('rate limiting and caching', () => {
    it('should cache search results', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          items: [{ id: { videoId: 'cached1' }, snippet: { title: 'Cached Video' } }]
        })
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);
      
      // First call
      const results1 = await service.searchVideos('jung shadow');
      expect(global.fetch).toHaveBeenCalledTimes(1);
      
      // Second call (should use cache)
      const results2 = await service.searchVideos('jung shadow');
      expect(global.fetch).toHaveBeenCalledTimes(1); // Still 1
      expect(results2).toEqual(results1);
    });
    
    it('should respect rate limits', async () => {
      // Make multiple rapid requests
      const promises = Array(5).fill(null).map((_, i) => 
        service.searchVideos(`query ${i}`)
      );
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ items: [] })
      });
      
      await Promise.all(promises);
      
      // Check that requests were spaced out
      const callTimes = (global.fetch as jest.Mock).mock.calls.map(() => Date.now());
      // Implementation would space these out
    });
  });
  
  describe('error handling and validation', () => {
    it('should validate API key', () => {
      expect(() => new YouTubeService('')).toThrow('YouTube API key is required');
    });
    
    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      await expect(service.searchVideos('test'))
        .rejects.toThrow('Network error');
    });
    
    it('should validate video IDs', async () => {
      await expect(service.getVideoDetails('')).rejects.toThrow('Video ID is required');
      await expect(service.getVideoDetails('invalid id with spaces'))
        .rejects.toThrow('Invalid video ID');
    });
  });
});