# @owcs/api

Core API for analyzing web components and generating OWCS (Open Web Component Specification) files.

## Overview

This package provides:

- Framework adapters for Angular and React
- Component analysis and property extraction
- Event detection and type inference
- OWCS specification generation
- OpenAPI conversion
- Validation against JSON schemas

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

### Validation

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

- `analyzeAngularProject(projectPath: string, tsconfigPath?: string): AnalysisResult`
- `analyzeReactProject(projectPath: string, tsconfigPath?: string): AnalysisResult`

### Spec Building

- `buildOWCSSpec(analysis: AnalysisResult, metadata: SpecMetadata): OWCSSpec`
- `writeOWCSSpec(spec: OWCSSpec, outputPath: string, format: 'yaml' | 'json'): void`

### Configuration

- `loadConfig(projectPath: string): Promise<OWCSConfig | null>` - Load config from owcs.config.js/json
- `loadConfigSync(projectPath: string): OWCSConfig | null` - Synchronous config loader (JSON only)

### Validation

- `validateOWCSFile(filePath: string, version?: SchemaVersion): Promise<ValidationResult>`
- `validateOWCSSpec(spec: OWCSSpec, version?: SchemaVersion): ValidationResult`

### Conversion

- `convertToOpenAPI(spec: OWCSSpec): OpenAPISpec`

### Adapters

Import specific adapters:

```typescript
// Angular
import { AngularAdapter } from '@owcs/api/adapters/angular';

// React
import { ReactAdapter } from '@owcs/api/adapters/react';
```

## Dependencies

- `@owcs/schemas` - Schema definitions
- `typescript` - TypeScript compiler API
- `ajv` - JSON schema validation
- `js-yaml` - YAML parsing and serialization

## License

MIT
