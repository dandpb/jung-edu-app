/**
 * User Workflow Integration Tests
 * Tests complete end-to-end user workflows and interactions
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { AdminContext } from '../../contexts/AdminContext';
import { LoginForm } from '../../components/auth/LoginForm';
import { RegisterForm } from '../../components/auth/RegisterForm';
import Dashboard from '../../pages/Dashboard';
import ModulePage from '../../pages/ModulePage';
import AIModuleGenerator from '../../components/admin/AIModuleGenerator';
import QuizComponent from '../../components/quiz/QuizComponent';
import { AuthService } from '../../services/auth/authService';
import { ModuleService } from '../../services/modules/moduleService';
import { UserRole } from '../../types/auth';
import { DifficultyLevel, ModuleStatus } from '../../schemas/module.schema';

// Mock services and external dependencies
jest.mock('../../services/auth/authService');
jest.mock('../../services/modules/moduleService');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useParams: () => ({ id: 'test-module-id' })
}));

// Mock react-markdown to avoid import issues
jest.mock('react-markdown', () => {
  return function MockMarkdown({ children }: { children: string }) {
    return <div data-testid="markdown-content">{children}</div>;
  };
});

const MockedAuthService = AuthService as jest.Mocked<typeof AuthService>;
const MockedModuleService = ModuleService as jest.Mocked<typeof ModuleService>;

describe('User Workflow Integration Tests', () => {
  const mockAuthContextValue = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
    requestPasswordReset: jest.fn(),
    resetPassword: jest.fn(),
    changePassword: jest.fn(),
    verifyEmail: jest.fn(),
    resendVerificationEmail: jest.fn(),
    hasPermission: jest.fn().mockReturnValue(true),
    hasRole: jest.fn().mockReturnValue(true),
    refreshSession: jest.fn(),
    clearError: jest.fn()
  };

  const mockAdminContextValue = {
    isAdmin: false,
    currentAdmin: null,
    login: jest.fn().mockReturnValue(true),
    logout: jest.fn(),
    modules: [],
    updateModules: jest.fn()
  };

  const renderWithProviders = (component: React.ReactElement, authValue: any = mockAuthContextValue) => {
    return render(
      <BrowserRouter>
        <AuthContext.Provider value={authValue}>
          <AdminContext.Provider value={mockAdminContextValue}>
            {component}
          </AdminContext.Provider>
        </AuthContext.Provider>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('User Registration and Login Workflow', () => {
    it('should complete full user registration workflow', async () => {
      const user = userEvent.setup();
      
      // Mock successful registration
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        role: UserRole.STUDENT,
        profile: {
          firstName: 'Test',
          lastName: 'User',
          preferences: {
            theme: 'light' as const,
            language: 'en',
            emailNotifications: true,
            pushNotifications: false
          }
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        isVerified: true
      };

      const mockRegister = jest.fn().mockResolvedValue(mockUser);
      const contextValue = { ...mockAuthContextValue, register: mockRegister };

      renderWithProviders(<RegisterForm />, contextValue);

      // Fill registration form
      await user.type(screen.getByLabelText(/first name/i), 'Test');
      await user.type(screen.getByLabelText(/last name/i), 'User');
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'SecurePass123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'SecurePass123!');

      // Submit form
      await user.click(screen.getByRole('button', { name: /register/i }));

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          firstName: 'Test',
          lastName: 'User',
          username: 'testuser',
          email: 'test@example.com',
          password: 'SecurePass123!',
          role: UserRole.STUDENT
        });
      });
    });

    it('should handle login workflow and redirect to dashboard', async () => {
      const user = userEvent.setup();

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        role: UserRole.STUDENT,
        profile: {
          firstName: 'Test',
          lastName: 'User',
          preferences: {
            theme: 'light' as const,
            language: 'en',
            emailNotifications: true,
            pushNotifications: false
          }
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        isVerified: true
      };

      const mockLogin = jest.fn().mockResolvedValue({
        user: mockUser,
        accessToken: 'mock-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 900000
      });

      const contextValue = { ...mockAuthContextValue, login: mockLogin };

      renderWithProviders(<LoginForm />, contextValue);

      // Fill login form
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/password/i), 'SecurePass123!');
      
      // Submit form
      await user.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          username: 'testuser',
          password: 'SecurePass123!',
          rememberMe: false
        });
      });
    });
  });

  describe('Learning Module Progression Workflow', () => {
    it('should complete full learning module workflow', async () => {
      const user = userEvent.setup();

      // Mock authenticated user
      const mockUser = {
        id: 'user-123',
        email: 'student@example.com',
        username: 'student',
        role: UserRole.STUDENT,
        profile: {
          firstName: 'Student',
          lastName: 'User',
          preferences: {
            theme: 'light' as const,
            language: 'en',
            emailNotifications: true,
            pushNotifications: false
          }
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        isVerified: true
      };

      // Mock user progress
      const mockUserProgress = {
        userId: mockUser.id,
        completedModules: [],
        quizScores: {},
        totalTime: 0,
        lastAccessed: Date.now(),
        notes: []
      };

      // Mock module data
      const mockModule = {
        id: 'test-module-id',
        title: 'Introduction to Jung',
        description: 'Basic concepts of Jungian psychology',
        estimatedTime: 60,
        difficulty: 'beginner' as const,
        content: {
          introduction: 'This module introduces Jung\'s key concepts',
          sections: [
            {
              id: 'section-1',
              title: 'The Unconscious Mind',
              content: 'Jung\'s view of the unconscious differs from Freud\'s...',
              order: 1
            }
          ]
        },
        videos: [
          {
            id: 'video-1',
            title: 'Jung Introduction',
            url: 'https://youtube.com/watch?v=test',
            duration: { hours: 0, minutes: 10, seconds: 30 },
            description: 'Introduction video'
          }
        ],
        quiz: {
          id: 'quiz-1',
          title: 'Jung Quiz',
          description: 'Test quiz on Jung concepts',
          passingScore: 70,
          questions: [
            {
              id: 'q1',
              question: 'What is the collective unconscious?',
              options: [
                { id: '0', text: 'Personal memories', isCorrect: false },
                { id: '1', text: 'Universal human experiences', isCorrect: true },
                { id: '2', text: 'Learned behaviors', isCorrect: false },
                { id: '3', text: 'Cultural norms', isCorrect: false }
              ],
              correctAnswer: 1,
              explanation: 'The collective unconscious contains universal human experiences and archetypes.',
              type: 'multiple-choice' as const,
              difficulty: DifficultyLevel.BEGINNER,
              points: 1
            }
          ]
        },
        bibliography: [],
        filmReferences: [],
        tags: ['jung', 'psychology'],
        difficultyLevel: DifficultyLevel.BEGINNER,
        timeEstimate: { hours: 1, minutes: 30 },
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: '1.0.0',
          status: ModuleStatus.PUBLISHED,
          language: 'en',
          author: {
            id: 'instructor-1',
            name: 'Instructor User',
            email: 'instructor@example.com',
            role: 'Instructor'
          }
        }
      };

      MockedModuleService.getModuleById = jest.fn().mockResolvedValue(mockModule);

      const contextValue = { ...mockAuthContextValue, user: mockUser, isAuthenticated: true };

      renderWithProviders(
        <ModulePage 
          modules={[mockModule]}
          userProgress={mockUserProgress}
          updateProgress={jest.fn()}
        />, 
        contextValue
      );

      // Wait for module to load
      await waitFor(() => {
        expect(screen.getByText('Introduction to Jung')).toBeInTheDocument();
      });

      // Check module content is displayed
      expect(screen.getByText(/This module introduces Jung's key concepts/i)).toBeInTheDocument();
      expect(screen.getByText('The Unconscious Mind')).toBeInTheDocument();

      // Navigate to quiz section (assuming there's a quiz button/link)
      const quizSection = screen.getByTestId('quiz-section') || screen.getByText(/quiz/i);
      if (quizSection) {
        await user.click(quizSection);

        // Verify quiz question is displayed
        await waitFor(() => {
          expect(screen.getByText('What is the collective unconscious?')).toBeInTheDocument();
        });

        // Answer the quiz question
        const correctOption = screen.getByText('Universal human experiences');
        await user.click(correctOption);

        // Submit quiz answer (if there's a submit button)
        const submitButton = screen.queryByText(/submit/i) || screen.queryByText(/next/i);
        if (submitButton) {
          await user.click(submitButton);

          // Verify feedback is shown
          await waitFor(() => {
            expect(screen.getByText(/correct/i)).toBeInTheDocument();
          });
        }
      }

      expect(MockedModuleService.getModuleById).toHaveBeenCalledWith('test-module-id');
    });

    it('should handle module completion tracking', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'student@example.com',
        username: 'student',
        role: UserRole.STUDENT,
        profile: {
          firstName: 'Student',
          lastName: 'User',
          preferences: {
            theme: 'light' as const,
            language: 'en',
            emailNotifications: true,
            pushNotifications: false
          }
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        isVerified: true
      };

      const mockUserProgress = {
        userId: mockUser.id,
        completedModules: [],
        quizScores: {},
        totalTime: 0,
        lastAccessed: Date.now(),
        notes: []
      };

      const mockModules = [
        {
          id: 'module-1',
          title: 'Jung Basics',
          description: 'Basic concepts',
          estimatedTime: 60,
          difficulty: 'beginner' as const,
          content: { introduction: 'Intro', sections: [] },
          videos: [],
          quiz: { id: 'quiz-1', title: 'Quiz', description: 'Module quiz', passingScore: 70, questions: [] },
          bibliography: [],
          filmReferences: [],
          tags: ['jung'],
          difficultyLevel: DifficultyLevel.BEGINNER,
          timeEstimate: { hours: 1, minutes: 0 },
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            version: '1.0.0',
            status: ModuleStatus.PUBLISHED,
            language: 'en',
            author: {
              id: 'instructor-1',
              name: 'Instructor',
              email: 'instructor@example.com',
              role: 'Instructor'
            }
          }
        }
      ];

      MockedModuleService.getAllModules = jest.fn().mockResolvedValue(mockModules);

      const contextValue = { ...mockAuthContextValue, user: mockUser, isAuthenticated: true };

      renderWithProviders(
        <Dashboard 
          modules={mockModules}
          userProgress={mockUserProgress}
        />, 
        contextValue
      );

      await waitFor(() => {
        expect(screen.getByText('Jung Basics')).toBeInTheDocument();
      });

      expect(MockedModuleService.getAllModules).toHaveBeenCalled();
    });
  });

  describe('Admin Module Management Workflow', () => {
    it('should complete admin module creation workflow', async () => {
      const user = userEvent.setup();

      // Mock admin user
      const mockAdmin = {
        id: 'admin-123',
        email: 'admin@example.com',
        username: 'admin',
        role: UserRole.INSTRUCTOR,
        profile: {
          firstName: 'Admin',
          lastName: 'User',
          preferences: {
            theme: 'light' as const,
            language: 'en',
            emailNotifications: true,
            pushNotifications: false
          }
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        isVerified: true
      };

      const mockExistingModules = [
        { id: 'mod1', title: 'Introduction to Jung' },
        { id: 'mod2', title: 'Shadow Work' }
      ];

      const mockOnGenerate = jest.fn();
      const mockOnCancel = jest.fn();

      const contextValue = { ...mockAuthContextValue, user: mockAdmin };

      renderWithProviders(
        <AIModuleGenerator 
          onGenerate={mockOnGenerate}
          onCancel={mockOnCancel}
          existingModules={mockExistingModules.map(m => ({ 
            ...m, 
            description: 'Module description', 
            estimatedTime: 60, 
            difficulty: 'beginner' as const 
          }))}
        />,
        contextValue
      );

      // Fill in module generation form
      const subjectInput = screen.getByLabelText(/sobre qual assunto/i);
      await user.type(subjectInput, 'Advanced Jungian Concepts');

      // Open advanced options
      await user.click(screen.getByText(/opções avançadas/i));

      // Change settings
      const intermediateRadio = screen.getByRole('radio', { name: /intermediário/i });
      await user.click(intermediateRadio);

      // Generate module
      const generateButton = screen.getByRole('button', { name: /gerar módulo/i });
      await user.click(generateButton);

      await waitFor(() => {
        expect(mockOnGenerate).toHaveBeenCalledWith(
          expect.objectContaining({
            subject: 'Advanced Jungian Concepts',
            difficulty: 'intermediate',
            includeQuiz: true,
            includeVideos: true,
            includeBibliography: true
          })
        );
      });
    });
  });

  describe('Quiz Taking Workflow', () => {
    it('should complete quiz taking workflow', async () => {
      const user = userEvent.setup();

      const mockQuiz = {
        id: 'quiz-1',
        title: 'Jung Knowledge Quiz',
        questions: [
          {
            id: 'q1',
            question: 'What is an archetype?',
            options: [
              { id: '0', text: 'A personal memory', isCorrect: false },
              { id: '1', text: 'A universal pattern', isCorrect: true },
              { id: '2', text: 'A learned behavior', isCorrect: false },
              { id: '3', text: 'A cultural norm', isCorrect: false }
            ],
            correctAnswer: 1,
            explanation: 'Archetypes are universal patterns in the collective unconscious.',
            type: 'multiple-choice' as const,
            difficulty: DifficultyLevel.INTERMEDIATE,
            points: 1
          },
          {
            id: 'q2',
            question: 'Who developed the concept of the shadow?',
            options: [
              { id: '0', text: 'Sigmund Freud', isCorrect: false },
              { id: '1', text: 'Carl Jung', isCorrect: true },
              { id: '2', text: 'Alfred Adler', isCorrect: false },
              { id: '3', text: 'Erik Erikson', isCorrect: false }
            ],
            correctAnswer: 1,
            explanation: 'Carl Jung developed the concept of the shadow as part of his analytical psychology.',
            type: 'multiple-choice' as const,
            difficulty: DifficultyLevel.BEGINNER,
            points: 1
          }
        ]
      };

      const mockOnComplete = jest.fn();

      renderWithProviders(
        <QuizComponent quiz={mockQuiz} onComplete={mockOnComplete} />
      );

      // Answer first question correctly
      await user.click(screen.getByText('A universal pattern'));
      await user.click(screen.getByText(/next/i));

      // Answer second question correctly
      await user.click(screen.getByText('Carl Jung'));
      await user.click(screen.getByText(/submit/i));

      // Wait for quiz completion
      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            score: 2,
            totalQuestions: 2,
            percentage: 100,
            answers: expect.arrayContaining([
              expect.objectContaining({ questionId: 'q1', selectedAnswer: 1, isCorrect: true }),
              expect.objectContaining({ questionId: 'q2', selectedAnswer: 1, isCorrect: true })
            ])
          })
        );
      });
    });

    it('should handle partial quiz completion', async () => {
      const user = userEvent.setup();

      const mockQuiz = {
        id: 'quiz-1',
        title: 'Jung Knowledge Quiz',
        questions: [
          {
            id: 'q1',
            question: 'What is the collective unconscious?',
            options: [
              { id: '0', text: 'Personal memories', isCorrect: false },
              { id: '1', text: 'Universal experiences', isCorrect: true },
              { id: '2', text: 'Learned behaviors', isCorrect: false },
              { id: '3', text: 'Cultural norms', isCorrect: false }
            ],
            correctAnswer: 1,
            explanation: 'The collective unconscious contains universal human experiences.',
            type: 'multiple-choice' as const,
            difficulty: DifficultyLevel.INTERMEDIATE,
            points: 1
          }
        ]
      };

      const mockOnComplete = jest.fn();

      renderWithProviders(
        <QuizComponent quiz={mockQuiz} onComplete={mockOnComplete} />
      );

      // Answer incorrectly
      await user.click(screen.getByText('Personal memories'));
      await user.click(screen.getByText(/submit/i));

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            score: 0,
            totalQuestions: 1,
            percentage: 0,
            answers: expect.arrayContaining([
              expect.objectContaining({ questionId: 'q1', selectedAnswer: 0, isCorrect: false })
            ])
          })
        );
      });
    });
  });

  describe('Error Handling in User Workflows', () => {
    it('should handle authentication failures gracefully', async () => {
      const user = userEvent.setup();

      const mockLogin = jest.fn().mockRejectedValue(new Error('Invalid credentials'));
      const contextValue = { ...mockAuthContextValue, login: mockLogin };

      renderWithProviders(<LoginForm />, contextValue);

      await user.type(screen.getByLabelText(/username/i), 'wronguser');
      await user.type(screen.getByLabelText(/password/i), 'wrongpass');
      await user.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
        // Check for error message display
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    it('should handle module loading failures', async () => {
      MockedModuleService.getModuleById = jest.fn().mockRejectedValue(new Error('Module not found'));

      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        username: 'user',
        role: UserRole.STUDENT,
        profile: {
          firstName: 'User',
          lastName: 'Test',
          preferences: {
            theme: 'light' as const,
            language: 'en',
            emailNotifications: true,
            pushNotifications: false
          }
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        isVerified: true
      };

      const mockUserProgress = {
        userId: mockUser.id,
        completedModules: [],
        quizScores: {},
        totalTime: 0,
        lastAccessed: Date.now(),
        notes: []
      };

      const contextValue = { ...mockAuthContextValue, user: mockUser, isAuthenticated: true };

      renderWithProviders(
        <ModulePage 
          modules={[]}
          userProgress={mockUserProgress}
          updateProgress={jest.fn()}
        />, 
        contextValue
      );

      await waitFor(() => {
        expect(MockedModuleService.getModuleById).toHaveBeenCalled();
        // Should show error state
        expect(screen.getByText(/error loading module/i)).toBeInTheDocument();
      });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });
});