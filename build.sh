#!/bin/bash

# Build script for OWCS library

echo "🔨 Building OWCS library..."

# Clean previous build
rm -rf dist/
echo "✅ Cleaned dist/ directory"

# Compile TypeScript
npx tsc
echo "✅ TypeScript compilation complete"

# Make CLI executable
chmod +x dist/cli/index.js
echo "✅ Made CLI executable"

# Copy schema file
cp src/owcs.schema.json dist/owcs.schema.json
echo "✅ Copied schema file"

echo ""
echo "✨ Build complete! You can now:"
echo "   - Run CLI: node dist/cli/index.js"
echo "   - Test locally: npm link"
echo "   - Publish: npm publish"
echo ""
