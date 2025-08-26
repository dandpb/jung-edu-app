/**
 * Report Manager for E2E Tests
 * 
 * Handles test result processing and reporting including:
 * - Test result archiving
 * - Summary report generation
 * - Performance metrics collection
 * - Artifact organization
 */

import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  testName: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  screenshots?: string[];
  videos?: string[];
  traces?: string[];
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  startTime: string;
  endTime: string;
  totalDuration: number;
  passCount: number;
  failCount: number;
  skipCount: number;
}

interface SummaryReport {
  timestamp: string;
  environment: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  successRate: number;
  totalDuration: number;
  averageDuration: number;
  suites: TestSuite[];
  artifacts: {
    screenshots: number;
    videos: number;
    traces: number;
  };
  topFailures: Array<{
    test: string;
    error: string;
    frequency: number;
  }>;
}

export class ReportManager {
  private reportsDir = './tests/e2e/reports';
  private artifactsDir = './tests/e2e/artifacts';
  private archiveDir = './tests/e2e/archive';

  constructor() {
    this.ensureDirectories();
  }

  /**
   * Archive current test results
   */
  async archiveResults(): Promise<void> {
    console.log('📦 Archiving test results...');

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const archiveFolder = path.join(this.archiveDir, `run-${timestamp}`);

      // Create archive folder
      await fs.promises.mkdir(archiveFolder, { recursive: true });

      // Archive HTML report
      await this.archiveDirectory(
        path.join(this.reportsDir, 'html'),
        path.join(archiveFolder, 'html-report')
      );

      // Archive JSON results
      await this.archiveFile(
        path.join(this.reportsDir, 'test-results.json'),
        path.join(archiveFolder, 'test-results.json')
      );

      // Archive JUnit XML
      await this.archiveFile(
        path.join(this.reportsDir, 'junit.xml'),
        path.join(archiveFolder, 'junit.xml')
      );

      // Archive screenshots
      await this.archiveDirectory(
        './tests/e2e/screenshots',
        path.join(archiveFolder, 'screenshots')
      );

      // Archive videos
      await this.archiveDirectory(
        './tests/e2e/videos',
        path.join(archiveFolder, 'videos')
      );

      // Create manifest file
      await this.createArchiveManifest(archiveFolder, timestamp);

      console.log(`✅ Results archived to: ${archiveFolder}`);
    } catch (error) {
      console.error('❌ Failed to archive results:', error);
      throw error;
    }
  }

  /**
   * Generate comprehensive summary report
   */
  async generateSummaryReport(): Promise<void> {
    console.log('📊 Generating summary report...');

    try {
      // Load test results from JSON report
      const resultsPath = path.join(this.reportsDir, 'test-results.json');
      let testResults: any = null;

      if (fs.existsSync(resultsPath)) {
        const resultsData = await fs.promises.readFile(resultsPath, 'utf8');
        testResults = JSON.parse(resultsData);
      }

      // Process results and generate summary
      const summary = await this.processTestResults(testResults);

      // Save summary report
      const summaryPath = path.join(this.reportsDir, 'summary-report.json');
      await fs.promises.writeFile(
        summaryPath,
        JSON.stringify(summary, null, 2)
      );

      // Generate HTML summary
      await this.generateHTMLSummary(summary);

      // Generate markdown summary
      await this.generateMarkdownSummary(summary);

      console.log('✅ Summary report generated');
    } catch (error) {
      console.error('❌ Failed to generate summary report:', error);
      throw error;
    }
  }

  /**
   * Process test results and create summary
   */
  private async processTestResults(testResults: any): Promise<SummaryReport> {
    const timestamp = new Date().toISOString();
    let totalTests = 0;
    let passed = 0;
    let failed = 0;
    let skipped = 0;
    let totalDuration = 0;
    const suites: TestSuite[] = [];
    const failureMap = new Map<string, number>();

    if (testResults && testResults.suites) {
      for (const suite of testResults.suites) {
        const suiteData: TestSuite = {
          name: suite.title || 'Unknown Suite',
          tests: [],
          startTime: suite.startTime || timestamp,
          endTime: suite.endTime || timestamp,
          totalDuration: 0,
          passCount: 0,
          failCount: 0,
          skipCount: 0,
        };

        if (suite.specs) {
          for (const spec of suite.specs) {
            totalTests++;
            const testResult: TestResult = {
              testName: spec.title || 'Unknown Test',
              status: spec.status || 'skipped',
              duration: spec.duration || 0,
              error: spec.error?.message,
              screenshots: spec.screenshots || [],
              videos: spec.videos || [],
              traces: spec.traces || [],
            };

            suiteData.tests.push(testResult);
            suiteData.totalDuration += testResult.duration;
            totalDuration += testResult.duration;

            switch (testResult.status) {
              case 'passed':
                passed++;
                suiteData.passCount++;
                break;
              case 'failed':
                failed++;
                suiteData.failCount++;
                if (testResult.error) {
                  const errorKey = testResult.error.substring(0, 100);
                  failureMap.set(errorKey, (failureMap.get(errorKey) || 0) + 1);
                }
                break;
              case 'skipped':
                skipped++;
                suiteData.skipCount++;
                break;
            }
          }
        }

        suites.push(suiteData);
      }
    }

    // Count artifacts
    const artifacts = await this.countArtifacts();

    // Get top failures
    const topFailures = Array.from(failureMap.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([error, frequency]) => ({
        test: 'Multiple Tests',
        error,
        frequency,
      }));

    return {
      timestamp,
      environment: process.env.NODE_ENV || 'test',
      totalTests,
      passed,
      failed,
      skipped,
      successRate: totalTests > 0 ? (passed / totalTests) * 100 : 0,
      totalDuration,
      averageDuration: totalTests > 0 ? totalDuration / totalTests : 0,
      suites,
      artifacts,
      topFailures,
    };
  }

  /**
   * Generate HTML summary report
   */
  private async generateHTMLSummary(summary: SummaryReport): Promise<void> {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>E2E Test Summary Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
    .stat-card { background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center; }
    .stat-value { font-size: 2em; font-weight: bold; color: #333; }
    .stat-label { font-size: 0.9em; color: #666; margin-top: 5px; }
    .passed { color: #28a745; }
    .failed { color: #dc3545; }
    .skipped { color: #ffc107; }
    .section { margin-bottom: 30px; }
    .section h2 { border-bottom: 2px solid #007bff; padding-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f8f9fa; }
    .status-passed { background-color: #d4edda; color: #155724; }
    .status-failed { background-color: #f8d7da; color: #721c24; }
    .status-skipped { background-color: #fff3cd; color: #856404; }
  </style>
</head>
<body>
  <div class="header">
    <h1>E2E Test Summary Report</h1>
    <p>Generated: ${new Date(summary.timestamp).toLocaleString()}</p>
    <p>Environment: ${summary.environment}</p>
  </div>

  <div class="summary-grid">
    <div class="stat-card">
      <div class="stat-value">${summary.totalTests}</div>
      <div class="stat-label">Total Tests</div>
    </div>
    <div class="stat-card">
      <div class="stat-value passed">${summary.passed}</div>
      <div class="stat-label">Passed</div>
    </div>
    <div class="stat-card">
      <div class="stat-value failed">${summary.failed}</div>
      <div class="stat-label">Failed</div>
    </div>
    <div class="stat-card">
      <div class="stat-value skipped">${summary.skipped}</div>
      <div class="stat-label">Skipped</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${summary.successRate.toFixed(1)}%</div>
      <div class="stat-label">Success Rate</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${(summary.totalDuration / 1000).toFixed(1)}s</div>
      <div class="stat-label">Total Duration</div>
    </div>
  </div>

  <div class="section">
    <h2>Test Suites</h2>
    <table>
      <thead>
        <tr>
          <th>Suite</th>
          <th>Tests</th>
          <th>Passed</th>
          <th>Failed</th>
          <th>Skipped</th>
          <th>Duration</th>
        </tr>
      </thead>
      <tbody>
        ${summary.suites.map(suite => `
          <tr>
            <td>${suite.name}</td>
            <td>${suite.tests.length}</td>
            <td class="passed">${suite.passCount}</td>
            <td class="failed">${suite.failCount}</td>
            <td class="skipped">${suite.skipCount}</td>
            <td>${(suite.totalDuration / 1000).toFixed(1)}s</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  ${summary.topFailures.length > 0 ? `
  <div class="section">
    <h2>Top Failures</h2>
    <table>
      <thead>
        <tr>
          <th>Error</th>
          <th>Frequency</th>
        </tr>
      </thead>
      <tbody>
        ${summary.topFailures.map(failure => `
          <tr>
            <td>${failure.error}</td>
            <td>${failure.frequency}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  <div class="section">
    <h2>Artifacts</h2>
    <div class="summary-grid">
      <div class="stat-card">
        <div class="stat-value">${summary.artifacts.screenshots}</div>
        <div class="stat-label">Screenshots</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${summary.artifacts.videos}</div>
        <div class="stat-label">Videos</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${summary.artifacts.traces}</div>
        <div class="stat-label">Traces</div>
      </div>
    </div>
  </div>
</body>
</html>`;

    const htmlPath = path.join(this.reportsDir, 'summary-report.html');
    await fs.promises.writeFile(htmlPath, html);
  }

  /**
   * Generate markdown summary report
   */
  private async generateMarkdownSummary(summary: SummaryReport): Promise<void> {
    const markdown = `# E2E Test Summary Report

**Generated:** ${new Date(summary.timestamp).toLocaleString()}  
**Environment:** ${summary.environment}

## Overview

| Metric | Value |
|--------|-------|
| Total Tests | ${summary.totalTests} |
| Passed | ${summary.passed} ✅ |
| Failed | ${summary.failed} ❌ |
| Skipped | ${summary.skipped} ⏭️ |
| Success Rate | ${summary.successRate.toFixed(1)}% |
| Total Duration | ${(summary.totalDuration / 1000).toFixed(1)}s |
| Average Duration | ${(summary.averageDuration / 1000).toFixed(1)}s |

## Test Suites

| Suite | Tests | Passed | Failed | Skipped | Duration |
|-------|-------|--------|--------|---------|----------|
${summary.suites.map(suite => 
  `| ${suite.name} | ${suite.tests.length} | ${suite.passCount} | ${suite.failCount} | ${suite.skipCount} | ${(suite.totalDuration / 1000).toFixed(1)}s |`
).join('\n')}

${summary.topFailures.length > 0 ? `
## Top Failures

| Error | Frequency |
|-------|-----------|
${summary.topFailures.map(failure => 
  `| ${failure.error} | ${failure.frequency} |`
).join('\n')}
` : ''}

## Artifacts

- 📸 Screenshots: ${summary.artifacts.screenshots}
- 🎥 Videos: ${summary.artifacts.videos}
- 🔍 Traces: ${summary.artifacts.traces}

---
*Generated by E2E Test Reporter*`;

    const markdownPath = path.join(this.reportsDir, 'summary-report.md');
    await fs.promises.writeFile(markdownPath, markdown);
  }

  /**
   * Count artifacts generated during test run
   */
  private async countArtifacts(): Promise<{ screenshots: number; videos: number; traces: number }> {
    const counts = { screenshots: 0, videos: 0, traces: 0 };

    try {
      // Count screenshots
      const screenshotsDir = './tests/e2e/screenshots';
      if (fs.existsSync(screenshotsDir)) {
        const screenshots = await fs.promises.readdir(screenshotsDir);
        counts.screenshots = screenshots.filter(f => f.endsWith('.png')).length;
      }

      // Count videos
      const videosDir = './tests/e2e/videos';
      if (fs.existsSync(videosDir)) {
        const videos = await fs.promises.readdir(videosDir);
        counts.videos = videos.filter(f => f.endsWith('.webm') || f.endsWith('.mp4')).length;
      }

      // Count traces
      const tracesDir = './tests/e2e/test-results';
      if (fs.existsSync(tracesDir)) {
        const traces = await fs.promises.readdir(tracesDir);
        counts.traces = traces.filter(f => f.includes('trace.zip')).length;
      }
    } catch (error) {
      console.warn('⚠️  Failed to count artifacts:', error);
    }

    return counts;
  }

  /**
   * Archive a file to the archive directory
   */
  private async archiveFile(sourcePath: string, destinationPath: string): Promise<void> {
    try {
      if (fs.existsSync(sourcePath)) {
        await fs.promises.mkdir(path.dirname(destinationPath), { recursive: true });
        await fs.promises.copyFile(sourcePath, destinationPath);
      }
    } catch (error) {
      console.warn(`⚠️  Failed to archive file ${sourcePath}:`, error);
    }
  }

  /**
   * Archive a directory to the archive location
   */
  private async archiveDirectory(sourceDir: string, destinationDir: string): Promise<void> {
    try {
      if (fs.existsSync(sourceDir)) {
        await fs.promises.mkdir(destinationDir, { recursive: true });
        
        const items = await fs.promises.readdir(sourceDir);
        for (const item of items) {
          const sourcePath = path.join(sourceDir, item);
          const destinationPath = path.join(destinationDir, item);
          
          const stats = await fs.promises.stat(sourcePath);
          if (stats.isDirectory()) {
            await this.archiveDirectory(sourcePath, destinationPath);
          } else {
            await fs.promises.copyFile(sourcePath, destinationPath);
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️  Failed to archive directory ${sourceDir}:`, error);
    }
  }

  /**
   * Create manifest file for archived results
   */
  private async createArchiveManifest(archiveFolder: string, timestamp: string): Promise<void> {
    const manifest = {
      timestamp,
      archiveDate: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'test',
      contents: {
        htmlReport: 'html-report/',
        jsonResults: 'test-results.json',
        junitXml: 'junit.xml',
        screenshots: 'screenshots/',
        videos: 'videos/',
      },
    };

    const manifestPath = path.join(archiveFolder, 'manifest.json');
    await fs.promises.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  }

  /**
   * Ensure all necessary directories exist
   */
  private ensureDirectories(): void {
    const dirs = [
      this.reportsDir,
      this.artifactsDir,
      this.archiveDir,
    ];

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  /**
   * Clean up old archives (keep only last N archives)
   */
  async cleanupOldArchives(keepCount: number = 10): Promise<void> {
    try {
      const archives = await fs.promises.readdir(this.archiveDir);
      const archiveFolders = archives.filter(name => name.startsWith('run-'));
      
      if (archiveFolders.length <= keepCount) {
        return;
      }

      // Sort by name (timestamp) and remove oldest
      archiveFolders.sort().reverse(); // Newest first
      const foldersToDelete = archiveFolders.slice(keepCount);

      for (const folder of foldersToDelete) {
        const folderPath = path.join(this.archiveDir, folder);
        await fs.promises.rmdir(folderPath, { recursive: true });
        console.log(`🗑️  Removed old archive: ${folder}`);
      }
    } catch (error) {
      console.warn('⚠️  Failed to cleanup old archives:', error);
    }
  }
}