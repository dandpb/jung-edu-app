# API Reference

This document is a placeholder for the API reference for the Jung Edu App. A complete and detailed API documentation is essential for frontend development and for any third-party integrations.

## Location of API Code

The backend API code is located in the `backend/api/` directory. The API endpoints are likely defined in this directory, organized by resource.

## Generating API Documentation

It is highly recommended to use a tool to automatically generate and maintain the API documentation. Some popular options are:

*   [Swagger (OpenAPI)](https://swagger.io/)
*   [Postman](https://www.postman.com/)
*   [ApiDoc](https://apidocjs.com/)

These tools can often generate interactive documentation from comments in the source code.

## Example API Endpoint

Below is an example of how an API endpoint could be documented.

### GET /api/v1/workflows/{workflowId}

Retrieves the details of a specific workflow.

*   **URL Params:**
    *   `workflowId` (string, required): The ID of the workflow to retrieve.

*   **Authentication:**
    *   Requires a valid user session (JWT in the `Authorization` header).

*   **Success Response (200 OK):**

    ```json
    {
      "id": "wf_123",
      "name": "Introduction to Algebra",
      "description": "A beginner-friendly workflow for learning algebra.",
      "steps": [
        {
          "id": "step_1",
          "type": "video",
          "title": "What is a variable?",
          "videoId": "xyz"
        },
        {
          "id": "step_2",
          "type": "quiz",
          "title": "Basic Equations Quiz",
          "quizId": "q_456"
        }
      ]
    }
    ```

*   **Error Response (404 Not Found):**

    ```json
    {
      "error": "Workflow not found"
    }
    ```
