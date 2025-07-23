import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import GenerationProgress, { GenerationStep } from '../GenerationProgress';

describe('GenerationProgress', () => {
  const mockSteps: GenerationStep[] = [
    { id: 'step1', label: 'Analyzing content', status: 'completed' },
    { id: 'step2', label: 'Generating outline', status: 'in-progress', message: 'Creating structure...' },
    { id: 'step3', label: 'Writing sections', status: 'pending' },
    { id: 'step4', label: 'Creating quiz', status: 'pending' }
  ];

  const defaultProps = {
    steps: mockSteps,
    currentStep: 1,
    onCancel: jest.fn(),
    estimatedTime: 30
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Basic Rendering', () => {
    it('should render all steps', () => {
      render(<GenerationProgress {...defaultProps} />);
      
      expect(screen.getByText('Analyzing content')).toBeInTheDocument();
      expect(screen.getByText('Generating outline')).toBeInTheDocument();
      expect(screen.getByText('Writing sections')).toBeInTheDocument();
      expect(screen.getByText('Creating quiz')).toBeInTheDocument();
    });

    it('should show the correct status icons', () => {
      const { container } = render(<GenerationProgress {...defaultProps} />);
      
      // Completed step should have check icon
      const checkIcon = container.querySelector('.text-green-600');
      expect(checkIcon).toBeInTheDocument();
      
      // In-progress step should have spinning loader
      const loader = container.querySelector('.animate-spin');
      expect(loader).toBeInTheDocument();
      
      // Pending steps should have empty circles
      const pendingCircles = container.querySelectorAll('.border-gray-300');
      expect(pendingCircles).toHaveLength(2);
    });

    it('should display step messages when present', () => {
      render(<GenerationProgress {...defaultProps} />);
      
      expect(screen.getByText('Creating structure...')).toBeInTheDocument();
    });

    it('should show header with Brain icon and title', () => {
      render(<GenerationProgress {...defaultProps} />);
      
      expect(screen.getByText('Gerando Seu Módulo')).toBeInTheDocument();
      expect(screen.getByText('Nossa IA está criando conteúdo educacional personalizado para suas especificações')).toBeInTheDocument();
    });

    it('should display progress count', () => {
      render(<GenerationProgress {...defaultProps} />);
      
      expect(screen.getByText(/1.*de.*4.*etapas/)).toBeInTheDocument();
    });

    it('should show animated dots for in-progress step', () => {
      render(<GenerationProgress {...defaultProps} />);
      
      // Find the in-progress step element
      const inProgressStep = screen.getByText('Generating outline').closest('div[class*="bg-purple-50"]');
      const animatedDots = inProgressStep?.querySelectorAll('.animate-bounce');
      expect(animatedDots).toHaveLength(3);
    });

    it('should apply correct styling for different step statuses', () => {
      const stepsWithAllStatuses: GenerationStep[] = [
        { id: 'step1', label: 'Completed step', status: 'completed' },
        { id: 'step2', label: 'In progress step', status: 'in-progress' },
        { id: 'step3', label: 'Error step', status: 'error', message: 'Something went wrong' },
        { id: 'step4', label: 'Pending step', status: 'pending' }
      ];

      render(<GenerationProgress {...defaultProps} steps={stepsWithAllStatuses} />);

      // Check completed step styling - find the step container with opacity-75 class
      const completedStepText = screen.getByText('Completed step');
      const stepContainer = completedStepText.closest('[class*="opacity-75"]');
      expect(stepContainer).toHaveClass('opacity-75');

      // Check in-progress step styling - find the correct container
      const inProgressStepText = screen.getByText('In progress step');
      const inProgressContainer = inProgressStepText.closest('[class*="bg-purple-50"]');
      expect(inProgressContainer).toHaveClass('bg-purple-50', 'border', 'border-purple-200');

      // Check error step styling - find the correct container
      const errorStepText = screen.getByText('Error step');
      const errorContainer = errorStepText.closest('[class*="bg-red-50"]');
      expect(errorContainer).toHaveClass('bg-red-50', 'border', 'border-red-200');
    });
  });

  describe('Timer Functionality', () => {
    it('should display and update elapsed time', () => {
      render(<GenerationProgress {...defaultProps} />);
      
      expect(screen.getByText('Tempo decorrido: 0:00')).toBeInTheDocument();
      
      // Advance timer by 65 seconds
      act(() => {
        jest.advanceTimersByTime(65000);
      });
      
      expect(screen.getByText('Tempo decorrido: 1:05')).toBeInTheDocument();
    });

    it('should format time correctly for single digit seconds', () => {
      render(<GenerationProgress {...defaultProps} />);
      
      act(() => {
        jest.advanceTimersByTime(5000); // 5 seconds
      });
      expect(screen.getByText('Tempo decorrido: 0:05')).toBeInTheDocument();
    });

    it('should display remaining time estimate', () => {
      render(<GenerationProgress {...defaultProps} />);
      
      expect(screen.getByText('Tempo restante estimado: ~0:30')).toBeInTheDocument();
      
      // Advance timer by 10 seconds
      act(() => {
        jest.advanceTimersByTime(10000);
      });
      
      expect(screen.getByText('Tempo restante estimado: ~0:20')).toBeInTheDocument();
    });

    it('should show 0:00 when elapsed time exceeds estimate', () => {
      render(<GenerationProgress {...defaultProps} />);
      
      // Advance timer beyond estimated time
      act(() => {
        jest.advanceTimersByTime(35000); // 35 seconds (estimate is 30)
      });
      
      expect(screen.getByText('Tempo restante estimado: ~0:00')).toBeInTheDocument();
    });

    it('should use default estimated time of 45 seconds when not provided', () => {
      const { estimatedTime, ...propsWithoutTime } = defaultProps;
      render(<GenerationProgress {...propsWithoutTime} />);
      
      expect(screen.getByText('Tempo restante estimado: ~0:45')).toBeInTheDocument();
    });

    it('should clean up timer on unmount', () => {
      const { unmount } = render(<GenerationProgress {...defaultProps} />);
      
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      
      unmount();
      
      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  describe('Cancel Functionality', () => {
    it('should show cancel button', () => {
      render(<GenerationProgress {...defaultProps} />);
      
      const cancelButton = screen.getByRole('button', { name: /Cancelar Geração/i });
      expect(cancelButton).toBeInTheDocument();
    });

    it('should call onCancel directly when no steps are completed', () => {
      const stepsNoneCompleted: GenerationStep[] = mockSteps.map(step => ({
        ...step,
        status: 'pending'
      }));

      render(<GenerationProgress {...defaultProps} steps={stepsNoneCompleted} />);
      
      fireEvent.click(screen.getByText('Cancelar Geração'));
      
      expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
      expect(screen.queryByText('Cancelar Geração do Módulo?')).not.toBeInTheDocument();
    });

    it('should show confirmation dialog when steps are completed', () => {
      render(<GenerationProgress {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Cancelar Geração'));
      
      expect(screen.getByText('Cancelar Geração do Módulo?')).toBeInTheDocument();
      expect(screen.getByText(/Tem certeza que deseja cancelar\? Você perderá o progresso feito até agora\./)).toBeInTheDocument();
      expect(screen.getByText(/1.*etapas.*concluídas/)).toBeInTheDocument();
    });

    it('should show correct completed steps count in confirmation', () => {
      const twoCompleted: GenerationStep[] = [
        { id: 'step1', label: 'Step 1', status: 'completed' },
        { id: 'step2', label: 'Step 2', status: 'completed' },
        { id: 'step3', label: 'Step 3', status: 'in-progress' },
        { id: 'step4', label: 'Step 4', status: 'pending' }
      ];

      render(<GenerationProgress {...defaultProps} steps={twoCompleted} />);
      
      fireEvent.click(screen.getByText('Cancelar Geração'));
      
      expect(screen.getByText(/2.*etapas.*concluídas/)).toBeInTheDocument();
    });

    it('should call onCancel when confirmed in dialog', () => {
      render(<GenerationProgress {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Cancelar Geração'));
      fireEvent.click(screen.getByText('Sim, Cancelar'));
      
      expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
    });

    it('should close dialog when choosing to continue', () => {
      render(<GenerationProgress {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Cancelar Geração'));
      fireEvent.click(screen.getByText('Continuar Gerando'));
      
      expect(screen.queryByText('Cancelar Geração do Módulo?')).not.toBeInTheDocument();
      expect(defaultProps.onCancel).not.toHaveBeenCalled();
    });

    it('should reset showCancelConfirm state properly', () => {
      render(<GenerationProgress {...defaultProps} />);
      
      // Open and close dialog multiple times
      fireEvent.click(screen.getByText('Cancelar Geração'));
      fireEvent.click(screen.getByText('Continuar Gerando'));
      
      // Should be able to open it again
      fireEvent.click(screen.getByText('Cancelar Geração'));
      expect(screen.getByText('Cancelar Geração do Módulo?')).toBeInTheDocument();
    });
  });

  describe('Progress Bar', () => {
    it('should show progress bar with correct percentage', () => {
      render(<GenerationProgress {...defaultProps} />);
      
      // 1 completed out of 4 steps = 25%
      expect(screen.getByText('25%')).toBeInTheDocument();
    });

    it('should update progress bar width', () => {
      const { container } = render(<GenerationProgress {...defaultProps} />);
      
      const progressBar = container.querySelector('.bg-gradient-to-r');
      expect(progressBar).toHaveStyle({ width: '25%' });
    });

    it('should calculate progress correctly for different scenarios', () => {
      // No completed steps
      const noCompleted: GenerationStep[] = mockSteps.map(step => ({
        ...step,
        status: 'pending'
      }));
      
      const { rerender } = render(<GenerationProgress {...defaultProps} steps={noCompleted} />);
      expect(screen.getByText('0%')).toBeInTheDocument();

      // Half completed
      const halfCompleted: GenerationStep[] = [
        { id: 'step1', label: 'Step 1', status: 'completed' },
        { id: 'step2', label: 'Step 2', status: 'completed' },
        { id: 'step3', label: 'Step 3', status: 'pending' },
        { id: 'step4', label: 'Step 4', status: 'pending' }
      ];
      
      rerender(<GenerationProgress {...defaultProps} steps={halfCompleted} />);
      expect(screen.getByText('50%')).toBeInTheDocument();

      // All completed
      const allCompleted: GenerationStep[] = mockSteps.map(step => ({
        ...step,
        status: 'completed'
      }));
      
      rerender(<GenerationProgress {...defaultProps} steps={allCompleted} />);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should round progress percentage correctly', () => {
      // 2 out of 3 steps = 66.67%, should display as 67%
      const threeSteps: GenerationStep[] = [
        { id: 'step1', label: 'Step 1', status: 'completed' },
        { id: 'step2', label: 'Step 2', status: 'completed' },
        { id: 'step3', label: 'Step 3', status: 'pending' }
      ];
      
      render(<GenerationProgress {...defaultProps} steps={threeSteps} />);
      expect(screen.getByText('67%')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error icon for failed steps', () => {
      const stepsWithError: GenerationStep[] = [
        { id: 'step1', label: 'Step 1', status: 'completed' },
        { id: 'step2', label: 'Step 2', status: 'error', message: 'Failed to generate' }
      ];
      
      const { container } = render(
        <GenerationProgress {...defaultProps} steps={stepsWithError} />
      );
      
      const errorIcon = container.querySelector('.text-red-600');
      expect(errorIcon).toBeInTheDocument();
      expect(screen.getByText('Failed to generate')).toBeInTheDocument();
    });

    it('should style error text correctly', () => {
      const stepsWithError: GenerationStep[] = [
        { id: 'step1', label: 'Error step', status: 'error', message: 'Generation failed' }
      ];
      
      render(<GenerationProgress {...defaultProps} steps={stepsWithError} />);
      
      const errorStepLabel = screen.getByText('Error step');
      expect(errorStepLabel).toHaveClass('text-red-900');
    });
  });

  describe('Z-index and Overlay', () => {
    it('should render with correct z-index layers', () => {
      render(<GenerationProgress {...defaultProps} />);
      
      // Main modal should have z-50
      const mainModal = screen.getByText('Gerando Seu Módulo').closest('.z-50');
      expect(mainModal).toBeInTheDocument();
    });

    it('should render cancel confirmation with higher z-index', () => {
      render(<GenerationProgress {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Cancelar Geração'));
      
      // Confirmation dialog should have z-60
      const confirmDialog = screen.getByText('Cancelar Geração do Módulo?').closest('.z-60');
      expect(confirmDialog).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper button roles', () => {
      render(<GenerationProgress {...defaultProps} />);
      
      const cancelButton = screen.getByRole('button', { name: /Cancelar Geração/i });
      expect(cancelButton).toBeInTheDocument();
    });

    it('should have proper dialog structure when confirmation shown', () => {
      render(<GenerationProgress {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Cancelar Geração'));
      
      expect(screen.getByRole('button', { name: 'Continuar Gerando' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Sim, Cancelar' })).toBeInTheDocument();
    });
  });
});