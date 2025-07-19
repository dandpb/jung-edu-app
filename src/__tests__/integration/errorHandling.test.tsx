import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AIModuleGenerator from '../../components/admin/AIModuleGenerator';
import { ModuleService } from '../../services/modules/moduleService';
import { render as customRender } from '../../utils/test-utils';

// Mock the module service
jest.mock('../../services/modules/moduleService');

// Mock child components
jest.mock('../../components/admin/GenerationProgress', () => ({
  GenerationProgress: ({ error }: any) => (
    <div data-testid="generation-error">
      {error && <div className="error">{error.message}</div>}
    </div>
  )
}));

describe('Error Handling and Edge Cases', () => {
  let mockModuleService: jest.Mocked<ModuleService>;
  
  beforeEach(() => {
    mockModuleService = {
      generateModule: jest.fn(),
      updateModule: jest.fn(),
      validateModule: jest.fn(),
      generateMultipleModules: jest.fn()
    } as any;
    
    (ModuleService as jest.Mock).mockImplementation(() => mockModuleService);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('API Error Handling', () => {
    it('should handle rate limit errors', async () => {
      const user = userEvent.setup();
      
      mockModuleService.generateModule.mockRejectedValue({
        message: 'Rate limit exceeded',
        code: 'RATE_LIMIT_ERROR',
        retryAfter: 60
      });
      
      customRender(<AIModuleGenerator />);
      
      await user.type(screen.getByLabelText(/título/i), 'Test');
      await user.type(screen.getByLabelText(/conceptos/i), 'test');
      await user.click(screen.getByRole('button', { name: /generar/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/límite de solicitudes excedido/i)).toBeInTheDocument();
        expect(screen.getByText(/intente nuevamente en 60 segundos/i)).toBeInTheDocument();
      });
    });
    
    it('should handle network errors', async () => {
      const user = userEvent.setup();
      
      mockModuleService.generateModule.mockRejectedValue(
        new Error('Network error: Failed to fetch')
      );
      
      customRender(<AIModuleGenerator />);
      
      await user.type(screen.getByLabelText(/título/i), 'Test');
      await user.type(screen.getByLabelText(/conceptos/i), 'test');
      await user.click(screen.getByRole('button', { name: /generar/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/error de conexión/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
      });
    });
    
    it('should handle invalid API key', async () => {
      const user = userEvent.setup();
      
      mockModuleService.generateModule.mockRejectedValue({
        message: 'Invalid API key',
        code: 'AUTH_ERROR'
      });
      
      customRender(<AIModuleGenerator />);
      
      await user.type(screen.getByLabelText(/título/i), 'Test');
      await user.type(screen.getByLabelText(/conceptos/i), 'test');
      await user.click(screen.getByRole('button', { name: /generar/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/clave API inválida/i)).toBeInTheDocument();
        expect(screen.getByText(/verifique la configuración/i)).toBeInTheDocument();
      });
    });
  });
  
  describe('Input Validation', () => {
    it('should validate required fields', async () => {
      const user = userEvent.setup();
      
      customRender(<AIModuleGenerator />);
      
      // Try to generate without filling fields
      await user.click(screen.getByRole('button', { name: /generar/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/el título es requerido/i)).toBeInTheDocument();
        expect(screen.getByText(/al menos un concepto es requerido/i)).toBeInTheDocument();
      });
    });
    
    it('should validate concept format', async () => {
      const user = userEvent.setup();
      
      customRender(<AIModuleGenerator />);
      
      await user.type(screen.getByLabelText(/título/i), 'Test Module');
      await user.type(screen.getByLabelText(/conceptos/i), ',,,,'); // Invalid format
      await user.click(screen.getByRole('button', { name: /generar/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/formato de conceptos inválido/i)).toBeInTheDocument();
      });
    });
    
    it('should limit concept count', async () => {
      const user = userEvent.setup();
      
      customRender(<AIModuleGenerator />);
      
      await user.type(screen.getByLabelText(/título/i), 'Test Module');
      
      // Try to add more than 10 concepts
      const concepts = Array(15).fill('concept').map((c, i) => `${c}${i}`).join(', ');
      await user.type(screen.getByLabelText(/conceptos/i), concepts);
      await user.click(screen.getByRole('button', { name: /generar/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/máximo 10 conceptos permitidos/i)).toBeInTheDocument();
      });
    });
  });
  
  describe('Partial Generation Failures', () => {
    it('should handle video search failure gracefully', async () => {
      const user = userEvent.setup();
      
      mockModuleService.generateModule.mockImplementation(async (params, onProgress) => {
        onProgress?.({ stage: 'content', progress: 0.2, message: 'Content generated' });
        onProgress?.({ stage: 'videos', progress: 0.4, message: 'Video search failed' });
        
        return {
          id: 'partial-module',
          title: params.title,
          concepts: params.concepts,
          difficulty: params.difficulty,
          content: { introduction: 'Content generated successfully' },
          videos: [], // Empty due to failure
          quiz: { questions: [] },
          errors: ['Video generation failed: YouTube API error']
        };
      });
      
      customRender(<AIModuleGenerator />);
      
      await user.type(screen.getByLabelText(/título/i), 'Partial Module');
      await user.type(screen.getByLabelText(/conceptos/i), 'test');
      await user.click(screen.getByRole('button', { name: /generar/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/módulo generado con advertencias/i)).toBeInTheDocument();
        expect(screen.getByText(/video generation failed/i)).toBeInTheDocument();
      });
    });
    
    it('should continue generation after quiz failure', async () => {
      const user = userEvent.setup();
      
      mockModuleService.generateModule.mockImplementation(async (params, onProgress) => {
        onProgress?.({ stage: 'quiz', progress: 0.6, message: 'Quiz generation failed' });
        
        return {
          id: 'quiz-failed-module',
          title: params.title,
          concepts: params.concepts,
          difficulty: params.difficulty,
          content: { introduction: 'Content OK' },
          videos: [{ id: 'v1', title: 'Video OK' }],
          quiz: null, // Failed to generate
          mindMap: { nodes: [], edges: [] },
          bibliography: [],
          errors: ['Quiz generation failed: Invalid response format']
        };
      });
      
      customRender(<AIModuleGenerator />);
      
      await user.type(screen.getByLabelText(/título/i), 'Test');
      await user.type(screen.getByLabelText(/conceptos/i), 'test');
      await user.click(screen.getByRole('button', { name: /generar/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/quiz generation failed/i)).toBeInTheDocument();
        // But other components should be present
        expect(screen.getByText(/content ok/i)).toBeInTheDocument();
      });
    });
  });
  
  describe('Timeout Handling', () => {
    it('should handle generation timeout', async () => {
      const user = userEvent.setup();
      
      mockModuleService.generateModule.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Generation timeout')), 100)
        )
      );
      
      customRender(<AIModuleGenerator />);
      
      await user.type(screen.getByLabelText(/título/i), 'Timeout Test');
      await user.type(screen.getByLabelText(/conceptos/i), 'test');
      await user.click(screen.getByRole('button', { name: /generar/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/tiempo de espera agotado/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });
  
  describe('Concurrent Request Handling', () => {
    it('should prevent multiple simultaneous generations', async () => {
      const user = userEvent.setup();
      
      let resolveGeneration: any;
      mockModuleService.generateModule.mockImplementation(() => 
        new Promise(resolve => { resolveGeneration = resolve; })
      );
      
      customRender(<AIModuleGenerator />);
      
      await user.type(screen.getByLabelText(/título/i), 'Test');
      await user.type(screen.getByLabelText(/conceptos/i), 'test');
      
      // Start first generation
      await user.click(screen.getByRole('button', { name: /generar/i }));
      
      // Button should be disabled
      expect(screen.getByRole('button', { name: /generando/i })).toBeDisabled();
      
      // Try to click again
      await user.click(screen.getByRole('button', { name: /generando/i }));
      
      // Should still have only one call
      expect(mockModuleService.generateModule).toHaveBeenCalledTimes(1);
      
      // Resolve the generation
      resolveGeneration({ id: 'test', title: 'Test' });
    });
  });
  
  describe('Memory and Performance Issues', () => {
    it('should handle large module generation', async () => {
      const user = userEvent.setup();
      
      // Create a large module response
      const largeModule = {
        id: 'large-module',
        title: 'Large Module',
        concepts: Array(100).fill('concept').map((c, i) => `${c}-${i}`),
        content: {
          introduction: 'A'.repeat(10000),
          sections: Array(50).fill(null).map((_, i) => ({
            title: `Section ${i}`,
            content: 'B'.repeat(5000)
          }))
        },
        videos: Array(100).fill(null).map((_, i) => ({
          id: `video-${i}`,
          title: `Video ${i}`
        })),
        quiz: {
          questions: Array(100).fill(null).map((_, i) => ({
            id: `q-${i}`,
            question: `Question ${i}`,
            type: 'multiple-choice',
            options: ['A', 'B', 'C', 'D'],
            correctAnswer: 0
          }))
        }
      };
      
      mockModuleService.generateModule.mockResolvedValue(largeModule);
      
      customRender(<AIModuleGenerator />);
      
      await user.type(screen.getByLabelText(/título/i), 'Large Module');
      await user.type(screen.getByLabelText(/conceptos/i), 'many concepts');
      await user.click(screen.getByRole('button', { name: /generar/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/Large Module/)).toBeInTheDocument();
      }, { timeout: 10000 });
      
      // Should handle large data without crashing
      expect(screen.getByTestId('module-preview')).toBeInTheDocument();
    });
  });
  
  describe('Recovery and Retry Logic', () => {
    it('should retry failed generation with exponential backoff', async () => {
      const user = userEvent.setup();
      let attemptCount = 0;
      
      mockModuleService.generateModule.mockImplementation(async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Temporary failure');
        }
        return { id: 'success', title: 'Success after retry' };
      });
      
      customRender(<AIModuleGenerator />);
      
      await user.type(screen.getByLabelText(/título/i), 'Retry Test');
      await user.type(screen.getByLabelText(/conceptos/i), 'test');
      
      // Enable auto-retry
      await user.click(screen.getByLabelText(/reintentar automáticamente/i));
      
      await user.click(screen.getByRole('button', { name: /generar/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/reintentando.*intento 1/i)).toBeInTheDocument();
      });
      
      await waitFor(() => {
        expect(screen.getByText(/reintentando.*intento 2/i)).toBeInTheDocument();
      });
      
      await waitFor(() => {
        expect(screen.getByText(/Success after retry/)).toBeInTheDocument();
      }, { timeout: 10000 });
      
      expect(mockModuleService.generateModule).toHaveBeenCalledTimes(3);
    });
  });
});