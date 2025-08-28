/**
 * Custom Test Sequencer for API Automation Tests
 * Ensures tests run in optimal order to minimize conflicts
 */

const Sequencer = require('@jest/test-sequencer').default;

class ApiTestSequencer extends Sequencer {
  sort(tests) {
    // Define test execution order for optimal API testing
    const testOrder = [
      'auth.test.ts',           // Authentication first
      'validation.test.ts',     // Input validation 
      'workflows-api.test.ts',  // Main API functionality
      'executions-api.test.ts', // Execution management
      'websocket.test.ts',      // Real-time features
      'rate-limiting.test.ts'   // Rate limiting last (can be disruptive)
    ];
    
    return tests.sort((testA, testB) => {
      const aName = this.getTestName(testA.path);
      const bName = this.getTestName(testB.path);
      
      const aIndex = testOrder.indexOf(aName);
      const bIndex = testOrder.indexOf(bName);
      
      // If both tests are in our ordered list, sort by that order
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      
      // If only one is in the list, prioritize it
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      
      // For tests not in our list, sort alphabetically
      return aName.localeCompare(bName);
    });
  }
  
  getTestName(testPath) {
    return testPath.split('/').pop() || '';
  }
}

module.exports = ApiTestSequencer;
