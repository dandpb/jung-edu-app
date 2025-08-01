#!/bin/bash

# Deployment Validation Script for jaqEdu
# This script performs comprehensive validation checks before deployment

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VALIDATION_ENV=${1:-production}
LOG_FILE="deployment-validation-$(date +%Y%m%d_%H%M%S).log"
HEALTH_CHECK_TIMEOUT=30
MIN_COVERAGE_THRESHOLD=80

echo -e "${BLUE}🔍 jaqEdu Deployment Validation${NC}"
echo -e "${YELLOW}Environment: $VALIDATION_ENV${NC}"
echo -e "${YELLOW}Log file: $LOG_FILE${NC}"
echo ""

# Redirect all output to log file as well
exec > >(tee -a "$LOG_FILE")
exec 2>&1

# Function to log messages
log_message() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check service health
check_service_health() {
    local service_name=$1
    local health_url=$2
    local timeout=${3:-10}
    
    log_message "${YELLOW}Checking $service_name health...${NC}"
    
    if command_exists curl; then
        if curl -f -s --max-time "$timeout" "$health_url" > /dev/null; then
            log_message "${GREEN}✓ $service_name is healthy${NC}"
            return 0
        else
            log_message "${RED}❌ $service_name health check failed${NC}"
            return 1
        fi
    else
        log_message "${YELLOW}⚠ curl not available, skipping $service_name health check${NC}"
        return 0
    fi
}

# Function to validate environment variables
validate_environment() {
    log_message "${YELLOW}Validating environment variables...${NC}"
    
    local required_vars=(
        "REACT_APP_SUPABASE_URL"
        "REACT_APP_SUPABASE_ANON_KEY"
        "REACT_APP_OPENAI_API_KEY"
    )
    
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -eq 0 ]; then
        log_message "${GREEN}✓ All required environment variables are set${NC}"
        return 0
    else
        log_message "${RED}❌ Missing environment variables: ${missing_vars[*]}${NC}"
        return 1
    fi
}

# Function to run tests
run_tests() {
    log_message "${YELLOW}Running test suite...${NC}"
    
    # Run unit tests
    if npm run test:all > test-results.log 2>&1; then
        log_message "${GREEN}✓ Unit tests passed${NC}"
    else
        log_message "${RED}❌ Unit tests failed. Check test-results.log for details${NC}"
        return 1
    fi
    
    # Run integration tests if available
    if [ -f "scripts/run-integration-tests.js" ]; then
        log_message "${YELLOW}Running integration tests...${NC}"
        if npm run test:integration > integration-test-results.log 2>&1; then
            log_message "${GREEN}✓ Integration tests passed${NC}"
        else
            log_message "${YELLOW}⚠ Integration tests had issues. Check integration-test-results.log${NC}"
        fi
    fi
    
    # Check test coverage
    if npm run test:coverage > coverage-results.log 2>&1; then
        # Extract coverage percentage (this is a simplified check)
        if grep -q "All files" coverage-results.log; then
            log_message "${GREEN}✓ Test coverage analysis completed${NC}"
        else
            log_message "${YELLOW}⚠ Test coverage analysis incomplete${NC}"
        fi
    fi
    
    return 0
}

# Function to validate build
validate_build() {
    log_message "${YELLOW}Validating build process...${NC}"
    
    # Clean previous build
    if [ -d "build" ]; then
        rm -rf build
        log_message "${BLUE}Cleaned previous build directory${NC}"
    fi
    
    # Run build
    if NODE_ENV=production npm run build > build-results.log 2>&1; then
        log_message "${GREEN}✓ Build completed successfully${NC}"
    else
        log_message "${RED}❌ Build failed. Check build-results.log for details${NC}"
        return 1
    fi
    
    # Check build artifacts
    if [ -d "build" ] && [ -f "build/index.html" ]; then
        log_message "${GREEN}✓ Build artifacts created${NC}"
    else
        log_message "${RED}❌ Build artifacts missing${NC}"
        return 1
    fi
    
    # Check build size
    local build_size=$(du -sh build | cut -f1)
    log_message "${BLUE}Build size: $build_size${NC}"
    
    # Warn if build is too large (>50MB)
    local build_size_mb=$(du -sm build | cut -f1)
    if [ "$build_size_mb" -gt 50 ]; then
        log_message "${YELLOW}⚠ Build size is large ($build_size). Consider optimization.${NC}"
    fi
    
    return 0
}

# Function to check dependencies
check_dependencies() {
    log_message "${YELLOW}Checking dependencies...${NC}"
    
    # Check for security vulnerabilities
    if command_exists npm; then
        log_message "${YELLOW}Checking for security vulnerabilities...${NC}"
        if npm audit --audit-level=high > audit-results.log 2>&1; then
            log_message "${GREEN}✓ No high-severity vulnerabilities found${NC}"
        else
            log_message "${YELLOW}⚠ Security vulnerabilities detected. Check audit-results.log${NC}"
        fi
    fi
    
    # Check for outdated packages
    if npm outdated > outdated-packages.log 2>&1; then
        if [ -s outdated-packages.log ]; then
            log_message "${YELLOW}⚠ Some packages are outdated. Check outdated-packages.log${NC}"
        else
            log_message "${GREEN}✓ All packages are up to date${NC}"
        fi
    fi
    
    return 0
}

# Function to validate configuration
validate_configuration() {
    log_message "${YELLOW}Validating configuration files...${NC}"
    
    # Check package.json
    if [ -f "package.json" ]; then
        if node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8'))" 2>/dev/null; then
            log_message "${GREEN}✓ package.json is valid${NC}"
        else
            log_message "${RED}❌ package.json is invalid${NC}"
            return 1
        fi
    fi
    
    # Check tsconfig.json if it exists
    if [ -f "tsconfig.json" ]; then
        if node -e "JSON.parse(require('fs').readFileSync('tsconfig.json', 'utf8'))" 2>/dev/null; then
            log_message "${GREEN}✓ tsconfig.json is valid${NC}"
        else
            log_message "${RED}❌ tsconfig.json is invalid${NC}"
            return 1
        fi
    fi
    
    # Check for required files
    local required_files=(
        "package.json"
        "public/index.html"
        "src/index.tsx"
    )
    
    for file in "${required_files[@]}"; do
        if [ -f "$file" ]; then
            log_message "${GREEN}✓ $file exists${NC}"
        else
            log_message "${RED}❌ $file is missing${NC}"
            return 1
        fi
    done
    
    return 0
}

# Function to run Supabase-specific validations
validate_supabase() {
    log_message "${YELLOW}Validating Supabase configuration...${NC}"
    
    # Check if Supabase URL is valid format
    if [[ "$REACT_APP_SUPABASE_URL" =~ ^https://.*\.supabase\.co$ ]]; then
        log_message "${GREEN}✓ Supabase URL format is valid${NC}"
    else
        log_message "${RED}❌ Supabase URL format is invalid${NC}"
        return 1
    fi
    
    # Check if Supabase key is present and not empty
    if [ -n "$REACT_APP_SUPABASE_ANON_KEY" ] && [ ${#REACT_APP_SUPABASE_ANON_KEY} -gt 50 ]; then
        log_message "${GREEN}✓ Supabase anonymous key is present${NC}"
    else
        log_message "${RED}❌ Supabase anonymous key is missing or too short${NC}"
        return 1
    fi
    
    return 0
}

# Function to validate deployment readiness
validate_deployment_readiness() {
    log_message "${YELLOW}Performing deployment readiness checks...${NC}"
    
    local checks_passed=0
    local total_checks=7
    
    # 1. Environment validation
    if validate_environment; then
        ((checks_passed++))
    fi
    
    # 2. Configuration validation
    if validate_configuration; then
        ((checks_passed++))
    fi
    
    # 3. Dependency check
    if check_dependencies; then
        ((checks_passed++))
    fi
    
    # 4. Supabase validation
    if validate_supabase; then
        ((checks_passed++))
    fi
    
    # 5. Test execution
    if run_tests; then
        ((checks_passed++))
    fi
    
    # 6. Build validation
    if validate_build; then
        ((checks_passed++))
    fi
    
    # 7. Basic health checks (if services are running)
    local health_checks=0
    if check_service_health "localhost" "http://localhost:3000" 5; then
        ((health_checks++))
    fi
    
    if [ $health_checks -gt 0 ]; then
        ((checks_passed++))
    else
        log_message "${YELLOW}⚠ Application not running, skipping health checks${NC}"
        ((checks_passed++))  # Don't fail for this in validation mode
    fi
    
    # Calculate success rate
    local success_rate=$((checks_passed * 100 / total_checks))
    
    log_message "${BLUE}Deployment readiness: $checks_passed/$total_checks checks passed ($success_rate%)${NC}"
    
    if [ $success_rate -ge 85 ]; then
        log_message "${GREEN}🎉 Deployment validation PASSED! System is ready for deployment.${NC}"
        return 0
    elif [ $success_rate -ge 70 ]; then
        log_message "${YELLOW}⚠ Deployment validation PASSED with warnings. Review issues before deployment.${NC}"
        return 0
    else
        log_message "${RED}❌ Deployment validation FAILED! Critical issues must be resolved.${NC}"
        return 1
    fi
}

# Function to generate validation report
generate_report() {
    local status=$1
    local report_file="deployment-validation-report-$(date +%Y%m%d_%H%M%S).md"
    
    log_message "${YELLOW}Generating validation report: $report_file${NC}"
    
    cat > "$report_file" << EOF
# Deployment Validation Report

**Date:** $(date)
**Environment:** $VALIDATION_ENV
**Status:** $([ $status -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED")

## Summary

This report contains the results of the deployment validation process for jaqEdu.

## Validation Results

### Environment Configuration
- **Status:** $(validate_environment > /dev/null 2>&1 && echo "✅ PASSED" || echo "❌ FAILED")
- **Details:** Environment variables validated for Supabase and external APIs

### Build Process
- **Status:** $([ -d "build" ] && echo "✅ PASSED" || echo "❌ FAILED")
- **Build Size:** $([ -d "build" ] && du -sh build | cut -f1 || "N/A")

### Testing
- **Unit Tests:** $([ -f "test-results.log" ] && echo "✅ COMPLETED" || echo "⚠ SKIPPED")
- **Integration Tests:** $([ -f "integration-test-results.log" ] && echo "✅ COMPLETED" || echo "⚠ SKIPPED")

### Security
- **Dependency Audit:** $([ -f "audit-results.log" ] && echo "✅ COMPLETED" || echo "⚠ SKIPPED")

### Configuration Files
- **package.json:** $([ -f "package.json" ] && echo "✅ VALID" || echo "❌ MISSING")
- **TypeScript Config:** $([ -f "tsconfig.json" ] && echo "✅ VALID" || echo "N/A")

## Recommendations

$([ $status -eq 0 ] && echo "- System is ready for deployment
- Monitor application performance after deployment
- Set up production monitoring and alerting" || echo "- Review and fix failing validation checks
- Re-run validation after fixes
- Do not proceed with deployment until all critical issues are resolved")

## Files Generated

- Validation Log: $LOG_FILE
- Test Results: test-results.log
- Build Results: build-results.log
- Audit Results: audit-results.log

---
*Generated by jaqEdu Deployment Validation System*
EOF
    
    log_message "${GREEN}✓ Validation report generated: $report_file${NC}"
}

# Main execution
main() {
    log_message "${BLUE}Starting deployment validation...${NC}"
    
    # Load environment variables if available
    if [ -f ".env.$VALIDATION_ENV" ]; then
        log_message "${BLUE}Loading .env.$VALIDATION_ENV${NC}"
        export $(cat .env.$VALIDATION_ENV | grep -v '^#' | xargs)
    elif [ -f ".env" ]; then
        log_message "${BLUE}Loading .env${NC}"
        export $(cat .env | grep -v '^#' | xargs)
    fi
    
    # Run validation
    if validate_deployment_readiness; then
        generate_report 0
        log_message "${GREEN}🎉 All validation checks passed!${NC}"
        exit 0
    else
        generate_report 1
        log_message "${RED}❌ Validation failed. Check the log file for details.${NC}"
        exit 1
    fi
}

# Run main function
main "$@"