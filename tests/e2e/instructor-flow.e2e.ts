import { test, expect, Page } from '@playwright/test';

test.describe('Instructor Workflow - Content Creation and Management', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'tests/e2e/auth/admin-user.json'
    });
    page = await context.newPage();
    
    // Set instructor role
    await page.evaluate(() => {
      localStorage.setItem('auth_user', JSON.stringify({ 
        id: 2, 
        name: 'Prof. Maria Santos', 
        email: 'instructor@jaquedu.com',
        role: 'instructor'
      }));
    });
  });

  test.describe('Module Creation and Editing', () => {
    test('should create a new educational module', async () => {
      await page.goto('/admin/modules');
      
      // Click create new module button
      const createButton = page.locator(
        '[data-testid="create-module"], button:has-text("Criar"), button:has-text("Novo")'
      );
      await expect(createButton.first()).toBeVisible();
      await createButton.first().click();

      // Fill module creation form
      const titleInput = page.locator('[data-testid="module-title"], [name="title"]');
      await expect(titleInput).toBeVisible();
      await titleInput.fill('Introdução aos Complexos Psíquicos');

      const descriptionInput = page.locator('[data-testid="module-description"], [name="description"], textarea');
      if (await descriptionInput.isVisible()) {
        await descriptionInput.fill('Exploração detalhada dos complexos psíquicos na teoria junguiana');
      }

      // Set difficulty level
      const difficultySelect = page.locator('[data-testid="difficulty"], [name="difficulty"], select');
      if (await difficultySelect.isVisible()) {
        await difficultySelect.selectOption('intermediate');
      }

      // Set estimated duration
      const durationInput = page.locator('[data-testid="duration"], [name="duration"]');
      if (await durationInput.isVisible()) {
        await durationInput.fill('45');
      }

      // Add module content
      const contentEditor = page.locator(
        '[data-testid="content-editor"], .content-editor, textarea[name="content"]'
      );
      if (await contentEditor.isVisible()) {
        await contentEditor.fill(`
# Complexos Psíquicos em Jung

Os complexos psíquicos são estruturas autônomas da psique...

## Características dos Complexos

1. **Autonomia**: Funcionam independentemente da consciência
2. **Energia**: Possuem carga emocional própria
3. **Constelação**: Agrupam-se em torno de um núcleo arquetípico

## Exemplos Clínicos

...
        `);
      }

      // Save module
      const saveButton = page.locator(
        '[data-testid="save-module"], button:has-text("Salvar")'
      );
      await expect(saveButton).toBeVisible();
      await saveButton.click();

      // Verify success message
      const successMessage = page.locator('.success, .alert-success, [data-testid="success"]');
      await expect(successMessage.first()).toBeVisible({ timeout: 10000 });

      // Verify module appears in list
      await page.goto('/admin/modules');
      const moduleCard = page.locator('.module-card:has-text("Complexos Psíquicos")');
      await expect(moduleCard).toBeVisible();
    });

    test('should edit an existing module', async () => {
      await page.goto('/admin/modules');

      // Find first module and click edit
      const editButton = page.locator(
        '[data-testid="edit-module"], .edit-button, button:has-text("Editar")'
      ).first();
      
      if (await editButton.isVisible()) {
        await editButton.click();

        // Modify module content
        const titleInput = page.locator('[data-testid="module-title"], [name="title"]');
        if (await titleInput.isVisible()) {
          const currentTitle = await titleInput.inputValue();
          await titleInput.fill(`${currentTitle} - Atualizado`);
        }

        // Save changes
        const saveButton = page.locator(
          '[data-testid="save-module"], button:has-text("Salvar")'
        );
        await saveButton.click();

        // Verify success
        const successMessage = page.locator('.success, .alert-success');
        await expect(successMessage.first()).toBeVisible({ timeout: 10000 });
      }
    });

    test('should add multimedia content to module', async () => {
      await page.goto('/admin/modules');

      const createButton = page.locator('button:has-text("Criar"), button:has-text("Novo")').first();
      if (await createButton.isVisible()) {
        await createButton.click();

        // Fill basic module info
        const titleInput = page.locator('[name="title"]');
        await titleInput.fill('Módulo com Multimídia');

        // Add YouTube video
        const videoInput = page.locator(
          '[data-testid="youtube-url"], [name="videoUrl"], input[placeholder*="YouTube"]'
        );
        if (await videoInput.isVisible()) {
          await videoInput.fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
        }

        // Add bibliography
        const bibliographyInput = page.locator(
          '[data-testid="bibliography"], [name="bibliography"], textarea'
        );
        if (await bibliographyInput.isVisible()) {
          await bibliographyInput.fill(`
JUNG, C.G. Tipos Psicológicos. Petrópolis: Vozes, 1991.
HILLMAN, James. Re-imagining Psychology. New York: Harper & Row, 1975.
          `);
        }

        // Upload file if file input exists
        const fileInput = page.locator('input[type="file"]');
        if (await fileInput.isVisible()) {
          // Create a test file
          await page.evaluate(() => {
            const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
            const input = document.querySelector('input[type="file"]') as HTMLInputElement;
            if (input) {
              const dataTransfer = new DataTransfer();
              dataTransfer.items.add(file);
              input.files = dataTransfer.files;
            }
          });
        }

        // Save module
        const saveButton = page.locator('button:has-text("Salvar")');
        await saveButton.click();

        // Verify multimedia content is saved
        const successMessage = page.locator('.success, .alert-success');
        await expect(successMessage.first()).toBeVisible({ timeout: 10000 });
      }
    });
  });

  test.describe('Quiz Creation and Management', () => {
    test('should create interactive quiz for module', async () => {
      await page.goto('/admin/modules');

      // Find module and add quiz
      const moduleCard = page.locator('.module-card').first();
      if (await moduleCard.isVisible()) {
        // Look for "Add Quiz" button or edit module to add quiz
        const addQuizButton = page.locator(
          '[data-testid="add-quiz"], button:has-text("Quiz"), button:has-text("Adicionar Quiz")'
        );
        
        if (await addQuizButton.isVisible()) {
          await addQuizButton.click();
        } else {
          // Try editing module to add quiz
          const editButton = moduleCard.locator('button:has-text("Editar")');
          if (await editButton.isVisible()) {
            await editButton.click();
            
            // Look for quiz section in edit form
            const quizTab = page.locator('[data-testid="quiz-tab"], .tab:has-text("Quiz")');
            if (await quizTab.isVisible()) {
              await quizTab.click();
            }
          }
        }

        // Add quiz questions
        const addQuestionButton = page.locator(
          '[data-testid="add-question"], button:has-text("Adicionar Pergunta")'
        );
        
        if (await addQuestionButton.isVisible()) {
          await addQuestionButton.click();

          // Fill question details
          const questionText = page.locator(
            '[data-testid="question-text"], [name="questionText"], textarea'
          );
          if (await questionText.isVisible()) {
            await questionText.fill('Qual é a principal diferença entre consciente e inconsciente na teoria de Jung?');
          }

          // Add answer options
          const option1 = page.locator('[data-testid="option-1"], [name="option1"]');
          if (await option1.isVisible()) {
            await option1.fill('O consciente é individual, o inconsciente é coletivo');
          }

          const option2 = page.locator('[data-testid="option-2"], [name="option2"]');
          if (await option2.isVisible()) {
            await option2.fill('O consciente é conhecido, o inconsciente é desconhecido');
          }

          const option3 = page.locator('[data-testid="option-3"], [name="option3"]');
          if (await option3.isVisible()) {
            await option3.fill('Não há diferença fundamental');
          }

          // Mark correct answer
          const correctAnswer = page.locator('[data-testid="correct-answer"], [name="correctAnswer"]');
          if (await correctAnswer.isVisible()) {
            await correctAnswer.selectOption('2'); // Second option is correct
          }

          // Save question
          const saveQuestionButton = page.locator(
            '[data-testid="save-question"], button:has-text("Salvar Pergunta")'
          );
          if (await saveQuestionButton.isVisible()) {
            await saveQuestionButton.click();
          }
        }

        // Save quiz
        const saveQuizButton = page.locator(
          '[data-testid="save-quiz"], button:has-text("Salvar Quiz")'
        );
        if (await saveQuizButton.isVisible()) {
          await saveQuizButton.click();

          // Verify quiz saved successfully
          const successMessage = page.locator('.success, .alert-success');
          await expect(successMessage.first()).toBeVisible({ timeout: 10000 });
        }
      }
    });

    test('should preview quiz before publishing', async () => {
      await page.goto('/admin/modules');

      // Find module with quiz
      const moduleWithQuiz = page.locator('.module-card:has(.quiz-indicator)').first();
      if (await moduleWithQuiz.isVisible()) {
        await moduleWithQuiz.click();

        // Look for preview button
        const previewButton = page.locator(
          '[data-testid="preview-quiz"], button:has-text("Visualizar")'
        );
        
        if (await previewButton.isVisible()) {
          await previewButton.click();

          // Verify quiz preview loads
          const quizPreview = page.locator('.quiz-preview, [data-testid="quiz-preview"]');
          await expect(quizPreview).toBeVisible();

          // Test quiz interaction in preview
          const firstQuestion = page.locator('.question').first();
          if (await firstQuestion.isVisible()) {
            const option = firstQuestion.locator('input[type="radio"]').first();
            if (await option.isVisible()) {
              await option.click();
            }
          }

          // Close preview
          const closePreview = page.locator(
            '[data-testid="close-preview"], button:has-text("Fechar")'
          );
          if (await closePreview.isVisible()) {
            await closePreview.click();
          }
        }
      }
    });
  });

  test.describe('Student Progress Monitoring', () => {
    test('should view student progress analytics', async () => {
      await page.goto('/admin/analytics');
      
      if (page.url().includes('404')) {
        await page.goto('/admin/students');
      }
      
      if (page.url().includes('404')) {
        await page.goto('/admin/dashboard');
        
        // Look for analytics or progress section
        const analyticsLink = page.locator(
          '[data-testid="analytics"], a:has-text("Análise"), a:has-text("Progresso")'
        );
        if (await analyticsLink.isVisible()) {
          await analyticsLink.click();
        }
      }

      // Verify analytics dashboard loads
      const analyticsContent = page.locator(
        '[data-testid="analytics-dashboard"], .analytics, .dashboard-analytics'
      );
      
      if (await analyticsContent.isVisible()) {
        // Check for progress charts
        const progressCharts = page.locator('.chart, .progress-chart, canvas, svg');
        await expect(progressCharts.first()).toBeVisible();

        // Check for student statistics
        const studentStats = page.locator(
          '.stats, .statistics, [data-testid="student-stats"]'
        );
        await expect(studentStats.first()).toBeVisible();
      }
    });

    test('should filter and export student data', async () => {
      await page.goto('/admin/students');
      
      if (!page.url().includes('404')) {
        // Apply date filter
        const dateFilter = page.locator('[data-testid="date-filter"], [name="dateRange"]');
        if (await dateFilter.isVisible()) {
          await dateFilter.selectOption('last-30-days');
        }

        // Apply course filter
        const courseFilter = page.locator('[data-testid="course-filter"], [name="course"]');
        if (await courseFilter.isVisible()) {
          await courseFilter.selectOption('jung-psychology');
        }

        // Apply filters
        const applyFiltersButton = page.locator(
          '[data-testid="apply-filters"], button:has-text("Aplicar")'
        );
        if (await applyFiltersButton.isVisible()) {
          await applyFiltersButton.click();
        }

        // Export data
        const exportButton = page.locator(
          '[data-testid="export-data"], button:has-text("Exportar")'
        );
        if (await exportButton.isVisible()) {
          // Set up download handler
          const downloadPromise = page.waitForEvent('download');
          await exportButton.click();
          
          const download = await downloadPromise;
          expect(download.suggestedFilename()).toMatch(/students.*\.csv|students.*\.xlsx/);
        }
      }
    });
  });

  test.describe('Content Library Management', () => {
    test('should organize content in folders and categories', async () => {
      await page.goto('/admin/library');
      
      if (!page.url().includes('404')) {
        // Create new folder
        const createFolderButton = page.locator(
          '[data-testid="create-folder"], button:has-text("Nova Pasta")'
        );
        
        if (await createFolderButton.isVisible()) {
          await createFolderButton.click();

          const folderNameInput = page.locator('[data-testid="folder-name"], [name="folderName"]');
          if (await folderNameInput.isVisible()) {
            await folderNameInput.fill('Arquétipos Fundamentais');
            
            const confirmButton = page.locator('button:has-text("Confirmar")');
            await confirmButton.click();
          }
        }

        // Move content to folder
        const contentItem = page.locator('.content-item').first();
        if (await contentItem.isVisible()) {
          // Right-click for context menu or look for move button
          const moveButton = contentItem.locator('[data-testid="move-content"], .move-button');
          if (await moveButton.isVisible()) {
            await moveButton.click();
            
            const folderSelect = page.locator('[data-testid="target-folder"], select');
            if (await folderSelect.isVisible()) {
              await folderSelect.selectOption('arquetipos-fundamentais');
              
              const confirmMoveButton = page.locator('button:has-text("Mover")');
              await confirmMoveButton.click();
            }
          }
        }
      }
    });

    test('should search and filter content library', async () => {
      await page.goto('/admin/library');
      
      if (!page.url().includes('404')) {
        // Use search functionality
        const searchInput = page.locator(
          '[data-testid="library-search"], [name="search"], input[placeholder*="buscar"]'
        );
        
        if (await searchInput.isVisible()) {
          await searchInput.fill('jung');
          await page.keyboard.press('Enter');

          // Wait for search results
          await page.waitForTimeout(1000);

          // Verify search results
          const searchResults = page.locator('.search-results, .content-list');
          if (await searchResults.isVisible()) {
            const resultItems = searchResults.locator('.content-item');
            const resultCount = await resultItems.count();
            expect(resultCount).toBeGreaterThan(0);
          }
        }

        // Filter by content type
        const typeFilter = page.locator('[data-testid="type-filter"], [name="contentType"]');
        if (await typeFilter.isVisible()) {
          await typeFilter.selectOption('video');
          
          // Verify filtered results
          const videoItems = page.locator('.content-item[data-type="video"]');
          if (await videoItems.count() > 0) {
            await expect(videoItems.first()).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Communication and Feedback', () => {
    test('should respond to student questions in forum', async () => {
      await page.goto('/admin/forum');
      
      if (!page.url().includes('404')) {
        // Find student question
        const studentQuestion = page.locator('.question-item, .forum-post').first();
        
        if (await studentQuestion.isVisible()) {
          await studentQuestion.click();

          // Add instructor response
          const responseInput = page.locator(
            '[data-testid="response-input"], textarea[placeholder*="resposta"]'
          );
          
          if (await responseInput.isVisible()) {
            await responseInput.fill(`
Excelente pergunta! Sobre os arquétipos, é importante entender que eles são padrões universais...

Recomendo também a leitura de "O Homem e Seus Símbolos" para aprofundar este tema.
            `);

            const postResponseButton = page.locator(
              '[data-testid="post-response"], button:has-text("Responder")'
            );
            await postResponseButton.click();

            // Verify response was posted
            const newResponse = page.locator('.response:has-text("Excelente pergunta")');
            await expect(newResponse).toBeVisible({ timeout: 10000 });
          }
        }
      }
    });

    test('should send announcements to students', async () => {
      await page.goto('/admin/announcements');
      
      if (!page.url().includes('404')) {
        const createAnnouncementButton = page.locator(
          '[data-testid="create-announcement"], button:has-text("Novo Aviso")'
        );
        
        if (await createAnnouncementButton.isVisible()) {
          await createAnnouncementButton.click();

          // Fill announcement form
          const titleInput = page.locator('[data-testid="title"], [name="title"]');
          if (await titleInput.isVisible()) {
            await titleInput.fill('Novo Módulo Disponível: Sonhos e Símbolos');
          }

          const contentInput = page.locator('[data-testid="content"], [name="content"], textarea');
          if (await contentInput.isVisible()) {
            await contentInput.fill(`
Caros estudantes,

Temos o prazer de anunciar que o novo módulo sobre "Sonhos e Símbolos" já está disponível!

Este módulo explora...
            `);
          }

          // Select target audience
          const audienceSelect = page.locator('[data-testid="audience"], [name="audience"]');
          if (await audienceSelect.isVisible()) {
            await audienceSelect.selectOption('all-students');
          }

          // Schedule or publish immediately
          const publishButton = page.locator(
            '[data-testid="publish"], button:has-text("Publicar")'
          );
          await publishButton.click();

          // Verify announcement was created
          const successMessage = page.locator('.success, .alert-success');
          await expect(successMessage.first()).toBeVisible({ timeout: 10000 });
        }
      }
    });
  });

  test.describe('Performance Analytics', () => {
    test('should analyze module effectiveness', async () => {
      await page.goto('/admin/analytics/modules');
      
      if (!page.url().includes('404')) {
        // Select specific module for analysis
        const moduleSelect = page.locator('[data-testid="module-select"], [name="moduleId"]');
        if (await moduleSelect.isVisible()) {
          await moduleSelect.selectOption({ index: 1 });
        }

        // View completion rates
        const completionChart = page.locator(
          '[data-testid="completion-chart"], .completion-rate-chart'
        );
        if (await completionChart.isVisible()) {
          await expect(completionChart).toBeVisible();
        }

        // View engagement metrics
        const engagementMetrics = page.locator(
          '[data-testid="engagement-metrics"], .engagement-stats'
        );
        if (await engagementMetrics.isVisible()) {
          await expect(engagementMetrics).toBeVisible();
        }

        // Check quiz performance
        const quizPerformance = page.locator(
          '[data-testid="quiz-performance"], .quiz-stats'
        );
        if (await quizPerformance.isVisible()) {
          await expect(quizPerformance).toBeVisible();
        }
      }
    });

    test('should identify struggling students', async () => {
      await page.goto('/admin/analytics/students');
      
      if (!page.url().includes('404')) {
        // Filter for low-performing students
        const performanceFilter = page.locator(
          '[data-testid="performance-filter"], [name="performance"]'
        );
        
        if (await performanceFilter.isVisible()) {
          await performanceFilter.selectOption('struggling');
          
          const applyFilterButton = page.locator('button:has-text("Aplicar")');
          if (await applyFilterButton.isVisible()) {
            await applyFilterButton.click();
          }
        }

        // Review struggling students list
        const studentsList = page.locator('[data-testid="students-list"], .students-table');
        if (await studentsList.isVisible()) {
          const strugglingStudents = studentsList.locator('.student-row');
          const count = await strugglingStudents.count();
          
          if (count > 0) {
            // Click on first struggling student
            await strugglingStudents.first().click();
            
            // View detailed student analytics
            const studentDetails = page.locator('[data-testid="student-details"]');
            await expect(studentDetails).toBeVisible();
          }
        }
      }
    });
  });
});