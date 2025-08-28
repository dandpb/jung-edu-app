import './commands';
import '@cypress/code-coverage/support';
declare global {
    namespace Cypress {
        interface Chainable {
            login(email?: string, password?: string): Chainable<void>;
            loginAs(role: 'student' | 'teacher' | 'admin'): Chainable<void>;
            logout(): Chainable<void>;
            visitDashboard(): Chainable<void>;
            visitCourse(courseId: string): Chainable<void>;
            visitProfile(): Chainable<void>;
            fillLoginForm(email: string, password: string): Chainable<void>;
            fillRegistrationForm(userData: any): Chainable<void>;
            createCourse(courseData: any): Chainable<void>;
            enrollInCourse(courseId: string): Chainable<void>;
            completLesson(lessonId: string): Chainable<void>;
            shouldBeOnPage(page: string): Chainable<void>;
            shouldShowSuccessMessage(message?: string): Chainable<void>;
            shouldShowErrorMessage(message?: string): Chainable<void>;
            waitForLoader(): Chainable<void>;
            waitForAPI(): Chainable<void>;
            seedDatabase(data: any): Chainable<void>;
            cleanDatabase(): Chainable<void>;
        }
        interface Assertion {
            haveValidUUID(): void;
            haveValidEmail(): void;
        }
    }
}
//# sourceMappingURL=e2e.d.ts.map