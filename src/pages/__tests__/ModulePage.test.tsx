import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
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

const renderWithRouter = (initialRoute: string = '/module/intro-jung') => {
  window.history.pushState({}, 'Test page', initialRoute);
  
  return render(
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
      </Routes>
    </BrowserRouter>
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
    renderWithRouter();
    
    const introModule = modules.find(m => m.id === 'intro-jung');
    expect(screen.getByText(introModule!.title)).toBeInTheDocument();
    expect(screen.getByText(introModule!.description)).toBeInTheDocument();
  });

  test('displays module icon and metadata', () => {
    renderWithRouter();
    
    const introModule = modules.find(m => m.id === 'intro-jung');
    expect(screen.getByText(introModule!.icon)).toBeInTheDocument();
    expect(screen.getByText(`${introModule!.estimatedTime} minutes`)).toBeInTheDocument();
  });

  test('shows content tab by default', () => {
    renderWithRouter();
    
    expect(screen.getByText('Introduction')).toBeInTheDocument();
    expect(screen.getByText(/Carl Gustav Jung \(1875-1961\)/)).toBeInTheDocument();
  });

  test('switches between tabs correctly', () => {
    renderWithRouter();
    
    const videosTab = screen.getByText('Videos');
    fireEvent.click(videosTab);
    
    expect(screen.getByTestId('youtube-player')).toBeInTheDocument();
    
    const quizTab = screen.getByText('Quiz');
    fireEvent.click(quizTab);
    
    expect(screen.getByText('Introduction to Jung Quiz')).toBeInTheDocument();
  });

  test('displays key terms in content sections', () => {
    renderWithRouter();
    
    expect(screen.getByText('Analytical Psychology')).toBeInTheDocument();
    expect(screen.getByText(/Jung's approach to psychology/)).toBeInTheDocument();
  });

  test('opens note editor when Add Note is clicked', () => {
    renderWithRouter();
    
    const addNoteButton = screen.getByText('Add Note');
    fireEvent.click(addNoteButton);
    
    expect(screen.getByPlaceholderText('Write your notes here...')).toBeInTheDocument();
  });

  test('saves note correctly', async () => {
    renderWithRouter();
    
    const addNoteButton = screen.getByText('Add Note');
    fireEvent.click(addNoteButton);
    
    const noteTextarea = screen.getByPlaceholderText('Write your notes here...');
    fireEvent.change(noteTextarea, { target: { value: 'Test note content' } });
    
    const saveButton = screen.getByText('Save Note');
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
    renderWithRouter();
    
    const quizTab = screen.getByText('Quiz');
    fireEvent.click(quizTab);
    
    // Answer first question
    const firstOption = screen.getByText('1875');
    fireEvent.click(firstOption);
    
    const nextButton = screen.getByText('Next Question');
    fireEvent.click(nextButton);
    
    // Answer second question
    const secondOption = screen.getByText('Analytical Psychology');
    fireEvent.click(secondOption);
    
    const finishButton = screen.getByText('Finish Quiz');
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
    const { unmount } = renderWithRouter();
    
    // Simulate spending time on the module
    unmount();
    
    expect(mockUpdateProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        totalTime: expect.any(Number)
      })
    );
  });

  test('handles non-existent module gracefully', () => {
    renderWithRouter('/module/non-existent');
    
    expect(screen.getByText('Module not found')).toBeInTheDocument();
  });
});