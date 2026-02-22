# @owcs/schemas

JSON Schema definitions and validation utilities for OWCS (Open Web Component Specification).

## Overview

This package provides:

- **JSON Schema definitions** for OWCS specification versions
- **Schema validation utilities** for validating OWCS files
- **Version management** for schema evolution
- **TypeScript types** for schema versions

The schemas define the structure of OWCS specifications including:

- Component metadata (tagName, module, description)
- Property schemas (types, validation rules, required fields)
- Event definitions (types, payloads)
- Module federation configuration
- Custom vendor extensions (x-\* fields)

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

Returns the JSON Schema object for the specified OWCS version. Use this to validate OWCS specifications programmatically.

**Example:**

```typescript
const schema = getSchema('1.0.0');
// Use with AJV or other JSON Schema validators
```

### `getAvailableVersions(): SchemaVersion[]`

Returns an array of all available schema versions.

**Example:**

```typescript
const versions = getAvailableVersions();
console.log(versions); // ['1.0.0']
```

### `DEFAULT_SCHEMA_VERSION`

The default schema version used when none is specified. Currently `'1.0.0'`.

### `AVAILABLE_SCHEMAS`

Read-only map of all available schemas indexed by version. Useful for iterating over all schemas or checking schema availability.

**Example:**

```typescript
import { AVAILABLE_SCHEMAS } from '@owcs/schemas';

for (const [version, schema] of Object.entries(AVAILABLE_SCHEMAS)) {
  console.log(`Schema v${version}:`, schema);
}
```

## Schema Versions

### v1.0.0 (Current)

The initial OWCS specification version includes:

- **Component definitions** - Web component metadata and registration
- **Property schemas** - JSON Schema-based property type definitions
- **Event definitions** - Event types and payload schemas
- **Module federation** - Runtime configuration for micro-frontends
- **Vendor extensions** - Custom x-\* fields for tooling-specific metadata

## Usage in Other Packages

This package is used by:

- **@owcs/api** - For validating generated specifications
- **@owcs/cli** - For validation commands
- **@owcs/ui** - For validating loaded YAML files

## License

MIT - see [LICENSE](../../LICENSE) for details.
