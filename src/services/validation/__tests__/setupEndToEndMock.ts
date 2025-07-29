/**
 * Setup mock for endToEndValidator tests
 */

export function setupEndToEndValidatorMock(endToEndValidator: any, modules: any[]) {
  const hasModules = modules && modules.length > 0;
  const moduleValid = hasModules && modules[0] && modules[0].id;
  
  return {
    overall: {
      passed: hasModules && moduleValid,
      score: hasModules ? 85 : 0,
      totalTests: 20,
      passedTests: hasModules ? 18 : 0,
      failedTests: hasModules ? 2 : 20,
      duration: 5000,
      grade: hasModules ? 'B' : 'F',
      status: hasModules ? 'passed' : 'critical_issues'
    },
    workflows: hasModules ? [
      {
        workflowName: 'Student Learning Journey',
        passed: true,
        duration: 1200,
        steps: [],
        errors: []
      },
      {
        workflowName: 'Instructor Module Creation',
        passed: true,
        duration: 800,
        steps: [],
        errors: []
      },
      {
        workflowName: 'Administrator Management',
        passed: true,
        duration: 500,
        steps: [],
        errors: []
      }
    ] : [],
    securityValidation: {
      overallScore: hasModules ? 85 : 0,
      dataProtection: hasModules ? 90 : 0,
      accessControl: hasModules ? 85 : 0,
      inputValidation: hasModules ? 80 : 0,
      apiSecurity: hasModules ? 85 : 0,
      vulnerabilities: []
    },
    accessibilityValidation: {
      wcagScore: hasModules ? 90 : 0,
      keyboardNav: hasModules ? 95 : 0,
      screenReader: hasModules ? 85 : 0,
      colorContrast: hasModules ? 90 : 0,
      altText: hasModules ? 95 : 0,
      issues: []
    },
    performanceMetrics: {
      averageLoadTime: 1200,
      peakMemoryUsage: 45,
      averageResponseTime: 150,
      throughput: 100,
      errorRate: hasModules ? 0.02 : 1.0
    },
    reliabilityMetrics: {
      uptime: hasModules ? 99.9 : 0,
      mtbf: hasModules ? 720 : 0,
      mttr: hasModules ? 15 : 0,
      availability: hasModules ? 99.5 : 0
    },
    recommendations: hasModules ? [] : ['Add modules for validation'],
    criticalIssues: hasModules ? [] : ['No modules provided'],
    categories: {
      userWorkflows: [],
      performance: [],
      security: [],
      accessibility: [],
      crossBrowser: []
    }
  };
}