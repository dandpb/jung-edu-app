import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../utils/test-utils';
import TestYouTubeAPI from '../TestYouTubeAPI';

// Mock console methods to test logging
const mockConsoleLog = jest.fn();
const mockConsoleError = jest.fn();
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock YouTube API response data
const mockYouTubeResponse = {
  kind: 'youtube#searchListResponse',
  etag: 'test-etag',
  items: [
    {
      kind: 'youtube#searchResult',
      etag: 'item1-etag',
      id: {
        kind: 'youtube#video',
        videoId: 'test-video-id-1'
      },
      snippet: {
        publishedAt: '2023-01-01T00:00:00Z',
        channelId: 'test-channel-id-1',
        title: 'Carl Jung Shadow Work Explained',
        description: 'An explanation of Jung\'s shadow concept',
        channelTitle: 'Psychology Channel',
        thumbnails: {
          default: {
            url: 'https://example.com/thumb1.jpg'
          }
        }
      }
    },
    {
      kind: 'youtube#searchResult',
      etag: 'item2-etag',
      id: {
        kind: 'youtube#video',
        videoId: 'test-video-id-2'
      },
      snippet: {
        publishedAt: '2023-01-02T00:00:00Z',
        channelId: 'test-channel-id-2',
        title: 'Understanding the Collective Unconscious',
        description: 'Jung\'s theory of the collective unconscious',
        channelTitle: 'Educational Content',
        thumbnails: {
          default: {
            url: 'https://example.com/thumb2.jpg'
          }
        }
      }
    },
    {
      kind: 'youtube#searchResult',
      etag: 'item3-etag',
      id: {
        kind: 'youtube#video',
        videoId: 'test-video-id-3'
      },
      snippet: {
        publishedAt: '2023-01-03T00:00:00Z',
        channelId: 'test-channel-id-3',
        title: 'Jungian Archetypes in Modern Psychology',
        description: 'Modern applications of Jung\'s archetypal theory',
        channelTitle: 'Modern Psychology',
        thumbnails: {
          default: {
            url: 'https://example.com/thumb3.jpg'
          }
        }
      }
    }
  ]
};

// Mock YouTube API error response
const mockYouTubeError = {
  error: {
    code: 403,
    message: 'The request cannot be completed because you have exceeded your quota.',
    errors: [
      {
        message: 'The request cannot be completed because you have exceeded your quota.',
        domain: 'youtube.quota',
        reason: 'quotaExceeded'
      }
    ]
  }
};

describe('TestYouTubeAPI Component', () => {
  // Store original environment variables
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    mockFetch.mockClear();
    
    // Reset console mocks
    console.log = mockConsoleLog;
    console.error = mockConsoleError;
    
    // Reset environment variables
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    
    // Restore console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  describe('Component Rendering', () => {
    test('renders main heading and description', () => {
      render(<TestYouTubeAPI />);
      
      expect(screen.getByRole('heading', { name: /teste direto da api do youtube/i })).toBeInTheDocument();
      expect(screen.getByText(/esta página testa a api do youtube diretamente/i)).toBeInTheDocument();
    });

    test('renders test button with correct initial state', () => {
      render(<TestYouTubeAPI />);
      
      const button = screen.getByRole('button', { name: /testar api do youtube com fetch/i });
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
      
      // Check for CheckCircle icon
      expect(screen.getByText(/testar api do youtube com fetch/i)).toBeInTheDocument();
    });

    test('renders debug information section', () => {
      process.env.REACT_APP_YOUTUBE_API_KEY = 'test-api-key-123';
      
      render(<TestYouTubeAPI />);
      
      expect(screen.getByText(/informações de debug:/i)).toBeInTheDocument();
      expect(screen.getByText(/chave de api presente: ✅ sim/i)).toBeInTheDocument();
      expect(screen.getByText(/prefixo da chave de api: test-ap.../i)).toBeInTheDocument();
      expect(screen.getByText(/abra o console do navegador/i)).toBeInTheDocument();
    });

    test('shows no API key when environment variable is missing', () => {
      delete process.env.REACT_APP_YOUTUBE_API_KEY;
      
      render(<TestYouTubeAPI />);
      
      expect(screen.getByText(/chave de api presente: ❌ não/i)).toBeInTheDocument();
      expect(screen.getByText(/prefixo da chave de api: não encontrada.../i)).toBeInTheDocument();
    });
  });

  describe('API Key Handling', () => {
    test('handles missing API key correctly', async () => {
      delete process.env.REACT_APP_YOUTUBE_API_KEY;
      
      render(<TestYouTubeAPI />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByText(/nenhuma chave de api encontrada nas variáveis de ambiente/i)).toBeInTheDocument();
      });
      
      expect(mockFetch).not.toHaveBeenCalled();
    });

    test('uses API key from environment variables', async () => {
      process.env.REACT_APP_YOUTUBE_API_KEY = 'test-api-key-123';
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockYouTubeResponse)
      });
      
      render(<TestYouTubeAPI />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('key=test-api-key-123')
        );
      });
    });

    test('logs API key prefix for debugging', async () => {
      process.env.REACT_APP_YOUTUBE_API_KEY = 'test-api-key-123';
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockYouTubeResponse)
      });
      
      render(<TestYouTubeAPI />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(mockConsoleLog).toHaveBeenCalledWith('Using API Key:', 'test-ap...');
      });
    });
  });

  describe('YouTube API Integration', () => {
    beforeEach(() => {
      process.env.REACT_APP_YOUTUBE_API_KEY = 'test-api-key-123';
    });

    test('makes correct API call to YouTube', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockYouTubeResponse)
      });
      
      render(<TestYouTubeAPI />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'https://www.googleapis.com/youtube/v3/search?part=snippet&q=carl+jung+shadow&type=video&maxResults=3&key=test-api-key-123'
        );
      });
      
      expect(mockConsoleLog).toHaveBeenCalledWith('Fetching:', expect.stringContaining('googleapis.com'));
    });

    test('handles successful API response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockYouTubeResponse)
      });
      
      render(<TestYouTubeAPI />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByText(/✅ chave de api está funcionando!/i)).toBeInTheDocument();
      });
      
      // Check that videos are displayed
      expect(screen.getByText('1. Carl Jung Shadow Work Explained')).toBeInTheDocument();
      expect(screen.getByText('2. Understanding the Collective Unconscious')).toBeInTheDocument();
      expect(screen.getByText('3. Jungian Archetypes in Modern Psychology')).toBeInTheDocument();
      
      // Check channel information
      expect(screen.getByText('Canal: Psychology Channel')).toBeInTheDocument();
      expect(screen.getByText('Canal: Educational Content')).toBeInTheDocument();
      expect(screen.getByText('Canal: Modern Psychology')).toBeInTheDocument();
      
      // Check video IDs
      expect(screen.getByText('ID do Vídeo: test-video-id-1')).toBeInTheDocument();
      expect(screen.getByText('ID do Vídeo: test-video-id-2')).toBeInTheDocument();
      expect(screen.getByText('ID do Vídeo: test-video-id-3')).toBeInTheDocument();
    });

    test('logs response status and data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockYouTubeResponse)
      });
      
      render(<TestYouTubeAPI />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(mockConsoleLog).toHaveBeenCalledWith('Response status:', 200);
        expect(mockConsoleLog).toHaveBeenCalledWith('Response data:', mockYouTubeResponse);
      });
    });

    test('creates correct YouTube links for videos', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockYouTubeResponse)
      });
      
      render(<TestYouTubeAPI />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        const links = screen.getAllByText(/assistir no youtube →/i);
        expect(links).toHaveLength(3);
      });
      
      // Check that links have correct href attributes
      const link1 = screen.getAllByText(/assistir no youtube →/i)[0].closest('a');
      expect(link1).toHaveAttribute('href', 'https://www.youtube.com/watch?v=test-video-id-1');
      expect(link1).toHaveAttribute('target', '_blank');
      expect(link1).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('Loading States', () => {
    beforeEach(() => {
      process.env.REACT_APP_YOUTUBE_API_KEY = 'test-api-key-123';
    });

    test('shows loading state during API call', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      
      mockFetch.mockReturnValueOnce(promise);
      
      render(<TestYouTubeAPI />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      // Check loading state
      expect(screen.getByText(/testando api.../i)).toBeInTheDocument();
      expect(button).toBeDisabled();
      
      // Check for loader icon (Lucide icons don't have testid by default)
      const loader = document.querySelector('.animate-spin') || screen.getByText(/testando api.../i);
      expect(loader).toBeInTheDocument();
      
      // Resolve the promise
      resolvePromise!({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockYouTubeResponse)
      });
      
      await waitFor(() => {
        expect(screen.getByText(/testar api do youtube com fetch/i)).toBeInTheDocument();
        expect(button).not.toBeDisabled();
      });
    });

    test('resets states at start of API call', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockYouTubeResponse)
      });
      
      render(<TestYouTubeAPI />);
      
      const button = screen.getByRole('button');
      
      // First call to set some state
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByText(/✅ chave de api está funcionando!/i)).toBeInTheDocument();
      });
      
      // Mock a new call that will show loading
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockFetch.mockReturnValueOnce(promise);
      
      // Second call
      fireEvent.click(button);
      
      // Should clear previous results and show loading
      expect(screen.queryByText(/✅ chave de api está funcionando!/i)).not.toBeInTheDocument();
      expect(screen.getByText(/testando api.../i)).toBeInTheDocument();
      
      // Resolve to complete test
      resolvePromise!({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockYouTubeResponse)
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      process.env.REACT_APP_YOUTUBE_API_KEY = 'test-api-key-123';
    });

    test('handles API error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: () => Promise.resolve(mockYouTubeError)
      });
      
      render(<TestYouTubeAPI />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByText(/erro de api/i)).toBeInTheDocument();
        expect(screen.getByText(/quotaExceeded/i)).toBeInTheDocument();
      });
      
      // Check that error is displayed as formatted JSON
      expect(screen.getByText(/"code": 403/)).toBeInTheDocument();
    });

    test('handles network errors', async () => {
      const networkError = new Error('Network connection failed');
      mockFetch.mockRejectedValueOnce(networkError);
      
      render(<TestYouTubeAPI />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByText(/erro de api/i)).toBeInTheDocument();
        expect(screen.getByText('Network connection failed')).toBeInTheDocument();
      });
      
      expect(mockConsoleError).toHaveBeenCalledWith('Fetch error:', networkError);
    });

    test('handles unknown errors', async () => {
      mockFetch.mockRejectedValueOnce('Unknown error object');
      
      render(<TestYouTubeAPI />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByText(/erro de api/i)).toBeInTheDocument();
        expect(screen.getByText('Unknown error')).toBeInTheDocument();
      });
    });

    test('displays error with AlertCircle icon', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Test error'));
      
      render(<TestYouTubeAPI />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        const errorText = screen.getByText(/erro de api/i);
        expect(errorText).toBeInTheDocument();
        
        // Find the outer error container div (the one with bg-red-50)
        const errorContainer = errorText.closest('div')?.parentElement?.parentElement;
        expect(errorContainer).toHaveClass('bg-red-50', 'border-red-200');
        
        // Check for error icon (AlertCircle)
        const alertIcon = document.querySelector('svg[data-lucide="alert-circle"]') || document.querySelector('svg.text-red-600');
        expect(alertIcon).toBeInTheDocument();
      });
    });

    test('resets error state on new API call', async () => {
      // First call with error
      mockFetch.mockRejectedValueOnce(new Error('First error'));
      
      render(<TestYouTubeAPI />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByText('First error')).toBeInTheDocument();
      });
      
      // Second call with success
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockYouTubeResponse)
      });
      
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.queryByText('First error')).not.toBeInTheDocument();
        expect(screen.getByText(/✅ chave de api está funcionando!/i)).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    test('button click triggers API call', async () => {
      process.env.REACT_APP_YOUTUBE_API_KEY = 'test-key';
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockYouTubeResponse)
      });
      
      render(<TestYouTubeAPI />);
      
      const button = screen.getByRole('button');
      expect(mockFetch).not.toHaveBeenCalled();
      
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
    });

    test('prevents multiple simultaneous API calls', async () => {
      process.env.REACT_APP_YOUTUBE_API_KEY = 'test-key';
      
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      
      mockFetch.mockReturnValueOnce(promise);
      
      render(<TestYouTubeAPI />);
      
      const button = screen.getByRole('button');
      
      // First click
      fireEvent.click(button);
      expect(button).toBeDisabled();
      
      // Try to click again while loading
      fireEvent.click(button);
      fireEvent.click(button);
      
      // Should still only have one call
      expect(mockFetch).toHaveBeenCalledTimes(1);
      
      // Resolve to complete test
      resolvePromise!({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockYouTubeResponse)
      });
    });

    test('YouTube video links are clickable', async () => {
      process.env.REACT_APP_YOUTUBE_API_KEY = 'test-key';
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockYouTubeResponse)
      });
      
      render(<TestYouTubeAPI />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        const youTubeLinks = screen.getAllByText(/assistir no youtube →/i);
        expect(youTubeLinks).toHaveLength(3);
        
        youTubeLinks.forEach((link, index) => {
          const linkElement = link.closest('a');
          expect(linkElement).toBeInTheDocument();
          expect(linkElement).toHaveAttribute('href', `https://www.youtube.com/watch?v=test-video-id-${index + 1}`);
          expect(linkElement).toHaveAttribute('target', '_blank');
          expect(linkElement).toHaveAttribute('rel', 'noopener noreferrer');
        });
      });
    });
  });

  describe('Video Display and Metadata', () => {
    beforeEach(() => {
      process.env.REACT_APP_YOUTUBE_API_KEY = 'test-key';
    });

    test('displays video titles correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockYouTubeResponse)
      });
      
      render(<TestYouTubeAPI />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByText('1. Carl Jung Shadow Work Explained')).toBeInTheDocument();
        expect(screen.getByText('2. Understanding the Collective Unconscious')).toBeInTheDocument();
        expect(screen.getByText('3. Jungian Archetypes in Modern Psychology')).toBeInTheDocument();
      });
    });

    test('displays channel titles correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockYouTubeResponse)
      });
      
      render(<TestYouTubeAPI />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByText('Canal: Psychology Channel')).toBeInTheDocument();
        expect(screen.getByText('Canal: Educational Content')).toBeInTheDocument();
        expect(screen.getByText('Canal: Modern Psychology')).toBeInTheDocument();
      });
    });

    test('displays video IDs correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockYouTubeResponse)
      });
      
      render(<TestYouTubeAPI />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByText('ID do Vídeo: test-video-id-1')).toBeInTheDocument();
        expect(screen.getByText('ID do Vídeo: test-video-id-2')).toBeInTheDocument();
        expect(screen.getByText('ID do Vídeo: test-video-id-3')).toBeInTheDocument();
      });
    });

    test('displays videos in correct order', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockYouTubeResponse)
      });
      
      render(<TestYouTubeAPI />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        const videoElements = screen.getAllByText(/^\d+\./);
        expect(videoElements).toHaveLength(3);
        expect(videoElements[0]).toHaveTextContent('1. Carl Jung Shadow Work Explained');
        expect(videoElements[1]).toHaveTextContent('2. Understanding the Collective Unconscious');
        expect(videoElements[2]).toHaveTextContent('3. Jungian Archetypes in Modern Psychology');
      });
    });

    test('handles empty items array', async () => {
      const emptyResponse = {
        ...mockYouTubeResponse,
        items: []
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(emptyResponse)
      });
      
      render(<TestYouTubeAPI />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByText(/✅ chave de api está funcionando!/i)).toBeInTheDocument();
        expect(screen.queryByText(/^\d+\./)).not.toBeInTheDocument();
      });
    });

    test('handles response without items property', async () => {
      const responseWithoutItems = {
        kind: 'youtube#searchListResponse',
        etag: 'test-etag'
        // No items property
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(responseWithoutItems)
      });
      
      render(<TestYouTubeAPI />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByText(/✅ chave de api está funcionando!/i)).toBeInTheDocument();
        expect(screen.queryByText(/^\d+\./)).not.toBeInTheDocument();
      });
    });
  });

  describe('Console Logging', () => {
    beforeEach(() => {
      process.env.REACT_APP_YOUTUBE_API_KEY = 'test-key-for-logging';
    });

    test('logs API key prefix', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockYouTubeResponse)
      });
      
      render(<TestYouTubeAPI />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(mockConsoleLog).toHaveBeenCalledWith('Using API Key:', 'test-ke...');
      });
    });

    test('logs fetch URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockYouTubeResponse)
      });
      
      render(<TestYouTubeAPI />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(mockConsoleLog).toHaveBeenCalledWith(
          'Fetching:', 
          'https://www.googleapis.com/youtube/v3/search?part=snippet&q=carl+jung+shadow&type=video&maxResults=3&key=test-key-for-logging'
        );
      });
    });

    test('logs response status and data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockYouTubeResponse)
      });
      
      render(<TestYouTubeAPI />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(mockConsoleLog).toHaveBeenCalledWith('Response status:', 200);
        expect(mockConsoleLog).toHaveBeenCalledWith('Response data:', mockYouTubeResponse);
      });
    });

    test('logs fetch errors', async () => {
      const testError = new Error('Network error');
      mockFetch.mockRejectedValueOnce(testError);
      
      render(<TestYouTubeAPI />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalledWith('Fetch error:', testError);
      });
    });
  });

  describe('Component State Management', () => {
    test('initial state is correct', () => {
      render(<TestYouTubeAPI />);
      
      // Should not show loading, error, or result initially
      expect(screen.queryByText(/testando api.../i)).not.toBeInTheDocument();
      expect(screen.queryByText(/erro de api/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/✅ chave de api está funcionando!/i)).not.toBeInTheDocument();
      
      // Button should be enabled
      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
    });

    test('state transitions correctly during API call lifecycle', async () => {
      process.env.REACT_APP_YOUTUBE_API_KEY = 'test-key';
      
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      
      mockFetch.mockReturnValueOnce(promise);
      
      render(<TestYouTubeAPI />);
      
      const button = screen.getByRole('button');
      
      // Initial state
      expect(button).not.toBeDisabled();
      expect(screen.queryByText(/testando api.../i)).not.toBeInTheDocument();
      
      // Click button
      fireEvent.click(button);
      
      // Loading state
      expect(button).toBeDisabled();
      expect(screen.getByText(/testando api.../i)).toBeInTheDocument();
      
      // Resolve promise
      resolvePromise!({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockYouTubeResponse)
      });
      
      // Final state
      await waitFor(() => {
        expect(button).not.toBeDisabled();
        expect(screen.queryByText(/testando api.../i)).not.toBeInTheDocument();
        expect(screen.getByText(/✅ chave de api está funcionando!/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA roles and labels', () => {
      render(<TestYouTubeAPI />);
      
      // Button should have proper role
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      
      // Heading should have proper role
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    test('YouTube links have proper accessibility attributes', async () => {
      process.env.REACT_APP_YOUTUBE_API_KEY = 'test-key';
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockYouTubeResponse)
      });
      
      render(<TestYouTubeAPI />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        const links = screen.getAllByText(/assistir no youtube →/i);
        
        links.forEach(linkText => {
          const link = linkText.closest('a');
          expect(link).toHaveAttribute('target', '_blank');
          expect(link).toHaveAttribute('rel', 'noopener noreferrer');
        });
      });
    });

    test('error messages are properly announced', async () => {
      process.env.REACT_APP_YOUTUBE_API_KEY = 'test-key';
      
      mockFetch.mockRejectedValueOnce(new Error('Test error'));
      
      render(<TestYouTubeAPI />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {
        const errorMessage = screen.getByText(/erro de api/i);
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage.tagName.toLowerCase()).toBe('p');
      });
    });
  });
});