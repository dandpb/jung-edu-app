#!/bin/bash

echo "Running all tests..."
CI=true npm test -- --no-watch --coverage --verbose 2>&1 | tee test-results.txt

echo "Test run complete. Check test-results.txt for details."