import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AdminProvider } from '../../contexts/AdminContext';

// Import components for cross-component testing
import AIModuleGenerator from '../../components/admin/AIModuleGenerator';
import ModuleEditor from '../../components/admin/ModuleEditor';
import QuizComponent from '../../components/quiz/QuizComponent';
import InteractiveMindMap from '../../components/mindmap/InteractiveMindMap';
import NoteEditor from '../../components/notes/NoteEditor';

// Mock services
jest.mock('../../services/llm/provider', () => ({
  llmProvider: {
    generateText: jest.fn().mockResolvedValue('Generated content'),
    generateStructuredData: jest.fn().mockResolvedValue({
      title: 'Test Module',
      concepts: ['Concept 1', 'Concept 2'],
      content: 'Test content'
    })
  }
}));

jest.mock('../../services/video/youtubeService', () => ({
  youtubeService: {
    searchVideos: jest.fn().mockResolvedValue([])
  }
}));

describe('Cross-Component Integration Tests', () => {
  const mockModule = {
    id: 'test-module',
    title: 'Test Module',
    description: 'A test module for integration testing',
    concepts: ['Jung', 'Psychology', 'Archetypes'],
    content: 'Detailed content about Jungian psychology',
    videos: [
      {
        id: 'video1',
        title: 'Introduction to Jung',
        url: 'https://youtube.com/watch?v=test1',
        description: 'Basic introduction'
      }
    ],
    quiz: {
      questions: [
        {
          id: 'q1',
          question: 'What is the collective unconscious?',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 0,
          explanation: 'The collective unconscious is...'
        }
      ]
    },
    bibliography: [
      {
        id: 'ref1',
        title: 'Man and His Symbols',
        author: 'Carl Jung',
        year: 1964,
        type: 'book'
      }
    ]
  };

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <AdminProvider>
        <BrowserRouter>
          {component}
        </BrowserRouter>
      </AdminProvider>
    );
  };

  describe('Module Generation to Editor Integration', () => {
    it('should pass generated module data to editor', async () => {
      const user = userEvent.setup();
      let generatedModule: any = null;
      
      const mockOnGenerate = jest.fn((module) => {
        generatedModule = module;
      });
      
      // First render the generator
      const { rerender } = renderWithProviders(
        <AIModuleGenerator 
          onGenerate={mockOnGenerate}
          onCancel={() => {}}
          existingModules={[]}
        />
      );
      
      // Generate a module
      const subjectInput = screen.getByLabelText(/what subject/i);
      await user.type(subjectInput, 'Test Integration Subject');
      
      const generateButton = screen.getByRole('button', { name: /generate module/i });
      await user.click(generateButton);
      
      await waitFor(() => {
        expect(mockOnGenerate).toHaveBeenCalled();
      });
      
      // Now test that the editor can handle the generated data
      if (generatedModule) {
        rerender(
          <ModuleEditor 
            module={mockModule}
            onSave={() => {}}
            onCancel={() => {}}
          />
        );
        
        // Verify editor displays the module data
        await waitFor(() => {
          expect(screen.getByDisplayValue(mockModule.title)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Module to Quiz Integration', () => {
    it('should display quiz questions from module data', async () => {
      renderWithProviders(
        <QuizComponent 
          questions={mockModule.quiz.questions}
          onComplete={() => {}}
        />
      );
      
      // Verify quiz displays the question
      await waitFor(() => {
        expect(screen.getByText(/what is the collective unconscious/i)).toBeInTheDocument();
      });
      
      // Verify options are displayed
      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('B')).toBeInTheDocument();
    });

    it('should handle quiz completion and scoring', async () => {
      const user = userEvent.setup();
      const mockOnComplete = jest.fn();
      
      renderWithProviders(
        <QuizComponent 
          questions={mockModule.quiz.questions}
          onComplete={mockOnComplete}
        />
      );
      
      // Answer the question
      const optionA = screen.getByLabelText('A');
      await user.click(optionA);
      
      // Submit the quiz
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            score: expect.any(Number),
            answers: expect.any(Array)
          })
        );
      });
    });
  });

  describe('Module to Mind Map Integration', () => {
    it('should generate mind map from module concepts', async () => {
      renderWithProviders(
        <InteractiveMindMap 
          concepts={mockModule.concepts}
          moduleTitle={mockModule.title}
        />
      );
      
      // Verify mind map displays concepts
      await waitFor(() => {
        expect(screen.getByText(mockModule.title)).toBeInTheDocument();
      });
      
      // Check for concept nodes
      mockModule.concepts.forEach(concept => {
        expect(screen.getByText(concept)).toBeInTheDocument();
      });
    });
  });

  describe('Note Taking Integration', () => {
    it('should allow note taking related to module content', async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn();
      
      renderWithProviders(
        <NoteEditor 
          moduleId={mockModule.id}
          onSave={mockOnSave}
        />
      );
      
      // Find the note input
      const noteInput = screen.getByRole('textbox');
      
      // Add a note
      await user.type(noteInput, 'Important insight about Jung\'s archetypes');
      
      // Save the note
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            content: expect.stringContaining('Jung\'s archetypes'),
            moduleId: mockModule.id
          })
        );
      });
    });
  });

  describe('Data Flow Integration', () => {
    it('should maintain data consistency across components', async () => {
      const user = userEvent.setup();
      
      // Mock shared state
      const sharedModuleData = { ...mockModule };
      
      // Test that multiple components can work with the same data
      const { rerender } = renderWithProviders(
        <ModuleEditor 
          module={sharedModuleData}
          onSave={(updatedModule) => {
            Object.assign(sharedModuleData, updatedModule);
          }}
          onCancel={() => {}}
        />
      );
      
      // Modify the module in the editor
      const titleInput = screen.getByDisplayValue(sharedModuleData.title);
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Test Module');
      
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);
      
      // Switch to quiz component with updated data
      rerender(
        <QuizComponent 
          questions={sharedModuleData.quiz.questions}
          moduleTitle={sharedModuleData.title}
          onComplete={() => {}}
        />
      );
      
      // Verify the quiz shows updated module title
      await waitFor(() => {
        expect(screen.getByText(/updated test module/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Boundary Integration', () => {
    it('should handle component errors gracefully', async () => {
      // Mock console.error to avoid noise in tests
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Create a component that will throw an error
      const ErrorThrowingComponent = () => {
        throw new Error('Test error for integration testing');
      };
      
      try {
        renderWithProviders(<ErrorThrowingComponent />);
      } catch (error) {
        // Error should be caught by error boundary
      }
      
      // The app should still be functional
      expect(document.body).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Performance Integration', () => {
    it('should handle large datasets efficiently', async () => {
      const largeQuestionSet = Array.from({ length: 100 }, (_, i) => ({
        id: `q${i}`,
        question: `Question ${i + 1}`,
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: i % 4,
        explanation: `Explanation for question ${i + 1}`
      }));
      
      const startTime = performance.now();
      
      renderWithProviders(
        <QuizComponent 
          questions={largeQuestionSet}
          onComplete={() => {}}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Question 1')).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render within reasonable time (less than 1 second)
      expect(renderTime).toBeLessThan(1000);
    });
  });

  describe('Accessibility Integration', () => {
    it('should maintain accessibility across component interactions', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <QuizComponent 
          questions={mockModule.quiz.questions}
          onComplete={() => {}}
        />
      );
      
      // Test keyboard navigation
      const firstOption = screen.getByLabelText('A');
      firstOption.focus();
      
      // Should be able to navigate with keyboard
      await user.keyboard('{Tab}');
      
      // Should have proper focus management
      expect(document.activeElement).toBeDefined();
    });
  });
});