# Developer Guide

This guide covers advanced usage, API details, and development setup for OWCS contributors and power users.

## Development Setup

```bash
# Clone and setup the project
git clone <repository-url>
cd OWCS
npm install
npm run build
```

## Architecture Deep Dive

### Core Components

The library is built with a modular architecture:

```
src/
├── cli/                    # Command-line interface
├── api/                    # Program interface
  ├── core/                   # Core functionality (AST, schema building)
  ├── adapters/               # Framework-specific adapters
  ├── model/                  # TypeScript type definitions
  └── openapi/                # OpenAPI conversion
```

### Data Flow

```
┌─────────────────────┐
│  Angular Source     │
│  (.ts files)        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  AngularAdapter     │  ← TypeScript Compiler API
│  - Discovery        │  ← Finds customElements.define()
│  - Props Extractor  │  ← Analyzes @Input()
│  - Events Extractor │  ← Analyzes @Output() & dispatchEvent
│  - Federation       │  ← Parses webpack config
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ IntermediateModel   │  ← Framework-agnostic
│  - Components       │
│  - Props            │
│  - Events           │
│  - Runtime Config   │
└──────────┬──────────┘
           │
           ├────────────┬────────────┐
           ▼            ▼            ▼
      ┌────────┐  ┌────────┐  ┌──────────┐
      │  YAML  │  │  JSON  │  │ OpenAPI  │
      └────────┘  └────────┘  └──────────┘
```

### Intermediate Component Model

The ICM provides a framework-agnostic representation:

```typescript
interface IntermediateModel {
  runtime: RuntimeModel; // Build/federation config
  components: WebComponentModel[]; // Component definitions
}

interface WebComponentModel {
  tagName: string; // HTML tag name
  className: string; // TypeScript class name
  modulePath: string; // File path
  props: PropModel[]; // Input properties
  events: EventModel[]; // Output events
}
```

## API Reference

### Core Functions

```typescript
// Main analysis function
analyzeAngularProject(
  projectRoot: string,
  tsConfigPath?: string
): IntermediateModel

// Build OWCS specification
buildOWCSSpec(
  model: IntermediateModel,
  info?: SpecInfo
): OWCSSpec

// Write to file
writeOWCSSpec(
  spec: OWCSSpec,
  filePath: string,
  format: 'yaml' | 'json'
): void

// Convert to OpenAPI
convertToOpenAPI(spec: OWCSSpec): OpenAPISpec

// Validation
validateOWCSSpec(spec: OWCSSpec): ValidationResult
validateOWCSFile(filePath: string): ValidationResult
```

### Angular Adapter

```typescript
import { AngularAdapter } from 'owcs';

const adapter = new AngularAdapter('./project-root');
const model = adapter.analyze();

// Advanced usage with TypeScript config
const modelWithConfig = adapter.analyze('./tsconfig.app.json');
```

### React Adapter

The React adapter supports both class and function components, with full TypeScript support.

```typescript
import { ReactAdapter } from 'owcs';

const adapter = new ReactAdapter('./project-root');
const model = adapter.analyze();

// Advanced usage with TypeScript config
const modelWithConfig = new ReactAdapter('./project-root', './tsconfig.json').analyze();
```

#### Supported Features

**Props Extraction:**

- Function components with inline types or type references
- Class components with type parameters
- Union types (for enums)
- Object types (nested structures)
- Array types
- Optional props (`?`)

**Events Extraction:**

- Callback props (onClick, onHover, etc.)
- CustomEvent dispatch calls
- Event payload type inference

**Bundler Support:**

- Webpack with Module Federation
- Vite with Module Federation
- Automatic detection from config files

The OWCS analyzer will extract:

- Props: name (string, required), age (number, optional), theme (enum)
- Events: click, userClick
- Module path and registration details

## Testing

```bash
# Run all tests
npm test

# Run with UI
npm run test:ui

# Coverage report
npm run test:coverage

# Run specific test file
npm test -- component-discovery.test.ts
```

## Adding Framework Support

To add support for a new framework (e.g., React, Vue):

1. **Create adapter directory**: `src/adapters/react/`
2. **Implement base adapter**: Extend or implement adapter interface
3. **Add framework-specific extractors**: Props, events, registration
4. **Add tests**: Test against real framework code
5. **Update exports**: Add to main index.ts

Example structure:

```
src/adapters/react/
├── index.ts              # Main adapter
├── component-discovery.ts # Find React components
├── props-extractor.ts     # Extract props from TypeScript
├── events-extractor.ts    # Extract event handlers
└── *.test.ts             # Tests
```

## Troubleshooting

### Common Issues

**"Cannot find customElements.define"**

- Ensure your components register as web components
- Check that customElements.define() calls are in the analyzed files

**"TypeScript parsing errors"**

- Verify tsconfig.json is valid
- Check that all imported modules are available
- Use `--tsconfig` flag to specify correct config

**"Module federation not detected"**

- Ensure webpack.config.js exists in project root
- Verify ModuleFederationPlugin configuration is valid
- Check that exposes paths match component locations

## Performance

- **AST parsing**: Uses TypeScript Compiler API for accuracy
- **Memory usage**: Processes files incrementally
- **Large projects**: Consider using `include/exclude` patterns in tsconfig.json

## Schema Validation

OWCS uses JSON Schema for validation:

```typescript
import { getSchema, OWCSValidator } from 'owcs/schemas';

// Get schema for specific version
const schema = getSchema('1.0.0');

// Create validator
const validator = new OWCSValidator('1.0.0');
const result = validator.validate(spec);
```

### Module Structure

```

src/
├── cli/ # Command-line interface
│ └── index.ts # Commands: generate, validate, info
│
├── api/ # Program interface
│ ├── core/ # Core functionality
│ │ ├── ast-walker.ts # Generic AST utilities
│ │ ├── schema-builder.ts # IntermediateModel → OWCSSpec
│ │ ├── yaml-writer.ts # Output formatting
│ │ └── validator.ts # JSON Schema validation
│ │
│ ├── adapters/ # Framework adapters
│ │ └── angular/
│ │ ├── index.ts # Main adapter class
│ │ ├── component-discovery.ts # Find components
│ │ ├── props-extractor.ts # Extract @Input()
│ │ ├── events-extractor.ts # Extract @Output()
│ │ └── federation-extractor.ts # Parse webpack config
│ │
│ ├── model/ # Type definitions
│ │ └── intermediate.ts # All interfaces & types
│ │
│ ├── openapi/ # OpenAPI conversion
│   └── converter.ts # OWCS → OpenAPI 3.1
│
└── schemas /# Json Schema
  └── owcs.schema.json # JSON Schema for validation

```

## API Documentation

### Core Functions

#### `analyzeAngularProject(projectRoot, tsConfigPath?)`

Analyzes an Angular project and returns IntermediateModel.

```typescript
const model = analyzeAngularProject('./my-project');
// Returns: IntermediateModel with components, props, events, runtime
```

#### `buildOWCSSpec(model, info?)`

Converts IntermediateModel to OWCSSpec.

```typescript
const spec = buildOWCSSpec(model, {
  title: 'My Components',
  version: '1.0.0',
  description: 'Optional description',
});
```

#### `writeOWCSSpec(spec, filePath, format)`

Writes OWCS specification to a file.

```typescript
writeOWCSSpec(spec, 'owcs.yaml', 'yaml');
writeOWCSSpec(spec, 'owcs.json', 'json');
```

#### `convertToOpenAPI(owcsSpec)`

Converts OWCS spec to OpenAPI 3.1 format.

```typescript
const openApiSpec = convertToOpenAPI(owcsSpec);
// Returns Swagger-compatible OpenAPI specification
```

#### `validateOWCSSpec(spec)` / `validateOWCSFile(filePath)`

Validates OWCS specifications.

```typescript
const result = validateOWCSSpec(spec);
if (!result.valid) {
  console.error(result.errors);
}
```

### Classes

#### `AngularAdapter`

Main adapter for Angular projects.

```typescript
const adapter = new AngularAdapter('./project-root', './tsconfig.json');
const model = adapter.analyze();
```

#### `SchemaBuilder`

Builds OWCS specifications from intermediate models.

```typescript
const builder = new SchemaBuilder();
const spec = builder.build(model, { title: 'My Spec' });
```

#### `YAMLWriter`

Handles output formatting.

```typescript
const writer = new YAMLWriter();
writer.writeToFile(spec, 'owcs.yaml', 'yaml');
```

#### `OpenAPIConverter`

Converts OWCS to OpenAPI.

```typescript
const converter = new OpenAPIConverter();
const openApi = converter.convert(owcsSpec);
```

## Examples

### Example 1: Basic Component

**Input** (`user-card.component.ts`):

```typescript
@Component({ selector: 'app-user-card', ... })
export class UserCardComponent {
  @Input() name!: string;
  @Input() age?: number;
  @Output() clicked = new EventEmitter<{time: number}>();
}

customElements.define('user-card', UserCardComponent);
```

**Output** (OWCS YAML):

```yaml
owcs: 1.0.0
components:
  webComponents:
    user-card:
      tagName: user-card
      props:
        schema:
          type: object
          properties:
            name: { type: string }
            age: { type: number }
          required: [name]
      events:
        clicked:
          type: EventEmitter
          payload:
            type: object
            properties:
              time: { type: number }
```

### Example 2: With Module Federation

**webpack.config.js**:

```javascript
new ModuleFederationPlugin({
  name: 'userComponents',
  exposes: {
    './UserCard': './src/user-card.component.ts',
  },
});
```

**Output**:

```yaml
runtime:
  bundler:
    name: webpack
    moduleFederation:
      remoteName: userComponents
      exposes:
        ./UserCard: ./src/user-card.component.ts
components:
  webComponents:
    user-card:
      tagName: user-card
      module: ./UserCard # ← Mapped from exposes
```

### Example 3: Complex Types

```typescript
@Input() config?: {
  theme: 'light' | 'dark';
  options: string[];
};
```

**Converts to**:

```yaml
config:
  type: object
  properties:
    theme:
      type: string
      enum: [light, dark]
    options:
      type: array
      items: { type: string }
```

## Testing

### Manual Testing

```bash
# 1. Generate from examples
node dist/cli/index.js generate -p examples/angular

# 2. Validate
node dist/cli/index.js validate owcs.yaml

# 3. Show info
node dist/cli/index.js info owcs.yaml

# 4. Programmatic usage
npx ts-node examples/programmatic-usage.ts
```

## Advanced Features

### Custom Type Conversion

The library handles complex TypeScript types:

- **Primitives**: `string`, `number`, `boolean`
- **Arrays**: `Array<T>`, `T[]`
- **Objects**: Interfaces, type literals
- **Unions**: `A | B` → `oneOf`
- **Literals**: `'red' | 'blue'` → `enum`
- **Optionals**: `prop?` → not in `required`
- **Nested**: Deep object structures

### Multiple Event Patterns

Supports both Angular and native patterns:

```typescript
// Angular Output
@Output() changed = new EventEmitter<Data>();

// Native CustomEvent
this.dispatchEvent(new CustomEvent('changed', {
  detail: { ... }
}));
```

Both are extracted and included in the spec.

### Federation Auto-Mapping

Automatically maps components to exposed modules:

```javascript
exposes: {
  './MyComponent': './src/my.component.ts'
}
```

→ Component gets `module: './MyComponent'`

## Troubleshooting

### Component Not Found

- Ensure `customElements.define()` is called
- Check that class is exported
- Verify file is included in tsconfig

### Props Missing

- Use `@Input()` decorator (not just properties)
- Enable decorators in tsconfig:
  ```json
  {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
  ```

### Federation Not Detected

- Ensure webpack.config.js exists
- Check ModuleFederationPlugin syntax
- Verify file is in project root or config/

### Build Errors

```bash
# Clean and rebuild
rm -rf dist/ node_modules/
npm install
npm run build
```

## Performance

The library is optimized for:

- Large codebases (100+ components)
- Complex type hierarchies
- Multiple files and imports
- Fast incremental analysis

Typical performance:

- Small project (1-10 components): < 1 second
- Medium project (10-50 components): 1-3 seconds
- Large project (50+ components): 3-10 seconds

## Future Enhancements

Potential additions:

- [ ] React adapter
- [ ] Vue adapter
- [ ] Template parsing
- [ ] Slot/content projection
- [ ] CSS custom properties
- [ ] Visual documentation
- [ ] Watch mode
- [ ] VS Code extension

## Contributing

The architecture is designed for extensibility:

1. **New Adapters**: Create `src/adapters/<framework>/`
2. **Enhanced Extraction**: Improve existing extractors
3. **Better Schemas**: Enhance type conversion
4. **More Outputs**: Add new output formats

## License

MIT

---

**Ready to analyze Angular components and generate OWCS specifications!** 🚀
