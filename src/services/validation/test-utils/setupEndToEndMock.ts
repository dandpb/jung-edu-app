/**
 * Setup mock for endToEndValidator tests
 */

export function setupEndToEndValidatorMock(endToEndValidator: any, modules: any[], options: { systemError?: boolean; integrationError?: boolean } = {}) {
  const hasModules = modules && modules.length > 0;
  const moduleValid = hasModules && modules[0] && modules[0].id;
  
  // Check for incomplete modules (missing key components)
  const hasIncompleteModules = hasModules && modules.some(m => 
    !m.quiz || !m.mindMap || !m.bibliography
  );
  
  // Check for XSS vulnerabilities in content
  const hasXssVulnerabilities = hasModules && modules.some(m => 
    m.content?.sections?.some((s: any) => 
      s.title?.includes('<script>') || s.content?.includes('<script>')
    ) ||
    m.content?.introduction?.includes('<script>') ||
    m.title?.includes('<script>')
  );
  
  // Check for SQL injection patterns
  const hasSqlInjection = hasModules && modules.some(m => 
    m.title?.includes("'; DROP TABLE") ||
    m.content?.introduction?.includes("'; DROP TABLE")
  );
  
  // Determine if validation should pass
  const isValid = Boolean(hasModules && moduleValid && !hasIncompleteModules && !options.systemError && !options.integrationError);
  
  return {
    overall: {
      passed: isValid,
      score: isValid ? 85 : (hasModules ? 55 : 0),
      totalTests: 20,
      passedTests: isValid ? 18 : (hasModules ? 8 : 0),
      failedTests: isValid ? 2 : (hasModules ? 12 : 20),
      duration: 5000,
      grade: isValid ? 'B' : (hasModules ? 'D' : 'F'),
      status: isValid ? 'staging_ready' : (options.systemError || options.integrationError || !hasModules ? 'critical_issues' : 'needs_major_work'),
      timestamp: new Date().toISOString()
    },
    workflows: hasModules ? [
      {
        workflowName: 'Student Learning Journey',
        description: 'Complete student experience from module discovery to completion',
        passed: true,
        duration: 1200,
        steps: [],
        errors: [],
        warnings: [],
        userExperienceScore: 85
      },
      {
        workflowName: 'Instructor Module Creation',
        description: 'Complete educator experience creating and managing modules',
        passed: true,
        duration: 800,
        steps: [],
        errors: [],
        warnings: [],
        userExperienceScore: 90
      },
      {
        workflowName: 'Administrator Management',
        description: 'Administrative functions and system management',
        passed: true,
        duration: 500,
        steps: [],
        errors: [],
        warnings: [],
        userExperienceScore: 88
      }
    ] : [],
    systemValidation: {
      overall: {
        score: hasModules ? 85 : 0,
        passed: isValid,
        totalModules: modules ? modules.length : 0,
        validModules: hasModules ? modules.length : 0,
        invalidModules: 0,
        criticalIssues: hasModules ? 0 : 1,
        grade: hasModules ? 'B' : 'F'
      },
      modules: hasModules ? modules.map(m => ({
        moduleId: m.id,
        isValid: true,
        score: 85
      })) : []
    },
    integrationValidation: {
      overall: {
        passed: isValid,
        totalTests: 10,
        passedTests: hasModules ? 9 : 0,
        failedTests: hasModules ? 1 : 10,
        score: hasModules ? 90 : 0,
        grade: hasModules ? 'A' : 'F'
      },
      testResults: []
    },
    securityValidation: {
      overallScore: hasModules ? (hasXssVulnerabilities || hasSqlInjection ? 60 : 85) : 0,
      dataProtection: hasModules ? 90 : 0,
      accessControl: hasModules ? 85 : 0,
      inputValidation: hasModules ? 80 : 0,
      apiSecurity: hasModules ? 85 : 0,
      vulnerabilities: (() => {
        const vulns: any[] = [];
        if (hasXssVulnerabilities) {
          vulns.push({
            type: 'XSS Vulnerability',
            severity: 'high' as const,
            description: 'Potential XSS vulnerability detected in content',
            recommendation: 'Sanitize user input and escape HTML content'
          });
        }
        if (hasSqlInjection) {
          vulns.push({
            type: 'SQL Injection',
            severity: 'critical' as const,
            description: 'SQL injection pattern detected',
            recommendation: 'Use parameterized queries and input validation'
          });
        }
        return vulns;
      })()
    },
    accessibilityValidation: {
      overallScore: hasModules ? 85 : 0,
      wcagCompliance: hasModules ? 90 : 0,
      keyboardNavigation: hasModules ? 85 : 0,
      screenReaderSupport: hasModules ? 88 : 0,
      colorContrast: hasModules ? 90 : 0,
      screenReaderCompatibility: hasModules ? 88 : 0,
      textReadability: hasModules ? 85 : 0,
      issues: []
    },
    performanceMetrics: {
      overallScore: hasModules ? 80 : 0,
      loadTime: {
        average: hasModules ? 850 : 0,
        p95: hasModules ? 1200 : 0,
        p99: hasModules ? 1800 : 0
      },
      throughput: {
        requestsPerSecond: hasModules ? 120 : 0,
        concurrentUsers: hasModules ? 75 : 0
      },
      resourceUsage: {
        memory: hasModules ? 45 : 0,
        cpu: hasModules ? 35 : 0,
        network: hasModules ? 850 : 0
      },
      scalabilityScore: hasModules ? 78 : 0
    },
    reliabilityMetrics: {
      overallScore: hasModules ? 88 : 0,
      uptime: hasModules ? 99.5 : 0,
      errorRate: hasModules ? 2.5 : 100,
      failureRecoveryTime: hasModules ? 25 : 0,
      dataIntegrity: hasModules ? 98 : 0,
      consistencyScore: hasModules ? 92 : 0
    },
    recommendations: hasModules ? [{
      priority: 'medium' as const,
      category: 'performance' as const,
      title: 'Optimize loading times',
      description: 'Consider implementing caching strategies',
      actionItems: ['Implement Redis caching', 'Optimize database queries'],
      estimatedEffort: 'medium' as const,
      impact: 'high' as const,
      area: 'performance'
    }] : [{
      priority: 'critical' as const,
      category: 'functionality' as const,
      title: 'No modules provided',
      description: 'System requires modules for validation',
      actionItems: ['Add educational modules'],
      estimatedEffort: 'high' as const,
      impact: 'high' as const,
      area: 'content'
    }],
    criticalIssues: (() => {
      const issues: any[] = [];
      
      if (!hasModules) {
        issues.push({
          id: 'no-modules',
          severity: 'critical' as const,
          category: 'content',
          title: 'No modules provided',
          description: 'Cannot validate system without educational modules',
          impact: 'System cannot function without content',
          urgency: 'immediate' as const,
          blockingRelease: true
        });
      }
      
      if (hasIncompleteModules) {
        issues.push({
          id: 'incomplete-modules',
          severity: 'major' as const,
          category: 'content',
          title: 'Incomplete module components',
          description: 'Modules are missing required components (quiz, mindMap, or bibliography)',
          impact: 'Module functionality will be limited',
          urgency: 'high' as const,
          blockingRelease: true
        });
      }
      
      if (options.systemError) {
        issues.push({
          id: 'system-validation-error',
          severity: 'critical' as const,
          category: 'system',
          title: 'System validation failed',
          description: 'System validation encountered an error',
          impact: 'Cannot determine system health',
          urgency: 'immediate' as const,
          blockingRelease: true
        });
      }
      
      if (options.integrationError) {
        issues.push({
          id: 'integration-validation-error',
          severity: 'critical' as const,
          category: 'integration',
          title: 'Integration validation failed',
          description: 'Integration validation encountered an error',
          impact: 'Cannot determine integration health',
          urgency: 'immediate' as const,
          blockingRelease: true
        });
      }
      
      return issues;
    })(),
    summary: {
      totalTests: 20,
      passedTests: hasModules ? 18 : 0,
      failedTests: hasModules ? 2 : 20,
      testCoverage: hasModules ? 90 : 0,
      qualityScore: hasModules ? 85 : 0,
      readinessLevel: hasModules ? 'staging_ready' : 'critical_issues',
      nextSteps: hasModules ? [
        'Address remaining quality issues',
        'Optimize performance'
      ] : [
        'Add educational modules',
        'Re-run validation'
      ]
    }
  };
}