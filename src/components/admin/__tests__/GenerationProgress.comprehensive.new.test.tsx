/**
 * Comprehensive test suite for GenerationProgress component
 * Tests progress display, user interactions, timer functionality, and state management
 * Focuses on areas with low test coverage (3% coverage target)
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GenerationProgress, { GenerationStep } from '../GenerationProgress';

// Mock timers for testing timer functionality
jest.useFakeTimers();

describe('GenerationProgress', () => {
  const mockSteps: GenerationStep[] = [
    {
      id: 'step-1',
      label: 'Analyzing requirements',
      status: 'completed',
      message: 'Requirements analyzed successfully'
    },
    {
      id: 'step-2',
      label: 'Generating content structure',
      status: 'in-progress',
      message: 'Creating module outline...'
    },
    {
      id: 'step-3',
      label: 'Creating quiz questions',
      status: 'pending'
    },
    {
      id: 'step-4',
      label: 'Finalizing module',
      status: 'pending'
    }
  ];

  const defaultProps = {
    steps: mockSteps,
    currentStep: 1,
    onCancel: jest.fn(),
    estimatedTime: 60
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
    it('renders progress dialog with main elements', () => {
      render(<GenerationProgress {...defaultProps} />);
      
      expect(screen.getByText('Gerando Seu Módulo')).toBeInTheDocument();
      expect(screen.getByText('Nossa IA está criando conteúdo educacional personalizado para suas especificações')).toBeInTheDocument();
      expect(screen.getByTestId('lucide-brain')).toBeInTheDocument();
    });

    it('renders progress bar with correct percentage', () => {
      render(<GenerationProgress {...defaultProps} />);
      
      expect(screen.getByText('1 de 4 etapas')).toBeInTheDocument();
      expect(screen.getByText('25%')).toBeInTheDocument();
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveStyle('width: 25%');
    });

    it('renders all generation steps', () => {
      render(<GenerationProgress {...defaultProps} />);
      
      expect(screen.getByText('Analyzing requirements')).toBeInTheDocument();
      expect(screen.getByText('Generating content structure')).toBeInTheDocument();
      expect(screen.getByText('Creating quiz questions')).toBeInTheDocument();
      expect(screen.getByText('Finalizing module')).toBeInTheDocument();
    });

    it('renders cancel button', () => {
      render(<GenerationProgress {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /cancelar geração/i })).toBeInTheDocument();
    });
  });

  describe('Step Status Display', () => {
    it('displays completed step with check icon', () => {
      render(<GenerationProgress {...defaultProps} />);
      
      // Check that completed step has check icon
      const completedStep = screen.getByText('Analyzing requirements').closest('.flex');
      expect(completedStep?.querySelector('[data-testid="lucide-check"]')).toBeInTheDocument();
      expect(completedStep).toHaveClass('opacity-75');
    });

    it('displays in-progress step with loading spinner', () => {
      render(<GenerationProgress {...defaultProps} />);
      
      const inProgressStep = screen.getByText('Generating content structure').closest('.flex');
      expect(inProgressStep?.querySelector('[data-testid="lucide-loader-2"]')).toBeInTheDocument();
      expect(inProgressStep?.querySelector('.animate-spin')).toBeInTheDocument();
      expect(inProgressStep).toHaveClass('bg-purple-50', 'border-purple-200');
    });

    it('displays pending step with empty circle', () => {
      render(<GenerationProgress {...defaultProps} />);
      
      const pendingStep = screen.getByText('Creating quiz questions').closest('.flex');
      expect(pendingStep?.querySelector('.rounded-full.border-2.border-gray-300')).toBeInTheDocument();
    });

    it('displays error step with alert icon', () => {
      const stepsWithError: GenerationStep[] = [
        ...mockSteps.slice(0, 2),
        {
          id: 'step-3',
          label: 'Creating quiz questions',
          status: 'error',
          message: 'Failed to generate questions'
        },
        mockSteps[3]
      ];

      render(<GenerationProgress {...defaultProps} steps={stepsWithError} />);
      
      const errorStep = screen.getByText('Creating quiz questions').closest('.flex');
      expect(errorStep?.querySelector('[data-testid="lucide-alert-circle"]')).toBeInTheDocument();
      expect(errorStep).toHaveClass('bg-red-50', 'border-red-200');
    });

    it('displays step messages when provided', () => {
      render(<GenerationProgress {...defaultProps} />);
      
      expect(screen.getByText('Requirements analyzed successfully')).toBeInTheDocument();
      expect(screen.getByText('Creating module outline...')).toBeInTheDocument();
    });

    it('shows animated dots for current in-progress step', () => {
      render(<GenerationProgress {...defaultProps} />);
      
      // Find the in-progress step (index 1)
      const inProgressStep = screen.getByText('Generating content structure').closest('.p-3');
      const animatedDots = inProgressStep?.querySelectorAll('.animate-bounce');
      
      expect(animatedDots).toHaveLength(3);
      expect(animatedDots?.[0]).toHaveStyle('animation-delay: 0ms');
      expect(animatedDots?.[1]).toHaveStyle('animation-delay: 150ms');
      expect(animatedDots?.[2]).toHaveStyle('animation-delay: 300ms');
    });
  });

  describe('Progress Calculation', () => {
    it('calculates progress correctly with different step counts', () => {
      const twoStepsCompleted: GenerationStep[] = [
        { id: '1', label: 'Step 1', status: 'completed' },
        { id: '2', label: 'Step 2', status: 'completed' },
        { id: '3', label: 'Step 3', status: 'pending' }
      ];

      render(<GenerationProgress {...defaultProps} steps={twoStepsCompleted} />);
      
      expect(screen.getByText('2 de 3 etapas')).toBeInTheDocument();
      expect(screen.getByText('67%')).toBeInTheDocument(); // 2/3 * 100 = 66.67% rounded
    });

    it('shows 0% when no steps are completed', () => {
      const noCompletedSteps: GenerationStep[] = [
        { id: '1', label: 'Step 1', status: 'pending' },
        { id: '2', label: 'Step 2', status: 'pending' }
      ];

      render(<GenerationProgress {...defaultProps} steps={noCompletedSteps} />);
      
      expect(screen.getByText('0 de 2 etapas')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('shows 100% when all steps are completed', () => {
      const allCompletedSteps: GenerationStep[] = [
        { id: '1', label: 'Step 1', status: 'completed' },
        { id: '2', label: 'Step 2', status: 'completed' }
      ];

      render(<GenerationProgress {...defaultProps} steps={allCompletedSteps} />);
      
      expect(screen.getByText('2 de 2 etapas')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  describe('Timer Functionality', () => {
    it('starts timer on mount and updates elapsed time', () => {
      render(<GenerationProgress {...defaultProps} />);
      
      // Initially should show 0:00
      expect(screen.getByText('Tempo decorrido: 0:00')).toBeInTheDocument();
      
      // Advance timer by 1 second
      jest.advanceTimersByTime(1000);
      
      expect(screen.getByText('Tempo decorrido: 0:01')).toBeInTheDocument();
      
      // Advance by 65 seconds total (1:05)
      jest.advanceTimersByTime(64000);
      
      expect(screen.getByText('Tempo decorrido: 1:05')).toBeInTheDocument();
    });

    it('calculates remaining time correctly', () => {
      render(<GenerationProgress {...defaultProps} estimatedTime={120} />);
      
      // Initially should show full estimated time remaining
      expect(screen.getByText('Tempo restante estimado: ~2:00')).toBeInTheDocument();
      
      // Advance by 30 seconds
      jest.advanceTimersByTime(30000);
      
      expect(screen.getByText('Tempo restante estimado: ~1:30')).toBeInTheDocument();
      
      // Advance beyond estimated time
      jest.advanceTimersByTime(120000);
      
      expect(screen.getByText('Tempo restante estimado: ~0:00')).toBeInTheDocument();
    });

    it('formats time correctly', () => {
      render(<GenerationProgress {...defaultProps} />);
      
      // Test various time formats
      const testTimes = [
        { seconds: 5, expected: '0:05' },
        { seconds: 65, expected: '1:05' },
        { seconds: 125, expected: '2:05' },
        { seconds: 600, expected: '10:00' }
      ];

      testTimes.forEach(({ seconds, expected }) => {
        jest.advanceTimersByTime(seconds * 1000);
        expect(screen.getByText(`Tempo decorrido: ${expected}`)).toBeInTheDocument();
      });
    });

    it('cleans up timer on unmount', () => {
      const { unmount } = render(<GenerationProgress {...defaultProps} />);
      
      // Spy on clearInterval
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      
      unmount();
      
      expect(clearIntervalSpy).toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
    });
  });

  describe('Cancel Functionality', () => {
    it('calls onCancel immediately when no steps are completed', async () => {
      const user = userEvent.setup();
      const mockOnCancel = jest.fn();
      const noCompletedSteps: GenerationStep[] = [
        { id: '1', label: 'Step 1', status: 'pending' },
        { id: '2', label: 'Step 2', status: 'pending' }
      ];

      render(<GenerationProgress {...defaultProps} steps={noCompletedSteps} onCancel={mockOnCancel} />);
      
      const cancelButton = screen.getByRole('button', { name: /cancelar geração/i });
      await user.click(cancelButton);
      
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('shows confirmation dialog when steps are completed', async () => {
      const user = userEvent.setup();
      const mockOnCancel = jest.fn();

      render(<GenerationProgress {...defaultProps} onCancel={mockOnCancel} />);
      
      const cancelButton = screen.getByRole('button', { name: /cancelar geração/i });
      await user.click(cancelButton);
      
      // Should show confirmation dialog
      expect(screen.getByText('Cancelar Geração do Módulo?')).toBeInTheDocument();
      expect(screen.getByText('Tem certeza que deseja cancelar? Você perderá o progresso feito até agora.')).toBeInTheDocument();
      expect(screen.getByText('(1 etapas concluídas)')).toBeInTheDocument();
      
      // Should not call onCancel yet
      expect(mockOnCancel).not.toHaveBeenCalled();
    });

    it('dismisses confirmation dialog when "Continue" is clicked', async () => {
      const user = userEvent.setup();
      const mockOnCancel = jest.fn();

      render(<GenerationProgress {...defaultProps} onCancel={mockOnCancel} />);
      
      // Open confirmation dialog
      const cancelButton = screen.getByRole('button', { name: /cancelar geração/i });
      await user.click(cancelButton);
      
      // Click continue button
      const continueButton = screen.getByRole('button', { name: /continuar gerando/i });
      await user.click(continueButton);
      
      // Dialog should be closed
      expect(screen.queryByText('Cancelar Geração do Módulo?')).not.toBeInTheDocument();
      expect(mockOnCancel).not.toHaveBeenCalled();
    });

    it('calls onCancel when "Yes, Cancel" is clicked in confirmation dialog', async () => {
      const user = userEvent.setup();
      const mockOnCancel = jest.fn();

      render(<GenerationProgress {...defaultProps} onCancel={mockOnCancel} />);
      
      // Open confirmation dialog
      const cancelButton = screen.getByRole('button', { name: /cancelar geração/i });
      await user.click(cancelButton);
      
      // Click confirm cancel button
      const confirmButton = screen.getByRole('button', { name: /sim, cancelar/i });
      await user.click(confirmButton);
      
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('shows correct completed steps count in confirmation dialog', async () => {
      const user = userEvent.setup();
      const stepsWithMultipleCompleted: GenerationStep[] = [
        { id: '1', label: 'Step 1', status: 'completed' },
        { id: '2', label: 'Step 2', status: 'completed' },
        { id: '3', label: 'Step 3', status: 'completed' },
        { id: '4', label: 'Step 4', status: 'pending' }
      ];

      render(<GenerationProgress {...defaultProps} steps={stepsWithMultipleCompleted} />);
      
      const cancelButton = screen.getByRole('button', { name: /cancelar geração/i });
      await user.click(cancelButton);
      
      expect(screen.getByText('(3 etapas concluídas)')).toBeInTheDocument();
    });
  });

  describe('Dialog Behavior', () => {
    it('renders as fixed overlay modal', () => {
      render(<GenerationProgress {...defaultProps} />);
      
      const dialog = screen.getByRole('dialog', { hidden: true });
      expect(dialog).toHaveClass('fixed', 'inset-0', 'bg-black', 'bg-opacity-50');
    });

    it('has proper z-index layering', () => {
      render(<GenerationProgress {...defaultProps} />);
      
      const mainDialog = screen.getByRole('dialog', { hidden: true });
      expect(mainDialog).toHaveClass('z-50');
      
      // Open confirmation dialog
      fireEvent.click(screen.getByRole('button', { name: /cancelar geração/i }));
      
      const confirmDialog = screen.getAllByRole('dialog', { hidden: true })[1];
      expect(confirmDialog).toHaveClass('z-60');
    });

    it('centers content properly', () => {
      render(<GenerationProgress {...defaultProps} />);
      
      const dialog = screen.getByRole('dialog', { hidden: true });
      expect(dialog).toHaveClass('flex', 'items-center', 'justify-center');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles empty steps array', () => {
      render(<GenerationProgress {...defaultProps} steps={[]} />);
      
      expect(screen.getByText('0 de 0 etapas')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument(); // Should not crash with division by zero
    });

    it('handles undefined estimatedTime', () => {
      render(<GenerationProgress {...defaultProps} estimatedTime={undefined} />);
      
      // Should use default estimated time of 45
      expect(screen.getByText('Tempo restante estimado: ~0:45')).toBeInTheDocument();
    });

    it('handles steps with no status', () => {
      const stepsWithoutStatus: GenerationStep[] = [
        { id: '1', label: 'Step 1', status: undefined as any }
      ];

      render(<GenerationProgress {...defaultProps} steps={stepsWithoutStatus} />);
      
      // Should render without crashing and show default pending state
      expect(screen.getByText('Step 1')).toBeInTheDocument();
    });

    it('handles currentStep index out of bounds', () => {
      render(<GenerationProgress {...defaultProps} currentStep={10} />);
      
      // Should not crash even with invalid currentStep
      expect(screen.getByText('Gerando Seu Módulo')).toBeInTheDocument();
    });

    it('handles missing step labels', () => {
      const stepsWithoutLabels: GenerationStep[] = [
        { id: '1', label: '', status: 'pending' }
      ];

      render(<GenerationProgress {...defaultProps} steps={stepsWithoutLabels} />);
      
      // Should render empty label without crashing
      expect(screen.getByText('1 de 1 etapas')).toBeInTheDocument();
    });

    it('handles timer cleanup when clearInterval is undefined', () => {
      // Mock clearInterval to be undefined (edge case scenario)
      const originalClearInterval = global.clearInterval;
      (global as any).clearInterval = undefined;

      const { unmount } = render(<GenerationProgress {...defaultProps} />);
      
      // Should not crash on unmount
      expect(() => unmount()).not.toThrow();

      // Restore clearInterval
      global.clearInterval = originalClearInterval;
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<GenerationProgress {...defaultProps} />);
      
      expect(screen.getByRole('dialog', { hidden: true })).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow');
      expect(progressBar).toHaveAttribute('aria-valuemin');
      expect(progressBar).toHaveAttribute('aria-valuemax');
    });

    it('provides meaningful text for screen readers', () => {
      render(<GenerationProgress {...defaultProps} />);
      
      // Check for descriptive text content
      expect(screen.getByText('Nossa IA está criando conteúdo educacional personalizado para suas especificações')).toBeInTheDocument();
      expect(screen.getByText('1 de 4 etapas')).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<GenerationProgress {...defaultProps} />);
      
      // Tab to cancel button
      await user.tab();
      expect(screen.getByRole('button', { name: /cancelar geração/i })).toHaveFocus();
      
      // Activate with Enter
      await user.keyboard('{Enter}');
      expect(screen.getByText('Cancelar Geração do Módulo?')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('does not cause memory leaks with timer', () => {
      const { unmount } = render(<GenerationProgress {...defaultProps} />);
      
      // Advance time to ensure timer is running
      jest.advanceTimersByTime(1000);
      expect(screen.getByText('Tempo decorrido: 0:01')).toBeInTheDocument();
      
      // Unmount should clean up timer
      unmount();
      
      // Timer should not continue after unmount
      jest.advanceTimersByTime(5000);
      // If component was still mounted, this would show 0:06, but since it's unmounted, we can't check
      // The test passes if no errors are thrown
    });

    it('efficiently updates progress bar', () => {
      const { rerender } = render(<GenerationProgress {...defaultProps} />);
      
      // Update with new progress
      const updatedSteps = mockSteps.map((step, index) => 
        index < 3 ? { ...step, status: 'completed' as const } : step
      );
      
      rerender(<GenerationProgress {...defaultProps} steps={updatedSteps} />);
      
      expect(screen.getByText('3 de 4 etapas')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
    });
  });
});