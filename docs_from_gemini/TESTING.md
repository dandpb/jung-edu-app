# Testing

This document outlines the testing strategy for the Jung Edu App, covering the different types of tests and how to run them.

## Testing Philosophy

The project aims for a high level of test coverage to ensure code quality, prevent regressions, and enable confident refactoring. The testing strategy includes unit, integration, component, and end-to-end (E2E) tests.

## Types of Tests

### 1. Unit Tests

*   **Purpose:** To test individual functions, modules, or services in isolation.
*   **Location:** Typically found in `__tests__` subdirectories next to the files they test (e.g., `src/services/__tests__/`).
*   **Command:**

    ```bash
    npm run test:unit
    ```

### 2. Component Tests

*   **Purpose:** To test React components in isolation from the rest of the application. This is done using **React Testing Library**.
*   **Location:** `src/components/__tests__/`
*   **Command:**

    ```bash
    npm run test:components
    ```

### 3. Integration Tests

*   **Purpose:** To test the interaction between different parts of the application, such as a component and a service, or a service and the database.
*   **Location:** `tests/integration/`
*   **Command:**

    ```bash
    npm run test:integration
    ```

### 4. End-to-End (E2E) Tests

*   **Purpose:** To test the entire application from the user's perspective. These tests simulate user behavior in a real browser.
*   **Framework:** **Playwright**
*   **Location:** `tests/`
*   **Commands:**

    *   **Run all E2E tests:**

        ```bash
        npm run test:e2e
        ```

    *   **Run E2E tests with UI:**

        ```bash
        npm run test:e2e:ui
        ```

## Running All Tests

You can run all tests (excluding E2E) with the following command:

```bash
npm test
```

To run all tests including integration tests, use:

```bash
npm run test:all:with-integration
```

## Code Coverage

The project is set up to measure test coverage. To generate a coverage report, run:

```bash
npm run test:coverage
```

This will create a `coverage/` directory with a detailed report that you can view in your browser.
