const { execSync } = require('child_process');

console.log('Running quick test check...\n');

const testFiles = [
  'src/__tests__/services/mindmap/mindMapGenerator.test.ts',
  'src/__tests__/services/llm/provider.test.ts',
  'src/__tests__/services/llm/generators/content-generator.test.ts',
  'src/__tests__/services/quiz/enhancedQuizGenerator.test.ts',
  'src/App.test.tsx'
];

let passed = 0;
let failed = 0;

testFiles.forEach(file => {
  try {
    console.log(`Testing ${file}...`);
    execSync(`npm test -- ${file} --no-watch --passWithNoTests`, { 
      stdio: 'pipe',
      timeout: 30000 
    });
    console.log(`✅ PASSED: ${file}`);
    passed++;
  } catch (error) {
    console.log(`❌ FAILED: ${file}`);
    if (error.stdout) {
      const output = error.stdout.toString();
      const failureMatch = output.match(/✕ (.+)/g);
      if (failureMatch) {
        failureMatch.slice(0, 3).forEach(f => console.log(`  ${f}`));
      }
    }
    failed++;
  }
  console.log('');
});

console.log(`\nSummary: ${passed} passed, ${failed} failed out of ${testFiles.length} test files`);