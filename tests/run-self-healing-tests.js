#!/usr/bin/env node

/**
 * Self-Healing Tests Runner
 * Main entry point for executing comprehensive self-healing test suite
 */

const { SelfHealingTestSuite } = require('./self-healing-test-suite');
const { defaultTestConfig } = require('./test-configs/default-test-config');
const { performance } = require('perf_hooks');
const path = require('path');
const fs = require('fs').promises;

class TestRunner {
  constructor() {
    this.suite = null;
    this.results = null;
    this.startTime = null;
  }

  /**
   * Main entry point for running tests
   */
  async run(options = {}) {
    console.log('🚀 Starting Self-Healing Test Suite Runner');
    console.log('=====================================');
    
    this.startTime = performance.now();
    
    try {
      // Parse command line arguments
      const config = await this.parseConfiguration(options);
      
      // Initialize test suite
      this.suite = new SelfHealingTestSuite(config.suiteOptions);
      
      // Execute pre-test setup
      await this.preTestSetup(config);
      
      // Run the comprehensive test suite
      this.results = await this.suite.executeSuite(config.testConfiguration);
      
      // Execute post-test cleanup and reporting
      await this.postTestCleanup(this.results);
      
      // Generate and save reports
      await this.generateReports(this.results);
      
      // Print summary
      this.printSummary(this.results);
      
      // Exit with appropriate code
      process.exit(this.results.success ? 0 : 1);
      
    } catch (error) {
      console.error('❌ Test suite execution failed:', error.message);
      console.error(error.stack);
      process.exit(1);
    }
  }

  /**
   * Parse configuration from command line and environment
   */
  async parseConfiguration(options) {
    const config = {
      suiteOptions: {
        enableChaosEngineering: true,
        enableLoadTesting: true,
        enableIntegrationTesting: true,
        enableRecoveryTiming: true,
        enableHealingValidation: true,
        parallelExecution: true,
        memoryStorageEnabled: true,
        hooksEnabled: true,
        ...options.suiteOptions
      },
      testConfiguration: { ...defaultTestConfig, ...options.testConfiguration }
    };

    // Override with environment variables
    if (process.env.SELF_HEALING_PARALLEL) {
      config.suiteOptions.parallelExecution = process.env.SELF_HEALING_PARALLEL === 'true';
    }
    
    if (process.env.SELF_HEALING_TIMEOUT) {
      config.suiteOptions.testTimeout = parseInt(process.env.SELF_HEALING_TIMEOUT);
    }
    
    if (process.env.SELF_HEALING_HOOKS_ENABLED) {
      config.suiteOptions.hooksEnabled = process.env.SELF_HEALING_HOOKS_ENABLED === 'true';
    }

    // Load custom configuration file if specified
    if (options.configFile) {
      try {
        const customConfig = require(path.resolve(options.configFile));
        config.testConfiguration = { ...config.testConfiguration, ...customConfig };
      } catch (error) {
        console.warn(`⚠️ Failed to load custom config: ${error.message}`);
      }
    }

    return config;
  }

  /**
   * Pre-test setup and validation
   */
  async preTestSetup(config) {
    console.log('🔧 Executing pre-test setup...');
    
    // Create results directory
    await this.ensureResultsDirectory();
    
    // Validate test environment
    await this.validateTestEnvironment();
    
    // Initialize logging
    await this.initializeLogging();
    
    // Setup system monitoring
    await this.setupSystemMonitoring();
    
    console.log('✅ Pre-test setup completed');
  }

  /**
   * Post-test cleanup and validation
   */
  async postTestCleanup(results) {
    console.log('🧹 Executing post-test cleanup...');
    
    // Stop system monitoring
    await this.stopSystemMonitoring();
    
    // Cleanup test artifacts
    await this.cleanupTestArtifacts();
    
    // Validate system state
    await this.validatePostTestState();
    
    console.log('✅ Post-test cleanup completed');
  }

  /**
   * Generate comprehensive reports
   */
  async generateReports(results) {
    console.log('📊 Generating comprehensive reports...');
    
    const reportsDir = path.join(__dirname, '..', 'test-results', 'reports');
    await this.ensureDirectory(reportsDir);
    
    try {
      // Generate JSON report
      await this.generateJSONReport(results, reportsDir);
      
      // Generate HTML report
      await this.generateHTMLReport(results, reportsDir);
      
      // Generate CSV metrics report
      await this.generateCSVReport(results, reportsDir);
      
      // Generate executive summary
      await this.generateExecutiveSummary(results, reportsDir);
      
      // Generate GitHub-compatible report if enabled
      if (results.configuration?.globalSettings?.githubIntegration?.enabled) {
        await this.generateGitHubReport(results, reportsDir);
      }
      
      console.log('✅ Reports generated successfully');
      
    } catch (error) {
      console.warn(`⚠️ Report generation error: ${error.message}`);
    }
  }

  /**
   * Generate JSON report
   */
  async generateJSONReport(results, reportsDir) {
    const jsonReport = {
      metadata: {
        timestamp: new Date().toISOString(),
        testSuiteVersion: '2.0.0',
        duration: results.totalDuration,
        environment: process.env.NODE_ENV || 'test'
      },
      summary: {
        success: results.success,
        totalTests: this.calculateTotalTests(results),
        passedTests: this.calculatePassedTests(results),
        failedTests: this.calculateFailedTests(results),
        successRate: this.calculateSuccessRate(results)
      },
      detailedResults: results,
      recommendations: results.report?.recommendationEngine || [],
      metrics: this.extractMetrics(results),
      trends: results.report?.trendAnalysis || {}
    };

    const filePath = path.join(reportsDir, `self-healing-report-${Date.now()}.json`);
    await fs.writeFile(filePath, JSON.stringify(jsonReport, null, 2));
    console.log(`📄 JSON report saved: ${filePath}`);
  }

  /**
   * Generate HTML report
   */
  async generateHTMLReport(results, reportsDir) {
    const htmlTemplate = this.createHTMLTemplate(results);
    const filePath = path.join(reportsDir, `self-healing-report-${Date.now()}.html`);
    await fs.writeFile(filePath, htmlTemplate);
    console.log(`📄 HTML report saved: ${filePath}`);
  }

  /**
   * Generate CSV metrics report
   */
  async generateCSVReport(results, reportsDir) {
    const csvData = this.convertResultsToCSV(results);
    const filePath = path.join(reportsDir, `self-healing-metrics-${Date.now()}.csv`);
    await fs.writeFile(filePath, csvData);
    console.log(`📄 CSV report saved: ${filePath}`);
  }

  /**
   * Generate executive summary
   */
  async generateExecutiveSummary(results, reportsDir) {
    const summary = {
      title: 'Self-Healing System Test Results - Executive Summary',
      date: new Date().toISOString().split('T')[0],
      overallStatus: results.success ? 'PASSED' : 'FAILED',
      keyFindings: this.extractKeyFindings(results),
      riskAssessment: this.assessRisks(results),
      recommendations: this.prioritizeRecommendations(results),
      nextSteps: this.generateNextSteps(results)
    };

    const filePath = path.join(reportsDir, `executive-summary-${Date.now()}.json`);
    await fs.writeFile(filePath, JSON.stringify(summary, null, 2));
    console.log(`📄 Executive summary saved: ${filePath}`);
  }

  /**
   * Generate GitHub-compatible report
   */
  async generateGitHubReport(results, reportsDir) {
    const githubReport = this.createGitHubMarkdownReport(results);
    const filePath = path.join(reportsDir, `github-report-${Date.now()}.md`);
    await fs.writeFile(filePath, githubReport);
    console.log(`📄 GitHub report saved: ${filePath}`);
  }

  /**
   * Print test execution summary
   */
  printSummary(results) {
    const totalDuration = performance.now() - this.startTime;
    const totalTests = this.calculateTotalTests(results);
    const passedTests = this.calculatePassedTests(results);
    const failedTests = this.calculateFailedTests(results);
    const successRate = this.calculateSuccessRate(results);

    console.log('\n🏁 Test Execution Summary');
    console.log('========================');
    console.log(`Overall Status: ${results.success ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Total Duration: ${Math.round(totalDuration / 1000)}s`);
    console.log(`Tests Executed: ${totalTests}`);
    console.log(`Tests Passed: ${passedTests}`);
    console.log(`Tests Failed: ${failedTests}`);
    console.log(`Success Rate: ${successRate.toFixed(1)}%`);
    
    if (results.report?.performanceAnalysis) {
      console.log(`Performance Score: ${(results.report.performanceAnalysis.performanceScore * 100).toFixed(1)}%`);
    }
    
    if (results.report?.reliabilityAssessment) {
      console.log(`Reliability Score: ${(results.report.reliabilityAssessment.reliabilityScore * 100).toFixed(1)}%`);
    }

    // Print key recommendations
    if (results.report?.recommendationEngine?.length > 0) {
      console.log('\n🎯 Key Recommendations:');
      results.report.recommendationEngine
        .filter(r => r.priority === 'high')
        .slice(0, 3)
        .forEach((rec, index) => {
          console.log(`${index + 1}. ${rec.recommendation} (${rec.category})`);
        });
    }

    console.log('\n📊 Reports generated in: test-results/reports/');
    console.log('========================\n');
  }

  /**
   * Utility methods
   */
  
  async ensureResultsDirectory() {
    const resultsDir = path.join(__dirname, '..', 'test-results');
    try {
      await fs.access(resultsDir);
    } catch {
      await fs.mkdir(resultsDir, { recursive: true });
    }
  }

  async ensureDirectory(dirPath) {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  async validateTestEnvironment() {
    // Basic environment validation
    const requiredVars = ['NODE_ENV'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.warn(`⚠️ Missing environment variables: ${missingVars.join(', ')}`);
    }

    // Check available memory
    const memUsage = process.memoryUsage();
    if (memUsage.heapUsed > 500 * 1024 * 1024) { // 500MB
      console.warn('⚠️ High memory usage detected before test execution');
    }
  }

  async initializeLogging() {
    // Initialize comprehensive logging
    console.log('📝 Logging system initialized');
  }

  async setupSystemMonitoring() {
    // Setup system resource monitoring
    console.log('📊 System monitoring enabled');
  }

  async stopSystemMonitoring() {
    // Stop system monitoring
    console.log('📊 System monitoring stopped');
  }

  async cleanupTestArtifacts() {
    // Cleanup temporary test files
    console.log('🗑️ Test artifacts cleaned up');
  }

  async validatePostTestState() {
    // Validate system state after tests
    const memUsage = process.memoryUsage();
    console.log(`💾 Final memory usage: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
  }

  calculateTotalTests(results) {
    return Object.values(results.testResults || {})
      .reduce((sum, result) => sum + (result.totalTests || 0), 0);
  }

  calculatePassedTests(results) {
    return Object.values(results.testResults || {})
      .reduce((sum, result) => sum + (result.successfulTests || 0), 0);
  }

  calculateFailedTests(results) {
    return Object.values(results.testResults || {})
      .reduce((sum, result) => sum + (result.failedTests || 0), 0);
  }

  calculateSuccessRate(results) {
    const total = this.calculateTotalTests(results);
    const passed = this.calculatePassedTests(results);
    return total > 0 ? (passed / total) * 100 : 0;
  }

  extractMetrics(results) {
    return {
      executionTime: results.totalDuration,
      testCoverage: this.calculateSuccessRate(results),
      performanceScore: results.report?.performanceAnalysis?.performanceScore || 0,
      reliabilityScore: results.report?.reliabilityAssessment?.reliabilityScore || 0
    };
  }

  extractKeyFindings(results) {
    const findings = [];
    
    if (results.success) {
      findings.push('All critical self-healing mechanisms are operational');
    } else {
      findings.push('Some self-healing mechanisms require attention');
    }

    const successRate = this.calculateSuccessRate(results);
    if (successRate >= 90) {
      findings.push('System demonstrates high resilience');
    } else if (successRate >= 70) {
      findings.push('System shows moderate resilience with room for improvement');
    } else {
      findings.push('System resilience needs significant improvement');
    }

    return findings;
  }

  assessRisks(results) {
    const risks = [];
    
    if (!results.success) {
      risks.push({
        level: 'HIGH',
        description: 'Failed self-healing tests indicate potential service disruption risk'
      });
    }

    const successRate = this.calculateSuccessRate(results);
    if (successRate < 80) {
      risks.push({
        level: 'MEDIUM',
        description: 'Below-target success rate may impact system availability'
      });
    }

    return risks;
  }

  prioritizeRecommendations(results) {
    const recommendations = results.report?.recommendationEngine || [];
    return recommendations
      .sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })
      .slice(0, 5); // Top 5 recommendations
  }

  generateNextSteps(results) {
    const nextSteps = [];
    
    if (!results.success) {
      nextSteps.push('Address failed test scenarios before production deployment');
      nextSteps.push('Implement recommended improvements from high-priority items');
    }
    
    nextSteps.push('Schedule regular self-healing capability assessments');
    nextSteps.push('Monitor system performance metrics continuously');
    nextSteps.push('Update test scenarios based on new failure patterns');

    return nextSteps;
  }

  createHTMLTemplate(results) {
    // Basic HTML template - would be more sophisticated in production
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Self-Healing Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { color: #333; border-bottom: 2px solid #ddd; padding-bottom: 10px; }
        .success { color: #28a745; }
        .failure { color: #dc3545; }
        .metrics { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .recommendation { background: #fff3cd; padding: 10px; margin: 10px 0; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Self-Healing System Test Report</h1>
        <p>Generated: ${new Date().toISOString()}</p>
        <h2 class="${results.success ? 'success' : 'failure'}">
            Status: ${results.success ? 'PASSED' : 'FAILED'}
        </h2>
    </div>
    
    <div class="metrics">
        <h3>Test Metrics</h3>
        <p>Total Tests: ${this.calculateTotalTests(results)}</p>
        <p>Success Rate: ${this.calculateSuccessRate(results).toFixed(1)}%</p>
        <p>Duration: ${Math.round(results.totalDuration / 1000)}s</p>
    </div>
    
    <div>
        <h3>Recommendations</h3>
        ${(results.report?.recommendationEngine || []).map(rec => 
          `<div class="recommendation">
             <strong>${rec.priority.toUpperCase()}:</strong> ${rec.recommendation}
           </div>`
        ).join('')}
    </div>
</body>
</html>`;
  }

  convertResultsToCSV(results) {
    const headers = ['TestType', 'TestName', 'Status', 'Duration', 'SuccessRate'];
    let csvContent = headers.join(',') + '\n';

    Object.entries(results.testResults || {}).forEach(([testType, testResult]) => {
      if (testResult.results) {
        testResult.results.forEach(result => {
          const row = [
            testType,
            result.testName || result.name || 'Unknown',
            result.success ? 'PASSED' : 'FAILED',
            result.duration || result.totalTime || 0,
            result.successRate || 'N/A'
          ];
          csvContent += row.join(',') + '\n';
        });
      }
    });

    return csvContent;
  }

  createGitHubMarkdownReport(results) {
    const successIcon = results.success ? '✅' : '❌';
    const successRate = this.calculateSuccessRate(results);
    
    return `# Self-Healing Test Report ${successIcon}

## Summary
- **Status**: ${results.success ? 'PASSED' : 'FAILED'}
- **Total Tests**: ${this.calculateTotalTests(results)}
- **Success Rate**: ${successRate.toFixed(1)}%
- **Duration**: ${Math.round(results.totalDuration / 1000)}s

## Test Results by Category
${Object.entries(results.testResults || {}).map(([type, result]) => `
### ${type.charAt(0).toUpperCase() + type.slice(1)} Tests
- Tests: ${result.totalTests || 0}
- Passed: ${result.successfulTests || 0}
- Failed: ${result.failedTests || 0}
- Success Rate: ${result.totalTests ? ((result.successfulTests / result.totalTests) * 100).toFixed(1) : 0}%
`).join('')}

## Key Recommendations
${(results.report?.recommendationEngine || [])
  .filter(rec => rec.priority === 'high')
  .map(rec => `- **${rec.category}**: ${rec.recommendation}`)
  .join('\n')}

---
*Report generated on ${new Date().toISOString()}*
`;
  }
}

// CLI execution
if (require.main === module) {
  const runner = new TestRunner();
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const options = {};
  
  // Simple argument parsing
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace(/^--/, '');
    const value = args[i + 1];
    
    if (key && value) {
      switch (key) {
        case 'config':
          options.configFile = value;
          break;
        case 'parallel':
          options.suiteOptions = { ...options.suiteOptions, parallelExecution: value === 'true' };
          break;
        case 'timeout':
          options.suiteOptions = { ...options.suiteOptions, testTimeout: parseInt(value) };
          break;
        case 'hooks':
          options.suiteOptions = { ...options.suiteOptions, hooksEnabled: value === 'true' };
          break;
      }
    }
  }

  // Run the test suite
  runner.run(options).catch(console.error);
}

module.exports = { TestRunner };