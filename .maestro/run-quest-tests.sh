#!/bin/bash

# Quest E2E Test Runner
# Runs the complete quest flow with proper timing

echo "🎮 Starting Quest E2E Tests..."
echo "=================================="

# Phase 1: Onboarding up to pending quest
echo "📱 Phase 1: Running onboarding test..."
maestro test .maestro/app/onboarding.yaml
if [ $? -ne 0 ]; then
    echo "❌ Onboarding test failed!"
    exit 1
fi
echo "✅ Phase 1 complete - Ready to start quest"

# Phase 2: Lock phone to start quest
echo ""
echo "🔒 Phase 2: Locking phone to start quest..."
maestro test .maestro/app/lock-quest.yaml
if [ $? -ne 0 ]; then
    echo "❌ Lock quest test failed!"
    exit 1
fi
echo "✅ Phase 2 complete - Quest started"

# Wait for quest to complete (2 minutes in development)
echo ""
echo "⏳ Waiting 2 minutes for quest to complete..."
echo "   Started at: $(date '+%H:%M:%S')"
sleep 120
echo "   Completed at: $(date '+%H:%M:%S')"

# Phase 3: Verify quest completion and signup
echo ""
echo "🏆 Phase 3: Verifying quest completion..."
maestro test .maestro/app/post-quest.yaml
if [ $? -ne 0 ]; then
    echo "❌ Post-quest test failed!"
    exit 1
fi
echo "✅ Phase 3 complete - Quest completed and signup verified"

echo ""
echo "=================================="
echo "🎉 All quest tests passed successfully!"