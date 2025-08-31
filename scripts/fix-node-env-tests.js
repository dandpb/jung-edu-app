#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const testFiles = [
  'src/config/__tests__/supabase.comprehensive.test.ts',
  'src/components/common/__tests__/ErrorBoundary.test.tsx',
  'src/components/common/__tests__/ErrorBoundary.comprehensive.test.tsx',
  'src/services/llm/providers/__tests__/openai.comprehensive.test.ts',
  'src/services/llm/__tests__/config.comprehensive.test.ts'
];

const projectRoot = path.resolve(__dirname, '..');

testFiles.forEach(file => {
  const filePath = path.join(projectRoot, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;
  
  // Add import if not present
  const importStatement = file.endsWith('.tsx') 
    ? "import { setNodeEnv, restoreNodeEnv } from '../../test-utils/nodeEnvHelper';"
    : "import { setNodeEnv, restoreNodeEnv } from '../../../test-utils/nodeEnvHelper';";
  
  if (!content.includes('nodeEnvHelper') && content.includes("process.env.NODE_ENV = ")) {
    // Find the first import statement
    const importMatch = content.match(/^import .* from .*;$/m);
    if (importMatch) {
      const lastImportIndex = content.lastIndexOf(importMatch[0]) + importMatch[0].length;
      content = content.slice(0, lastImportIndex) + '\n' + importStatement + content.slice(lastImportIndex);
      modified = true;
    }
  }
  
  // Replace process.env.NODE_ENV assignments
  const originalContent = content;
  content = content.replace(/process\.env\.NODE_ENV = '(\w+)'/g, "setNodeEnv('$1')");
  
  // Replace process.env.NODE_ENV restorations
  content = content.replace(/process\.env\.NODE_ENV = originalEnv/g, "restoreNodeEnv(originalEnv)");
  content = content.replace(/process\.env\.NODE_ENV = originalNodeEnv/g, "restoreNodeEnv(originalNodeEnv)");
  
  if (content !== originalContent) {
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${file}`);
  } else {
    console.log(`No changes needed: ${file}`);
  }
});

console.log('Done!');