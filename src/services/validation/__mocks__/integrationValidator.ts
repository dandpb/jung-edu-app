/**
 * Mock implementation of IntegrationValidator for testing
 */

import { IntegrationValidationReport, IntegrationTestResult } from '../integrationValidator';

export class IntegrationValidator {
  async validateIntegration(modules: any): Promise<IntegrationValidationReport> {
    // Handle null/undefined input
    if (!modules || !Array.isArray(modules)) {
      modules = [];
    }
    
    const hasModules = modules.length > 0;
    const moduleValid = hasModules && modules[0] && modules[0].quiz !== undefined && modules[0].mindMap !== undefined;
    const incompleteModule = hasModules && modules[0] && (modules[0].quiz === undefined || modules[0].mindMap === undefined);
    
    // Check for empty questions array
    const hasEmptyQuestions = hasModules && modules[0] && modules[0].quiz && 
                            modules[0].quiz.questions && modules[0].quiz.questions.length === 0;
    
    // Check for broken relationships
    let hasBrokenRelationship = false;
    if (hasModules && modules[0] && modules[0].quiz && modules[0].quiz.moduleId !== modules[0].id) {
      hasBrokenRelationship = true;
    }

    const createTestResult = (
      testName: string, 
      passed: boolean = true
    ): IntegrationTestResult => ({
      testName,
      passed,
      duration: Math.random() * 100,
      details: `Mock test result for ${testName}`,
      errors: passed ? [] : ['Mock error'],
      warnings: []
    });

    const report: IntegrationValidationReport = {
      overall: {
        passed: hasModules && moduleValid && !hasBrokenRelationship && !hasEmptyQuestions,
        score: hasModules ? (moduleValid && !hasBrokenRelationship && !hasEmptyQuestions ? 90 : incompleteModule ? 40 : 60) : 0,
        totalTests: 10,
        passedTests: hasModules ? (moduleValid && !hasBrokenRelationship && !hasEmptyQuestions ? 9 : incompleteModule ? 4 : 6) : 0,
        failedTests: hasModules ? (moduleValid && !hasBrokenRelationship && !hasEmptyQuestions ? 1 : incompleteModule ? 6 : 4) : 10,
        duration: 500
      },
      categories: {
        moduleIntegration: [
          createTestResult('Cross-Module References', moduleValid && !hasBrokenRelationship),
          createTestResult('Navigation Flow', hasModules),
          createTestResult('Module Relationship Test', !hasBrokenRelationship),
          createTestResult('Component relationships', moduleValid)
        ],
        serviceIntegration: [
          createTestResult('Module Service Integration', hasModules),
          createTestResult('Quiz Service Integration', moduleValid && !incompleteModule && !hasEmptyQuestions)
        ],
        dataIntegration: [
          createTestResult('Data Schema Consistency', hasModules),
          createTestResult('Data Serialization', true),
          createTestResult('Quiz questions validation', !hasEmptyQuestions)
        ],
        apiIntegration: [
          createTestResult('YouTube API Integration', true),
          createTestResult('OpenAI API Integration', true)
        ],
        performanceIntegration: [
          createTestResult('Load Time', true),
          createTestResult('Memory Usage', true)
        ]
      },
      recommendations: hasModules ? (hasEmptyQuestions ? ['Add quiz questions'] : []) : ['Add modules for validation'],
      criticalIssues: hasModules ? (incompleteModule ? ['Module missing required components'] : hasEmptyQuestions ? ['Quiz has no questions'] : []) : ['No modules provided']
    };

    return report;
  }

  async testModuleIntegration(modules: any[]): Promise<IntegrationTestResult[]> {
    return [];
  }

  async testServiceIntegration(modules: any[]): Promise<IntegrationTestResult[]> {
    return [];
  }

  async testDataIntegration(modules: any[]): Promise<IntegrationTestResult[]> {
    return [];
  }

  async testAPIIntegration(modules: any[]): Promise<IntegrationTestResult[]> {
    return [];
  }

  async testPerformanceIntegration(modules: any[]): Promise<IntegrationTestResult[]> {
    return [];
  }
}

export const integrationValidator = new IntegrationValidator();