#!/bin/bash

# Default ratio threshold (150 = 150%)
DEFAULT_RATIO=150

# Parse command line arguments
if [ $# -eq 0 ]; then
    RATIO_THRESHOLD=$DEFAULT_RATIO
elif [ $# -eq 1 ]; then
    # Check if the argument is a valid integer
    if [[ "$1" =~ ^[0-9]+$ ]]; then
        RATIO_THRESHOLD=$1
    else
        echo "error: invalid ratio '$1'. Please provide an integer (e.g., 150 for 150%)"
        echo "usage: $0 [ratio_threshold]"
        echo "  ratio_threshold: test-to-code ratio threshold as percentage (default: 150)"
        exit 1
    fi
else
    echo "error: too many arguments"
    echo "usage: $0 [ratio_threshold]"
    echo "  ratio_threshold: test-to-code ratio threshold as percentage (default: 150)"
    exit 1
fi

# Check if tokei is installed
if ! command -v tokei &> /dev/null; then
    echo "error: tokei is not installed"
    exit 1
fi

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "error: jq is not installed"
    exit 1
fi

# Get LOC excluding tests
code_loc=$(tokei --type TypeScript --output json --exclude '*.test.ts' | jq '.TypeScript.code // 0')

# Get LOC including tests
total_loc=$(tokei --type TypeScript --output json | jq '.TypeScript.code // 0')

# Calculate test LOC
test_loc=$((total_loc - code_loc))

# Calculate ratio (multiply by 100 to avoid floating point issues)
if [ "$code_loc" -eq 0 ]; then
    echo "error: no TypeScript code found"
    exit 1
fi

ratio=$((test_loc * 100 / code_loc))

# Check if ratio is more than the threshold
if [ "$ratio" -gt "$RATIO_THRESHOLD" ]; then
    echo "error: test-to-code ratio is $ratio% (more than ${RATIO_THRESHOLD}%)"
    echo "  Code LOC: $code_loc"
    echo "  Test LOC: $test_loc"
    echo "  Ratio: $ratio%"
    echo "  Threshold: ${RATIO_THRESHOLD}%"
    exit 1
else
    echo "success: test-to-code ratio is $ratio% (within acceptable range)"
    echo "  Code LOC: $code_loc"
    echo "  Test LOC: $test_loc"
    echo "  Ratio: $ratio%"
    echo "  Threshold: ${RATIO_THRESHOLD}%"
    exit 0
fi
