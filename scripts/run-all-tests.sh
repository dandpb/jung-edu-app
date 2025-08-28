#!/bin/bash

# 🚀 Comprehensive Test Runner Script
# Executes all test suites with parallel execution and detailed reporting

set -e  # Exit on any error
set -o pipefail  # Exit if any command in pipeline fails

# Configuration
PROJECT_DIR="/Users/danielbarreto/Development/workspace/ia/jaqEdu"
APP_DIR="${PROJECT_DIR}/jung-edu-app"
RESULTS_DIR="${PROJECT_DIR}/test-results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
PARALLEL_JOBS=4

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${MAGENTA}[STEP]${NC} $1"
}

# Help function
show_help() {
    echo -e "${CYAN}🚀 Test Runner Help${NC}"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -p, --parallel          Run tests in parallel (default: true)"
    echo "  -c, --coverage          Include coverage analysis"
    echo "  -i, --integration       Include integration tests"
    echo "  -s, --suite SUITE       Run specific test suite"
    echo "  -v, --verbose           Verbose output"
    echo "  -r, --report            Generate detailed report"
    echo "  --no-build              Skip build verification"
    echo "  --no-lint               Skip linting"
    echo "  --clean                 Clean previous results"
    echo ""
    echo "Available test suites:"
    echo "  unit                    Unit tests only"
    echo "  components              Component tests only"
    echo "  services                Service tests only"
    echo "  utils                   Utility tests only"
    echo "  critical                Critical path tests only"
    echo "  integration             Integration tests only"
    echo "  all                     All tests (default)"
    echo ""
    echo "Examples:"
    echo "  $0                      Run all tests with default settings"
    echo "  $0 -s unit -c           Run unit tests with coverage"
    echo "  $0 --integration        Run all tests including integration"
    echo "  $0 --clean -r           Clean and run with detailed report"
}

# Default options
PARALLEL=true
COVERAGE=false
INTEGRATION=false
SUITE="all"
VERBOSE=false
REPORT=false
NO_BUILD=false
NO_LINT=false
CLEAN=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -p|--parallel)
            PARALLEL=true
            shift
            ;;
        -c|--coverage)
            COVERAGE=true
            shift
            ;;
        -i|--integration)
            INTEGRATION=true
            shift
            ;;
        -s|--suite)
            SUITE="$2"
            shift 2
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -r|--report)
            REPORT=true
            shift
            ;;
        --no-build)
            NO_BUILD=true
            shift
            ;;
        --no-lint)
            NO_LINT=true
            shift
            ;;
        --clean)
            CLEAN=true
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Initialize
initialize() {
    log_step "🚀 Initializing Test Runner"
    
    # Create results directory
    mkdir -p "${RESULTS_DIR}"
    
    # Clean if requested
    if [[ "$CLEAN" == true ]]; then
        log_info "🧹 Cleaning previous results..."
        rm -rf "${RESULTS_DIR:?}"/*
        rm -rf "${APP_DIR}/coverage" 2>/dev/null || true
    fi
    
    # Check if we're in the right directory
    if [[ ! -d "$APP_DIR" ]]; then
        log_error "❌ App directory not found: $APP_DIR"
        exit 1
    fi
    
    # Check if package.json exists
    if [[ ! -f "$APP_DIR/package.json" ]]; then
        log_error "❌ package.json not found in $APP_DIR"
        exit 1
    fi
    
    cd "$APP_DIR"
    log_success "✅ Environment initialized"
}

# Check dependencies
check_dependencies() {
    log_step "🔍 Checking Dependencies"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "❌ Node.js not found"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "❌ npm not found"
        exit 1
    fi
    
    # Install dependencies if node_modules doesn't exist
    if [[ ! -d "node_modules" ]]; then
        log_info "📦 Installing dependencies..."
        npm ci --prefer-offline --no-audit
    fi
    
    log_success "✅ Dependencies checked"
}

# Linting
run_linting() {
    if [[ "$NO_LINT" == true ]]; then
        log_info "⏭️ Skipping linting"
        return 0
    fi
    
    log_step "🔍 Running Linting"
    
    local lint_output="${RESULTS_DIR}/lint_${TIMESTAMP}.log"
    
    if npx eslint src/ --ext .ts,.tsx --max-warnings 0 > "$lint_output" 2>&1; then
        log_success "✅ Linting passed"
        return 0
    else
        log_warning "⚠️ Linting issues found - check $lint_output"
        [[ "$VERBOSE" == true ]] && cat "$lint_output"
        return 1
    fi
}

# TypeScript check
run_typecheck() {
    if [[ "$NO_LINT" == true ]]; then
        log_info "⏭️ Skipping TypeScript check"
        return 0
    fi
    
    log_step "🔧 Running TypeScript Check"
    
    local typecheck_output="${RESULTS_DIR}/typecheck_${TIMESTAMP}.log"
    
    if npx tsc --noEmit > "$typecheck_output" 2>&1; then
        log_success "✅ TypeScript check passed"
        return 0
    else
        log_error "❌ TypeScript errors found - check $typecheck_output"
        [[ "$VERBOSE" == true ]] && cat "$typecheck_output"
        return 1
    fi
}

# Build verification
run_build() {
    if [[ "$NO_BUILD" == true ]]; then
        log_info "⏭️ Skipping build verification"
        return 0
    fi
    
    log_step "🏗️ Running Build Verification"
    
    local build_output="${RESULTS_DIR}/build_${TIMESTAMP}.log"
    local start_time=$(date +%s)
    
    if npm run build > "$build_output" 2>&1; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        log_success "✅ Build completed in ${duration}s"
        return 0
    else
        log_error "❌ Build failed - check $build_output"
        [[ "$VERBOSE" == true ]] && cat "$build_output"
        return 1
    fi
}

# Run specific test suite
run_test_suite() {
    local suite=$1
    local output_file="${RESULTS_DIR}/${suite}_tests_${TIMESTAMP}.log"
    local start_time=$(date +%s)
    
    log_info "🧪 Running $suite tests..."
    
    local test_cmd=""
    case "$suite" in
        unit)
            test_cmd="npm run test:all"
            ;;
        components)
            test_cmd="npm run test:components"
            ;;
        services)
            test_cmd="npm run test:unit"
            ;;
        utils)
            test_cmd="npm run test:utils"
            ;;
        critical)
            test_cmd="npm run test:critical"
            ;;
        integration)
            test_cmd="npm run test:integration"
            ;;
        all)
            test_cmd="npm run test:all"
            ;;
        *)
            log_error "❌ Unknown test suite: $suite"
            return 1
            ;;
    esac
    
    # Set environment variables
    export CI=true
    export SKIP_INTEGRATION=true
    [[ "$INTEGRATION" == true ]] && export SKIP_INTEGRATION=false
    
    if eval "$test_cmd" > "$output_file" 2>&1; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        log_success "✅ $suite tests passed in ${duration}s"
        return 0
    else
        log_error "❌ $suite tests failed - check $output_file"
        [[ "$VERBOSE" == true ]] && tail -20 "$output_file"
        return 1
    fi
}

# Run coverage analysis
run_coverage() {
    if [[ "$COVERAGE" != true ]]; then
        return 0
    fi
    
    log_step "📊 Running Coverage Analysis"
    
    local coverage_output="${RESULTS_DIR}/coverage_${TIMESTAMP}.log"
    local start_time=$(date +%s)
    
    if npm run test:coverage-report > "$coverage_output" 2>&1; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        log_success "✅ Coverage analysis completed in ${duration}s"
        
        # Copy coverage reports to results
        if [[ -d "coverage" ]]; then
            cp -r coverage "${RESULTS_DIR}/coverage_${TIMESTAMP}"
        fi
        return 0
    else
        log_error "❌ Coverage analysis failed - check $coverage_output"
        [[ "$VERBOSE" == true ]] && cat "$coverage_output"
        return 1
    fi
}

# Run parallel tests
run_parallel_tests() {
    log_step "🔄 Running Tests in Parallel"
    
    local pids=()
    local results=()
    local suites=("unit" "components" "services" "utils")
    
    # Start all test suites in parallel
    for suite in "${suites[@]}"; do
        (run_test_suite "$suite") &
        pids+=($!)
        log_info "Started $suite tests (PID: ${pids[-1]})"
    done
    
    # Wait for all processes and collect results
    local overall_success=true
    for i in "${!pids[@]}"; do
        local pid=${pids[$i]}
        local suite=${suites[$i]}
        
        if wait $pid; then
            results+=("$suite:SUCCESS")
        else
            results+=("$suite:FAILED")
            overall_success=false
        fi
    done
    
    # Report results
    log_info "📊 Parallel test results:"
    for result in "${results[@]}"; do
        IFS=':' read -r suite status <<< "$result"
        if [[ "$status" == "SUCCESS" ]]; then
            log_success "  ✅ $suite"
        else
            log_error "  ❌ $suite"
        fi
    done
    
    return $overall_success
}

# Run sequential tests
run_sequential_tests() {
    log_step "🔄 Running Tests Sequentially"
    
    local overall_success=true
    
    if [[ "$SUITE" == "all" ]]; then
        local suites=("unit" "components" "services" "utils")
        for suite in "${suites[@]}"; do
            if ! run_test_suite "$suite"; then
                overall_success=false
                [[ "$VERBOSE" == false ]] && log_warning "Continuing with next suite..."
            fi
        done
    else
        run_test_suite "$SUITE"
        overall_success=$?
    fi
    
    return $overall_success
}

# Generate detailed report
generate_report() {
    if [[ "$REPORT" != true ]]; then
        return 0
    fi
    
    log_step "📋 Generating Detailed Report"
    
    local report_file="${RESULTS_DIR}/test_report_${TIMESTAMP}.md"
    
    {
        echo "# 🚀 Test Execution Report"
        echo ""
        echo "**Generated**: $(date)"
        echo "**Project**: jaqEdu"
        echo "**Branch**: $(git branch --show-current 2>/dev/null || echo 'unknown')"
        echo "**Commit**: $(git rev-parse HEAD 2>/dev/null || echo 'unknown')"
        echo ""
        echo "## 📊 Configuration"
        echo "- **Parallel Execution**: $PARALLEL"
        echo "- **Coverage Analysis**: $COVERAGE"
        echo "- **Integration Tests**: $INTEGRATION"
        echo "- **Test Suite**: $SUITE"
        echo "- **Verbose Output**: $VERBOSE"
        echo ""
        echo "## 📁 Generated Files"
        
        # List all generated files
        find "$RESULTS_DIR" -name "*_${TIMESTAMP}.*" | while read -r file; do
            local basename=$(basename "$file")
            local size=$(ls -lh "$file" | awk '{print $5}')
            echo "- **$basename** ($size)"
        done
        
        echo ""
        echo "## 📈 Summary"
        echo "Test execution completed at $(date)"
        
    } > "$report_file"
    
    log_success "✅ Report generated: $report_file"
}

# Cleanup function
cleanup() {
    log_info "🧹 Cleaning up..."
    
    # Kill any remaining background processes
    jobs -p | xargs -r kill 2>/dev/null || true
    
    # Reset directory
    cd "$PROJECT_DIR"
}

# Main execution
main() {
    local start_time=$(date +%s)
    local overall_success=true
    
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                     🚀 Test Runner v1.0                     ║"
    echo "║                  jaqEdu Educational Platform                 ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    # Trap cleanup on exit
    trap cleanup EXIT
    
    # Initialize
    initialize
    check_dependencies
    
    # Pre-flight checks
    if ! run_linting; then
        overall_success=false
    fi
    
    if ! run_typecheck; then
        overall_success=false
    fi
    
    if ! run_build; then
        overall_success=false
    fi
    
    # Run tests
    if [[ "$PARALLEL" == true ]] && [[ "$SUITE" == "all" ]]; then
        if ! run_parallel_tests; then
            overall_success=false
        fi
    else
        if ! run_sequential_tests; then
            overall_success=false
        fi
    fi
    
    # Run integration tests if requested
    if [[ "$INTEGRATION" == true ]]; then
        if ! run_test_suite "integration"; then
            overall_success=false
        fi
    fi
    
    # Run coverage analysis
    if ! run_coverage; then
        overall_success=false
    fi
    
    # Generate report
    generate_report
    
    # Final summary
    local end_time=$(date +%s)
    local total_duration=$((end_time - start_time))
    
    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    if [[ "$overall_success" == true ]]; then
        echo -e "${CYAN}║${GREEN}                    ✅ ALL TESTS PASSED                      ${CYAN}║${NC}"
    else
        echo -e "${CYAN}║${RED}                    ❌ SOME TESTS FAILED                     ${CYAN}║${NC}"
    fi
    echo -e "${CYAN}║                                                              ║${NC}"
    echo -e "${CYAN}║${NC}  Total Duration: ${total_duration}s                                    ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  Results: ${RESULTS_DIR}                  ${CYAN}║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
    
    exit $([[ "$overall_success" == true ]] && echo 0 || echo 1)
}

# Execute main function
main "$@"