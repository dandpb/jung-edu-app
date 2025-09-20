# Getting Started

This guide provides instructions on how to set up and run the Jung Edu App project on your local machine for development and testing purposes.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

*   [Node.js](https://nodejs.org/) (which includes npm)
*   [Git](https://git-scm.com/)

## Installation

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd jung-edu-app
    ```

2.  **Install dependencies:**

    Use npm to install the project dependencies as defined in `package.json`.

    ```bash
    npm install
    ```

## Environment Variables

The project uses environment variables for configuration. You will need to create `.env` files based on the provided examples:

*   `.env.example`
*   `.env.production.example`
*   `.env.test`

Create a copy of `.env.example` and name it `.env`. Populate it with the necessary values, such as Supabase credentials and API keys.

```bash
cp .env.example .env
```

## Running the Application

To start the frontend development server, run the following command:

```bash
npm start
```

This will start the React application in development mode. You can view it in your browser at [http://localhost:3000](http://localhost:3000).

The page will reload if you make edits, and you will see any lint errors in the console.

## Running Tests

The project has a comprehensive test suite. You can run the tests using the following commands:

*   **Run all tests (excluding integration tests):**

    ```bash
    npm test
    ```

*   **Run all tests (including integration tests):**

    ```bash
    npm run test:all:with-integration
    ```

*   **Run end-to-end tests:**

    ```bash
    npx playwright test
    ```

*   **Run tests with coverage:**

    ```bash
    npm run test:coverage
    ```

## Building the Application

To create a production-ready build of the frontend application, run:

```bash
npm run build
```

This will create a `build` directory with the optimized and minified application files.
