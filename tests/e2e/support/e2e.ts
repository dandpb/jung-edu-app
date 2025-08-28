// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
// ***********************************************************

import './commands';
import '@cypress/code-coverage/support';

// Configure Cypress behavior
Cypress.on('uncaught:exception', (err, runnable) => {
  // Returning false here prevents Cypress from failing the test
  // on uncaught exceptions that we don't care about in tests
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  return true;
});

// Global hooks
beforeEach(() => {
  // Reset database state before each test
  cy.task('db:clean');
  cy.task('api:reset');
  
  // Set viewport for consistent testing
  cy.viewport(1280, 720);
  
  // Intercept common API calls
  cy.intercept('GET', '/api/health', { fixture: 'health-check.json' }).as('healthCheck');
});

after(() => {
  // Cleanup after all tests
  cy.task('db:clean');
});

// Custom assertions
Chai.Assertion.addMethod('haveValidUUID', function () {
  const obj = this._obj;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  this.assert(
    uuidRegex.test(obj),
    'expected #{this} to be a valid UUID',
    'expected #{this} not to be a valid UUID',
    obj
  );
});

Chai.Assertion.addMethod('haveValidEmail', function () {
  const obj = this._obj;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  this.assert(
    emailRegex.test(obj),
    'expected #{this} to be a valid email',
    'expected #{this} not to be a valid email',
    obj
  );
});

// Global types
declare global {
  namespace Cypress {
    interface Chainable {
      // Authentication commands
      login(email?: string, password?: string): Chainable<void>;
      loginAs(role: 'student' | 'teacher' | 'admin'): Chainable<void>;
      logout(): Chainable<void>;
      
      // Navigation commands
      visitDashboard(): Chainable<void>;
      visitCourse(courseId: string): Chainable<void>;
      visitProfile(): Chainable<void>;
      
      // Form commands
      fillLoginForm(email: string, password: string): Chainable<void>;
      fillRegistrationForm(userData: any): Chainable<void>;
      
      // Course commands
      createCourse(courseData: any): Chainable<void>;
      enrollInCourse(courseId: string): Chainable<void>;
      completLesson(lessonId: string): Chainable<void>;
      
      // Assertion commands
      shouldBeOnPage(page: string): Chainable<void>;
      shouldShowSuccessMessage(message?: string): Chainable<void>;
      shouldShowErrorMessage(message?: string): Chainable<void>;
      
      // Wait commands
      waitForLoader(): Chainable<void>;
      waitForAPI(): Chainable<void>;
      
      // Database commands
      seedDatabase(data: any): Chainable<void>;
      cleanDatabase(): Chainable<void>;
    }
    
    interface Assertion {
      haveValidUUID(): void;
      haveValidEmail(): void;
    }
  }
}
