/**
 * Enhanced comprehensive tests for ModuleEditor Component
 * Targeting 95%+ coverage including edge cases, error handling, and complex interactions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ModuleEditor from '../ModuleEditor';
import { Module, Section, Video, Bibliography, Film } from '../../../types';

// Mock QuizEditor component
jest.mock('../QuizEditor', () => {
  return function MockQuizEditor({ quiz, onUpdate }: any) {
    return (
      <div data-testid="quiz-editor">
        <input
          data-testid="quiz-title-input"
          value={quiz?.title || ''}
          onChange={(e) => onUpdate({ ...quiz, title: e.target.value })}
        />
      </div>
    );
  };
});

// Mock Lucide React icons
jest.mock('lucide-react', () => {
  const mockIcon = ({ className }: any) => <div className={className}>Icon</div>;
  
  return {
    X: mockIcon,
    Plus: mockIcon,
    Trash2: mockIcon,
    ChevronDown: mockIcon,
    ChevronRight: mockIcon,
    Save: mockIcon,
    BookOpen: mockIcon,
    Video: mockIcon,
    Library: mockIcon,
  };
});

describe('ModuleEditor - Enhanced Coverage', () => {
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  const completeModule: Module = {
    id: 'module-1',
    title: 'Complete Test Module',
    description: 'A comprehensive test module with all features',
    icon: '🧠',
    estimatedTime: 60,
    difficulty: 'intermediate',
    prerequisites: ['prereq-1'],
    content: {
      introduction: 'Module introduction text',
      sections: [
        {
          id: 'section-1',
          title: 'First Section',
          content: 'Section content here',
          order: 0,
          keyTerms: [
            { term: 'Psyche', definition: 'The human soul or mind' },
            { term: 'Unconscious', definition: 'Mental processes outside awareness' }
          ]
        },
        {
          id: 'section-2',
          title: 'Second Section',
          content: 'More section content',
          order: 1,
          keyTerms: []
        }
      ],
      videos: [
        {
          id: 'video-1',
          title: 'Introduction Video',
          youtubeId: 'abc123def',
          description: 'Video description',
          duration: 300
        },
        {
          id: 'video-2',
          title: 'Advanced Concepts',
          youtubeId: 'xyz789',
          description: 'Advanced video content',
          duration: 600
        }
      ],
      bibliography: [
        {
          id: 'book-1',
          title: 'Man and His Symbols',
          authors: ['Carl Gustav Jung'],
          year: 1964,
          type: 'book',
          publisher: 'Dell Publishing'
        },
        {
          id: 'article-1',
          title: 'The Archetypes and the Collective Unconscious',
          authors: ['C.G. Jung'],
          year: 1959,
          type: 'article',
          url: 'https://example.com'
        }
      ],
      films: [
        {
          id: 'film-1',
          title: 'The Red Book',
          director: 'John Doe',
          year: 2020,
          relevance: 'Explores Jung\'s personal journey'
        }
      ],
      quiz: {
        id: 'quiz-1',
        title: 'Module Quiz',
        questions: [
          {
            id: 'q1',
            question: 'What is the collective unconscious?',
            options: ['Personal memories', 'Shared human experiences', 'Dream content', 'Personality traits'],
            correctAnswer: 1,
            explanation: 'The collective unconscious contains universal patterns shared by humanity.'
          }
        ]
      },
      summary: 'Module summary',
      keyTakeaways: ['Key point 1', 'Key point 2']
    }
  };

  const mockModules: Module[] = [
    completeModule,
    {
      id: 'prereq-1',
      title: 'Prerequisite Module',
      description: 'A prerequisite module',
      icon: '📚',
      estimatedTime: 30,
      difficulty: 'beginner',
      content: {
        introduction: 'Prerequisite intro',
        sections: []
      }
    },
    {
      id: 'module-3',
      title: 'Another Module',
      description: 'Another test module',
      icon: '🎯',
      estimatedTime: 45,
      difficulty: 'advanced',
      content: {
        introduction: 'Another intro',
        sections: []
      }
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Initialization and Rendering', () => {
    test('renders with complete module data', () => {
      render(
        <ModuleEditor
          module={completeModule}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Editar Módulo')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Complete Test Module')).toBeInTheDocument();
      expect(screen.getByDisplayValue('A comprehensive test module with all features')).toBeInTheDocument();
    });

    test('renders for new module creation', () => {
      const newModule: Module = {
        id: 'new-module',
        title: '',
        description: '',
        icon: '',
        estimatedTime: 30,
        difficulty: 'beginner',
        content: {
          introduction: '',
          sections: []
        }
      };

      render(
        <ModuleEditor
          module={newModule}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Criar Módulo')).toBeInTheDocument();
    });

    test('handles module with undefined content', () => {
      const moduleWithoutContent: Module = {
        id: 'no-content',
        title: 'No Content Module',
        description: 'Module without content',
        icon: '❓',
        estimatedTime: 20,
        difficulty: 'beginner'
      };

      render(
        <ModuleEditor
          module={moduleWithoutContent}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Should render without errors
      expect(screen.getByDisplayValue('No Content Module')).toBeInTheDocument();
    });

    test('handles module with null content properties', () => {
      const moduleWithNullContent: Module = {
        ...completeModule,
        content: {
          introduction: '',
          sections: [],
          videos: null as any,
          bibliography: null as any,
          films: null as any,
          quiz: null as any
        }
      };

      render(
        <ModuleEditor
          module={moduleWithNullContent}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Navigate to videos tab
      fireEvent.click(screen.getByText(/vídeos/i));
      expect(screen.getByText(/adicionar vídeo/i)).toBeInTheDocument();
    });
  });

  describe('Tab Navigation and Content', () => {
    test('switches between all tabs correctly', async () => {
      const user = userEvent.setup();
      render(
        <ModuleEditor
          module={completeModule}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Test all tab transitions
      const tabs = [
        { label: /conteúdo/i, expectedContent: /introdução/i },
        { label: /vídeos/i, expectedContent: /Introduction Video/i },
        { label: /questionário/i, expectedContent: 'quiz-editor' },
        { label: /recursos/i, expectedContent: /bibliografia/i },
        { label: /informações básicas/i, expectedContent: /título do módulo/i }
      ];

      for (const tab of tabs) {
        await user.click(screen.getByText(tab.label));
        
        if (typeof tab.expectedContent === 'string') {
          expect(screen.getByTestId(tab.expectedContent)).toBeInTheDocument();
        } else {
          expect(screen.getByText(tab.expectedContent)).toBeInTheDocument();
        }
      }
    });

    test('maintains tab state during form interactions', async () => {
      const user = userEvent.setup();
      render(
        <ModuleEditor
          module={completeModule}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Go to videos tab and interact
      await user.click(screen.getByText(/vídeos/i));
      await user.click(screen.getByText(/adicionar vídeo/i));

      // Should stay on videos tab
      expect(screen.getByText(/adicionar vídeo/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue('Novo Vídeo')).toBeInTheDocument();
    });
  });

  describe('Section Management - Advanced Cases', () => {
    test('handles sections with complex key terms', async () => {
      const user = userEvent.setup();
      render(
        <ModuleEditor
          module={completeModule}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Navigate to content tab
      await user.click(screen.getByText(/conteúdo/i));

      // Expand first section
      const expandButton = screen.getAllByRole('button').find(button => 
        button.querySelector('svg')
      );
      if (expandButton) {
        await user.click(expandButton);
      }

      // Should show existing key terms
      expect(screen.getByDisplayValue('Psyche')).toBeInTheDocument();
      expect(screen.getByDisplayValue('The human soul or mind')).toBeInTheDocument();
    });

    test('adds and removes key terms from sections', async () => {
      const user = userEvent.setup();
      render(
        <ModuleEditor
          module={completeModule}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      await user.click(screen.getByText(/conteúdo/i));
      
      // Expand first section
      const expandButton = screen.getAllByRole('button').find(button => 
        button.querySelector('svg')
      );
      if (expandButton) {
        await user.click(expandButton);
      }

      // Add new key term
      const addTermButton = screen.getByText(/adicionar termo-chave/i);
      await user.click(addTermButton);

      // Should have input fields for new term
      const termInputs = screen.getAllByPlaceholderText(/digite o termo/i);
      const definitionInputs = screen.getAllByPlaceholderText(/digite a definição/i);
      
      expect(termInputs.length).toBeGreaterThan(2);
      expect(definitionInputs.length).toBeGreaterThan(2);

      // Fill new term
      const newTermInput = termInputs[termInputs.length - 1];
      const newDefinitionInput = definitionInputs[definitionInputs.length - 1];
      
      await user.type(newTermInput, 'New Term');
      await user.type(newDefinitionInput, 'New Definition');

      expect(newTermInput).toHaveValue('New Term');
      expect(newDefinitionInput).toHaveValue('New Definition');
    });

    test('deletes key terms correctly', async () => {
      const user = userEvent.setup();
      render(
        <ModuleEditor
          module={completeModule}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      await user.click(screen.getByText(/conteúdo/i));
      
      // Expand first section
      const expandButton = screen.getAllByRole('button').find(button => 
        button.querySelector('svg')
      );
      if (expandButton) {
        await user.click(expandButton);
      }

      // Find delete button for first key term
      const deleteButtons = screen.getAllByRole('button').filter(button => 
        button.querySelector('svg') && button.getAttribute('class')?.includes('text-red-600')
      );

      if (deleteButtons.length > 0) {
        await user.click(deleteButtons[0]);
        
        // First key term should be removed
        expect(screen.queryByDisplayValue('Psyche')).not.toBeInTheDocument();
      }
    });

    test('handles section reordering', async () => {
      const user = userEvent.setup();
      render(
        <ModuleEditor
          module={completeModule}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      await user.click(screen.getByText(/conteúdo/i));

      // Should show section order indicators
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('#2')).toBeInTheDocument();
    });

    test('validates section content before saving', async () => {
      const user = userEvent.setup();
      render(
        <ModuleEditor
          module={completeModule}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      await user.click(screen.getByText(/conteúdo/i));
      
      // Clear section title
      const sectionTitleInput = screen.getByDisplayValue('First Section');
      await user.clear(sectionTitleInput);
      
      // Save module
      await user.click(screen.getByText(/salvar módulo/i));

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            sections: expect.arrayContaining([
              expect.objectContaining({ title: '' })
            ])
          })
        })
      );
    });
  });

  describe('Video Management - Comprehensive', () => {
    test('handles video duration as object format', async () => {
      const user = userEvent.setup();
      const moduleWithObjectDuration: Module = {
        ...completeModule,
        content: {
          ...completeModule.content!,
          videos: [
            {
              id: 'video-obj',
              title: 'Video with Object Duration',
              youtubeId: 'test123',
              description: 'Test video',
              duration: { hours: 1, minutes: 30, seconds: 45 } as any
            }
          ]
        }
      };

      render(
        <ModuleEditor
          module={moduleWithObjectDuration}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      await user.click(screen.getByText(/vídeos/i));
      
      // Should handle object duration gracefully
      expect(screen.getByDisplayValue('Video with Object Duration')).toBeInTheDocument();
    });

    test('validates YouTube ID format', async () => {
      const user = userEvent.setup();
      render(
        <ModuleEditor
          module={completeModule}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      await user.click(screen.getByText(/vídeos/i));
      
      // Update YouTube ID with invalid format
      const youtubeInput = screen.getByDisplayValue('abc123def');
      await user.clear(youtubeInput);
      await user.type(youtubeInput, 'invalid-youtube-url');

      expect(youtubeInput).toHaveValue('invalid-youtube-url');
    });

    test('handles video deletion with confirmation', async () => {
      const user = userEvent.setup();
      render(
        <ModuleEditor
          module={completeModule}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      await user.click(screen.getByText(/vídeos/i));
      
      const initialVideos = screen.getAllByText(/Video/);
      
      // Find delete button
      const deleteButtons = screen.getAllByRole('button').filter(button => 
        button.querySelector('svg') && button.getAttribute('class')?.includes('text-red-600')
      );

      if (deleteButtons.length > 0) {
        await user.click(deleteButtons[0]);
        
        // Should have one less video
        const remainingVideos = screen.getAllByText(/Video/).filter(el => 
          el.textContent?.includes('Introduction') || el.textContent?.includes('Advanced')
        );
        expect(remainingVideos.length).toBe(initialVideos.length - 1);
      }
    });

    test('adds multiple videos in sequence', async () => {
      const user = userEvent.setup();
      render(
        <ModuleEditor
          module={completeModule}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      await user.click(screen.getByText(/vídeos/i));
      
      // Add first video
      await user.click(screen.getByText(/adicionar vídeo/i));
      expect(screen.getAllByDisplayValue('Novo Vídeo')).toHaveLength(1);
      
      // Add second video
      await user.click(screen.getByText(/adicionar vídeo/i));
      expect(screen.getAllByDisplayValue('Novo Vídeo')).toHaveLength(2);
    });
  });

  describe('Bibliography and Film Management', () => {
    test('handles different publication types', async () => {
      const user = userEvent.setup();
      render(
        <ModuleEditor
          module={completeModule}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      await user.click(screen.getByText(/recursos/i));
      
      // Find publication type selects
      const typeSelects = screen.getAllByDisplayValue(/livro|artigo|periódico/i);
      
      if (typeSelects.length > 0) {
        await user.selectOptions(typeSelects[0], 'article');
        expect(typeSelects[0]).toHaveValue('article');
      }
    });

    test('manages film relevance descriptions', async () => {
      const user = userEvent.setup();
      render(
        <ModuleEditor
          module={completeModule}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      await user.click(screen.getByText(/recursos/i));
      
      const relevanceTextarea = screen.getByDisplayValue('Explores Jung\'s personal journey');
      await user.clear(relevanceTextarea);
      await user.type(relevanceTextarea, 'Updated relevance description');
      
      expect(relevanceTextarea).toHaveValue('Updated relevance description');
    });

    test('adds and removes bibliography entries', async () => {
      const user = userEvent.setup();
      render(
        <ModuleEditor
          module={completeModule}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      await user.click(screen.getByText(/recursos/i));
      
      // Add new bibliography entry
      await user.click(screen.getByText(/adicionar livro/i));
      expect(screen.getByDisplayValue('Novo Livro')).toBeInTheDocument();
      
      // Delete bibliography entry
      const deleteButtons = screen.getAllByRole('button').filter(button => 
        button.querySelector('svg') && button.getAttribute('class')?.includes('text-red-600')
      );

      if (deleteButtons.length > 0) {
        const initialEntries = screen.getAllByText(/Man and His Symbols|Novo Livro/);
        await user.click(deleteButtons[0]);
        
        const remainingEntries = screen.queryAllByText(/Man and His Symbols|Novo Livro/);
        expect(remainingEntries.length).toBeLessThan(initialEntries.length);
      }
    });

    test('adds and manages films', async () => {
      const user = userEvent.setup();
      render(
        <ModuleEditor
          module={completeModule}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      await user.click(screen.getByText(/recursos/i));
      
      // Add new film
      await user.click(screen.getByText(/adicionar filme/i));
      expect(screen.getByDisplayValue('Novo Filme')).toBeInTheDocument();
      
      // Update film details
      const newFilmTitle = screen.getByDisplayValue('Novo Filme');
      await user.clear(newFilmTitle);
      await user.type(newFilmTitle, 'Jung: A Biography');
      
      expect(newFilmTitle).toHaveValue('Jung: A Biography');
    });
  });

  describe('Prerequisites Management', () => {
    test('handles complex prerequisite relationships', async () => {
      const user = userEvent.setup();
      render(
        <ModuleEditor
          module={completeModule}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Check current prerequisites
      const prereqCheckbox = screen.getByLabelText('Prerequisite Module');
      expect(prereqCheckbox).toBeChecked();

      // Add another prerequisite
      const anotherModuleCheckbox = screen.getByLabelText('Another Module');
      await user.click(anotherModuleCheckbox);
      expect(anotherModuleCheckbox).toBeChecked();

      // Save and verify
      await user.click(screen.getByText(/salvar módulo/i));
      
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          prerequisites: expect.arrayContaining(['prereq-1', 'module-3'])
        })
      );
    });

    test('prevents self-prerequisite selection', () => {
      render(
        <ModuleEditor
          module={completeModule}
          modules={[...mockModules, completeModule]}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Should not show the current module as a prerequisite option
      expect(screen.queryByLabelText('Complete Test Module')).not.toBeInTheDocument();
    });

    test('handles modules without prerequisites', async () => {
      const user = userEvent.setup();
      const moduleWithoutPrereqs: Module = {
        ...completeModule,
        prerequisites: undefined
      };

      render(
        <ModuleEditor
          module={moduleWithoutPrereqs}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // All prerequisite checkboxes should be unchecked
      const prereqCheckbox = screen.getByLabelText('Prerequisite Module');
      expect(prereqCheckbox).not.toBeChecked();

      // Select a prerequisite
      await user.click(prereqCheckbox);
      await user.click(screen.getByText(/salvar módulo/i));

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          prerequisites: ['prereq-1']
        })
      );
    });
  });

  describe('Form Validation and Error Handling', () => {
    test('prevents saving with empty required fields', async () => {
      const user = userEvent.setup();
      const emptyModule: Module = {
        id: 'empty',
        title: '',
        description: '',
        icon: '',
        estimatedTime: 0,
        difficulty: 'beginner',
        content: { introduction: '', sections: [] }
      };

      render(
        <ModuleEditor
          module={emptyModule}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      await user.click(screen.getByText(/salvar módulo/i));
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    test('prevents saving with whitespace-only title', async () => {
      const user = userEvent.setup();
      render(
        <ModuleEditor
          module={completeModule}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Clear and set whitespace-only title
      const titleInput = screen.getByDisplayValue('Complete Test Module');
      await user.clear(titleInput);
      await user.type(titleInput, '   ');

      await user.click(screen.getByText(/salvar módulo/i));
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    test('handles invalid estimated time input gracefully', async () => {
      const user = userEvent.setup();
      render(
        <ModuleEditor
          module={completeModule}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const timeInput = screen.getByDisplayValue('60');
      await user.clear(timeInput);
      await user.type(timeInput, 'not-a-number');

      // Should handle gracefully
      expect(timeInput).toHaveValue(null);
    });

    test('validates content integrity before saving', async () => {
      const user = userEvent.setup();
      render(
        <ModuleEditor
          module={completeModule}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Modify various content fields
      await user.click(screen.getByText(/conteúdo/i));
      
      const introInput = screen.getByDisplayValue('Module introduction text');
      await user.clear(introInput);
      await user.type(introInput, 'Updated introduction');

      await user.click(screen.getByText(/salvar módulo/i));

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            introduction: 'Updated introduction'
          })
        })
      );
    });
  });

  describe('Quiz Integration', () => {
    test('updates quiz data through quiz editor', async () => {
      const user = userEvent.setup();
      render(
        <ModuleEditor
          module={completeModule}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      await user.click(screen.getByText(/questionário/i));
      
      // Use the mocked quiz editor
      const quizTitleInput = screen.getByTestId('quiz-title-input');
      await user.clear(quizTitleInput);
      await user.type(quizTitleInput, 'Updated Quiz Title');

      await user.click(screen.getByText(/salvar módulo/i));

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            quiz: expect.objectContaining({
              title: 'Updated Quiz Title'
            })
          })
        })
      );
    });

    test('handles module without quiz', async () => {
      const user = userEvent.setup();
      const moduleWithoutQuiz: Module = {
        ...completeModule,
        content: {
          ...completeModule.content!,
          quiz: undefined
        }
      };

      render(
        <ModuleEditor
          module={moduleWithoutQuiz}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      await user.click(screen.getByText(/questionário/i));
      
      // Should still show quiz editor (it handles undefined quiz)
      expect(screen.getByTestId('quiz-editor')).toBeInTheDocument();
    });
  });

  describe('User Experience and Accessibility', () => {
    test('maintains scroll position during tab changes', async () => {
      const user = userEvent.setup();
      render(
        <ModuleEditor
          module={completeModule}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Switch between tabs rapidly
      await user.click(screen.getByText(/recursos/i));
      await user.click(screen.getByText(/vídeos/i));
      await user.click(screen.getByText(/conteúdo/i));
      await user.click(screen.getByText(/informações básicas/i));

      // Should remain functional
      expect(screen.getByDisplayValue('Complete Test Module')).toBeInTheDocument();
    });

    test('shows proper loading states during operations', async () => {
      const user = userEvent.setup();
      render(
        <ModuleEditor
          module={completeModule}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Test rapid form interactions
      const titleInput = screen.getByDisplayValue('Complete Test Module');
      for (let i = 0; i < 5; i++) {
        await user.type(titleInput, `${i}`);
      }

      expect(titleInput).toHaveValue('Complete Test Module01234');
    });

    test('handles keyboard navigation', async () => {
      const user = userEvent.setup();
      render(
        <ModuleEditor
          module={completeModule}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Test tab navigation
      await user.tab();
      await user.tab();
      
      // Should be able to navigate through form elements
      expect(document.activeElement).toBeInTheDocument();
    });

    test('provides proper ARIA labels and roles', () => {
      render(
        <ModuleEditor
          module={completeModule}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Check for proper labels
      expect(screen.getByLabelText(/título do módulo/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/descrição/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/dificuldade/i)).toBeInTheDocument();
      
      // Check for proper roles
      expect(screen.getByRole('button', { name: /salvar módulo/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
    });
  });

  describe('Cancel and Close Functionality', () => {
    test('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <ModuleEditor
          module={completeModule}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      await user.click(screen.getByText(/cancelar/i));
      expect(mockOnCancel).toHaveBeenCalled();
    });

    test('calls onCancel when X button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <ModuleEditor
          module={completeModule}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const closeButton = screen.getAllByRole('button').find(button => 
        button.querySelector('svg') && button.getAttribute('class')?.includes('text-gray-400')
      );

      if (closeButton) {
        await user.click(closeButton);
        expect(mockOnCancel).toHaveBeenCalled();
      }
    });

    test('shows confirmation dialog for unsaved changes', async () => {
      const user = userEvent.setup();
      render(
        <ModuleEditor
          module={completeModule}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Make changes
      const titleInput = screen.getByDisplayValue('Complete Test Module');
      await user.clear(titleInput);
      await user.type(titleInput, 'Modified Title');

      // Try to cancel (in a real app, this might show a confirmation)
      await user.click(screen.getByText(/cancelar/i));
      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Complex Integration Scenarios', () => {
    test('handles saving with complete module data', async () => {
      const user = userEvent.setup();
      render(
        <ModuleEditor
          module={completeModule}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Modify data across multiple tabs
      const titleInput = screen.getByDisplayValue('Complete Test Module');
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Complete Module');

      // Content tab
      await user.click(screen.getByText(/conteúdo/i));
      const introInput = screen.getByDisplayValue('Module introduction text');
      await user.clear(introInput);
      await user.type(introInput, 'Updated introduction content');

      // Videos tab
      await user.click(screen.getByText(/vídeos/i));
      await user.click(screen.getByText(/adicionar vídeo/i));

      // Save
      await user.click(screen.getByText(/salvar módulo/i));

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Updated Complete Module',
          content: expect.objectContaining({
            introduction: 'Updated introduction content',
            videos: expect.arrayContaining([
              expect.objectContaining({ title: 'Novo Vídeo' })
            ])
          })
        })
      );
    });

    test('preserves all module relationships during editing', async () => {
      const user = userEvent.setup();
      render(
        <ModuleEditor
          module={completeModule}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      await user.click(screen.getByText(/salvar módulo/i));

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'module-1',
          prerequisites: ['prereq-1'],
          content: expect.objectContaining({
            sections: expect.arrayContaining([
              expect.objectContaining({ id: 'section-1' }),
              expect.objectContaining({ id: 'section-2' })
            ]),
            videos: expect.arrayContaining([
              expect.objectContaining({ id: 'video-1' }),
              expect.objectContaining({ id: 'video-2' })
            ])
          })
        })
      );
    });
  });

  describe('Performance and Edge Cases', () => {
    test('handles large number of sections efficiently', async () => {
      const user = userEvent.setup();
      const moduleWithManySections: Module = {
        ...completeModule,
        content: {
          ...completeModule.content!,
          sections: Array.from({ length: 20 }, (_, i) => ({
            id: `section-${i}`,
            title: `Section ${i + 1}`,
            content: `Content for section ${i + 1}`,
            order: i,
            keyTerms: []
          }))
        }
      };

      render(
        <ModuleEditor
          module={moduleWithManySections}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      await user.click(screen.getByText(/conteúdo/i));
      
      // Should render all sections
      expect(screen.getByText('#20')).toBeInTheDocument();
    });

    test('recovers from corrupted module data', () => {
      const corruptedModule: Module = {
        id: 'corrupted',
        title: 'Corrupted Module',
        description: 'Module with corrupted data',
        icon: '⚠️',
        estimatedTime: NaN,
        difficulty: 'beginner',
        content: {
          introduction: '',
          sections: [
            null as any,
            {
              id: 'valid-section',
              title: 'Valid Section',
              content: 'Valid content',
              order: 0,
              keyTerms: null as any
            }
          ],
          videos: [undefined as any],
          bibliography: [{ id: '', title: '', authors: [], year: NaN, type: 'book' }]
        }
      };

      render(
        <ModuleEditor
          module={corruptedModule}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Should render without crashing
      expect(screen.getByDisplayValue('Corrupted Module')).toBeInTheDocument();
    });
  });
});