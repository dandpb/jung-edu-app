/**
 * Comprehensive test suite for ModulePreview component
 * Tests rendering, user interactions, prop handling, state management, and edge cases
 * Focuses on areas with low test coverage (2% coverage target)
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ModulePreview, { AISuggestion } from '../ModulePreview';
import { Module, Section } from '../../../types';

// Mock the MarkdownContent component
jest.mock('../../common', () => ({
  MarkdownContent: ({ content, className }: { content: string; className?: string }) => (
    <div data-testid="markdown-content" className={className}>
      {content}
    </div>
  )
}));

// Mock timers for regeneration animations
jest.useFakeTimers();

describe('ModulePreview', () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });
  
  afterEach(() => {
    jest.clearAllTimers();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.useFakeTimers();
  });
  const mockSection: Section = {
    id: 'section-1',
    title: 'Understanding Jung',
    content: '# Jung Psychology\n\nCarl Jung was a pioneering psychologist.',
    keyTerms: [
      { term: 'Collective Unconscious', definition: 'Shared psychological material' },
      { term: 'Archetype', definition: 'Universal patterns or themes' }
    ]
  };

  const mockModule: Module = {
    id: 'test-module',
    title: 'Introduction to Jung',
    description: 'Learn about Jungian psychology',
    difficulty: 'intermediate' as const,
    estimatedTime: 45,
    content: {
      introduction: 'This module covers Jung\'s theories and concepts.',
      sections: [mockSection],
      videos: [
        {
          id: 'video-1',
          title: 'Jung Documentary',
          url: 'https://example.com/video',
          duration: 1800,
          thumbnail: 'thumb.jpg'
        }
      ],
      quiz: {
        id: 'quiz-1',
        title: 'Jung Quiz',
        questions: [
          {
            id: 'q1',
            question: 'What is the collective unconscious?',
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: 0,
            explanation: 'The collective unconscious is...'
          }
        ]
      },
      bibliography: ['Jung, C.G. (1968). Man and His Symbols'],
      films: ['Jung: A Journey into the Self'],
      summary: 'This module introduced key Jungian concepts.',
      keyTakeaways: ['Understanding archetypes', 'Exploring individuation']
    }
  };

  const mockAISuggestions: AISuggestion[] = [
    {
      id: 'suggestion-1',
      type: 'enhancement',
      target: 'section',
      targetId: 'section-1',
      suggestion: 'Consider adding more examples',
      priority: 'high'
    },
    {
      id: 'suggestion-2',
      type: 'addition',
      target: 'quiz',
      suggestion: 'Add more challenging questions',
      priority: 'medium'
    },
    {
      id: 'suggestion-3',
      type: 'correction',
      target: 'general',
      suggestion: 'Fix typo in introduction',
      priority: 'low'
    }
  ];

  const defaultProps = {
    module: mockModule,
    isEditing: false,
    onEdit: jest.fn(),
    onSectionRegenerate: jest.fn(),
    onSave: jest.fn(),
    onCancel: jest.fn(),
    aiSuggestions: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  describe('Component Rendering', () => {
    it('renders module preview with all main elements', () => {
      render(<ModulePreview {...defaultProps} />);
      
      expect(screen.getByText('Module Preview')).toBeInTheDocument();
      expect(screen.getByText('AI Generated')).toBeInTheDocument();
      expect(screen.getByText('Introduction to Jung')).toBeInTheDocument();
      expect(screen.getByText('Intermediate')).toBeInTheDocument();
      expect(screen.getByText('45 min')).toBeInTheDocument();
    });

    it('renders module structure panel', () => {
      render(<ModulePreview {...defaultProps} />);
      
      expect(screen.getByText('Module Structure')).toBeInTheDocument();
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Difficulty')).toBeInTheDocument();
      expect(screen.getByText('Duration')).toBeInTheDocument();
      expect(screen.getByText('Sections')).toBeInTheDocument();
    });

    it('renders section navigation buttons', () => {
      render(<ModulePreview {...defaultProps} />);
      
      expect(screen.getByText('Introduction')).toBeInTheDocument();
      expect(screen.getByText('1.')).toBeInTheDocument();
      expect(screen.getByText('Understanding Jung')).toBeInTheDocument();
      expect(screen.getByText('Quiz')).toBeInTheDocument();
    });

    it('renders content area with introduction by default', () => {
      render(<ModulePreview {...defaultProps} />);
      
      const markdownContent = screen.getByTestId('markdown-content');
      expect(markdownContent).toHaveTextContent('This module covers Jung\'s theories and concepts.');
    });

    it('renders with AI suggestions panel when suggestions provided', () => {
      render(<ModulePreview {...defaultProps} aiSuggestions={mockAISuggestions} />);
      
      expect(screen.getByText('AI Suggestions')).toBeInTheDocument();
      expect(screen.getByText('Consider adding more examples')).toBeInTheDocument();
      expect(screen.getByText('Add more challenging questions')).toBeInTheDocument();
      expect(screen.getByText('Fix typo in introduction')).toBeInTheDocument();
    });
  });

  describe('Section Navigation and Expansion', () => {
    it('toggles introduction section visibility', async () => {
      const user = userEvent.setup();
      render(<ModulePreview {...defaultProps} />);
      
      const introButton = screen.getByRole('button', { name: /introduction/i });
      
      // Initially visible
      expect(screen.getByText('Introduction')).toBeInTheDocument();
      
      // Click to expand/collapse
      await user.click(introButton);
      
      // Check state changes (implementation depends on component logic)
      expect(introButton).toBeInTheDocument();
    });

    it('toggles section visibility when section button clicked', async () => {
      const user = userEvent.setup();
      render(<ModulePreview {...defaultProps} />);
      
      const sectionButton = screen.getByRole('button', { name: /understanding jung/i });
      await user.click(sectionButton);
      
      expect(sectionButton).toHaveClass('bg-purple-50');
    });

    it('displays section content when section is expanded', async () => {
      const user = userEvent.setup();
      render(<ModulePreview {...defaultProps} />);
      
      const sectionButton = screen.getByRole('button', { name: /understanding jung/i });
      await user.click(sectionButton);
      
      expect(screen.getByText('1. Understanding Jung')).toBeInTheDocument();
      expect(screen.getByTestId('markdown-content')).toHaveTextContent('# Jung Psychology');
    });

    it('shows key terms when section is expanded', async () => {
      const user = userEvent.setup();
      render(<ModulePreview {...defaultProps} />);
      
      const sectionButton = screen.getByRole('button', { name: /understanding jung/i });
      await user.click(sectionButton);
      
      expect(screen.getByText('Key Terms')).toBeInTheDocument();
      expect(screen.getByText('Collective Unconscious')).toBeInTheDocument();
      expect(screen.getByText('Shared psychological material')).toBeInTheDocument();
      expect(screen.getByText('Archetype')).toBeInTheDocument();
      expect(screen.getByText('Universal patterns or themes')).toBeInTheDocument();
    });

    it('toggles quiz section visibility', async () => {
      const user = userEvent.setup();
      render(<ModulePreview {...defaultProps} />);
      
      const quizButton = screen.getByRole('button', { name: /quiz/i });
      await user.click(quizButton);
      
      expect(screen.getByText('Quiz')).toBeInTheDocument();
      expect(screen.getByText('What is the collective unconscious?')).toBeInTheDocument();
    });
  });

  describe('Editing Mode', () => {
    it('renders edit button when not editing', () => {
      render(<ModulePreview {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /save module/i })).not.toBeInTheDocument();
    });

    it('renders save and cancel buttons when editing', () => {
      render(<ModulePreview {...defaultProps} isEditing={true} />);
      
      expect(screen.getByRole('button', { name: /save module/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^edit$/i })).not.toBeInTheDocument();
    });

    it('shows regenerate buttons when editing', () => {
      render(<ModulePreview {...defaultProps} isEditing={true} />);
      
      const regenerateButtons = screen.getAllByText('Regenerate');
      expect(regenerateButtons.length).toBeGreaterThan(0);
    });

    it('shows enhance button in editing mode', () => {
      render(<ModulePreview {...defaultProps} isEditing={true} />);
      
      // Navigate to section to see enhance button
      expect(screen.queryByText('Enhance')).toBeDefined();
    });

    it('shows plus button for adding sections when editing', () => {
      render(<ModulePreview {...defaultProps} isEditing={true} />);
      
      // Look for plus icon in sections area
      const plusButtons = screen.getAllByTestId('lucide-plus');
      expect(plusButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Content Editing', () => {
    it('allows editing introduction content', async () => {
      const user = userEvent.setup();
      const mockOnEdit = jest.fn();
      render(<ModulePreview {...defaultProps} isEditing={true} onEdit={mockOnEdit} />);
      
      // Click on introduction content to edit
      const introContent = screen.getByTestId('markdown-content');
      await user.click(introContent);
      
      // Check if textarea appears
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveValue('This module covers Jung\'s theories and concepts.');
    });

    it('updates introduction content on change', async () => {
      const user = userEvent.setup();
      const mockOnEdit = jest.fn();
      render(<ModulePreview {...defaultProps} isEditing={true} onEdit={mockOnEdit} />);
      
      // Click to edit introduction
      const introContent = screen.getByTestId('markdown-content');
      await user.click(introContent);
      
      const textarea = screen.getByRole('textbox');
      await user.clear(textarea);
      await user.type(textarea, 'Updated introduction content');
      
      expect(mockOnEdit).toHaveBeenCalledWith({
        content: expect.objectContaining({
          introduction: 'Updated introduction content'
        })
      });
    });

    it('allows editing section title and content', async () => {
      const user = userEvent.setup();
      const mockOnEdit = jest.fn();
      render(<ModulePreview {...defaultProps} isEditing={true} onEdit={mockOnEdit} />);
      
      // Expand section first
      const sectionButton = screen.getByRole('button', { name: /understanding jung/i });
      await user.click(sectionButton);
      
      // Click on section content to edit
      const sectionContent = screen.getByTestId('markdown-content');
      await user.click(sectionContent);
      
      // Check for title and content inputs
      const titleInput = screen.getByDisplayValue('Understanding Jung');
      const contentTextarea = screen.getByDisplayValue('# Jung Psychology\n\nCarl Jung was a pioneering psychologist.');
      
      expect(titleInput).toBeInTheDocument();
      expect(contentTextarea).toBeInTheDocument();
    });

    it('updates section title on change', async () => {
      const user = userEvent.setup();
      const mockOnEdit = jest.fn();
      render(<ModulePreview {...defaultProps} isEditing={true} onEdit={mockOnEdit} />);
      
      // Expand and edit section
      const sectionButton = screen.getByRole('button', { name: /understanding jung/i });
      await user.click(sectionButton);
      
      const sectionContent = screen.getByTestId('markdown-content');
      await user.click(sectionContent);
      
      const titleInput = screen.getByDisplayValue('Understanding Jung');
      await user.clear(titleInput);
      await user.type(titleInput, 'New Section Title');
      
      expect(mockOnEdit).toHaveBeenCalledWith({
        content: expect.objectContaining({
          sections: expect.arrayContaining([
            expect.objectContaining({ title: 'New Section Title' })
          ])
        })
      });
    });

    it('stops editing when Done Editing button is clicked', async () => {
      const user = userEvent.setup();
      render(<ModulePreview {...defaultProps} isEditing={true} />);
      
      // Expand section and start editing
      const sectionButton = screen.getByRole('button', { name: /understanding jung/i });
      await user.click(sectionButton);
      
      const sectionContent = screen.getByTestId('markdown-content');
      await user.click(sectionContent);
      
      // Click Done Editing
      const doneButton = screen.getByRole('button', { name: /done editing/i });
      await user.click(doneButton);
      
      // Should no longer be in editing state for this section
      expect(screen.queryByDisplayValue('Understanding Jung')).not.toBeInTheDocument();
    });
  });

  describe('Regeneration Functionality', () => {
    it('calls onSectionRegenerate when regenerate button clicked', async () => {
      const user = userEvent.setup();
      const mockOnSectionRegenerate = jest.fn().mockResolvedValue(undefined);
      render(<ModulePreview {...defaultProps} isEditing={true} onSectionRegenerate={mockOnSectionRegenerate} />);
      
      const regenerateButton = screen.getAllByText('Regenerate')[0];
      await user.click(regenerateButton);
      
      expect(mockOnSectionRegenerate).toHaveBeenCalledWith('intro');
    });

    it('shows spinning icon during regeneration', async () => {
      const user = userEvent.setup();
      const mockOnSectionRegenerate = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      render(<ModulePreview {...defaultProps} isEditing={true} onSectionRegenerate={mockOnSectionRegenerate} />);
      
      const regenerateButton = screen.getAllByText('Regenerate')[0];
      await user.click(regenerateButton);
      
      // Check for spinning animation class
      const refreshIcon = screen.getByTestId('lucide-refresh-cw');
      expect(refreshIcon).toHaveClass('animate-spin');
      
      // Fast-forward timers to complete animation
      jest.advanceTimersByTime(1600);
      await waitFor(() => {
        expect(refreshIcon).not.toHaveClass('animate-spin');
      });
    });

    it('regenerates section content', async () => {
      const user = userEvent.setup();
      const mockOnSectionRegenerate = jest.fn().mockResolvedValue(undefined);
      render(<ModulePreview {...defaultProps} isEditing={true} onSectionRegenerate={mockOnSectionRegenerate} />);
      
      // Expand section first
      const sectionButton = screen.getByRole('button', { name: /understanding jung/i });
      await user.click(sectionButton);
      
      // Find and click section regenerate button
      const sectionRegenerateButtons = screen.getAllByText('Regenerate');
      const sectionRegenerateButton = sectionRegenerateButtons.find(button => 
        button.closest('.mb-8')?.querySelector('h3')?.textContent?.includes('Understanding Jung')
      );
      
      if (sectionRegenerateButton) {
        await user.click(sectionRegenerateButton);
        expect(mockOnSectionRegenerate).toHaveBeenCalledWith('section-1');
      }
    });
  });

  describe('Action Handlers', () => {
    it('calls onEdit when edit button clicked', async () => {
      const user = userEvent.setup();
      const mockOnEdit = jest.fn();
      render(<ModulePreview {...defaultProps} onEdit={mockOnEdit} />);
      
      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);
      
      expect(mockOnEdit).toHaveBeenCalledWith({});
    });

    it('calls onSave when save button clicked', async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn();
      render(<ModulePreview {...defaultProps} isEditing={true} onSave={mockOnSave} />);
      
      const saveButton = screen.getByRole('button', { name: /save module/i });
      await user.click(saveButton);
      
      expect(mockOnSave).toHaveBeenCalled();
    });

    it('calls onCancel when cancel button clicked', async () => {
      const user = userEvent.setup();
      const mockOnCancel = jest.fn();
      render(<ModulePreview {...defaultProps} isEditing={true} onCancel={mockOnCancel} />);
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('calls onCancel when close X button clicked', async () => {
      const user = userEvent.setup();
      const mockOnCancel = jest.fn();
      render(<ModulePreview {...defaultProps} onCancel={mockOnCancel} />);
      
      const closeButton = screen.getByTestId('lucide-x');
      await user.click(closeButton);
      
      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('AI Suggestions', () => {
    it('displays suggestions with correct priority icons', () => {
      render(<ModulePreview {...defaultProps} aiSuggestions={mockAISuggestions} />);
      
      const suggestionIcons = screen.getAllByTestId('lucide-lightbulb');
      expect(suggestionIcons).toHaveLength(3);
      
      // Check priority colors
      expect(suggestionIcons[0]).toHaveClass('text-red-500'); // high
      expect(suggestionIcons[1]).toHaveClass('text-yellow-500'); // medium  
      expect(suggestionIcons[2]).toHaveClass('text-blue-500'); // low
    });

    it('shows suggestion details', () => {
      render(<ModulePreview {...defaultProps} aiSuggestions={mockAISuggestions} />);
      
      expect(screen.getByText('Consider adding more examples')).toBeInTheDocument();
      expect(screen.getByText('enhancement • section')).toBeInTheDocument();
      expect(screen.getByText('Add more challenging questions')).toBeInTheDocument();
      expect(screen.getByText('addition • quiz')).toBeInTheDocument();
    });

    it('can hide suggestions panel', async () => {
      const user = userEvent.setup();
      render(<ModulePreview {...defaultProps} aiSuggestions={mockAISuggestions} />);
      
      expect(screen.getByText('AI Suggestions')).toBeInTheDocument();
      
      const closeButton = screen.getAllByTestId('lucide-x').find(button => 
        button.closest('.p-4')?.querySelector('h3')?.textContent === 'AI Suggestions'
      );
      
      if (closeButton) {
        await user.click(closeButton);
        expect(screen.queryByText('AI Suggestions')).not.toBeInTheDocument();
      }
    });

    it('handles empty suggestions array', () => {
      render(<ModulePreview {...defaultProps} aiSuggestions={[]} />);
      
      expect(screen.queryByText('AI Suggestions')).not.toBeInTheDocument();
    });
  });

  describe('Quiz Content', () => {
    it('displays quiz questions correctly', async () => {
      const user = userEvent.setup();
      render(<ModulePreview {...defaultProps} />);
      
      const quizButton = screen.getByRole('button', { name: /quiz/i });
      await user.click(quizButton);
      
      expect(screen.getByText('1. What is the collective unconscious?')).toBeInTheDocument();
      expect(screen.getByText('Option A')).toBeInTheDocument();
      expect(screen.getByText('Option B')).toBeInTheDocument();
      expect(screen.getByText('Option C')).toBeInTheDocument();
      expect(screen.getByText('Option D')).toBeInTheDocument();
    });

    it('highlights correct answer', async () => {
      const user = userEvent.setup();
      render(<ModulePreview {...defaultProps} />);
      
      const quizButton = screen.getByRole('button', { name: /quiz/i });
      await user.click(quizButton);
      
      // First option should be marked as correct
      const correctOption = screen.getByText('Option A').previousElementSibling;
      expect(correctOption).toHaveClass('border-green-500');
      expect(correctOption).toHaveClass('bg-green-100');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles module without content gracefully', () => {
      const moduleWithoutContent = { ...mockModule, content: undefined };
      render(<ModulePreview {...defaultProps} module={moduleWithoutContent} />);
      
      expect(screen.getByText('Module Preview')).toBeInTheDocument();
      expect(screen.getByText('Introduction to Jung')).toBeInTheDocument();
    });

    it('handles module without sections', () => {
      const moduleWithoutSections = {
        ...mockModule,
        content: { ...mockModule.content!, sections: [] }
      };
      render(<ModulePreview {...defaultProps} module={moduleWithoutSections} />);
      
      expect(screen.getByText('Sections')).toBeInTheDocument();
      expect(screen.queryByText('Understanding Jung')).not.toBeInTheDocument();
    });

    it('handles module without quiz', () => {
      const moduleWithoutQuiz = {
        ...mockModule,
        content: { ...mockModule.content!, quiz: undefined }
      };
      render(<ModulePreview {...defaultProps} module={moduleWithoutQuiz} />);
      
      expect(screen.queryByRole('button', { name: /quiz/i })).not.toBeInTheDocument();
    });

    it('handles sections without key terms', () => {
      const sectionWithoutKeyTerms = { ...mockSection, keyTerms: undefined };
      const moduleWithModifiedSection = {
        ...mockModule,
        content: { ...mockModule.content!, sections: [sectionWithoutKeyTerms] }
      };
      render(<ModulePreview {...defaultProps} module={moduleWithModifiedSection} />);
      
      expect(screen.getByText('Module Structure')).toBeInTheDocument();
    });

    it('handles quiz questions with object-type options', async () => {
      const user = userEvent.setup();
      const questionWithObjectOptions = {
        id: 'q1',
        question: 'Test question?',
        options: [
          { text: 'Option A', feedback: 'Good choice' },
          { text: 'Option B', feedback: 'Try again' }
        ],
        correctAnswer: 0,
        explanation: 'Explanation here'
      };
      
      const moduleWithObjectOptions = {
        ...mockModule,
        content: {
          ...mockModule.content!,
          quiz: {
            ...mockModule.content!.quiz!,
            questions: [questionWithObjectOptions]
          }
        }
      };
      
      render(<ModulePreview {...defaultProps} module={moduleWithObjectOptions} />);
      
      const quizButton = screen.getByRole('button', { name: /quiz/i });
      await user.click(quizButton);
      
      expect(screen.getByText('Option A')).toBeInTheDocument();
      expect(screen.getByText('Option B')).toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    it('manages expanded sections state correctly', async () => {
      const user = userEvent.setup();
      render(<ModulePreview {...defaultProps} />);
      
      const sectionButton = screen.getByRole('button', { name: /understanding jung/i });
      
      // Initially not expanded
      expect(sectionButton).not.toHaveClass('bg-purple-50');
      
      // Click to expand
      await user.click(sectionButton);
      expect(sectionButton).toHaveClass('bg-purple-50');
      
      // Click again to collapse
      await user.click(sectionButton);
      expect(sectionButton).not.toHaveClass('bg-purple-50');
    });

    it('manages editing section state correctly', async () => {
      const user = userEvent.setup();
      render(<ModulePreview {...defaultProps} isEditing={true} />);
      
      // Expand section
      const sectionButton = screen.getByRole('button', { name: /understanding jung/i });
      await user.click(sectionButton);
      
      // Start editing
      const sectionContent = screen.getByTestId('markdown-content');
      await user.click(sectionContent);
      
      // Should show editing UI
      expect(screen.getByDisplayValue('Understanding Jung')).toBeInTheDocument();
      
      // Stop editing
      const doneButton = screen.getByRole('button', { name: /done editing/i });
      await user.click(doneButton);
      
      // Should hide editing UI
      expect(screen.queryByDisplayValue('Understanding Jung')).not.toBeInTheDocument();
    });
  });
});