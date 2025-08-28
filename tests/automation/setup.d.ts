/**
 * Jest Setup for Workflow Automation Tests
 * Configures London School TDD environment with comprehensive mocking
 */
declare global {
    function createSwarmMock(serviceName: string, methods: Record<string, jest.Mock>): any;
    function extendSwarmMock(baseMock: any, extensions: Record<string, jest.Mock>): any;
    function getAllMockCalls(): any[];
    function clearSwarmCallHistory(): void;
    function createMockCoordinator(): any;
    function defineContract(name: string, contract: any): any;
    function getContract(name: string): any;
    function simulateError(errorType: string, probability?: number): never;
    function withTimeout<T>(fn: () => Promise<T>, timeout?: number): Promise<T>;
    function restoreConsole(): void;
    function measurePerformance<T>(fn: () => Promise<T>): Promise<{
        result: T;
        executionTime: number;
        memoryUsage: any;
    }>;
    function mockTime(timestamp: string | number | Date): Date;
    function runInParallel<T>(tasks: (() => Promise<T>)[]): Promise<T[]>;
    function validateMockInteractions(mock: jest.Mock, expectedContract: any): boolean;
    function verifyCollaboratorInteractions(collaborators: Record<string, jest.Mock>): any[];
    var mockStateManager: {
        setState(key: string, value: any): void;
        getState(key: string): any;
        clearState(): void;
        getAllState(): Record<string, any>;
    };
    var TestDoubles: {
        createSpy: (implementation?: any) => jest.Mock;
        createStub: (returnValue: any) => jest.Mock;
        createMock: (methods: string[]) => any;
        createFake: (behavior: Record<string, any>) => any;
    };
    var TEST_CONFIG: {
        TIMEOUT: number;
        RETRY_ATTEMPTS: number;
        PARALLEL_EXECUTION: boolean;
        MOCK_INTERACTIONS: boolean;
        PERFORMANCE_MONITORING: boolean;
    };
    var swarmCallHistory: any[];
    var contractRegistry: Map<string, any>;
    namespace jest {
        interface Matchers<R> {
            toHaveBeenCalledBefore(expected: jest.Mock): R;
            toHaveBeenCalledAfter(expected: jest.Mock): R;
            toSatisfyContract(contract: any): R;
        }
    }
}
export {};
//# sourceMappingURL=setup.d.ts.map