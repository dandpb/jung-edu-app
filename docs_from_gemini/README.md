# Jung Edu App

## Overview

This project is a web-based educational application, "Jung Edu App". It appears to be a platform for creating and delivering educational content, potentially with a focus on interactive learning, quizzes, and personalized workflows. The application features a modern frontend built with React and a backend that includes machine learning capabilities.

## Key Features

*   **Educational Content Delivery:** The app is designed to present educational materials to users.
*   **Interactive Learning:** Features like quizzes, mind maps (inferred from `reactflow`), and video integration suggest an interactive learning experience.
*   **AI-Powered Features:** The presence of an `ml` directory, `openai` dependency, and numerous "AI" related test files suggest the use of Artificial Intelligence for features like quiz generation, content creation, or personalized learning paths.
*   **User Authentication:** The application includes user authentication, likely managed through Supabase.
*   **Workflow Management:** The `WorkflowService.ts` and related files point to a system for managing educational or content-related workflows.

## Technologies Used

*   **Frontend:**
    *   React
    *   TypeScript
    *   React Router for navigation
    *   TanStack React Query for data fetching and state management
    *   Tailwind CSS for styling
    *   D3.js and Recharts for data visualization
    *   Reactflow for node-based UI's
    *   i18next for internationalization
*   **Backend:**
    *   Node.js with TypeScript (inferred)
    *   Express.js (likely, a common choice with Node.js)
    *   Socket.io for real-time communication
*   **Database:**
    *   Supabase (PostgreSQL)
*   **Testing:**
    *   Jest for unit and integration tests
    *   React Testing Library for component testing
    *   Playwright for end-to-end testing
    *   MSW (Mock Service Worker) for API mocking

## Directory Structure Overview

*   `src/`: Contains the React frontend application code.
*   `backend/`: Contains the backend application code, including API, machine learning, and other services.
*   `database/`: Holds database schema definitions and migration scripts.
*   `docs/`: Contains existing project documentation.
*   `scripts/`: A variety of scripts for testing, deployment, and other tasks.
*   `tests/`: Contains end-to-end and integration tests.

## Documentation

*   [Getting Started](./GETTING_STARTED.md)
*   [Architecture](./ARCHITECTURE.md)
*   [Frontend](./FRONTEND.md)
*   [Backend](./BACKEND.md)
*   [Database](./DATABASE.md)
*   [API Reference](./API_REFERENCE.md)
*   [Testing](./TESTING.md)
