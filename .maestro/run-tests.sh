#!/bin/bash

# =============================================================================
# UnQuest Maestro E2E Test Runner
# =============================================================================
# Comprehensive test runner with environment setup and validation
#
# Usage:
#   ./run-tests.sh [phase]
#
# Examples:
#   ./run-tests.sh            # Run full test suite
#   ./run-tests.sh onboarding # Run only onboarding tests
#   ./run-tests.sh regression # Run quick smoke tests
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =============================================================================
# CONFIGURATION
# =============================================================================

# Generate unique timestamp for this test run
TIMESTAMP=$(date +%s)
TEST_EMAIL="test-${TIMESTAMP}@unquest.test"

# MongoDB URI - update this for your environment
if [ -z "$MONGODB_URI" ]; then
  echo -e "${YELLOW}⚠️  MONGODB_URI not set, using default localhost${NC}"
  MONGODB_URI="mongodb://localhost:27017/unquest-dev"
fi

# =============================================================================
# VALIDATE ENVIRONMENT
# =============================================================================

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  UnQuest E2E Test Suite${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if Maestro is installed
if ! command -v maestro &> /dev/null; then
    echo -e "${RED}❌ Maestro is not installed${NC}"
    echo ""
    echo "Install with: curl -Ls 'https://get.maestro.mobile.dev' | bash"
    exit 1
fi

echo -e "${GREEN}✓${NC} Maestro installed: $(maestro --version)"

# Check if mongosh is installed (needed for conversion script)
if ! command -v mongosh &> /dev/null; then
    echo -e "${YELLOW}⚠️  mongosh is not installed (needed for user conversion)${NC}"
    echo ""
    echo "Install with: brew install mongosh"
    echo ""
fi

# Display test configuration
echo ""
echo -e "${BLUE}Test Configuration:${NC}"
echo "  Test Email: ${TEST_EMAIL}"
echo "  MongoDB URI: ${MONGODB_URI}"
echo "  Timestamp: ${TIMESTAMP}"
echo ""

# =============================================================================
# DETERMINE WHICH TESTS TO RUN
# =============================================================================

PHASE="${1:-all}"

case "$PHASE" in
  all)
    echo -e "${BLUE}Running: Full Test Suite${NC}"
    TEST_PATH=".maestro/"
    ;;
  onboarding)
    echo -e "${BLUE}Running: Onboarding Tests Only${NC}"
    TEST_PATH=".maestro/flows/01-onboarding/"
    ;;
  conversion)
    echo -e "${BLUE}Running: Conversion Tests Only${NC}"
    TEST_PATH=".maestro/flows/02-conversion/"
    ;;
  fresh)
    echo -e "${BLUE}Running: Fresh Authenticated User Tests${NC}"
    TEST_PATH=".maestro/flows/03-fresh-authenticated/"
    ;;
  coverage)
    echo -e "${BLUE}Running: Screen Coverage Tests${NC}"
    TEST_PATH=".maestro/flows/04-screen-coverage/"
    ;;
  regression)
    echo -e "${BLUE}Running: Regression Tests Only${NC}"
    TEST_PATH=".maestro/flows/05-regression/"
    ;;
  *)
    echo -e "${RED}❌ Invalid phase: $PHASE${NC}"
    echo ""
    echo "Valid phases: all, onboarding, conversion, fresh, coverage, regression"
    exit 1
    ;;
esac

echo ""

# =============================================================================
# RUN TESTS
# =============================================================================

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Starting Tests${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

START_TIME=$(date +%s)

# Special handling for "all" and "onboarding" phases which need split tests
if [ "$PHASE" == "all" ] || [ "$PHASE" == "onboarding" ]; then
  echo -e "${BLUE}Running Onboarding Part 1...${NC}"
  maestro test .maestro/flows/01-onboarding/onboarding-part-1.yaml \
    --env TEST_EMAIL_TIMESTAMP="$TIMESTAMP" \
    --env TEST_EMAIL="$TEST_EMAIL" \
    --env MONGODB_URI="$MONGODB_URI"

  EXIT_CODE=$?
  if [ $EXIT_CODE -ne 0 ]; then
    echo -e "${RED}❌ Onboarding Part 1 Failed${NC}"
    # Don't continue to part 2 if part 1 failed
  else
    echo -e "${GREEN}✓${NC} Onboarding Part 1 Passed"
    echo ""
    echo -e "${YELLOW}⏳ Waiting 15 seconds for quest completion (10s quest + 5s buffer)...${NC}"
    sleep 15
    echo ""

    echo -e "${BLUE}Running Onboarding Part 2...${NC}"
    maestro test .maestro/flows/01-onboarding/onboarding-part-2.yaml \
      --env TEST_EMAIL_TIMESTAMP="$TIMESTAMP" \
      --env TEST_EMAIL="$TEST_EMAIL" \
      --env MONGODB_URI="$MONGODB_URI"

    EXIT_CODE=$?
    if [ $EXIT_CODE -ne 0 ]; then
      echo -e "${RED}❌ Onboarding Part 2 Failed${NC}"
    else
      echo -e "${GREEN}✓${NC} Onboarding Part 2 Passed"
    fi
  fi

  # If this is the "all" phase, continue with remaining tests
  if [ "$PHASE" == "all" ] && [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo -e "${BLUE}Running Remaining Test Phases...${NC}"
    maestro test .maestro/flows/02-conversion/ \
      --env TEST_EMAIL_TIMESTAMP="$TIMESTAMP" \
      --env TEST_EMAIL="$TEST_EMAIL" \
      --env MONGODB_URI="$MONGODB_URI"

    EXIT_CODE=$?
    if [ $EXIT_CODE -ne 0 ]; then
      echo -e "${RED}❌ Conversion Phase Failed${NC}"
    else
      maestro test .maestro/flows/03-fresh-authenticated/ \
        --env TEST_EMAIL_TIMESTAMP="$TIMESTAMP" \
        --env TEST_EMAIL="$TEST_EMAIL" \
        --env MONGODB_URI="$MONGODB_URI"

      EXIT_CODE=$?
      if [ $EXIT_CODE -ne 0 ]; then
        echo -e "${RED}❌ Fresh Authenticated Phase Failed${NC}"
      else
        maestro test .maestro/flows/04-screen-coverage/ \
          --env TEST_EMAIL_TIMESTAMP="$TIMESTAMP" \
          --env TEST_EMAIL="$TEST_EMAIL" \
          --env MONGODB_URI="$MONGODB_URI"

        EXIT_CODE=$?
        if [ $EXIT_CODE -ne 0 ]; then
          echo -e "${RED}❌ Screen Coverage Phase Failed${NC}"
        fi
      fi
    fi
  fi
else
  # For other phases, run normally
  maestro test "$TEST_PATH" \
    --env TEST_EMAIL_TIMESTAMP="$TIMESTAMP" \
    --env TEST_EMAIL="$TEST_EMAIL" \
    --env MONGODB_URI="$MONGODB_URI"

  EXIT_CODE=$?
fi

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ $EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✅ All Tests Passed!${NC}"
else
  echo -e "${RED}❌ Tests Failed${NC}"
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Duration: ${MINUTES}m ${SECONDS}s"
echo "Test User: ${TEST_EMAIL}"
echo ""

# =============================================================================
# CLEANUP REMINDER
# =============================================================================

if [ $EXIT_CODE -eq 0 ] && [ "$PHASE" == "all" ]; then
  echo -e "${YELLOW}💡 Reminder: Clean up test user from database after testing${NC}"
  echo ""
  echo "MongoDB cleanup command:"
  echo "  mongosh \"$MONGODB_URI\" --eval 'db.users.deleteOne({email: \"$TEST_EMAIL\"})'"
  echo ""
fi

exit $EXIT_CODE
