/**
 * Global Jest Setup - Fixed version
 */
export {};
declare global {
    namespace jest {
        interface Matchers<R> {
            toBeValidUUID(): R;
            toBeValidEmail(): R;
            toBeOneOf(validValues: any[]): R;
            toBeBoolean(): R;
        }
    }
}
//# sourceMappingURL=jest-setup.d.ts.map