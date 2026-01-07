# OWCS Project Structure

```
/Users/rakesh/Personal/work/OWCS/
├── package.json                    # Package configuration
├── tsconfig.json                   # TypeScript configuration
├── README.md                       # Project documentation
├── LICENSE                         # MIT License
│
├── src/                           # Source code
│   ├── index.ts                   # Main entry point
│   │
│   ├── cli/                       # CLI implementation
│   │   └── index.ts              # Command-line interface
│   │
│   ├── core/                      # Core functionality
│   │   ├── ast-walker.ts         # AST traversal utilities
│   │   ├── schema-builder.ts     # OWCS spec builder
│   │   ├── yaml-writer.ts        # YAML/JSON output
│   │   └── validator.ts          # Spec validation
│   │
│   ├── adapters/                  # Framework adapters
│   │   └── angular/              # Angular adapter
│   │       ├── index.ts          # Main Angular adapter
│   │       ├── component-discovery.ts  # Find components
│   │       ├── props-extractor.ts      # Extract @Input()
│   │       ├── events-extractor.ts     # Extract @Output()
│   │       └── federation-extractor.ts # Webpack config
│   │
│   ├── model/                     # Type definitions
│   │   └── intermediate.ts       # Intermediate model types
│   │
│   ├── openapi/                   # OpenAPI conversion
│   │   └── converter.ts          # OWCS → OpenAPI
│   │
│   └── owcs.schema.json          # OWCS JSON Schema
│
├── examples/                      # Usage examples
│   ├── angular/                  # Angular examples
│   │   └── user-card.component.ts
│   ├── webpack.config.js         # Sample webpack config
│   ├── programmatic-usage.ts     # Programmatic example
│   └── EXAMPLE_OUTPUT.md         # Expected outputs
│
└── dist/                          # Compiled output (generated)
    ├── cli/
    ├── core/
    ├── adapters/
    ├── model/
    └── openapi/
```

## Key Files

### Core Implementation

- **src/index.ts**: Main library entry point, exports all public APIs
- **src/cli/index.ts**: CLI with commands: generate, validate, info
- **src/core/ast-walker.ts**: Generic AST utilities using TypeScript Compiler API
- **src/core/schema-builder.ts**: Converts IntermediateModel to OWCSSpec
- **src/core/yaml-writer.ts**: Handles YAML/JSON serialization
- **src/core/validator.ts**: Validates specs against JSON Schema

### Angular Adapter

- **component-discovery.ts**: Finds `customElements.define()` calls
- **props-extractor.ts**: Extracts `@Input()` decorators, converts TS types to JSON Schema
- **events-extractor.ts**: Extracts `@Output()` and `dispatchEvent()` calls
- **federation-extractor.ts**: Parses webpack ModuleFederationPlugin config

### Models

- **intermediate.ts**: Defines IntermediateModel, WebComponentModel, PropModel, EventModel, etc.

### OpenAPI

- **converter.ts**: Converts OWCS specs to OpenAPI 3.1 format

### Schema

- **owcs.schema.json**: JSON Schema for validating OWCS specifications

## Architecture Flow

```
┌─────────────────┐
│ Angular Source  │
│   (.ts files)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ AngularAdapter  │  ← Uses TypeScript Compiler API
│  (AST Analysis) │  ← No regex, pure AST traversal
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Intermediate    │  ← Framework-agnostic representation
│     Model       │  ← Props, Events, Runtime config
└────────┬────────┘
         │
         ├──────────┬──────────┐
         ▼          ▼          ▼
    ┌────────┐ ┌────────┐ ┌─────────┐
    │  YAML  │ │  JSON  │ │ OpenAPI │
    └────────┘ └────────┘ └─────────┘
```

## CLI Commands

```bash
# Generate OWCS spec
npx owcs generate [options]
  -f, --format <format>    yaml or json (default: yaml)
  -o, --output <file>      Output file path
  -p, --project <path>     Project root
  -t, --tsconfig <path>    tsconfig.json path
  --title <title>          Spec title
  --version <version>      Spec version
  --openapi                Generate OpenAPI too

# Validate spec
npx owcs validate <file>

# Show spec info
npx owcs info <file>
```

## Adding New Adapters

To add support for a new framework:

1. Create `src/adapters/<framework>/` directory
2. Implement adapter class:
   ```typescript
   export class ReactAdapter {
     analyze(): IntermediateModel { ... }
   }
   ```
3. Export from `src/adapters/<framework>/index.ts`
4. Add CLI option for framework selection

The IntermediateModel ensures all adapters produce consistent output.
