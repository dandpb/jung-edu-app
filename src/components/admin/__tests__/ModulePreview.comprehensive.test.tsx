/**
 * Comprehensive test suite for ModulePreview component
 * Tests module preview display, editing, navigation, and all interactions
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ModulePreview from '../ModulePreview';
import { AdminContext } from '../../../contexts/AdminContext';
import { Module } from '../../../types';

// Mock AdminContext
const mockAdminContext = {
  isAdmin: true,
  setIsAdmin: jest.fn(),
  adminConfig: {
    enableAI: true,
    enableVideoGeneration: true,
    enableBibliographyGeneration: true,
    maxModulesPerGeneration: 5,
    systemPrompts: {
      moduleGeneration: 'Test prompt',
      quizGeneration: 'Test quiz prompt',
      videoGeneration: 'Test video prompt'
    }
  },
  updateConfig: jest.fn()
};

const AdminContextWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AdminContext.Provider value={mockAdminContext}>
    {children}
  </AdminContext.Provider>
);

describe('ModulePreview', () => {
  const mockModule: Module = {
    id: 'test-module-1',
    title: 'Introduction to Jungian Psychology',
    description: 'A comprehensive overview of Carl Jung\'s analytical psychology',
    content: `
      # Introduction
      
      Carl Gustav Jung was a Swiss psychiatrist and psychoanalyst who founded analytical psychology.
      
      ## Key Concepts
      
      - Collective Unconscious
      - Archetypes
      - Individuation Process
      
      ### The Shadow
      
      The shadow represents the hidden or unconscious aspects of personality.
    `,
    difficulty: 'intermediate',
    estimatedTime: 60,
    objectives: [
      'Understand Jung\'s basic concepts',
      'Identify key archetypes',
      'Explore the individuation process'
    ],
    prerequisites: ['basic-psychology'],
    resources: [
      {
        type: 'video',
        title: 'Jung Documentary',
        url: 'https://youtube.com/watch?v=example'
      }
    ],
    quiz: {
      id: 'quiz-1',
      title: 'Jung Quiz',
      questions: [
        {
          id: 'q1',
          type: 'multiple-choice',
          question: 'What is the collective unconscious?',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 0,
          explanation: 'Explanation here'
        }
      ],
      metadata: {
        difficulty: 'intermediate',
        estimatedTime: 300
      }
    }
  };

  const defaultProps = {
    module: mockModule,
    isVisible: true,
    onClose: jest.fn(),
    onEdit: jest.fn(),
    onSave: jest.fn(),
    onPublish: jest.fn(),
    isEditing: false,
    isSaving: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('visibility', () => {
    it('should render when visible', () => {
      render(
        <AdminContextWrapper>
          <ModulePreview {...defaultProps} />
        </AdminContextWrapper>
      );

      expect(screen.getByTestId('module-preview')).toBeInTheDocument();
      expect(screen.getByText('Introduction to Jungian Psychology')).toBeInTheDocument();
    });

    it('should not render when not visible', () => {
      render(
        <AdminContextWrapper>
          <ModulePreview {...defaultProps} isVisible={false} />
        </AdminContextWrapper>
      );

      expect(screen.queryByTestId('module-preview')).not.toBeInTheDocument();
    });
  });

  describe('module content display', () => {
    it('should display module title and description', () => {
      render(
        <AdminContextWrapper>
          <ModulePreview {...defaultProps} />
        </AdminContextWrapper>
      );

      expect(screen.getByText('Introduction to Jungian Psychology')).toBeInTheDocument();
      expect(screen.getByText('A comprehensive overview of Carl Jung\'s analytical psychology')).toBeInTheDocument();
    });

    it('should display module metadata', () => {
      render(
        <AdminContextWrapper>
          <ModulePreview {...defaultProps} />
        </AdminContextWrapper>
      );

      expect(screen.getByText('Intermediate')).toBeInTheDocument();
      expect(screen.getByText('60 min')).toBeInTheDocument();
    });

    it('should display learning objectives', () => {
      render(
        <AdminContextWrapper>
          <ModulePreview {...defaultProps} />
        </AdminContextWrapper>
      );

      expect(screen.getByText('Learning Objectives')).toBeInTheDocument();
      expect(screen.getByText('Understand Jung\'s basic concepts')).toBeInTheDocument();
      expect(screen.getByText('Identify key archetypes')).toBeInTheDocument();
      expect(screen.getByText('Explore the individuation process')).toBeInTheDocument();
    });

    it('should render markdown content correctly', () => {
      render(
        <AdminContextWrapper>
          <ModulePreview {...defaultProps} />
        </AdminContextWrapper>
      );

      // Check for rendered markdown headings
      expect(screen.getByRole('heading', { level: 1, name: 'Introduction' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: 'Key Concepts' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: 'The Shadow' })).toBeInTheDocument();
    });

    it('should display prerequisites', () => {
      render(
        <AdminContextWrapper>
          <ModulePreview {...defaultProps} />
        </AdminContextWrapper>
      );

      expect(screen.getByText('Prerequisites')).toBeInTheDocument();
      expect(screen.getByText('basic-psychology')).toBeInTheDocument();
    });

    it('should display resources', () => {
      render(
        <AdminContextWrapper>
          <ModulePreview {...defaultProps} />
        </AdminContextWrapper>
      );

      expect(screen.getByText('Resources')).toBeInTheDocument();
      expect(screen.getByText('Jung Documentary')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Jung Documentary' })).toHaveAttribute('href', 'https://youtube.com/watch?v=example');
    });

    it('should display quiz information', () => {
      render(
        <AdminContextWrapper>
          <ModulePreview {...defaultProps} />
        </AdminContextWrapper>
      );

      expect(screen.getByText('Quiz')).toBeInTheDocument();
      expect(screen.getByText('Jung Quiz')).toBeInTheDocument();
      expect(screen.getByText('1 question')).toBeInTheDocument();
      expect(screen.getByText('~5 min')).toBeInTheDocument();
    });

    it('should handle module without quiz', () => {
      const moduleWithoutQuiz = { ...mockModule, quiz: undefined };
      
      render(
        <AdminContextWrapper>
          <ModulePreview {...defaultProps} module={moduleWithoutQuiz} />
        </AdminContextWrapper>
      );

      expect(screen.queryByText('Quiz')).not.toBeInTheDocument();
    });

    it('should handle empty objectives', () => {
      const moduleWithoutObjectives = { ...mockModule, objectives: [] };
      
      render(
        <AdminContextWrapper>
          <ModulePreview {...defaultProps} module={moduleWithoutObjectives} />
        </AdminContextWrapper>
      );

      expect(screen.getByText('Learning Objectives')).toBeInTheDocument();
      expect(screen.getByText('No objectives specified')).toBeInTheDocument();
    });

    it('should handle empty content', () => {
      const moduleWithoutContent = { ...mockModule, content: '' };
      
      render(
        <AdminContextWrapper>
          <ModulePreview {...defaultProps} module={moduleWithoutContent} />
        </AdminContextWrapper>
      );

      expect(screen.getByText('No content available')).toBeInTheDocument();
    });
  });

  describe('navigation and tabs', () => {
    it('should show content tab by default', () => {
      render(
        <AdminContextWrapper>
          <ModulePreview {...defaultProps} />
        </AdminContextWrapper>
      );

      expect(screen.getByRole('button', { name: 'Content' })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByText('Introduction')).toBeInTheDocument();
    });

    it('should switch to overview tab when clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <AdminContextWrapper>
          <ModulePreview {...defaultProps} />
        </AdminContextWrapper>
      );

      const overviewTab = screen.getByRole('button', { name: 'Overview' });
      await user.click(overviewTab);

      expect(overviewTab).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByText('Learning Objectives')).toBeInTheDocument();
    });

    it('should switch to quiz tab when clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <AdminContextWrapper>
          <ModulePreview {...defaultProps} />
        </AdminContextWrapper>
      );

      const quizTab = screen.getByRole('button', { name: 'Quiz' });
      await user.click(quizTab);

      expect(quizTab).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByText('What is the collective unconscious?')).toBeInTheDocument();
    });

    it('should disable quiz tab when no quiz available', () => {
      const moduleWithoutQuiz = { ...mockModule, quiz: undefined };
      
      render(
        <AdminContextWrapper>
          <ModulePreview {...defaultProps} module={moduleWithoutQuiz} />
        </AdminContextWrapper>
      );

      const quizTab = screen.getByRole('button', { name: 'Quiz' });
      expect(quizTab).toBeDisabled();
    });

    it('should show resources tab when resources are available', async () => {
      const user = userEvent.setup();
      
      render(
        <AdminContextWrapper>
          <ModulePreview {...defaultProps} />
        </AdminContextWrapper>
      );

      const resourcesTab = screen.getByRole('button', { name: 'Resources' });
      await user.click(resourcesTab);

      expect(resourcesTab).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByText('Jung Documentary')).toBeInTheDocument();
    });
  });

  describe('action buttons', () => {
    it('should display close button', () => {
      render(
        <AdminContextWrapper>
          <ModulePreview {...defaultProps} />
        </AdminContextWrapper>
      );

      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnClose = jest.fn();
      
      render(
        <AdminContextWrapper>
          <ModulePreview {...defaultProps} onClose={mockOnClose} />
        </AdminContextWrapper>
      );

      const closeButton = screen.getByRole('button', { name: 'Close' });
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should display edit button when not editing', () => {
      render(
        <AdminContextWrapper>
          <ModulePreview {...defaultProps} />
        </AdminContextWrapper>
      );

      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    });

    it('should call onEdit when edit button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnEdit = jest.fn();
      
      render(
        <AdminContextWrapper>
          <ModulePreview {...defaultProps} onEdit={mockOnEdit} />
        </AdminContextWrapper>
      );

      const editButton = screen.getByRole('button', { name: 'Edit' });
      await user.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it('should display save and cancel buttons when editing', () => {
      render(
        <AdminContextWrapper>
          <ModulePreview {...defaultProps} isEditing={true} />
        </AdminContextWrapper>
      );

      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('should disable save button when saving', () => {
      render(
        <AdminContextWrapper>
          <ModulePreview {...defaultProps} isEditing={true} isSaving={true} />
        </AdminContextWrapper>
      );

      expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();
    });

    it('should call onSave when save button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn();
      
      render(
        <AdminContextWrapper>
          <ModulePreview {...defaultProps} isEditing={true} onSave={mockOnSave} />
        </AdminContextWrapper>
      );

      const saveButton = screen.getByRole('button', { name: 'Save' });
      await user.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledTimes(1);
    });

    it('should display publish button', () => {
      render(
        <AdminContextWrapper>
          <ModulePreview {...defaultProps} />
        </AdminContextWrapper>
      );

      expect(screen.getByRole('button', { name: 'Publish' })).toBeInTheDocument();
    });

    it('should call onPublish when publish button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnPublish = jest.fn();
      
      render(
        <AdminContextWrapper>
          <ModulePreview {...defaultProps} onPublish={mockOnPublish} />
        </AdminContextWrapper>
      );

      const publishButton = screen.getByRole('button', { name: 'Publish' });
      await user.click(publishButton);

      expect(mockOnPublish).toHaveBeenCalledTimes(1);
    });
  });

  describe('editing mode', () => {
    it('should show content editor in edit mode', () => {
      render(
        <AdminContextWrapper>
          <ModulePreview {...defaultProps} isEditing={true} />
        </AdminContextWrapper>
      );

      expect(screen.getByTestId('content-editor')).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockModule.content.trim())).toBeInTheDocument();
    });

    it('should allow editing module title', () => {
      render(
        <AdminContextWrapper>
          <ModulePreview {...defaultProps} isEditing={true} />
        </AdminContextWrapper>
      );

      const titleInput = screen.getByDisplayValue('Introduction to Jungian Psychology');
      expect(titleInput).toBeInTheDocument();
      expect(titleInput).not.toBeDisabled();
    });

    it('should allow editing module description', () => {
      render(
        <AdminContextWrapper>
          <ModulePreview {...defaultProps} isEditing={true} />
        </AdminContextWrapper>
      );

      const descriptionTextarea = screen.getByDisplayValue('A comprehensive overview of Carl Jung\'s analytical psychology');
      expect(descriptionTextarea).toBeInTheDocument();
      expect(descriptionTextarea).not.toBeDisabled();
    });

    it('should update content when edited', async () => {
      const user = userEvent.setup();
      
      render(
        <AdminContextWrapper>
          <ModulePreview {...defaultProps} isEditing={true} />
        </AdminContextWrapper>
      );

      const contentEditor = screen.getByTestId('content-editor');
      await user.clear(contentEditor);
      await user.type(contentEditor, '# New Content\n\nThis is updated content.');

      expect(contentEditor).toHaveValue('# New Content\n\nThis is updated content.');
    });

    it('should allow editing objectives', async () => {
      const user = userEvent.setup();
      
      render(
        <AdminContextWrapper>
          <ModulePreview {...defaultProps} isEditing={true} />
        </AdminContextWrapper>
      );

      // Switch to overview tab first
      const overviewTab = screen.getByRole('button', { name: 'Overview' });
      await user.click(overviewTab);

      const objectiveInput = screen.getByDisplayValue('Understand Jung\'s basic concepts');
      expect(objectiveInput).not.toBeDisabled();
      
      await user.clear(objectiveInput);
      await user.type(objectiveInput, 'Updated objective');
      
      expect(objectiveInput).toHaveValue('Updated objective');
    });
  });

  describe('keyboard navigation', () => {
    it('should support tab navigation between buttons', async () => {
      const user = userEvent.setup();
      
      render(
        <AdminContextWrapper>
          <ModulePreview {...defaultProps} />
        </AdminContextWrapper>
      );

      // Tab through the buttons
      await user.tab();
      expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: 'Edit' })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: 'Publish' })).toHaveFocus();
    });

    it('should support escape key to close', async () => {
      const user = userEvent.setup();
      const mockOnClose = jest.fn();
      
      render(
        <AdminContextWrapper>
          <ModulePreview {...defaultProps} onClose={mockOnClose} />
        </AdminContextWrapper>
      );

      await user.keyboard('{Escape}');
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <AdminContextWrapper>
          <ModulePreview {...defaultProps} />
        </AdminContextWrapper>
      );

      expect(screen.getByTestId('module-preview')).toHaveAttribute('role', 'dialog');
      expect(screen.getByTestId('module-preview')).toHaveAttribute('aria-labelledby', 'module-preview-title');
    });

    it('should announce tab changes to screen readers', async () => {
      const user = userEvent.setup();
      
      render(
        <AdminContextWrapper>
          <ModulePreview {...defaultProps} />
        </AdminContextWrapper>
      );

      const overviewTab = screen.getByRole('button', { name: 'Overview' });
      await user.click(overviewTab);

      expect(overviewTab).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'overview-tab');
    });

    it('should have proper heading hierarchy', () => {
      render(
        <AdminContextWrapper>
          <ModulePreview {...defaultProps} />
        </AdminContextWrapper>
      );

      const headings = screen.getAllByRole('heading');
      expect(headings[0]).toHaveTextContent('Introduction to Jungian Psychology');
      expect(headings[0]).toHaveAttribute('id', 'module-preview-title');
    });
  });

  describe('error handling', () => {
    it('should handle missing module gracefully', () => {
      render(
        <AdminContextWrapper>
          <ModulePreview {...defaultProps} module={null as any} />
        </AdminContextWrapper>
      );

      expect(screen.getByText('Module not found')).toBeInTheDocument();
    });

    it('should handle malformed module data', () => {
      const malformedModule = {
        id: 'test',
        title: null,
        content: undefined,
        objectives: null
      } as any;

      render(
        <AdminContextWrapper>
          <ModulePreview {...defaultProps} module={malformedModule} />
        </AdminContextWrapper>
      );

      // Should still render without crashing
      expect(screen.getByTestId('module-preview')).toBeInTheDocument();
    });

    it('should handle callback errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const errorCallback = jest.fn(() => {
        throw new Error('Callback error');
      });
      
      render(
        <AdminContextWrapper>
          <ModulePreview {...defaultProps} onClose={errorCallback} />
        </AdminContextWrapper>
      );

      const closeButton = screen.getByRole('button', { name: 'Close' });
      await user.click(closeButton);

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('responsive behavior', () => {
    it('should adapt to different screen sizes', () => {
      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(
        <AdminContextWrapper>
          <ModulePreview {...defaultProps} />
        </AdminContextWrapper>
      );

      const preview = screen.getByTestId('module-preview');
      expect(preview).toHaveClass('responsive');
    });

    it('should show mobile-optimized layout on small screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 480,
      });

      render(
        <AdminContextWrapper>
          <ModulePreview {...defaultProps} />
        </AdminContextWrapper>
      );

      const preview = screen.getByTestId('module-preview');
      expect(preview).toHaveClass('mobile');
    });
  });
});