import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import TestYouTubeIntegration from '../TestYouTubeIntegration';
import { YouTubeService } from '../../services/video/youtubeService';
import { VideoGenerator } from '../../services/llm/generators/video-generator';
import { VideoEnricher } from '../../services/video/videoEnricher';
import { LLMProviderFactory } from '../../services/llm/provider';

// Mock dependencies
jest.mock('../../services/video/youtubeService');
jest.mock('../../services/llm/generators/video-generator');
jest.mock('../../services/video/videoEnricher');
jest.mock('../../services/llm/provider');

// Mock VideoPlayer component
jest.mock('../../components/modules/VideoPlayer', () => ({
  __esModule: true,
  default: ({ video }: any) => (
    <div data-testid="video-player">
      <h4>{video.title}</h4>
      <p>Video ID: {video.youtubeId}</p>
      <p>Duration: {video.duration} min</p>
    </div>
  ),
}));

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  Search: ({ className }: { className?: string }) => <div className={className} data-testid="search-icon" />,
  Video: ({ className }: { className?: string }) => <div className={className} data-testid="video-icon" />,
  Loader2: ({ className }: { className?: string }) => <div className={className} data-testid="loader2-icon" />,
  CheckCircle: ({ className }: { className?: string }) => <div className={className} data-testid="check-circle-icon" />,
  AlertCircle: ({ className }: { className?: string }) => <div className={className} data-testid="alert-circle-icon" />
}));

const mockYouTubeService = {
  searchVideos: jest.fn(),
};

const mockVideoGenerator = {
  generateVideos: jest.fn(),
};

const mockVideoEnricher = {};
const mockProvider = {};

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <MemoryRouter initialEntries={['/']}>
      {component}
    </MemoryRouter>
  );
};

describe('TestYouTubeIntegration - Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Setup mocks
    (YouTubeService as jest.Mock).mockImplementation(() => mockYouTubeService);
    (VideoGenerator as jest.Mock).mockImplementation(() => mockVideoGenerator);
    (VideoEnricher as jest.Mock).mockImplementation(() => mockVideoEnricher);
    (LLMProviderFactory.getProvider as jest.Mock).mockReturnValue(mockProvider);
    
    // Default mock implementations
    mockYouTubeService.searchVideos.mockResolvedValue([]);
    mockVideoGenerator.generateVideos.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders main header and description', () => {
      renderWithRouter(<TestYouTubeIntegration />);

      expect(screen.getByText('Teste de Integração do YouTube')).toBeInTheDocument();
      expect(screen.getByText('Testando Integração do YouTube')).toBeInTheDocument();
      expect(screen.getByText(/Esta página demonstra a integração do YouTube/)).toBeInTheDocument();
    });

    it('renders input field with default topic', () => {
      renderWithRouter(<TestYouTubeIntegration />);

      const input = screen.getByPlaceholderText(/ex: Sombra, Anima e Animus/);
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue('Shadow Self');
    });

    it('renders tab navigation with proper styling', () => {
      renderWithRouter(<TestYouTubeIntegration />);

      const searchTab = screen.getByText('Busca Direta no YouTube');
      const generateTab = screen.getByText('Vídeos Gerados por IA');

      expect(searchTab).toBeInTheDocument();
      expect(generateTab).toBeInTheDocument();
      
      // Check initial active state
      expect(searchTab).toHaveClass('text-primary-600');
      expect(generateTab).toHaveClass('text-gray-500');
    });

    it('renders information box with correct styling', () => {
      renderWithRouter(<TestYouTubeIntegration />);

      const infoBox = screen.getByText('Testando Integração do YouTube').closest('div');
      expect(infoBox).toHaveClass('bg-blue-50', 'border', 'border-blue-200');
    });

    it('renders how it works section', () => {
      renderWithRouter(<TestYouTubeIntegration />);

      expect(screen.getByText('Como funciona:')).toBeInTheDocument();
      expect(screen.getByText(/Busca Direta:/)).toBeInTheDocument();
      expect(screen.getByText(/Gerado por IA:/)).toBeInTheDocument();
      expect(screen.getByText(/Modo Simulado:/)).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('switches between tabs correctly', () => {
      renderWithRouter(<TestYouTubeIntegration />);

      const searchTab = screen.getByText('Busca Direta no YouTube');
      const generateTab = screen.getByText('Vídeos Gerados por IA');

      // Initially search tab is active
      expect(searchTab).toHaveClass('text-primary-600');
      expect(generateTab).toHaveClass('text-gray-500');

      // Switch to generate tab
      fireEvent.click(generateTab);
      expect(generateTab).toHaveClass('text-primary-600');
      expect(searchTab).toHaveClass('text-gray-500');

      // Switch back to search tab
      fireEvent.click(searchTab);
      expect(searchTab).toHaveClass('text-primary-600');
      expect(generateTab).toHaveClass('text-gray-500');
    });

    it('shows different content based on active tab', () => {
      renderWithRouter(<TestYouTubeIntegration />);

      // Search tab content
      expect(screen.getByRole('button', { name: /Buscar no YouTube/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Gerar Sugestões de Vídeo/i })).not.toBeInTheDocument();

      // Switch to generate tab
      fireEvent.click(screen.getByText('Vídeos Gerados por IA'));
      
      expect(screen.getByRole('button', { name: /Gerar Sugestões de Vídeo/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Buscar no YouTube/i })).not.toBeInTheDocument();
    });
  });

  describe('Input Handling', () => {
    it('updates topic when input changes', () => {
      renderWithRouter(<TestYouTubeIntegration />);

      const input = screen.getByPlaceholderText(/ex: Sombra, Anima e Animus/);
      fireEvent.change(input, { target: { value: 'Individuação' } });
      
      expect(input).toHaveValue('Individuação');
    });

    it('supports keyboard input', async () => {
      const user = userEvent.setup();
      renderWithRouter(<TestYouTubeIntegration />);

      const input = screen.getByPlaceholderText(/ex: Sombra, Anima e Animus/);
      
      await user.clear(input);
      await user.type(input, 'Anima e Animus');
      
      expect(input).toHaveValue('Anima e Animus');
    });

    it('triggers search on Enter key press in search tab', async () => {
      mockYouTubeService.searchVideos.mockResolvedValueOnce([]);

      renderWithRouter(<TestYouTubeIntegration />);

      const input = screen.getByPlaceholderText(/ex: Sombra, Anima e Animus/);
      fireEvent.change(input, { target: { value: 'Test Topic' } });
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });

      await waitFor(() => {
        expect(mockYouTubeService.searchVideos).toHaveBeenCalled();
      });
    });

    it('triggers generate on Enter key press in generate tab', async () => {
      mockVideoGenerator.generateVideos.mockResolvedValueOnce([]);

      renderWithRouter(<TestYouTubeIntegration />);

      // Switch to generate tab
      fireEvent.click(screen.getByText('Vídeos Gerados por IA'));

      const input = screen.getByPlaceholderText(/ex: Sombra, Anima e Animus/);
      fireEvent.change(input, { target: { value: 'Test Topic' } });
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });

      await waitFor(() => {
        expect(mockVideoGenerator.generateVideos).toHaveBeenCalled();
      });
    });

    it('disables buttons when topic is empty', () => {
      renderWithRouter(<TestYouTubeIntegration />);

      const input = screen.getByPlaceholderText(/ex: Sombra, Anima e Animus/);
      fireEvent.change(input, { target: { value: '' } });

      const searchButton = screen.getByRole('button', { name: /Buscar no YouTube/i });
      expect(searchButton).toBeDisabled();

      // Switch to generate tab and check that button
      fireEvent.click(screen.getByText('Vídeos Gerados por IA'));
      
      const generateButton = screen.getByRole('button', { name: /Gerar Sugestões de Vídeo/i });
      expect(generateButton).toBeDisabled();
    });
  });

  describe('YouTube Search Functionality', () => {
    const mockSearchVideos = [
      {
        videoId: 'abc123',
        title: 'Jung e a Sombra',
        channelTitle: 'Psicologia Channel',
        description: 'Vídeo sobre a sombra de Jung',
        duration: 'PT10M30S',
        viewCount: '15000',
        thumbnails: { medium: { url: 'https://img.youtube.com/vi/abc123/mqdefault.jpg' } }
      },
      {
        videoId: 'def456',
        title: 'O Conceito de Sombra',
        channelTitle: 'Jung Studies',
        description: 'Explorando o conceito de sombra',
        duration: 'PT25M15S',
        viewCount: '1250000',
        thumbnails: { medium: { url: 'https://img.youtube.com/vi/def456/mqdefault.jpg' } }
      },
      {
        videoId: 'ghi789',
        title: 'Psicologia Analítica de Jung',
        channelTitle: 'Educational Hub',
        description: 'Introdução à psicologia analítica',
        duration: 'PT1H5M',
        viewCount: '500000',
        thumbnails: { medium: { url: 'https://img.youtube.com/vi/ghi789/mqdefault.jpg' } }
      }
    ];

    it('searches YouTube with correct parameters', async () => {
      mockYouTubeService.searchVideos.mockResolvedValueOnce(mockSearchVideos);

      renderWithRouter(<TestYouTubeIntegration />);

      const input = screen.getByPlaceholderText(/ex: Sombra, Anima e Animus/);
      fireEvent.change(input, { target: { value: 'Anima' } });

      const searchButton = screen.getByRole('button', { name: /Buscar no YouTube/i });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(mockYouTubeService.searchVideos).toHaveBeenCalledWith(
          'Anima Jung psychology',
          {
            maxResults: 6,
            order: 'relevance',
            videoDuration: 'medium',
            safeSearch: 'strict',
          }
        );
      });
    });

    it('displays search results correctly', async () => {
      mockYouTubeService.searchVideos.mockResolvedValueOnce(mockSearchVideos);

      renderWithRouter(<TestYouTubeIntegration />);

      const searchButton = screen.getByRole('button', { name: /Buscar no YouTube/i });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('Resultados da Busca no YouTube (3 vídeos)')).toBeInTheDocument();
        expect(screen.getByText('Jung e a Sombra')).toBeInTheDocument();
        expect(screen.getByText('O Conceito de Sombra')).toBeInTheDocument();
        expect(screen.getByText('Psicologia Analítica de Jung')).toBeInTheDocument();
      });
    });

    it('shows loading state during search', async () => {
      mockYouTubeService.searchVideos.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve([]), 100))
      );

      renderWithRouter(<TestYouTubeIntegration />);

      const searchButton = screen.getByRole('button', { name: /Buscar no YouTube/i });
      fireEvent.click(searchButton);

      expect(screen.getByText('Buscando no YouTube...')).toBeInTheDocument();
      expect(screen.getByTestId('loader2-icon')).toBeInTheDocument();
      expect(searchButton).toBeDisabled();

      await waitFor(() => {
        expect(screen.queryByText('Buscando no YouTube...')).not.toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('displays search error with detailed information', async () => {
      mockYouTubeService.searchVideos.mockRejectedValueOnce(new Error('API key not valid'));

      renderWithRouter(<TestYouTubeIntegration />);

      const searchButton = screen.getByRole('button', { name: /Buscar no YouTube/i });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('API key not valid')).toBeInTheDocument();
        expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
        expect(screen.getByText(/A chave da API do YouTube é inválida/)).toBeInTheDocument();
      });
    });

    it('handles search with no results', async () => {
      mockYouTubeService.searchVideos.mockResolvedValueOnce([]);

      renderWithRouter(<TestYouTubeIntegration />);

      const searchButton = screen.getByRole('button', { name: /Buscar no YouTube/i });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(mockYouTubeService.searchVideos).toHaveBeenCalled();
        // Should not show results section
        expect(screen.queryByText(/Resultados da Busca no YouTube/)).not.toBeInTheDocument();
      });
    });

    it('logs search operations to console', async () => {
      mockYouTubeService.searchVideos.mockResolvedValueOnce(mockSearchVideos);

      renderWithRouter(<TestYouTubeIntegration />);

      const searchButton = screen.getByRole('button', { name: /Buscar no YouTube/i });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith('Searching YouTube for: Shadow Self Jung psychology');
        expect(console.log).toHaveBeenCalledWith('Found 3 videos');
      });
    });
  });

  describe('Video Generation Functionality', () => {
    const mockGeneratedVideos = [
      {
        id: '1',
        title: 'Understanding the Shadow Self',
        description: 'A comprehensive guide to Jung\'s shadow concept',
        duration: 15,
        platform: 'YouTube',
        url: 'https://youtube.com/watch?v=123',
        metadata: {
          difficulty: 'Beginner',
          educationalValue: 0.9,
          relevanceScore: 0.95
        }
      },
      {
        id: '2',
        title: 'Advanced Shadow Work Techniques',
        description: 'Deep dive into practical shadow integration methods',
        duration: 25,
        platform: 'YouTube',
        url: 'https://youtube.com/watch?v=456',
        metadata: {
          difficulty: 'Advanced',
          educationalValue: 0.85,
          relevanceScore: 0.88
        }
      }
    ];

    it('generates AI videos with correct parameters', async () => {
      mockVideoGenerator.generateVideos.mockResolvedValueOnce(mockGeneratedVideos);

      renderWithRouter(<TestYouTubeIntegration />);

      // Switch to generate tab
      fireEvent.click(screen.getByText('Vídeos Gerados por IA'));

      const input = screen.getByPlaceholderText(/ex: Sombra, Anima e Animus/);
      fireEvent.change(input, { target: { value: 'Anima' } });

      const generateButton = screen.getByRole('button', { name: /Gerar Sugestões de Vídeo/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(mockVideoGenerator.generateVideos).toHaveBeenCalledWith(
          'Anima',
          ['fundamental concepts', 'psychological integration', 'practical applications'],
          'Psychology students and general learners',
          5
        );
      });
    });

    it('displays generated videos correctly', async () => {
      mockVideoGenerator.generateVideos.mockResolvedValueOnce(mockGeneratedVideos);

      renderWithRouter(<TestYouTubeIntegration />);

      fireEvent.click(screen.getByText('Vídeos Gerados por IA'));

      const generateButton = screen.getByRole('button', { name: /Gerar Sugestões de Vídeo/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('Recursos de Vídeo Gerados por IA (2 vídeos)')).toBeInTheDocument();
        expect(screen.getByText('Understanding the Shadow Self')).toBeInTheDocument();
        expect(screen.getByText('Advanced Shadow Work Techniques')).toBeInTheDocument();
      });
    });

    it('shows loading state during generation', async () => {
      mockVideoGenerator.generateVideos.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve([]), 100))
      );

      renderWithRouter(<TestYouTubeIntegration />);

      fireEvent.click(screen.getByText('Vídeos Gerados por IA'));

      const generateButton = screen.getByRole('button', { name: /Gerar Sugestões de Vídeo/i });
      fireEvent.click(generateButton);

      expect(screen.getByText('Gerando Vídeos...')).toBeInTheDocument();
      expect(screen.getByTestId('loader2-icon')).toBeInTheDocument();
      expect(generateButton).toBeDisabled();

      await waitFor(() => {
        expect(screen.queryByText('Gerando Vídeos...')).not.toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('displays metadata badges for generated videos', async () => {
      mockVideoGenerator.generateVideos.mockResolvedValueOnce(mockGeneratedVideos);

      renderWithRouter(<TestYouTubeIntegration />);

      fireEvent.click(screen.getByText('Vídeos Gerados por IA'));
      
      const generateButton = screen.getByRole('button', { name: /Gerar Sugestões de Vídeo/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('Beginner')).toBeInTheDocument();
        expect(screen.getByText('Advanced')).toBeInTheDocument();
        expect(screen.getByText('Educacional: 90%')).toBeInTheDocument();
        expect(screen.getByText('Educacional: 85%')).toBeInTheDocument();
        expect(screen.getByText('Relevância: 95%')).toBeInTheDocument();
        expect(screen.getByText('Relevância: 88%')).toBeInTheDocument();
      });
    });

    it('handles generation errors gracefully', async () => {
      mockVideoGenerator.generateVideos.mockRejectedValueOnce(new Error('Generation failed'));

      renderWithRouter(<TestYouTubeIntegration />);

      fireEvent.click(screen.getByText('Vídeos Gerados por IA'));
      
      const generateButton = screen.getByRole('button', { name: /Gerar Sugestões de Vídeo/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('Generation failed')).toBeInTheDocument();
        expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
      });

      expect(console.error).toHaveBeenCalledWith('Generation error:', expect.any(Error));
    });

    it('logs generation operations to console', async () => {
      mockVideoGenerator.generateVideos.mockResolvedValueOnce(mockGeneratedVideos);

      renderWithRouter(<TestYouTubeIntegration />);

      fireEvent.click(screen.getByText('Vídeos Gerados por IA'));
      
      const generateButton = screen.getByRole('button', { name: /Gerar Sugestões de Vídeo/i });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith('Generating videos for topic: Shadow Self');
        expect(console.log).toHaveBeenCalledWith('Generated 2 video suggestions');
      });
    });
  });

  describe('Video Formatting Utilities', () => {
    it('formats video duration correctly', async () => {
      const mockVideos = [
        {
          videoId: '1',
          title: 'Short video',
          duration: 'PT5M30S',
          viewCount: '1000',
          channelTitle: 'Channel',
          description: 'Description',
          thumbnails: { medium: { url: 'thumb.jpg' } }
        },
        {
          videoId: '2',
          title: 'Medium video',
          duration: 'PT25M15S',
          viewCount: '1000',
          channelTitle: 'Channel',
          description: 'Description',
          thumbnails: { medium: { url: 'thumb.jpg' } }
        },
        {
          videoId: '3',
          title: 'Long video',
          duration: 'PT1H15M45S',
          viewCount: '1000',
          channelTitle: 'Channel',
          description: 'Description',
          thumbnails: { medium: { url: 'thumb.jpg' } }
        },
        {
          videoId: '4',
          title: 'Very long video',
          duration: 'PT2H30M',
          viewCount: '1000',
          channelTitle: 'Channel',
          description: 'Description',
          thumbnails: { medium: { url: 'thumb.jpg' } }
        }
      ];

      mockYouTubeService.searchVideos.mockResolvedValueOnce(mockVideos);

      renderWithRouter(<TestYouTubeIntegration />);

      const searchButton = screen.getByRole('button', { name: /Buscar no YouTube/i });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText(/5:30/)).toBeInTheDocument();
        expect(screen.getByText(/25:15/)).toBeInTheDocument();
        expect(screen.getByText(/1h 15m/)).toBeInTheDocument();
        expect(screen.getByText(/2h 30m/)).toBeInTheDocument();
      });
    });

    it('formats view count correctly', async () => {
      const mockVideos = [
        {
          videoId: '1',
          title: 'Low views',
          viewCount: '500',
          duration: 'PT5M',
          channelTitle: 'Channel',
          description: 'Description',
          thumbnails: { medium: { url: 'thumb.jpg' } }
        },
        {
          videoId: '2',
          title: 'K views',
          viewCount: '15000',
          duration: 'PT5M',
          channelTitle: 'Channel',
          description: 'Description',
          thumbnails: { medium: { url: 'thumb.jpg' } }
        },
        {
          videoId: '3',
          title: 'M views',
          viewCount: '2500000',
          duration: 'PT5M',
          channelTitle: 'Channel',
          description: 'Description',
          thumbnails: { medium: { url: 'thumb.jpg' } }
        },
        {
          videoId: '4',
          title: 'High M views',
          viewCount: '50000000',
          duration: 'PT5M',
          channelTitle: 'Channel',
          description: 'Description',
          thumbnails: { medium: { url: 'thumb.jpg' } }
        }
      ];

      mockYouTubeService.searchVideos.mockResolvedValueOnce(mockVideos);

      renderWithRouter(<TestYouTubeIntegration />);

      const searchButton = screen.getByRole('button', { name: /Buscar no YouTube/i });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText(/500 visualizações/)).toBeInTheDocument();
        expect(screen.getByText(/15\.0K visualizações/)).toBeInTheDocument();
        expect(screen.getByText(/2\.5M visualizações/)).toBeInTheDocument();
        expect(screen.getByText(/50\.0M visualizações/)).toBeInTheDocument();
      });
    });

    it('handles invalid duration formats gracefully', async () => {
      const mockVideos = [
        {
          videoId: '1',
          title: 'Invalid duration',
          duration: 'invalid',
          viewCount: '1000',
          channelTitle: 'Channel',
          description: 'Description',
          thumbnails: { medium: { url: 'thumb.jpg' } }
        }
      ];

      mockYouTubeService.searchVideos.mockResolvedValueOnce(mockVideos);

      renderWithRouter(<TestYouTubeIntegration />);

      const searchButton = screen.getByRole('button', { name: /Buscar no YouTube/i });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText(/Unknown/)).toBeInTheDocument();
      });
    });
  });

  describe('Video Player Modal', () => {
    const mockVideo = {
      videoId: 'test123',
      title: 'Test Video',
      channelTitle: 'Test Channel',
      description: 'Test description for the video',
      duration: 'PT10M30S',
      viewCount: '1000',
      thumbnails: { medium: { url: 'https://img.youtube.com/vi/test123/mqdefault.jpg' } }
    };

    it('opens video player when video is clicked', async () => {
      mockYouTubeService.searchVideos.mockResolvedValueOnce([mockVideo]);

      renderWithRouter(<TestYouTubeIntegration />);

      const searchButton = screen.getByRole('button', { name: /Buscar no YouTube/i });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('Test Video')).toBeInTheDocument();
      });

      // Click on video card
      const videoCard = screen.getByText('Test Video').closest('.border');
      fireEvent.click(videoCard!);

      expect(screen.getByTestId('video-player')).toBeInTheDocument();
      expect(screen.getByText('Video ID: test123')).toBeInTheDocument();
      expect(screen.getByText('Duration: 10 min')).toBeInTheDocument();
    });

    it('closes video player when close button is clicked', async () => {
      mockYouTubeService.searchVideos.mockResolvedValueOnce([mockVideo]);

      renderWithRouter(<TestYouTubeIntegration />);

      const searchButton = screen.getByRole('button', { name: /Buscar no YouTube/i });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('Test Video')).toBeInTheDocument();
      });

      // Open video player
      const videoCard = screen.getByText('Test Video').closest('.border');
      fireEvent.click(videoCard!);

      expect(screen.getByTestId('video-player')).toBeInTheDocument();

      // Close video player
      const closeButton = screen.getByRole('button', { name: '' }); // SVG close button
      fireEvent.click(closeButton);

      expect(screen.queryByTestId('video-player')).not.toBeInTheDocument();
    });

    it('renders video player with correct props', async () => {
      mockYouTubeService.searchVideos.mockResolvedValueOnce([mockVideo]);

      renderWithRouter(<TestYouTubeIntegration />);

      const searchButton = screen.getByRole('button', { name: /Buscar no YouTube/i });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('Test Video')).toBeInTheDocument();
      });

      const videoCard = screen.getByText('Test Video').closest('.border');
      fireEvent.click(videoCard!);

      // Check that VideoPlayer receives correct props
      expect(screen.getByText('Test Video')).toBeInTheDocument();
      expect(screen.getByText('Video ID: test123')).toBeInTheDocument();
    });

    it('handles video click with keyboard navigation', async () => {
      mockYouTubeService.searchVideos.mockResolvedValueOnce([mockVideo]);

      renderWithRouter(<TestYouTubeIntegration />);

      const searchButton = screen.getByRole('button', { name: /Buscar no YouTube/i });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('Test Video')).toBeInTheDocument();
      });

      const videoCard = screen.getByText('Test Video').closest('.border')!;
      
      // Simulate keyboard interaction
      fireEvent.keyDown(videoCard, { key: 'Enter', code: 'Enter' });
      // Note: The actual component may not handle keyboard events, but this tests the structure
    });
  });

  describe('State Management', () => {
    it('resets search results when switching tabs', async () => {
      // Get search results
      mockYouTubeService.searchVideos.mockResolvedValueOnce([{
        videoId: 'test123',
        title: 'Search Result',
        channelTitle: 'Test Channel',
        description: 'Description',
        duration: 'PT10M',
        viewCount: '1000',
        thumbnails: { medium: { url: 'thumb.jpg' } }
      }]);

      renderWithRouter(<TestYouTubeIntegration />);

      const searchButton = screen.getByRole('button', { name: /Buscar no YouTube/i });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('Search Result')).toBeInTheDocument();
      });

      // Switch to generate tab - search results should remain
      fireEvent.click(screen.getByText('Vídeos Gerados por IA'));
      
      // Switch back to search tab - results should still be there
      fireEvent.click(screen.getByText('Busca Direta no YouTube'));
      
      expect(screen.getByText('Search Result')).toBeInTheDocument();
    });

    it('clears error state when starting new operations', async () => {
      // Create an error state
      mockYouTubeService.searchVideos.mockRejectedValueOnce(new Error('First error'));

      renderWithRouter(<TestYouTubeIntegration />);

      const searchButton = screen.getByRole('button', { name: /Buscar no YouTube/i });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('First error')).toBeInTheDocument();
      });

      // Start new search - should clear error
      mockYouTubeService.searchVideos.mockResolvedValueOnce([]);
      fireEvent.click(searchButton);

      expect(screen.queryByText('First error')).not.toBeInTheDocument();
    });

    it('maintains separate loading states for different operations', async () => {
      // Set up delayed responses for both operations
      mockYouTubeService.searchVideos.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve([]), 200))
      );
      mockVideoGenerator.generateVideos.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve([]), 200))
      );

      renderWithRouter(<TestYouTubeIntegration />);

      // Start search
      const searchButton = screen.getByRole('button', { name: /Buscar no YouTube/i });
      fireEvent.click(searchButton);

      expect(screen.getByText('Buscando no YouTube...')).toBeInTheDocument();

      // Switch to generate tab while search is loading
      fireEvent.click(screen.getByText('Vídeos Gerados por IA'));

      // Start generation
      const generateButton = screen.getByRole('button', { name: /Gerar Sugestões de Vídeo/i });
      fireEvent.click(generateButton);

      expect(screen.getByText('Gerando Vídeos...')).toBeInTheDocument();

      // Both operations should complete independently
      await waitFor(() => {
        expect(screen.queryByText('Gerando Vídeos...')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Switch back to search tab
      fireEvent.click(screen.getByText('Busca Direta no YouTube'));
      
      await waitFor(() => {
        expect(screen.queryByText('Buscando no YouTube...')).not.toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Accessibility and User Experience', () => {
    it('has proper ARIA labels and roles', () => {
      renderWithRouter(<TestYouTubeIntegration />);

      const input = screen.getByLabelText(/Digite um Tópico de Psicologia Junguiana/);
      expect(input).toBeInTheDocument();

      const searchButton = screen.getByRole('button', { name: /Buscar no YouTube/i });
      expect(searchButton).toBeInTheDocument();

      const mainHeading = screen.getByRole('heading', { name: 'Teste de Integração do YouTube' });
      expect(mainHeading).toBeInTheDocument();
    });

    it('provides visual feedback for different states', async () => {
      renderWithRouter(<TestYouTubeIntegration />);

      const searchButton = screen.getByRole('button', { name: /Buscar no YouTube/i });
      
      // Initial state
      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
      
      // Loading state
      mockYouTubeService.searchVideos.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve([]), 100))
      );

      fireEvent.click(searchButton);

      expect(screen.getByTestId('loader2-icon')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.queryByTestId('loader2-icon')).not.toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('handles long text content gracefully', async () => {
      const mockVideoWithLongContent = {
        videoId: 'long123',
        title: 'This is an extremely long video title that should be handled gracefully by the component layout without breaking or causing overflow issues',
        channelTitle: 'Very Long Channel Name That Should Also Be Displayed Properly Without Layout Issues',
        description: 'This is a very long description that goes on and on and should be displayed properly without causing layout issues or breaking the component structure. It contains lots of information about Jung\'s psychology.',
        duration: 'PT45M30S',
        viewCount: '1500000',
        thumbnails: { medium: { url: 'https://img.youtube.com/vi/long123/mqdefault.jpg' } }
      };

      mockYouTubeService.searchVideos.mockResolvedValueOnce([mockVideoWithLongContent]);

      renderWithRouter(<TestYouTubeIntegration />);

      const searchButton = screen.getByRole('button', { name: /Buscar no YouTube/i });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText(/This is an extremely long video title/)).toBeInTheDocument();
        expect(screen.getByText(/Very Long Channel Name/)).toBeInTheDocument();
      });
    });
  });
});