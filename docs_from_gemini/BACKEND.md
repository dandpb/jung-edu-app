# Backend

This document describes the backend architecture of the Jung Edu App, which is a Node.js application written in TypeScript.

## Technologies

*   **Runtime:** [Node.js](https://nodejs.org/)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Real-time Communication:** [Socket.io](https://socket.io/)
*   **Machine Learning:** Integration with [OpenAI](https://openai.com/) (inferred from dependencies)

## Directory Structure (`backend`)

The `backend` directory contains the source code for the server-side application. It is organized as follows:

*   `api/`: This directory likely contains the API endpoints that the frontend consumes. It may be organized by resource (e.g., `users`, `quizzes`).

*   `ml/`: This directory holds the machine learning components of the application. This could include modules for interacting with the OpenAI API, processing results, or managing prompts.

*   `src/`: This directory may contain the core business logic, services, and other modules that are not directly part of the API or ML components.

*   `integration/`: This could contain code for integrating with third-party services.

*   `monitoring/`: Modules related to application monitoring, logging, and health checks.

*   `recovery/` and `self-healing/`: These directories suggest a sophisticated system for error recovery and maintaining application stability.

*   `WorkflowService.ts`: A key file that likely orchestrates the application's workflows, which are central to the user's educational journey.

## Key Services

### WorkflowService

The `WorkflowService.ts` appears to be a central piece of the backend architecture. It is likely responsible for:

*   Managing the state of educational workflows for each user.
*   Controlling the sequence of activities (e.g., lessons, quizzes, videos).
*   Interacting with other services (e.g., ML service for generating content) to advance the workflow.

## API

The backend provides an API for the frontend. While the exact structure is not detailed here, it is expected to be a RESTful or similar API that allows the frontend to:

*   Authenticate users.
*   Fetch and submit educational content.
*   Manage user progress.
*   Interact with the workflow system.

## Machine Learning

The application leverages machine learning to provide advanced features. The `ml/` directory and the `openai` dependency suggest that the application may:

*   Generate quizzes or other educational content automatically.
*   Personalize the learning experience based on user performance.
*   Provide feedback or assistance to users.
