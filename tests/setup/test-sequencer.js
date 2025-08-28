"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Custom Jest Test Sequencer
 * Controls the order of test execution for optimal performance
 */
class TestSequencer {
    sort(tests) {
        // Define test priorities (lower number = higher priority)
        const priorities = {
            // Unit tests run first (fastest)
            unit: 1,
            // Integration tests run second
            integration: 2,
            // Performance tests run third (resource intensive)
            performance: 3,
            // E2E tests run last (slowest)
            e2e: 4,
            // Default priority
            default: 5
        };
        const getTestPriority = (testPath) => {
            if (testPath.includes('/unit/'))
                return priorities.unit;
            if (testPath.includes('/integration/'))
                return priorities.integration;
            if (testPath.includes('/performance/'))
                return priorities.performance;
            if (testPath.includes('/e2e/'))
                return priorities.e2e;
            // Check for specific test patterns
            if (testPath.includes('.unit.test.'))
                return priorities.unit;
            if (testPath.includes('.integration.test.'))
                return priorities.integration;
            if (testPath.includes('.performance.test.'))
                return priorities.performance;
            if (testPath.includes('.e2e.test.'))
                return priorities.e2e;
            return priorities.default;
        };
        // Sort tests by priority, then by path for consistency
        return tests.sort((testA, testB) => {
            const priorityA = getTestPriority(testA.path);
            const priorityB = getTestPriority(testB.path);
            if (priorityA !== priorityB) {
                return priorityA - priorityB;
            }
            // Same priority, sort alphabetically
            return testA.path.localeCompare(testB.path);
        });
    }
}
exports.default = TestSequencer;
//# sourceMappingURL=test-sequencer.js.map