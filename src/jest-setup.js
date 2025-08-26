// Jest setup file to ensure proper timer functions and environment setup

// Ensure global timer functions are available
if (typeof global.setTimeout === 'undefined') {
  global.setTimeout = setTimeout;
}
if (typeof global.clearTimeout === 'undefined') {
  global.clearTimeout = clearTimeout;
}
if (typeof global.setInterval === 'undefined') {
  global.setInterval = setInterval;
}
if (typeof global.clearInterval === 'undefined') {
  global.clearInterval = clearInterval;
}
if (typeof global.setImmediate === 'undefined') {
  global.setImmediate = (fn) => setTimeout(fn, 0);
}
if (typeof global.clearImmediate === 'undefined') {
  global.clearImmediate = clearTimeout;
}

// Also ensure they're available on window for browser-like environment
if (typeof window !== 'undefined') {
  window.setTimeout = global.setTimeout;
  window.clearTimeout = global.clearTimeout;
  window.setInterval = global.setInterval;
  window.clearInterval = global.clearInterval;
}

// Increase timeout for async operations - consistent with jest.config.js
jest.setTimeout(30000);

// Global test environment setup
global.IS_REACT_ACT_ENVIRONMENT = true;