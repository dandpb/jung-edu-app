# 🚀 jung-edu-app Deployment Guide

This guide provides instructions for deploying the jung-edu-app application.

## Frontend Deployment (Netlify)

The frontend of the application is deployed to Netlify.

### Configuration

The `netlify.toml` file in the root of the project configures the deployment. It specifies the build command, the publish directory, and environment variables.

### Manual Deployment

To deploy the application to Netlify manually, you can use the Netlify CLI:

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy to production
netlify deploy --prod
```

## Backend Deployment (Docker)

The backend of the application is deployed using Docker.

### Docker Compose

The `docker-compose.workflow.yml` file defines the services for the backend, including the main application, a PostgreSQL database, Redis, and MinIO.

To run the backend stack, use:

```bash
docker-compose -f docker-compose.workflow.yml up
```

### Dockerfile

The `docker/Dockerfile.workflow` file is a multi-stage Dockerfile that builds the production-ready image for the workflow service.

## Database Deployment

The database is deployed to Supabase. The schema is managed with SQL files in the `database` directory.

To apply the schema, you can use the Supabase CLI:

```bash
# Apply schema
supabase db push database/schema.sql

# Apply RLS policies
supabase db push database/rls_policies.sql

# Apply security enhancements
supabase db push database/security_enhancements.sql
```

## Continuous Deployment (GitHub Actions)

The project uses GitHub Actions for continuous deployment. The workflow files are located in the `.github/workflows` directory.

The `deploy.yml` workflow (if it exists) will automatically deploy the application when changes are pushed to the `main` branch.
