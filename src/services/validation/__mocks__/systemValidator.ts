/**
 * Mock implementation of SystemValidator for testing
 */

export interface SystemTestResult {
  testName: string;
  passed: boolean;
  details: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface SystemValidationReport {
  overall: {
    passed: boolean;
    score: number;
    totalTests: number;
    passedTests: number;
    failedTests: number;
  };
  categories: {
    dataIntegrity: SystemTestResult[];
    businessLogic: SystemTestResult[];
    security: SystemTestResult[];
    performance: SystemTestResult[];
    compatibility: SystemTestResult[];
  };
  recommendations: string[];
  criticalIssues: string[];
}

export class SystemValidator {
  async validateSystem(modules: any[]): Promise<SystemValidationReport> {
    const hasModules = modules && modules.length > 0;
    
    const createTestResult = (
      testName: string, 
      passed: boolean = true,
      severity: 'low' | 'medium' | 'high' | 'critical' = 'low'
    ): SystemTestResult => ({
      testName,
      passed,
      details: `Mock test result for ${testName}`,
      severity
    });

    return {
      overall: {
        passed: hasModules,
        score: hasModules ? 88 : 0,
        totalTests: 15,
        passedTests: hasModules ? 14 : 0,
        failedTests: hasModules ? 1 : 15
      },
      categories: {
        dataIntegrity: [
          createTestResult('Schema Validation', hasModules),
          createTestResult('Data Consistency', hasModules),
          createTestResult('Reference Integrity', hasModules)
        ],
        businessLogic: [
          createTestResult('Module Rules', hasModules),
          createTestResult('Quiz Logic', hasModules),
          createTestResult('Progress Calculation', hasModules)
        ],
        security: [
          createTestResult('Input Validation', true),
          createTestResult('Authorization', true),
          createTestResult('Data Sanitization', true)
        ],
        performance: [
          createTestResult('Response Times', true),
          createTestResult('Resource Usage', true),
          createTestResult('Scalability', true)
        ],
        compatibility: [
          createTestResult('Browser Support', true),
          createTestResult('API Versioning', true),
          createTestResult('Dependencies', true)
        ]
      },
      recommendations: hasModules ? [] : ['Add modules for validation'],
      criticalIssues: hasModules ? [] : ['No modules provided']
    };
  }
}

export const systemValidator = new SystemValidator();