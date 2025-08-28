# Multi-stage Docker build for jaqEdu workflow services
FROM node:18-alpine AS base

# Set working directory
WORKDIR /usr/src/app

# Install system dependencies
RUN apk add --no-cache \
    git \
    python3 \
    make \
    g++ \
    curl \
    && rm -rf /var/cache/apk/*

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
FROM base AS dependencies
RUN npm ci --only=production --no-audit --no-fund
RUN cp -R node_modules /prod_node_modules
RUN npm ci --no-audit --no-fund

# Build stage
FROM dependencies AS build
COPY src ./src
COPY public ./public
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

WORKDIR /usr/src/app

# Copy production dependencies
COPY --from=dependencies /prod_node_modules ./node_modules

# Copy built application
COPY --from=build --chown=nextjs:nodejs /usr/src/app/dist ./dist
COPY --from=build --chown=nextjs:nodejs /usr/src/app/public ./public

# Copy configuration files
COPY --chown=nextjs:nodejs package*.json ./
COPY --chown=nextjs:nodejs .env.example ./.env.example

# Install health check utility
RUN apk add --no-cache curl

# Create logs directory
RUN mkdir -p /usr/src/app/logs && chown nextjs:nodejs /usr/src/app/logs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:${PORT:-3000}/health || exit 1

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Start the application
CMD ["npm", "start"]

# Development stage
FROM base AS development

WORKDIR /usr/src/app

# Copy all files for development
COPY . .

# Install all dependencies (including dev)
RUN npm ci --no-audit --no-fund

# Expose port and start in development mode
EXPOSE 3000 9229
CMD ["npm", "run", "dev"]