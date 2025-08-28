declare global {
    namespace Cypress {
        interface Chainable {
            getByTestId(testId: string): Chainable<JQuery<HTMLElement>>;
            findByTestId(testId: string): Chainable<JQuery<HTMLElement>>;
            uploadFile(selector: string, fileName: string, fileType?: string): Chainable<void>;
            apiLogin(email: string, password: string): Chainable<string>;
            apiCreateCourse(courseData: any, authToken: string): Chainable<Response<any>>;
            mockAPI(method: string, url: string, response: any, statusCode?: number): Chainable<void>;
            measurePerformance(callback: () => void): Chainable<void>;
            checkA11y(): Chainable<void>;
            testResponsive(callback: () => void): Chainable<void>;
        }
    }
}
//# sourceMappingURL=commands.d.ts.map