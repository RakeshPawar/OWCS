# @owcs/api

Core API for analyzing web components and generating OWCS (Open Web Component Specification) files.

## Overview

This package provides:

- **Framework adapters** for Angular and React
- **Component analysis** and property extraction
- **Event detection** and type inference
- **OWCS specification generation** in YAML or JSON
- **OpenAPI conversion** for API documentation
- **Validation** against JSON schemas
- **Configuration file support** (owcs.config.js/json)

## Installation

```bash
pnpm add @owcs/api
```

## Usage

### Angular

```typescript
import { analyzeAngularProject, buildOWCSSpec, writeOWCSSpec } from '@owcs/api';

const analysis = analyzeAngularProject('./src');
const spec = buildOWCSSpec(analysis, {
  title: 'My Components',
  version: '1.0.0',
  extensions: {
    'x-owner': 'platform-team',
    'x-version': '2.0.0',
  },
});
writeOWCSSpec(spec, 'owcs.yaml', 'yaml');
```

### React

```typescript
import { analyzeReactProject, buildOWCSSpec, writeOWCSSpec } from '@owcs/api';

const analysis = analyzeReactProject('./src');
const spec = buildOWCSSpec(analysis, {
  title: 'My Components',
  version: '1.0.0',
  extensions: {
    'x-owner': 'frontend-team',
    'x-git-repo': 'https://github.com/org/repo',
  },
});
writeOWCSSpec(spec, 'owcs.yaml', 'yaml');
```

### Loading Extensions from Config

```typescript
import { loadConfig, analyzeReactProject, buildOWCSSpec } from '@owcs/api';

// Load extensions from owcs.config.js or owcs.config.json
const config = await loadConfig('./my-project');

const analysis = analyzeReactProject('./my-project/src');
const spec = buildOWCSSpec(analysis, {
  title: 'My Components',
  version: '1.0.0',
  extensions: config?.extensions,
});
```

## Configuration File

Create an `owcs.config.js` or `owcs.config.json` file in your project root to define default settings and custom extensions:

```javascript
// owcs.config.js
export default {
  // Specification metadata
  title: 'My Components',
  description: 'A collection of reusable web components',
  version: '2.0.0',

  // Custom vendor extensions (all keys must start with 'x-')
  extensions: {
    'x-owner': 'platform-team',
    'x-team-name': 'Frontend Core',
    'x-git-repo': 'https://github.com/org/repo',
    'x-package-version': '2.0.0',
  },
};
```

Or use JSON format:

```json
{
  "extensions": {
    "x-owner": "platform-team",
    "x-git-repo": "https://github.com/org/repo"
  }
}
```

**Supported formats:** `owcs.config.js`, `owcs.config.mjs`, `owcs.config.cjs`, `owcs.config.json`

**Note:** The `loadConfig()` function searches for the config file in the specified project directory. Pass the project root path as the argument to `loadConfig()`.

All extension keys must start with `x-` and will be included in the generated OWCS specification.

## Validation

```typescript
import { validateOWCSFile, validateOWCSSpec } from '@owcs/api';

// Validate from file
const fileResult = await validateOWCSFile('owcs.yaml');
if (!fileResult.valid) {
  console.error('Validation errors:', fileResult.errors);
}

// Validate spec object
const specResult = validateOWCSSpec(spec);
if (specResult.valid) {
  console.log('Spec is valid!');
}
```

### OpenAPI Conversion

```typescript
import { convertToOpenAPI } from '@owcs/api';

const openApiSpec = convertToOpenAPI(owcsSpec);
// Use with Swagger UI or other OpenAPI tools
```

## API

### Analyzers

- `analyzeAngularProject(projectPath: string, tsconfigPath?: string): AnalysisResult` - Analyze Angular components from a project directory
- `analyzeReactProject(projectPath: string, tsconfigPath?: string): AnalysisResult` - Analyze React components from a project directory

### Spec Building

- `buildOWCSSpec(analysis: AnalysisResult, metadata: SpecMetadata): OWCSSpec` - Build OWCS specification from analysis results
- `writeOWCSSpec(spec: OWCSSpec, outputPath: string, format: 'yaml' | 'json'): void` - Write spec to file

### Configuration

- `loadConfig(projectPath: string): Promise<OWCSConfig | null>` - Load config from owcs.config.js/json (async, supports .js/.mjs/.cjs)
- `loadConfigSync(projectPath: string): OWCSConfig | null` - Synchronous config loader (JSON only)

### Validation

- `validateOWCSFile(filePath: string, version?: SchemaVersion): Promise<ValidationResult>` - Validate OWCS file against JSON schema
- `validateOWCSSpec(spec: OWCSSpec, version?: SchemaVersion): ValidationResult` - Validate OWCS spec object

### Conversion

- `convertToOpenAPI(spec: OWCSSpec): OpenAPISpec` - Convert OWCS specification to OpenAPI format

### Framework Adapters

Import specific adapters for direct use:

```typescript
// Angular
import { AngularAdapter } from '@owcs/api/adapters/angular';

const adapter = new AngularAdapter();
const components = adapter.analyzeProject('./src');

// React
import { ReactAdapter } from '@owcs/api/adapters/react';

const adapter = new ReactAdapter();
const components = adapter.analyzeProject('./src');
```

## What Gets Analyzed

### Angular Components

- **@Input() decorators** - Property types, required/optional status, custom attribute names
- **@Output() decorators** - EventEmitter types and payload schemas
- **Custom elements** - Registration via `customElements.define()`
- **Module federation** - Webpack/Vite configuration for micro-frontends

### React Components

- **Props interfaces** - TypeScript interface definitions for component props
- **Prop types** - String, number, boolean, object, array, union types
- **Callbacks** - Event handler props with typed parameters
- **Custom elements** - Web component wrappers via `customElements.define()`
- **Module federation** - Webpack configuration for shared components

## Dependencies

- `@owcs/schemas` - Schema definitions
- `typescript` - TypeScript compiler API
- `ajv` - JSON schema validation
- `js-yaml` - YAML parsing and serialization

## License

MIT - see [LICENSE](../../LICENSE) for details.
