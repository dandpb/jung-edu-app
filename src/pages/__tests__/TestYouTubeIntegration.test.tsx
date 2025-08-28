import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
jest.mock('../../components/modules/VideoPlayer', () => ({
  __esModule: true,
  default: ({ video }: any) => (
    <div data-testid="video-player">
      <h4>{video.title}</h4>
      <p>Video ID: {video.youtubeId}</p>
    </div>
  ),
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

describe('TestYouTubeIntegration Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
    
    (YouTubeService as jest.Mock).mockImplementation(() => mockYouTubeService);
    (VideoGenerator as jest.Mock).mockImplementation(() => mockVideoGenerator);
    (VideoEnricher as jest.Mock).mockImplementation(() => mockVideoEnricher);
    (LLMProviderFactory.getProvider as jest.Mock).mockReturnValue(mockProvider);
  });

  test('renders page header and description', () => {
    renderWithRouter(<TestYouTubeIntegration />);

    expect(screen.getByText('Teste de Integração do YouTube')).toBeInTheDocument();
    expect(screen.getByText('Testando Integração do YouTube')).toBeInTheDocument();
    expect(screen.getByText(/Esta página demonstra a integração do YouTube/)).toBeInTheDocument();
  });

  test('renders input field with default topic', () => {
    renderWithRouter(<TestYouTubeIntegration />);

    const input = screen.getByPlaceholderText(/ex: Sombra, Anima e Animus/);
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('Shadow Self');
  });

  test('renders tab navigation', () => {
    renderWithRouter(<TestYouTubeIntegration />);

    expect(screen.getByText('Busca Direta no YouTube')).toBeInTheDocument();
    expect(screen.getByText('Vídeos Gerados por IA')).toBeInTheDocument();
  });

  test('switches between tabs', () => {
    renderWithRouter(<TestYouTubeIntegration />);

    const searchTab = screen.getByText('Busca Direta no YouTube');
    const generateTab = screen.getByText('Vídeos Gerados por IA');

    // Initially search tab is active
    expect(searchTab).toHaveClass('text-primary-600');
    expect(generateTab).toHaveClass('text-gray-500');

    // Click generate tab
    fireEvent.click(generateTab);
    expect(generateTab).toHaveClass('text-primary-600');
    expect(searchTab).toHaveClass('text-gray-500');
  });

  test('updates topic when input changes', () => {
    renderWithRouter(<TestYouTubeIntegration />);

    const input = screen.getByPlaceholderText(/ex: Sombra, Anima e Animus/);
    fireEvent.change(input, { target: { value: 'Individuação' } });
    
    expect(input).toHaveValue('Individuação');
  });

  test('searches YouTube when search button is clicked', async () => {
    const mockVideos = [
      {
        videoId: 'abc123',
        title: 'Jung e a Sombra',
        channelTitle: 'Psicologia Channel',
        description: 'Vídeo sobre a sombra',
        duration: 'PT10M30S',
        viewCount: '15000',
        thumbnails: { medium: { url: 'thumbnail1.jpg' } }
      },
      {
        videoId: 'def456',
        title: 'O Conceito de Sombra',
        channelTitle: 'Jung Studies',
        description: 'Explorando o conceito',
        duration: 'PT25M15S',
        viewCount: '1250000',
        thumbnails: { medium: { url: 'thumbnail2.jpg' } }
      }
    ];

    mockYouTubeService.searchVideos.mockResolvedValueOnce(mockVideos);

    renderWithRouter(<TestYouTubeIntegration />);

    const searchButton = screen.getByRole('button', { name: /Buscar no YouTube/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(mockYouTubeService.searchVideos).toHaveBeenCalledWith(
        'Shadow Self Jung psychology',
        {
          maxResults: 6,
          order: 'relevance',
          videoDuration: 'medium',
          safeSearch: 'strict',
        }
      );
    });

    // Wait for the videos to be rendered
    await waitFor(() => {
      expect(screen.getByText('Jung e a Sombra')).toBeInTheDocument();
    });

    expect(screen.getByText('Resultados da Busca no YouTube (2 vídeos)')).toBeInTheDocument();
    expect(screen.getByText('O Conceito de Sombra')).toBeInTheDocument();
  });

  test('displays loading state during search', async () => {
    mockYouTubeService.searchVideos.mockImplementation(() => new Promise(() => {}));

    renderWithRouter(<TestYouTubeIntegration />);

    const searchButton = screen.getByRole('button', { name: /Buscar no YouTube/i });
    fireEvent.click(searchButton);

    expect(screen.getByText('Buscando no YouTube...')).toBeInTheDocument();
    expect(searchButton).toBeDisabled();
  });

  test('displays error when search fails', async () => {
    mockYouTubeService.searchVideos.mockRejectedValueOnce(new Error('API key not valid'));

    renderWithRouter(<TestYouTubeIntegration />);

    const searchButton = screen.getByRole('button', { name: /Buscar no YouTube/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('API key not valid')).toBeInTheDocument();
      expect(screen.getByText(/A chave da API do YouTube é inválida/)).toBeInTheDocument();
    });
  });

  test('generates AI videos when generate button is clicked', async () => {
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
      }
    ];

    mockVideoGenerator.generateVideos.mockResolvedValueOnce(mockGeneratedVideos);

    renderWithRouter(<TestYouTubeIntegration />);

    // Switch to generate tab
    fireEvent.click(screen.getByText('Vídeos Gerados por IA'));

    const generateButton = screen.getByRole('button', { name: /Gerar Sugestões de Vídeo/i });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(mockVideoGenerator.generateVideos).toHaveBeenCalledWith(
        'Shadow Self',
        ['fundamental concepts', 'psychological integration', 'practical applications'],
        'Psychology students and general learners',
        5
      );
    });

    // Wait for the generated videos to render
    await waitFor(() => {
      expect(screen.getByText('Understanding the Shadow Self')).toBeInTheDocument();
    });

    expect(screen.getByText('Recursos de Vídeo Gerados por IA (1 vídeos)')).toBeInTheDocument();
  });

  test('formats video duration correctly', async () => {
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
        title: 'Long video',
        duration: 'PT1H15M45S',
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
      expect(screen.getByText(/1h 15m/)).toBeInTheDocument();
    });
  });

  test('formats view count correctly', async () => {
    const mockVideos = [
      {
        videoId: '1',
        title: 'Video 1',
        viewCount: '500',
        duration: 'PT5M',
        channelTitle: 'Channel',
        description: 'Description',
        thumbnails: { medium: { url: 'thumb.jpg' } }
      },
      {
        videoId: '2',
        title: 'Video 2',
        viewCount: '15000',
        duration: 'PT5M',
        channelTitle: 'Channel',
        description: 'Description',
        thumbnails: { medium: { url: 'thumb.jpg' } }
      },
      {
        videoId: '3',
        title: 'Video 3',
        viewCount: '2500000',
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
    });
  });

  test('opens video player when video is clicked', async () => {
    const mockVideos = [{
      videoId: 'test123',
      title: 'Test Video',
      channelTitle: 'Test Channel',
      description: 'Test description',
      duration: 'PT10M',
      viewCount: '1000',
      thumbnails: { medium: { url: 'thumb.jpg' } }
    }];

    mockYouTubeService.searchVideos.mockResolvedValueOnce(mockVideos);

    renderWithRouter(<TestYouTubeIntegration />);

    const searchButton = screen.getByRole('button', { name: /Buscar no YouTube/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('Test Video')).toBeInTheDocument();
    });

    // Click on video
    const videoCard = screen.getByText('Test Video').closest('.border');
    fireEvent.click(videoCard!);

    expect(screen.getByTestId('video-player')).toBeInTheDocument();
    expect(screen.getByText('Video ID: test123')).toBeInTheDocument();
  });

  test('closes video player when close button is clicked', async () => {
    const mockVideos = [{
      videoId: 'test123',
      title: 'Test Video',
      channelTitle: 'Test Channel',
      description: 'Test description',
      duration: 'PT10M',
      viewCount: '1000',
      thumbnails: { medium: { url: 'thumb.jpg' } }
    }];

    mockYouTubeService.searchVideos.mockResolvedValueOnce(mockVideos);

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

  test('disables buttons when topic is empty', () => {
    renderWithRouter(<TestYouTubeIntegration />);

    const input = screen.getByPlaceholderText(/ex: Sombra, Anima e Animus/);
    fireEvent.change(input, { target: { value: '' } });

    const searchButton = screen.getByRole('button', { name: /Buscar no YouTube/i });
    expect(searchButton).toBeDisabled();
  });

  test('triggers search on Enter key press', async () => {
    mockYouTubeService.searchVideos.mockResolvedValueOnce([]);

    renderWithRouter(<TestYouTubeIntegration />);

    const input = screen.getByPlaceholderText(/ex: Sombra, Anima e Animus/);
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });

    await waitFor(() => {
      expect(mockYouTubeService.searchVideos).toHaveBeenCalled();
    });
  });

  test('displays metadata badges for generated videos', async () => {
    const mockGeneratedVideos = [{
      id: '1',
      title: 'Test Video',
      description: 'Description',
      duration: 15,
      metadata: {
        difficulty: 'Intermediate',
        educationalValue: 0.85,
        relevanceScore: 0.92
      }
    }];

    mockVideoGenerator.generateVideos.mockResolvedValueOnce(mockGeneratedVideos);

    renderWithRouter(<TestYouTubeIntegration />);

    fireEvent.click(screen.getByText('Vídeos Gerados por IA'));
    
    const generateButton = screen.getByRole('button', { name: /Gerar Sugestões de Vídeo/i });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText('Intermediate')).toBeInTheDocument();
      expect(screen.getByText('Educacional: 85%')).toBeInTheDocument();
      expect(screen.getByText('Relevância: 92%')).toBeInTheDocument();
    });
  });

  test('displays how it works section', () => {
    renderWithRouter(<TestYouTubeIntegration />);

    expect(screen.getByText('Como funciona:')).toBeInTheDocument();
    expect(screen.getByText(/Busca Direta:/)).toBeInTheDocument();
    expect(screen.getByText(/Gerado por IA:/)).toBeInTheDocument();
    expect(screen.getByText(/Modo Simulado:/)).toBeInTheDocument();
  });

  test('logs console messages during operations', async () => {
    mockYouTubeService.searchVideos.mockResolvedValueOnce([]);

    renderWithRouter(<TestYouTubeIntegration />);

    const searchButton = screen.getByRole('button', { name: /Buscar no YouTube/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(console.log).toHaveBeenCalledWith('Searching YouTube for: Shadow Self Jung psychology');
      expect(console.log).toHaveBeenCalledWith('Found 0 videos');
    });
  });

  test('handles generate error gracefully', async () => {
    mockVideoGenerator.generateVideos.mockRejectedValueOnce(new Error('Generation failed'));

    renderWithRouter(<TestYouTubeIntegration />);

    fireEvent.click(screen.getByText('Vídeos Gerados por IA'));
    
    const generateButton = screen.getByRole('button', { name: /Gerar Sugestões de Vídeo/i });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText('Generation failed')).toBeInTheDocument();
      expect(console.error).toHaveBeenCalledWith('Generation error:', expect.any(Error));
    });
  });
});