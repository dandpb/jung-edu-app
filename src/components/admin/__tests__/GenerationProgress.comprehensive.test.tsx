/**
 * Comprehensive test suite for GenerationProgress component
 * Tests progress display, animations, error states, and completion
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { GenerationProgress } from '../GenerationProgress';
import { AdminContext } from '../../../contexts/AdminContext';

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

describe('GenerationProgress', () => {
  const defaultProps = {
    isGenerating: false,
    progress: 0,
    status: 'idle' as const,
    currentTask: '',
    generatedCount: 0,
    totalCount: 0,
    onCancel: jest.fn(),
    onComplete: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('idle state', () => {
    it('should not render when not generating and idle', () => {
      const { container } = render(
        <AdminContextWrapper>
          <GenerationProgress {...defaultProps} />
        </AdminContextWrapper>
      );

      expect(container).toBeEmptyDOMElement();
    });

    it('should render when explicitly showing idle state', () => {
      render(
        <AdminContextWrapper>
          <GenerationProgress 
            {...defaultProps} 
            isGenerating={true}
            status="idle"
          />
        </AdminContextWrapper>
      );

      expect(screen.getByTestId('generation-progress')).toBeInTheDocument();
      expect(screen.getByText('Preparing generation...')).toBeInTheDocument();
    });
  });

  describe('generating state', () => {
    it('should display progress bar during generation', () => {
      render(
        <AdminContextWrapper>
          <GenerationProgress 
            {...defaultProps}
            isGenerating={true}
            progress={50}
            status="generating"
            currentTask="Generating module content"
            generatedCount={2}
            totalCount={4}
          />
        </AdminContextWrapper>
      );

      expect(screen.getByTestId('generation-progress')).toBeInTheDocument();
      expect(screen.getByText('Generating module content')).toBeInTheDocument();
      expect(screen.getByText('2 of 4 completed')).toBeInTheDocument();
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    });

    it('should show cancel button during generation', () => {
      render(
        <AdminContextWrapper>
          <GenerationProgress 
            {...defaultProps}
            isGenerating={true}
            status="generating"
            onCancel={jest.fn()}
          />
        </AdminContextWrapper>
      );

      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should call onCancel when cancel button is clicked', () => {
      const mockOnCancel = jest.fn();
      
      render(
        <AdminContextWrapper>
          <GenerationProgress 
            {...defaultProps}
            isGenerating={true}
            status="generating"
            onCancel={mockOnCancel}
          />
        </AdminContextWrapper>
      );

      const cancelButton = screen.getByText('Cancel');
      cancelButton.click();

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should show different progress for different tasks', () => {
      const tasks = [
        'Generating content structure',
        'Creating quiz questions',
        'Finding relevant videos',
        'Compiling bibliography',
        'Finalizing module'
      ];

      tasks.forEach((task, index) => {
        const { rerender } = render(
          <AdminContextWrapper>
            <GenerationProgress 
              {...defaultProps}
              isGenerating={true}
              progress={(index + 1) * 20}
              status="generating"
              currentTask={task}
              generatedCount={index + 1}
              totalCount={5}
            />
          </AdminContextWrapper>
        );

        expect(screen.getByText(task)).toBeInTheDocument();
        expect(screen.getByText(`${index + 1} of 5 completed`)).toBeInTheDocument();
        
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toHaveAttribute('aria-valuenow', `${(index + 1) * 20}`);

        rerender(<div />); // Clear for next iteration
      });
    });

    it('should handle zero total count', () => {
      render(
        <AdminContextWrapper>
          <GenerationProgress 
            {...defaultProps}
            isGenerating={true}
            status="generating"
            generatedCount={0}
            totalCount={0}
          />
        </AdminContextWrapper>
      );

      expect(screen.getByText('0 of 0 completed')).toBeInTheDocument();
    });

    it('should show indeterminate progress when progress is 0', () => {
      render(
        <AdminContextWrapper>
          <GenerationProgress 
            {...defaultProps}
            isGenerating={true}
            status="generating"
            progress={0}
          />
        </AdminContextWrapper>
      );

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
    });
  });

  describe('error state', () => {
    it('should display error message', () => {
      render(
        <AdminContextWrapper>
          <GenerationProgress 
            {...defaultProps}
            isGenerating={false}
            status="error"
            currentTask="Failed to generate content"
          />
        </AdminContextWrapper>
      );

      expect(screen.getByText('Generation Failed')).toBeInTheDocument();
      expect(screen.getByText('Failed to generate content')).toBeInTheDocument();
    });

    it('should show retry button in error state', () => {
      render(
        <AdminContextWrapper>
          <GenerationProgress 
            {...defaultProps}
            status="error"
            onCancel={jest.fn()} // Acts as retry in error state
          />
        </AdminContextWrapper>
      );

      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('should call onCancel when retry button is clicked', () => {
      const mockOnCancel = jest.fn();
      
      render(
        <AdminContextWrapper>
          <GenerationProgress 
            {...defaultProps}
            status="error"
            onCancel={mockOnCancel}
          />
        </AdminContextWrapper>
      );

      const retryButton = screen.getByText('Retry');
      retryButton.click();

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should display different error types', () => {
      const errorMessages = [
        'Network connection failed',
        'API rate limit exceeded',
        'Invalid module configuration',
        'Content generation timeout'
      ];

      errorMessages.forEach((errorMessage, index) => {
        const { rerender } = render(
          <AdminContextWrapper>
            <GenerationProgress 
              {...defaultProps}
              status="error"
              currentTask={errorMessage}
            />
          </AdminContextWrapper>
        );

        expect(screen.getByText(errorMessage)).toBeInTheDocument();

        rerender(<div />); // Clear for next iteration
      });
    });
  });

  describe('completed state', () => {
    it('should display completion message', () => {
      render(
        <AdminContextWrapper>
          <GenerationProgress 
            {...defaultProps}
            status="completed"
            generatedCount={5}
            totalCount={5}
          />
        </AdminContextWrapper>
      );

      expect(screen.getByText('Generation Completed!')).toBeInTheDocument();
      expect(screen.getByText('Successfully generated 5 modules')).toBeInTheDocument();
    });

    it('should show done button in completed state', () => {
      render(
        <AdminContextWrapper>
          <GenerationProgress 
            {...defaultProps}
            status="completed"
            onComplete={jest.fn()}
          />
        </AdminContextWrapper>
      );

      expect(screen.getByText('Done')).toBeInTheDocument();
    });

    it('should call onComplete when done button is clicked', () => {
      const mockOnComplete = jest.fn();
      
      render(
        <AdminContextWrapper>
          <GenerationProgress 
            {...defaultProps}
            status="completed"
            onComplete={mockOnComplete}
          />
        </AdminContextWrapper>
      );

      const doneButton = screen.getByText('Done');
      doneButton.click();

      expect(mockOnComplete).toHaveBeenCalledTimes(1);
    });

    it('should show 100% progress when completed', () => {
      render(
        <AdminContextWrapper>
          <GenerationProgress 
            {...defaultProps}
            status="completed"
            progress={100}
          />
        </AdminContextWrapper>
      );

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '100');
    });

    it('should handle partial completion', () => {
      render(
        <AdminContextWrapper>
          <GenerationProgress 
            {...defaultProps}
            status="completed"
            generatedCount={3}
            totalCount={5}
          />
        </AdminContextWrapper>
      );

      expect(screen.getByText('Successfully generated 3 modules')).toBeInTheDocument();
    });
  });

  describe('cancelled state', () => {
    it('should display cancellation message', () => {
      render(
        <AdminContextWrapper>
          <GenerationProgress 
            {...defaultProps}
            status="cancelled"
          />
        </AdminContextWrapper>
      );

      expect(screen.getByText('Generation Cancelled')).toBeInTheDocument();
      expect(screen.getByText('The generation process was cancelled')).toBeInTheDocument();
    });

    it('should show start over button in cancelled state', () => {
      render(
        <AdminContextWrapper>
          <GenerationProgress 
            {...defaultProps}
            status="cancelled"
            onCancel={jest.fn()}
          />
        </AdminContextWrapper>
      );

      expect(screen.getByText('Start Over')).toBeInTheDocument();
    });
  });

  describe('progress bar behavior', () => {
    it('should show smooth progress transitions', async () => {
      const { rerender } = render(
        <AdminContextWrapper>
          <GenerationProgress 
            {...defaultProps}
            isGenerating={true}
            status="generating"
            progress={25}
          />
        </AdminContextWrapper>
      );

      let progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '25');

      rerender(
        <AdminContextWrapper>
          <GenerationProgress 
            {...defaultProps}
            isGenerating={true}
            status="generating"
            progress={75}
          />
        </AdminContextWrapper>
      );

      await waitFor(() => {
        progressBar = screen.getByRole('progressbar');
        expect(progressBar).toHaveAttribute('aria-valuenow', '75');
      });
    });

    it('should handle progress values over 100', () => {
      render(
        <AdminContextWrapper>
          <GenerationProgress 
            {...defaultProps}
            isGenerating={true}
            status="generating"
            progress={120}
          />
        </AdminContextWrapper>
      );

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '100');
    });

    it('should handle negative progress values', () => {
      render(
        <AdminContextWrapper>
          <GenerationProgress 
            {...defaultProps}
            isGenerating={true}
            status="generating"
            progress={-10}
          />
        </AdminContextWrapper>
      );

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <AdminContextWrapper>
          <GenerationProgress 
            {...defaultProps}
            isGenerating={true}
            status="generating"
            progress={50}
            currentTask="Processing content"
          />
        </AdminContextWrapper>
      );

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-label', 'Generation progress');
      expect(progressBar).toHaveAttribute('aria-valuenow', '50');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });

    it('should announce status changes to screen readers', () => {
      render(
        <AdminContextWrapper>
          <GenerationProgress 
            {...defaultProps}
            status="completed"
          />
        </AdminContextWrapper>
      );

      expect(screen.getByText('Generation Completed!')).toHaveAttribute('role', 'status');
    });
  });

  describe('edge cases', () => {
    it('should handle missing props gracefully', () => {
      render(
        <AdminContextWrapper>
          <GenerationProgress 
            isGenerating={true}
            status="generating"
          />
        </AdminContextWrapper>
      );

      expect(screen.getByTestId('generation-progress')).toBeInTheDocument();
    });

    it('should handle undefined currentTask', () => {
      render(
        <AdminContextWrapper>
          <GenerationProgress 
            {...defaultProps}
            isGenerating={true}
            status="generating"
            currentTask={undefined as any}
          />
        </AdminContextWrapper>
      );

      expect(screen.getByTestId('generation-progress')).toBeInTheDocument();
    });

    it('should handle null onCancel function', () => {
      render(
        <AdminContextWrapper>
          <GenerationProgress 
            {...defaultProps}
            isGenerating={true}
            status="generating"
            onCancel={null as any}
          />
        </AdminContextWrapper>
      );

      // Should not show cancel button if onCancel is null
      expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    });

    it('should handle null onComplete function', () => {
      render(
        <AdminContextWrapper>
          <GenerationProgress 
            {...defaultProps}
            status="completed"
            onComplete={null as any}
          />
        </AdminContextWrapper>
      );

      // Should not show done button if onComplete is null
      expect(screen.queryByText('Done')).not.toBeInTheDocument();
    });
  });

  describe('animation and styling', () => {
    it('should apply correct CSS classes based on status', () => {
      const statuses: Array<'idle' | 'generating' | 'completed' | 'error' | 'cancelled'> = 
        ['idle', 'generating', 'completed', 'error', 'cancelled'];

      statuses.forEach(status => {
        const { rerender } = render(
          <AdminContextWrapper>
            <GenerationProgress 
              {...defaultProps}
              isGenerating={status === 'generating'}
              status={status}
            />
          </AdminContextWrapper>
        );

        if (status !== 'idle' || status === 'generating') {
          const container = screen.queryByTestId('generation-progress');
          if (container) {
            expect(container).toHaveClass(`status-${status}`);
          }
        }

        rerender(<div />);
      });
    });

    it('should show loading animation during generation', () => {
      render(
        <AdminContextWrapper>
          <GenerationProgress 
            {...defaultProps}
            isGenerating={true}
            status="generating"
          />
        </AdminContextWrapper>
      );

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should not show loading animation when completed', () => {
      render(
        <AdminContextWrapper>
          <GenerationProgress 
            {...defaultProps}
            status="completed"
          />
        </AdminContextWrapper>
      );

      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
  });
});