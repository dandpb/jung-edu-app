#!/usr/bin/env node

/**
 * 📊 Test Report Generator
 * Generates comprehensive test reports with coverage analysis and performance metrics
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
    projectRoot: process.cwd(),
    appDir: path.join(process.cwd(), 'jung-edu-app'),
    outputDir: path.join(process.cwd(), 'test-reports'),
    timestamp: new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5),
    
    // Coverage thresholds
    coverageThresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80
    },
    
    // Performance thresholds (in seconds)
    performanceThresholds: {
        build: 120,
        testSuite: 300,
        unitTests: 60,
        integrationTests: 180
    }
};

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

/**
 * Logger utility with colors and timestamps
 */
class Logger {
    static info(message) {
        console.log(`${colors.blue}[INFO]${colors.reset} ${new Date().toISOString()} ${message}`);
    }
    
    static success(message) {
        console.log(`${colors.green}[SUCCESS]${colors.reset} ${new Date().toISOString()} ${message}`);
    }
    
    static warning(message) {
        console.log(`${colors.yellow}[WARNING]${colors.reset} ${new Date().toISOString()} ${message}`);
    }
    
    static error(message) {
        console.error(`${colors.red}[ERROR]${colors.reset} ${new Date().toISOString()} ${message}`);
    }
    
    static step(message) {
        console.log(`${colors.magenta}[STEP]${colors.reset} ${message}`);
    }
    
    static header(message) {
        console.log(`\n${colors.cyan}${colors.bright}=== ${message} ===${colors.reset}\n`);
    }
}

/**
 * Utility functions
 */
class Utils {
    /**
     * Execute command and return result
     */
    static execCommand(command, options = {}) {
        try {
            const result = execSync(command, { 
                encoding: 'utf8', 
                cwd: options.cwd || CONFIG.appDir,
                ...options 
            });
            return { success: true, output: result.trim() };
        } catch (error) {
            return { 
                success: false, 
                output: error.stdout?.toString() || '', 
                error: error.stderr?.toString() || error.message 
            };
        }
    }
    
    /**
     * Get file size in human readable format
     */
    static getFileSize(filePath) {
        try {
            const stats = fs.statSync(filePath);
            const bytes = stats.size;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            if (bytes === 0) return '0 B';
            const i = Math.floor(Math.log(bytes) / Math.log(1024));
            return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
        } catch (error) {
            return 'N/A';
        }
    }
    
    /**
     * Format duration in seconds to human readable
     */
    static formatDuration(seconds) {
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    }
    
    /**
     * Ensure directory exists
     */
    static ensureDir(dir) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }
    
    /**
     * Get git information
     */
    static getGitInfo() {
        try {
            const branch = Utils.execCommand('git branch --show-current').output || 'unknown';
            const commit = Utils.execCommand('git rev-parse HEAD').output?.slice(0, 8) || 'unknown';
            const commitMessage = Utils.execCommand('git log -1 --pretty=format:"%s"').output || '';
            const isDirty = Utils.execCommand('git status --porcelain').output.length > 0;
            
            return { branch, commit, commitMessage, isDirty };
        } catch {
            return { branch: 'unknown', commit: 'unknown', commitMessage: '', isDirty: false };
        }
    }
}

/**
 * Coverage analyzer
 */
class CoverageAnalyzer {
    static analyzeCoverage() {
        Logger.step('📊 Analyzing test coverage...');
        
        const coverageFile = path.join(CONFIG.appDir, 'coverage', 'coverage-summary.json');
        
        if (!fs.existsSync(coverageFile)) {
            Logger.warning('Coverage file not found. Running coverage analysis...');
            
            // Generate coverage
            const result = Utils.execCommand('npm run test:coverage');
            if (!result.success) {
                Logger.error('Failed to generate coverage report');
                return null;
            }
        }
        
        try {
            const coverageData = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
            const total = coverageData.total;
            
            const analysis = {
                statements: {
                    pct: total.statements.pct,
                    covered: total.statements.covered,
                    total: total.statements.total,
                    skipped: total.statements.skipped
                },
                branches: {
                    pct: total.branches.pct,
                    covered: total.branches.covered,
                    total: total.branches.total,
                    skipped: total.branches.skipped
                },
                functions: {
                    pct: total.functions.pct,
                    covered: total.functions.covered,
                    total: total.functions.total,
                    skipped: total.functions.skipped
                },
                lines: {
                    pct: total.lines.pct,
                    covered: total.lines.covered,
                    total: total.lines.total,
                    skipped: total.lines.skipped
                }
            };
            
            // Check thresholds
            analysis.meetsThresholds = {
                statements: analysis.statements.pct >= CONFIG.coverageThresholds.statements,
                branches: analysis.branches.pct >= CONFIG.coverageThresholds.branches,
                functions: analysis.functions.pct >= CONFIG.coverageThresholds.functions,
                lines: analysis.lines.pct >= CONFIG.coverageThresholds.lines
            };
            
            analysis.overallThreshold = Object.values(analysis.meetsThresholds).every(Boolean);
            
            Logger.success(`Coverage analysis completed`);
            return analysis;
        } catch (error) {
            Logger.error(`Failed to parse coverage data: ${error.message}`);
            return null;
        }
    }
}

/**
 * Performance analyzer
 */
class PerformanceAnalyzer {
    static analyzePerformance() {
        Logger.step('⚡ Analyzing build and test performance...');
        
        const metrics = {
            build: this.measureBuildTime(),
            testSuites: this.measureTestSuites(),
            bundleSize: this.analyzeBundleSize(),
            dependencies: this.analyzeDependencies()
        };
        
        return metrics;
    }
    
    static measureBuildTime() {
        Logger.info('Measuring build time...');
        const startTime = Date.now();
        
        const result = Utils.execCommand('npm run build');
        const endTime = Date.now();
        const duration = Math.round((endTime - startTime) / 1000);
        
        return {
            success: result.success,
            duration,
            meetsThreshold: duration <= CONFIG.performanceThresholds.build,
            output: result.output,
            error: result.error
        };
    }
    
    static measureTestSuites() {
        const testSuites = [
            { name: 'unit', command: 'npm run test:all' },
            { name: 'components', command: 'npm run test:components' },
            { name: 'services', command: 'npm run test:unit' },
            { name: 'utils', command: 'npm run test:utils' }
        ];
        
        const results = {};
        
        for (const suite of testSuites) {
            Logger.info(`Measuring ${suite.name} test performance...`);
            const startTime = Date.now();
            
            const result = Utils.execCommand(suite.command, { stdio: 'pipe' });
            const endTime = Date.now();
            const duration = Math.round((endTime - startTime) / 1000);
            
            results[suite.name] = {
                success: result.success,
                duration,
                meetsThreshold: duration <= CONFIG.performanceThresholds.unitTests,
                testsRun: this.extractTestCount(result.output),
                output: result.output
            };
        }
        
        return results;
    }
    
    static extractTestCount(output) {
        // Extract test count from Jest output
        const match = output.match(/Tests:\s+(\d+)\s+passed/i) || 
                     output.match(/(\d+)\s+tests?\s+passed/i);
        return match ? parseInt(match[1]) : 0;
    }
    
    static analyzeBundleSize() {
        const buildDir = path.join(CONFIG.appDir, 'build');
        
        if (!fs.existsSync(buildDir)) {
            Logger.warning('Build directory not found');
            return { exists: false };
        }
        
        const staticDir = path.join(buildDir, 'static');
        const analysis = {
            exists: true,
            totalSize: Utils.getFileSize(buildDir),
            files: {}
        };
        
        // Analyze JavaScript bundles
        if (fs.existsSync(path.join(staticDir, 'js'))) {
            const jsFiles = fs.readdirSync(path.join(staticDir, 'js'))
                .filter(file => file.endsWith('.js'))
                .map(file => ({
                    name: file,
                    size: Utils.getFileSize(path.join(staticDir, 'js', file))
                }));
            analysis.files.javascript = jsFiles;
        }
        
        // Analyze CSS files
        if (fs.existsSync(path.join(staticDir, 'css'))) {
            const cssFiles = fs.readdirSync(path.join(staticDir, 'css'))
                .filter(file => file.endsWith('.css'))
                .map(file => ({
                    name: file,
                    size: Utils.getFileSize(path.join(staticDir, 'css', file))
                }));
            analysis.files.css = cssFiles;
        }
        
        return analysis;
    }
    
    static analyzeDependencies() {
        const packageFile = path.join(CONFIG.appDir, 'package.json');
        const lockFile = path.join(CONFIG.appDir, 'package-lock.json');
        
        if (!fs.existsSync(packageFile)) {
            return { error: 'package.json not found' };
        }
        
        try {
            const packageData = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
            const dependencies = Object.keys(packageData.dependencies || {});
            const devDependencies = Object.keys(packageData.devDependencies || {});
            
            const nodeModulesSize = fs.existsSync(path.join(CONFIG.appDir, 'node_modules')) 
                ? Utils.getFileSize(path.join(CONFIG.appDir, 'node_modules'))
                : 'N/A';
            
            return {
                production: dependencies.length,
                development: devDependencies.length,
                total: dependencies.length + devDependencies.length,
                nodeModulesSize,
                topDependencies: dependencies.slice(0, 10),
                topDevDependencies: devDependencies.slice(0, 10)
            };
        } catch (error) {
            return { error: error.message };
        }
    }
}

/**
 * Report generator
 */
class ReportGenerator {
    static generateMarkdownReport(data) {
        Logger.step('📋 Generating Markdown report...');
        
        const gitInfo = Utils.getGitInfo();
        const timestamp = new Date().toISOString();
        
        let markdown = this.generateHeader(gitInfo, timestamp);
        markdown += this.generateCoverageSection(data.coverage);
        markdown += this.generatePerformanceSection(data.performance);
        markdown += this.generateSummarySection(data);
        markdown += this.generateFooter();
        
        return markdown;
    }
    
    static generateHeader(gitInfo, timestamp) {
        return `# 📊 Test Report - jaqEdu Educational Platform

**Generated**: ${timestamp}  
**Branch**: \`${gitInfo.branch}\`  
**Commit**: \`${gitInfo.commit}\`  
**Commit Message**: ${gitInfo.commitMessage}  
**Working Directory**: ${gitInfo.isDirty ? '🔴 Dirty' : '🟢 Clean'}

---

`;
    }
    
    static generateCoverageSection(coverage) {
        if (!coverage) {
            return `## 📈 Code Coverage

❌ **Coverage data not available**

---

`;
        }
        
        const getStatusIcon = (meets) => meets ? '✅' : '❌';
        const getStatusColor = (pct, threshold) => pct >= threshold ? '🟢' : (pct >= threshold * 0.8 ? '🟡' : '🔴');
        
        return `## 📈 Code Coverage

| Metric | Coverage | Threshold | Status |
|--------|----------|-----------|---------|
| **Statements** | ${coverage.statements.pct}% (${coverage.statements.covered}/${coverage.statements.total}) | ${CONFIG.coverageThresholds.statements}% | ${getStatusIcon(coverage.meetsThresholds.statements)} ${getStatusColor(coverage.statements.pct, CONFIG.coverageThresholds.statements)} |
| **Branches** | ${coverage.branches.pct}% (${coverage.branches.covered}/${coverage.branches.total}) | ${CONFIG.coverageThresholds.branches}% | ${getStatusIcon(coverage.meetsThresholds.branches)} ${getStatusColor(coverage.branches.pct, CONFIG.coverageThresholds.branches)} |
| **Functions** | ${coverage.functions.pct}% (${coverage.functions.covered}/${coverage.functions.total}) | ${CONFIG.coverageThresholds.functions}% | ${getStatusIcon(coverage.meetsThresholds.functions)} ${getStatusColor(coverage.functions.pct, CONFIG.coverageThresholds.functions)} |
| **Lines** | ${coverage.lines.pct}% (${coverage.lines.covered}/${coverage.lines.total}) | ${CONFIG.coverageThresholds.lines}% | ${getStatusIcon(coverage.meetsThresholds.lines)} ${getStatusColor(coverage.lines.pct, CONFIG.coverageThresholds.lines)} |

**Overall Threshold**: ${coverage.overallThreshold ? '✅ PASSED' : '❌ FAILED'}

---

`;
    }
    
    static generatePerformanceSection(performance) {
        let section = `## ⚡ Performance Metrics

### 🏗️ Build Performance
`;
        
        if (performance.build) {
            const build = performance.build;
            const statusIcon = build.success ? (build.meetsThreshold ? '✅' : '⚠️') : '❌';
            
            section += `- **Status**: ${statusIcon} ${build.success ? 'Success' : 'Failed'}
- **Duration**: ${Utils.formatDuration(build.duration)}
- **Threshold**: ${Utils.formatDuration(CONFIG.performanceThresholds.build)}
- **Meets Threshold**: ${build.meetsThreshold ? '✅ Yes' : '❌ No'}

`;
        }
        
        section += `### 🧪 Test Suite Performance

`;
        
        if (performance.testSuites) {
            Object.entries(performance.testSuites).forEach(([suite, data]) => {
                const statusIcon = data.success ? (data.meetsThreshold ? '✅' : '⚠️') : '❌';
                section += `#### ${suite.charAt(0).toUpperCase() + suite.slice(1)} Tests
- **Status**: ${statusIcon} ${data.success ? 'Passed' : 'Failed'}
- **Duration**: ${Utils.formatDuration(data.duration)}
- **Tests Run**: ${data.testsRun}
- **Meets Threshold**: ${data.meetsThreshold ? '✅ Yes' : '❌ No'}

`;
            });
        }
        
        section += `### 📦 Bundle Analysis

`;
        
        if (performance.bundleSize && performance.bundleSize.exists) {
            const bundle = performance.bundleSize;
            section += `- **Total Size**: ${bundle.totalSize}

`;
            
            if (bundle.files.javascript) {
                section += `#### JavaScript Files
`;
                bundle.files.javascript.forEach(file => {
                    section += `- \`${file.name}\`: ${file.size}
`;
                });
                section += `
`;
            }
            
            if (bundle.files.css) {
                section += `#### CSS Files
`;
                bundle.files.css.forEach(file => {
                    section += `- \`${file.name}\`: ${file.size}
`;
                });
                section += `
`;
            }
        } else {
            section += `❌ **Build artifacts not found**

`;
        }
        
        section += `### 📚 Dependencies

`;
        
        if (performance.dependencies && !performance.dependencies.error) {
            const deps = performance.dependencies;
            section += `- **Production Dependencies**: ${deps.production}
- **Development Dependencies**: ${deps.development}
- **Total Dependencies**: ${deps.total}
- **node_modules Size**: ${deps.nodeModulesSize}

#### Top Production Dependencies
${deps.topDependencies.map(dep => `- \`${dep}\``).join('\n')}

#### Top Development Dependencies
${deps.topDevDependencies.map(dep => `- \`${dep}\``).join('\n')}

`;
        } else {
            section += `❌ **Dependency analysis failed**: ${performance.dependencies?.error || 'Unknown error'}

`;
        }
        
        section += `---

`;
        
        return section;
    }
    
    static generateSummarySection(data) {
        const overallStatus = this.calculateOverallStatus(data);
        const statusIcon = overallStatus.success ? '✅' : '❌';
        
        return `## 📊 Summary

**Overall Status**: ${statusIcon} ${overallStatus.status}

### Key Metrics
- **Coverage Threshold**: ${data.coverage?.overallThreshold ? '✅ Met' : '❌ Not Met'}
- **Build Status**: ${data.performance?.build?.success ? '✅ Passed' : '❌ Failed'}
- **Performance Thresholds**: ${overallStatus.performanceOk ? '✅ Met' : '⚠️ Some Issues'}

### Recommendations
${overallStatus.recommendations.map(rec => `- ${rec}`).join('\n')}

---

`;
    }
    
    static calculateOverallStatus(data) {
        let success = true;
        let status = 'PASSED';
        let performanceOk = true;
        const recommendations = [];
        
        // Check coverage
        if (!data.coverage?.overallThreshold) {
            success = false;
            recommendations.push('📈 Improve test coverage to meet minimum thresholds');
        }
        
        // Check build
        if (!data.performance?.build?.success) {
            success = false;
            status = 'FAILED';
            recommendations.push('🏗️ Fix build issues');
        }
        
        // Check performance
        if (data.performance?.build && !data.performance.build.meetsThreshold) {
            performanceOk = false;
            recommendations.push('⚡ Optimize build performance');
        }
        
        // Check test performance
        if (data.performance?.testSuites) {
            const slowTests = Object.entries(data.performance.testSuites)
                .filter(([, suite]) => !suite.meetsThreshold)
                .map(([name]) => name);
            
            if (slowTests.length > 0) {
                performanceOk = false;
                recommendations.push(`🧪 Optimize slow test suites: ${slowTests.join(', ')}`);
            }
        }
        
        if (success && performanceOk) {
            status = 'EXCELLENT';
            recommendations.push('🎉 All metrics look great! Keep up the good work.');
        } else if (success) {
            status = 'GOOD';
            recommendations.push('✅ Tests pass but performance could be improved.');
        }
        
        return { success, status, performanceOk, recommendations };
    }
    
    static generateFooter() {
        return `## 🔧 Technical Details

**Report Generator**: test-report.js v1.0  
**Node.js Version**: ${process.version}  
**Platform**: ${process.platform} ${process.arch}  
**Working Directory**: ${process.cwd()}  

---

*Generated automatically by jaqEdu CI/CD Pipeline*
`;
    }
    
    static generateJsonReport(data) {
        Logger.step('📋 Generating JSON report...');
        
        return JSON.stringify({
            timestamp: new Date().toISOString(),
            git: Utils.getGitInfo(),
            coverage: data.coverage,
            performance: data.performance,
            summary: this.calculateOverallStatus(data)
        }, null, 2);
    }
    
    static generateHtmlReport(markdownContent) {
        Logger.step('📋 Generating HTML report...');
        
        // Simple HTML template
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>jaqEdu Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        pre { background: #f6f8fa; padding: 16px; border-radius: 6px; overflow-x: auto; }
        code { background: #f6f8fa; padding: 2px 4px; border-radius: 3px; font-family: 'SF Mono', Monaco, monospace; }
        table { border-collapse: collapse; width: 100%; margin: 16px 0; }
        th, td { border: 1px solid #d0d7de; padding: 8px 12px; text-align: left; }
        th { background: #f6f8fa; font-weight: 600; }
        h1, h2, h3 { color: #24292f; }
        h1 { border-bottom: 1px solid #d0d7de; padding-bottom: 10px; }
        .success { color: #1a7f37; }
        .warning { color: #bf8700; }
        .error { color: #cf222e; }
    </style>
</head>
<body>
    <div id="content">
        <!-- Markdown content would be converted here -->
        <pre>${markdownContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
    </div>
    <script>
        console.log('jaqEdu Test Report loaded at', new Date());
    </script>
</body>
</html>`;
    }
}

/**
 * Main application
 */
class TestReportApp {
    constructor() {
        this.options = this.parseArguments();
    }
    
    parseArguments() {
        const args = process.argv.slice(2);
        const options = {
            format: 'all', // markdown, json, html, all
            output: CONFIG.outputDir,
            coverage: true,
            performance: true,
            verbose: false
        };
        
        for (let i = 0; i < args.length; i++) {
            switch (args[i]) {
                case '--format':
                case '-f':
                    options.format = args[++i];
                    break;
                case '--output':
                case '-o':
                    options.output = args[++i];
                    break;
                case '--no-coverage':
                    options.coverage = false;
                    break;
                case '--no-performance':
                    options.performance = false;
                    break;
                case '--verbose':
                case '-v':
                    options.verbose = true;
                    break;
                case '--help':
                case '-h':
                    this.showHelp();
                    process.exit(0);
            }
        }
        
        return options;
    }
    
    showHelp() {
        console.log(`
📊 Test Report Generator

Usage: node test-report.js [options]

Options:
  -f, --format FORMAT     Output format: markdown, json, html, all (default: all)
  -o, --output DIR        Output directory (default: test-reports)
  --no-coverage           Skip coverage analysis
  --no-performance        Skip performance analysis
  -v, --verbose           Verbose output
  -h, --help              Show this help

Examples:
  node test-report.js                          # Generate all formats
  node test-report.js -f markdown -o ./reports # Generate markdown only
  node test-report.js --no-performance         # Skip performance analysis
        `);
    }
    
    async run() {
        try {
            Logger.header('Test Report Generator Starting');
            
            // Ensure output directory exists
            Utils.ensureDir(this.options.output);
            
            // Collect data
            const data = await this.collectData();
            
            // Generate reports
            await this.generateReports(data);
            
            Logger.success('✅ Test report generation completed successfully');
            
        } catch (error) {
            Logger.error(`❌ Test report generation failed: ${error.message}`);
            if (this.options.verbose) {
                console.error(error.stack);
            }
            process.exit(1);
        }
    }
    
    async collectData() {
        const data = {};
        
        // Collect coverage data
        if (this.options.coverage) {
            data.coverage = CoverageAnalyzer.analyzeCoverage();
        }
        
        // Collect performance data
        if (this.options.performance) {
            data.performance = PerformanceAnalyzer.analyzePerformance();
        }
        
        return data;
    }
    
    async generateReports(data) {
        const formats = this.options.format === 'all' ? ['markdown', 'json', 'html'] : [this.options.format];
        const timestamp = CONFIG.timestamp;
        
        for (const format of formats) {
            const filename = `test-report-${timestamp}.${format === 'markdown' ? 'md' : format}`;
            const filepath = path.join(this.options.output, filename);
            
            let content;
            
            switch (format) {
                case 'markdown':
                    content = ReportGenerator.generateMarkdownReport(data);
                    break;
                case 'json':
                    content = ReportGenerator.generateJsonReport(data);
                    break;
                case 'html':
                    const markdownContent = ReportGenerator.generateMarkdownReport(data);
                    content = ReportGenerator.generateHtmlReport(markdownContent);
                    break;
            }
            
            fs.writeFileSync(filepath, content, 'utf8');
            Logger.success(`Generated ${format} report: ${filepath}`);
        }
        
        // Generate a latest symlink for easy access
        if (formats.includes('markdown')) {
            const latestPath = path.join(this.options.output, 'latest-report.md');
            const sourcePath = `test-report-${timestamp}.md`;
            
            try {
                if (fs.existsSync(latestPath)) {
                    fs.unlinkSync(latestPath);
                }
                fs.symlinkSync(sourcePath, latestPath);
                Logger.info(`Created latest report symlink: ${latestPath}`);
            } catch (error) {
                // Symlink creation might fail on Windows, so copy instead
                const sourceContent = fs.readFileSync(path.join(this.options.output, sourcePath), 'utf8');
                fs.writeFileSync(latestPath, sourceContent, 'utf8');
                Logger.info(`Created latest report copy: ${latestPath}`);
            }
        }
    }
}

// Run the application
if (require.main === module) {
    const app = new TestReportApp();
    app.run();
}

module.exports = { TestReportApp, CoverageAnalyzer, PerformanceAnalyzer, ReportGenerator, Utils, Logger };