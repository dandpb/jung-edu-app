import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import TestYouTubeAPI from '../TestYouTubeAPI';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  Loader2: ({ className }: { className?: string }) => <div className={className} data-testid="loader2-icon" />,
  CheckCircle: ({ className }: { className?: string }) => <div className={className} data-testid="check-circle-icon" />,
  AlertCircle: ({ className }: { className?: string }) => <div className={className} data-testid="alert-circle-icon" />
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <MemoryRouter initialEntries={['/']}>
      {component}
    </MemoryRouter>
  );
};

// Mock environment variable
const originalEnv = process.env;

describe('TestYouTubeAPI - Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    // Reset process.env for each test
    process.env = { ...originalEnv };
    
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Set default API key
    process.env.REACT_APP_YOUTUBE_API_KEY = 'test_api_key_123';
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders main heading and description', () => {
      renderWithRouter(<TestYouTubeAPI />);
      
      expect(screen.getByText('Teste Direto da API do YouTube')).toBeInTheDocument();
      expect(screen.getByText(/Esta página testa a API do YouTube/)).toBeInTheDocument();
    });

    it('renders test button with correct initial state', () => {
      renderWithRouter(<TestYouTubeAPI />);
      
      const button = screen.getByRole('button', { name: /Testar API do YouTube com Fetch/i });
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
    });

    it('renders debug information section', () => {
      renderWithRouter(<TestYouTubeAPI />);
      
      expect(screen.getByText('Informações de Debug:')).toBeInTheDocument();
      expect(screen.getByText(/Abra o console do navegador/)).toBeInTheDocument();
    });

    it('renders info box with correct styling', () => {
      renderWithRouter(<TestYouTubeAPI />);
      
      const infoBox = screen.getByText(/Esta página testa a API do YouTube/).closest('div');
      expect(infoBox).toHaveClass('bg-blue-50', 'border', 'border-blue-200');
    });
  });

  describe('API Key Handling', () => {
    it('displays API key status when key is present', () => {
      process.env.REACT_APP_YOUTUBE_API_KEY = 'test_api_key_123';
      
      renderWithRouter(<TestYouTubeAPI />);
      
      expect(screen.getByText(/Chave de API presente: ✅ Sim/)).toBeInTheDocument();
      expect(screen.getByText(/Prefixo da chave de API: test_ap.../)).toBeInTheDocument();
    });

    it('displays API key status when key is missing', () => {
      delete process.env.REACT_APP_YOUTUBE_API_KEY;
      
      renderWithRouter(<TestYouTubeAPI />);
      
      expect(screen.getByText(/Chave de API presente: ❌ Não/)).toBeInTheDocument();
      expect(screen.getByText(/Prefixo da chave de API: Não encontrada.../)).toBeInTheDocument();
    });

    it('shows error when API key is missing during test', async () => {
      delete process.env.REACT_APP_YOUTUBE_API_KEY;
      
      renderWithRouter(<TestYouTubeAPI />);
      
      const button = screen.getByRole('button', { name: /Testar API do YouTube com Fetch/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Nenhuma chave de API encontrada nas variáveis de ambiente')).toBeInTheDocument();
        expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
        expect(screen.getByText('Erro de API')).toBeInTheDocument();
      });
    });

    it('logs API key prefix correctly', async () => {
      const apiKey = 'test_api_key_123';
      process.env.REACT_APP_YOUTUBE_API_KEY = apiKey;

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ items: [] })
      });

      renderWithRouter(<TestYouTubeAPI />);
      
      const button = screen.getByRole('button', { name: /Testar API do YouTube com Fetch/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith('Using API Key:', 'test_ap...');
      });
    });
  });

  describe('API Testing Functionality', () => {
    beforeEach(() => {
      process.env.REACT_APP_YOUTUBE_API_KEY = 'test_api_key_123';
    });

    it('shows loading state during API call', async () => {
      // Mock a delayed response
      mockFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ items: [] })
        }), 100))
      );

      renderWithRouter(<TestYouTubeAPI />);
      
      const button = screen.getByRole('button', { name: /Testar API do YouTube com Fetch/i });
      fireEvent.click(button);

      // Check loading state
      expect(screen.getByText('Testando API...')).toBeInTheDocument();
      expect(screen.getByTestId('loader2-icon')).toBeInTheDocument();
      expect(button).toBeDisabled();

      // Wait for loading to finish
      await waitFor(() => {
        expect(screen.queryByText('Testando API...')).not.toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('handles successful API response with multiple videos', async () => {
      const mockResponse = {
        items: [
          {
            id: { videoId: 'test123' },
            snippet: {
              title: 'Carl Jung Shadow Self',
              channelTitle: 'Psychology Channel',
              description: 'Test description about shadow self'
            }
          },
          {
            id: { videoId: 'test456' },
            snippet: {
              title: 'Understanding the Shadow',
              channelTitle: 'Educational Channel',
              description: 'Another test description'
            }
          },
          {
            id: { videoId: 'test789' },
            snippet: {
              title: 'Jung Psychology Basics',
              channelTitle: 'Learning Hub',
              description: 'Third test description'
            }
          }
        ]
      };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      });

      renderWithRouter(<TestYouTubeAPI />);
      
      const button = screen.getByRole('button', { name: /Testar API do YouTube com Fetch/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('✅ Chave de API está Funcionando!')).toBeInTheDocument();
        expect(screen.getByText('1. Carl Jung Shadow Self')).toBeInTheDocument();
        expect(screen.getByText('2. Understanding the Shadow')).toBeInTheDocument();
        expect(screen.getByText('3. Jung Psychology Basics')).toBeInTheDocument();
        expect(screen.getByText('Canal: Psychology Channel')).toBeInTheDocument();
        expect(screen.getByText('ID do Vídeo: test123')).toBeInTheDocument();
      });

      // Check YouTube links
      const links = screen.getAllByText(/Assistir no YouTube/);
      expect(links).toHaveLength(3);
      expect(links[0].closest('a')).toHaveAttribute('href', 'https://www.youtube.com/watch?v=test123');
      expect(links[0].closest('a')).toHaveAttribute('target', '_blank');
      expect(links[0].closest('a')).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('handles successful API response with no items', async () => {
      const mockResponse = { items: [] };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      });

      renderWithRouter(<TestYouTubeAPI />);
      
      const button = screen.getByRole('button', { name: /Testar API do YouTube com Fetch/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('✅ Chave de API está Funcionando!')).toBeInTheDocument();
        // Should not show any video items
        expect(screen.queryByText(/Canal:/)).not.toBeInTheDocument();
      });
    });

    it('handles API error response with detailed error info', async () => {
      const errorResponse = {
        error: {
          code: 403,
          message: 'API key not valid',
          details: [
            {
              reason: 'keyInvalid',
              message: 'Bad Request'
            }
          ]
        }
      };

      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        json: () => Promise.resolve(errorResponse)
      });

      renderWithRouter(<TestYouTubeAPI />);
      
      const button = screen.getByRole('button', { name: /Testar API do YouTube com Fetch/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Erro de API')).toBeInTheDocument();
        expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
        expect(screen.getByText(/"code": 403/)).toBeInTheDocument();
        expect(screen.getByText(/API key not valid/)).toBeInTheDocument();
      });
    });

    it('handles various HTTP error status codes', async () => {
      const testCases = [
        { status: 400, message: 'Bad Request' },
        { status: 401, message: 'Unauthorized' },
        { status: 429, message: 'Too Many Requests' },
        { status: 500, message: 'Internal Server Error' }
      ];

      for (const testCase of testCases) {
        const errorResponse = {
          error: {
            code: testCase.status,
            message: testCase.message
          }
        };

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: testCase.status,
          json: () => Promise.resolve(errorResponse)
        });

        renderWithRouter(<TestYouTubeAPI />);
        
        const button = screen.getByRole('button', { name: /Testar API do YouTube com Fetch/i });
        fireEvent.click(button);

        await waitFor(() => {
          expect(screen.getByText('Erro de API')).toBeInTheDocument();
          expect(screen.getByText(new RegExp(`"code": ${testCase.status}`))).toBeInTheDocument();
        });

        // Clean up for next iteration
        screen.getByText('Erro de API').closest('div')?.remove;
      }
    });

    it('handles network/fetch errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      renderWithRouter(<TestYouTubeAPI />);
      
      const button = screen.getByRole('button', { name: /Testar API do YouTube com Fetch/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
        expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
      });
    });

    it('handles unknown error type', async () => {
      mockFetch.mockRejectedValue('String error');

      renderWithRouter(<TestYouTubeAPI />);
      
      const button = screen.getByRole('button', { name: /Testar API do YouTube com Fetch/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Unknown error')).toBeInTheDocument();
      });
    });

    it('makes correct API call with proper parameters', async () => {
      const apiKey = 'test_api_key_123';
      process.env.REACT_APP_YOUTUBE_API_KEY = apiKey;

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ items: [] })
      });

      renderWithRouter(<TestYouTubeAPI />);
      
      const button = screen.getByRole('button', { name: /Testar API do YouTube com Fetch/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&q=carl+jung+shadow&type=video&maxResults=3&key=${apiKey}`
        );
      });

      expect(console.log).toHaveBeenCalledWith('Fetching:', expect.stringContaining('googleapis.com/youtube/v3/search'));
    });

    it('logs response status and data', async () => {
      const mockResponse = { items: [] };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      });

      renderWithRouter(<TestYouTubeAPI />);
      
      const button = screen.getByRole('button', { name: /Testar API do YouTube com Fetch/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith('Response status:', 200);
        expect(console.log).toHaveBeenCalledWith('Response data:', mockResponse);
      });
    });
  });

  describe('State Management', () => {
    beforeEach(() => {
      process.env.REACT_APP_YOUTUBE_API_KEY = 'test_api_key_123';
    });

    it('resets state when starting new test', async () => {
      // First, create an error state
      mockFetch.mockRejectedValue(new Error('First error'));

      renderWithRouter(<TestYouTubeAPI />);
      
      const button = screen.getByRole('button', { name: /Testar API do YouTube com Fetch/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('First error')).toBeInTheDocument();
      });

      // Now mock a successful response
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ items: [] })
      });

      // Click again
      fireEvent.click(button);

      // Should not see the old error immediately
      expect(screen.queryByText('First error')).not.toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.queryByText('Erro de API')).not.toBeInTheDocument();
      });
    });

    it('clears previous results when starting new test', async () => {
      // First successful call
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          items: [
            {
              id: { videoId: 'test123' },
              snippet: {
                title: 'Old Result',
                channelTitle: 'Old Channel',
                description: 'Old description'
              }
            }
          ]
        })
      });

      renderWithRouter(<TestYouTubeAPI />);
      
      const button = screen.getByRole('button', { name: /Testar API do YouTube com Fetch/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Old Result')).toBeInTheDocument();
      });

      // Second call - should clear previous results during loading
      mockFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ items: [] })
        }), 100))
      );

      fireEvent.click(button);

      // During loading, old results should be gone
      expect(screen.queryByText('Old Result')).not.toBeInTheDocument();
    });

    it('handles state transitions correctly', async () => {
      renderWithRouter(<TestYouTubeAPI />);
      
      const button = screen.getByRole('button', { name: /Testar API do YouTube com Fetch/i });
      
      // Initial state
      expect(button).not.toBeDisabled();
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('loader2-icon')).not.toBeInTheDocument();
      
      // Trigger loading state
      mockFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ items: [] })
        }), 100))
      );

      fireEvent.click(button);

      // Loading state
      expect(button).toBeDisabled();
      expect(screen.getByTestId('loader2-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('check-circle-icon')).not.toBeInTheDocument();
      
      // Wait for completion
      await waitFor(() => {
        expect(button).not.toBeDisabled();
        expect(screen.queryByTestId('loader2-icon')).not.toBeInTheDocument();
        expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('User Interactions', () => {
    beforeEach(() => {
      process.env.REACT_APP_YOUTUBE_API_KEY = 'test_api_key_123';
    });

    it('supports keyboard interaction', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ items: [] })
      });

      renderWithRouter(<TestYouTubeAPI />);
      
      const button = screen.getByRole('button', { name: /Testar API do YouTube com Fetch/i });
      button.focus();
      
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });

    it('supports space key interaction', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ items: [] })
      });

      renderWithRouter(<TestYouTubeAPI />);
      
      const button = screen.getByRole('button', { name: /Testar API do YouTube com Fetch/i });
      button.focus();
      
      fireEvent.keyDown(button, { key: ' ', code: 'Space' });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });

    it('prevents multiple simultaneous API calls', async () => {
      mockFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ items: [] })
        }), 100))
      );

      renderWithRouter(<TestYouTubeAPI />);
      
      const button = screen.getByRole('button', { name: /Testar API do YouTube com Fetch/i });
      
      // Click multiple times rapidly
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      // Should only make one API call
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(button).toBeDisabled();
    });

    it('allows new API call after previous one completes', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ items: [] })
      });

      renderWithRouter(<TestYouTubeAPI />);
      
      const button = screen.getByRole('button', { name: /Testar API do YouTube com Fetch/i });
      
      // First call
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(button).not.toBeDisabled();
      });

      // Second call should be allowed
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Accessibility and Visual Feedback', () => {
    it('has proper ARIA labels and roles', () => {
      renderWithRouter(<TestYouTubeAPI />);
      
      const button = screen.getByRole('button', { name: /Testar API do YouTube com Fetch/i });
      expect(button).toBeInTheDocument();
      
      const heading = screen.getByRole('heading', { name: 'Teste Direto da API do YouTube' });
      expect(heading).toBeInTheDocument();
      
      const subHeading = screen.getByText('Informações de Debug:');
      expect(subHeading).toBeInTheDocument();
    });

    it('provides proper visual feedback for different states', async () => {
      renderWithRouter(<TestYouTubeAPI />);
      
      // Initial state
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
      
      // Loading state
      mockFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ items: [] })
        }), 100))
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(screen.getByTestId('loader2-icon')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.queryByTestId('loader2-icon')).not.toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('uses proper color coding for different states', async () => {
      renderWithRouter(<TestYouTubeAPI />);
      
      // Error state
      mockFetch.mockRejectedValue(new Error('Test error'));
      
      const button = screen.getByRole('button', { name: /Testar API do YouTube com Fetch/i });
      fireEvent.click(button);

      await waitFor(() => {
        const errorContainer = screen.getByText('Erro de API').closest('div');
        expect(errorContainer).toHaveClass('bg-red-50', 'border-red-200');
      });

      // Success state
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ items: [] })
      });

      fireEvent.click(button);

      await waitFor(() => {
        const successContainer = screen.getByText('✅ Chave de API está Funcionando!').closest('div');
        expect(successContainer).toHaveClass('bg-green-50', 'border-green-200');
      });
    });

    it('formats JSON errors properly', async () => {
      const complexError = {
        error: {
          code: 400,
          message: 'Bad Request',
          errors: [
            { domain: 'youtube.parameter', reason: 'invalid', message: 'Invalid parameter' }
          ]
        }
      };

      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve(complexError)
      });

      renderWithRouter(<TestYouTubeAPI />);
      
      const button = screen.getByRole('button', { name: /Testar API do YouTube com Fetch/i });
      fireEvent.click(button);

      await waitFor(() => {
        const errorText = screen.getByText(/"code": 400/);
        expect(errorText).toBeInTheDocument();
        expect(errorText.tagName).toBe('PRE'); // Should be formatted as preformatted text
        expect(errorText).toHaveClass('whitespace-pre-wrap');
      });
    });

    it('handles long video titles and descriptions gracefully', async () => {
      const mockResponse = {
        items: [
          {
            id: { videoId: 'test123' },
            snippet: {
              title: 'This is a very long video title that should be handled gracefully by the component without breaking the layout',
              channelTitle: 'Very Long Channel Name That Should Also Be Handled Properly',
              description: 'This is a very long description that goes on and on and should be displayed properly without causing layout issues or breaking the component structure'
            }
          }
        ]
      };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      });

      renderWithRouter(<TestYouTubeAPI />);
      
      const button = screen.getByRole('button', { name: /Testar API do YouTube com Fetch/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/This is a very long video title/)).toBeInTheDocument();
        expect(screen.getByText(/Very Long Channel Name/)).toBeInTheDocument();
        expect(screen.getByText(/This is a very long description/)).toBeInTheDocument();
      });
    });
  });

  describe('Console Logging', () => {
    beforeEach(() => {
      process.env.REACT_APP_YOUTUBE_API_KEY = 'test_api_key_123';
    });

    it('logs fetch errors to console', async () => {
      const testError = new Error('Network failure');
      mockFetch.mockRejectedValue(testError);

      renderWithRouter(<TestYouTubeAPI />);
      
      const button = screen.getByRole('button', { name: /Testar API do YouTube com Fetch/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Fetch error:', testError);
      });
    });

    it('logs response data for successful calls', async () => {
      const mockResponse = { items: [] };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      });

      renderWithRouter(<TestYouTubeAPI />);
      
      const button = screen.getByRole('button', { name: /Testar API do YouTube com Fetch/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith('Response data:', mockResponse);
      });
    });

    it('logs response status for all calls', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ items: [] })
      });

      renderWithRouter(<TestYouTubeAPI />);
      
      const button = screen.getByRole('button', { name: /Testar API do YouTube com Fetch/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith('Response status:', 200);
      });
    });
  });
});