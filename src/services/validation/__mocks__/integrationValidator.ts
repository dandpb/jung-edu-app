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
    
    // Check for null/undefined modules in array
    const hasNullModules = hasModules && modules.some((m: any) => m === null || m === undefined || (typeof m === 'object' && Object.keys(m).length === 0));
    
    const moduleValid = hasModules && modules[0] && modules[0].quiz !== undefined && modules[0].mindMap !== undefined;
    const incompleteModule = hasModules && modules[0] && (modules[0].quiz === undefined || modules[0].mindMap === undefined);
    
    // Check for empty questions array
    const hasEmptyQuestions = hasModules && modules[0] && modules[0].quiz && 
                            modules[0].quiz.questions && modules[0].quiz.questions.length === 0;
    
    // Check for circular dependencies
    const hasCircularDependency = this.hasCircularDependencies(modules);
    
    // Check for broken relationships
    let hasBrokenRelationship = false;
    if (hasModules && modules[0] && modules[0].quiz && modules[0].quiz.moduleId !== modules[0].id) {
      hasBrokenRelationship = true;
    }

    const createTestResult = (
      testName: string, 
      passed: boolean = true,
      errors: string[] = []
    ): IntegrationTestResult => ({
      testName,
      passed,
      duration: Math.random() * 100,
      details: `Mock test result for ${testName}`,
      errors: passed ? [] : errors.length > 0 ? errors : ['Mock error'],
      warnings: []
    });

    const overallPassed = hasModules && moduleValid && !hasBrokenRelationship && !hasEmptyQuestions && !hasNullModules && !hasCircularDependency;
    
    const report: IntegrationValidationReport = {
      overall: {
        passed: overallPassed,
        score: hasModules ? (overallPassed ? 90 : hasNullModules ? 0 : incompleteModule ? 40 : 60) : 0,
        totalTests: 10,
        passedTests: hasModules ? (overallPassed ? 9 : hasNullModules ? 0 : incompleteModule ? 4 : 6) : 0,
        failedTests: hasModules ? (overallPassed ? 1 : hasNullModules ? 10 : incompleteModule ? 6 : 4) : 10,
        duration: 500
      },
      categories: {
        moduleIntegration: [
          createTestResult('Cross-Module References', moduleValid && !hasBrokenRelationship),
          createTestResult('Navigation Flow', hasModules && !hasNullModules),
          createTestResult('Module Relationship Test', !hasBrokenRelationship),
          createTestResult('Component relationships', moduleValid),
          createTestResult('Module Prerequisite Chain Validation', !hasCircularDependency, hasCircularDependency ? ['Circular dependency detected'] : [])
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
      recommendations: hasModules ? (hasEmptyQuestions ? ['Add quiz questions'] : hasNullModules ? ['Remove null/undefined modules'] : []) : ['Add modules for validation'],
      criticalIssues: hasModules ? (
        hasNullModules ? ['Null or undefined modules detected'] :
        incompleteModule ? ['Module missing required components'] : 
        hasEmptyQuestions ? ['Quiz has no questions'] : 
        hasCircularDependency ? ['Circular module dependencies detected'] : []
      ) : ['No modules provided']
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

  private hasCircularDependencies(modules: any[]): boolean {
    if (!modules || !Array.isArray(modules)) return false;
    
    const moduleIds = new Set(modules.map(m => m?.id).filter(Boolean));
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const hasCycle = (moduleId: string): boolean => {
      if (recursionStack.has(moduleId)) return true;
      if (visited.has(moduleId)) return false;
      
      visited.add(moduleId);
      recursionStack.add(moduleId);
      
      const module = modules.find(m => m?.id === moduleId);
      if (module?.prerequisites) {
        for (const prereq of module.prerequisites) {
          if (moduleIds.has(prereq) && hasCycle(prereq)) {
            return true;
          }
        }
      }
      
      recursionStack.delete(moduleId);
      return false;
    };
    
    for (const moduleId of moduleIds) {
      if (hasCycle(moduleId)) {
        return true;
      }
    }
    
    return false;
  }
}

export const integrationValidator = new IntegrationValidator();