#!/usr/bin/env node

/**
 * Coverage Validation Script for jaqEdu Platform
 * 
 * This script validates test coverage and enforces quality standards:
 * - Validates coverage thresholds (90% global, 95% services)
 * - Identifies untested files and missing test scenarios
 * - Generates detailed coverage reports
 * - Enforces integration test requirements
 * - Creates coverage badges and metrics
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const COVERAGE_CONFIG = {
  global: {
    branches: 90,
    functions: 90,
    lines: 90,
    statements: 90
  },
  services: {
    branches: 95,
    functions: 95,
    lines: 95,
    statements: 95
  },
  components: {
    branches: 85,
    functions: 85,
    lines: 85,
    statements: 85
  },
  utils: {
    branches: 90,
    functions: 90,
    lines: 90,
    statements: 90
  }
};

const CRITICAL_FILES = [
  'src/services/llm/provider.ts',
  'src/services/modules/moduleService.ts',
  'src/services/quiz/enhancedQuizGenerator.ts',
  'src/utils/auth.ts',
  'src/components/admin/AIModuleGenerator.tsx'
];

const REQUIRED_INTEGRATION_TESTS = [
  'userWorkflows.test.tsx',
  'crossComponentIntegration.test.tsx',
  'dataPersistence.test.tsx',
  'apiIntegration.test.ts',
  'errorHandling.test.tsx'
];

class CoverageValidator {
  constructor() {
    this.projectRoot = process.cwd();
    this.coverageDir = path.join(this.projectRoot, 'coverage');
    this.results = {
      passed: false,
      errors: [],
      warnings: [],
      metrics: {},
      recommendations: []
    };
  }

  async validate() {
    console.log('🔍 Starting comprehensive coverage validation...\n');
    
    try {
      // Step 1: Run tests with coverage
      await this.runCoverageTests();
      
      // Step 2: Validate coverage thresholds
      await this.validateCoverageThresholds();
      
      // Step 3: Check critical files coverage
      await this.validateCriticalFiles();
      
      // Step 4: Validate integration tests
      await this.validateIntegrationTests();
      
      // Step 5: Check for untested files
      await this.findUntestedFiles();
      
      // Step 6: Generate detailed reports
      await this.generateReports();
      
      // Step 7: Create recommendations
      this.generateRecommendations();
      
      // Step 8: Display results
      this.displayResults();
      
    } catch (error) {
      this.results.errors.push(`Validation failed: ${error.message}`);
      this.displayResults();
      process.exit(1);
    }
  }

  async runCoverageTests() {
    console.log('📊 Running test suite with coverage...');
    
    try {
      // Run tests with coverage
      execSync('npm run test:coverage', { 
        stdio: 'pipe',
        cwd: this.projectRoot 
      });
      
      console.log('✅ Test suite completed successfully');
    } catch (error) {
      // Even if some tests fail, we can still analyze coverage
      console.log('⚠️  Some tests failed, but continuing coverage analysis...');
    }
  }

  async validateCoverageThresholds() {
    console.log('🎯 Validating coverage thresholds...');
    
    const coverageSummaryPath = path.join(this.coverageDir, 'coverage-summary.json');
    
    if (!fs.existsSync(coverageSummaryPath)) {
      throw new Error('Coverage summary not found. Please run tests with coverage first.');
    }
    
    const coverageSummary = JSON.parse(fs.readFileSync(coverageSummaryPath, 'utf8'));
    
    // Validate global coverage
    const globalCoverage = coverageSummary.total;
    this.validateThreshold('Global', globalCoverage, COVERAGE_CONFIG.global);
    
    // Validate service-specific coverage
    Object.keys(coverageSummary).forEach(filePath => {
      if (filePath.includes('/services/') && filePath !== 'total') {
        this.validateThreshold(
          `Service: ${path.basename(filePath)}`,
          coverageSummary[filePath],
          COVERAGE_CONFIG.services
        );
      }
    });
    
    this.results.metrics.coverage = globalCoverage;
  }

  validateThreshold(name, coverage, thresholds) {
    const metrics = ['branches', 'functions', 'lines', 'statements'];
    
    metrics.forEach(metric => {
      const actual = coverage[metric]?.pct || 0;
      const required = thresholds[metric];
      
      if (actual < required) {
        this.results.errors.push(
          `${name} ${metric} coverage ${actual}% is below threshold ${required}%`
        );
      } else if (actual < required + 5) {
        this.results.warnings.push(
          `${name} ${metric} coverage ${actual}% is close to threshold ${required}%`
        );
      }
    });
  }

  async validateCriticalFiles() {
    console.log('🔒 Validating critical files coverage...');
    
    const coverageSummaryPath = path.join(this.coverageDir, 'coverage-summary.json');
    const coverageSummary = JSON.parse(fs.readFileSync(coverageSummaryPath, 'utf8'));
    
    CRITICAL_FILES.forEach(filePath => {
      const fullPath = path.join(this.projectRoot, filePath);
      const coverageKey = Object.keys(coverageSummary).find(key => 
        key.includes(filePath.replace('src/', ''))
      );
      
      if (!coverageKey) {
        this.results.errors.push(`Critical file ${filePath} has no coverage data`);
        return;
      }
      
      const coverage = coverageSummary[coverageKey];
      const metrics = ['branches', 'functions', 'lines', 'statements'];
      
      metrics.forEach(metric => {
        const actual = coverage[metric]?.pct || 0;
        if (actual < 95) {
          this.results.errors.push(
            `Critical file ${filePath} ${metric} coverage ${actual}% is below required 95%`
          );
        }
      });
    });
  }

  async validateIntegrationTests() {
    console.log('🔗 Validating integration tests...');
    
    const integrationTestDir = path.join(this.projectRoot, 'src/__tests__/integration');
    
    if (!fs.existsSync(integrationTestDir)) {
      this.results.errors.push('Integration test directory not found');
      return;
    }
    
    const existingTests = fs.readdirSync(integrationTestDir);
    
    REQUIRED_INTEGRATION_TESTS.forEach(testFile => {
      if (!existingTests.includes(testFile)) {
        this.results.errors.push(`Required integration test missing: ${testFile}`);
      }
    });
    
    // Check test quality
    existingTests.forEach(testFile => {
      if (testFile.endsWith('.test.tsx') || testFile.endsWith('.test.ts')) {
        const testPath = path.join(integrationTestDir, testFile);
        const testContent = fs.readFileSync(testPath, 'utf8');
        
        // Check for comprehensive test patterns
        const patterns = [
          { name: 'describe blocks', regex: /describe\(/g, min: 3 },
          { name: 'test cases', regex: /it\\(/g, min: 5 },
          { name: 'async tests', regex: /async \\(/g, min: 2 },
          { name: 'user interactions', regex: /user\\./g, min: 3 },
          { name: 'waitFor assertions', regex: /waitFor\\(/g, min: 2 }
        ];
        
        patterns.forEach(pattern => {
          const matches = testContent.match(pattern.regex) || [];
          if (matches.length < pattern.min) {
            this.results.warnings.push(
              `${testFile} has insufficient ${pattern.name}: ${matches.length} (minimum: ${pattern.min})`
            );
          }
        });
      }
    });
  }

  async findUntestedFiles() {
    console.log('🔍 Finding untested files...');
    
    const sourceDir = path.join(this.projectRoot, 'src');
    const coverageSummaryPath = path.join(this.coverageDir, 'coverage-summary.json');
    
    if (!fs.existsSync(coverageSummaryPath)) {
      return;
    }
    
    const coverageSummary = JSON.parse(fs.readFileSync(coverageSummaryPath, 'utf8'));
    const coveredFiles = new Set(Object.keys(coverageSummary).filter(key => key !== 'total'));
    
    const findFiles = (dir, extension) => {
      const files = [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      entries.forEach(entry => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          files.push(...findFiles(fullPath, extension));
        } else if (entry.name.endsWith(extension)) {
          files.push(fullPath);
        }
      });
      
      return files;
    };
    
    const sourceFiles = [
      ...findFiles(sourceDir, '.ts'),
      ...findFiles(sourceDir, '.tsx')
    ].filter(file => 
      !file.includes('__tests__') && 
      !file.includes('.test.') && 
      !file.includes('.spec.') &&
      !file.includes('setupTests.ts') &&
      !file.includes('reportWebVitals.ts') &&
      !file.includes('react-app-env.d.ts')
    );
    
    const untestedFiles = sourceFiles.filter(file => {
      const relativePath = path.relative(this.projectRoot, file);
      return !coveredFiles.has(relativePath);
    });
    
    if (untestedFiles.length > 0) {
      this.results.warnings.push(`Found ${untestedFiles.length} untested files`);
      this.results.untestedFiles = untestedFiles.map(file => 
        path.relative(this.projectRoot, file)
      );
    }
  }

  async generateReports() {
    console.log('📈 Generating detailed reports...');
    
    const reportsDir = path.join(this.projectRoot, 'coverage-reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir);
    }
    
    // Generate validation report
    const validationReport = {
      timestamp: new Date().toISOString(),
      passed: this.results.errors.length === 0,
      summary: {
        errors: this.results.errors.length,
        warnings: this.results.warnings.length,
        coverage: this.results.metrics.coverage
      },
      details: this.results
    };
    
    fs.writeFileSync(
      path.join(reportsDir, 'validation-report.json'),
      JSON.stringify(validationReport, null, 2)
    );
    
    // Generate coverage badge
    this.generateCoverageBadge();
    
    // Generate markdown report
    this.generateMarkdownReport(reportsDir);
  }

  generateCoverageBadge() {
    const coverage = this.results.metrics.coverage;
    if (!coverage) return;
    
    const overallCoverage = Math.round(
      (coverage.lines.pct + coverage.branches.pct + coverage.functions.pct + coverage.statements.pct) / 4
    );
    
    const color = overallCoverage >= 90 ? 'brightgreen' : 
                  overallCoverage >= 80 ? 'yellow' : 'red';
    
    const badgeUrl = `https://img.shields.io/badge/coverage-${overallCoverage}%25-${color}`;
    
    const badgeMarkdown = `![Coverage Badge](${badgeUrl})`;
    
    fs.writeFileSync(
      path.join(this.projectRoot, 'coverage-reports', 'badge.md'),
      badgeMarkdown
    );
  }

  generateMarkdownReport(reportsDir) {
    const report = `# Coverage Validation Report

Generated: ${new Date().toISOString()}

## Summary

- **Status**: ${this.results.errors.length === 0 ? '✅ PASSED' : '❌ FAILED'}
- **Errors**: ${this.results.errors.length}
- **Warnings**: ${this.results.warnings.length}

## Coverage Metrics

${this.results.metrics.coverage ? `
| Metric | Percentage | Status |
|--------|------------|--------|
| Lines | ${this.results.metrics.coverage.lines.pct}% | ${this.results.metrics.coverage.lines.pct >= 90 ? '✅' : '❌'} |
| Branches | ${this.results.metrics.coverage.branches.pct}% | ${this.results.metrics.coverage.branches.pct >= 90 ? '✅' : '❌'} |
| Functions | ${this.results.metrics.coverage.functions.pct}% | ${this.results.metrics.coverage.functions.pct >= 90 ? '✅' : '❌'} |
| Statements | ${this.results.metrics.coverage.statements.pct}% | ${this.results.metrics.coverage.statements.pct >= 90 ? '✅' : '❌'} |
` : 'No coverage metrics available'}

## Errors

${this.results.errors.length > 0 ? 
  this.results.errors.map(error => `- ❌ ${error}`).join('\n') : 
  'No errors found ✅'
}

## Warnings

${this.results.warnings.length > 0 ? 
  this.results.warnings.map(warning => `- ⚠️ ${warning}`).join('\n') : 
  'No warnings ✅'
}

## Recommendations

${this.results.recommendations.length > 0 ? 
  this.results.recommendations.map(rec => `- 💡 ${rec}`).join('\n') : 
  'No recommendations'
}

${this.results.untestedFiles && this.results.untestedFiles.length > 0 ? `
## Untested Files

${this.results.untestedFiles.map(file => `- \`${file}\``).join('\n')}
` : ''}
`;

    fs.writeFileSync(path.join(reportsDir, 'coverage-report.md'), report);
  }

  generateRecommendations() {
    // Analyze results and generate actionable recommendations
    if (this.results.errors.length > 0) {
      this.results.recommendations.push(
        'Address all coverage errors before deployment'
      );
    }
    
    if (this.results.warnings.length > 5) {
      this.results.recommendations.push(
        'Consider increasing test coverage to reduce warnings'
      );
    }
    
    if (this.results.untestedFiles && this.results.untestedFiles.length > 0) {
      this.results.recommendations.push(
        `Add tests for ${this.results.untestedFiles.length} untested files`
      );
    }
    
    // Add specific recommendations based on coverage patterns
    const coverage = this.results.metrics.coverage;
    if (coverage) {
      if (coverage.branches.pct < coverage.lines.pct - 10) {
        this.results.recommendations.push(
          'Focus on improving branch coverage with more conditional logic tests'
        );
      }
      
      if (coverage.functions.pct < 90) {
        this.results.recommendations.push(
          'Add tests for uncovered functions to improve function coverage'
        );
      }
    }
  }

  displayResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 COVERAGE VALIDATION RESULTS');
    console.log('='.repeat(60));
    
    console.log(`\\n🎯 Status: ${this.results.errors.length === 0 ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`📈 Errors: ${this.results.errors.length}`);
    console.log(`⚠️  Warnings: ${this.results.warnings.length}`);
    
    if (this.results.metrics.coverage) {
      const coverage = this.results.metrics.coverage;
      console.log('\\n📊 Coverage Metrics:');
      console.log(`   Lines: ${coverage.lines.pct}%`);
      console.log(`   Branches: ${coverage.branches.pct}%`);
      console.log(`   Functions: ${coverage.functions.pct}%`);
      console.log(`   Statements: ${coverage.statements.pct}%`);
    }
    
    if (this.results.errors.length > 0) {
      console.log('\\n❌ Errors:');
      this.results.errors.forEach(error => console.log(`   • ${error}`));
    }
    
    if (this.results.warnings.length > 0) {
      console.log('\\n⚠️  Warnings:');
      this.results.warnings.forEach(warning => console.log(`   • ${warning}`));
    }
    
    if (this.results.recommendations.length > 0) {
      console.log('\\n💡 Recommendations:');
      this.results.recommendations.forEach(rec => console.log(`   • ${rec}`));
    }
    
    console.log('\\n📁 Reports generated in: coverage-reports/');
    console.log('='.repeat(60));
    
    // Exit with appropriate code
    process.exit(this.results.errors.length === 0 ? 0 : 1);
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new CoverageValidator();
  validator.validate().catch(error => {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  });
}

module.exports = CoverageValidator;