/**
 * Jest Test Results Processor
 * Processes test results and generates additional reports
 */

const fs = require('fs');
const path = require('path');

module.exports = (results) => {
  // Create coverage directory if it doesn't exist
  const coverageDir = path.join(process.cwd(), 'coverage');
  if (!fs.existsSync(coverageDir)) {
    fs.mkdirSync(coverageDir, { recursive: true });
  }
  
  // Generate summary report
  const summary = {
    timestamp: new Date().toISOString(),
    success: results.success,
    totalTests: results.numTotalTests,
    passedTests: results.numPassedTests,
    failedTests: results.numFailedTests,
    pendingTests: results.numPendingTests,
    testSuites: results.numTotalTestSuites,
    passedTestSuites: results.numPassedTestSuites,
    failedTestSuites: results.numFailedTestSuites,
    runtime: results.testResults.reduce((total, suite) => total + (suite.perfStats?.runtime || 0), 0),
    coverage: results.coverageMap ? {
      statements: results.coverageMap.getCoverageSummary().statements.pct,
      branches: results.coverageMap.getCoverageSummary().branches.pct,
      functions: results.coverageMap.getCoverageSummary().functions.pct,
      lines: results.coverageMap.getCoverageSummary().lines.pct
    } : null
  };
  
  // Write summary to file
  fs.writeFileSync(
    path.join(coverageDir, 'test-summary.json'),
    JSON.stringify(summary, null, 2)
  );
  
  // Generate detailed results
  const detailedResults = {
    summary,
    testSuites: results.testResults.map(suite => ({
      name: suite.testFilePath.replace(process.cwd(), ''),
      status: suite.numFailingTests > 0 ? 'failed' : 'passed',
      runtime: suite.perfStats?.runtime || 0,
      tests: suite.testResults.map(test => ({
        name: test.fullName,
        status: test.status,
        duration: test.duration || 0,
        error: test.failureMessages?.length > 0 ? test.failureMessages[0] : null
      }))
    }))
  };
  
  fs.writeFileSync(
    path.join(coverageDir, 'detailed-results.json'),
    JSON.stringify(detailedResults, null, 2)
  );
  
  // Log summary to console
  console.log('\n' + '='.repeat(50));
  console.log('TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${summary.totalTests}`);
  console.log(`Passed: ${summary.passedTests}`);
  console.log(`Failed: ${summary.failedTests}`);
  console.log(`Pending: ${summary.pendingTests}`);
  console.log(`Runtime: ${(summary.runtime / 1000).toFixed(2)}s`);
  
  if (summary.coverage) {
    console.log('\nCOVERAGE:');
    console.log(`Statements: ${summary.coverage.statements.toFixed(2)}%`);
    console.log(`Branches: ${summary.coverage.branches.toFixed(2)}%`);
    console.log(`Functions: ${summary.coverage.functions.toFixed(2)}%`);
    console.log(`Lines: ${summary.coverage.lines.toFixed(2)}%`);
  }
  
  console.log('='.repeat(50) + '\n');
  
  return results;
};
