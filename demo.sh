#!/bin/bash

# Demo script for OWCS library
# This script demonstrates the full workflow

set -e  # Exit on error

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         OWCS - Open Web Component Specification Demo        ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Build the project
echo -e "${BLUE}Step 1: Building OWCS library...${NC}"
npm run build
echo -e "${GREEN}✓ Build complete${NC}"
echo ""

# Step 2: Create output directory
echo -e "${BLUE}Step 2: Creating output directory...${NC}"
mkdir -p examples/output
echo -e "${GREEN}✓ Output directory ready${NC}"
echo ""

# Step 3: Generate YAML specification
echo -e "${BLUE}Step 3: Generating OWCS specification (YAML)...${NC}"
node dist/cli/index.js generate \
  -p examples/angular \
  --format yaml \
  --output examples/output/owcs.yaml \
  --title "User Components Library" \
  --version "1.0.0" \
  --description "Web components for user management"

if [ -f examples/output/owcs.yaml ]; then
  echo -e "${GREEN}✓ Generated: examples/output/owcs.yaml${NC}"
  echo ""
  echo -e "${YELLOW}Preview:${NC}"
  head -20 examples/output/owcs.yaml
  echo "..."
  echo ""
else
  echo -e "${RED}✗ Failed to generate YAML${NC}"
  exit 1
fi

# Step 4: Generate JSON specification
echo -e "${BLUE}Step 4: Generating OWCS specification (JSON)...${NC}"
node dist/cli/index.js generate \
  -p examples/angular \
  --format json \
  --output examples/output/owcs.json

if [ -f examples/output/owcs.json ]; then
  echo -e "${GREEN}✓ Generated: examples/output/owcs.json${NC}"
  echo ""
else
  echo -e "${RED}✗ Failed to generate JSON${NC}"
  exit 1
fi

# Step 5: Generate with OpenAPI
echo -e "${BLUE}Step 5: Generating OpenAPI specification...${NC}"
node dist/cli/index.js generate \
  -p examples/angular \
  --format yaml \
  --output examples/output/owcs-full.yaml \
  --openapi

if [ -f examples/output/owcs-full.openapi.yaml ]; then
  echo -e "${GREEN}✓ Generated: examples/output/owcs-full.openapi.yaml${NC}"
  echo ""
else
  echo -e "${RED}✗ Failed to generate OpenAPI${NC}"
  exit 1
fi

# Step 6: Validate the spec
echo -e "${BLUE}Step 6: Validating OWCS specification...${NC}"
node dist/cli/index.js validate examples/output/owcs.yaml
echo ""

# Step 7: Display spec info
echo -e "${BLUE}Step 7: Displaying specification info...${NC}"
node dist/cli/index.js info examples/output/owcs.yaml
echo ""

# Step 8: Summary
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                       Demo Complete!                         ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "Generated files:"
echo "  • examples/output/owcs.yaml              - OWCS specification (YAML)"
echo "  • examples/output/owcs.json              - OWCS specification (JSON)"
echo "  • examples/output/owcs-full.yaml         - OWCS with OpenAPI"
echo "  • examples/output/owcs-full.openapi.yaml - OpenAPI 3.1 spec"
echo ""
echo "Try the commands yourself:"
echo "  $ npx owcs generate --help"
echo "  $ npx owcs validate examples/output/owcs.yaml"
echo "  $ npx owcs info examples/output/owcs.yaml"
echo ""
echo -e "${GREEN}✨ OWCS library is ready to use!${NC}"
