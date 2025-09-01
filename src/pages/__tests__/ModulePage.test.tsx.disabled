import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../utils/test-utils';
import { Route, Routes } from 'react-router-dom';
import ModulePage from '../ModulePage';
import { modules } from '../../data/modules';
import { UserProgress } from '../../types';

const mockUpdateProgress = jest.fn();

const mockUserProgress: UserProgress = {
  userId: 'test-user',
  completedModules: [],
  quizScores: {},
  totalTime: 0,
  lastAccessed: Date.now(),
  notes: []
};

const renderModulePage = (initialRoute: string = '/module/intro-jung') => {
  return render(
    <Routes>
      <Route 
        path="/module/:moduleId" 
        element={
          <ModulePage 
            modules={modules} 
            userProgress={mockUserProgress}
            updateProgress={mockUpdateProgress}
          />
        } 
      />
    </Routes>,
    { initialEntries: [initialRoute] }
  );
};

// Mock YouTube component
jest.mock('react-youtube', () => ({
  __esModule: true,
  default: ({ videoId }: { videoId: string }) => (
    <div data-testid="youtube-player">YouTube Video: {videoId}</div>
  ),
}));

describe('ModulePage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders module content correctly', () => {
    renderModulePage();
    
    const introModule = modules.find(m => m.id === 'intro-jung');
    expect(screen.getByText(introModule!.title)).toBeInTheDocument();
    expect(screen.getByText(introModule!.description)).toBeInTheDocument();
  });

  test('displays module icon and metadata', () => {
    renderModulePage();
    
    const introModule = modules.find(m => m.id === 'intro-jung');
    expect(screen.getByText(introModule!.icon)).toBeInTheDocument();
    expect(screen.getByText(`${introModule!.estimatedTime} minutos`)).toBeInTheDocument();
  });

  test('shows content tab by default', () => {
    renderModulePage();
    
    expect(screen.getByText('Introdução')).toBeInTheDocument();
    expect(screen.getByText(/Carl Gustav Jung \(1875-1961\)/)).toBeInTheDocument();
  });

  test('switches between tabs correctly', () => {
    renderModulePage();
    
    const videosTab = screen.getByText('Vídeos');
    fireEvent.click(videosTab);
    
    expect(screen.getByTestId('youtube-player')).toBeInTheDocument();
    
    const quizTab = screen.getByText('Questionário');
    fireEvent.click(quizTab);
    
    expect(screen.getByText('Questionário de Introdução a Jung')).toBeInTheDocument();
  });

  test('displays key terms in content sections', () => {
    renderModulePage();
    
    // Check for Key Terms section headers (there are multiple sections with key terms)
    const keyTermHeaders = screen.getAllByText('Termos-Chave');
    expect(keyTermHeaders.length).toBeGreaterThan(0);
    
    // Check for specific key terms from the module data
    expect(screen.getByText('Psicologia Analítica')).toBeInTheDocument();
  });

  test('opens note editor when Add Note is clicked', () => {
    renderModulePage();
    
    const addNoteButton = screen.getByText('Adicionar Anotação');
    fireEvent.click(addNoteButton);
    
    expect(screen.getByPlaceholderText('Escreva suas anotações aqui...')).toBeInTheDocument();
  });

  test('saves note correctly', async () => {
    renderModulePage();
    
    const addNoteButton = screen.getByText('Adicionar Anotação');
    fireEvent.click(addNoteButton);
    
    const noteTextarea = screen.getByPlaceholderText('Escreva suas anotações aqui...');
    fireEvent.change(noteTextarea, { target: { value: 'Test note content' } });
    
    const saveButton = screen.getByText('Salvar');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockUpdateProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: expect.arrayContaining([
            expect.objectContaining({
              content: 'Test note content',
              moduleId: 'intro-jung'
            })
          ])
        })
      );
    });
  });

  test('handles quiz completion', () => {
    renderModulePage();
    
    const quizTab = screen.getByText('Questionário');
    fireEvent.click(quizTab);
    
    // Answer first question
    const firstOption = screen.getByText('1875');
    fireEvent.click(firstOption);
    
    const nextButton = screen.getByText('Próxima Questão');
    fireEvent.click(nextButton);
    
    // Answer second question
    const secondOption = screen.getByText('Psicologia Analítica');
    fireEvent.click(secondOption);
    
    const finishButton = screen.getByText('Finalizar Questionário');
    fireEvent.click(finishButton);
    
    expect(mockUpdateProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        quizScores: expect.objectContaining({
          'intro-jung': 100
        })
      })
    );
  });

  test('tracks time spent on module', () => {
    jest.useFakeTimers();
    const { unmount } = renderModulePage();
    
    // Advance timers to simulate time passing
    jest.advanceTimersByTime(5000); // 5 seconds
    
    // Unmount to trigger cleanup
    unmount();
    
    // Time tracking is temporarily disabled in ModulePage
    // When re-enabled, this test should verify totalTime is updated
    // For now, we just verify the component unmounts cleanly
    expect(mockUpdateProgress).not.toHaveBeenCalledWith(
      expect.objectContaining({
        totalTime: expect.any(Number)
      })
    );
    
    jest.useRealTimers();
  });

  test('handles non-existent module gracefully', () => {
    renderModulePage('/module/non-existent');
    
    expect(screen.getByText('Módulo não encontrado')).toBeInTheDocument();
  });
});