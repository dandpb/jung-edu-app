import { promptTemplateServiceMock } from '../promptTemplateServiceMock';
import { PromptTemplate, PromptVariable } from '../promptTemplateService';

describe('PromptTemplateService', () => {
  describe('Mock Service Implementation', () => {
    it('should return default templates', async () => {
      const templates = await promptTemplateServiceMock.getTemplates();
      expect(templates).toBeDefined();
      expect(templates.length).toBeGreaterThan(0);
      expect(templates[0].key).toBe('content.introduction');
    });

    it('should get template by key', async () => {
      const template = await promptTemplateServiceMock.getTemplateByKey('content.introduction');
      expect(template).toBeDefined();
      expect(template?.key).toBe('content.introduction');
      expect(template?.category).toBe('content');
      expect(template?.variables.length).toBeGreaterThan(0);
    });

    it('should return null for non-existent template', async () => {
      const template = await promptTemplateServiceMock.getTemplateByKey('non.existent');
      expect(template).toBeNull();
    });

    it('should create a new template', async () => {
      const newTemplate = {
        key: 'test.template',
        category: 'test',
        name: 'Test Template',
        description: 'A test template',
        template: 'This is a test {{variable}}',
        variables: [
          { name: 'variable', type: 'text' as const, description: 'Test variable', required: true }
        ],
        language: 'pt-BR',
        isActive: true
      };

      const created = await promptTemplateServiceMock.createTemplate(newTemplate);
      expect(created).toBeDefined();
      expect(created.key).toBe('test.template');
      expect(created.id).toBeDefined();
      expect(created.version).toBe(1);

      // Verify it can be retrieved
      const retrieved = await promptTemplateServiceMock.getTemplateByKey('test.template');
      expect(retrieved).toBeDefined();
      expect(retrieved?.key).toBe('test.template');
    });

    it('should update an existing template', async () => {
      // First get a template
      const templates = await promptTemplateServiceMock.getTemplates();
      const template = templates[0];

      // Update it
      const updated = await promptTemplateServiceMock.updateTemplate(template.id, {
        template: 'Updated template content {{newVariable}}'
      });

      expect(updated).toBeDefined();
      expect(updated.template).toBe('Updated template content {{newVariable}}');
      expect(updated.version).toBe(template.version + 1);
    });

    it('should delete a template', async () => {
      // Create a template to delete
      const newTemplate = {
        key: 'delete.test',
        category: 'test',
        name: 'Delete Test',
        template: 'Will be deleted',
        variables: [],
        language: 'pt-BR',
        isActive: true
      };

      const created = await promptTemplateServiceMock.createTemplate(newTemplate);
      
      // Verify it exists
      let exists = await promptTemplateServiceMock.getTemplateByKey('delete.test');
      expect(exists).toBeDefined();

      // Delete it
      await promptTemplateServiceMock.deleteTemplate(created.id);

      // Verify it's gone
      exists = await promptTemplateServiceMock.getTemplateByKey('delete.test');
      expect(exists).toBeNull();
    });

    it('should return categories', async () => {
      const categories = await promptTemplateServiceMock.getCategories();
      expect(categories).toBeDefined();
      expect(categories.length).toBe(5);
      expect(categories[0].key).toBe('content');
      expect(categories[1].key).toBe('quiz');
      expect(categories[2].key).toBe('mindmap');
      expect(categories[3].key).toBe('video');
      expect(categories[4].key).toBe('bibliography');
    });

    it('should compile a prompt with variables', () => {
      const template = 'Hello {{name}}, you are {{age}} years old.';
      const variables = { name: 'John', age: 30 };
      
      const compiled = promptTemplateServiceMock.compilePrompt(template, variables);
      expect(compiled).toBe('Hello John, you are 30 years old.');
    });

    it('should compile a prompt with array variables', () => {
      const template = 'Items: {{items}}';
      const variables = { items: ['apple', 'banana', 'orange'] };
      
      const compiled = promptTemplateServiceMock.compilePrompt(template, variables);
      expect(compiled).toBe('Items: apple, banana, orange');
    });

    it('should compile a prompt with object variables', () => {
      const template = 'Config: {{config}}';
      const variables = { config: { key: 'value', number: 42 } };
      
      const compiled = promptTemplateServiceMock.compilePrompt(template, variables);
      expect(compiled).toContain('"key": "value"');
      expect(compiled).toContain('"number": 42');
    });

    it('should validate required variables', () => {
      const template: PromptTemplate = {
        id: '1',
        key: 'test',
        category: 'test',
        name: 'Test',
        template: '{{required}} {{optional}}',
        variables: [
          { name: 'required', type: 'text', description: 'Required', required: true },
          { name: 'optional', type: 'text', description: 'Optional', required: false }
        ],
        language: 'pt-BR',
        isActive: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Missing required variable
      let validation = promptTemplateServiceMock.validateVariables(template, { optional: 'value' });
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain("Variable 'required' is required");

      // All required variables present
      validation = promptTemplateServiceMock.validateVariables(template, { required: 'value' });
      expect(validation.valid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });

    it('should validate variable types', () => {
      const template: PromptTemplate = {
        id: '1',
        key: 'test',
        category: 'test',
        name: 'Test',
        template: '{{num}} {{arr}} {{bool}}',
        variables: [
          { name: 'num', type: 'number', description: 'Number', required: true },
          { name: 'arr', type: 'array', description: 'Array', required: true },
          { name: 'bool', type: 'boolean', description: 'Boolean', required: true }
        ],
        language: 'pt-BR',
        isActive: true,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Wrong types
      const validation = promptTemplateServiceMock.validateVariables(template, {
        num: 'not a number',
        arr: 'not an array',
        bool: 'not a boolean'
      });

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain("Variable 'num' must be a number");
      expect(validation.errors).toContain("Variable 'arr' must be an array");
      expect(validation.errors).toContain("Variable 'bool' must be a boolean");
    });

    it('should log execution (mock)', async () => {
      // Should not throw
      await expect(
        promptTemplateServiceMock.logExecution('template-id', { var: 'value' }, 100, 50, true)
      ).resolves.not.toThrow();
    });

    it('should return execution stats (mock)', async () => {
      const stats = await promptTemplateServiceMock.getExecutionStats('template-id');
      expect(stats).toBeDefined();
      expect(stats.totalExecutions).toBe(0);
      expect(stats.averageResponseTime).toBe(0);
      expect(stats.successRate).toBe(100);
      expect(stats.averageTokens).toBe(0);
    });

    it('should return empty version history (mock)', async () => {
      const versions = await promptTemplateServiceMock.getTemplateVersions('template-id');
      expect(versions).toBeDefined();
      expect(versions.length).toBe(0);
    });

    it('should handle rollback to version (mock)', async () => {
      const templates = await promptTemplateServiceMock.getTemplates();
      const template = templates[0];
      
      const rolled = await promptTemplateServiceMock.rollbackToVersion(template.id, 'version-id');
      expect(rolled).toBeDefined();
      expect(rolled.id).toBe(template.id);
    });
  });
});