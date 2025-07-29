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

const args = [
  '--config', 'jest.integration.config.js',
  '--watchAll=false',
  '--verbose',
  ...process.argv.slice(2) // Pass through any additional arguments
];

console.log('🧪 Running integration tests...');
console.log(`📡 API Mode: ${process.env.USE_REAL_API === 'true' ? 'REAL' : 'MOCK'}`);
console.log('');

const jest = spawn('npx', ['jest', ...args], {
  stdio: 'inherit',
  shell: true,
  env: process.env
});

jest.on('close', (code) => {
  process.exit(code);
});