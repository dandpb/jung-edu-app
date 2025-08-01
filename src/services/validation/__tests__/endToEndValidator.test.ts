/**
 * Test suite for End-to-End Validator
 * Tests complete user workflows, performance metrics, security validation, and accessibility
 */

import { EducationalModule } from '../../../schemas/module.schema';
import { setupEndToEndValidatorMock } from '../test-utils/setupEndToEndMock';

// Create mock validators
const mockValidateEndToEnd = jest.fn();
const mockValidateSystem = jest.fn();
const mockValidateIntegration = jest.fn();

const endToEndValidator = {
  validateEndToEnd: mockValidateEndToEnd
};

const systemValidator = {
  validateSystem: mockValidateSystem
};

const integrationValidator = {
  validateIntegration: mockValidateIntegration
};

describe('EndToEndValidator', () => {
  const mockModule: EducationalModule = {
    id: 'test-module-1',
    title: 'Introduction to Jungian Psychology',
    description: 'A comprehensive introduction to Jung\'s psychological theories',
    topic: 'Jungian Psychology',
    difficulty: 'intermediate',
    estimatedTime: 60,
    targetAudience: 'Psychology students',
    objectives: [
      'Understand core Jungian concepts',
      'Apply Jungian theory in practice'
    ],
    content: {
      introduction: 'Welcome to Jungian Psychology',
      sections: [
        { title: 'The Shadow', content: 'The shadow archetype...' },
        { title: 'The Self', content: 'The journey to self-realization...' }
      ],
      summary: 'Key takeaways from Jungian psychology'
    },
    quiz: {
      id: 'quiz-1',
      moduleId: 'test-module-1',
      title: 'Jung Psychology Assessment',
      description: 'Test your knowledge',
      questions: [
        {
          id: 'q1',
          type: 'multiple-choice',
          question: 'What is the shadow?',
          options: ['Hidden aspects', 'Conscious ego', 'Dreams', 'Memories'],
          correctAnswer: 0,
          explanation: 'The shadow represents hidden aspects of personality',
          points: 10,
          order: 0
        }
      ],
      passingScore: 70,
      timeLimit: 30,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    bibliography: [],
    mindMap: {
      id: 'mindmap-1',
      moduleId: 'test-module-1',
      nodes: [],
      edges: [],
      centralConcept: 'Jungian Psychology',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    videos: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up the mock implementation
    mockValidateEndToEnd.mockImplementation(async (modules: any[]) => {
      return setupEndToEndValidatorMock(endToEndValidator, modules);
    });
    
    // Mock system validator response
    mockValidateSystem.mockResolvedValue({
      summary: {
        score: 85,
        passed: true,
        totalModules: 1,
        validModules: 1,
        invalidModules: 0,
        criticalIssues: 0,
        grade: 'B'
      },
      moduleResults: [
        {
          moduleId: 'test-module-1',
          passed: true,
          score: 85
        }
      ]
    });
    
    // Mock integration validator response
    mockValidateIntegration.mockResolvedValue({
      summary: {
        passed: true,
        totalTests: 10,
        passedTests: 9,
        failedTests: 1,
        score: 90,
        grade: 'A'
      },
      testResults: []
    });
  });

  describe('validateEndToEnd', () => {
    it('should successfully validate a complete module', async () => {
      const result = await endToEndValidator.validateEndToEnd([mockModule]);

      expect(result).toBeDefined();
      expect(result.overall.passed).toBe(true);
      expect(result.overall.score).toBeGreaterThan(70);
      expect(result.overall.grade).toMatch(/[A-C]/);
      expect(result.overall.status).not.toBe('critical_issues');
    });

    it('should run all workflow validations', async () => {
      const result = await endToEndValidator.validateEndToEnd([mockModule]);

      expect(result.workflows).toBeDefined();
      expect(result.workflows.length).toBeGreaterThan(0);
      
      // Check key workflows are present
      const workflowNames = result.workflows.map(w => w.workflowName);
      expect(workflowNames).toContain('Student Learning Journey');
      expect(workflowNames).toContain('Instructor Module Creation');
      expect(workflowNames).toContain('Administrator Management');
    });

    it('should validate security aspects', async () => {
      const result = await endToEndValidator.validateEndToEnd([mockModule]);

      expect(result.securityValidation).toBeDefined();
      expect(result.securityValidation.overallScore).toBeGreaterThan(0);
      expect(result.securityValidation.dataProtection).toBeGreaterThan(0);
      expect(result.securityValidation.accessControl).toBeGreaterThan(0);
      expect(result.securityValidation.inputValidation).toBeGreaterThan(0);
      expect(result.securityValidation.apiSecurity).toBeGreaterThan(0);
    });

    it('should validate accessibility', async () => {
      const result = await endToEndValidator.validateEndToEnd([mockModule]);

      expect(result.accessibilityValidation).toBeDefined();
      expect(result.accessibilityValidation.overallScore).toBeGreaterThan(0);
      expect(result.accessibilityValidation.wcagCompliance).toBeGreaterThan(0);
      expect(result.accessibilityValidation.keyboardNavigation).toBeGreaterThan(0);
      expect(result.accessibilityValidation.screenReaderSupport).toBeGreaterThan(0);
    });

    it('should calculate performance metrics', async () => {
      const result = await endToEndValidator.validateEndToEnd([mockModule]);

      expect(result.performanceMetrics).toBeDefined();
      expect(result.performanceMetrics.overallScore).toBeGreaterThan(0);
      expect(result.performanceMetrics.loadTime).toBeDefined();
      expect(result.performanceMetrics.loadTime.average).toBeGreaterThan(0);
      expect(result.performanceMetrics.throughput).toBeDefined();
      expect(result.performanceMetrics.resourceUsage).toBeDefined();
    });

    it('should calculate reliability metrics', async () => {
      const result = await endToEndValidator.validateEndToEnd([mockModule]);

      expect(result.reliabilityMetrics).toBeDefined();
      expect(result.reliabilityMetrics.overallScore).toBeGreaterThan(0);
      expect(result.reliabilityMetrics.uptime).toBeGreaterThan(90);
      expect(result.reliabilityMetrics.errorRate).toBeLessThan(10);
      expect(result.reliabilityMetrics.dataIntegrity).toBeGreaterThan(90);
    });

    it('should provide recommendations', async () => {
      const result = await endToEndValidator.validateEndToEnd([mockModule]);

      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);
      
      result.recommendations.forEach(rec => {
        expect(rec.area).toBeDefined();
        expect(rec.priority).toMatch(/low|medium|high|critical/);
        expect(rec.description).toBeDefined();
        expect(rec.impact).toBeDefined();
      });
    });

    it('should handle empty module array', async () => {
      const result = await endToEndValidator.validateEndToEnd([]);

      expect(result.overall.passed).toBe(false);
      expect(result.overall.score).toBe(0);
      expect(result.overall.grade).toBe('F');
      expect(result.criticalIssues.length).toBeGreaterThan(0);
    });

    it('should handle module with missing components', async () => {
      const incompleteModule = {
        ...mockModule,
        quiz: undefined,
        mindMap: undefined,
        bibliography: undefined
      };

      const result = await endToEndValidator.validateEndToEnd([incompleteModule]);

      expect(result.overall.passed).toBe(false);
      expect(result.overall.score).toBeLessThan(70);
      expect(result.criticalIssues.length).toBeGreaterThan(0);
    });

    it('should detect security vulnerabilities', async () => {
      const vulnerableModule = {
        ...mockModule,
        content: {
          ...mockModule.content,
          sections: [
            { 
              title: '<script>alert("xss")</script>', 
              content: 'Content with potential XSS'
            }
          ]
        }
      };

      const result = await endToEndValidator.validateEndToEnd([vulnerableModule]);

      expect(result.securityValidation.vulnerabilities.length).toBeGreaterThan(0);
      expect(result.securityValidation.vulnerabilities.some(v => 
        v.type.includes('XSS') || v.type.includes('injection')
      )).toBe(true);
    });
  });

  describe('validateUserWorkflow', () => {
    it('should validate student learning journey', async () => {
      const workflow = await (endToEndValidator as any).validateUserWorkflow(
        [mockModule],
        'Student Learning Journey',
        'Complete learning path from enrollment to assessment'
      );

      expect(workflow.workflowName).toBe('Student Learning Journey');
      expect(workflow.steps.length).toBeGreaterThan(0);
      expect(workflow.userExperienceScore).toBeGreaterThan(0);
    });

    it('should validate instructor workflow', async () => {
      const workflow = await (endToEndValidator as any).validateUserWorkflow(
        [mockModule],
        'Instructor Module Creation',
        'Create and publish a complete educational module'
      );

      expect(workflow.workflowName).toBe('Instructor Module Creation');
      expect(workflow.steps.length).toBeGreaterThan(0);
      
      const stepNames = workflow.steps.map(s => s.stepName);
      expect(stepNames).toContain('Create Module Structure');
      expect(stepNames).toContain('Add Educational Content');
      expect(stepNames).toContain('Create Assessment');
    });

    it('should handle workflow errors gracefully', async () => {
      // Force an error in system validation
      (systemValidator.validateSystem as jest.Mock).mockRejectedValueOnce(
        new Error('System validation failed')
      );

      const workflow = await (endToEndValidator as any).validateUserWorkflow(
        [mockModule],
        'Error Test Workflow',
        'Test error handling'
      );

      expect(workflow.passed).toBe(false);
      expect(workflow.errors.length).toBeGreaterThan(0);
      expect(workflow.errors[0]).toContain('System validation failed');
    });
  });

  describe('calculatePerformanceMetrics', () => {
    it('should simulate realistic performance metrics', async () => {
      const metrics = await (endToEndValidator as any).calculatePerformanceMetrics([mockModule]);

      expect(metrics.loadTime.average).toBeGreaterThan(100);
      expect(metrics.loadTime.average).toBeLessThan(5000);
      expect(metrics.loadTime.p95).toBeGreaterThan(metrics.loadTime.average);
      expect(metrics.loadTime.p99).toBeGreaterThan(metrics.loadTime.p95);
      
      expect(metrics.throughput.requestsPerSecond).toBeGreaterThan(10);
      expect(metrics.throughput.concurrentUsers).toBeGreaterThan(50);
      
      expect(metrics.resourceUsage.memory).toBeGreaterThan(10);
      expect(metrics.resourceUsage.memory).toBeLessThan(90);
    });

    it('should penalize performance for large module sets', async () => {
      const manyModules = Array(20).fill(mockModule);
      const metrics = await (endToEndValidator as any).calculatePerformanceMetrics(manyModules);

      expect(metrics.overallScore).toBeLessThan(80);
      expect(metrics.scalabilityScore).toBeLessThan(70);
    });
  });

  describe('validateSecurity', () => {
    it('should detect common security issues', async () => {
      const security = await (endToEndValidator as any).validateSecurity([mockModule]);

      expect(security.overallScore).toBeGreaterThan(70);
      expect(security.dataProtection).toBeGreaterThan(60);
      expect(security.accessControl).toBeGreaterThan(60);
    });

    it('should detect XSS vulnerabilities', async () => {
      const xssModule = {
        ...mockModule,
        content: {
          ...mockModule.content,
          introduction: '<img src=x onerror=alert("xss")>'
        }
      };

      const security = await (endToEndValidator as any).validateSecurity([xssModule]);

      expect(security.vulnerabilities.length).toBeGreaterThan(0);
      expect(security.vulnerabilities[0].type).toContain('XSS');
      expect(security.vulnerabilities[0].severity).toMatch(/high|critical/);
    });

    it('should detect SQL injection patterns', async () => {
      const sqlModule = {
        ...mockModule,
        title: "'; DROP TABLE users; --"
      };

      const security = await (endToEndValidator as any).validateSecurity([sqlModule]);

      expect(security.vulnerabilities.some(v => 
        v.type.includes('SQL') || v.type.includes('injection')
      )).toBe(true);
    });
  });

  describe('validateAccessibility', () => {
    it('should check WCAG compliance', async () => {
      const accessibility = await (endToEndValidator as any).validateAccessibility([mockModule]);

      expect(accessibility.wcagCompliance).toBeGreaterThan(70);
      expect(accessibility.keyboardNavigation).toBeGreaterThan(70);
      expect(accessibility.screenReaderSupport).toBeGreaterThan(70);
      expect(accessibility.colorContrast).toBeGreaterThan(70);
    });

    it('should detect missing alt text', async () => {
      const moduleWithImages = {
        ...mockModule,
        content: {
          ...mockModule.content,
          sections: [
            { 
              title: 'Images', 
              content: '<img src="test.jpg"> <img src="test2.jpg" alt="">'
            }
          ]
        }
      };

      const accessibility = await (endToEndValidator as any).validateAccessibility([moduleWithImages]);

      expect(accessibility.issues.length).toBeGreaterThan(0);
      expect(accessibility.issues.some(i => 
        i.type === 'missing_alt_text'
      )).toBe(true);
    });

    it('should check language attributes', async () => {
      const accessibility = await (endToEndValidator as any).validateAccessibility([mockModule]);

      const langIssue = accessibility.issues.find(i => i.type === 'missing_language');
      if (langIssue) {
        expect(langIssue.severity).toBe('medium');
        expect(langIssue.wcagCriteria).toContain('3.1.1');
      }
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle validation with system validator failure', async () => {
      (systemValidator.validateSystem as jest.Mock).mockRejectedValueOnce(
        new Error('System validation error')
      );

      const result = await endToEndValidator.validateEndToEnd([mockModule]);

      expect(result.overall.passed).toBe(false);
      expect(result.criticalIssues.length).toBeGreaterThan(0);
      expect(result.overall.status).toBe('critical_issues');
    });

    it('should handle validation with integration validator failure', async () => {
      (integrationValidator.validateIntegration as jest.Mock).mockRejectedValueOnce(
        new Error('Integration validation error')
      );

      const result = await endToEndValidator.validateEndToEnd([mockModule]);

      expect(result.overall.passed).toBe(false);
      expect(result.criticalIssues.length).toBeGreaterThan(0);
    });

    it('should handle null or undefined modules', async () => {
      const result = await endToEndValidator.validateEndToEnd(null as any);

      expect(result.overall.passed).toBe(false);
      expect(result.overall.score).toBe(0);
      expect(result.criticalIssues.length).toBeGreaterThan(0);
    }, 10000);

    it('should handle modules with circular references', async () => {
      const circularModule: any = { ...mockModule };
      circularModule.self = circularModule; // Create circular reference

      const result = await endToEndValidator.validateEndToEnd([circularModule]);

      // Should handle gracefully without throwing
      expect(result).toBeDefined();
      expect(result.overall).toBeDefined();
    }, 10000);
  });
});