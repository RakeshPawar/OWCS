# @owcs/schemas

JSON Schema definitions and utilities for OWCS (Open Web Component Specification).

## Overview

This package provides:

- JSON Schema definitions for OWCS specification versions
- Schema validation utilities
- Version management for schemas

## Installation

```bash
pnpm add @owcs/schemas
```

## Usage

```typescript
import { getSchema, validateSchema, getAvailableVersions, AVAILABLE_SCHEMAS } from '@owcs/schemas';

// Get schema for a specific version
const schema = getSchema('1.0.0');

// Get available schema versions
const versions = getAvailableVersions();
console.log(versions); // ['1.0.0']

// Check all available schemas
console.log(AVAILABLE_SCHEMAS);
```

## API

### `getSchema(version: SchemaVersion): object`

Returns the JSON Schema for the specified OWCS version.

### `getAvailableVersions(): SchemaVersion[]`

Returns an array of all available schema versions.

### `DEFAULT_SCHEMA_VERSION`

The default schema version used when none is specified.

### `AVAILABLE_SCHEMAS`

Map of all available schemas by version.

## Schema Versions

- **v1.0.0**: Initial OWCS specification with component properties, events, and module federation support

## License

MIT
