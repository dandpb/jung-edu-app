/**
 * Comprehensive Unit Tests for YouTubeService
 * Covers all video search, channel operations, playlist handling, and error scenarios
 */

import axios from 'axios';
import { YouTubeService, YouTubeVideo, YouTubeChannel, YouTubeSearchOptions } from '../youtubeService';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('YouTubeService - Comprehensive Unit Tests', () => {
  let service: YouTubeService;
  const mockApiKey = 'test-api-key-123';

  // Mock data
  const mockVideoSearchResponse = {
    data: {
      items: [
        {
          id: { videoId: 'video1' },
          snippet: {
            title: 'Jung Psychology Video 1',
            channelTitle: 'Psychology Channel',
            publishedAt: '2023-01-01T00:00:00Z'
          }
        },
        {
          id: { videoId: 'video2' },
          snippet: {
            title: 'Jung Psychology Video 2',
            channelTitle: 'Educational Channel',
            publishedAt: '2023-01-02T00:00:00Z'
          }
        }
      ]
    }
  };

  const mockVideoDetailsResponse = {
    data: {
      items: [
        {
          id: 'video1',
          snippet: {
            title: 'Jung Psychology Video 1',
            description: 'Detailed description about Jung',
            channelId: 'channel1',
            channelTitle: 'Psychology Channel',
            publishedAt: '2023-01-01T00:00:00Z',
            thumbnails: {
              default: { url: 'default.jpg', width: 120, height: 90 },
              medium: { url: 'medium.jpg', width: 320, height: 180 },
              high: { url: 'high.jpg', width: 480, height: 360 }
            },
            tags: ['jung', 'psychology', 'shadow'],
            categoryId: '27'
          },
          contentDetails: {
            duration: 'PT15M30S'
          },
          statistics: {
            viewCount: '10000',
            likeCount: '500'
          }
        },
        {
          id: 'video2',
          snippet: {
            title: 'Jung Psychology Video 2',
            description: 'Another Jung video',
            channelId: 'channel2',
            channelTitle: 'Educational Channel',
            publishedAt: '2023-01-02T00:00:00Z',
            thumbnails: {
              default: { url: 'default2.jpg', width: 120, height: 90 },
              medium: { url: 'medium2.jpg', width: 320, height: 180 },
              high: { url: 'high2.jpg', width: 480, height: 360 }
            },
            tags: ['jung', 'archetypes'],
            categoryId: '27'
          },
          contentDetails: {
            duration: 'PT25M45S'
          },
          statistics: {
            viewCount: '15000',
            likeCount: '750'
          }
        }
      ]
    }
  };

  const mockChannelSearchResponse = {
    data: {
      items: [
        {
          id: { channelId: 'channel1' },
          snippet: {
            title: 'Jung Psychology Institute'
          }
        }
      ]
    }
  };

  const mockChannelDetailsResponse = {
    data: {
      items: [
        {
          id: 'channel1',
          snippet: {
            title: 'Jung Psychology Institute',
            description: 'Educational channel about Jungian psychology',
            thumbnails: {
              default: { url: 'channel-default.jpg' },
              medium: { url: 'channel-medium.jpg' },
              high: { url: 'channel-high.jpg' }
            },
            customUrl: '@jungpsychology'
          },
          statistics: {
            subscriberCount: '100000',
            videoCount: '250',
            viewCount: '10000000'
          }
        }
      ]
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    
    // Reset navigator mock
    Object.defineProperty(global, 'navigator', {
      value: { userAgent: 'test-user-agent' },
      writable: true
    });
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with API key from constructor', () => {
      service = new YouTubeService(mockApiKey);
      
      expect(service['apiKey']).toBe(mockApiKey);
      expect(service['mockMode']).toBe(false);
    });

    it('should initialize with API key from environment', () => {
      process.env.REACT_APP_YOUTUBE_API_KEY = 'env-api-key';
      service = new YouTubeService();
      
      expect(service['apiKey']).toBe('env-api-key');
      expect(service['mockMode']).toBe(false);
      
      delete process.env.REACT_APP_YOUTUBE_API_KEY;
    });

    it('should initialize in mock mode when no API key provided', () => {
      service = new YouTubeService();
      
      expect(service['apiKey']).toBe('');
      expect(service['mockMode']).toBe(true);
    });

    it('should log initialization status with API key', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      service = new YouTubeService('test-key-long-enough');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'YouTube Service: Using real API with key:', 'test-ke...'
      );
    });

    it('should log mock mode when no API key', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      service = new YouTubeService();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'YouTube Service: No API key found, using mock mode'
      );
    });
  });

  describe('Video Search', () => {
    beforeEach(() => {
      service = new YouTubeService(mockApiKey);
    });

    describe('searchVideos - API Mode', () => {
      it('should search videos successfully with default options', async () => {
        mockedAxios.get
          .mockResolvedValueOnce(mockVideoSearchResponse)
          .mockResolvedValueOnce(mockVideoDetailsResponse);

        const result = await service.searchVideos('jung psychology');

        expect(result).toHaveLength(2);
        expect(result[0]).toMatchObject({
          videoId: 'video1',
          title: 'Jung Psychology Video 1',
          channelTitle: 'Psychology Channel',
          duration: 'PT15M30S',
          viewCount: '10000',
          likeCount: '500'
        });

        expect(mockedAxios.get).toHaveBeenCalledWith(
          'https://www.googleapis.com/youtube/v3/search',
          expect.objectContaining({
            params: expect.objectContaining({
              key: mockApiKey,
              q: 'jung psychology',
              part: 'snippet',
              type: 'video',
              maxResults: 10,
              order: 'relevance'
            })
          })
        );
      });

      it('should use custom search options', async () => {
        mockedAxios.get
          .mockResolvedValueOnce(mockVideoSearchResponse)
          .mockResolvedValueOnce(mockVideoDetailsResponse);

        const options: YouTubeSearchOptions = {
          maxResults: 5,
          order: 'viewCount',
          videoDuration: 'long',
          videoDefinition: 'high',
          videoEmbeddable: true,
          safeSearch: 'strict',
          channelId: 'specific-channel',
          relevanceLanguage: 'pt'
        };

        await service.searchVideos('jung psychology', options);

        expect(mockedAxios.get).toHaveBeenCalledWith(
          'https://www.googleapis.com/youtube/v3/search',
          expect.objectContaining({
            params: expect.objectContaining({
              maxResults: 5,
              order: 'viewCount',
              videoDuration: 'long',
              videoDefinition: 'high',
              videoEmbeddable: true,
              safeSearch: 'strict',
              channelId: 'specific-channel',
              relevanceLanguage: 'pt'
            })
          })
        );
      });

      it('should handle empty search results', async () => {
        mockedAxios.get.mockResolvedValueOnce({
          data: { items: [] }
        });

        const result = await service.searchVideos('nonexistent query');

        expect(result).toEqual([]);
      });

      it('should cache search results', async () => {
        mockedAxios.get
          .mockResolvedValueOnce(mockVideoSearchResponse)
          .mockResolvedValueOnce(mockVideoDetailsResponse);

        // First call
        await service.searchVideos('jung psychology');
        
        // Second call with same query should use cache
        const result = await service.searchVideos('jung psychology');

        expect(result).toHaveLength(2);
        expect(mockedAxios.get).toHaveBeenCalledTimes(2); // Only called once per endpoint
      });

      it('should handle API key errors and switch to mock mode', async () => {
        const apiError = {
          response: {
            data: {
              error: {
                code: 400,
                errors: [{ reason: 'badRequest' }]
              }
            }
          }
        };

        mockedAxios.get.mockRejectedValueOnce(apiError);

        const result = await service.searchVideos('jung psychology');

        // Should return mock data after switching to mock mode
        expect(result).toHaveLength(3); // Mock returns 3 videos
        expect(result[0].title).toContain('Carl Jung and the Psychology of');
        expect(service['mockMode']).toBe(true);
      });

      it('should handle network errors gracefully', async () => {
        mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

        const result = await service.searchVideos('jung psychology');

        // Should fallback to mock data
        expect(result).toHaveLength(3);
        expect(result[0].title).toContain('Carl Jung and the Psychology of');
      });

      it('should log API key truncated for security', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        
        mockedAxios.get
          .mockResolvedValueOnce(mockVideoSearchResponse)
          .mockResolvedValueOnce(mockVideoDetailsResponse);

        await service.searchVideos('jung psychology');

        expect(consoleSpy).toHaveBeenCalledWith(
          'Making YouTube API request with key:', 'test-ap...'
        );
      });
    });

    describe('searchVideos - Mock Mode', () => {
      beforeEach(() => {
        service = new YouTubeService(); // No API key = mock mode
      });

      it('should return mock videos in mock mode', async () => {
        const result = await service.searchVideos('jung psychology');

        expect(result).toHaveLength(3);
        expect(result[0]).toMatchObject({
          videoId: 'nBUQsNpyPHs',
          title: 'Carl Jung and the Psychology of jung psychology',
          channelTitle: 'Jung Psychology Institute',
          duration: 'PT24M36S'
        });
      });

      it('should filter by duration in mock mode', async () => {
        const result = await service.searchVideos('jung psychology', { 
          videoDuration: 'short' 
        });

        // All mock videos are longer than 4 minutes, so should be empty
        expect(result).toHaveLength(0);
      });

      it('should sort by view count in mock mode', async () => {
        const result = await service.searchVideos('jung psychology', { 
          order: 'viewCount' 
        });

        expect(result).toHaveLength(3);
        // Should be sorted by view count (descending)
        const viewCounts = result.map(v => parseInt(v.viewCount));
        expect(viewCounts[0]).toBeGreaterThan(viewCounts[1]);
      });

      it('should limit results by maxResults', async () => {
        const result = await service.searchVideos('jung psychology', { 
          maxResults: 2 
        });

        expect(result).toHaveLength(2);
      });
    });
  });

  describe('Individual Video Operations', () => {
    beforeEach(() => {
      service = new YouTubeService(mockApiKey);
    });

    describe('getVideoById', () => {
      it('should get video by ID successfully', async () => {
        mockedAxios.get.mockResolvedValueOnce({
          data: {
            items: [mockVideoDetailsResponse.data.items[0]]
          }
        });

        const result = await service.getVideoById('video1');

        expect(result).toMatchObject({
          videoId: 'video1',
          title: 'Jung Psychology Video 1',
          description: 'Detailed description about Jung'
        });

        expect(mockedAxios.get).toHaveBeenCalledWith(
          'https://www.googleapis.com/youtube/v3/videos',
          expect.objectContaining({
            params: {
              key: mockApiKey,
              id: 'video1',
              part: 'snippet,contentDetails,statistics'
            }
          })
        );
      });

      it('should return null when video not found', async () => {
        mockedAxios.get.mockResolvedValueOnce({
          data: { items: [] }
        });

        const result = await service.getVideoById('nonexistent');

        expect(result).toBeNull();
      });

      it('should handle API errors and return mock data', async () => {
        mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));

        const result = await service.getVideoById('video1');

        expect(result).toBeDefined();
        expect(result?.title).toBe('The Shadow: Carl Jung\'s Warning to The World');
      });
    });

    describe('getVideoDetails', () => {
      it('should get video details in expected format', async () => {
        mockedAxios.get.mockResolvedValueOnce({
          data: {
            items: [mockVideoDetailsResponse.data.items[0]]
          }
        });

        const result = await service.getVideoDetails('video1');

        expect(result).toMatchObject({
          id: 'video1',
          title: 'Jung Psychology Video 1',
          duration: 930, // PT15M30S = 15*60 + 30 = 930 seconds
          viewCount: 10000,
          likeCount: 500,
          tags: ['jung', 'psychology', 'shadow']
        });
      });

      it('should throw error for invalid video ID', async () => {
        await expect(service.getVideoDetails('')).rejects.toThrow('Video ID is required');
        await expect(service.getVideoDetails('id with spaces')).rejects.toThrow('Invalid video ID');
      });

      it('should return null when video not found', async () => {
        mockedAxios.get.mockResolvedValueOnce({
          data: { items: [] }
        });

        const result = await service.getVideoDetails('nonexistent');

        expect(result).toBeNull();
      });

      it('should handle videos without like count', async () => {
        mockedAxios.get.mockResolvedValueOnce({
          data: {
            items: [{
              ...mockVideoDetailsResponse.data.items[0],
              statistics: {
                viewCount: '10000'
                // likeCount missing
              }
            }]
          }
        });

        const result = await service.getVideoDetails('video1');

        expect(result?.likeCount).toBe(0);
      });
    });

    describe('getVideoTranscript', () => {
      it('should return null in mock mode', async () => {
        service = new YouTubeService(); // Mock mode
        
        const result = await service.getVideoTranscript('video1');

        expect(result).toBeNull();
      });

      it('should return null for empty video ID', async () => {
        const result = await service.getVideoTranscript('');

        expect(result).toBeNull();
      });

      it('should handle transcript API success', async () => {
        mockedAxios.get.mockResolvedValueOnce({
          data: {
            transcript: [
              { text: 'First part of transcript' },
              { text: 'Second part of transcript' }
            ]
          }
        });

        const result = await service.getVideoTranscript('video1');

        expect(result).toBe('First part of transcript Second part of transcript');
        expect(mockedAxios.get).toHaveBeenCalledWith('/api/transcript/video1');
      });

      it('should handle transcript API errors', async () => {
        mockedAxios.get.mockRejectedValueOnce(new Error('Transcript not available'));

        const result = await service.getVideoTranscript('video1');

        expect(result).toBeNull();
      });
    });
  });

  describe('Channel Operations', () => {
    beforeEach(() => {
      service = new YouTubeService(mockApiKey);
    });

    describe('searchEducationalChannels', () => {
      it('should search channels successfully', async () => {
        mockedAxios.get
          .mockResolvedValueOnce(mockChannelSearchResponse)
          .mockResolvedValueOnce(mockChannelDetailsResponse);

        const result = await service.searchEducationalChannels('psychology');

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
          channelId: 'channel1',
          title: 'Jung Psychology Institute',
          subscriberCount: '100000',
          videoCount: '250'
        });

        expect(mockedAxios.get).toHaveBeenCalledWith(
          'https://www.googleapis.com/youtube/v3/search',
          expect.objectContaining({
            params: expect.objectContaining({
              q: 'psychology education lecture',
              type: 'channel'
            })
          })
        );
      });

      it('should use custom maxResults', async () => {
        mockedAxios.get
          .mockResolvedValueOnce(mockChannelSearchResponse)
          .mockResolvedValueOnce(mockChannelDetailsResponse);

        await service.searchEducationalChannels('psychology', 5);

        expect(mockedAxios.get).toHaveBeenCalledWith(
          'https://www.googleapis.com/youtube/v3/search',
          expect.objectContaining({
            params: expect.objectContaining({
              maxResults: 5
            })
          })
        );
      });

      it('should return mock channels in mock mode', async () => {
        service = new YouTubeService(); // Mock mode

        const result = await service.searchEducationalChannels('psychology');

        expect(result).toHaveLength(2);
        expect(result[0].title).toBe('Jung Psychology Institute');
      });
    });

    describe('getChannelInfo', () => {
      it('should get channel info successfully', async () => {
        mockedAxios.get.mockResolvedValueOnce(mockChannelDetailsResponse);

        const result = await service.getChannelInfo('channel1');

        expect(result).toMatchObject({
          id: 'channel1',
          title: 'Jung Psychology Institute',
          subscriberCount: 100000,
          videoCount: 250
        });
      });

      it('should return null when channel not found', async () => {
        mockedAxios.get.mockResolvedValueOnce({
          data: { items: [] }
        });

        const result = await service.getChannelInfo('nonexistent');

        expect(result).toBeNull();
      });

      it('should return mock data in mock mode', async () => {
        service = new YouTubeService(); // Mock mode

        const result = await service.getChannelInfo('any-channel');

        expect(result).toMatchObject({
          id: 'any-channel',
          title: 'Mock Channel',
          subscriberCount: 100000,
          videoCount: 250
        });
      });

      it('should handle API errors', async () => {
        mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));

        const result = await service.getChannelInfo('channel1');

        expect(result).toBeNull();
      });
    });

    describe('getChannelVideos', () => {
      it('should get channel videos successfully', async () => {
        mockedAxios.get
          .mockResolvedValueOnce(mockVideoSearchResponse)
          .mockResolvedValueOnce(mockVideoDetailsResponse);

        const result = await service.getChannelVideos('channel1');

        expect(result).toHaveLength(2);
        expect(mockedAxios.get).toHaveBeenCalledWith(
          'https://www.googleapis.com/youtube/v3/search',
          expect.objectContaining({
            params: expect.objectContaining({
              channelId: 'channel1',
              type: 'video'
            })
          })
        );
      });

      it('should handle empty results', async () => {
        mockedAxios.get.mockResolvedValueOnce({
          data: { items: [] }
        });

        const result = await service.getChannelVideos('empty-channel');

        expect(result).toEqual([]);
      });

      it('should return mock videos in mock mode', async () => {
        service = new YouTubeService(); // Mock mode

        const result = await service.getChannelVideos('channel1');

        expect(result).toHaveLength(10); // Default maxResults
        expect(result[0].channelId).toBe('channel1');
      });
    });
  });

  describe('Playlist Operations', () => {
    beforeEach(() => {
      service = new YouTubeService(mockApiKey);
    });

    describe('getPlaylistVideos', () => {
      const mockPlaylistResponse = {
        data: {
          items: [
            { contentDetails: { videoId: 'video1' } },
            { contentDetails: { videoId: 'video2' } }
          ]
        }
      };

      it('should get playlist videos successfully', async () => {
        mockedAxios.get
          .mockResolvedValueOnce(mockPlaylistResponse)
          .mockResolvedValueOnce(mockVideoDetailsResponse);

        const result = await service.getPlaylistVideos('playlist1');

        expect(result).toHaveLength(2);
        expect(mockedAxios.get).toHaveBeenCalledWith(
          'https://www.googleapis.com/youtube/v3/playlistItems',
          expect.objectContaining({
            params: {
              key: mockApiKey,
              playlistId: 'playlist1',
              part: 'contentDetails',
              maxResults: 50
            }
          })
        );
      });

      it('should use custom maxResults for playlists', async () => {
        mockedAxios.get
          .mockResolvedValueOnce(mockPlaylistResponse)
          .mockResolvedValueOnce(mockVideoDetailsResponse);

        await service.getPlaylistVideos('playlist1', 10);

        expect(mockedAxios.get).toHaveBeenCalledWith(
          'https://www.googleapis.com/youtube/v3/playlistItems',
          expect.objectContaining({
            params: expect.objectContaining({
              maxResults: 10
            })
          })
        );
      });

      it('should return mock videos in mock mode', async () => {
        service = new YouTubeService(); // Mock mode

        const result = await service.getPlaylistVideos('playlist1');

        expect(result).toHaveLength(3); // Mock returns 3 videos
      });
    });
  });

  describe('Related Videos', () => {
    beforeEach(() => {
      service = new YouTubeService(mockApiKey);
    });

    describe('getRelatedVideos', () => {
      it('should get related videos based on tags', async () => {
        // Mock getting original video
        mockedAxios.get
          .mockResolvedValueOnce({
            data: {
              items: [{
                ...mockVideoDetailsResponse.data.items[0],
                snippet: {
                  ...mockVideoDetailsResponse.data.items[0].snippet,
                  tags: ['jung', 'psychology', 'shadow']
                }
              }]
            }
          })
          // Mock search for related videos
          .mockResolvedValueOnce({
            data: {
              items: [
                { id: { videoId: 'related1' } },
                { id: { videoId: 'related2' } },
                { id: { videoId: 'video1' } }, // Original video (should be filtered out)
                { id: { videoId: 'related3' } }
              ]
            }
          })
          // Mock getting video details
          .mockResolvedValueOnce({
            data: {
              items: [
                { ...mockVideoDetailsResponse.data.items[0], id: 'related1' },
                { ...mockVideoDetailsResponse.data.items[0], id: 'related2' },
                { ...mockVideoDetailsResponse.data.items[0], id: 'related3' }
              ]
            }
          });

        const result = await service.getRelatedVideos('video1', 5);

        expect(result).toHaveLength(3);
        expect(result.map(v => v.videoId)).not.toContain('video1'); // Original video filtered out
        expect(mockedAxios.get).toHaveBeenCalledWith(
          'https://www.googleapis.com/youtube/v3/search',
          expect.objectContaining({
            params: expect.objectContaining({
              q: 'jung psychology shadow',
              maxResults: 10 // 5 + 5 extra to filter out original
            })
          })
        );
      });

      it('should handle video without tags', async () => {
        mockedAxios.get
          .mockResolvedValueOnce({
            data: {
              items: [{
                ...mockVideoDetailsResponse.data.items[0],
                snippet: {
                  ...mockVideoDetailsResponse.data.items[0].snippet,
                  tags: undefined,
                  title: 'Jung Psychology Video Test'
                }
              }]
            }
          })
          .mockResolvedValueOnce({
            data: {
              items: [{ id: { videoId: 'related1' } }]
            }
          })
          .mockResolvedValueOnce({
            data: {
              items: [{ ...mockVideoDetailsResponse.data.items[0], id: 'related1' }]
            }
          });

        const result = await service.getRelatedVideos('video1');

        expect(result).toBeDefined();
        expect(mockedAxios.get).toHaveBeenCalledWith(
          'https://www.googleapis.com/youtube/v3/search',
          expect.objectContaining({
            params: expect.objectContaining({
              q: 'Jung Psychology Video' // First 3 words of title
            })
          })
        );
      });

      it('should return empty array when original video not found', async () => {
        mockedAxios.get.mockResolvedValueOnce({
          data: { items: [] }
        });

        const result = await service.getRelatedVideos('nonexistent');

        expect(result).toEqual([]);
      });

      it('should return mock related videos in mock mode', async () => {
        service = new YouTubeService(); // Mock mode

        const result = await service.getRelatedVideos('video1', 5);

        expect(result).toHaveLength(5);
        expect(result[0].videoId).toBe('related-video1-1');
      });
    });
  });

  describe('Educational Video Search', () => {
    beforeEach(() => {
      service = new YouTubeService(mockApiKey);
    });

    it('should search educational videos with enhanced options', async () => {
      mockedAxios.get
        .mockResolvedValueOnce(mockVideoSearchResponse)
        .mockResolvedValueOnce(mockVideoDetailsResponse);

      const result = await service.searchEducationalVideos('psychology', {
        minDuration: 600 // 10 minutes
      });

      expect(result).toBeDefined();
      // Should call searchVideos with enhanced options
    });

    it('should set appropriate duration filter based on minDuration', async () => {
      mockedAxios.get
        .mockResolvedValueOnce(mockVideoSearchResponse)
        .mockResolvedValueOnce(mockVideoDetailsResponse);

      // Mock the searchVideos method to verify it's called with correct options
      const searchVideosSpy = jest.spyOn(service, 'searchVideos');

      await service.searchEducationalVideos('psychology', { minDuration: 1200 });

      expect(searchVideosSpy).toHaveBeenCalledWith('psychology', expect.objectContaining({
        videoDuration: 'long',
        videoDefinition: 'high',
        safeSearch: 'strict'
      }));
    });
  });

  describe('Utility Methods', () => {
    beforeEach(() => {
      service = new YouTubeService(mockApiKey);
    });

    describe('parseDuration', () => {
      it('should parse ISO 8601 duration correctly', () => {
        const testCases = [
          { input: 'PT15M30S', expected: 930 }, // 15*60 + 30 = 930
          { input: 'PT1H30M45S', expected: 5445 }, // 1*3600 + 30*60 + 45 = 5445
          { input: 'PT2H', expected: 7200 }, // 2*3600 = 7200
          { input: 'PT45S', expected: 45 }, // 45
          { input: 'PT10M', expected: 600 }, // 10*60 = 600
          { input: 'INVALID', expected: 0 }
        ];

        testCases.forEach(({ input, expected }) => {
          const result = service['parseDuration'](input);
          expect(result).toBe(expected);
        });
      });
    });

    describe('parseDurationToMinutes', () => {
      it('should parse ISO 8601 duration to minutes correctly', () => {
        const testCases = [
          { input: 'PT15M30S', expected: 16 }, // 15 + ceil(30/60) = 16
          { input: 'PT1H30M45S', expected: 91 }, // 60 + 30 + ceil(45/60) = 91
          { input: 'PT2H', expected: 120 }, // 2*60 = 120
          { input: 'PT45S', expected: 1 }, // ceil(45/60) = 1
          { input: 'PT10M', expected: 10 }, // 10
          { input: 'INVALID', expected: 0 }
        ];

        testCases.forEach(({ input, expected }) => {
          const result = service['parseDurationToMinutes'](input);
          expect(result).toBe(expected);
        });
      });
    });

    describe('mapVideoResponse', () => {
      it('should map API response to YouTubeVideo format', () => {
        const apiResponse = mockVideoDetailsResponse.data.items[0];
        const result = service['mapVideoResponse'](apiResponse);

        expect(result).toMatchObject({
          videoId: 'video1',
          title: 'Jung Psychology Video 1',
          description: 'Detailed description about Jung',
          channelId: 'channel1',
          channelTitle: 'Psychology Channel',
          publishedAt: '2023-01-01T00:00:00Z',
          duration: 'PT15M30S',
          viewCount: '10000',
          likeCount: '500',
          tags: ['jung', 'psychology', 'shadow'],
          categoryId: '27'
        });
      });
    });

    describe('mapChannelResponse', () => {
      it('should map API response to YouTubeChannel format', () => {
        const apiResponse = mockChannelDetailsResponse.data.items[0];
        const result = service['mapChannelResponse'](apiResponse);

        expect(result).toMatchObject({
          channelId: 'channel1',
          title: 'Jung Psychology Institute',
          description: 'Educational channel about Jungian psychology',
          subscriberCount: '100000',
          videoCount: '250',
          viewCount: '10000000',
          customUrl: '@jungpsychology'
        });
      });
    });
  });

  describe('Mock Mode Behavior', () => {
    beforeEach(() => {
      service = new YouTubeService(); // Mock mode
    });

    it('should generate consistent mock data', async () => {
      const result1 = await service.searchVideos('psychology');
      const result2 = await service.searchVideos('psychology');

      expect(result1).toEqual(result2); // Should be identical
    });

    it('should include query in mock video titles', async () => {
      const result = await service.searchVideos('custom query');

      expect(result[0].title).toContain('custom query');
    });

    it('should generate realistic mock data', async () => {
      const result = await service.searchVideos('psychology');

      expect(result[0]).toMatchObject({
        videoId: expect.any(String),
        title: expect.stringContaining('Carl Jung'),
        channelTitle: expect.any(String),
        viewCount: expect.any(String),
        likeCount: expect.any(String),
        tags: expect.arrayContaining(['jung', 'psychology'])
      });
    });
  });

  describe('Error Recovery and Fallbacks', () => {
    beforeEach(() => {
      service = new YouTubeService(mockApiKey);
    });

    it('should handle quota exceeded errors', async () => {
      const quotaError = {
        response: {
          data: {
            error: {
              code: 403,
              errors: [{ reason: 'quotaExceeded' }]
            }
          }
        }
      };

      mockedAxios.get.mockRejectedValueOnce(quotaError);

      const result = await service.searchVideos('psychology');

      expect(result).toBeDefined(); // Should fallback to mock data
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle network timeouts', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('timeout'));

      const result = await service.searchVideos('psychology');

      expect(result).toBeDefined();
    });

    it('should handle malformed API responses', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: null });

      const result = await service.searchVideos('psychology');

      expect(result).toBeDefined();
    });
  });

  describe('Cache Management', () => {
    beforeEach(() => {
      service = new YouTubeService(mockApiKey);
    });

    it('should cache search results with different parameters separately', async () => {
      mockedAxios.get
        .mockResolvedValueOnce(mockVideoSearchResponse)
        .mockResolvedValueOnce(mockVideoDetailsResponse)
        .mockResolvedValueOnce(mockVideoSearchResponse)
        .mockResolvedValueOnce(mockVideoDetailsResponse);

      await service.searchVideos('psychology', { maxResults: 5 });
      await service.searchVideos('psychology', { maxResults: 10 });

      // Should make separate API calls for different parameters
      expect(mockedAxios.get).toHaveBeenCalledTimes(4);
    });

    it('should use cache for identical requests', async () => {
      mockedAxios.get
        .mockResolvedValueOnce(mockVideoSearchResponse)
        .mockResolvedValueOnce(mockVideoDetailsResponse);

      await service.searchVideos('psychology');
      await service.searchVideos('psychology'); // Should use cache

      // Should only make API calls once
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });
  });
});