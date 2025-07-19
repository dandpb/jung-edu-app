import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import AIModuleGenerator from '../../components/admin/AIModuleGenerator';
import { AdminContext } from '../../contexts/AdminContext';
import { ModuleService } from '../../services/modules/moduleService';
import { mockModule, mockVideo, mockQuiz, mockMindMapData, mockBibliographyItem } from '../mocks/mockData';

// Mock the module service
jest.mock('../../services/modules/moduleService');

// Mock child components
jest.mock('../../components/admin/GenerationProgress', () => ({
  GenerationProgress: ({ progress, stage, message }: any) => (
    <div data-testid="generation-progress">
      <div>{stage}: {progress * 100}%</div>
      <div>{message}</div>
    </div>
  )
}));

jest.mock('../../components/admin/ModulePreview', () => ({
  ModulePreview: ({ module }: any) => (
    <div data-testid="module-preview">
      <h2>{module.title}</h2>
      <div>Concepts: {module.concepts.join(', ')}</div>
      <div>Videos: {module.videos?.length || 0}</div>
      <div>Questions: {module.quiz?.questions?.length || 0}</div>
    </div>
  )
}));

describe('Module Generation Integration', () => {
  let mockModuleService: jest.Mocked<ModuleService>;
  const mockIsAdmin = true;
  const mockToken = 'test-token';
  
  const renderWithContext = (component: React.ReactElement) => {
    return render(
      <BrowserRouter>
        <AdminContext.Provider value={{ isAdmin: mockIsAdmin, token: mockToken }}>
          {component}
        </AdminContext.Provider>
      </BrowserRouter>
    );
  };
  
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
  
  describe('Module Generation Flow', () => {
    it('should complete full module generation workflow', async () => {
      const user = userEvent.setup();
      
      // Mock successful generation
      mockModuleService.generateModule.mockImplementation(async (params, onProgress) => {
        // Simulate progress updates
        onProgress?.({ stage: 'content', progress: 0.2, message: 'Generating content...' });
        await new Promise(resolve => setTimeout(resolve, 100));
        
        onProgress?.({ stage: 'videos', progress: 0.4, message: 'Searching videos...' });
        await new Promise(resolve => setTimeout(resolve, 100));
        
        onProgress?.({ stage: 'quiz', progress: 0.6, message: 'Creating quiz...' });
        await new Promise(resolve => setTimeout(resolve, 100));
        
        onProgress?.({ stage: 'mindmap', progress: 0.8, message: 'Building mind map...' });
        await new Promise(resolve => setTimeout(resolve, 100));
        
        onProgress?.({ stage: 'bibliography', progress: 0.9, message: 'Compiling references...' });
        await new Promise(resolve => setTimeout(resolve, 100));
        
        onProgress?.({ stage: 'complete', progress: 1, message: 'Complete!' });
        
        return {
          ...mockModule,
          content: {
            introduction: 'Generated introduction',
            sections: [{ title: 'Section 1', content: 'Content' }],
            summary: 'Summary'
          },
          videos: [mockVideo],
          quiz: mockQuiz,
          mindMap: mockMindMapData,
          bibliography: [mockBibliographyItem]
        };
      });
      
      renderWithContext(<AIModuleGenerator />);
      
      // Fill in the form
      const titleInput = screen.getByLabelText(/título del módulo/i);
      await user.type(titleInput, 'Introduction to Jungian Psychology');
      
      const conceptsInput = screen.getByLabelText(/conceptos/i);
      await user.type(conceptsInput, 'collective unconscious, archetypes, shadow');
      
      const difficultySelect = screen.getByLabelText(/dificultad/i);
      await user.selectOptions(difficultySelect, 'intermediate');
      
      // Start generation
      const generateButton = screen.getByRole('button', { name: /generar módulo/i });
      await user.click(generateButton);
      
      // Check progress updates
      await waitFor(() => {
        expect(screen.getByTestId('generation-progress')).toBeInTheDocument();
      });
      
      // Verify progress stages
      await waitFor(() => {
        expect(screen.getByText(/content: 20%/i)).toBeInTheDocument();
      });
      
      await waitFor(() => {
        expect(screen.getByText(/videos: 40%/i)).toBeInTheDocument();
      });
      
      await waitFor(() => {
        expect(screen.getByText(/complete: 100%/i)).toBeInTheDocument();
      });
      
      // Check final preview
      await waitFor(() => {
        const preview = screen.getByTestId('module-preview');
        expect(preview).toBeInTheDocument();
        expect(within(preview).getByText('Introduction to Jungian Psychology')).toBeInTheDocument();
        expect(within(preview).getByText(/Videos: 1/)).toBeInTheDocument();
        expect(within(preview).getByText(/Questions: 3/)).toBeInTheDocument();
      });
    });
    
    it('should handle generation errors gracefully', async () => {
      const user = userEvent.setup();
      
      mockModuleService.generateModule.mockRejectedValue(
        new Error('API rate limit exceeded')
      );
      
      renderWithContext(<AIModuleGenerator />);
      
      // Fill minimal form
      await user.type(screen.getByLabelText(/título/i), 'Test Module');
      await user.type(screen.getByLabelText(/conceptos/i), 'test concept');
      
      // Try to generate
      await user.click(screen.getByRole('button', { name: /generar/i }));
      
      // Check error message
      await waitFor(() => {
        expect(screen.getByText(/error al generar/i)).toBeInTheDocument();
        expect(screen.getByText(/API rate limit exceeded/i)).toBeInTheDocument();
      });
      
      // Should allow retry
      expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
    });
    
    it('should allow cancellation during generation', async () => {
      const user = userEvent.setup();
      let generationCancelled = false;
      
      mockModuleService.generateModule.mockImplementation(async (params, onProgress) => {
        for (let i = 0; i <= 10; i++) {
          if (generationCancelled) throw new Error('Generation cancelled');
          onProgress?.({ 
            stage: 'content', 
            progress: i / 10, 
            message: `Generating... ${i * 10}%` 
          });
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        return mockModule;
      });
      
      renderWithContext(<AIModuleGenerator />);
      
      // Start generation
      await user.type(screen.getByLabelText(/título/i), 'Test');
      await user.type(screen.getByLabelText(/conceptos/i), 'test');
      await user.click(screen.getByRole('button', { name: /generar/i }));
      
      // Wait for generation to start
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
      });
      
      // Cancel generation
      generationCancelled = true;
      await user.click(screen.getByRole('button', { name: /cancelar/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/generación cancelada/i)).toBeInTheDocument();
      });
    });
  });
  
  describe('Advanced Options', () => {
    it('should handle custom generation options', async () => {
      const user = userEvent.setup();
      
      mockModuleService.generateModule.mockResolvedValue(mockModule);
      
      renderWithContext(<AIModuleGenerator />);
      
      // Open advanced options
      await user.click(screen.getByText(/opciones avanzadas/i));
      
      // Configure options
      const videoCountInput = screen.getByLabelText(/número de videos/i);
      await user.clear(videoCountInput);
      await user.type(videoCountInput, '10');
      
      const questionCountInput = screen.getByLabelText(/número de preguntas/i);
      await user.clear(questionCountInput);
      await user.type(questionCountInput, '20');
      
      // Disable certain components
      const includeQuizCheckbox = screen.getByLabelText(/incluir quiz/i);
      await user.click(includeQuizCheckbox);
      
      // Fill basic info and generate
      await user.type(screen.getByLabelText(/título/i), 'Custom Module');
      await user.type(screen.getByLabelText(/conceptos/i), 'custom concepts');
      await user.click(screen.getByRole('button', { name: /generar/i }));
      
      await waitFor(() => {
        expect(mockModuleService.generateModule).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Custom Module',
            options: expect.objectContaining({
              videoCount: 10,
              questionCount: 20,
              includeQuiz: false
            })
          }),
          expect.any(Function)
        );
      });
    });
  });
  
  describe('Module Preview and Editing', () => {
    it('should allow editing generated module', async () => {
      const user = userEvent.setup();
      
      mockModuleService.generateModule.mockResolvedValue(mockModule);
      mockModuleService.updateModule.mockResolvedValue({
        ...mockModule,
        title: 'Updated Title'
      });
      
      renderWithContext(<AIModuleGenerator />);
      
      // Generate module
      await user.type(screen.getByLabelText(/título/i), 'Original Title');
      await user.type(screen.getByLabelText(/conceptos/i), 'test');
      await user.click(screen.getByRole('button', { name: /generar/i }));
      
      // Wait for generation
      await waitFor(() => {
        expect(screen.getByTestId('module-preview')).toBeInTheDocument();
      });
      
      // Click edit button
      await user.click(screen.getByRole('button', { name: /editar/i }));
      
      // Should open editor
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /editor de módulo/i })).toBeInTheDocument();
      });
    });
    
    it('should allow regenerating specific components', async () => {
      const user = userEvent.setup();
      
      mockModuleService.generateModule.mockResolvedValue(mockModule);
      mockModuleService.updateModule.mockResolvedValue({
        ...mockModule,
        quiz: {
          ...mockQuiz,
          questions: [...mockQuiz.questions, {
            id: 'q4',
            type: 'multiple-choice',
            question: 'New question',
            options: ['A', 'B', 'C', 'D'],
            correctAnswer: 0,
            explanation: 'New explanation',
            difficulty: 'medium',
            concept: 'shadow'
          }]
        }
      });
      
      renderWithContext(<AIModuleGenerator />);
      
      // Generate initial module
      await user.type(screen.getByLabelText(/título/i), 'Test Module');
      await user.type(screen.getByLabelText(/conceptos/i), 'test');
      await user.click(screen.getByRole('button', { name: /generar/i }));
      
      await waitFor(() => {
        expect(screen.getByTestId('module-preview')).toBeInTheDocument();
      });
      
      // Regenerate quiz
      await user.click(screen.getByRole('button', { name: /regenerar quiz/i }));
      
      await waitFor(() => {
        expect(mockModuleService.updateModule).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            regenerateQuiz: true
          })
        );
      });
    });
  });
  
  describe('Save and Export', () => {
    it('should save generated module', async () => {
      const user = userEvent.setup();
      const mockSaveModule = jest.fn().mockResolvedValue({ id: 'saved-module-1' });
      
      mockModuleService.generateModule.mockResolvedValue(mockModule);
      
      renderWithContext(<AIModuleGenerator onSave={mockSaveModule} />);
      
      // Generate module
      await user.type(screen.getByLabelText(/título/i), 'Module to Save');
      await user.type(screen.getByLabelText(/conceptos/i), 'concepts');
      await user.click(screen.getByRole('button', { name: /generar/i }));
      
      await waitFor(() => {
        expect(screen.getByTestId('module-preview')).toBeInTheDocument();
      });
      
      // Save module
      await user.click(screen.getByRole('button', { name: /guardar módulo/i }));
      
      await waitFor(() => {
        expect(mockSaveModule).toHaveBeenCalledWith(expect.objectContaining({
          title: 'Introduction to Jungian Psychology'
        }));
      });
      
      // Check success message
      expect(screen.getByText(/módulo guardado exitosamente/i)).toBeInTheDocument();
    });
    
    it('should export module in different formats', async () => {
      const user = userEvent.setup();
      
      mockModuleService.generateModule.mockResolvedValue(mockModule);
      
      // Mock file download
      const mockCreateObjectURL = jest.fn(() => 'blob:mock-url');
      const mockRevokeObjectURL = jest.fn();
      global.URL.createObjectURL = mockCreateObjectURL;
      global.URL.revokeObjectURL = mockRevokeObjectURL;
      
      renderWithContext(<AIModuleGenerator />);
      
      // Generate module
      await user.type(screen.getByLabelText(/título/i), 'Export Test');
      await user.type(screen.getByLabelText(/conceptos/i), 'test');
      await user.click(screen.getByRole('button', { name: /generar/i }));
      
      await waitFor(() => {
        expect(screen.getByTestId('module-preview')).toBeInTheDocument();
      });
      
      // Export as JSON
      await user.click(screen.getByRole('button', { name: /exportar/i }));
      await user.click(screen.getByRole('menuitem', { name: /json/i }));
      
      expect(mockCreateObjectURL).toHaveBeenCalled();
    });
  });
});