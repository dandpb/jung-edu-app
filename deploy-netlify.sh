#!/bin/bash

# Deploy to Netlify

echo "Building the application..."
npm run build

echo "Deploying to Netlify..."
# Deploy without prompting using netlify-cli
netlify deploy --dir=build --message="Deployment from local environment"

echo "To deploy to production, run:"
echo "netlify deploy --prod --dir=build"