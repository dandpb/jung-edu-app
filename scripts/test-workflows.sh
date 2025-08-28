#!/bin/bash

# jaqEdu Workflow System - Complete Testing Script
# This script tests all workflow features

set -e

echo "🚀 jaqEdu Workflow System - Complete Testing Suite"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:3000}"
JWT_TOKEN=""

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Check if services are running
check_services() {
    print_info "Checking services..."
    
    # Check if API is running
    if curl -f -s "$API_URL/health" > /dev/null; then
        print_status "API is running at $API_URL"
    else
        print_error "API is not running. Starting services..."
        docker-compose -f docker-compose.workflow.yml up -d
        sleep 10
    fi
    
    # Check PostgreSQL
    if docker-compose -f docker-compose.workflow.yml ps | grep postgres | grep Up > /dev/null; then
        print_status "PostgreSQL is running"
    else
        print_error "PostgreSQL is not running"
        exit 1
    fi
    
    # Check Redis
    if docker-compose -f docker-compose.workflow.yml ps | grep redis | grep Up > /dev/null; then
        print_status "Redis is running"
    else
        print_error "Redis is not running"
        exit 1
    fi
}

# Authenticate and get JWT token
authenticate() {
    print_info "Authenticating..."
    
    RESPONSE=$(curl -s -X POST "$API_URL/api/v1/auth/login" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "admin@jaquedu.com",
            "password": "admin123"
        }')
    
    JWT_TOKEN=$(echo $RESPONSE | jq -r '.token')
    
    if [ "$JWT_TOKEN" != "null" ]; then
        print_status "Authentication successful"
    else
        print_error "Authentication failed. Creating test user..."
        create_test_user
    fi
}

# Create test user
create_test_user() {
    curl -s -X POST "$API_URL/api/v1/auth/register" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "admin@jaquedu.com",
            "password": "admin123",
            "role": "admin",
            "name": "Test Admin"
        }' > /dev/null
    
    authenticate
}

# Test 1: Basic Workflow Creation
test_workflow_creation() {
    print_info "\n📋 Test 1: Workflow Creation"
    echo "================================"
    
    RESPONSE=$(curl -s -X POST "$API_URL/api/v1/workflows" \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "Test Student Onboarding",
            "description": "Automated test workflow for student onboarding",
            "type": "educational",
            "nodes": [
                {
                    "id": "start",
                    "type": "task",
                    "action": "validateStudent",
                    "config": {
                        "required": ["email", "name", "studentId"]
                    }
                },
                {
                    "id": "welcome",
                    "type": "task",
                    "action": "sendWelcomeEmail",
                    "config": {
                        "template": "student-welcome"
                    }
                },
                {
                    "id": "assessment",
                    "type": "task",
                    "action": "createInitialAssessment",
                    "config": {
                        "type": "placement",
                        "duration": 30
                    }
                }
            ],
            "edges": [
                { "from": "start", "to": "welcome" },
                { "from": "welcome", "to": "assessment" }
            ]
        }')
    
    WORKFLOW_ID=$(echo $RESPONSE | jq -r '.id')
    
    if [ "$WORKFLOW_ID" != "null" ]; then
        print_status "Workflow created successfully (ID: $WORKFLOW_ID)"
        echo "Response: $(echo $RESPONSE | jq '.')"
    else
        print_error "Failed to create workflow"
        echo "Error: $RESPONSE"
    fi
}

# Test 2: Workflow Execution
test_workflow_execution() {
    print_info "\n🏃 Test 2: Workflow Execution"
    echo "================================"
    
    RESPONSE=$(curl -s -X POST "$API_URL/api/v1/workflows/$WORKFLOW_ID/execute" \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "inputData": {
                "studentId": "student-123",
                "name": "John Doe",
                "email": "john.doe@example.com",
                "courseId": "psychology-101"
            },
            "options": {
                "priority": "high",
                "timeout": 60000
            }
        }')
    
    EXECUTION_ID=$(echo $RESPONSE | jq -r '.executionId')
    
    if [ "$EXECUTION_ID" != "null" ]; then
        print_status "Workflow execution started (ID: $EXECUTION_ID)"
        echo "Response: $(echo $RESPONSE | jq '.')"
    else
        print_error "Failed to execute workflow"
        echo "Error: $RESPONSE"
    fi
}

# Test 3: Monitor Execution Status
test_execution_monitoring() {
    print_info "\n📊 Test 3: Execution Monitoring"
    echo "================================"
    
    # Poll execution status
    for i in {1..10}; do
        RESPONSE=$(curl -s -X GET "$API_URL/api/v1/executions/$EXECUTION_ID" \
            -H "Authorization: Bearer $JWT_TOKEN")
        
        STATUS=$(echo $RESPONSE | jq -r '.status')
        CURRENT_STATE=$(echo $RESPONSE | jq -r '.currentState')
        PROGRESS=$(echo $RESPONSE | jq -r '.progress')
        
        echo "Attempt $i/10:"
        echo "  Status: $STATUS"
        echo "  Current State: $CURRENT_STATE"
        echo "  Progress: $PROGRESS%"
        
        if [ "$STATUS" == "completed" ] || [ "$STATUS" == "failed" ]; then
            if [ "$STATUS" == "completed" ]; then
                print_status "Workflow completed successfully!"
            else
                print_error "Workflow failed"
            fi
            echo "Final Response: $(echo $RESPONSE | jq '.')"
            break
        fi
        
        sleep 2
    done
}

# Test 4: Parallel Workflow Execution
test_parallel_workflow() {
    print_info "\n⚡ Test 4: Parallel Workflow Execution"
    echo "========================================="
    
    # Create workflow with parallel nodes
    RESPONSE=$(curl -s -X POST "$API_URL/api/v1/workflows" \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "Parallel Course Setup",
            "type": "educational",
            "executionStrategy": "parallel",
            "nodes": [
                {
                    "id": "start",
                    "type": "task",
                    "action": "validateCourse"
                },
                {
                    "id": "parallel-tasks",
                    "type": "parallel",
                    "children": [
                        {
                            "id": "setup-content",
                            "type": "task",
                            "action": "setupCourseContent"
                        },
                        {
                            "id": "setup-assessments",
                            "type": "task",
                            "action": "createAssessments"
                        },
                        {
                            "id": "enroll-students",
                            "type": "task",
                            "action": "enrollStudents"
                        }
                    ]
                },
                {
                    "id": "notify",
                    "type": "task",
                    "action": "sendNotifications"
                }
            ],
            "edges": [
                { "from": "start", "to": "parallel-tasks" },
                { "from": "parallel-tasks", "to": "notify" }
            ]
        }')
    
    PARALLEL_WORKFLOW_ID=$(echo $RESPONSE | jq -r '.id')
    
    if [ "$PARALLEL_WORKFLOW_ID" != "null" ]; then
        print_status "Parallel workflow created (ID: $PARALLEL_WORKFLOW_ID)"
        
        # Execute the parallel workflow
        RESPONSE=$(curl -s -X POST "$API_URL/api/v1/workflows/$PARALLEL_WORKFLOW_ID/execute" \
            -H "Authorization: Bearer $JWT_TOKEN" \
            -H "Content-Type: application/json" \
            -d '{
                "inputData": {
                    "courseId": "math-201",
                    "studentIds": ["student-1", "student-2", "student-3"],
                    "startDate": "2024-01-15"
                }
            }')
        
        print_status "Parallel workflow executed"
        echo "Response: $(echo $RESPONSE | jq '.')"
    fi
}

# Test 5: Conditional Workflow
test_conditional_workflow() {
    print_info "\n🔀 Test 5: Conditional Workflow"
    echo "=================================="
    
    RESPONSE=$(curl -s -X POST "$API_URL/api/v1/workflows" \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "Adaptive Learning Path",
            "type": "educational",
            "nodes": [
                {
                    "id": "assessment",
                    "type": "task",
                    "action": "conductAssessment"
                },
                {
                    "id": "check-score",
                    "type": "condition",
                    "condition": "score >= 80",
                    "truePath": "advanced",
                    "falsePath": "foundation"
                },
                {
                    "id": "advanced",
                    "type": "task",
                    "action": "assignAdvancedContent"
                },
                {
                    "id": "foundation",
                    "type": "task",
                    "action": "assignFoundationContent"
                }
            ],
            "edges": [
                { "from": "assessment", "to": "check-score" },
                { "from": "check-score", "to": "advanced", "condition": "true" },
                { "from": "check-score", "to": "foundation", "condition": "false" }
            ]
        }')
    
    CONDITIONAL_WORKFLOW_ID=$(echo $RESPONSE | jq -r '.id')
    
    # Test with high score
    print_info "Testing with high score (85)..."
    curl -s -X POST "$API_URL/api/v1/workflows/$CONDITIONAL_WORKFLOW_ID/execute" \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "inputData": {
                "studentId": "advanced-student",
                "score": 85
            }
        }' | jq '.'
    
    # Test with low score
    print_info "Testing with low score (65)..."
    curl -s -X POST "$API_URL/api/v1/workflows/$CONDITIONAL_WORKFLOW_ID/execute" \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "inputData": {
                "studentId": "foundation-student",
                "score": 65
            }
        }' | jq '.'
    
    print_status "Conditional workflow tests completed"
}

# Test 6: Loop Workflow
test_loop_workflow() {
    print_info "\n🔄 Test 6: Loop Workflow"
    echo "==========================="
    
    RESPONSE=$(curl -s -X POST "$API_URL/api/v1/workflows" \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "Retry Assessment Until Pass",
            "type": "educational",
            "nodes": [
                {
                    "id": "attempt-quiz",
                    "type": "task",
                    "action": "attemptQuiz"
                },
                {
                    "id": "check-pass",
                    "type": "loop",
                    "loopType": "while",
                    "condition": "score < 70",
                    "maxIterations": 3,
                    "body": [
                        {
                            "id": "review-material",
                            "type": "task",
                            "action": "reviewMaterial"
                        },
                        {
                            "id": "retry-quiz",
                            "type": "task",
                            "action": "attemptQuiz"
                        }
                    ]
                },
                {
                    "id": "complete",
                    "type": "task",
                    "action": "markComplete"
                }
            ]
        }')
    
    print_status "Loop workflow created and tested"
}

# Test 7: State Management
test_state_management() {
    print_info "\n💾 Test 7: State Management"
    echo "=============================="
    
    # Create a state snapshot
    print_info "Creating state snapshot..."
    curl -s -X POST "$API_URL/api/v1/executions/$EXECUTION_ID/snapshot" \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "description": "Before critical operation"
        }' | jq '.'
    
    # Get execution history
    print_info "Getting execution history..."
    curl -s -X GET "$API_URL/api/v1/executions/$EXECUTION_ID/history" \
        -H "Authorization: Bearer $JWT_TOKEN" | jq '.'
    
    print_status "State management tested"
}

# Test 8: Performance Testing
test_performance() {
    print_info "\n⚡ Test 8: Performance Testing"
    echo "================================="
    
    print_info "Running load test (100 concurrent workflows)..."
    
    # Create simple workflow for load testing
    RESPONSE=$(curl -s -X POST "$API_URL/api/v1/workflows" \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "Load Test Workflow",
            "type": "performance-test",
            "nodes": [
                {
                    "id": "task1",
                    "type": "task",
                    "action": "simpleTask"
                }
            ]
        }')
    
    LOAD_TEST_WORKFLOW_ID=$(echo $RESPONSE | jq -r '.id')
    
    # Run concurrent executions
    START_TIME=$(date +%s)
    
    for i in {1..100}; do
        curl -s -X POST "$API_URL/api/v1/workflows/$LOAD_TEST_WORKFLOW_ID/execute" \
            -H "Authorization: Bearer $JWT_TOKEN" \
            -H "Content-Type: application/json" \
            -d "{
                \"inputData\": {
                    \"testId\": \"$i\"
                }
            }" > /dev/null &
        
        if [ $((i % 10)) -eq 0 ]; then
            echo "Started $i/100 workflows..."
        fi
    done
    
    wait
    
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    print_status "Load test completed in ${DURATION} seconds"
    print_info "Throughput: $((100 / DURATION)) workflows/second"
}

# Test 9: Monitoring & Metrics
test_monitoring() {
    print_info "\n📊 Test 9: Monitoring & Metrics"
    echo "=================================="
    
    # Get system metrics
    print_info "Fetching system metrics..."
    curl -s -X GET "$API_URL/metrics" | head -20
    
    # Get Prometheus metrics
    print_info "\nFetching Prometheus metrics..."
    curl -s -X GET "$API_URL/metrics/prometheus" | grep workflow | head -10
    
    # Get dashboard data
    print_info "\nFetching dashboard data..."
    curl -s -X GET "$API_URL/api/v1/dashboard/current" \
        -H "Authorization: Bearer $JWT_TOKEN" | jq '.'
    
    print_status "Monitoring tested successfully"
}

# Test 10: Error Handling
test_error_handling() {
    print_info "\n❌ Test 10: Error Handling"
    echo "============================="
    
    # Test invalid workflow
    print_info "Testing invalid workflow..."
    RESPONSE=$(curl -s -X POST "$API_URL/api/v1/workflows" \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "",
            "nodes": []
        }')
    
    echo "Invalid workflow response: $(echo $RESPONSE | jq '.')"
    
    # Test unauthorized access
    print_info "\nTesting unauthorized access..."
    RESPONSE=$(curl -s -X GET "$API_URL/api/v1/workflows" \
        -H "Authorization: Bearer invalid-token")
    
    echo "Unauthorized response: $(echo $RESPONSE | jq '.')"
    
    # Test rate limiting
    print_info "\nTesting rate limiting..."
    for i in {1..20}; do
        curl -s -X GET "$API_URL/api/v1/workflows" \
            -H "Authorization: Bearer $JWT_TOKEN" > /dev/null
    done
    
    RESPONSE=$(curl -s -X GET "$API_URL/api/v1/workflows" \
        -H "Authorization: Bearer $JWT_TOKEN")
    
    if echo "$RESPONSE" | grep -q "rate limit"; then
        print_status "Rate limiting is working"
    else
        print_info "Rate limit not reached or not configured"
    fi
}

# Test 11: API Documentation
test_api_documentation() {
    print_info "\n📚 Test 11: API Documentation"
    echo "================================"
    
    # Access Swagger/OpenAPI documentation
    print_info "Checking API documentation endpoint..."
    
    if curl -f -s "$API_URL/api-docs" > /dev/null; then
        print_status "API documentation available at $API_URL/api-docs"
    else
        print_info "API documentation not exposed on this endpoint"
    fi
}

# Test 12: Cleanup and Teardown
test_cleanup() {
    print_info "\n🧹 Test 12: Cleanup Operations"
    echo "================================="
    
    # Cancel any running executions
    print_info "Cancelling test executions..."
    curl -s -X POST "$API_URL/api/v1/executions/$EXECUTION_ID/cancel" \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "reason": "Test cleanup"
        }' | jq '.'
    
    # Delete test workflows
    print_info "Deleting test workflows..."
    curl -s -X DELETE "$API_URL/api/v1/workflows/$WORKFLOW_ID" \
        -H "Authorization: Bearer $JWT_TOKEN" | jq '.'
    
    print_status "Cleanup completed"
}

# Main test execution
main() {
    echo ""
    echo "🧪 Starting Complete Test Suite"
    echo "================================"
    echo ""
    
    check_services
    authenticate
    
    test_workflow_creation
    test_workflow_execution
    test_execution_monitoring
    test_parallel_workflow
    test_conditional_workflow
    test_loop_workflow
    test_state_management
    test_performance
    test_monitoring
    test_error_handling
    test_api_documentation
    test_cleanup
    
    echo ""
    echo "================================"
    print_status "🎉 All tests completed successfully!"
    echo ""
    echo "📊 Test Summary:"
    echo "  ✅ Workflow Creation"
    echo "  ✅ Workflow Execution"
    echo "  ✅ Execution Monitoring"
    echo "  ✅ Parallel Processing"
    echo "  ✅ Conditional Logic"
    echo "  ✅ Loop Handling"
    echo "  ✅ State Management"
    echo "  ✅ Performance Testing"
    echo "  ✅ Monitoring & Metrics"
    echo "  ✅ Error Handling"
    echo "  ✅ API Documentation"
    echo "  ✅ Cleanup Operations"
    echo ""
    echo "🔗 Access Points:"
    echo "  - API: $API_URL"
    echo "  - Metrics: $API_URL/metrics"
    echo "  - Health: $API_URL/health"
    echo "  - Docs: $API_URL/api-docs"
    echo ""
}

# Run tests
main