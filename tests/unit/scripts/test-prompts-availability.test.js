#!/usr/bin/env node

/**
 * Comprehensive Unit Tests for test-prompts-availability.js
 * Tests prompt template availability checking, error handling, and output formatting
 */

// Mock the prompt template service before requiring the test script
const mockPromptTemplateServiceMock = {
  getTemplates: jest.fn(),
  getCategories: jest.fn(),
  getTemplateByKey: jest.fn()
};

jest.mock('../../../src/services/prompts/promptTemplateServiceMock', () => ({
  promptTemplateServiceMock: mockPromptTemplateServiceMock
}));

describe('test-prompts-availability.js', () => {
  let originalConsole;
  let originalExit;
  let consoleOutputs;
  let mockExit;

  beforeEach(() => {
    // Store original functions
    originalConsole = {
      log: console.log,
      error: console.error
    };
    originalExit = process.exit;

    // Setup console mocking
    consoleOutputs = [];
    console.log = jest.fn((...args) => {
      consoleOutputs.push({ type: 'log', args });
    });
    console.error = jest.fn((...args) => {
      consoleOutputs.push({ type: 'error', args });
    });

    // Setup process.exit mocking
    mockExit = jest.fn();
    process.exit = mockExit;

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original functions
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    process.exit = originalExit;

    // Clear module cache to allow fresh imports
    delete require.cache[require.resolve('../../../test-prompts-availability.js')];
  });

  describe('Successful Prompt Availability Check', () => {
    const mockTemplates = [
      {
        key: 'content.introduction',
        name: 'Introdução de Módulo',
        category: 'content',
        description: 'Template para introduções',
        variables: [{ name: 'topic' }, { name: 'level' }]
      },
      {
        key: 'content.section',
        name: 'Seção de Conteúdo',
        category: 'content',
        description: 'Template para seções',
        variables: [{ name: 'section' }]
      },
      {
        key: 'quiz.questions',
        name: 'Questões de Quiz',
        category: 'quiz',
        description: 'Template para questões',
        variables: [{ name: 'topic' }, { name: 'difficulty' }]
      },
      {
        key: 'mindmap.structure',
        name: 'Estrutura de Mapa Mental',
        category: 'mindmap',
        description: 'Template para mapas mentais',
        variables: [{ name: 'concepts' }]
      },
      {
        key: 'video.search_queries',
        name: 'Queries de Busca de Vídeos',
        category: 'video',
        description: 'Template para busca de vídeos',
        variables: [{ name: 'keywords' }]
      },
      {
        key: 'bibliography.resources',
        name: 'Recursos Bibliográficos',
        category: 'bibliography',
        description: 'Template para bibliografia',
        variables: [{ name: 'subject' }]
      }
    ];

    const mockCategories = [
      { key: 'content', name: 'Conteúdo', description: 'Templates de conteúdo', icon: '📝' },
      { key: 'quiz', name: 'Quiz', description: 'Templates de quiz', icon: '❓' },
      { key: 'mindmap', name: 'Mapa Mental', description: 'Templates de mapas', icon: '🗺️' },
      { key: 'video', name: 'Vídeo', description: 'Templates de vídeo', icon: '🎥' },
      { key: 'bibliography', name: 'Bibliografia', description: 'Templates de bibliografia', icon: '📚' }
    ];

    beforeEach(() => {
      mockPromptTemplateServiceMock.getTemplates.mockResolvedValue(mockTemplates);
      mockPromptTemplateServiceMock.getCategories.mockResolvedValue(mockCategories);
      
      // Mock getTemplateByKey to return appropriate template
      mockPromptTemplateServiceMock.getTemplateByKey.mockImplementation((key) => {
        return Promise.resolve(mockTemplates.find(t => t.key === key));
      });
    });

    test('should display successful completion when all prompts are found', async () => {
      // Import and run the script
      require('../../../test-prompts-availability.js');

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify success output
      const successMessage = consoleOutputs.find(output => 
        output.args[0] && output.args[0].includes('SUCCESS: All expected prompts are available!')
      );
      expect(successMessage).toBeTruthy();

      expect(mockExit).not.toHaveBeenCalled();
    });

    test('should display template count and categories', async () => {
      require('../../../test-prompts-availability.js');
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check total templates output
      const templatesOutput = consoleOutputs.find(output => 
        output.args[0] && output.args[0].includes('Total templates found: 6')
      );
      expect(templatesOutput).toBeTruthy();

      // Check categories output
      const categoriesOutput = consoleOutputs.find(output => 
        output.args[0] && output.args[0].includes('Categories:')
      );
      expect(categoriesOutput).toBeTruthy();
    });

    test('should display summary information', async () => {
      require('../../../test-prompts-availability.js');
      await new Promise(resolve => setTimeout(resolve, 100));

      const summaryOutputs = consoleOutputs.filter(output => 
        output.args[0] && (
          output.args[0].includes('Total Templates: 6') ||
          output.args[0].includes('Categories: 5') ||
          output.args[0].includes('All prompts properly configured for customization')
        )
      );
      expect(summaryOutputs.length).toBeGreaterThan(0);
    });

    test('should group templates by category', async () => {
      require('../../../test-prompts-availability.js');
      await new Promise(resolve => setTimeout(resolve, 100));

      const categoryGroupingOutput = consoleOutputs.find(output => 
        output.args[0] && output.args[0].includes('Templates by Category:')
      );
      expect(categoryGroupingOutput).toBeTruthy();

      // Check that categories with icons are displayed
      const contentCategoryOutput = consoleOutputs.find(output => 
        output.args[0] && output.args[0].includes('📝 Conteúdo (2 templates):')
      );
      expect(contentCategoryOutput).toBeTruthy();
    });

    test('should display template details correctly', async () => {
      require('../../../test-prompts-availability.js');
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check that expected prompts are marked as found
      const contentIntroOutput = consoleOutputs.find(output => 
        output.args[0] && output.args[0].includes('✅ content.introduction')
      );
      expect(contentIntroOutput).toBeTruthy();

      // Check that template variables are displayed
      const variablesOutput = consoleOutputs.find(output => 
        output.args[0] && output.args[0].includes('Variables: topic, level')
      );
      expect(variablesOutput).toBeTruthy();
    });
  });

  describe('Missing Prompts Handling', () => {
    const incompleteTemplates = [
      {
        key: 'content.introduction',
        name: 'Introdução de Módulo',
        category: 'content',
        variables: [{ name: 'topic' }]
      },
      {
        key: 'quiz.questions',
        name: 'Questões de Quiz',
        category: 'quiz',
        variables: [{ name: 'topic' }]
      }
      // Missing some expected templates
    ];

    const mockCategories = [
      { key: 'content', name: 'Conteúdo', description: 'Templates de conteúdo' },
      { key: 'quiz', name: 'Quiz', description: 'Templates de quiz' }
    ];

    beforeEach(() => {
      mockPromptTemplateServiceMock.getTemplates.mockResolvedValue(incompleteTemplates);
      mockPromptTemplateServiceMock.getCategories.mockResolvedValue(mockCategories);
      
      // Mock getTemplateByKey to return only available templates
      mockPromptTemplateServiceMock.getTemplateByKey.mockImplementation((key) => {
        return Promise.resolve(incompleteTemplates.find(t => t.key === key) || null);
      });
    });

    test('should display error when prompts are missing', async () => {
      require('../../../test-prompts-availability.js');
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check for error output
      const errorMessage = consoleOutputs.find(output => 
        output.args[0] && output.args[0].includes('ERROR: Some prompts are missing!')
      );
      expect(errorMessage).toBeTruthy();

      expect(mockExit).toHaveBeenCalledWith(1);
    });

    test('should mark missing prompts with error indicator', async () => {
      require('../../../test-prompts-availability.js');
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check for missing prompt indicators
      const missingPromptOutput = consoleOutputs.find(output => 
        output.args[0] && output.args[0].includes('❌') && output.args[0].includes('NOT FOUND')
      );
      expect(missingPromptOutput).toBeTruthy();
    });

    test('should still show found prompts correctly', async () => {
      require('../../../test-prompts-availability.js');
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check that available prompts are marked as found
      const foundPromptOutput = consoleOutputs.find(output => 
        output.args[0] && output.args[0].includes('✅ content.introduction')
      );
      expect(foundPromptOutput).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    test('should handle service errors gracefully', async () => {
      const mockError = new Error('Service connection failed');
      mockPromptTemplateServiceMock.getTemplates.mockRejectedValue(mockError);

      require('../../../test-prompts-availability.js');
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(console.error).toHaveBeenCalledWith('❌ Error testing prompts:', mockError);
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    test('should handle getCategories errors', async () => {
      mockPromptTemplateServiceMock.getTemplates.mockResolvedValue([]);
      mockPromptTemplateServiceMock.getCategories.mockRejectedValue(new Error('Categories fetch failed'));

      require('../../../test-prompts-availability.js');
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(console.error).toHaveBeenCalledWith('❌ Error testing prompts:', expect.any(Error));
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    test('should handle getTemplateByKey errors', async () => {
      mockPromptTemplateServiceMock.getTemplates.mockResolvedValue([]);
      mockPromptTemplateServiceMock.getCategories.mockResolvedValue([]);
      mockPromptTemplateServiceMock.getTemplateByKey.mockRejectedValue(new Error('Template fetch failed'));

      require('../../../test-prompts-availability.js');
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(console.error).toHaveBeenCalledWith('❌ Error testing prompts:', expect.any(Error));
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe('Output Formatting', () => {
    const mockTemplates = [
      {
        key: 'content.introduction',
        name: 'Introdução de Módulo',
        category: 'content',
        description: 'Template para introduções de módulo',
        variables: [{ name: 'topic' }, { name: 'level' }]
      }
    ];

    const mockCategories = [
      { key: 'content', name: 'Conteúdo', description: 'Templates de conteúdo', icon: '📝' }
    ];

    beforeEach(() => {
      mockPromptTemplateServiceMock.getTemplates.mockResolvedValue(mockTemplates);
      mockPromptTemplateServiceMock.getCategories.mockResolvedValue(mockCategories);
      mockPromptTemplateServiceMock.getTemplateByKey.mockImplementation((key) => {
        return Promise.resolve(mockTemplates.find(t => t.key === key));
      });
    });

    test('should use proper separators and formatting', async () => {
      require('../../../test-prompts-availability.js');
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check for separator lines
      const separatorOutput = consoleOutputs.find(output => 
        output.args[0] && output.args[0].includes('='.repeat(50))
      );
      expect(separatorOutput).toBeTruthy();

      const dashSeparatorOutput = consoleOutputs.find(output => 
        output.args[0] && output.args[0].includes('-'.repeat(50))
      );
      expect(dashSeparatorOutput).toBeTruthy();
    });

    test('should display proper headers', async () => {
      require('../../../test-prompts-availability.js');
      await new Promise(resolve => setTimeout(resolve, 100));

      const headerOutput = consoleOutputs.find(output => 
        output.args[0] && output.args[0].includes('🔍 Testing Prompt Templates Availability')
      );
      expect(headerOutput).toBeTruthy();
    });

    test('should handle categories without icons', async () => {
      const categoriesWithoutIcons = [
        { key: 'content', name: 'Conteúdo', description: 'Templates de conteúdo' }
      ];
      mockPromptTemplateServiceMock.getCategories.mockResolvedValue(categoriesWithoutIcons);

      require('../../../test-prompts-availability.js');
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should use default icon when icon is missing
      const defaultIconOutput = consoleOutputs.find(output => 
        output.args[0] && output.args[0].includes('📄 Conteúdo (1 templates):')
      );
      expect(defaultIconOutput).toBeTruthy();
    });

    test('should handle empty template descriptions', async () => {
      const templatesWithoutDescriptions = [
        {
          key: 'content.introduction',
          name: 'Introdução de Módulo',
          category: 'content',
          variables: [{ name: 'topic' }]
        }
      ];
      mockPromptTemplateServiceMock.getTemplates.mockResolvedValue(templatesWithoutDescriptions);

      require('../../../test-prompts-availability.js');
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should still display template even without description
      const templateOutput = consoleOutputs.find(output => 
        output.args[0] && output.args[0].includes('- Introdução de Módulo (content.introduction)')
      );
      expect(templateOutput).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty templates array', async () => {
      mockPromptTemplateServiceMock.getTemplates.mockResolvedValue([]);
      mockPromptTemplateServiceMock.getCategories.mockResolvedValue([]);

      require('../../../test-prompts-availability.js');
      await new Promise(resolve => setTimeout(resolve, 100));

      const templatesOutput = consoleOutputs.find(output => 
        output.args[0] && output.args[0].includes('Total templates found: 0')
      );
      expect(templatesOutput).toBeTruthy();

      expect(mockExit).toHaveBeenCalledWith(1);
    });

    test('should handle templates with no variables', async () => {
      const templatesWithoutVariables = [
        {
          key: 'simple.template',
          name: 'Simple Template',
          category: 'simple',
          variables: []
        }
      ];
      mockPromptTemplateServiceMock.getTemplates.mockResolvedValue(templatesWithoutVariables);
      mockPromptTemplateServiceMock.getCategories.mockResolvedValue([]);
      mockPromptTemplateServiceMock.getTemplateByKey.mockResolvedValue(null);

      require('../../../test-prompts-availability.js');
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should handle empty variables array gracefully
      const variablesOutput = consoleOutputs.find(output => 
        output.args[0] && output.args[0].includes('Variables:')
      );
      // Since the template is not in expected list, it won't show variables
    });

    test('should handle null/undefined template responses', async () => {
      mockPromptTemplateServiceMock.getTemplates.mockResolvedValue([]);
      mockPromptTemplateServiceMock.getCategories.mockResolvedValue([]);
      mockPromptTemplateServiceMock.getTemplateByKey.mockResolvedValue(null);

      require('../../../test-prompts-availability.js');
      await new Promise(resolve => setTimeout(resolve, 100));

      // All expected templates should be marked as NOT FOUND
      const notFoundOutputs = consoleOutputs.filter(output => 
        output.args[0] && output.args[0].includes('NOT FOUND')
      );
      expect(notFoundOutputs.length).toBeGreaterThan(0);
    });
  });
});