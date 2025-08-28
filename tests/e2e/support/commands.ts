// ***********************************************
// Custom Cypress Commands for jaqEdu Platform
// ***********************************************

// Authentication Commands
Cypress.Commands.add('login', (email = 'test.student@example.com', password = 'TestPass123!') => {
  cy.visit('/login');
  cy.get('[data-testid="email-input"]').type(email);
  cy.get('[data-testid="password-input"]').type(password);
  cy.get('[data-testid="login-button"]').click();
  
  // Wait for redirect after successful login
  cy.url().should('not.include', '/login');
  cy.get('[data-testid="user-menu"]').should('be.visible');
});

Cypress.Commands.add('loginAs', (role: 'student' | 'teacher' | 'admin') => {
  const credentials = {
    student: { email: 'test.student@example.com', password: 'TestPass123!' },
    teacher: { email: 'test.teacher@example.com', password: 'TestPass123!' },
    admin: { email: 'test.admin@example.com', password: 'TestPass123!' }
  };
  
  const { email, password } = credentials[role];
  cy.login(email, password);
});

Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="user-menu"]').click();
  cy.get('[data-testid="logout-button"]').click();
  
  // Verify logout was successful
  cy.url().should('include', '/login');
  cy.get('[data-testid="login-form"]').should('be.visible');
});

// Navigation Commands
Cypress.Commands.add('visitDashboard', () => {
  cy.visit('/dashboard');
  cy.get('[data-testid="dashboard-header"]').should('be.visible');
});

Cypress.Commands.add('visitCourse', (courseId: string) => {
  cy.visit(`/courses/${courseId}`);
  cy.get('[data-testid="course-header"]').should('be.visible');
});

Cypress.Commands.add('visitProfile', () => {
  cy.visit('/profile');
  cy.get('[data-testid="profile-form"]').should('be.visible');
});

// Form Commands
Cypress.Commands.add('fillLoginForm', (email: string, password: string) => {
  cy.get('[data-testid="email-input"]').clear().type(email);
  cy.get('[data-testid="password-input"]').clear().type(password);
});

Cypress.Commands.add('fillRegistrationForm', (userData: any) => {
  cy.get('[data-testid="first-name-input"]').type(userData.firstName);
  cy.get('[data-testid="last-name-input"]').type(userData.lastName);
  cy.get('[data-testid="email-input"]').type(userData.email);
  cy.get('[data-testid="username-input"]').type(userData.username);
  cy.get('[data-testid="password-input"]').type(userData.password);
  cy.get('[data-testid="confirm-password-input"]').type(userData.confirmPassword);
  
  if (userData.agreeToTerms) {
    cy.get('[data-testid="terms-checkbox"]').check();
  }
});

// Course Commands
Cypress.Commands.add('createCourse', (courseData: any) => {
  cy.visit('/courses/create');
  
  cy.get('[data-testid="course-title-input"]').type(courseData.title);
  cy.get('[data-testid="course-description-input"]').type(courseData.description);
  
  if (courseData.category) {
    cy.get('[data-testid="category-select"]').select(courseData.category);
  }
  
  if (courseData.level) {
    cy.get('[data-testid="level-select"]').select(courseData.level);
  }
  
  if (courseData.price !== undefined) {
    cy.get('[data-testid="price-input"]').clear().type(courseData.price.toString());
  }
  
  cy.get('[data-testid="create-course-button"]').click();
  
  // Wait for course creation
  cy.get('[data-testid="course-created-message"]').should('be.visible');
});

Cypress.Commands.add('enrollInCourse', (courseId: string) => {
  cy.visitCourse(courseId);
  cy.get('[data-testid="enroll-button"]').click();
  
  // Handle free vs paid course enrollment
  cy.get('body').then($body => {
    if ($body.find('[data-testid="confirm-enrollment-button"]').length > 0) {
      cy.get('[data-testid="confirm-enrollment-button"]').click();
    }
  });
  
  cy.get('[data-testid="enrollment-success-message"]').should('be.visible');
});

Cypress.Commands.add('completeLesson', (lessonId: string) => {
  cy.get(`[data-testid="lesson-${lessonId}"]`).click();
  
  // Wait for lesson content to load
  cy.get('[data-testid="lesson-content"]').should('be.visible');
  
  // Simulate watching/reading the lesson
  cy.get('[data-testid="mark-complete-button"]').should('be.visible').click();
  
  // Verify lesson completion
  cy.get('[data-testid="lesson-completed-indicator"]').should('be.visible');
});

// Assertion Commands
Cypress.Commands.add('shouldBeOnPage', (page: string) => {
  cy.url().should('include', page);
  cy.get(`[data-testid="${page}-page"]`).should('be.visible');
});

Cypress.Commands.add('shouldShowSuccessMessage', (message?: string) => {
  cy.get('[data-testid="success-message"]').should('be.visible');
  
  if (message) {
    cy.get('[data-testid="success-message"]').should('contain.text', message);
  }
});

Cypress.Commands.add('shouldShowErrorMessage', (message?: string) => {
  cy.get('[data-testid="error-message"]').should('be.visible');
  
  if (message) {
    cy.get('[data-testid="error-message"]').should('contain.text', message);
  }
});

// Wait Commands
Cypress.Commands.add('waitForLoader', () => {
  // Wait for loader to appear and then disappear
  cy.get('[data-testid="loader"]').should('be.visible');
  cy.get('[data-testid="loader"]').should('not.exist');
});

Cypress.Commands.add('waitForAPI', () => {
  // Wait for any pending API calls to complete
  cy.intercept('**/api/**').as('apiCall');
  cy.wait('@apiCall', { timeout: 10000 });
});

// Database Commands
Cypress.Commands.add('seedDatabase', (data: any) => {
  cy.task('db:seed', data);
});

Cypress.Commands.add('cleanDatabase', () => {
  cy.task('db:clean');
});

// Utility Commands
Cypress.Commands.add('getByTestId', (testId: string) => {
  return cy.get(`[data-testid="${testId}"]`);
});

Cypress.Commands.add('findByTestId', { prevSubject: true }, (subject, testId: string) => {
  return cy.wrap(subject).find(`[data-testid="${testId}"]`);
});

// File Upload Commands
Cypress.Commands.add('uploadFile', (selector: string, fileName: string, fileType: string = 'image/jpeg') => {
  cy.get(selector).selectFile({
    contents: Cypress.Buffer.from('file contents'),
    fileName: fileName,
    mimeType: fileType
  });
});

// API Commands
Cypress.Commands.add('apiLogin', (email: string, password: string) => {
  return cy.request({
    method: 'POST',
    url: '/api/auth/login',
    body: { email, password }
  }).then(response => {
    window.localStorage.setItem('authToken', response.body.data.accessToken);
    return response.body.data.accessToken;
  });
});

Cypress.Commands.add('apiCreateCourse', (courseData: any, authToken: string) => {
  return cy.request({
    method: 'POST',
    url: '/api/courses',
    headers: {
      Authorization: `Bearer ${authToken}`
    },
    body: courseData
  });
});

// Mock Commands
Cypress.Commands.add('mockAPI', (method: string, url: string, response: any, statusCode: number = 200) => {
  cy.intercept(method, url, {
    statusCode,
    body: response
  }).as('mockedAPI');
});

// Performance Commands
Cypress.Commands.add('measurePerformance', (callback: () => void) => {
  const start = performance.now();
  callback();
  const end = performance.now();
  
  const duration = end - start;
  cy.log(`Performance measurement: ${duration.toFixed(2)}ms`);
  
  // Assert reasonable performance (under 5 seconds)
  expect(duration).to.be.lessThan(5000);
});

// Accessibility Commands
Cypress.Commands.add('checkA11y', () => {
  cy.injectAxe();
  cy.checkA11y();
});

// Responsive Testing Commands
Cypress.Commands.add('testResponsive', (callback: () => void) => {
  const viewports = [
    { width: 1280, height: 720 }, // Desktop
    { width: 768, height: 1024 }, // Tablet
    { width: 375, height: 667 }   // Mobile
  ];
  
  viewports.forEach(viewport => {
    cy.viewport(viewport.width, viewport.height);
    callback();
  });
});

// Add TypeScript support for custom commands
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
