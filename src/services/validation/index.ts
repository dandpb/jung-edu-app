/**
 * jaqEdu Validation System - Main Entry Point
 * Provides a unified interface for all validation services
 */

export { systemValidator, SystemValidator } from './systemValidator';
export type {
  SystemValidationResult,
  ModuleValidationResult,
  ContentQualityResult,
  StructuralIntegrityResult,
  AIAccuracyResult,
  UserExperienceResult,
  IntegrationValidationResult,
  PerformanceValidationResult,
  ValidationRecommendation
} from './systemValidator';

export { integrationValidator, IntegrationValidator } from './integrationValidator';
export type {
  IntegrationTestResult,
  IntegrationValidationReport
} from './integrationValidator';

export { endToEndValidator, EndToEndValidator } from './endToEndValidator';
export type {
  EndToEndValidationResult,
  UserWorkflowResult,
  WorkflowStepResult,
  PerformanceMetrics,
  ReliabilityMetrics,
  SecurityValidationResult,
  SecurityVulnerability,
  AccessibilityValidationResult,
  AccessibilityIssue,
  CriticalIssue,
  ValidationSummary
} from './endToEndValidator';

export { ValidationTestUtils } from './__tests__/validationSystem.test';

import { EducationalModule } from '../../schemas/module.schema';
import { systemValidator } from './systemValidator';
import { integrationValidator } from './integrationValidator';
import { endToEndValidator } from './endToEndValidator';

/**
 * Comprehensive Validation Result
 */
export interface ComprehensiveValidationResult {
  timestamp: string;
  moduleCount: number;
  overallScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  status: 'production_ready' | 'staging_ready' | 'development_ready' | 'needs_work' | 'critical_issues';
  passed: boolean;
  
  system: {
    score: number;
    passed: boolean;
    moduleResults: number;
    criticalIssues: number;
  };
  
  integration: {
    score: number;
    passed: boolean;
    totalTests: number;
    passedTests: number;
    failedTests: number;
  };
  
  endToEnd: {
    score: number;
    passed: boolean;
    workflowsPassed: number;
    workflowsFailed: number;
    criticalIssues: number;
  };
  
  summary: {
    strengths: string[];
    weaknesses: string[];
    criticalIssues: string[];
    recommendations: string[];
    nextSteps: string[];
  };
  
  metrics: {
    performance: number;
    security: number;
    accessibility: number;
    reliability: number;
    userExperience: number;
  };
  
  details: {
    systemValidation: any;
    integrationValidation: any;
    endToEndValidation: any;
  };
}

/**
 * Main Validation Service Class
 * Provides a unified interface for all validation operations
 */
export class ValidationService {
  
  /**
   * Runs all validation checks and provides a comprehensive report
   */
  async validateComplete(modules: EducationalModule[]): Promise<ComprehensiveValidationResult> {
    console.log('🔍 Starting comprehensive validation of jaqEdu platform...');
    console.log(`📚 Validating ${modules.length} modules`);
    
    const startTime = performance.now();
    const timestamp = new Date().toISOString();
    
    try {
      // Run all validation types in parallel for efficiency
      console.log('⚡ Running parallel validation checks...');
      const [systemResult, integrationResult, e2eResult] = await Promise.all([
        systemValidator.validateSystem(modules),
        integrationValidator.validateIntegration(modules),
        endToEndValidator.validateEndToEnd(modules)
      ]);
      
      const duration = performance.now() - startTime;
      console.log(`✅ Validation completed in ${duration.toFixed(2)}ms`);
      
      // Calculate comprehensive results
      const result = this.synthesizeResults(
        timestamp,
        modules.length,
        systemResult,
        integrationResult,
        e2eResult
      );
      
      console.log(`📊 Overall Score: ${result.overallScore}/100 (Grade: ${result.grade})`);
      console.log(`🎯 Status: ${result.status}`);
      
      if (result.summary.criticalIssues.length > 0) {
        console.log(`🚨 Critical Issues: ${result.summary.criticalIssues.length}`);
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Comprehensive validation failed:', error);
      
      return {
        timestamp,
        moduleCount: modules.length,
        overallScore: 0,
        grade: 'F',
        status: 'critical_issues',
        passed: false,
        system: { score: 0, passed: false, moduleResults: 0, criticalIssues: 1 },
        integration: { score: 0, passed: false, totalTests: 0, passedTests: 0, failedTests: 1 },
        endToEnd: { score: 0, passed: false, workflowsPassed: 0, workflowsFailed: 1, criticalIssues: 1 },
        summary: {
          strengths: [],
          weaknesses: ['Validation system failure'],
          criticalIssues: [`Validation failed: ${error}`],
          recommendations: ['Fix validation system errors', 'Review system stability'],
          nextSteps: ['Debug validation failure', 'Ensure system prerequisites are met']
        },
        metrics: {
          performance: 0,
          security: 0,
          accessibility: 0,
          reliability: 0,
          userExperience: 0
        },
        details: {
          systemValidation: null,
          integrationValidation: null,
          endToEndValidation: null
        }
      };
    }
  }
  
  /**
   * Runs quick validation for development purposes
   */
  async validateQuick(modules: EducationalModule[]): Promise<{
    score: number;
    passed: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    console.log('⚡ Running quick validation check...');
    
    try {
      // Run system validation only for quick feedback
      const systemResult = await systemValidator.validateSystem(modules);
      
      const issues: string[] = [];
      const recommendations: string[] = [];
      
      // Extract key issues
      systemResult.errors.forEach(error => {
        issues.push(error);
      });
      
      // Extract key recommendations
      systemResult.recommendations.slice(0, 5).forEach(rec => {
        recommendations.push(rec.message);
      });
      
      const score = systemResult.overall.score;
      const passed = systemResult.isValid;
      
      console.log(`📊 Quick validation score: ${score}/100 ${passed ? '✅' : '❌'}`);
      
      return {
        score,
        passed,
        issues,
        recommendations
      };
      
    } catch (error) {
      console.error('❌ Quick validation failed:', error);
      return {
        score: 0,
        passed: false,
        issues: [`Validation failed: ${error}`],
        recommendations: ['Fix validation system errors']
      };
    }
  }
  
  /**
   * Validates specific aspects of the system
   */
  async validateAspect(
    modules: EducationalModule[],
    aspect: 'system' | 'integration' | 'e2e' | 'performance' | 'security' | 'accessibility'
  ): Promise<any> {
    console.log(`🔍 Running ${aspect} validation...`);
    
    switch (aspect) {
      case 'system':
        return await systemValidator.validateSystem(modules);
      
      case 'integration':
        return await integrationValidator.validateIntegration(modules);
      
      case 'e2e':
        return await endToEndValidator.validateEndToEnd(modules);
      
      case 'performance':
        const e2eResult = await endToEndValidator.validateEndToEnd(modules);
        return e2eResult.performanceMetrics;
      
      case 'security':
        const securityResult = await endToEndValidator.validateEndToEnd(modules);
        return securityResult.securityValidation;
      
      case 'accessibility':
        const accessibilityResult = await endToEndValidator.validateEndToEnd(modules);
        return accessibilityResult.accessibilityValidation;
      
      default:
        throw new Error(`Unknown validation aspect: ${aspect}`);
    }
  }
  
  /**
   * Generates a validation report in different formats
   */
  async generateReport(
    result: ComprehensiveValidationResult,
    format: 'summary' | 'detailed' | 'json' | 'markdown' = 'summary'
  ): Promise<string> {
    switch (format) {
      case 'summary':
        return this.generateSummaryReport(result);
      
      case 'detailed':
        return this.generateDetailedReport(result);
      
      case 'json':
        return JSON.stringify(result, null, 2);
      
      case 'markdown':
        return this.generateMarkdownReport(result);
      
      default:
        return this.generateSummaryReport(result);
    }
  }
  
  /**
   * Synthesizes results from all validation types
   */
  private synthesizeResults(
    timestamp: string,
    moduleCount: number,
    systemResult: any,
    integrationResult: any,
    e2eResult: any
  ): ComprehensiveValidationResult {
    
    // Calculate overall score (weighted average)
    const weights = { system: 0.4, integration: 0.3, e2e: 0.3 };
    const overallScore = Math.round(
      systemResult.overall.score * weights.system +
      integrationResult.overall.score * weights.integration +
      e2eResult.overall.score * weights.e2e
    );
    
    // Determine grade and status
    const grade = this.calculateGrade(overallScore);
    const status = this.determineStatus(overallScore, systemResult, integrationResult, e2eResult);
    const passed = overallScore >= 70 && 
                   systemResult.isValid && 
                   integrationResult.overall.passed && 
                   e2eResult.overall.passed;
    
    // Extract summary information
    const summary = this.generateSummary(systemResult, integrationResult, e2eResult);
    
    // Extract metrics
    const metrics = {
      performance: e2eResult.performanceMetrics.overallScore,
      security: e2eResult.securityValidation.overallScore,
      accessibility: e2eResult.accessibilityValidation.overallScore,
      reliability: e2eResult.reliabilityMetrics.overallScore,
      userExperience: e2eResult.workflows.length > 0 
        ? e2eResult.workflows.reduce((sum: number, w: any) => sum + w.userExperienceScore, 0) / e2eResult.workflows.length
        : 0
    };
    
    return {
      timestamp,
      moduleCount,
      overallScore,
      grade,
      status,
      passed,
      
      system: {
        score: systemResult.overall.score,
        passed: systemResult.isValid,
        moduleResults: systemResult.modules.length,
        criticalIssues: systemResult.errors.length
      },
      
      integration: {
        score: integrationResult.overall.score,
        passed: integrationResult.overall.passed,
        totalTests: integrationResult.overall.totalTests,
        passedTests: integrationResult.overall.passedTests,
        failedTests: integrationResult.overall.failedTests
      },
      
      endToEnd: {
        score: e2eResult.overall.score,
        passed: e2eResult.overall.passed,
        workflowsPassed: e2eResult.workflows.filter((w: any) => w.passed).length,
        workflowsFailed: e2eResult.workflows.filter((w: any) => !w.passed).length,
        criticalIssues: e2eResult.criticalIssues.length
      },
      
      summary,
      metrics,
      
      details: {
        systemValidation: systemResult,
        integrationValidation: integrationResult,
        endToEndValidation: e2eResult
      }
    };
  }
  
  private calculateGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }
  
  private determineStatus(
    overallScore: number,
    systemResult: any,
    integrationResult: any,
    e2eResult: any
  ): 'production_ready' | 'staging_ready' | 'development_ready' | 'needs_work' | 'critical_issues' {
    
    const hasCriticalIssues = 
      systemResult.errors.length > 0 ||
      e2eResult.criticalIssues.filter((issue: any) => issue.severity === 'critical').length > 0;
    
    if (hasCriticalIssues) {
      return 'critical_issues';
    }
    
    if (overallScore >= 90 && systemResult.isValid && integrationResult.overall.passed) {
      return 'production_ready';
    }
    
    if (overallScore >= 80) {
      return 'staging_ready';
    }
    
    if (overallScore >= 70) {
      return 'development_ready';
    }
    
    return 'needs_work';
  }
  
  private generateSummary(systemResult: any, integrationResult: any, e2eResult: any) {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const criticalIssues: string[] = [];
    const recommendations: string[] = [];
    const nextSteps: string[] = [];
    
    // Identify strengths
    if (systemResult.overall.score >= 80) {
      strengths.push('Strong module content quality');
    }
    if (integrationResult.overall.score >= 80) {
      strengths.push('Robust system integration');
    }
    if (e2eResult.performanceMetrics.overallScore >= 80) {
      strengths.push('Good performance characteristics');
    }
    if (e2eResult.securityValidation.overallScore >= 85) {
      strengths.push('Strong security posture');
    }
    if (e2eResult.accessibilityValidation.overallScore >= 85) {
      strengths.push('Good accessibility compliance');
    }
    
    // Identify weaknesses
    if (systemResult.overall.score < 70) {
      weaknesses.push('Module content quality needs improvement');
    }
    if (integrationResult.overall.score < 70) {
      weaknesses.push('System integration issues detected');
    }
    if (e2eResult.performanceMetrics.overallScore < 70) {
      weaknesses.push('Performance optimization needed');
    }
    if (e2eResult.securityValidation.overallScore < 80) {
      weaknesses.push('Security enhancements required');
    }
    if (e2eResult.accessibilityValidation.overallScore < 80) {
      weaknesses.push('Accessibility improvements needed');
    }
    
    // Extract critical issues
    systemResult.errors.forEach((error: any) => {
      criticalIssues.push(error);
    });
    
    e2eResult.criticalIssues.forEach((issue: any) => {
      if (issue.severity === 'critical') {
        criticalIssues.push(issue.title);
      }
    });
    
    // Extract top recommendations
    const allRecommendations = [
      ...systemResult.recommendations,
      ...integrationResult.recommendations,
      ...e2eResult.recommendations
    ];
    
    allRecommendations
      .sort((a: any, b: any) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
               (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
      })
      .slice(0, 5)
      .forEach((rec: any) => {
        recommendations.push(rec.title || rec.message);
      });
    
    // Generate next steps
    if (criticalIssues.length > 0) {
      nextSteps.push('Address all critical issues before proceeding');
      nextSteps.push('Focus on system stability and reliability');
    } else if (weaknesses.length > 2) {
      nextSteps.push('Prioritize improvement of identified weaknesses');
      nextSteps.push('Implement recommended enhancements');
    } else {
      nextSteps.push('Continue monitoring and iterative improvement');
      nextSteps.push('Prepare for production deployment');
    }
    
    return {
      strengths,
      weaknesses,
      criticalIssues,
      recommendations,
      nextSteps
    };
  }
  
  private generateSummaryReport(result: ComprehensiveValidationResult): string {
    return `
jaqEdu Platform Validation Report - Summary
==========================================

Generated: ${result.timestamp}
Modules Validated: ${result.moduleCount}

OVERALL RESULTS
--------------
Score: ${result.overallScore}/100 (Grade: ${result.grade})
Status: ${result.status.replace(/_/g, ' ').toUpperCase()}
Validation: ${result.passed ? 'PASSED' : 'FAILED'}

COMPONENT SCORES
---------------
System Quality: ${result.system.score}/100 ${result.system.passed ? '✅' : '❌'}
Integration: ${result.integration.score}/100 ${result.integration.passed ? '✅' : '❌'}
End-to-End: ${result.endToEnd.score}/100 ${result.endToEnd.passed ? '✅' : '❌'}

KEY METRICS
-----------
Performance: ${result.metrics.performance}/100
Security: ${result.metrics.security}/100
Accessibility: ${result.metrics.accessibility}/100
Reliability: ${result.metrics.reliability}/100
User Experience: ${result.metrics.userExperience}/100

${result.summary.criticalIssues.length > 0 ? `
CRITICAL ISSUES (${result.summary.criticalIssues.length})
${result.summary.criticalIssues.map(issue => `• ${issue}`).join('\n')}
` : ''}

TOP RECOMMENDATIONS
------------------
${result.summary.recommendations.slice(0, 3).map(rec => `• ${rec}`).join('\n')}

NEXT STEPS
----------
${result.summary.nextSteps.map(step => `• ${step}`).join('\n')}
`;
  }
  
  private generateDetailedReport(result: ComprehensiveValidationResult): string {
    const summary = this.generateSummaryReport(result);
    
    return `${summary}

DETAILED BREAKDOWN
==================

STRENGTHS
---------
${result.summary.strengths.map(strength => `✅ ${strength}`).join('\n') || 'None identified'}

WEAKNESSES
----------
${result.summary.weaknesses.map(weakness => `⚠️ ${weakness}`).join('\n') || 'None identified'}

SYSTEM VALIDATION DETAILS
-------------------------
Modules Analyzed: ${result.system.moduleResults}
Critical Issues: ${result.system.criticalIssues}

INTEGRATION VALIDATION DETAILS
------------------------------
Total Tests: ${result.integration.totalTests}
Passed: ${result.integration.passedTests}
Failed: ${result.integration.failedTests}

END-TO-END VALIDATION DETAILS
-----------------------------
Workflows Passed: ${result.endToEnd.workflowsPassed}
Workflows Failed: ${result.endToEnd.workflowsFailed}
Critical Issues: ${result.endToEnd.criticalIssues}

ALL RECOMMENDATIONS
------------------
${result.summary.recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n')}
`;
  }
  
  private generateMarkdownReport(result: ComprehensiveValidationResult): string {
    return `# jaqEdu Platform Validation Report

**Generated:** ${result.timestamp}  
**Modules Validated:** ${result.moduleCount}

## 📊 Overall Results

| Metric | Score | Status |
|--------|-------|--------|
| **Overall Score** | **${result.overallScore}/100** | **${result.grade}** |
| System Quality | ${result.system.score}/100 | ${result.system.passed ? '✅' : '❌'} |
| Integration | ${result.integration.score}/100 | ${result.integration.passed ? '✅' : '❌'} |
| End-to-End | ${result.endToEnd.score}/100 | ${result.endToEnd.passed ? '✅' : '❌'} |

**Platform Status:** \`${result.status.replace(/_/g, ' ').toUpperCase()}\`

## 📈 Key Metrics

| Category | Score |
|----------|-------|
| Performance | ${result.metrics.performance}/100 |
| Security | ${result.metrics.security}/100 |
| Accessibility | ${result.metrics.accessibility}/100 |
| Reliability | ${result.metrics.reliability}/100 |
| User Experience | ${result.metrics.userExperience}/100 |

${result.summary.criticalIssues.length > 0 ? `
## 🚨 Critical Issues

${result.summary.criticalIssues.map(issue => `- ❌ ${issue}`).join('\n')}
` : ''}

## ✅ Strengths

${result.summary.strengths.map(strength => `- ✅ ${strength}`).join('\n') || '- No specific strengths identified'}

## ⚠️ Areas for Improvement

${result.summary.weaknesses.map(weakness => `- ⚠️ ${weakness}`).join('\n') || '- No significant weaknesses identified'}

## 💡 Recommendations

${result.summary.recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n')}

## 🎯 Next Steps

${result.summary.nextSteps.map(step => `- [ ] ${step}`).join('\n')}

---

*Generated by jaqEdu Validation System*
`;
  }
}

// Export singleton instance
export const validationService = new ValidationService();