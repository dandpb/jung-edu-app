#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Find all test files
const testFiles = [];

function findTests(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !fullPath.includes('node_modules') && !fullPath.includes('.git')) {
      findTests(fullPath);
    } else if (file.endsWith('.test.ts') || file.endsWith('.test.tsx')) {
      testFiles.push(fullPath);
    }
  });
}

findTests('./src');

console.log(`Found ${testFiles.length} test files\n`);

// Run each test file individually
let passed = 0;
let failed = 0;
let current = 0;

function runNextTest() {
  if (current >= testFiles.length) {
    console.log('\n=== SUMMARY ===');
    console.log(`Total: ${testFiles.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    return;
  }

  const testFile = testFiles[current];
  const relativePath = path.relative(process.cwd(), testFile);
  current++;

  console.log(`[${current}/${testFiles.length}] Running: ${relativePath}`);
  
  exec(`npm test -- --no-watch --testPathPattern="${relativePath}" --passWithNoTests`, 
    { timeout: 30000 }, 
    (error, stdout, stderr) => {
      if (error || stdout.includes('FAIL')) {
        console.log(`  ❌ FAILED`);
        failed++;
        
        // Extract failure details
        const failMatch = stdout.match(/● (.+)/);
        if (failMatch) {
          console.log(`     ${failMatch[1]}`);
        }
      } else {
        console.log(`  ✅ PASSED`);
        passed++;
      }
      
      runNextTest();
    }
  );
}

runNextTest();