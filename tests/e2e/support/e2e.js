"use strict";
// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
// ***********************************************************
Object.defineProperty(exports, "__esModule", { value: true });
require("./commands");
require("@cypress/code-coverage/support");
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
    this.assert(uuidRegex.test(obj), 'expected #{this} to be a valid UUID', 'expected #{this} not to be a valid UUID', obj);
});
Chai.Assertion.addMethod('haveValidEmail', function () {
    const obj = this._obj;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    this.assert(emailRegex.test(obj), 'expected #{this} to be a valid email', 'expected #{this} not to be a valid email', obj);
});
//# sourceMappingURL=e2e.js.map