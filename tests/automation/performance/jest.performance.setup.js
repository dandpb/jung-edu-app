/**
 * Jest Performance Test Setup
 * Configure the test environment for memory-efficient performance testing
 */

const { setupJestCleanupHooks, getJestCleanupManager } = require('./test-cleanup-manager');
const { createJestPerformanceMonitor } = require('./performance-monitor');

// Global performance monitor
global.performanceMonitor = null;
global.cleanupManager = null;

// Memory monitoring
let memoryWarningShown = false;

/**
 * Setup performance test environment
 */
beforeAll(async () => {
  console.log('🚀 Setting up performance test environment');

  // Enable garbage collection
  if (global.gc) {
    console.log('✅ Garbage collection enabled');
    global.gc();
  } else {
    console.warn('⚠️ Garbage collection not available. Run with --expose-gc');
  }

  // Setup cleanup hooks
  setupJestCleanupHooks();

  // Initialize cleanup manager
  global.cleanupManager = getJestCleanupManager();

  // Initialize performance monitor
  global.performanceMonitor = createJestPerformanceMonitor();

  // Setup memory monitoring
  setupMemoryMonitoring();

  // Setup error handlers
  setupErrorHandlers();

  // Initial cleanup
  await performInitialCleanup();

  console.log('✅ Performance test environment ready');
});

/**
 * Cleanup after all tests
 */
afterAll(async () => {
  console.log('🧹 Cleaning up performance test environment');

  try {
    // Stop performance monitoring
    if (global.performanceMonitor && typeof global.performanceMonitor.stopMonitoring === 'function') {
      const report = global.performanceMonitor.stopMonitoring();
      console.log('📊 Performance monitoring report saved');
    }

    // Final cleanup
    if (global.cleanupManager) {
      await global.cleanupManager.destroy();
    }

    // Force final garbage collection
    if (global.gc) {
      global.gc();
    }

    console.log('✅ Performance test environment cleaned up');

  } catch (error) {
    console.error('❌ Error during performance test cleanup:', error);
  }
});

/**
 * Setup before each test
 */
beforeEach(async () => {
  const testName = expect.getState().currentTestName || 'unknown';
  
  // Start performance monitoring for the test
  if (global.performanceMonitor && typeof global.performanceMonitor.startMonitoring === 'function') {
    global.performanceMonitor.startMonitoring(testName);
  }

  // Check memory before test
  const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
  if (memoryUsage > 200) { // 200MB threshold
    console.warn(`⚠️ High memory usage before test: ${memoryUsage.toFixed(2)}MB`);
    
    if (global.cleanupManager) {
      await global.cleanupManager.performCleanup('automatic');
    }
  }
});

/**
 * Cleanup after each test
 */
afterEach(async () => {
  const testName = expect.getState().currentTestName || 'unknown';

  try {
    // Stop performance monitoring
    if (global.performanceMonitor && typeof global.performanceMonitor.stopMonitoring === 'function') {
      const report = global.performanceMonitor.stopMonitoring();
      
      // Log warnings for poor performance
      if (report.summary.maxMemoryUsage > 150) {
        console.warn(`⚠️ Test used high memory: ${report.summary.maxMemoryUsage.toFixed(2)}MB`);
      }
    }

    // Cleanup test resources
    if (global.cleanupManager) {
      await global.cleanupManager.cleanupTestResources(testName);
    }

    // Force garbage collection after each test
    if (global.gc) {
      global.gc();
    }

  } catch (error) {
    console.error(`❌ Error cleaning up after test ${testName}:`, error);
  }
});

/**
 * Setup memory monitoring
 */
function setupMemoryMonitoring() {
  // Monitor memory usage every 10 seconds during tests
  const memoryMonitor = setInterval(() => {
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
    
    // Warn if memory usage is high
    if (heapUsedMB > 300 && !memoryWarningShown) {
      console.warn(`🚨 High memory usage detected: ${heapUsedMB.toFixed(2)}MB`);
      memoryWarningShown = true;
      
      // Emergency cleanup
      if (global.cleanupManager) {
        global.cleanupManager.performEmergencyCleanup().catch(error => {
          console.error('Emergency cleanup failed:', error);
        });
      }
    }

    // Reset warning flag if memory usage drops
    if (heapUsedMB < 200) {
      memoryWarningShown = false;
    }

  }, 10000);

  // Clear interval on exit
  process.on('exit', () => {
    clearInterval(memoryMonitor);
  });
}

/**
 * Setup error handlers for performance tests
 */
function setupErrorHandlers() {
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
    
    // Attempt cleanup
    if (global.cleanupManager) {
      global.cleanupManager.performEmergencyCleanup().catch(() => {
        // Silent fail for cleanup during error handling
      });
    }
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('🚨 Uncaught Exception:', error);
    
    // Attempt cleanup before exit
    if (global.cleanupManager) {
      global.cleanupManager.performEmergencyCleanup().catch(() => {
        // Silent fail for cleanup during error handling
      }).finally(() => {
        process.exit(1);
      });
    } else {
      process.exit(1);
    }
  });

  // Handle out of memory errors specifically
  process.on('warning', (warning) => {
    if (warning.name === 'MaxListenersExceededWarning' || 
        warning.message.includes('memory')) {
      console.warn('🚨 Memory warning:', warning.message);
      
      if (global.cleanupManager) {
        global.cleanupManager.performEmergencyCleanup().catch(() => {
          // Silent fail for cleanup during warning
        });
      }
    }
  });
}

/**
 * Perform initial cleanup
 */
async function performInitialCleanup() {
  try {
    // Clear any existing caches
    if (require.cache) {
      // Don't clear all require cache as it can break Jest
      // Instead, just clear test-specific modules
      Object.keys(require.cache).forEach(key => {
        if (key.includes('/tests/') && key.includes('/performance/')) {
          delete require.cache[key];
        }
      });
    }

    // Initial garbage collection
    if (global.gc) {
      global.gc();
    }

    // Wait for cleanup to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    const initialMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    console.log(`📊 Initial memory usage: ${initialMemory.toFixed(2)}MB`);

  } catch (error) {
    console.error('❌ Error during initial cleanup:', error);
  }
}

/**
 * Custom Jest matchers for performance testing
 */
expect.extend({
  toBeWithinMemoryLimit(received, limit) {
    const pass = received <= limit;
    if (pass) {
      return {
        message: () => `Expected ${received}MB to exceed memory limit of ${limit}MB`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected ${received}MB to be within memory limit of ${limit}MB`,
        pass: false,
      };
    }
  },

  toBeWithinTimeLimit(received, limit) {
    const pass = received <= limit;
    if (pass) {
      return {
        message: () => `Expected ${received}ms to exceed time limit of ${limit}ms`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected ${received}ms to be within time limit of ${limit}ms`,
        pass: false,
      };
    }
  },

  toHaveAcceptablePerformance(received) {
    const { duration, memoryUsage, success } = received;
    const withinTimeLimit = duration <= 120000; // 2 minutes
    const withinMemoryLimit = memoryUsage <= 300; // 300MB
    const pass = withinTimeLimit && withinMemoryLimit && success;

    if (pass) {
      return {
        message: () => `Expected performance to be unacceptable`,
        pass: true,
      };
    } else {
      const issues = [];
      if (!withinTimeLimit) issues.push(`duration ${duration}ms exceeds limit`);
      if (!withinMemoryLimit) issues.push(`memory ${memoryUsage}MB exceeds limit`);
      if (!success) issues.push('test failed');

      return {
        message: () => `Expected acceptable performance but found issues: ${issues.join(', ')}`,
        pass: false,
      };
    }
  }
});

// Export utilities for use in tests
module.exports = {
  getPerformanceMonitor: () => global.performanceMonitor,
  getCleanupManager: () => global.cleanupManager,
  forceGarbageCollection: () => {
    if (global.gc) {
      global.gc();
      return true;
    }
    return false;
  },
  getCurrentMemoryUsage: () => process.memoryUsage().heapUsed / 1024 / 1024
};