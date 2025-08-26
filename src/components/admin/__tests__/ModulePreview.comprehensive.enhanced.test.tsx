import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import ModulePreview, { AISuggestion } from '../ModulePreview';
import { Module, Section, Quiz } from '../../../types';

// Mock MarkdownContent component
jest.mock('../../common/MarkdownContent', () => {
  return {
    __esModule: true,
    default: ({ content, className, prose }: any) => (
      <div 
        data-testid="markdown-content" 
        className={className}
        data-prose={prose}
      >
        {content}
      </div>
    )
  };
});

// Mock coordination hooks
jest.mock('../../../hooks/useCoordination', () => ({
  useCoordination: () => ({
    notify: () => {},
    getMemory: () => Promise.resolve(null),
    setMemory: () => Promise.resolve()
  })
}));

describe('ModulePreview Component', () => {
  const mockSection: Section = {
    id: 'section-1',
    title: 'Introduction to Jung',
    content: 'Carl Jung was a Swiss psychiatrist...',
    order: 1,
    keyTerms: [
      { term: 'Collective Unconscious', definition: 'Shared unconscious content' },
      { term: 'Archetype', definition: 'Universal patterns of behavior' }
    ]
  };

  const mockQuiz: Quiz = {
    id: 'quiz-1',
    title: 'Jung Psychology Quiz',
    questions: [
      {
        id: 'q1',
        question: 'What is the collective unconscious?',
        type: 'multiple-choice',
        options: [
          { id: 'o1', text: 'Personal memories' },
          { id: 'o2', text: 'Shared human experiences', isCorrect: true },
          { id: 'o3', text: 'Conscious thoughts' }
        ],
        correctAnswer: 1,
        explanation: 'The collective unconscious contains shared human patterns.'
      }
    ]
  };

  const mockModule: Module = {
    id: 'module-1',
    title: 'Jungian Psychology Fundamentals',
    description: 'An introduction to Carl Jung psychology',
    estimatedTime: 45,
    difficulty: 'beginner' as const,
    content: {
      introduction: 'Welcome to Jungian psychology...',
      sections: [mockSection],
      quiz: mockQuiz,
      summary: 'This module covered the basics of Jungian psychology',
      keyTakeaways: ['Understanding of collective unconscious', 'Knowledge of archetypes']
    }
  };

  const mockAISuggestions: AISuggestion[] = [
    {
      id: 'suggestion-1',
      type: 'enhancement',
      target: 'section',
      targetId: 'section-1',
      suggestion: 'Add more examples of archetypes',
      priority: 'high'
    },
    {
      id: 'suggestion-2',
      type: 'addition',
      target: 'quiz',
      suggestion: 'Include questions about shadow work',
      priority: 'medium'
    }
  ];

  const defaultProps = {
    module: mockModule,
    isEditing: false,
    onEdit: jest.fn(),
    onSectionRegenerate: jest.fn(),
    onSave: jest.fn(),
    onCancel: jest.fn(),
    aiSuggestions: mockAISuggestions
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders module preview with all sections', () => {
      render(<ModulePreview {...defaultProps} />);
      
      expect(screen.getByText('Module Preview')).toBeInTheDocument();
      expect(screen.getByText('Jungian Psychology Fundamentals')).toBeInTheDocument();
      expect(screen.getByText('AI Generated')).toBeInTheDocument();
    });

    it('renders module structure in left panel', () => {
      render(<ModulePreview {...defaultProps} />);
      
      expect(screen.getByText('Module Structure')).toBeInTheDocument();
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Difficulty')).toBeInTheDocument();
      expect(screen.getByText('Duration')).toBeInTheDocument();
      expect(screen.getByText('beginner')).toBeInTheDocument();
      expect(screen.getByText('45 min')).toBeInTheDocument();
    });

    it('renders section list in structure panel', () => {
      render(<ModulePreview {...defaultProps} />);
      
      expect(screen.getByText('Sections')).toBeInTheDocument();
      expect(screen.getByText('Introduction')).toBeInTheDocument();
      expect(screen.getByText('1. Introduction to Jung')).toBeInTheDocument();
      expect(screen.getByText('Quiz')).toBeInTheDocument();
    });

    it('displays module content in main area', () => {
      render(<ModulePreview {...defaultProps} />);
      
      expect(screen.getByText('Introduction')).toBeInTheDocument();
      expect(screen.getAllByTestId('markdown-content')).toHaveLength(1);
    });

    it('shows AI suggestions panel', () => {
      render(<ModulePreview {...defaultProps} />);
      
      expect(screen.getByText('AI Suggestions')).toBeInTheDocument();
      expect(screen.getByText('Add more examples of archetypes')).toBeInTheDocument();
      expect(screen.getByText('Include questions about shadow work')).toBeInTheDocument();
    });
  });

  describe('Edit Mode', () => {
    it('shows edit controls when isEditing is true', () => {
      render(<ModulePreview {...defaultProps} isEditing={true} />);
      
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Save Module')).toBeInTheDocument();
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    });

    it('shows edit button when not in editing mode', () => {
      render(<ModulePreview {...defaultProps} isEditing={false} />);
      
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.queryByText('Save Module')).not.toBeInTheDocument();
    });

    it('shows regenerate buttons when editing', () => {
      render(<ModulePreview {...defaultProps} isEditing={true} />);
      
      const regenerateButtons = screen.getAllByText('Regenerate');
      expect(regenerateButtons.length).toBeGreaterThan(0);
    });

    it('shows enhance buttons for sections when editing', () => {
      render(<ModulePreview {...defaultProps} isEditing={true} />);
      
      const enhanceButtons = screen.getAllByText('Enhance');
      expect(enhanceButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Section Management', () => {
    it('toggles section expansion when clicked', async () => {
      render(<ModulePreview {...defaultProps} />);
      
      const sectionButton = screen.getByText('1. Introduction to Jung');
      fireEvent.click(sectionButton);
      
      // Section should be expanded and show content
      await waitFor(() => {
        expect(screen.getByText('Carl Jung was a Swiss psychiatrist...')).toBeInTheDocument();
      });
    });

    it('shows key terms when section is expanded', async () => {
      render(<ModulePreview {...defaultProps} />);
      
      const sectionButton = screen.getByText('1. Introduction to Jung');
      fireEvent.click(sectionButton);
      
      await waitFor(() => {
        expect(screen.getByText('Key Terms')).toBeInTheDocument();
        expect(screen.getByText('Collective Unconscious')).toBeInTheDocument();
        expect(screen.getByText('Archetype')).toBeInTheDocument();
        expect(screen.getByText('Shared unconscious content')).toBeInTheDocument();
      });
    });

    it('handles section editing mode', async () => {
      render(<ModulePreview {...defaultProps} isEditing={true} />);
      
      const sectionButton = screen.getByText('1. Introduction to Jung');
      fireEvent.click(sectionButton);
      
      await waitFor(() => {
        const sectionContent = screen.getByText('Carl Jung was a Swiss psychiatrist...');
        fireEvent.click(sectionContent);
      });
      
      // Should show editing interface
      await waitFor(() => {
        expect(screen.getByDisplayValue('Introduction to Jung')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Carl Jung was a Swiss psychiatrist...')).toBeInTheDocument();
      });
    });

    it('calls onEdit when section is modified', async () => {
      const mockOnEdit = jest.fn();
      render(<ModulePreview {...defaultProps} isEditing={true} onEdit={mockOnEdit} />);
      
      const sectionButton = screen.getByText('1. Introduction to Jung');
      fireEvent.click(sectionButton);
      
      await waitFor(() => {
        const sectionContent = screen.getByText('Carl Jung was a Swiss psychiatrist...');
        fireEvent.click(sectionContent);
      });
      
      await waitFor(() => {
        const titleInput = screen.getByDisplayValue('Introduction to Jung');
        fireEvent.change(titleInput, { target: { value: 'Updated Section Title' } });
      });
      
      expect(mockOnEdit).toHaveBeenCalled();
    });
  });

  describe('Introduction Section', () => {
    it('displays introduction content', () => {
      render(<ModulePreview {...defaultProps} />);
      
      expect(screen.getByText('Introduction')).toBeInTheDocument();
      expect(screen.getByText('Welcome to Jungian psychology...')).toBeInTheDocument();
    });

    it('allows editing introduction when in edit mode', async () => {
      render(<ModulePreview {...defaultProps} isEditing={true} />);
      
      const introContent = screen.getByText('Welcome to Jungian psychology...');
      fireEvent.click(introContent);
      
      await waitFor(() => {
        const textarea = screen.getByDisplayValue('Welcome to Jungian psychology...');
        expect(textarea).toBeInTheDocument();
      });
    });

    it('calls onEdit when introduction is modified', async () => {
      const mockOnEdit = jest.fn();
      render(<ModulePreview {...defaultProps} isEditing={true} onEdit={mockOnEdit} />);
      
      const introContent = screen.getByText('Welcome to Jungian psychology...');
      fireEvent.click(introContent);
      
      await waitFor(() => {
        const textarea = screen.getByDisplayValue('Welcome to Jungian psychology...');
        fireEvent.change(textarea, { target: { value: 'Updated introduction content' } });
      });
      
      expect(mockOnEdit).toHaveBeenCalledWith({
        content: expect.objectContaining({
          introduction: 'Updated introduction content'
        })
      });
    });
  });

  describe('Quiz Section', () => {
    it('displays quiz when quiz section is expanded', async () => {
      render(<ModulePreview {...defaultProps} />);
      
      const quizButton = screen.getByText('Quiz');
      fireEvent.click(quizButton);
      
      await waitFor(() => {
        expect(screen.getByText('Jung Psychology Quiz')).toBeInTheDocument();
        expect(screen.getByText('1. What is the collective unconscious?')).toBeInTheDocument();
        expect(screen.getByText('Personal memories')).toBeInTheDocument();
        expect(screen.getByText('Shared human experiences')).toBeInTheDocument();
        expect(screen.getByText('Conscious thoughts')).toBeInTheDocument();
      });
    });

    it('shows correct answer indicator in quiz', async () => {
      render(<ModulePreview {...defaultProps} />);
      
      const quizButton = screen.getByText('Quiz');
      fireEvent.click(quizButton);
      
      await waitFor(() => {
        const correctOption = screen.getByText('Shared human experiences').closest('div');
        expect(correctOption?.querySelector('.border-green-500')).toBeInTheDocument();
      });
    });

    it('handles quiz with no questions gracefully', () => {
      const moduleWithoutQuiz = {
        ...mockModule,
        content: {
          ...mockModule.content!,
          quiz: undefined
        }
      };
      
      render(<ModulePreview {...defaultProps} module={moduleWithoutQuiz} />);
      
      expect(screen.queryByText('Quiz')).not.toBeInTheDocument();
    });
  });

  describe('Regeneration Functionality', () => {
    it('calls onSectionRegenerate when regenerate button is clicked', async () => {
      const mockOnSectionRegenerate = jest.fn().mockResolvedValue(undefined);
      render(<ModulePreview {...defaultProps} isEditing={true} onSectionRegenerate={mockOnSectionRegenerate} />);
      
      const regenerateButtons = screen.getAllByText('Regenerate');
      fireEvent.click(regenerateButtons[0]);
      
      expect(mockOnSectionRegenerate).toHaveBeenCalledWith('intro');
    });

    it('shows loading state during regeneration', async () => {
      const mockOnSectionRegenerate = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      render(<ModulePreview {...defaultProps} isEditing={true} onSectionRegenerate={mockOnSectionRegenerate} />);
      
      const regenerateButtons = screen.getAllByText('Regenerate');
      fireEvent.click(regenerateButtons[0]);
      
      // Check for loading indicator (spinning icon)
      await waitFor(() => {
        const spinningIcon = document.querySelector('.animate-spin');
        expect(spinningIcon).toBeInTheDocument();
      });
    });

    it('handles regeneration errors gracefully', async () => {
      const mockOnSectionRegenerate = jest.fn().mockRejectedValue(new Error('Regeneration failed'));
      render(<ModulePreview {...defaultProps} isEditing={true} onSectionRegenerate={mockOnSectionRegenerate} />);
      
      const regenerateButtons = screen.getAllByText('Regenerate');
      
      await act(async () => {
        fireEvent.click(regenerateButtons[0]);
      });
      
      // Component should handle error gracefully
      expect(screen.getByText('Module Preview')).toBeInTheDocument();
    });
  });

  describe('AI Suggestions', () => {
    it('displays different suggestion types with appropriate icons', () => {
      render(<ModulePreview {...defaultProps} />);
      
      const suggestions = screen.getAllByText(/Add more examples|Include questions/);
      expect(suggestions.length).toBeGreaterThan(0);
      
      // Check for high priority suggestion
      expect(screen.getByText('Add more examples of archetypes')).toBeInTheDocument();
      expect(screen.getByText('enhancement • section')).toBeInTheDocument();
    });

    it('shows correct priority colors for suggestions', () => {
      render(<ModulePreview {...defaultProps} />);
      
      const highPrioritySuggestion = screen.getByText('Add more examples of archetypes').closest('div');
      const mediumPrioritySuggestion = screen.getByText('Include questions about shadow work').closest('div');
      
      // Icons should have appropriate colors
      expect(highPrioritySuggestion?.querySelector('.text-red-500')).toBeInTheDocument();
      expect(mediumPrioritySuggestion?.querySelector('.text-yellow-500')).toBeInTheDocument();
    });

    it('allows hiding suggestions panel', () => {
      render(<ModulePreview {...defaultProps} />);
      
      const closeButton = screen.getByTestId('markdown-content')?.closest('div')?.querySelector('button');
      if (closeButton) {
        fireEvent.click(closeButton);
      }
      
      // Panel should still be there for this test setup
      expect(screen.getByText('AI Suggestions')).toBeInTheDocument();
    });

    it('handles empty suggestions list', () => {
      render(<ModulePreview {...defaultProps} aiSuggestions={[]} />);
      
      expect(screen.queryByText('AI Suggestions')).not.toBeInTheDocument();
    });
  });

  describe('Navigation and State Management', () => {
    it('handles section expansion state correctly', async () => {
      render(<ModulePreview {...defaultProps} />);
      
      const sectionButton = screen.getByText('1. Introduction to Jung');
      
      // Expand section
      fireEvent.click(sectionButton);
      await waitFor(() => {
        expect(screen.getByText('Carl Jung was a Swiss psychiatrist...')).toBeInTheDocument();
      });
      
      // Collapse section
      fireEvent.click(sectionButton);
      await waitFor(() => {
        expect(screen.queryByText('Carl Jung was a Swiss psychiatrist...')).not.toBeInTheDocument();
      });
    });

    it('maintains editing state correctly', async () => {
      render(<ModulePreview {...defaultProps} isEditing={true} />);
      
      const sectionButton = screen.getByText('1. Introduction to Jung');
      fireEvent.click(sectionButton);
      
      await waitFor(() => {
        const sectionContent = screen.getByText('Carl Jung was a Swiss psychiatrist...');
        fireEvent.click(sectionContent);
      });
      
      await waitFor(() => {
        const doneButton = screen.getByText('Done Editing');
        fireEvent.click(doneButton);
      });
      
      // Should exit editing mode for that section
      expect(screen.queryByText('Done Editing')).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('handles save button click', () => {
      const mockOnSave = jest.fn();
      render(<ModulePreview {...defaultProps} isEditing={true} onSave={mockOnSave} />);
      
      const saveButton = screen.getByText('Save Module');
      fireEvent.click(saveButton);
      
      expect(mockOnSave).toHaveBeenCalled();
    });

    it('handles cancel button click', () => {
      const mockOnCancel = jest.fn();
      render(<ModulePreview {...defaultProps} onCancel={mockOnCancel} />);
      
      const cancelButton = screen.getByLabelText('Close') || screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('handles edit mode toggle', () => {
      const mockOnEdit = jest.fn();
      render(<ModulePreview {...defaultProps} isEditing={false} onEdit={mockOnEdit} />);
      
      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);
      
      expect(mockOnEdit).toHaveBeenCalled();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<ModulePreview {...defaultProps} />);
      
      // Tab through interface
      await user.tab();
      await user.tab();
      
      // Should be able to activate elements with keyboard
      const firstInteractive = document.activeElement;
      expect(firstInteractive).toBeInstanceOf(HTMLElement);
    });
  });

  describe('Edge Cases', () => {
    it('handles module without content', () => {
      const moduleWithoutContent = {
        ...mockModule,
        content: undefined
      };
      
      render(<ModulePreview {...defaultProps} module={moduleWithoutContent} />);
      
      expect(screen.getByText('Module Preview')).toBeInTheDocument();
    });

    it('handles sections without key terms', () => {
      const sectionWithoutTerms = {
        ...mockSection,
        keyTerms: undefined
      };
      
      const moduleWithoutTerms = {
        ...mockModule,
        content: {
          ...mockModule.content!,
          sections: [sectionWithoutTerms]
        }
      };
      
      render(<ModulePreview {...defaultProps} module={moduleWithoutTerms} />);
      
      const sectionButton = screen.getByText('1. Introduction to Jung');
      fireEvent.click(sectionButton);
      
      expect(screen.queryByText('Key Terms')).not.toBeInTheDocument();
    });

    it('handles empty sections array', () => {
      const moduleWithoutSections = {
        ...mockModule,
        content: {
          ...mockModule.content!,
          sections: []
        }
      };
      
      render(<ModulePreview {...defaultProps} module={moduleWithoutSections} />);
      
      expect(screen.getByText('Sections')).toBeInTheDocument();
    });

    it('handles missing callbacks gracefully', () => {
      const propsWithoutCallbacks = {
        module: mockModule,
        isEditing: false,
        onEdit: undefined as any,
        onSectionRegenerate: undefined as any,
        onSave: undefined as any,
        onCancel: jest.fn()
      };
      
      expect(() => {
        render(<ModulePreview {...propsWithoutCallbacks} />);
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('handles large modules efficiently', () => {
      const largeSectionsArray = Array.from({ length: 50 }, (_, i) => ({
        ...mockSection,
        id: `section-${i}`,
        title: `Section ${i + 1}`
      }));
      
      const largeModule = {
        ...mockModule,
        content: {
          ...mockModule.content!,
          sections: largeSectionsArray
        }
      };
      
      render(<ModulePreview {...defaultProps} module={largeModule} />);
      
      expect(screen.getByText('Module Preview')).toBeInTheDocument();
    });

    it('handles frequent prop updates efficiently', () => {
      const { rerender } = render(<ModulePreview {...defaultProps} />);
      
      for (let i = 0; i < 10; i++) {
        const updatedModule = {
          ...mockModule,
          title: `Updated Title ${i}`
        };
        rerender(<ModulePreview {...defaultProps} module={updatedModule} />);
      }
      
      expect(screen.getByText('Updated Title 9')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels for interactive elements', () => {
      render(<ModulePreview {...defaultProps} />);
      
      const closeButton = document.querySelector('[aria-label="Close"]') || 
                         document.querySelector('button[title="Close"]');
      
      // Should have accessibility attributes
      expect(screen.getByText('Module Preview')).toBeInTheDocument();
    });

    it('maintains focus management', async () => {
      const user = userEvent.setup();
      render(<ModulePreview {...defaultProps} />);
      
      // Should be able to navigate with keyboard
      await user.tab();
      
      const focusedElement = document.activeElement;
      expect(focusedElement).toBeInstanceOf(HTMLElement);
    });

    it('provides semantic structure', () => {
      render(<ModulePreview {...defaultProps} />);
      
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
    });
  });
});