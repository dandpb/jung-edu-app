#!/bin/bash

# Netlify Deployment Script
# This script handles local deployment to Netlify

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Check if Netlify CLI is installed
check_netlify_cli() {
    if ! command -v netlify &> /dev/null; then
        print_message "$YELLOW" "Netlify CLI not found. Installing..."
        npm install -g netlify-cli
    else
        print_message "$GREEN" "✓ Netlify CLI is installed"
    fi
}

# Load environment variables
load_env() {
    if [ -f .env ]; then
        export $(cat .env | grep -v '^#' | xargs)
        print_message "$GREEN" "✓ Environment variables loaded"
    else
        print_message "$YELLOW" "No .env file found"
    fi
}

# Run tests
run_tests() {
    print_message "$YELLOW" "Running tests..."
    npm test -- --watchAll=false --passWithNoTests
    print_message "$GREEN" "✓ Tests passed"
}

# Build the application
build_app() {
    print_message "$YELLOW" "Building application..."
    npm run build
    print_message "$GREEN" "✓ Build completed"
}

# Deploy to Netlify
deploy_to_netlify() {
    local environment=$1
    local message=$2
    
    print_message "$YELLOW" "Deploying to Netlify ($environment)..."
    
    if [ "$environment" == "production" ]; then
        netlify deploy --prod --dir=dist --message="$message"
    else
        netlify deploy --dir=dist --message="$message"
    fi
    
    print_message "$GREEN" "✓ Deployment completed!"
}

# Main execution
main() {
    print_message "$GREEN" "🚀 Starting Netlify Deployment Process"
    
    # Parse arguments
    ENVIRONMENT=${1:-"preview"}
    MESSAGE=${2:-"Manual deployment from local"}
    
    # Execute steps
    check_netlify_cli
    load_env
    
    # Ask for confirmation
    print_message "$YELLOW" "Deploying to: $ENVIRONMENT"
    print_message "$YELLOW" "Message: $MESSAGE"
    read -p "Continue? (y/n) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        run_tests
        build_app
        deploy_to_netlify "$ENVIRONMENT" "$MESSAGE"
        
        print_message "$GREEN" "🎉 Deployment successful!"
        print_message "$GREEN" "View your site: netlify open:site"
    else
        print_message "$RED" "Deployment cancelled"
        exit 1
    fi
}

# Run main function
main "$@"