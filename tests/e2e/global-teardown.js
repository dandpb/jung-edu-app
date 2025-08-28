"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
async function globalTeardown(config) {
    console.log('Starting global teardown...');
    // Clean up temporary files if needed
    const tempDir = path_1.default.join(__dirname, 'temp');
    if (fs_1.default.existsSync(tempDir)) {
        fs_1.default.rmSync(tempDir, { recursive: true, force: true });
    }
    // Generate test summary report
    const reportsDir = path_1.default.join(__dirname, 'reports');
    const testResultsFile = path_1.default.join(reportsDir, 'test-results.json');
    if (fs_1.default.existsSync(testResultsFile)) {
        try {
            const results = JSON.parse(fs_1.default.readFileSync(testResultsFile, 'utf-8'));
            const summary = {
                timestamp: new Date().toISOString(),
                total: results.stats?.total || 0,
                passed: results.stats?.passed || 0,
                failed: results.stats?.failed || 0,
                skipped: results.stats?.skipped || 0,
                duration: results.stats?.duration || 0,
                projects: results.stats?.projects || {},
            };
            fs_1.default.writeFileSync(path_1.default.join(reportsDir, 'test-summary.json'), JSON.stringify(summary, null, 2));
            console.log('Test Summary:');
            console.log(`Total: ${summary.total}`);
            console.log(`Passed: ${summary.passed}`);
            console.log(`Failed: ${summary.failed}`);
            console.log(`Skipped: ${summary.skipped}`);
            console.log(`Duration: ${summary.duration}ms`);
        }
        catch (error) {
            console.log('Could not generate test summary:', error.message);
        }
    }
    console.log('Global teardown completed.');
}
exports.default = globalTeardown;
//# sourceMappingURL=global-teardown.js.map