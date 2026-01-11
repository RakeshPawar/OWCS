# Schema Validation

> **Note**: This is technical documentation for developers working with OWCS schemas. Most users don't need to read this.

OWCS uses JSON Schema to validate generated specifications. The current version supports:

- **OWCS 1.0.0** - Current stable version

## For End Users

You typically don't need to work with schemas directly. OWCS handles validation automatically:

```bash
# Validation happens automatically during generation
npx owcs generate

# Manually validate a specification
npx owcs validate owcs.yaml
```

## For Developers

The schema system supports versioning for backward compatibility:

### Validation with Versions

```typescript
import { validateOWCSSpec } from './api/core/validator';

// Validate with default (latest) version
const result = validateOWCSSpec(spec);

// Validate with specific version
const resultV1 = validateOWCSSpec(spec, '1.0.0');
```

### Check Available Versions

```typescript
import { getAvailableVersions, hasSchema } from './schemas';

// Get all available versions
const versions = getAvailableVersions();
console.log(versions); // ['1', '1.0', '1.0.0', 'latest']

// Check if version exists
if (hasSchema('1.0.0')) {
  // Version is available
}
```

## Adding New Versions

To add a new schema version (e.g., v2.0.0):

1. **Create the version directory**:

   ```bash
   mkdir -p src/schemas/v2
   ```

2. **Add the schema file**:

   ```bash
   # Create src/schemas/v2/owcs-schema-v2.0.0.json
   ```

3. **Update the schema index** (`schemas/index.ts`):

   ```typescript
   import schemaV1 from './v1/owcs-schema-v1.0.0.json' with { type: 'json' };
   import schemaV2 from './v2/owcs-schema-v2.0.0.json' with { type: 'json' };

   export type SchemaVersion = '1.0.0' | '1.0' | '1' | '2.0.0' | '2.0' | '2' | 'latest';

   export const AVAILABLE_SCHEMAS = {
     '1.0.0': schemaV1,
     '1.0': schemaV1,
     '1': schemaV1,
     '2.0.0': schemaV2,
     '2.0': schemaV2,
     '2': schemaV2,
     latest: schemaV2, // Update to point to latest version
   } as const;
   ```

4. **Run tests** to ensure backward compatibility:
   ```bash
   npm test schemas
   npm test validator
   ```

## Version Naming Convention

Schema files follow the naming pattern: `owcs-schema-v{MAJOR}.{MINOR}.{PATCH}.json`

Examples:

- `owcs-schema-v1.0.0.json`
- `owcs-schema-v2.0.0.json`
- `owcs-schema-v2.1.0.json`

## Testing

The schema versioning system includes comprehensive tests:

- **Schema loading tests** - Verify all versions load correctly
- **Version alias tests** - Ensure version aliases work properly
- **Validation tests** - Test validation with different schema versions
- **Extensibility tests** - Verify future versions can be added without breaking changes

Run schema tests:

```bash
npm test -- schemas/index.test.ts
npm test -- api/core/validator.test.ts
```

## API Reference

### `getSchema(version?: SchemaVersion): object`

Returns the schema object for the specified version. Defaults to 'latest'.

### `hasSchema(version: string): boolean`

Checks if a schema version is available.

### `getAvailableVersions(): SchemaVersion[]`

Returns an array of all available schema versions.

### `getLatestSchema(): object`

Returns the latest schema version.

### `OWCSValidator.constructor(version?: SchemaVersion)`

Creates a validator for the specified schema version.

### `OWCSValidator.getSchemaVersion(): SchemaVersion`

Returns the schema version used by the validator.

### `OWCSValidator.getAvailableVersions(): SchemaVersion[]`

Static method that returns all available schema versions.

## Best Practices

1. **Always use semantic versioning** for schema file names
2. **Maintain backward compatibility** when possible
3. **Document breaking changes** in schema updates
4. **Keep 'latest' updated** to the most recent stable version
5. **Add comprehensive tests** for each new version
6. **Update documentation** when adding new versions

## Migration Guide

When upgrading specifications to a new schema version:

1. Validate your spec against the current version
2. Review the changelog for the new version
3. Update your spec to meet new requirements
4. Validate against the new version
5. Update your code to use the new version explicitly if needed

## Schema Version History

### v1.0.0 (Initial Release)

- Basic OWCS specification structure
- Web component definitions
- Props and events schemas
- Runtime configuration support
