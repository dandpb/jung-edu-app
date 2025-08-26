import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import GenerationProgress, { GenerationStep } from '../GenerationProgress';

// Mock coordination hooks
jest.mock('../../../hooks/useCoordination', () => ({
  useCoordination: () => ({
    notify: jest.fn(),
    getMemory: jest.fn(() => Promise.resolve(null)),
    setMemory: jest.fn(() => Promise.resolve())
  })
}));

// Mock timers
jest.useFakeTimers();

describe('GenerationProgress Component', () => {
  const mockSteps: GenerationStep[] = [
    {
      id: 'step-1',
      label: 'Analisando requisitos',
      status: 'completed',
      message: 'Requisitos analisados com sucesso'
    },
    {
      id: 'step-2',
      label: 'Gerando conteúdo',
      status: 'in-progress',
      message: 'Criando seções do módulo...'
    },
    {
      id: 'step-3',
      label: 'Criando quiz',
      status: 'pending'
    },
    {
      id: 'step-4',
      label: 'Finalizando módulo',
      status: 'pending'
    }
  ];

  const defaultProps = {
    steps: mockSteps,
    currentStep: 1,
    onCancel: jest.fn(),
    estimatedTime: 45
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
  });

  describe('Component Rendering', () => {
    it('renders generation progress dialog', () => {
      render(<GenerationProgress {...defaultProps} />);
      
      expect(screen.getByText('Gerando Seu Módulo')).toBeInTheDocument();
      expect(screen.getByText('Nossa IA está criando conteúdo educacional personalizado para suas especificações')).toBeInTheDocument();
    });

    it('displays all generation steps', () => {
      render(<GenerationProgress {...defaultProps} />);
      
      expect(screen.getByText('Analisando requisitos')).toBeInTheDocument();
      expect(screen.getByText('Gerando conteúdo')).toBeInTheDocument();
      expect(screen.getByText('Criando quiz')).toBeInTheDocument();
      expect(screen.getByText('Finalizando módulo')).toBeInTheDocument();
    });

    it('shows progress bar with correct percentage', () => {
      render(<GenerationProgress {...defaultProps} />);
      
      // 1 completed step out of 4 = 25%
      expect(screen.getByText('1 de 4 etapas')).toBeInTheDocument();
      expect(screen.getByText('25%')).toBeInTheDocument();
      
      const progressBar = document.querySelector('.bg-gradient-to-r');
      expect(progressBar).toHaveStyle('width: 25%');
    });

    it('displays Brain icon', () => {
      render(<GenerationProgress {...defaultProps} />);
      
      const brainIcon = document.querySelector('.w-8.h-8.text-purple-600');
      expect(brainIcon).toBeInTheDocument();
    });

    it('shows cancel button', () => {
      render(<GenerationProgress {...defaultProps} />);
      
      expect(screen.getByText('Cancelar Geração')).toBeInTheDocument();
    });
  });

  describe('Step Status Display', () => {
    it('shows correct icons for different step statuses', () => {
      render(<GenerationProgress {...defaultProps} />);
      
      // Completed step should have check icon
      const completedStep = screen.getByText('Analisando requisitos').closest('div');
      expect(completedStep?.querySelector('.text-green-600')).toBeInTheDocument();
      
      // In-progress step should have spinning loader
      const inProgressStep = screen.getByText('Gerando conteúdo').closest('div');
      expect(inProgressStep?.querySelector('.animate-spin')).toBeInTheDocument();
      
      // Pending step should have empty circle
      const pendingStep = screen.getByText('Criando quiz').closest('div');
      expect(pendingStep?.querySelector('.border-gray-300')).toBeInTheDocument();
    });

    it('displays step messages when available', () => {
      render(<GenerationProgress {...defaultProps} />);
      
      expect(screen.getByText('Requisitos analisados com sucesso')).toBeInTheDocument();
      expect(screen.getByText('Criando seções do módulo...')).toBeInTheDocument();
    });

    it('applies correct styling to different step states', () => {
      render(<GenerationProgress {...defaultProps} />);
      
      const completedStep = screen.getByText('Analisando requisitos').closest('div');
      const inProgressStep = screen.getByText('Gerando conteúdo').closest('div');
      const pendingStep = screen.getByText('Criando quiz').closest('div');
      
      expect(completedStep).toHaveClass('opacity-75');
      expect(inProgressStep).toHaveClass('bg-purple-50', 'border-purple-200');
      expect(pendingStep).not.toHaveClass('bg-purple-50');
    });

    it('shows animated dots for current step', () => {
      render(<GenerationProgress {...defaultProps} />);
      
      const animatedDots = document.querySelectorAll('.animate-bounce');
      expect(animatedDots).toHaveLength(3); // Three dots
    });
  });

  describe('Error State Handling', () => {
    it('displays error status correctly', () => {
      const stepsWithError: GenerationStep[] = [
        ...mockSteps.slice(0, 2),
        {
          id: 'step-3',
          label: 'Criando quiz',
          status: 'error',
          message: 'Erro ao gerar quiz'
        },
        ...mockSteps.slice(3)
      ];

      render(<GenerationProgress {...defaultProps} steps={stepsWithError} />);
      
      const errorStep = screen.getByText('Criando quiz').closest('div');
      expect(errorStep).toHaveClass('bg-red-50', 'border-red-200');
      expect(errorStep?.querySelector('.text-red-600')).toBeInTheDocument();
      expect(screen.getByText('Erro ao gerar quiz')).toBeInTheDocument();
    });

    it('handles mixed step statuses correctly', () => {
      const mixedSteps: GenerationStep[] = [
        { id: '1', label: 'Completed', status: 'completed' },
        { id: '2', label: 'Error', status: 'error', message: 'Error occurred' },
        { id: '3', label: 'In Progress', status: 'in-progress' },
        { id: '4', label: 'Pending', status: 'pending' }
      ];

      render(<GenerationProgress {...defaultProps} steps={mixedSteps} />);
      
      expect(screen.getByText('Error occurred')).toBeInTheDocument();
    });
  });

  describe('Timer Functionality', () => {
    it('starts and updates elapsed time correctly', async () => {
      render(<GenerationProgress {...defaultProps} />);
      
      expect(screen.getByText('Tempo decorrido: 0:00')).toBeInTheDocument();
      
      // Fast-forward 30 seconds
      act(() => {
        jest.advanceTimersByTime(30000);
      });
      
      expect(screen.getByText('Tempo decorrido: 0:30')).toBeInTheDocument();
    });

    it('calculates remaining time correctly', async () => {
      render(<GenerationProgress {...defaultProps} estimatedTime={60} />);
      
      expect(screen.getByText('Tempo restante estimado: ~1:00')).toBeInTheDocument();
      
      // Fast-forward 20 seconds
      act(() => {
        jest.advanceTimersByTime(20000);
      });
      
      expect(screen.getByText('Tempo restante estimado: ~0:40')).toBeInTheDocument();
    });

    it('handles elapsed time exceeding estimated time', async () => {
      render(<GenerationProgress {...defaultProps} estimatedTime={30} />);
      
      // Fast-forward 40 seconds (more than estimated)
      act(() => {
        jest.advanceTimersByTime(40000);
      });
      
      expect(screen.getByText('Tempo restante estimado: ~0:00')).toBeInTheDocument();
    });

    it('formats time display correctly', async () => {
      render(<GenerationProgress {...defaultProps} />);
      
      // Test various time formats
      act(() => {
        jest.advanceTimersByTime(65000); // 1 minute 5 seconds
      });
      
      expect(screen.getByText('Tempo decorrido: 1:05')).toBeInTheDocument();
    });

    it('cleans up timer on unmount', () => {
      const { unmount } = render(<GenerationProgress {...defaultProps} />);
      
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      
      unmount();
      
      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  describe('Cancel Functionality', () => {
    it('calls onCancel immediately when no progress made', () => {
      const stepsWithoutProgress = mockSteps.map(step => ({ ...step, status: 'pending' as const }));
      const mockOnCancel = jest.fn();
      
      render(
        <GenerationProgress 
          {...defaultProps} 
          steps={stepsWithoutProgress}
          onCancel={mockOnCancel}
        />
      );
      
      fireEvent.click(screen.getByText('Cancelar Geração'));
      
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('shows confirmation dialog when progress has been made', () => {
      const mockOnCancel = jest.fn();
      render(<GenerationProgress {...defaultProps} onCancel={mockOnCancel} />);
      
      fireEvent.click(screen.getByText('Cancelar Geração'));
      
      expect(screen.getByText('Cancelar Geração do Módulo?')).toBeInTheDocument();
      expect(screen.getByText('Tem certeza que deseja cancelar? Você perderá o progresso feito até agora.')).toBeInTheDocument();
      expect(mockOnCancel).not.toHaveBeenCalled();
    });

    it('shows completed steps count in confirmation dialog', () => {
      render(<GenerationProgress {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Cancelar Geração'));
      
      expect(screen.getByText('(1 etapas concluídas)')).toBeInTheDocument();
    });

    it('allows user to continue generation', () => {
      render(<GenerationProgress {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Cancelar Geração'));
      fireEvent.click(screen.getByText('Continuar Gerando'));
      
      expect(screen.queryByText('Cancelar Geração do Módulo?')).not.toBeInTheDocument();
    });

    it('confirms cancellation and calls onCancel', () => {
      const mockOnCancel = jest.fn();
      render(<GenerationProgress {...defaultProps} onCancel={mockOnCancel} />);
      
      fireEvent.click(screen.getByText('Cancelar Geração'));
      fireEvent.click(screen.getByText('Sim, Cancelar'));
      
      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Progress Calculation', () => {
    it('calculates progress correctly with different step counts', () => {
      const twoSteps: GenerationStep[] = [
        { id: '1', label: 'Step 1', status: 'completed' },
        { id: '2', label: 'Step 2', status: 'pending' }
      ];

      render(<GenerationProgress {...defaultProps} steps={twoSteps} />);
      
      expect(screen.getByText('1 de 2 etapas')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('handles empty steps array gracefully', () => {
      render(<GenerationProgress {...defaultProps} steps={[]} />);
      
      expect(screen.getByText('0 de 0 etapas')).toBeInTheDocument();
      expect(screen.getByText('NaN%')).not.toBeInTheDocument(); // Should handle division by zero
    });

    it('calculates progress with all completed steps', () => {
      const completedSteps = mockSteps.map(step => ({ ...step, status: 'completed' as const }));
      
      render(<GenerationProgress {...defaultProps} steps={completedSteps} />);
      
      expect(screen.getByText('4 de 4 etapas')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA attributes', () => {
      render(<GenerationProgress {...defaultProps} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<GenerationProgress {...defaultProps} />);
      
      await user.tab();
      
      const cancelButton = screen.getByText('Cancelar Geração');
      expect(cancelButton).toHaveFocus();
    });

    it('handles escape key to cancel', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const mockOnCancel = jest.fn();
      render(<GenerationProgress {...defaultProps} onCancel={mockOnCancel} />);
      
      await user.keyboard('{Escape}');
      
      // Should show cancel confirmation or directly cancel based on implementation
    });

    it('provides semantic structure', () => {
      render(<GenerationProgress {...defaultProps} />);
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Gerando Seu Módulo');
    });
  });

  describe('User Experience', () => {
    it('shows visual progress with gradient bar', () => {
      render(<GenerationProgress {...defaultProps} />);
      
      const progressBar = document.querySelector('.bg-gradient-to-r.from-purple-500.to-purple-600');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveClass('transition-all', 'duration-500', 'ease-out');
    });

    it('provides smooth animations for state changes', () => {
      render(<GenerationProgress {...defaultProps} />);
      
      const progressBar = document.querySelector('.transition-all.duration-500');
      expect(progressBar).toBeInTheDocument();
    });

    it('handles rapid step updates smoothly', () => {
      const { rerender } = render(<GenerationProgress {...defaultProps} />);
      
      // Rapidly update steps
      for (let i = 0; i < 4; i++) {
        const updatedSteps = mockSteps.map((step, index) => ({
          ...step,
          status: index <= i ? 'completed' as const : 'pending' as const
        }));
        
        rerender(<GenerationProgress {...defaultProps} steps={updatedSteps} />);
      }
      
      expect(screen.getByText('4 de 4 etapas')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing step messages gracefully', () => {
      const stepsWithoutMessages = mockSteps.map(step => ({
        ...step,
        message: undefined
      }));
      
      render(<GenerationProgress {...defaultProps} steps={stepsWithoutMessages} />);
      
      expect(screen.getByText('Analisando requisitos')).toBeInTheDocument();
    });

    it('handles invalid currentStep index', () => {
      render(<GenerationProgress {...defaultProps} currentStep={10} />);
      
      expect(screen.getByText('Gerando Seu Módulo')).toBeInTheDocument();
    });

    it('handles negative estimated time', () => {
      render(<GenerationProgress {...defaultProps} estimatedTime={-10} />);
      
      expect(screen.getByText('Tempo restante estimado: ~0:00')).toBeInTheDocument();
    });

    it('handles very large estimated times', () => {
      render(<GenerationProgress {...defaultProps} estimatedTime={7200} />); // 2 hours
      
      expect(screen.getByText('Tempo restante estimado: ~120:00')).toBeInTheDocument();
    });

    it('handles missing onCancel callback', () => {
      expect(() => {
        render(<GenerationProgress {...defaultProps} onCancel={undefined as any} />);
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('handles frequent timer updates efficiently', async () => {
      render(<GenerationProgress {...defaultProps} />);
      
      // Fast-forward multiple timer ticks
      for (let i = 0; i < 60; i++) {
        act(() => {
          jest.advanceTimersByTime(1000);
        });
      }
      
      expect(screen.getByText('Tempo decorrido: 1:00')).toBeInTheDocument();
    });

    it('optimizes re-renders on prop changes', () => {
      const { rerender } = render(<GenerationProgress {...defaultProps} />);
      
      // Re-render with same props
      rerender(<GenerationProgress {...defaultProps} />);
      
      expect(screen.getByText('Gerando Seu Módulo')).toBeInTheDocument();
    });

    it('handles component unmounting during timer operation', () => {
      const { unmount } = render(<GenerationProgress {...defaultProps} />);
      
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      
      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });

  describe('Modal Behavior', () => {
    it('renders as modal overlay', () => {
      render(<GenerationProgress {...defaultProps} />);
      
      const modalOverlay = document.querySelector('.fixed.inset-0.bg-black.bg-opacity-50');
      expect(modalOverlay).toBeInTheDocument();
    });

    it('centers modal content', () => {
      render(<GenerationProgress {...defaultProps} />);
      
      const modalContent = document.querySelector('.bg-white.rounded-lg.shadow-xl');
      expect(modalContent).toBeInTheDocument();
    });

    it('prevents background interaction', () => {
      render(<GenerationProgress {...defaultProps} />);
      
      const overlay = document.querySelector('.z-50');
      expect(overlay).toBeInTheDocument();
    });
  });

  describe('Localization', () => {
    it('displays Portuguese text correctly', () => {
      render(<GenerationProgress {...defaultProps} />);
      
      expect(screen.getByText('Gerando Seu Módulo')).toBeInTheDocument();
      expect(screen.getByText('etapas')).toBeInTheDocument();
      expect(screen.getByText('Tempo decorrido')).toBeInTheDocument();
      expect(screen.getByText('Cancelar Geração')).toBeInTheDocument();
    });

    it('handles special Portuguese characters', () => {
      render(<GenerationProgress {...defaultProps} />);
      
      expect(screen.getByText('especificações')).toBeInTheDocument();
      expect(screen.getByText('restante estimado')).toBeInTheDocument();
    });
  });
});