# 🧪 jung-edu-app Testing Guide

This guide provides a comprehensive overview of the testing strategies, tools, and processes used in the jung-edu-app project.

## 🧪 Testing Strategy

The project employs a multi-layered testing strategy to ensure code quality, prevent regressions, and enable rapid development.

- **Unit Tests**: Focused tests for individual components, hooks, and utility functions.
- **Integration Tests**: Tests for services and user flows, ensuring different parts of the application work together correctly.
- **End-to-End (E2E) Tests**: Automated browser tests that simulate real user scenarios from start to finish.

## 🛠️ Tools

- **Jest**: A delightful JavaScript Testing Framework with a focus on simplicity.
- **React Testing Library**: A lightweight solution for testing React components.
- **Playwright**: A framework for end-to-end testing of modern web apps.
- **MSW (Mock Service Worker)**: For mocking API requests in tests.

## Running Tests

### Unit and Integration Tests (Jest)

- **Run all tests (excluding integration):**
  ```bash
  npm test
  ```

- **Run tests with coverage report:**
  ```bash
  npm run test:coverage
  ```

- **Run integration tests:**
  ```bash
  npm run test:integration
  ```

- **Run tests in watch mode:**
  ```bash
  npm run test:watch
  ```

### End-to-End Tests (Playwright)

- **Run all E2E tests:**
  ```bash
  npm run test:e2e
  ```

- **Run E2E tests in UI mode:**
  ```bash
  npm run test:e2e:ui
  ```

- **Run E2E tests in headed mode:**
  ```bash
  npm run test:e2e:headed
  ```

- **Debug E2E tests:**
  ```bash
  npm run test:e2e:debug
  ```

## 📁 File Structure

- **Unit/Integration Tests**: Located in `__tests__` directories alongside the code they are testing (e.g., `src/components/__tests__/MyComponent.test.tsx`).
- **E2E Tests**: Located in the `tests/e2e` directory.

## 📈 Test Coverage

The project aims for a minimum of **70%** test coverage for branches, functions, lines, and statements. To check the current coverage, run:

```bash
npm run test:coverage
```

The coverage report will be generated in the `coverage/` directory.

## ✍️ Writing Tests

### Unit Tests

When writing unit tests for components, use `React Testing Library` to query the DOM and interact with components as a user would. Mock dependencies and services to isolate the component under test.

### Integration Tests

Integration tests should cover the interaction between different services and components. Use MSW to mock API responses and test the full flow of data through the application.

### End-to-End Tests

E2E tests should cover critical user paths, such as user authentication, module completion, and quiz submission. Use Playwright's code generation tool to help write tests faster.
