const fs = require('fs');
const coverage = JSON.parse(fs.readFileSync('coverage/coverage-summary.json', 'utf-8'));

// Filter out the total and sort by coverage percentage
const files = Object.entries(coverage)
  .filter(([key]) => key !== 'total')
  .map(([path, data]) => ({
    path,
    filename: path.split('/').pop(),
    lines: data.lines.pct,
    statements: data.statements.pct,
    functions: data.functions.pct,
    branches: data.branches.pct,
    uncoveredLines: data.lines.total - data.lines.covered
  }))
  .sort((a, b) => a.lines - b.lines);

console.log('\n=== FILES WITH LOWEST COVERAGE (0-50%) ===');
console.log('Priority targets for testing agents:\n');

const lowCoverage = files.filter(f => f.lines < 50);
lowCoverage.slice(0, 30).forEach((file, index) => {
  console.log(`${index + 1}. ${file.lines.toFixed(1)}% - ${file.filename} (${file.uncoveredLines} lines to cover)`);
});

console.log(`\nTotal files with <50% coverage: ${lowCoverage.length}`);
console.log(`Total uncovered lines in low coverage files: ${lowCoverage.reduce((sum, f) => sum + f.uncoveredLines, 0)}`);

// Group by directory
const byDirectory = {};
files.forEach(file => {
  const parts = file.path.split('/');
  const dir = parts.slice(0, -1).join('/').replace(/.*\/src\//, 'src/');
  if (!byDirectory[dir]) byDirectory[dir] = { files: 0, totalLines: 0, coveredLines: 0 };
  byDirectory[dir].files++;
  const fileData = coverage[file.path];
  byDirectory[dir].totalLines += fileData.lines.total;
  byDirectory[dir].coveredLines += fileData.lines.covered;
});

console.log('\n=== COVERAGE BY DIRECTORY ===');
Object.entries(byDirectory)
  .map(([dir, data]) => ({
    dir,
    coverage: (data.coveredLines / data.totalLines * 100).toFixed(1),
    uncovered: data.totalLines - data.coveredLines,
    files: data.files
  }))
  .sort((a, b) => a.coverage - b.coverage)
  .forEach(dir => {
    console.log(`${dir.coverage}% - ${dir.dir} (${dir.files} files, ${dir.uncovered} lines to cover)`);
  });

// Calculate how many lines needed to reach 70%
const totalLines = coverage.total.lines.total;
const currentCovered = coverage.total.lines.covered;
const targetCovered = Math.ceil(totalLines * 0.7);
const linesNeeded = targetCovered - currentCovered;

console.log('\n=== TARGET CALCULATION ===');
console.log(`Current coverage: ${coverage.total.lines.pct.toFixed(2)}% (${currentCovered}/${totalLines} lines)`);
console.log(`Target coverage: 70% (${targetCovered}/${totalLines} lines)`);
console.log(`Lines needed: ${linesNeeded}`);