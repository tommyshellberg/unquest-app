#!/bin/bash

# Wrapper script to run the user conversion
# Environment variables TEST_EMAIL and MONGODB_URI should be set by Maestro

echo "🔄 Running user conversion..."
echo "   Email: $TEST_EMAIL"
echo "   MongoDB: ${MONGODB_URI:0:30}..."

cd "$(dirname "$0")/../.." || exit 1

node .maestro/scripts/convert-provisional-user.js
