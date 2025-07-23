import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ModulePreview, { AISuggestion } from '../ModulePreview';
import { Module } from '../../../types';

// Mock MarkdownContent component
jest.mock('../../common', () => ({
  MarkdownContent: ({ content }: { content: string }) => <div>{content}</div>
}));

describe('ModulePreview', () => {
  const mockModule: Module = {
    id: 'test-module',
    title: 'Test Module',
    description: 'A test module for unit testing',
    icon: '🧪',
    difficulty: 'intermediate',
    estimatedTime: 60,
    content: {
      introduction: 'This is the introduction',
      sections: [
        {
          id: 'section-1',
          title: 'Section 1',
          content: 'Content of section 1',
          keyTerms: [
            { term: 'Term 1', definition: 'Definition 1' },
            { term: 'Term 2', definition: 'Definition 2' }
          ]
        },
        {
          id: 'section-2',
          title: 'Section 2',
          content: 'Content of section 2'
        }
      ],
      quiz: {
        id: 'quiz-1',
        title: 'Test Quiz',
        questions: [
          {
            id: 'q1',
            question: 'Test question 1',
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: 0,
            explanation: 'Option A is correct'
          },
          {
            id: 'q2',
            question: 'Test question 2',
            options: [
              { text: 'Complex option 1', id: 'opt1' },
              { text: 'Complex option 2', id: 'opt2' }
            ],
            correctAnswer: 1
          }
        ]
      }
    }
  };

  const mockAISuggestions: AISuggestion[] = [
    {
      id: 'suggestion-1',
      type: 'enhancement',
      target: 'section',
      targetId: 'section-1',
      suggestion: 'Add more examples to clarify the concept',
      priority: 'high'
    },
    {
      id: 'suggestion-2',
      type: 'addition',
      target: 'general',
      suggestion: 'Consider adding a quiz section',
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

  describe('Basic Rendering', () => {
    it('should render module preview header', () => {
      render(<ModulePreview {...defaultProps} />);
      
      expect(screen.getByText('Module Preview')).toBeInTheDocument();
      expect(screen.getByText('AI Generated')).toBeInTheDocument();
    });

    it('should render module information in sidebar', () => {
      render(<ModulePreview {...defaultProps} />);
      
      expect(screen.getByText('Module Structure')).toBeInTheDocument();
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Test Module')).toBeInTheDocument();
      expect(screen.getByText('Difficulty')).toBeInTheDocument();
      expect(screen.getByText('intermediate')).toBeInTheDocument();
      expect(screen.getByText('Duration')).toBeInTheDocument();
      expect(screen.getByText('60 min')).toBeInTheDocument();
    });

    it('should render all sections in sidebar', () => {
      render(<ModulePreview {...defaultProps} />);
      
      expect(screen.getByText('Sections')).toBeInTheDocument();
      expect(screen.getAllByText('Introduction')[0]).toBeInTheDocument();
      expect(screen.getByText('1.')).toBeInTheDocument();
      expect(screen.getByText('Section 1')).toBeInTheDocument();
      expect(screen.getByText('2.')).toBeInTheDocument();
      expect(screen.getByText('Section 2')).toBeInTheDocument();
      expect(screen.getByText('Quiz')).toBeInTheDocument();
    });

    it('should render introduction content by default', () => {
      render(<ModulePreview {...defaultProps} />);
      
      expect(screen.getByRole('heading', { name: 'Introduction' })).toBeInTheDocument();
      expect(screen.getByText('This is the introduction')).toBeInTheDocument();
    });

    it('should have fixed positioning and z-index', () => {
      render(<ModulePreview {...defaultProps} />);
      
      const modalContainer = screen.getByText('Module Preview').closest('.fixed');
      expect(modalContainer).toHaveClass('fixed', 'inset-0', 'bg-gray-50', 'z-40');
    });
  });

  describe('Section Navigation', () => {
    it('should expand section when clicked', () => {
      render(<ModulePreview {...defaultProps} />);
      
      // Initially, introduction is shown by default, but sections are not
      expect(screen.getByText('This is the introduction')).toBeInTheDocument();
      expect(screen.queryByText('Content of section 1')).toBeInTheDocument(); // Sections are also shown when expandedSections is empty
      
      // Click on section in sidebar to focus on it
      fireEvent.click(screen.getByText('Section 1'));
      
      // Content should still be visible
      expect(screen.getByText('Content of section 1')).toBeInTheDocument();
      // Introduction should be hidden when a specific section is selected
      expect(screen.queryByText('This is the introduction')).not.toBeInTheDocument();
    });

    it('should highlight expanded section in sidebar', () => {
      render(<ModulePreview {...defaultProps} />);
      
      const section1Button = screen.getByText('Section 1').closest('button');
      
      // Initially not highlighted
      expect(section1Button).not.toHaveClass('bg-purple-50');
      
      // Click to expand
      fireEvent.click(screen.getByText('Section 1'));
      
      // Now should be highlighted
      expect(section1Button).toHaveClass('bg-purple-50');
    });

    it('should show multiple expanded sections', () => {
      render(<ModulePreview {...defaultProps} />);
      
      // Expand first section
      fireEvent.click(screen.getByText('Section 1'));
      expect(screen.getByText('Content of section 1')).toBeInTheDocument();
      
      // Expand second section
      fireEvent.click(screen.getByText('Section 2'));
      expect(screen.getByText('Content of section 2')).toBeInTheDocument();
      
      // Both should be visible
      expect(screen.getByText('Content of section 1')).toBeInTheDocument();
      expect(screen.getByText('Content of section 2')).toBeInTheDocument();
    });

    it('should toggle quiz section visibility', () => {
      render(<ModulePreview {...defaultProps} />);
      
      // Quiz should not be visible initially
      expect(screen.queryByText('1. Test question 1')).not.toBeInTheDocument();
      
      // Click quiz section
      fireEvent.click(screen.getByText('Quiz'));
      
      // Quiz questions should now be visible
      expect(screen.getByText('1. Test question 1')).toBeInTheDocument();
      expect(screen.getByText('2. Test question 2')).toBeInTheDocument();
    });
  });

  describe('Edit Mode', () => {
    it('should show edit button when not editing', () => {
      render(<ModulePreview {...defaultProps} />);
      
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.queryByText('Save Module')).not.toBeInTheDocument();
      expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    });

    it('should show save and cancel buttons when editing', () => {
      render(<ModulePreview {...defaultProps} isEditing={true} />);
      
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
      expect(screen.getByText('Save Module')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should call onEdit when edit button clicked', () => {
      render(<ModulePreview {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Edit'));
      expect(defaultProps.onEdit).toHaveBeenCalled();
    });

    it('should show regenerate and enhance buttons in edit mode', () => {
      render(<ModulePreview {...defaultProps} isEditing={true} />);
      
      // By default, when expandedSections is empty, all sections are shown
      // So we should see regenerate buttons for intro and all sections
      const regenerateButtons = screen.getAllByText('Regenerate');
      expect(regenerateButtons.length).toBeGreaterThanOrEqual(2); // One for intro, at least one for sections
      
      // Should show enhance button for sections
      const enhanceButtons = screen.getAllByText('Enhance');
      expect(enhanceButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('should enable section editing when clicked in edit mode', () => {
      render(<ModulePreview {...defaultProps} isEditing={true} />);
      
      // Click on introduction to edit
      const introContent = screen.getByText('This is the introduction');
      fireEvent.click(introContent.parentElement!);
      
      // Should show textarea for editing
      expect(screen.getByRole('textbox')).toHaveValue('This is the introduction');
    });

    it('should update introduction content', () => {
      render(<ModulePreview {...defaultProps} isEditing={true} />);
      
      // Click to edit introduction
      fireEvent.click(screen.getByText('This is the introduction').parentElement!);
      
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Updated introduction' } });
      
      expect(defaultProps.onEdit).toHaveBeenCalledWith({
        content: expect.objectContaining({
          introduction: 'Updated introduction'
        })
      });
    });

    it('should call onSave when save button clicked', () => {
      render(<ModulePreview {...defaultProps} isEditing={true} />);
      
      fireEvent.click(screen.getByText('Save Module'));
      expect(defaultProps.onSave).toHaveBeenCalled();
    });

    it('should call onCancel when cancel button clicked', () => {
      render(<ModulePreview {...defaultProps} isEditing={true} />);
      
      fireEvent.click(screen.getByText('Cancel'));
      expect(defaultProps.onCancel).toHaveBeenCalled();
    });
  });

  describe('Section Editing', () => {
    it('should update section title and content', () => {
      render(<ModulePreview {...defaultProps} isEditing={true} />);
      
      // Expand and edit first section
      fireEvent.click(screen.getByText('Section 1'));
      fireEvent.click(screen.getByText('Content of section 1').parentElement!);
      
      // Update title
      const titleInput = screen.getByDisplayValue('Section 1');
      fireEvent.change(titleInput, { target: { value: 'Updated Section Title' } });
      
      expect(defaultProps.onEdit).toHaveBeenCalledWith({
        content: expect.objectContaining({
          sections: expect.arrayContaining([
            expect.objectContaining({
              id: 'section-1',
              title: 'Updated Section Title'
            })
          ])
        })
      });
    });

    it('should update section content', () => {
      render(<ModulePreview {...defaultProps} isEditing={true} />);
      
      // Expand and edit section
      fireEvent.click(screen.getByText('Section 1'));
      fireEvent.click(screen.getByText('Content of section 1').parentElement!);
      
      // Update content
      const contentTextarea = screen.getAllByRole('textbox')[1]; // First is title, second is content
      fireEvent.change(contentTextarea, { target: { value: 'Updated section content' } });
      
      expect(defaultProps.onEdit).toHaveBeenCalledWith({
        content: expect.objectContaining({
          sections: expect.arrayContaining([
            expect.objectContaining({
              id: 'section-1',
              content: 'Updated section content'
            })
          ])
        })
      });
    });

    it('should exit edit mode when done editing clicked', () => {
      render(<ModulePreview {...defaultProps} isEditing={true} />);
      
      // Expand and edit section
      fireEvent.click(screen.getByText('Section 1'));
      fireEvent.click(screen.getByText('Content of section 1').parentElement!);
      
      // Click done editing
      fireEvent.click(screen.getByText('Done Editing'));
      
      // Should exit edit mode for that section
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });
  });

  describe('Section Regeneration', () => {
    it('should call onSectionRegenerate for introduction', async () => {
      render(<ModulePreview {...defaultProps} isEditing={true} />);
      
      // Click regenerate for introduction
      fireEvent.click(screen.getAllByText('Regenerate')[0]);
      
      expect(defaultProps.onSectionRegenerate).toHaveBeenCalledWith('intro');
    });

    it('should call onSectionRegenerate for section', async () => {
      render(<ModulePreview {...defaultProps} isEditing={true} />);
      
      // By default all sections are shown, so we have multiple regenerate buttons
      // Find the regenerate button that's in the same container as "Section 1"
      const section1Container = screen.getByText('1. Section 1').closest('div');
      const regenerateButton = section1Container?.querySelector('button');
      
      if (regenerateButton) {
        fireEvent.click(regenerateButton);
      } else {
        // Fallback: click the second regenerate button
        const regenerateButtons = screen.getAllByText('Regenerate');
        if (regenerateButtons.length > 1) {
          fireEvent.click(regenerateButtons[1]);
        }
      }
      
      expect(defaultProps.onSectionRegenerate).toHaveBeenCalledWith('section-1');
    });

    it('should show spinning icon while regenerating', async () => {
      render(<ModulePreview {...defaultProps} isEditing={true} />);
      
      // Click regenerate
      fireEvent.click(screen.getAllByText('Regenerate')[0]);
      
      // Check for spinning animation class
      const refreshIcon = screen.getAllByText('Regenerate')[0].previousElementSibling;
      expect(refreshIcon).toHaveClass('animate-spin');
      
      // Wait for animation to finish
      await waitFor(() => {
        expect(refreshIcon).not.toHaveClass('animate-spin');
      }, { timeout: 2000 });
    });
  });

  describe('AI Suggestions Panel', () => {
    it('should display AI suggestions', () => {
      render(<ModulePreview {...defaultProps} />);
      
      expect(screen.getByText('AI Suggestions')).toBeInTheDocument();
      expect(screen.getByText('Add more examples to clarify the concept')).toBeInTheDocument();
      expect(screen.getByText('Consider adding a quiz section')).toBeInTheDocument();
    });

    it('should show correct priority icons', () => {
      const { container } = render(<ModulePreview {...defaultProps} />);
      
      // High priority - red
      expect(container.querySelector('.text-red-500')).toBeInTheDocument();
      // Medium priority - yellow
      expect(container.querySelector('.text-yellow-500')).toBeInTheDocument();
    });

    it('should display suggestion type and target', () => {
      render(<ModulePreview {...defaultProps} />);
      
      expect(screen.getByText('enhancement • section')).toBeInTheDocument();
      expect(screen.getByText('addition • general')).toBeInTheDocument();
    });

    it('should close suggestions panel when X clicked', () => {
      render(<ModulePreview {...defaultProps} />);
      
      // Find the X button in suggestions panel
      const closeButtons = screen.getAllByRole('button').filter(btn => btn.textContent === '');
      const suggestionsCloseButton = closeButtons[closeButtons.length - 1];
      
      fireEvent.click(suggestionsCloseButton);
      
      // Suggestions panel should be hidden
      expect(screen.queryByText('AI Suggestions')).not.toBeInTheDocument();
    });

    it('should not show suggestions panel when no suggestions provided', () => {
      render(<ModulePreview {...defaultProps} aiSuggestions={[]} />);
      
      expect(screen.queryByText('AI Suggestions')).not.toBeInTheDocument();
    });
  });

  describe('Additional Features', () => {
    it('should display key terms for sections', () => {
      render(<ModulePreview {...defaultProps} />);
      
      // Expand first section
      fireEvent.click(screen.getByText('Section 1'));
      
      expect(screen.getByText('Key Terms')).toBeInTheDocument();
      expect(screen.getByText('Term 1')).toBeInTheDocument();
      expect(screen.getByText('Definition 1')).toBeInTheDocument();
      expect(screen.getByText('Term 2')).toBeInTheDocument();
      expect(screen.getByText('Definition 2')).toBeInTheDocument();
    });

    it('should display quiz questions with correct answers marked', () => {
      render(<ModulePreview {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Quiz'));
      
      // Check first question
      expect(screen.getByText('1. Test question 1')).toBeInTheDocument();
      expect(screen.getByText('Option A')).toBeInTheDocument();
      
      // Check that correct answer is marked
      const correctOption = screen.getByText('Option A').previousElementSibling;
      expect(correctOption).toHaveClass('border-green-500', 'bg-green-100');
    });

    it('should handle complex option format in quiz', () => {
      render(<ModulePreview {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Quiz'));
      
      expect(screen.getByText('2. Test question 2')).toBeInTheDocument();
      expect(screen.getByText('Complex option 1')).toBeInTheDocument();
      expect(screen.getByText('Complex option 2')).toBeInTheDocument();
    });

    it('should call onCancel when X button clicked', () => {
      render(<ModulePreview {...defaultProps} />);
      
      // Find the X button in header
      const closeButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('.w-6.h-6') !== null
      );
      
      fireEvent.click(closeButton!);
      expect(defaultProps.onCancel).toHaveBeenCalled();
    });
  });
});