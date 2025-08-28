/**
 * Custom Jest Test Sequencer
 * Controls the order of test execution for optimal performance
 */
declare class TestSequencer {
    sort(tests: Array<{
        path: string;
        context: any;
    }>): Array<{
        path: string;
        context: any;
    }>;
}
export default TestSequencer;
//# sourceMappingURL=test-sequencer.d.ts.map