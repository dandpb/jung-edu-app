import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AutomaticQuizGenerator from '../AutomaticQuizGenerator';
import { LLMProviderFactory } from '../../../services/llm/provider';
import { contentAnalyzer } from '../../../services/quiz/contentAnalyzer';
import { AutomaticQuizOrchestrator } from '../../../services/quiz/automaticQuizOrchestrator';
import { Quiz } from '../../../types';

// Mock the services
jest.mock('../../../services/llm/provider');
jest.mock('../../../services/quiz/contentAnalyzer');
jest.mock('../../../services/quiz/automaticQuizOrchestrator');

const mockQuiz: Quiz = {
  id: 'generated-quiz',
  title: 'Generated Quiz',
  questions: [
    {
      id: 'q1',
      question: 'What is the main concept?',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 0,
      explanation: 'Option A is correct because...'
    },
    {
      id: 'q2',
      question: 'Which statement is true?',
      options: ['Statement 1', 'Statement 2', 'Statement 3', 'Statement 4'],
      correctAnswer: 1,
      explanation: 'Statement 2 is correct...'
    }
  ]
};

const mockGenerationResult = {
  quiz: mockQuiz,
  analytics: {
    finalQualityScore: 85,
    generationAttempts: 1,
    timeTaken: 3500,
    contentAnalysis: {
      keyConcepts: ['Concept 1', 'Concept 2', 'Concept 3', 'Concept 4', 'Concept 5', 'Concept 6']
    },
    improvementSuggestions: [
      'Add more application-level questions',
      'Include visual aids where possible',
      'Consider adding essay questions'
    ]
  }
};

const mockContentPreview = {
  keyTopics: ['Topic 1', 'Topic 2', 'Topic 3', 'Topic 4'],
  estimatedDifficulty: 'intermediate',
  suggestedQuestionCount: 12
};

describe('AutomaticQuizGenerator Component', () => {
  let mockOnQuizGenerated: jest.Mock;
  let mockGenerateAutomaticQuiz: jest.Mock;
  let mockQuickAnalysis: jest.Mock;
  let mockAnalyzeContent: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock window.alert
    window.alert = jest.fn();
    
    mockOnQuizGenerated = jest.fn();
    mockGenerateAutomaticQuiz = jest.fn();
    mockQuickAnalysis = jest.fn();
    mockAnalyzeContent = jest.fn();

    // Setup mocks
    (LLMProviderFactory.getProvider as jest.Mock).mockReturnValue({});
    
    (AutomaticQuizOrchestrator as jest.Mock).mockImplementation(() => ({
      generateAutomaticQuiz: mockGenerateAutomaticQuiz
    }));

    (contentAnalyzer.quickAnalysis as jest.Mock) = mockQuickAnalysis;
    (contentAnalyzer.analyzeContent as jest.Mock) = mockAnalyzeContent;

    // Default mock implementations
    mockQuickAnalysis.mockResolvedValue(mockContentPreview);
    mockAnalyzeContent.mockResolvedValue({
      keyConcepts: ['Concept 1', 'Concept 2', 'Concept 3'],
      difficulty: 'intermediate'
    });
    mockGenerateAutomaticQuiz.mockResolvedValue(mockGenerationResult);
  });

  describe('Component Rendering', () => {
    test('renders with title and description', () => {
      render(
        <AutomaticQuizGenerator
          onQuizGenerated={mockOnQuizGenerated}
          moduleContent="Test content"
          moduleTopic="Test topic"
        />
      );

      expect(screen.getByText('Gerador Automático de Quiz')).toBeInTheDocument();
      expect(screen.getByText('Gere quizzes inteligentes usando IA avançada')).toBeInTheDocument();
    });

    test('renders generation options with default values', () => {
      render(
        <AutomaticQuizGenerator
          onQuizGenerated={mockOnQuizGenerated}
          moduleContent="Test content"
          moduleTopic="Test topic"
        />
      );

      // Check basic options
      expect(screen.getByLabelText('Número de Questões')).toHaveValue(10);
      expect(screen.getByLabelText('Nível de Dificuldade')).toHaveValue('intermediate');
      expect(screen.getByLabelText('Incluir questões dissertativas')).not.toBeChecked();
    });

    test('shows advanced options when clicked', () => {
      render(
        <AutomaticQuizGenerator
          onQuizGenerated={mockOnQuizGenerated}
          moduleContent="Test content"
          moduleTopic="Test topic"
        />
      );

      // Advanced options should not be visible initially
      expect(screen.queryByLabelText('Limiar de Qualidade (%)')).not.toBeInTheDocument();

      // Click to show advanced options
      const advancedButtons = screen.getAllByText('Avançado');
      fireEvent.click(advancedButtons[0]);

      // Now advanced options should be visible
      expect(screen.getByLabelText('Limiar de Qualidade (%)')).toBeInTheDocument();
      expect(screen.getByLabelText('Máximo de Tentativas')).toBeInTheDocument();
      expect(screen.getByLabelText('Dificuldade adaptativa')).toBeInTheDocument();
    });
  });

  describe('Content Preview', () => {
    test('displays content preview when content is analyzed', async () => {
      render(
        <AutomaticQuizGenerator
          onQuizGenerated={mockOnQuizGenerated}
          moduleContent="Test content"
          moduleTopic="Test topic"
        />
      );

      await waitFor(() => {
        expect(mockQuickAnalysis).toHaveBeenCalledWith('Test content', 'Test topic');
      });

      await waitFor(() => {
        expect(screen.getByText('📊 Análise do Conteúdo')).toBeInTheDocument();
        expect(screen.getByText('Topic 1, Topic 2, Topic 3')).toBeInTheDocument();
        expect(screen.getByText('intermediate')).toBeInTheDocument();
        expect(screen.getByText('12')).toBeInTheDocument();
      });
    });

    test('re-analyzes content when props change', async () => {
      const { rerender } = render(
        <AutomaticQuizGenerator
          onQuizGenerated={mockOnQuizGenerated}
          moduleContent="Initial content"
          moduleTopic="Initial topic"
        />
      );

      await waitFor(() => {
        expect(mockQuickAnalysis).toHaveBeenCalledWith('Initial content', 'Initial topic');
      });

      rerender(
        <AutomaticQuizGenerator
          onQuizGenerated={mockOnQuizGenerated}
          moduleContent="Updated content"
          moduleTopic="Updated topic"
        />
      );

      await waitFor(() => {
        expect(mockQuickAnalysis).toHaveBeenCalledWith('Updated content', 'Updated topic');
      });
    });
  });

  describe('Form Interactions', () => {
    test('updates question count', () => {
      render(
        <AutomaticQuizGenerator
          onQuizGenerated={mockOnQuizGenerated}
          moduleContent="Test content"
          moduleTopic="Test topic"
        />
      );

      const input = screen.getByLabelText('Número de Questões');
      fireEvent.change(input, { target: { value: '15' } });
      expect(input).toHaveValue(15);
    });

    test('updates difficulty level', () => {
      render(
        <AutomaticQuizGenerator
          onQuizGenerated={mockOnQuizGenerated}
          moduleContent="Test content"
          moduleTopic="Test topic"
        />
      );

      const select = screen.getByLabelText('Nível de Dificuldade');
      fireEvent.change(select, { target: { value: 'advanced' } });
      expect(select).toHaveValue('advanced');
    });

    test('toggles essay questions checkbox', () => {
      render(
        <AutomaticQuizGenerator
          onQuizGenerated={mockOnQuizGenerated}
          moduleContent="Test content"
          moduleTopic="Test topic"
        />
      );

      const checkbox = screen.getByLabelText('Incluir questões dissertativas');
      expect(checkbox).not.toBeChecked();
      
      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();
    });

    test('updates advanced options', () => {
      render(
        <AutomaticQuizGenerator
          onQuizGenerated={mockOnQuizGenerated}
          moduleContent="Test content"
          moduleTopic="Test topic"
        />
      );

      // Show advanced options
      const advancedButtons = screen.getAllByText('Avançado');
      fireEvent.click(advancedButtons[0]);

      // Update quality threshold
      const qualityInput = screen.getByLabelText('Limiar de Qualidade (%)');
      fireEvent.change(qualityInput, { target: { value: '90' } });
      expect(qualityInput).toHaveValue(90);

      // Update max retries
      const retriesInput = screen.getByLabelText('Máximo de Tentativas');
      fireEvent.change(retriesInput, { target: { value: '5' } });
      expect(retriesInput).toHaveValue(5);

      // Toggle adaptive difficulty
      const adaptiveCheckbox = screen.getByLabelText('Dificuldade adaptativa');
      expect(adaptiveCheckbox).toBeChecked(); // Default is true
      fireEvent.click(adaptiveCheckbox);
      expect(adaptiveCheckbox).not.toBeChecked();
    });
  });

  describe('Quiz Generation', () => {
    test('disables generate button when content is missing', () => {
      render(
        <AutomaticQuizGenerator
          onQuizGenerated={mockOnQuizGenerated}
          moduleContent=""
          moduleTopic=""
        />
      );

      const generateButton = screen.getByText('Gerar Quiz Automaticamente').closest('button');
      expect(generateButton).toBeDisabled();
      
      // Button should not respond to clicks when disabled
      fireEvent.click(generateButton!);
      expect(mockGenerateAutomaticQuiz).not.toHaveBeenCalled();
    });

    test('generates quiz successfully', async () => {
      // Set up mock to resolve quickly
      mockGenerateAutomaticQuiz.mockImplementation(() => 
        Promise.resolve(mockGenerationResult)
      );

      render(
        <AutomaticQuizGenerator
          onQuizGenerated={mockOnQuizGenerated}
          moduleContent="Test content"
          moduleTopic="Test topic"
          learningObjectives={['Objective 1', 'Objective 2']}
        />
      );

      // Click generate button
      fireEvent.click(screen.getByText('Gerar Quiz Automaticamente'));

      // Check loading state
      expect(screen.getByText('Gerando Quiz...')).toBeInTheDocument();

      // Wait for completion - the component might not show all intermediate steps
      await waitFor(() => {
        expect(screen.getByText('✅ Quiz Gerado com Sucesso!')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Check statistics display - they are displayed as list items with bullets
      // Use getAllByText since there might be multiple elements
      const questionsText = screen.getAllByText(/2 questões geradas/);
      expect(questionsText.length).toBeGreaterThan(0);
      expect(screen.getByText(/Qualidade: 85%/)).toBeInTheDocument();
      expect(screen.getByText(/Tentativas: 1/)).toBeInTheDocument();
      expect(screen.getByText(/Tempo: 3.5s/)).toBeInTheDocument();

      // Check concepts display
      expect(screen.getByText('Concept 1, Concept 2, Concept 3, Concept 4, Concept 5...')).toBeInTheDocument();

      // Check improvement suggestions - they are displayed as list items
      expect(screen.getByText(/Add more application-level questions/)).toBeInTheDocument();
      expect(screen.getByText(/Include visual aids where possible/)).toBeInTheDocument();
      expect(screen.getByText(/Consider adding essay questions/)).toBeInTheDocument();

      // Verify callback was called
      await waitFor(() => {
        expect(mockOnQuizGenerated).toHaveBeenCalledWith(mockQuiz);
      }, { timeout: 2000 });
    });

    test('displays generation progress steps', async () => {
      // Mock slower generation to see progress steps
      let resolveGeneration: (value: any) => void;
      const generationPromise = new Promise((resolve) => {
        resolveGeneration = resolve;
      });
      
      mockGenerateAutomaticQuiz.mockImplementation(() => generationPromise);

      render(
        <AutomaticQuizGenerator
          onQuizGenerated={mockOnQuizGenerated}
          moduleContent="Test content"
          moduleTopic="Test topic"
        />
      );

      fireEvent.click(screen.getByText('Gerar Quiz Automaticamente'));

      // The component should show loading state
      expect(screen.getByText('Gerando Quiz...')).toBeInTheDocument();

      // Resolve the generation
      resolveGeneration!(mockGenerationResult);

      // Wait for completion
      await waitFor(() => {
        expect(screen.getByText('✅ Quiz Gerado com Sucesso!')).toBeInTheDocument();
      }, { timeout: 5000 });

      // After completion, check that results are shown
      expect(screen.getByText('2 questões geradas')).toBeInTheDocument();
    });

    test('handles generation error', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      mockGenerateAutomaticQuiz.mockRejectedValueOnce(new Error('Generation failed'));

      render(
        <AutomaticQuizGenerator
          onQuizGenerated={mockOnQuizGenerated}
          moduleContent="Test content"
          moduleTopic="Test topic"
        />
      );

      fireEvent.click(screen.getByText('Gerar Quiz Automaticamente'));

      await waitFor(() => {
        expect(screen.getByText(/Erro: Generation failed/)).toBeInTheDocument();
      });

      expect(mockOnQuizGenerated).not.toHaveBeenCalled();
      
      consoleError.mockRestore();
    });

    test('button is disabled during generation', async () => {
      render(
        <AutomaticQuizGenerator
          onQuizGenerated={mockOnQuizGenerated}
          moduleContent="Test content"
          moduleTopic="Test topic"
        />
      );

      const button = screen.getByRole('button', { name: /Gerar Quiz Automaticamente/i });
      
      expect(button).not.toBeDisabled();
      
      fireEvent.click(button);
      
      expect(button).toBeDisabled();
      
      await waitFor(() => {
        expect(button).not.toBeDisabled();
      }, { timeout: 5000 });
    });

    test('button is disabled without required content', () => {
      render(
        <AutomaticQuizGenerator
          onQuizGenerated={mockOnQuizGenerated}
          moduleContent=""
          moduleTopic="Test topic"
        />
      );

      const button = screen.getByRole('button', { name: /Gerar Quiz Automaticamente/i });
      expect(button).toBeDisabled();
    });
  });

  describe('Analytics', () => {
    test('logs analytics when button is clicked', async () => {
      const consoleLog = jest.spyOn(console, 'log').mockImplementation();

      render(
        <AutomaticQuizGenerator
          onQuizGenerated={mockOnQuizGenerated}
          moduleContent="Test content"
          moduleTopic="Test topic"
        />
      );

      // Generate quiz first
      fireEvent.click(screen.getByText('Gerar Quiz Automaticamente'));
      
      await waitFor(() => {
        expect(screen.getByText('✅ Quiz Gerado com Sucesso!')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Click analytics button
      fireEvent.click(screen.getByText('Ver Análise Detalhada'));

      expect(consoleLog).toHaveBeenCalledWith('Analytics:', mockGenerationResult.analytics);
      
      consoleLog.mockRestore();
    });
  });

  describe('Options Persistence', () => {
    test('maintains options during generation', async () => {
      render(
        <AutomaticQuizGenerator
          onQuizGenerated={mockOnQuizGenerated}
          moduleContent="Test content"
          moduleTopic="Test topic"
        />
      );

      // Set custom options
      fireEvent.change(screen.getByLabelText('Número de Questões'), { target: { value: '20' } });
      fireEvent.change(screen.getByLabelText('Nível de Dificuldade'), { target: { value: 'advanced' } });
      fireEvent.click(screen.getByLabelText('Incluir questões dissertativas'));

      // Generate quiz
      fireEvent.click(screen.getByText('Gerar Quiz Automaticamente'));

      await waitFor(() => {
        expect(mockGenerateAutomaticQuiz).toHaveBeenCalledWith(
          expect.any(String),
          'Test topic',
          'Test content',
          [],
          expect.objectContaining({
            questionCount: 20,
            targetDifficulty: 'advanced',
            includeEssayQuestions: true
          })
        );
      });
    });
  });
});