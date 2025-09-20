# Database

This document provides an overview of the database used in the Jung Edu App.

## Technology

The application uses **Supabase**, which is a backend-as-a-service platform that provides a **PostgreSQL** database, authentication, and more.

## Schema Management

The database schema is managed through SQL files located in the `database/` directory. These files define the tables, columns, relationships, and policies.

### Key Schema Files

*   `schema.sql`: This is likely the main schema file, defining the core tables of the application, such as `users`, `courses`, `lessons`, and `quizzes`.

*   `prompt_templates_schema.sql`: This file probably defines tables for storing prompt templates, which are used to generate content with the AI/ML models.

*   `workflow_system_migration.sql`: This file contains SQL for creating or migrating the tables related to the workflow system, which manages user progress and educational paths.

*   `rls_policies.sql`: This important file defines the Row-Level Security (RLS) policies for the PostgreSQL database. RLS is a key feature of Supabase that allows for fine-grained access control, ensuring that users can only access the data they are authorized to see.

*   `default_prompts.sql`: This file likely contains `INSERT` statements to populate the prompt templates table with a set of default prompts.

*   `security_enhancements.sql`: This file may contain additional security measures, such as creating specific roles or permissions.

## Tables (Inferred)

Based on the file names and the nature of the application, the database likely contains tables such as:

*   `users`: Stores user information and authentication data.
*   `workspaces`: To group resources for different users or teams.
*   `workflows`: To define the structure of educational workflows.
*   `workflow_runs`: To track the progress of a user through a workflow.
*   `prompts`: To store templates for generating AI content.
*   `quizzes`: To store quiz questions and answers.
*   `mindmaps`: To store data for mind map visualizations.

To get the exact and complete schema, you should refer to the SQL files in the `database/` directory.
