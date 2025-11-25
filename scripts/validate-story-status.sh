#!/bin/bash
# Story Status Validation Script
# Validates that story status header matches actual task completion

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if file argument provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <story-file.md>"
    echo "Example: $0 docs/sprint-artifacts/epic-3/3-2-property-and-unit-management.md"
    exit 1
fi

STORY_FILE=$1

# Check if file exists
if [ ! -f "$STORY_FILE" ]; then
    echo -e "${RED}❌ File not found: $STORY_FILE${NC}"
    exit 1
fi

# Extract story name
STORY_NAME=$(basename "$STORY_FILE" .md)

echo "Validating: $STORY_NAME"
echo "---"

# Extract status from header (line 3 typically)
# Patterns to match:
#   Status: completed (100% complete - 29/29 tasks)
#   Status: completed (100%)
#   Status: in_progress (50% complete - 10/20 tasks)
STATUS_LINE=$(grep -E "^Status:" "$STORY_FILE" | head -1)

if [ -z "$STATUS_LINE" ]; then
    echo -e "${YELLOW}⚠️  WARNING: No status line found${NC}"
    echo "Expected format: Status: completed (100% complete - X/Y tasks)"
    exit 0
fi

echo "Status Line: $STATUS_LINE"

# Extract status (completed, in_progress, blocked, etc.)
STATUS=$(echo "$STATUS_LINE" | sed -n 's/^Status: *\([a-z_]*\).*/\1/p')

# Extract percentage if present (compatible with BSD grep on macOS)
STATUS_PERCENT=$(echo "$STATUS_LINE" | sed -n 's/.*\([0-9][0-9]*\)%.*/\1/p')

# Extract task counts if present (X/Y tasks)
DECLARED_COMPLETED=$(echo "$STATUS_LINE" | sed -n 's/.*\([0-9][0-9]*\)\/[0-9][0-9]* tasks.*/\1/p')
DECLARED_TOTAL=$(echo "$STATUS_LINE" | sed -n 's/.*[0-9][0-9]*\/\([0-9][0-9]*\) tasks.*/\1/p')

# Count actual tasks from markdown
# Tasks are typically in format: - [x] Task or - [ ] Task
TOTAL_TASKS=$(grep -cE "^[[:space:]]*- \[[ xX]\]" "$STORY_FILE" || echo "0")
COMPLETED_TASKS=$(grep -cE "^[[:space:]]*- \[[xX]\]" "$STORY_FILE" || echo "0")

# Calculate actual percentage
if [ "$TOTAL_TASKS" -gt 0 ]; then
    ACTUAL_PERCENT=$(( (COMPLETED_TASKS * 100) / TOTAL_TASKS ))
else
    ACTUAL_PERCENT=0
fi

# Display findings
echo ""
echo "Declared Status: $STATUS"

if [ -n "$STATUS_PERCENT" ]; then
    echo "Declared Progress: ${STATUS_PERCENT}%"
fi

if [ -n "$DECLARED_COMPLETED" ] && [ -n "$DECLARED_TOTAL" ]; then
    echo "Declared Tasks: ${DECLARED_COMPLETED}/${DECLARED_TOTAL}"
fi

echo ""
echo "Actual Tasks Found: ${COMPLETED_TASKS}/${TOTAL_TASKS}"
echo "Actual Progress: ${ACTUAL_PERCENT}%"
echo ""

# Validation checks
ERRORS=0

# Check 1: If status is "completed" or "done", progress should be 100%
if [[ "$STATUS" == "completed" || "$STATUS" == "done" ]]; then
    if [ "$ACTUAL_PERCENT" -ne 100 ]; then
        echo -e "${RED}❌ ERROR: Status is '$STATUS' but only ${ACTUAL_PERCENT}% of tasks are complete${NC}"
        echo "   Expected: 100% (${TOTAL_TASKS}/${TOTAL_TASKS} tasks)"
        echo "   Actual: ${ACTUAL_PERCENT}% (${COMPLETED_TASKS}/${TOTAL_TASKS} tasks)"
        ERRORS=$((ERRORS + 1))
    fi
fi

# Check 2: If percentage is declared, it should match actual
if [ -n "$STATUS_PERCENT" ]; then
    TOLERANCE=5  # Allow 5% tolerance for rounding
    DIFF=$((STATUS_PERCENT - ACTUAL_PERCENT))
    DIFF=${DIFF#-}  # Absolute value

    if [ "$DIFF" -gt "$TOLERANCE" ]; then
        echo -e "${RED}❌ ERROR: Declared percentage (${STATUS_PERCENT}%) doesn't match actual (${ACTUAL_PERCENT}%)${NC}"
        echo "   Difference: ${DIFF} percentage points (tolerance: ${TOLERANCE}%)"
        ERRORS=$((ERRORS + 1))
    fi
fi

# Check 3: If task counts are declared, they should match actual
if [ -n "$DECLARED_COMPLETED" ] && [ -n "$DECLARED_TOTAL" ]; then
    if [ "$DECLARED_COMPLETED" -ne "$COMPLETED_TASKS" ] || [ "$DECLARED_TOTAL" -ne "$TOTAL_TASKS" ]; then
        echo -e "${RED}❌ ERROR: Declared task count doesn't match actual${NC}"
        echo "   Declared: ${DECLARED_COMPLETED}/${DECLARED_TOTAL} tasks"
        echo "   Actual: ${COMPLETED_TASKS}/${TOTAL_TASKS} tasks"
        ERRORS=$((ERRORS + 1))
    fi
fi

# Check 4: If 100% complete, status should be "completed" or "done"
if [ "$ACTUAL_PERCENT" -eq 100 ] && [ "$TOTAL_TASKS" -gt 0 ]; then
    if [[ "$STATUS" != "completed" && "$STATUS" != "done" ]]; then
        echo -e "${YELLOW}⚠️  WARNING: All tasks complete but status is not 'completed' (current: '$STATUS')${NC}"
        # This is a warning, not an error
    fi
fi

# Display result
echo ""
echo "---"

if [ "$ERRORS" -eq 0 ]; then
    echo -e "${GREEN}✅ VALIDATION PASSED: $STORY_NAME${NC}"
    echo "   Status and task completion are consistent"
    exit 0
else
    echo -e "${RED}❌ VALIDATION FAILED: $STORY_NAME${NC}"
    echo "   Found $ERRORS error(s) - please correct status header to match actual task completion"
    echo ""
    echo "Suggested fix for status line:"
    if [ "$ACTUAL_PERCENT" -eq 100 ]; then
        echo "   Status: completed (100% complete - ${TOTAL_TASKS}/${TOTAL_TASKS} tasks)"
    else
        echo "   Status: in_progress (${ACTUAL_PERCENT}% complete - ${COMPLETED_TASKS}/${TOTAL_TASKS} tasks)"
    fi
    exit 1
fi
