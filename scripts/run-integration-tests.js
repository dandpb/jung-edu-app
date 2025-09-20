#!/usr/bin/env node

/**
 * Script to run integration tests with proper environment setup
 */

const { spawn } = require('child_process');
const path = require('path');

// Set environment variables for integration tests
process.env.USE_REAL_API = process.env.USE_REAL_API || 'false';
process.env.NODE_ENV = 'test';
// Make sure SKIP_INTEGRATION is not set
delete process.env.SKIP_INTEGRATION;

const configFile = process.env.USE_OPTIMIZED_CONFIG === 'true'
  ? 'jest.integration.optimized.config.js'
  : 'jest.integration.config.js';

const args = [
  '--config', configFile,
  '--watchAll=false',
  '--verbose',
  '--runInBand', // Run tests serially for better resource management
  '--detectOpenHandles',
  '--forceExit',
  ...process.argv.slice(2) // Pass through any additional arguments
];

console.log('🧪 Running integration tests...');
console.log(`📡 API Mode: ${process.env.USE_REAL_API === 'true' ? 'REAL' : 'MOCK'}`);
console.log(`⚡ Config: ${configFile}`);
if (process.env.CI) {
  console.log('🏗️  CI Mode: Optimized for continuous integration');
}
console.log('');

const jest = spawn('npx', ['jest', ...args], {
  stdio: 'inherit',
  shell: true,
  env: process.env
});

jest.on('close', (code) => {
  process.exit(code);
});