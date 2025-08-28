/**
 * Test Results Processor for API Automation Tests
 * Processes and formats test results for reporting
 */

const fs = require('fs');
const path = require('path');

module.exports = (results) => {
  // Create reports directory if it doesn't exist
  const reportsDir = path.join(__dirname, 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  // Process test results
  const summary = {
    timestamp: new Date().toISOString(),
    totalTests: results.numTotalTests,
    passedTests: results.numPassedTests,
    failedTests: results.numFailedTests,
    pendingTests: results.numPendingTests,
    runtime: results.testResults.reduce((total, result) => total + result.perfStats.runtime, 0),
    testSuites: results.testResults.map(result => ({
      name: result.testFilePath.split('/').pop(),
      tests: result.numPassingTests + result.numFailingTests + result.numPendingTests,
      passed: result.numPassingTests,
      failed: result.numFailingTests,
      pending: result.numPendingTests,
      runtime: result.perfStats.runtime,
      errors: result.testResults.filter(test => test.status === 'failed').map(test => ({
        title: test.title,
        message: test.failureMessages.join('\n'),
        location: test.location
      }))
    }))
  };
  
  // Write detailed JSON report
  fs.writeFileSync(
    path.join(reportsDir, 'api-test-summary.json'),
    JSON.stringify(summary, null, 2)
  );
  
  // Write human-readable report
  const humanReport = generateHumanReport(summary);
  fs.writeFileSync(
    path.join(reportsDir, 'api-test-report.txt'),
    humanReport
  );
  
  // Write CSV for data analysis
  const csvReport = generateCsvReport(summary);
  fs.writeFileSync(
    path.join(reportsDir, 'api-test-results.csv'),
    csvReport
  );
  
  // Console output
  console.log('\n📊 API Test Results Summary:');
  console.log(`✅ Passed: ${results.numPassedTests}`);
  console.log(`❌ Failed: ${results.numFailedTests}`);
  console.log(`⏸️  Pending: ${results.numPendingTests}`);
  console.log(`⏱️  Total Runtime: ${Math.round(summary.runtime)}ms`);
  console.log(`📁 Reports saved to: ${reportsDir}`);
  
  // Return results for Jest
  return results;
};

function generateHumanReport(summary) {
  let report = '';
  
  report += '='.repeat(60) + '\n';
  report += 'API AUTOMATION TEST RESULTS\n';
  report += '='.repeat(60) + '\n';
  report += `Test Run: ${summary.timestamp}\n`;
  report += `Total Tests: ${summary.totalTests}\n`;
  report += `Passed: ${summary.passedTests}\n`;
  report += `Failed: ${summary.failedTests}\n`;
  report += `Pending: ${summary.pendingTests}\n`;
  report += `Total Runtime: ${Math.round(summary.runtime)}ms\n`;
  report += '\n';
  
  // Test suite details
  report += 'TEST SUITE BREAKDOWN:\n';
  report += '-'.repeat(40) + '\n';
  
  summary.testSuites.forEach(suite => {
    report += `📁 ${suite.name}\n`;
    report += `   Tests: ${suite.tests} | Passed: ${suite.passed} | Failed: ${suite.failed} | Pending: ${suite.pending}\n`;
    report += `   Runtime: ${Math.round(suite.runtime)}ms\n`;
    
    if (suite.errors.length > 0) {
      report += `   Errors:\n`;
      suite.errors.forEach(error => {
        report += `   - ${error.title}: ${error.message.split('\n')[0]}\n`;
      });
    }
    report += '\n';
  });
  
  // Performance analysis
  const slowestSuite = summary.testSuites.reduce((prev, current) => 
    (prev.runtime > current.runtime) ? prev : current
  );
  
  report += 'PERFORMANCE ANALYSIS:\n';
  report += '-'.repeat(40) + '\n';
  report += `Slowest Test Suite: ${slowestSuite.name} (${Math.round(slowestSuite.runtime)}ms)\n`;
  report += `Average Suite Runtime: ${Math.round(summary.runtime / summary.testSuites.length)}ms\n`;
  
  // Recommendations
  if (summary.failedTests > 0) {
    report += '\nRECOMMendations:\n';
    report += '-'.repeat(40) + '\n';
    report += '• Review failed test cases and error messages\n';
    report += '• Check API server logs for additional context\n';
    report += '• Verify test environment configuration\n';
    report += '• Consider increasing timeouts for flaky tests\n';
  }
  
  return report;
}

function generateCsvReport(summary) {
  let csv = 'Test Suite,Total Tests,Passed,Failed,Pending,Runtime (ms),Success Rate\n';
  
  summary.testSuites.forEach(suite => {
    const successRate = suite.tests > 0 ? ((suite.passed / suite.tests) * 100).toFixed(1) : '0';
    csv += `"${suite.name}",${suite.tests},${suite.passed},${suite.failed},${suite.pending},${Math.round(suite.runtime)},${successRate}%\n`;
  });
  
  return csv;
}
