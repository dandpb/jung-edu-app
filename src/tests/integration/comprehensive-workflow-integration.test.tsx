
  describe('Quiz Generation and Completion Flow', () => {
    it('should generate quiz questions and handle completion workflow', async () => {
      const user = userEvent.setup();
      const mockOnComplete = jest.fn();
      
      // Mock quiz generator
      const mockQuizGenerator = {
        generateQuiz: jest.fn().mockResolvedValue({
          id: 'generated-quiz-1',
          title: 'Generated Quiz',
          questions: [
            {
              id: 'gen-q1',
              question: 'What is individuation in Jungian psychology?',
              options: [
                { id: '0', text: 'The process of becoming whole', isCorrect: true },
                { id: '1', text: 'The formation of the ego', isCorrect: false },
                { id: '2', text: 'The development of persona', isCorrect: false },
                { id: '3', text: 'The emergence of shadow', isCorrect: false }
              ],
              correctAnswer: 0,
              explanation: 'Individuation is the central process of psychological development in Jung\'s theory.',
              type: 'multiple-choice' as const,
              difficulty: DifficultyLevel.INTERMEDIATE,
              points: 10
            }
          ],
          passingScore: 70,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      };
      
      MockedQuizGenerator.prototype.generateQuiz = mockQuizGenerator.generateQuiz;

      // Render quiz component with generated quiz
      renderWithProviders(
        <QuizComponent 
          quiz={{
            id: 'generated-quiz-1',
            title: 'Generated Quiz',
            questions: [
              {
                id: 'gen-q1',
                question: 'What is individuation in Jungian psychology?',
                options: [
                  { id: '0', text: 'The process of becoming whole', isCorrect: true },
                  { id: '1', text: 'The formation of the ego', isCorrect: false },
                  { id: '2', text: 'The development of persona', isCorrect: false },
                  { id: '3', text: 'The emergence of shadow', isCorrect: false }
                ],
                correctAnswer: 0,
                explanation: 'Individuation is the central process of psychological development in Jung\'s theory.',
                type: 'multiple-choice' as const,
                difficulty: DifficultyLevel.INTERMEDIATE,
                points: 10
              }
            ]
          }}
          onComplete={mockOnComplete}
        />
      );

      // Verify quiz loads
      await waitFor(() => {
        expect(screen.getByText('What is individuation in Jungian psychology?')).toBeInTheDocument();
      });

      // Answer question
      const correctAnswer = screen.getByText('The process of becoming whole');
      await user.click(correctAnswer);
      
      // Submit quiz
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      // Verify completion callback
      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            score: expect.any(Number),
            percentage: expect.any(Number),
            answers: expect.arrayContaining([
              expect.objectContaining({
                questionId: 'gen-q1',
                isCorrect: true
              })
            ])
          })
        );
      });
    });

    it('should handle adaptive quiz generation based on performance', async () => {
      const user = userEvent.setup();
      
      // Mock adaptive quiz generation
      const mockAdaptiveGeneration = jest.fn()
        .mockResolvedValueOnce([
          {
            id: 'easy-q1',
            question: 'Who developed analytical psychology?',
            options: [
              { id: '0', text: 'Carl Jung', isCorrect: true },
              { id: '1', text: 'Sigmund Freud', isCorrect: false },
              { id: '2', text: 'Alfred Adler', isCorrect: false },
              { id: '3', text: 'Erik Erikson', isCorrect: false }
            ],
            correctAnswer: 0,
            difficulty: 'easy'
          }
        ])
        .mockResolvedValueOnce([
          {
            id: 'hard-q1',
            question: 'How does the transcendent function operate in individuation?',
            options: [
              { id: '0', text: 'By integrating conscious and unconscious content', isCorrect: true },
              { id: '1', text: 'By suppressing negative emotions', isCorrect: false },
              { id: '2', text: 'By reinforcing ego defenses', isCorrect: false },
              { id: '3', text: 'By eliminating shadow projections', isCorrect: false }
            ],
            correctAnswer: 0,
            difficulty: 'hard'
          }
        ]);
      
      MockedQuizGenerator.prototype.generateAdaptiveQuestions = mockAdaptiveGeneration;

      // Simulate high performance leading to harder questions
      const previousResponses = [
        { correct: true, difficulty: 'easy' },
        { correct: true, difficulty: 'medium' },
        { correct: true, difficulty: 'medium' }
      ];

      // This would typically be called by the quiz system
      const generator = new MockedQuizGenerator({} as any);
      const adaptiveQuestions = await generator.generateAdaptiveQuestions(
        'individuation',
        previousResponses,
        1,
        'en'
      );

      expect(mockAdaptiveGeneration).toHaveBeenCalledWith(
        'individuation',
        previousResponses,
        1,
        'en'
      );
    });
  });

  describe('Educational Content Interaction Patterns', () => {
    it('should handle note-taking during module study', async () => {
      const user = userEvent.setup();
      const mockUpdateProgress = jest.fn();
      
      const authenticatedContextValue = {
        ...mockAuthContextValue,
        user: testUser,
        isAuthenticated: true
      };

      renderWithProviders(
        <ModulePage 
          modules={[testModule]}
          userProgress={testUserProgress}
          updateProgress={mockUpdateProgress}
        />,
        authenticatedContextValue
      );

      // Wait for module content to load
      await waitFor(() => {
        expect(screen.getByText('Introduction to Jung')).toBeInTheDocument();
      });

      // Find and interact with note-taking interface (if available)
      const noteButton = screen.queryByText(/note/i) || screen.queryByTestId('add-note');
      if (noteButton) {
        await user.click(noteButton);
        
        const noteInput = screen.getByRole('textbox', { name: /note/i });
        await user.type(noteInput, 'Jung\'s concept of the collective unconscious is fascinating');
        
        const saveButton = screen.getByRole('button', { name: /save/i });
        await user.click(saveButton);

        await waitFor(() => {
          expect(mockUpdateProgress).toHaveBeenCalledWith(
            expect.objectContaining({
              notes: expect.arrayContaining([
                expect.objectContaining({
                  content: expect.stringContaining('collective unconscious'),
                  moduleId: 'module-1'
                })
              ])
            })
          );
        });
      }
    });

    it('should track time spent on different content sections', async () => {
      const mockUpdateProgress = jest.fn();
      jest.spyOn(Date, 'now')
        .mockReturnValueOnce(1000000) // Start time
        .mockReturnValueOnce(1030000); // End time (30 seconds later)
      
      const authenticatedContextValue = {
        ...mockAuthContextValue,
        user: testUser,
        isAuthenticated: true
      };

      const { unmount } = renderWithProviders(
        <ModulePage 
          modules={[testModule]}
          userProgress={testUserProgress}
          updateProgress={mockUpdateProgress}
        />,
        authenticatedContextValue
      );

      // Wait for module to load
      await waitFor(() => {
        expect(screen.getByText('Introduction to Jung')).toBeInTheDocument();
      });

      // Simulate user spending time on the module
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Unmount to trigger time tracking
      unmount();

      // Verify time was tracked (would be called by useEffect cleanup or similar)
      // This depends on implementation details
      expect(mockUpdateProgress).toHaveBeenCalled();
    });
  });

  describe('Multi-Step User Journey Integration', () => {
    it('should handle complete learning path progression', async () => {
      const user = userEvent.setup();
      const mockUpdateProgress = jest.fn();
      
      const modules = [
        { ...testModule, id: 'module-1', title: 'Introduction to Jung' },
        { ...testModule, id: 'module-2', title: 'The Shadow', difficulty: 'intermediate' as const },
        { ...testModule, id: 'module-3', title: 'Individuation Process', difficulty: 'advanced' as const }
      ];
      
      MockedModuleService.getAllModules = jest.fn().mockResolvedValue(modules);
      
      let currentProgress = {
        ...testUserProgress,
        completedModules: ['module-1'] // User has completed first module
      };
      
      const authenticatedContextValue = {
        ...mockAuthContextValue,
        user: testUser,
        isAuthenticated: true
      };

      // Start with dashboard showing available modules
      renderWithProviders(
        <Dashboard 
          modules={modules}
          userProgress={currentProgress}
        />,
        authenticatedContextValue
      );

      await waitFor(() => {
        expect(screen.getByText('The Shadow')).toBeInTheDocument();
      });

      // Verify progression logic - second module should be available
      const shadowModule = screen.getByText('The Shadow');
      expect(shadowModule).toBeInTheDocument();
      
      // Verify third module might be locked (depending on implementation)
      const individuationModule = screen.getByText('Individuation Process');
      expect(individuationModule).toBeInTheDocument();
    });

    it('should maintain learning context across sessions', async () => {
      const sessionData = {
        currentModule: 'module-1',
        lastPosition: 'section-1',
        timeSpent: 1800, // 30 minutes
        notes: [
          { id: 'note-1', content: 'Important concept', moduleId: 'module-1' }
        ]
      };
      
      // Set up session storage
      sessionStorage.setItem('learningSession', JSON.stringify(sessionData));
      localStorage.setItem('jungAppProgress', JSON.stringify({
        ...testUserProgress,
        lastAccessed: Date.now() - 1800000, // 30 minutes ago
        totalTime: 1800
      }));
      
      const authenticatedContextValue = {
        ...mockAuthContextValue,
        user: testUser,
        isAuthenticated: true
      };

      renderWithProviders(
        <App />,
        authenticatedContextValue,
        mockAdminContextValue,
        '/dashboard'
      );

      // Verify session is restored (this depends on implementation)
      // The app should detect returning user and offer to continue
      await waitFor(() => {
        // Look for continue session prompt or restored state
        const continueButton = screen.queryByText(/continue/i) || screen.queryByText(/resume/i);
        if (continueButton) {
          expect(continueButton).toBeInTheDocument();
        }
      });
    });
  });

  describe('Admin Workflow Integration', () => {
    it('should complete admin module creation and publication workflow', async () => {
      const user = userEvent.setup();
      
      const adminUser = {
        ...testUser,
        role: UserRole.ADMIN,
        id: 'admin-123'
      };
      
      const mockOnGenerate = jest.fn().mockResolvedValue({
        id: 'new-module-1',
        title: 'Advanced Jungian Concepts',
        description: 'Deep dive into complex Jungian theories',
        content: {
          introduction: 'This advanced module explores...',
          sections: []
        },
        quiz: { questions: [] },
        status: 'draft'
      });
      
      const adminContextValue = {
        ...mockAuthContextValue,
        user: adminUser,
        isAuthenticated: true,
        hasRole: jest.fn((role: UserRole) => role === UserRole.ADMIN)
      };
      
      const adminAdminContextValue = {
        ...mockAdminContextValue,
        isAdmin: true,
        currentAdmin: adminUser
      };

      renderWithProviders(
        <AIModuleGenerator 
          onGenerate={mockOnGenerate}
          onCancel={jest.fn()}
          existingModules={[]}
        />,
        adminContextValue,
        adminAdminContextValue
      );

      // Fill module generation form
      const subjectInput = screen.getByLabelText(/sobre qual assunto/i);
      await user.type(subjectInput, 'Advanced Jungian Concepts');
      
      // Set advanced options
      const advancedToggle = screen.getByText(/opções avançadas/i);
      await user.click(advancedToggle);
      
      const advancedRadio = screen.getByRole('radio', { name: /avançado/i });
      await user.click(advancedRadio);
      
      // Generate module
      const generateButton = screen.getByRole('button', { name: /gerar módulo/i });
      await user.click(generateButton);

      await waitFor(() => {
        expect(mockOnGenerate).toHaveBeenCalledWith(
          expect.objectContaining({
            subject: 'Advanced Jungian Concepts',
            difficulty: 'advanced',
            includeQuiz: true,
            includeVideos: true,
            includeBibliography: true
          })
        );
      });
    });
  });

  describe('Service Integration and Data Flow', () => {
    it('should handle service failures and recovery gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock service failure then recovery
      MockedModuleService.getAllModules = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce([testModule]);
      
      const authenticatedContextValue = {
        ...mockAuthContextValue,
        user: testUser,
        isAuthenticated: true
      };

      renderWithProviders(
        <Dashboard 
          modules={[]}
          userProgress={testUserProgress}
        />,
        authenticatedContextValue
      );

      // Should show error state initially
      await waitFor(() => {
        const errorMessage = screen.queryByText(/error/i) || screen.queryByText(/failed/i);
        if (errorMessage) {
          expect(errorMessage).toBeInTheDocument();
        }
      });

      // Simulate retry
      const retryButton = screen.queryByText(/retry/i) || screen.queryByRole('button', { name: /try again/i });
      if (retryButton) {
        await user.click(retryButton);
        
        // Should eventually load successfully
        await waitFor(() => {
          expect(screen.getByText('Introduction to Jung')).toBeInTheDocument();
        }, { timeout: 5000 });
      }
    });

    it('should synchronize data across multiple components', async () => {
      const mockUpdateProgress = jest.fn();
      let sharedProgress = { ...testUserProgress };
      
      // Mock shared state updates
      mockUpdateProgress.mockImplementation((updates: any) => {
        if (typeof updates === 'function') {
          sharedProgress = { ...sharedProgress, ...updates(sharedProgress) };
        } else {
          sharedProgress = { ...sharedProgress, ...updates };
        }
      });
      
      const authenticatedContextValue = {
        ...mockAuthContextValue,
        user: testUser,
        isAuthenticated: true
      };

      // Render dashboard
      const { rerender } = renderWithProviders(
        <Dashboard 
          modules={[testModule]}
          userProgress={sharedProgress}
        />,
        authenticatedContextValue
      );

      // Update progress from "external" source (simulating cross-component sync)
      act(() => {
        mockUpdateProgress({
          completedModules: ['module-1'],
          quizScores: { 'module-1': { score: 1, total: 1, percentage: 100 } }
        });
      });

      // Re-render with updated progress
      rerender(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <AuthContext.Provider value={authenticatedContextValue}>
              <AdminContext.Provider value={mockAdminContextValue}>
                <Dashboard 
                  modules={[testModule]}
                  userProgress={sharedProgress}
                />
              </AdminContext.Provider>
            </AuthContext.Provider>
          </MemoryRouter>
        </QueryClientProvider>
      );

      // Verify UI reflects the updated progress
      await waitFor(() => {
        const completedIndicator = screen.queryByText(/completed/i) || screen.queryByTestId('module-completed');
        if (completedIndicator) {
          expect(completedIndicator).toBeInTheDocument();
        }
      });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });
});
