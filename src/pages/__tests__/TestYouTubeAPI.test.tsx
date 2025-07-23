import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TestYouTubeAPI from '../TestYouTubeAPI';

// Mock fetch
global.fetch = jest.fn();

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {component}
    </BrowserRouter>
  );
};

describe('TestYouTubeAPI Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
    
    // Mock environment variable
    process.env.REACT_APP_YOUTUBE_API_KEY = 'test-api-key-123456789';
  });

  afterEach(() => {
    delete process.env.REACT_APP_YOUTUBE_API_KEY;
  });

  test('renders page header and description', () => {
    renderWithRouter(<TestYouTubeAPI />);

    expect(screen.getByText('Teste Direto da API do YouTube')).toBeInTheDocument();
    expect(screen.getByText(/Esta página testa a API do YouTube diretamente/)).toBeInTheDocument();
  });

  test('displays test button', () => {
    renderWithRouter(<TestYouTubeAPI />);

    const button = screen.getByRole('button', { name: /Testar API do YouTube com Fetch/i });
    expect(button).toBeInTheDocument();
    expect(button).toBeEnabled();
  });

  test('shows error when no API key is present', async () => {
    delete process.env.REACT_APP_YOUTUBE_API_KEY;
    
    renderWithRouter(<TestYouTubeAPI />);

    const button = screen.getByRole('button', { name: /Testar API do YouTube com Fetch/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Erro de API')).toBeInTheDocument();
      expect(screen.getByText(/Nenhuma chave de API encontrada/)).toBeInTheDocument();
    });
  });

  test('shows loading state while testing API', async () => {
    (fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithRouter(<TestYouTubeAPI />);

    const button = screen.getByRole('button', { name: /Testar API do YouTube com Fetch/i });
    fireEvent.click(button);

    expect(screen.getByText('Testando API...')).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  test('displays successful API response', async () => {
    const mockResponse = {
      items: [
        {
          id: { videoId: 'video1' },
          snippet: {
            title: 'Carl Jung e a Sombra',
            channelTitle: 'Psychology Channel'
          }
        },
        {
          id: { videoId: 'video2' },
          snippet: {
            title: 'O Conceito de Sombra de Jung',
            channelTitle: 'Jung Studies'
          }
        }
      ]
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse
    });

    renderWithRouter(<TestYouTubeAPI />);

    const button = screen.getByRole('button', { name: /Testar API do YouTube com Fetch/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('✅ Chave de API está Funcionando!')).toBeInTheDocument();
      expect(screen.getByText('1. Carl Jung e a Sombra')).toBeInTheDocument();
      expect(screen.getByText('2. O Conceito de Sombra de Jung')).toBeInTheDocument();
      expect(screen.getByText('Canal: Psychology Channel')).toBeInTheDocument();
      expect(screen.getByText('Canal: Jung Studies')).toBeInTheDocument();
    });
  });

  test('displays API error response', async () => {
    const mockError = {
      error: {
        code: 403,
        message: 'The request is missing a valid API key.'
      }
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => mockError
    });

    renderWithRouter(<TestYouTubeAPI />);

    const button = screen.getByRole('button', { name: /Testar API do YouTube com Fetch/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Erro de API')).toBeInTheDocument();
      const errorContent = screen.getByText(/missing a valid API key/);
      expect(errorContent).toBeInTheDocument();
    });
  });

  test('handles network fetch error', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    renderWithRouter(<TestYouTubeAPI />);

    const button = screen.getByRole('button', { name: /Testar API do YouTube com Fetch/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Erro de API')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  test('displays debug information correctly', () => {
    renderWithRouter(<TestYouTubeAPI />);

    expect(screen.getByText('Informações de Debug:')).toBeInTheDocument();
    expect(screen.getByText(/Chave de API presente: ✅ Sim/)).toBeInTheDocument();
    expect(screen.getByText(/Prefixo da chave de API: test-ap\.\.\./)).toBeInTheDocument();
    expect(screen.getByText(/Abra o console do navegador/)).toBeInTheDocument();
  });

  test('shows correct debug info when API key is missing', () => {
    delete process.env.REACT_APP_YOUTUBE_API_KEY;
    
    renderWithRouter(<TestYouTubeAPI />);

    expect(screen.getByText(/Chave de API presente: ❌ Não/)).toBeInTheDocument();
    expect(screen.getByText(/Prefixo da chave de API: Não encontrada\.\.\./)).toBeInTheDocument();
  });

  test('logs API key prefix to console', async () => {
    renderWithRouter(<TestYouTubeAPI />);

    const button = screen.getByRole('button', { name: /Testar API do YouTube com Fetch/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(console.log).toHaveBeenCalledWith('Using API Key:', 'test-ap...');
    });
  });

  test('renders video links correctly', async () => {
    const mockResponse = {
      items: [
        {
          id: { videoId: 'abc123' },
          snippet: {
            title: 'Video Title',
            channelTitle: 'Channel Name'
          }
        }
      ]
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse
    });

    renderWithRouter(<TestYouTubeAPI />);

    const button = screen.getByRole('button', { name: /Testar API do YouTube com Fetch/i });
    fireEvent.click(button);

    await waitFor(() => {
      const link = screen.getByText('Assistir no YouTube →');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', 'https://www.youtube.com/watch?v=abc123');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  test('constructs correct API URL', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ items: [] })
    });

    renderWithRouter(<TestYouTubeAPI />);

    const button = screen.getByRole('button', { name: /Testar API do YouTube com Fetch/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'https://www.googleapis.com/youtube/v3/search?part=snippet&q=carl+jung+shadow&type=video&maxResults=3&key=test-api-key-123456789'
      );
    });
  });

  test('handles unknown error types', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce('String error');

    renderWithRouter(<TestYouTubeAPI />);

    const button = screen.getByRole('button', { name: /Testar API do YouTube com Fetch/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Erro de API')).toBeInTheDocument();
      expect(screen.getByText('Unknown error')).toBeInTheDocument();
    });
  });

  test('resets state before new API test', async () => {
    // First test with error
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('First error'));

    renderWithRouter(<TestYouTubeAPI />);

    const button = screen.getByRole('button', { name: /Testar API do YouTube com Fetch/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('First error')).toBeInTheDocument();
    });

    // Second test with success
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ items: [] })
    });

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.queryByText('First error')).not.toBeInTheDocument();
    });
  });
});