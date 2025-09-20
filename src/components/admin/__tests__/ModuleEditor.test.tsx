import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../../utils/test-utils';
import userEvent from '@testing-library/user-event';
import ModuleEditor from '../ModuleEditor';
import { Module } from '../../../types';

// Mock lucide-react icons
jest.mock('lucide-react', () => {
  const React = require('react');
  return {
    ChevronRight: ({ className }: any) => React.createElement('svg', {
      'data-testid': 'chevron-right',
      className: `lucide-chevron-right ${className || ''}`
    }, 'ChevronRight'),
    ChevronDown: ({ className }: any) => React.createElement('svg', {
      'data-testid': 'chevron-down',
      className: `lucide-chevron-down ${className || ''}`
    }, 'ChevronDown'),
    Trash2: ({ className }: any) => React.createElement('svg', {
      'data-testid': 'trash-icon',
      className: `lucide-trash2 ${className || ''}`
    }, 'Trash2'),
    Plus: ({ className }: any) => React.createElement('svg', {
      'data-testid': 'plus-icon',
      className: `lucide-plus ${className || ''}`
    }, 'Plus'),
    Save: ({ className }: any) => React.createElement('svg', {
      'data-testid': 'save-icon',
      className: `lucide-save ${className || ''}`
    }, 'Save'),
    X: ({ className }: any) => React.createElement('svg', {
      'data-testid': 'x-icon',
      className: `lucide-x ${className || ''}`
    }, 'X'),
    BookOpen: ({ className }: any) => React.createElement('svg', {
      'data-testid': 'book-icon',
      className: `lucide-book-open ${className || ''}`
    }, 'BookOpen'),
    Video: ({ className }: any) => React.createElement('svg', {
      'data-testid': 'video-icon',
      className: `lucide-video ${className || ''}`
    }, 'Video'),
    Library: ({ className }: any) => React.createElement('svg', {
      'data-testid': 'library-icon',
      className: `lucide-library ${className || ''}`
    }, 'Library'),
  };
});

const mockModule: Module = {
  id: 'test-module',
  title: 'Test Module',
  description: 'Test Description',
  icon: '🧪',
  estimatedTime: 30,
  difficulty: 'beginner',
  prerequisites: ['module-1'],
  content: {
    introduction: 'Test introduction',
    sections: [
      {
        id: 'section-1',
        title: 'Section 1',
        content: 'Section content',
        order: 0,
        keyTerms: [
          { term: 'Term 1', definition: 'Definition 1' }
        ]
      }
    ],
    videos: [
      {
        id: 'video-1',
        title: 'Introduction Video',
        youtubeId: 'abc123',
        description: 'Video description',
        duration: 10
      }
    ],
    bibliography: [
      {
        authors: ['Jung, C.G.'],
        title: 'The Red Book',
        year: 1913,
        type: 'book',
        link: 'https://example.com'
      }
    ],
    films: [
      {
        title: 'A Dangerous Method',
        year: 2011,
        director: 'David Cronenberg',
        description: 'About Jung and Freud'
      }
    ],
    quiz: {
      id: 'quiz-1',
      title: 'Test Quiz',
      questions: [
        {
          id: 'q1',
          question: 'Test question?',
          options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
          correctAnswer: 0,
          explanation: 'Test explanation'
        }
      ]
    }
  }
};

const mockOnSave = jest.fn();
const mockOnCancel = jest.fn();

const mockModules: Module[] = [
  mockModule,
  {
    id: 'module-1',
    title: 'Prerequisite Module',
    description: 'Prerequisite Description',
    icon: '📚',
    estimatedTime: 45,
    difficulty: 'beginner',
    content: {
      introduction: 'Intro',
      sections: []
    }
  }
];

describe('ModuleEditor Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders with all form fields', () => {
    render(
      <ModuleEditor
        module={mockModule}
        modules={mockModules}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Basic tab fields (default tab)
    expect(screen.getByLabelText(/título do módulo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/descrição/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ícone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tempo estimado/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/dificuldade/i)).toBeInTheDocument();
    
    // Switch to content tab to check introduction field
    const contentTab = screen.getByText(/conteúdo/i);
    fireEvent.click(contentTab);
    
    expect(screen.getByLabelText(/introdução/i)).toBeInTheDocument();
  });

  test('loads module data into form fields', () => {
    render(
      <ModuleEditor
        module={mockModule}
        modules={mockModules}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Basic tab fields
    expect(screen.getByDisplayValue('Test Module')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
    expect(screen.getByDisplayValue('🧪')).toBeInTheDocument();
    expect(screen.getByDisplayValue('30')).toBeInTheDocument();
    
    // Check select value differently
    const difficultySelect = screen.getByLabelText(/dificuldade/i) as HTMLSelectElement;
    expect(difficultySelect.value).toBe('beginner');
    
    // Switch to content tab to check introduction
    const contentTab = screen.getByText(/conteúdo/i);
    fireEvent.click(contentTab);
    
    expect(screen.getByDisplayValue('Test introduction')).toBeInTheDocument();
  });

  test('displays sections in the content tab', () => {
    render(
      <ModuleEditor
        module={mockModule}
        modules={mockModules}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Click on content tab
    const contentTab = screen.getByText(/conteúdo/i);
    fireEvent.click(contentTab);

    // Section title is in an input field, not plain text
    expect(screen.getByDisplayValue('Section 1')).toBeInTheDocument();
  });

  test('adds new section', () => {
    render(
      <ModuleEditor
        module={mockModule}
        modules={mockModules}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Click on content tab first
    const contentTab = screen.getByText(/conteúdo/i);
    fireEvent.click(contentTab);

    const addSectionButton = screen.getByText(/adicionar seção/i);
    fireEvent.click(addSectionButton);

    // Check that we now have more sections - section title is in input field
    expect(screen.getByDisplayValue('Nova Seção')).toBeInTheDocument();
  });

  test('switches between tabs', () => {
    render(
      <ModuleEditor
        module={mockModule}
        modules={mockModules}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Click on resources tab
    const resourcesTab = screen.getByText(/recursos/i);
    fireEvent.click(resourcesTab);

    // Check that resources content is shown
    expect(screen.getByText(/bibliografia/i)).toBeInTheDocument();
  });

  test('has save and cancel buttons', () => {
    render(
      <ModuleEditor
        module={mockModule}
        modules={mockModules}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/salvar módulo/i)).toBeInTheDocument();
    expect(screen.getByText(/cancelar/i)).toBeInTheDocument();
  });

  test('updates form fields', () => {
    render(
      <ModuleEditor
        module={mockModule}
        modules={mockModules}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const titleInput = screen.getByLabelText(/título do módulo/i);
    fireEvent.change(titleInput, { target: { value: 'Updated Title' } });

    expect(screen.getByDisplayValue('Updated Title')).toBeInTheDocument();
  });

  test('calls onSave with updated module data', async () => {
    render(
      <ModuleEditor
        module={mockModule}
        modules={mockModules}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const titleInput = screen.getByLabelText(/título do módulo/i);
    fireEvent.change(titleInput, { target: { value: 'Updated Module' } });

    const saveButton = screen.getByText(/salvar módulo/i);
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockModule,
          title: 'Updated Module'
        })
      );
    });
  });

  test('calls onCancel when cancel button clicked', () => {
    render(
      <ModuleEditor
        module={mockModule}
        modules={mockModules}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText(/cancelar/i);
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  test('validates required fields before saving', () => {
    const emptyModule = {
      ...mockModule,
      title: '',
      description: ''
    };

    render(
      <ModuleEditor
        module={emptyModule}
        modules={mockModules}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const saveButton = screen.getByText(/salvar módulo/i);
    fireEvent.click(saveButton);

    // Should show validation errors
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  test('displays quiz section in content tab', () => {
    render(
      <ModuleEditor
        module={mockModule}
        modules={mockModules}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Click on content tab
    const contentTab = screen.getByText(/conteúdo/i);
    fireEvent.click(contentTab);

    // Quiz section should be visible
    expect(screen.getByText(/questionário/i)).toBeInTheDocument();
  });

  test('handles difficulty level change', () => {
    render(
      <ModuleEditor
        module={mockModule}
        modules={mockModules}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const difficultySelect = screen.getByLabelText(/dificuldade/i) as HTMLSelectElement;
    fireEvent.change(difficultySelect, { target: { value: 'intermediate' } });

    expect(difficultySelect.value).toBe('intermediate');
  });

  test('handles estimated time input', () => {
    render(
      <ModuleEditor
        module={mockModule}
        modules={mockModules}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const timeInput = screen.getByLabelText(/tempo estimado/i);
    fireEvent.change(timeInput, { target: { value: '45' } });

    expect(screen.getByDisplayValue('45')).toBeInTheDocument();
  });

  test('preserves module ID when saving', async () => {
    render(
      <ModuleEditor
        module={mockModule}
        modules={mockModules}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const saveButton = screen.getByText(/salvar módulo/i);
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-module'
        })
      );
    });
  });

  describe('Section Management', () => {
    test('expands and collapses sections', () => {
      render(
        <ModuleEditor
          module={mockModule}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Navigate to content tab
      fireEvent.click(screen.getByText(/conteúdo/i));

      // Find expand button by chevron icon
      const chevronIcons = screen.getAllByTestId('chevron-right');
      expect(chevronIcons.length).toBeGreaterThan(0);

      const expandButton = chevronIcons[0].closest('button');
      expect(expandButton).toBeInTheDocument();

      // Expand section
      fireEvent.click(expandButton!);

      // Should now show chevron-down
      const downChevron = screen.queryByTestId('chevron-down');
      expect(downChevron).toBeInTheDocument();
      
      // Content should be visible
      expect(screen.getByDisplayValue('Section content')).toBeInTheDocument();
    });

    test('updates section content', () => {
      render(
        <ModuleEditor
          module={mockModule}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Navigate to content tab
      fireEvent.click(screen.getByText(/conteúdo/i));

      // Expand section
      const chevronIcons = screen.getAllByTestId('chevron-right');
      const expandButton = chevronIcons[0].closest('button');
      if (expandButton) {
        fireEvent.click(expandButton);
      }

      // Update content
      const contentTextarea = screen.getByDisplayValue('Section content');
      fireEvent.change(contentTextarea, { target: { value: 'Updated section content' } });

      expect(screen.getByDisplayValue('Updated section content')).toBeInTheDocument();
    });

    test('deletes section', () => {
      render(
        <ModuleEditor
          module={mockModule}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Navigate to content tab
      fireEvent.click(screen.getByText(/conteúdo/i));

      // Click delete button
      const trashIcons = screen.getAllByTestId('trash-icon');
      const deleteButton = trashIcons[0].closest('button');
      if (deleteButton) {
        fireEvent.click(deleteButton);
      }

      // Section should be removed
      expect(screen.queryByDisplayValue('Section 1')).not.toBeInTheDocument();
    });

    test('adds key terms to section', () => {
      render(
        <ModuleEditor
          module={mockModule}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Navigate to content tab
      fireEvent.click(screen.getByText(/conteúdo/i));

      // Expand section
      const chevronIcons = screen.getAllByTestId('chevron-right');
      const expandButton = chevronIcons[0].closest('button');
      if (expandButton) {
        fireEvent.click(expandButton);
      }

      // Should show existing key term
      expect(screen.getByDisplayValue('Term 1')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Definition 1')).toBeInTheDocument();
    });
  });

  describe('Videos Tab', () => {
    test('displays and manages videos', () => {
      render(
        <ModuleEditor
          module={mockModule}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Navigate to videos tab
      fireEvent.click(screen.getByText(/vídeos/i));

      // Should display existing video
      expect(screen.getByDisplayValue('Introduction Video')).toBeInTheDocument();
      expect(screen.getByDisplayValue('abc123')).toBeInTheDocument();
    });

    test('adds new video', () => {
      render(
        <ModuleEditor
          module={mockModule}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Navigate to videos tab
      fireEvent.click(screen.getByText(/vídeos/i));

      // Click add video button
      const addVideoButton = screen.getByText(/adicionar vídeo/i);
      fireEvent.click(addVideoButton);

      // Should add new video with default values
      expect(screen.getByDisplayValue('Novo Vídeo')).toBeInTheDocument();
    });
  });

  describe('Resources Tab', () => {
    test('displays bibliography', () => {
      render(
        <ModuleEditor
          module={mockModule}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Navigate to resources tab
      fireEvent.click(screen.getByText(/recursos/i));

      // Should display bibliography
      expect(screen.getByDisplayValue('The Red Book')).toBeInTheDocument();
    });

    test('adds new bibliography entry', () => {
      render(
        <ModuleEditor
          module={mockModule}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Navigate to resources tab
      fireEvent.click(screen.getByText(/recursos/i));

      // Click add bibliography button
      const addBibButton = screen.getByText(/adicionar livro/i);
      fireEvent.click(addBibButton);

      // Should add new bibliography entry
      expect(screen.getByDisplayValue('Novo Livro')).toBeInTheDocument();
    });

    test('manages films', () => {
      render(
        <ModuleEditor
          module={mockModule}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Navigate to resources tab
      fireEvent.click(screen.getByText(/recursos/i));

      // Should display existing film
      expect(screen.getByDisplayValue('A Dangerous Method')).toBeInTheDocument();
      expect(screen.getByDisplayValue('David Cronenberg')).toBeInTheDocument();
    });
  });

  describe('Prerequisites', () => {
    test('displays and manages prerequisites', () => {
      render(
        <ModuleEditor
          module={mockModule}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Should show prerequisite checkbox
      const prerequisiteCheckbox = screen.getByLabelText('Prerequisite Module');
      expect(prerequisiteCheckbox).toBeChecked();
    });

    test('adds prerequisite', () => {
      const moduleWithoutPrereqs = {
        ...mockModule,
        prerequisites: []
      };

      render(
        <ModuleEditor
          module={moduleWithoutPrereqs}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const prerequisiteCheckbox = screen.getByLabelText('Prerequisite Module');
      fireEvent.click(prerequisiteCheckbox);

      // Save and check
      fireEvent.click(screen.getByText(/salvar módulo/i));

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          prerequisites: ['module-1']
        })
      );
    });

    test('removes prerequisite', () => {
      render(
        <ModuleEditor
          module={mockModule}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const prerequisiteCheckbox = screen.getByLabelText('Prerequisite Module');
      fireEvent.click(prerequisiteCheckbox);

      // Save and check
      fireEvent.click(screen.getByText(/salvar módulo/i));

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          prerequisites: []
        })
      );
    });
  });

  describe('Quiz Integration', () => {
    test('displays quiz editor in quiz tab', () => {
      render(
        <ModuleEditor
          module={mockModule}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Navigate to quiz tab
      fireEvent.click(screen.getByText(/questionário/i));

      // Should show quiz editor
      expect(screen.getByDisplayValue('Test Quiz')).toBeInTheDocument();
    });

    test('updates quiz data', async () => {
      render(
        <ModuleEditor
          module={mockModule}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Navigate to quiz tab
      fireEvent.click(screen.getByText(/questionário/i));

      // Update quiz title
      const quizTitleInput = screen.getByDisplayValue('Test Quiz');
      fireEvent.change(quizTitleInput, { target: { value: 'Updated Quiz Title' } });

      // Save module
      fireEvent.click(screen.getByText(/salvar módulo/i));

      await waitFor(() => {
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
    });
  });

  describe('Validation', () => {
    test('prevents saving with empty title', () => {
      const moduleWithEmptyTitle = {
        ...mockModule,
        title: ''
      };

      render(
        <ModuleEditor
          module={moduleWithEmptyTitle}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.click(screen.getByText(/salvar módulo/i));
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    test('prevents saving with only whitespace in title', () => {
      render(
        <ModuleEditor
          module={mockModule}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const titleInput = screen.getByLabelText(/título do módulo/i);
      fireEvent.change(titleInput, { target: { value: '   ' } });

      fireEvent.click(screen.getByText(/salvar módulo/i));
      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  describe('Icon Selector', () => {
    test('updates module icon', () => {
      render(
        <ModuleEditor
          module={mockModule}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const iconInput = screen.getByLabelText(/ícone/i);
      fireEvent.change(iconInput, { target: { value: '🎯' } });

      expect(screen.getByDisplayValue('🎯')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles module without videos', () => {
      const moduleWithoutVideos = {
        ...mockModule,
        content: {
          ...mockModule.content,
          videos: undefined
        }
      };

      render(
        <ModuleEditor
          module={moduleWithoutVideos}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Navigate to videos tab
      fireEvent.click(screen.getByText(/vídeos/i));

      // Should still be able to add videos
      expect(screen.getByText(/adicionar vídeo/i)).toBeInTheDocument();
    });

    test('handles module without bibliography', () => {
      const moduleWithoutBib = {
        ...mockModule,
        content: {
          ...mockModule.content,
          bibliography: undefined
        }
      };

      render(
        <ModuleEditor
          module={moduleWithoutBib}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Navigate to resources tab
      fireEvent.click(screen.getByText(/recursos/i));

      // Should still be able to add bibliography
      expect(screen.getByText(/adicionar livro/i)).toBeInTheDocument();
    });

    test('handles invalid estimated time input', () => {
      render(
        <ModuleEditor
          module={mockModule}
          modules={mockModules}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const timeInput = screen.getByLabelText(/tempo estimado/i);
      fireEvent.change(timeInput, { target: { value: 'invalid' } });

      // Should handle NaN gracefully
      expect(timeInput).toHaveValue(null);
    });
  });
});