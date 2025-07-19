#!/bin/bash

# jaqEdu Deployment Script
# This script automates the deployment process

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_ENV=${1:-production}
BUILD_DIR="build"
DEPLOY_BRANCH="deploy-$DEPLOY_ENV"

echo -e "${GREEN}🚀 jaqEdu Deployment Script${NC}"
echo -e "${YELLOW}Environment: $DEPLOY_ENV${NC}"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Pre-deployment checks
echo -e "${YELLOW}Running pre-deployment checks...${NC}"

# Check Node.js
if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

# Check npm
if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm $(npm -v)${NC}"

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo -e "${RED}❌ You have uncommitted changes. Please commit or stash them.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Git working directory clean${NC}"

# Load environment variables
if [ -f ".env.$DEPLOY_ENV" ]; then
    echo -e "${GREEN}✓ Loading .env.$DEPLOY_ENV${NC}"
    export $(cat .env.$DEPLOY_ENV | grep -v '^#' | xargs)
elif [ -f ".env" ]; then
    echo -e "${YELLOW}⚠ .env.$DEPLOY_ENV not found, using .env${NC}"
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${RED}❌ No environment file found${NC}"
    exit 1
fi

# Verify required environment variables
echo -e "${YELLOW}Verifying environment variables...${NC}"
if [ -z "$REACT_APP_OPENAI_API_KEY" ]; then
    echo -e "${RED}❌ REACT_APP_OPENAI_API_KEY is not set${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Environment variables configured${NC}"

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm ci --production=false

# Run tests
echo -e "${YELLOW}Running tests...${NC}"
npm run test:all || {
    echo -e "${RED}❌ Tests failed. Deployment aborted.${NC}"
    exit 1
}
echo -e "${GREEN}✓ All tests passed${NC}"

# Build the project
echo -e "${YELLOW}Building project...${NC}"
NODE_ENV=production npm run build || {
    echo -e "${RED}❌ Build failed. Deployment aborted.${NC}"
    exit 1
}
echo -e "${GREEN}✓ Build completed successfully${NC}"

# Check build size
BUILD_SIZE=$(du -sh $BUILD_DIR | cut -f1)
echo -e "${GREEN}✓ Build size: $BUILD_SIZE${NC}"

# Deployment based on target
case "$DEPLOY_ENV" in
    "netlify")
        echo -e "${YELLOW}Deploying to Netlify...${NC}"
        if command_exists netlify; then
            netlify deploy --prod --dir=$BUILD_DIR
        else
            echo -e "${RED}❌ Netlify CLI not installed. Run: npm install -g netlify-cli${NC}"
            exit 1
        fi
        ;;
    
    "vercel")
        echo -e "${YELLOW}Deploying to Vercel...${NC}"
        if command_exists vercel; then
            vercel --prod
        else
            echo -e "${RED}❌ Vercel CLI not installed. Run: npm install -g vercel${NC}"
            exit 1
        fi
        ;;
    
    "github-pages")
        echo -e "${YELLOW}Deploying to GitHub Pages...${NC}"
        if command_exists gh-pages; then
            gh-pages -d $BUILD_DIR
        else
            echo -e "${RED}❌ gh-pages not installed. Run: npm install -g gh-pages${NC}"
            exit 1
        fi
        ;;
    
    "production")
        echo -e "${YELLOW}Preparing for production deployment...${NC}"
        # Create deployment package
        DEPLOY_PACKAGE="jung-edu-app-$(date +%Y%m%d-%H%M%S).tar.gz"
        tar -czf $DEPLOY_PACKAGE $BUILD_DIR
        echo -e "${GREEN}✓ Deployment package created: $DEPLOY_PACKAGE${NC}"
        echo -e "${YELLOW}Upload this package to your production server${NC}"
        ;;
    
    *)
        echo -e "${YELLOW}Build complete. Ready for manual deployment.${NC}"
        echo -e "Build directory: ${GREEN}$BUILD_DIR${NC}"
        ;;
esac

# Post-deployment tasks
echo -e "${YELLOW}Running post-deployment tasks...${NC}"

# Create deployment record
DEPLOY_RECORD="deployments/deploy-$DEPLOY_ENV-$(date +%Y%m%d-%H%M%S).log"
mkdir -p deployments
cat > $DEPLOY_RECORD << EOF
Deployment Summary
==================
Date: $(date)
Environment: $DEPLOY_ENV
Git Commit: $(git rev-parse HEAD)
Git Branch: $(git branch --show-current)
Build Size: $BUILD_SIZE
Node Version: $(node -v)
npm Version: $(npm -v)
EOF

echo -e "${GREEN}✓ Deployment record saved: $DEPLOY_RECORD${NC}"

# Success message
echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${GREEN}Environment: $DEPLOY_ENV${NC}"
echo -e "${GREEN}Time: $(date)${NC}"