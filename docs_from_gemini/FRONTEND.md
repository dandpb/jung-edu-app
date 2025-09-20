# Frontend

This document describes the frontend architecture of the Jung Edu App, which is a single-page application (SPA) built with React and TypeScript.

## Technologies

*   **Framework:** [React](https://reactjs.org/)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Routing:** [React Router](https://reactrouter.com/)
*   **State Management:** [TanStack React Query](https://tanstack.com/query/latest)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Data Visualization:** [D3.js](https://d3js.org/), [Recharts](https://recharts.org/)
*   **Diagrams:** [Reactflow](https://reactflow.dev/)

## Directory Structure (`src`)

The `src` directory contains the entire source code for the frontend application. It is organized as follows:

*   `components/`: This directory contains reusable UI components that are used across the application. Examples include buttons, modals, and layout components.

*   `pages/`: Each file in this directory typically corresponds to a specific page or route in the application. For example, `HomePage.tsx` or `DashboardPage.tsx`.

*   `services/`: This directory contains modules responsible for communicating with the backend API and other external services. They encapsulate the logic for making API calls and handling data.

*   `hooks/`: Custom React hooks are stored here. These hooks contain reusable logic that can be shared between components, such as `useUser` or `useWorkflow`.

*   `contexts/`: This directory holds React context providers, which are used for managing global state or providing data to a component tree without having to pass props down manually.

*   `types/`: Contains TypeScript type definitions and interfaces that are used throughout the application. This helps to ensure type safety and consistency.

*   `utils/`: A collection of utility functions that can be used anywhere in the application. These are typically pure functions that perform a specific task.

*   `styles/`: Global styles and CSS files are located here.

*   `App.tsx`: The main application component, which sets up the routing and overall layout.

*   `index.tsx`: The entry point of the application, where the React app is mounted to the DOM.

## State Management

The primary tool for state management is **TanStack React Query**. It is used for:

*   Fetching, caching, and updating data from the backend.
*   Managing loading and error states for asynchronous operations.
*   Optimizing performance by reducing the number of API requests.

For global UI state that is not related to server data, **React Context** is used.

## Styling

**Tailwind CSS** is used for styling the application. It is a utility-first CSS framework that allows for rapid UI development by composing utility classes directly in the markup.

Global styles and customizations of Tailwind's configuration can be found in `tailwind.config.js` and the `styles/` directory.

## Routing

**React Router** is used for handling navigation within the application. Routes are defined in the `App.tsx` component or a dedicated routing module, mapping URLs to specific pages in the `pages/` directory.
