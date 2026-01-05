# Quick Start Guide

## Installation

```bash
npm install
npm run build
```

## Running Examples

### 1. CLI Usage

```bash
# Generate from Angular example
node dist/cli/index.js generate \
  -p examples/angular \
  --format yaml \
  --output examples/output/owcs.yaml \
  --title "User Components" \
  --openapi

# Validate generated spec
node dist/cli/index.js validate examples/output/owcs.yaml

# Show spec info
node dist/cli/index.js info examples/output/owcs.yaml
```

### 2. Programmatic Usage

```bash
# Run the example script
npx ts-node examples/programmatic-usage.ts
```

## What Gets Analyzed

The library analyzes:

### ✅ Component Registration
```typescript
customElements.define('user-card', UserCardComponent);
```

### ✅ Props (@Input)
```typescript
@Input() name!: string;           // Required
@Input() age?: number;            // Optional
@Input('data-id') id: string;     // With alias
```

### ✅ Events (@Output + dispatchEvent)
```typescript
@Output() clicked = new EventEmitter<Data>();
this.dispatchEvent(new CustomEvent('changed', { detail: {...} }));
```

### ✅ Module Federation
```javascript
new ModuleFederationPlugin({
  name: 'myRemote',
  exposes: { './Component': './path' }
})
```

### ✅ Type Conversion
TypeScript types → JSON Schema:
- `string` → `{ type: 'string' }`
- `number` → `{ type: 'number' }`
- `boolean` → `{ type: 'boolean' }`
- `Array<T>` → `{ type: 'array', items: {...} }`
- Interfaces → `{ type: 'object', properties: {...} }`
- Union types → `{ oneOf: [...] }`
- Literal types → `{ enum: [...] }`

## Output Formats

### YAML (Default)
```yaml
owcs: 1.0.0
info:
  title: My Components
components:
  webComponents:
    my-component:
      tagName: my-component
      props:
        schema:
          type: object
```

### JSON
```json
{
  "owcs": "1.0.0",
  "info": { "title": "My Components" },
  "components": {
    "webComponents": {
      "my-component": { ... }
    }
  }
}
```

### OpenAPI 3.1
```yaml
openapi: 3.1.0
paths:
  /components/my-component:
    post:
      requestBody:
        content:
          application/json:
            schema: { ... }
```

## Testing Your Project

1. Create an Angular component that uses `customElements.define()`
2. Add `@Input()` and `@Output()` decorators
3. Run OWCS:
   ```bash
   npx owcs generate -p /path/to/your/project
   ```
4. Check the generated `owcs.yaml`

## Common Issues

### Component not found?
- Ensure `customElements.define()` is called
- Check that the class is exported
- Verify tsconfig.json includes the file

### Props not extracted?
- Use `@Input()` decorator (not just public properties)
- Ensure decorators are enabled in tsconfig

### Events missing?
- Use `@Output()` with `EventEmitter`
- Or use `this.dispatchEvent(new CustomEvent(...))`

### Federation config not found?
- Ensure webpack.config.js exists
- Check ModuleFederationPlugin is configured
- Verify exposes paths match component files

## Next Steps

1. **Extend the adapter**: Add support for more Angular patterns
2. **Create new adapters**: Build React, Vue, or Svelte adapters
3. **Enhance schemas**: Add more JSON Schema features
4. **Add validation**: Implement runtime validation from specs
5. **Generate docs**: Create visual documentation from OWCS specs
