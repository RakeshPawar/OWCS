# OWCS - Open Web Component Specification

A TypeScript library for generating OWCS (Open Web Component Specification) from framework source code using static AST analysis.

## Features

- 🔍 **AST-based Analysis** - Uses TypeScript Compiler API for accurate, regex-free parsing
- 🎯 **Angular Support** - Full support for Angular components with decorators
- 📦 **Module Federation** - Extracts webpack Module Federation configuration
- 📝 **YAML & JSON Output** - Generate specifications in multiple formats
- 🔄 **OpenAPI Conversion** - Convert OWCS specs to OpenAPI 3.1
- ✅ **Validation** - Built-in schema validation
- 🧩 **Extensible** - Adapter-based architecture for multiple frameworks

## Installation

```bash
npm install owcs
```

## Requirements

- **Node.js >= 18.0.0** (ESM-only package)
- TypeScript >= 5.0

## Quick Start

### CLI Usage

Generate OWCS specification from your Angular project:

```bash
# Generate YAML (default)
npx owcs generate

# Generate JSON
npx owcs generate --format json

# Specify output file
npx owcs generate --output my-spec.yaml

# Also generate OpenAPI spec
npx owcs generate --openapi

# Validate a spec
npx owcs validate owcs.yaml

# Show spec info
npx owcs info owcs.yaml
```

### Programmatic Usage

**ESM (ES Modules):**

```typescript
import { analyzeAngularProject, buildOWCSSpec, writeOWCSSpec } from 'owcs';

// Analyze Angular project
const intermediateModel = analyzeAngularProject('./my-project');

// Build OWCS spec
const owcsSpec = buildOWCSSpec(intermediateModel, {
  title: 'My Components',
  version: '1.0.0',
  description: 'Web component library'
});

// Write to file
writeOWCSSpec(owcsSpec, 'owcs.yaml', 'yaml');
```

**Using Angular Adapter:**

```typescript
import { generateAngular } from 'owcs/adapters/angular';

const spec = generateAngular('./my-project', {
  title: 'My Components',
  version: '1.0.0'
});
```

## Architecture

### Intermediate Component Model (ICM)

The library uses an intermediate representation that all adapters produce:

```typescript
interface IntermediateModel {
  runtime: RuntimeModel;
  components: WebComponentModel[];
}

interface WebComponentModel {
  tagName: string;
  className: string;
  modulePath: string;
  props: PropModel[];
  events: EventModel[];
}
```

### Adapter Pattern

Adapters analyze framework-specific code and produce the ICM:

```typescript
import { AngularAdapter } from 'owcs';

// Angular Adapter
const adapter = new AngularAdapter('./project-root');
const model = adapter.analyze();
```

## Angular Support

### Component Discovery

Detects web components via `customElements.define()`:

```typescript
@Component({...})
export class MyComponent {
  @Input() name: string;
  @Output() clicked = new EventEmitter<string>();
}

customElements.define('my-component', MyComponent);
```

### Props Extraction

Extracts `@Input()` decorators with full type information:

```typescript
@Input() title: string;              // Required string
@Input() count?: number;             // Optional number
@Input('data-id') id: string;        // With attribute alias
```

### Events Extraction

Supports both `@Output()` and `dispatchEvent()`:

```typescript
// Angular Output
@Output() changed = new EventEmitter<{value: string}>();

// Native CustomEvent
this.dispatchEvent(new CustomEvent('changed', {
  detail: { value: 'test' }
}));
```

### Module Federation

Automatically extracts webpack Module Federation configuration:

```javascript
new ModuleFederationPlugin({
  name: 'myRemote',
  library: { type: 'module' },
  exposes: {
    './Component': './src/app/my-component'
  }
})
```

## OWCS Output Format

```yaml
owcs: 1.0.0
info:
  title: My Components
  version: 1.0.0
runtime:
  bundler:
    name: webpack
    moduleFederation:
      remoteName: myRemote
      libraryType: module
      exposes:
        ./Component: ./src/app/my-component
components:
  webComponents:
    my-component:
      tagName: my-component
      module: ./Component
      props:
        schema:
          type: object
          properties:
            name:
              type: string
            age:
              type: number
          required:
            - name
      events:
        clicked:
          type: CustomEvent
          payload:
            type: object
            properties:
              value:
                type: string
```

## OpenAPI Conversion

Convert OWCS to OpenAPI 3.1:

```typescript
import { convertToOpenAPI } from 'owcs';

const openApiSpec = convertToOpenAPI(owcsSpec);
```

This generates Swagger-compatible API specifications with:
- Props as request body schemas
- Events as callbacks
- Full JSON Schema support

## CLI Commands

### `owcs generate`

Generate OWCS specification from source code.

Options:
- `-f, --format <format>` - Output format (yaml or json)
- `-o, --output <file>` - Output file path
- `-p, --project <path>` - Project root path
- `-t, --tsconfig <path>` - Path to tsconfig.json
- `--title <title>` - Specification title
- `--version <version>` - Specification version
- `--openapi` - Also generate OpenAPI spec

### `owcs validate`

Validate an OWCS specification file against the schema.

```bash
npx owcs validate owcs.yaml
```

### `owcs info`

Display information about an OWCS specification.

```bash
npx owcs info owcs.yaml
```

## API Reference

### Core Functions

- `analyzeAngularProject(projectRoot, tsConfigPath?)` - Analyze Angular project
- `buildOWCSSpec(model, info?)` - Build OWCS spec from intermediate model
- `writeOWCSSpec(spec, filePath, format)` - Write spec to file
- `convertToOpenAPI(owcsSpec)` - Convert to OpenAPI 3.1

### Classes

- `AngularAdapter` - Angular framework adapter
- `SchemaBuilder` - Builds OWCS spec from ICM
- `YAMLWriter` - Handles YAML/JSON output
- `OpenAPIConverter` - Converts OWCS to OpenAPI

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev
```

## Requirements

- **Node.js >= 18.0.0** (ESM-only package)
- TypeScript >= 5.0

## License

MIT

## Contributing

Contributions welcome! The architecture is designed to be extensible:

1. Create new adapters for other frameworks (React, Vue, etc.)
2. Enhance existing adapters with more features
3. Improve type inference and schema generation

## Roadmap

- [ ] Template parsing support
- [ ] React adapter
- [ ] Vue adapter
- [ ] Slots/content projection support
- [ ] CSS custom properties extraction
- [ ] Enhanced OpenAPI features
- [ ] Visual documentation generator
