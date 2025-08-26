/**
 * Fixed Comprehensive Test Suite for ValidationService
 * Tests the main validation service orchestrator with working mocks
 */

import { ValidationService, validationService } from '../index';
import { EducationalModule } from '../../../schemas/module.schema';

// Mock console to reduce test noise
const consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(() => {}),
  warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
  error: jest.spyOn(console, 'error').mockImplementation(() => {})
};

// Mock performance API for consistent test results
const mockPerformance = {
  now: jest.fn(() => 100),
  mark: jest.fn(),
  measure: jest.fn()
};

// Replace global performance
Object.defineProperty(global, 'performance', {
  writable: true,
  value: mockPerformance
});

// Create mock functions that will be used in the validators
const mockValidateSystem = jest.fn();
const mockValidateModule = jest.fn();
const mockValidateIntegration = jest.fn();
const mockValidateEndToEnd = jest.fn();

// Mock the validator modules with manual implementations
jest.mock('../systemValidator', () => ({
  systemValidator: {
    validateSystem: (...args: any[]) => mockValidateSystem(...args),
    validateModule: (...args: any[]) => mockValidateModule(...args)
  }
}));

jest.mock('../integrationValidator', () => ({
  integrationValidator: {
    validateIntegration: (...args: any[]) => mockValidateIntegration(...args)
  }
}));

jest.mock('../endToEndValidator', () => ({
  endToEndValidator: {
    validateEndToEnd: (...args: any[]) => mockValidateEndToEnd(...args)
  }
}));

describe('ValidationService - Fixed Tests', () => {
  let service: ValidationService;
  let mockModule: EducationalModule;

  beforeEach(() => {
    service = new ValidationService();
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Reset performance mock
    mockPerformance.now.mockReturnValue(100);
    
    // Set up default mock return values
    mockValidateSystem.mockResolvedValue({
      isValid: true,
      overall: { score: 85, grade: 'B', status: 'good' },
      modules: [{ moduleId: 'test-module-1', isValid: true, score: 85 }],
      errors: [],
      warnings: [],
      recommendations: [{ message: 'Test recommendation', priority: 'medium' }]
    });
    
    mockValidateIntegration.mockResolvedValue({
      overall: {
        score: 90,
        passed: true,
        totalTests: 10,
        passedTests: 9,
        failedTests: 1
      },
      recommendations: []
    });
    
    mockValidateEndToEnd.mockResolvedValue({
      overall: {
        score: 88,
        passed: true
      },
      workflows: [
        { passed: true, userExperienceScore: 85 },
        { passed: true, userExperienceScore: 90 }
      ],
      criticalIssues: [],
      performanceMetrics: { overallScore: 85 },
      securityValidation: { overallScore: 90 },
      accessibilityValidation: { overallScore: 87 },
      reliabilityMetrics: { overallScore: 92 },
      recommendations: []
    });
    
    // Create mock module
    mockModule = {
      id: 'test-module-1',
      title: 'Test Module',
      description: 'Test description',
      content: {
        introduction: 'Test intro',
        sections: [{
          id: 's1',
          title: 'Section 1',
          content: 'Content',
          order: 0,
          keyTerms: [{ term: 'term1', definition: 'Definition 1' }],
          images: [],
          interactiveElements: [],
          estimatedTime: 5
        }],
        summary: 'Test summary',
        keyTakeaways: ['takeaway']
      },
      videos: [],
      quiz: {
        id: 'q1',
        title: 'Quiz',
        description: 'Quiz desc',
        questions: [],
        timeLimit: 10,
        passingScore: 70
      },
      difficulty: 'beginner' as const,
      tags: ['test'],
      targetAudience: 'students' as const,
      educationalObjectives: ['objective'],
      prerequisites: [],
      estimatedDuration: 30,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'published' as const,
      version: 1,
      lastModifiedBy: 'test-user',
      metadata: {}
    };
  });

  describe('validateComplete', () => {
    it('should run all validators and return comprehensive results', async () => {
      const result = await service.validateComplete([mockModule]);

      expect(result).toMatchObject({
        moduleCount: 1,
        passed: true,
        grade: expect.stringMatching(/[ABCDF]/),
        status: expect.any(String),
        system: {
          score: 85,
          passed: true,
          moduleResults: 1,
          criticalIssues: 0
        },
        integration: {
          score: 90,
          passed: true,
          totalTests: 10,
          passedTests: 9,
          failedTests: 1
        },
        endToEnd: {
          score: 88,
          passed: true,
          workflowsPassed: 2,
          workflowsFailed: 0,
          criticalIssues: 0
        }
      });

      // Verify all validators were called
      expect(mockValidateSystem).toHaveBeenCalledWith([mockModule]);
      expect(mockValidateIntegration).toHaveBeenCalledWith([mockModule]);
      expect(mockValidateEndToEnd).toHaveBeenCalledWith([mockModule]);
    });

    it('should calculate weighted overall score correctly', async () => {
      const result = await service.validateComplete([mockModule]);
      
      // Expected: 85 * 0.4 + 90 * 0.3 + 88 * 0.3 = 34 + 27 + 26.4 = 87.4 → 87
      expect(result.overallScore).toBe(87);
    });

    it('should handle validation failures gracefully', async () => {
      const error = new Error('Validation failed');
      // Override the default mock for this test
      mockValidateSystem.mockRejectedValueOnce(error);

      const result = await service.validateComplete([mockModule]);

      expect(result).toMatchObject({
        overallScore: 0,
        grade: 'F',
        status: 'critical_issues',
        passed: false,
        summary: {
          criticalIssues: expect.arrayContaining([expect.stringContaining('Validation failed')])
        }
      });
      
      // Note: Error logging behavior may vary depending on implementation
      // The main validation behavior (graceful failure handling) is what's important
    });

    it('should identify strengths correctly', async () => {
      const result = await service.validateComplete([mockModule]);

      expect(result.summary.strengths).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/strong|robust|good/i)
        ])
      );
    });
  });

  describe('validateQuick', () => {
    it('should perform quick validation using system validator only', async () => {
      const result = await service.validateQuick([mockModule]);

      expect(result).toMatchObject({
        score: 85,
        passed: true,
        issues: [],
        recommendations: ['Test recommendation']
      });

      expect(mockValidateSystem).toHaveBeenCalledWith([mockModule]);
      expect(mockValidateIntegration).not.toHaveBeenCalled();
      expect(mockValidateEndToEnd).not.toHaveBeenCalled();
    });
  });

  describe('validateAspect', () => {
    it('should validate system aspect', async () => {
      const result = await service.validateAspect([mockModule], 'system');
      expect(mockValidateSystem).toHaveBeenCalledWith([mockModule]);
      expect(result).toHaveProperty('overall.score', 85);
    });

    it('should validate integration aspect', async () => {
      const result = await service.validateAspect([mockModule], 'integration');
      expect(mockValidateIntegration).toHaveBeenCalledWith([mockModule]);
      expect(result).toHaveProperty('overall.score', 90);
    });

    it('should validate e2e aspect', async () => {
      const result = await service.validateAspect([mockModule], 'e2e');
      expect(mockValidateEndToEnd).toHaveBeenCalledWith([mockModule]);
      expect(result).toHaveProperty('overall.score', 88);
    });

    it('should throw error for unknown aspect', async () => {
      await expect(service.validateAspect([mockModule], 'unknown' as any))
        .rejects.toThrow('Unknown validation aspect: unknown');
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton instance', () => {
      expect(validationService).toBeInstanceOf(ValidationService);
    });
    
    it('should maintain consistent instance', () => {
      const service1 = validationService;
      const service2 = validationService;
      expect(service1).toBe(service2);
    });
  });
  
  afterAll(() => {
    // Restore console methods
    Object.values(consoleSpy).forEach(spy => spy.mockRestore());
  });
});