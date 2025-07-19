#!/bin/bash

# jaqEdu Development Setup Script
# This script sets up a development environment from scratch

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===============================================${NC}"
echo -e "${BLUE}     jaqEdu Development Environment Setup${NC}"
echo -e "${BLUE}===============================================${NC}"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to prompt for input
prompt_input() {
    local prompt="$1"
    local var_name="$2"
    local is_secret="$3"
    
    if [ "$is_secret" = "true" ]; then
        read -s -p "$prompt" input
        echo ""
    else
        read -p "$prompt" input
    fi
    
    eval "$var_name='$input'"
}

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

# Check Node.js
if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js v16.18.0 or higher from https://nodejs.org/"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Node.js $NODE_VERSION${NC}"

# Check npm
if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi
NPM_VERSION=$(npm -v)
echo -e "${GREEN}✓ npm $NPM_VERSION${NC}"

# Check Git
if ! command_exists git; then
    echo -e "${RED}❌ Git is not installed${NC}"
    echo "Please install Git from https://git-scm.com/"
    exit 1
fi
GIT_VERSION=$(git --version)
echo -e "${GREEN}✓ $GIT_VERSION${NC}"

echo ""

# Install dependencies
echo -e "${YELLOW}Installing project dependencies...${NC}"
npm install || {
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    echo "Trying with legacy peer deps..."
    npm install --legacy-peer-deps
}
echo -e "${GREEN}✓ Dependencies installed${NC}"

echo ""

# Setup environment file
if [ ! -f .env ]; then
    echo -e "${YELLOW}Setting up environment configuration...${NC}"
    
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}✓ Created .env from .env.example${NC}"
    else
        echo -e "${RED}❌ .env.example not found${NC}"
        exit 1
    fi
    
    echo ""
    echo -e "${BLUE}Let's configure your environment:${NC}"
    echo ""
    
    # OpenAI API Key
    echo -e "${YELLOW}OpenAI Configuration${NC}"
    echo "Get your API key from: https://platform.openai.com/api-keys"
    prompt_input "Enter your OpenAI API key (sk-proj-...): " OPENAI_KEY true
    
    if [ ! -z "$OPENAI_KEY" ]; then
        sed -i.bak "s/your_openai_api_key_here/$OPENAI_KEY/g" .env
        sed -i.bak "s/OPENAI_API_KEY=your_openai_api_key_here/OPENAI_API_KEY=$OPENAI_KEY/g" .env
        echo -e "${GREEN}✓ OpenAI API key configured${NC}"
    else
        echo -e "${YELLOW}⚠ OpenAI API key not set - you'll need to add it manually${NC}"
    fi
    
    echo ""
    
    # Admin Configuration
    echo -e "${YELLOW}Admin Configuration${NC}"
    prompt_input "Enter admin username (default: admin): " ADMIN_USER
    ADMIN_USER=${ADMIN_USER:-admin}
    
    prompt_input "Enter admin password: " ADMIN_PASS true
    
    if [ ! -z "$ADMIN_PASS" ]; then
        # Generate salt and hash
        SALT=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
        HASH=$(node -e "const crypto = require('crypto'); console.log(crypto.pbkdf2Sync('$ADMIN_PASS', '$SALT', 100000, 64, 'sha512').toString('hex'))")
        
        sed -i.bak "s/REACT_APP_ADMIN_USERNAME=admin/REACT_APP_ADMIN_USERNAME=$ADMIN_USER/g" .env
        sed -i.bak "s/your_password_hash_here/$HASH/g" .env
        sed -i.bak "s/your_salt_here/$SALT/g" .env
        
        echo -e "${GREEN}✓ Admin credentials configured${NC}"
    else
        echo -e "${YELLOW}⚠ Admin password not set - using default (not recommended)${NC}"
    fi
    
    echo ""
    
    # YouTube API (optional)
    echo -e "${YELLOW}YouTube Integration (Optional)${NC}"
    echo "Get your API key from: https://console.developers.google.com/"
    prompt_input "Enter YouTube API key (press Enter to skip): " YOUTUBE_KEY
    
    if [ ! -z "$YOUTUBE_KEY" ]; then
        sed -i.bak "s/your_youtube_api_key_here/$YOUTUBE_KEY/g" .env
        echo -e "${GREEN}✓ YouTube API key configured${NC}"
    else
        echo -e "${YELLOW}⚠ YouTube integration skipped${NC}"
    fi
    
    # Clean up backup files
    rm -f .env.bak
    
    echo ""
    echo -e "${GREEN}✓ Environment configuration complete${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

echo ""

# Create necessary directories
echo -e "${YELLOW}Setting up project directories...${NC}"
mkdir -p deployments
mkdir -p logs
mkdir -p .swarm
echo -e "${GREEN}✓ Project directories created${NC}"

echo ""

# Initialize Git hooks
if [ -d .git ]; then
    echo -e "${YELLOW}Setting up Git hooks...${NC}"
    
    # Pre-commit hook
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Run tests before commit
echo "Running tests..."
npm run test:all || {
    echo "Tests failed. Commit aborted."
    exit 1
}

# Check for TypeScript errors
echo "Checking TypeScript..."
npx tsc --noEmit || {
    echo "TypeScript errors found. Commit aborted."
    exit 1
}
EOF
    
    chmod +x .git/hooks/pre-commit
    echo -e "${GREEN}✓ Git hooks configured${NC}"
fi

echo ""

# Run initial tests
echo -e "${YELLOW}Running initial tests...${NC}"
npm run test:all || {
    echo -e "${YELLOW}⚠ Some tests failed - this is normal for initial setup${NC}"
}

echo ""

# VS Code settings
if command_exists code; then
    echo -e "${YELLOW}Detected VS Code. Would you like to install recommended extensions?${NC}"
    prompt_input "Install VS Code extensions? (y/n): " INSTALL_EXT
    
    if [ "$INSTALL_EXT" = "y" ] || [ "$INSTALL_EXT" = "Y" ]; then
        echo -e "${YELLOW}Installing VS Code extensions...${NC}"
        code --install-extension dbaeumer.vscode-eslint
        code --install-extension esbenp.prettier-vscode
        code --install-extension ms-vscode.vscode-typescript-tslint-plugin
        code --install-extension bradlc.vscode-tailwindcss
        code --install-extension dsznajder.es7-react-js-snippets
        echo -e "${GREEN}✓ VS Code extensions installed${NC}"
    fi
fi

echo ""

# Success message
echo -e "${GREEN}===============================================${NC}"
echo -e "${GREEN}     🎉 Development setup complete! 🎉${NC}"
echo -e "${GREEN}===============================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Review and update your .env file if needed"
echo -e "2. Start the development server: ${GREEN}npm start${NC}"
echo -e "3. Open your browser to: ${GREEN}http://localhost:3000${NC}"
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo -e "  ${GREEN}npm start${NC}         - Start development server"
echo -e "  ${GREEN}npm test${NC}          - Run tests in watch mode"
echo -e "  ${GREEN}npm run build${NC}     - Create production build"
echo -e "  ${GREEN}npm run test:all${NC}  - Run all tests once"
echo ""
echo -e "${BLUE}Happy coding! 🚀${NC}"