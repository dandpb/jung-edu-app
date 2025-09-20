# Architecture

This document provides a high-level overview of the Jung Edu App's architecture. The application is structured as a modern web application with a distinct frontend and backend.

## System Diagram (Textual Representation)

```
+-----------------+      +-----------------+      +-----------------+
|                 |      |                 |      |                 |
|     Frontend    |----->|     Backend     |----->|    Database     |
| (React, TS)     |      |  (Node.js, TS)  |      |  (Supabase/PG)  |
|                 |      |                 |      |                 |
+-----------------+      +-----------------+      +-----------------+
       |                                                ^
       |                                                |
       +------------------------------------------------+
              (User Interaction)
```

## Components

### 1. Frontend

The frontend is a single-page application (SPA) built with **React** and **TypeScript**. It is responsible for the user interface and all client-side logic.

*   **UI Components:** A rich set of UI components is located in `src/components`, likely styled with **Tailwind CSS**.
*   **State Management:** **TanStack React Query** is used for managing server state, caching data from the backend, and handling asynchronous operations.
*   **Routing:** **React Router** manages navigation within the application.
*   **Visualizations:** **D3.js** and **Recharts** are used for creating charts and graphs, and **Reactflow** is used for displaying node-based diagrams (e.g., mind maps).

### 2. Backend

The backend is a **Node.js** application written in **TypeScript**. It provides the API for the frontend and contains the core business logic.

*   **API:** The `backend/api` directory suggests a RESTful or GraphQL API that the frontend consumes.
*   **Services:** The application is structured around services, such as the `WorkflowService.ts`, which encapsulates specific business logic.
*   **Machine Learning:** The `backend/ml` directory indicates the presence of machine learning models or integrations (e.g., with the **OpenAI API**) to provide AI-powered features.
*   **Real-time Communication:** **Socket.io** is used for real-time communication between the frontend and backend, which can be used for notifications or collaborative features.

### 3. Database

The application uses **Supabase**, which provides a **PostgreSQL** database, authentication, and other backend-as-a-service features.

*   **Schema:** The database schema is defined in SQL files located in the `database/` directory.
*   **Data Access:** The backend services interact with the database, and the frontend may also interact directly with Supabase for authentication and real-time data.

## Communication

*   **Frontend to Backend:** The frontend communicates with the backend primarily through API calls (e.g., REST). TanStack React Query is used to manage these communications.
*   **Real-time:** Socket.io is used for features that require real-time updates.

## Workflow System

A key architectural feature is the workflow system, represented by `WorkflowService.ts`. This system likely manages sequences of educational activities, user progress, and content delivery, forming the core of the personalized learning experience.
