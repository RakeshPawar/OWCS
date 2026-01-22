# Example Usage and Output

This document shows what to expect when using OWCS with a real Angular component.

## Example Component

Here's a sample Angular component ([user-card.component.ts](angular/src/user-card.component.ts)):

```typescript
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-user-card',
  template: `
    <div class="user-card">
      <h3>{{ name }}</h3>
      <p>Age: {{ age }}</p>
      <button (click)="onClick()">Click me</button>
    </div>
  `,
})
export class UserCardComponent {
  @Input() name!: string;
  @Input() age?: number;
  @Input() email?: string;
  @Input() config?: {
    theme: 'light' | 'dark';
    showAvatar: boolean;
  };

  @Output() clicked = new EventEmitter<{ timestamp: number }>();
  @Output() userUpdated = new EventEmitter<{ name: string; age: number }>();

  onClick() {
    this.clicked.emit({ timestamp: Date.now() });
  }
}

// Register as web component
customElements.define('user-card', UserCardComponent);
```

## Generated Specification

Running OWCS on this component:

```bash
npx owcs generate --adapter angular --project examples/angular --format yaml --title "User Components"
```

Produces this `owcs.yaml`:

```yaml
owcs: 1.0.0
info:
  title: User Components
  version: 1.0.0
components:
  webComponents:
    user-card:
      tagName: user-card
      props:
        schema:
          type: object
          properties:
            name:
              type: string
            age:
              type: number
            email:
              type: string
            config:
              type: object
              properties:
                theme:
                  type: string
                  enum: [light, dark]
                showAvatar:
                  type: boolean
          required: [name]
      events:
        clicked:
          type: EventEmitter
          payload:
            type: object
            properties:
              timestamp:
                type: number
        userUpdated:
          type: EventEmitter
          payload:
            type: object
            properties:
              name:
                type: string
              age:
                type: number
```

## Usage Examples

### Basic Generation

```bash
# Generate specification for Angular
npx owcs generate --adapter angular

# Generate specification for React
npx owcs generate --adapter react

# Generate with custom title
npx owcs generate --adapter angular --title "My Components" --version "2.0.0"

# Generate JSON format
npx owcs generate --format json --output components.json
```

### With OpenAPI

```bash
# Generate both OWCS and OpenAPI specs
npx owcs generate --openapi
```

This creates two files:

- `owcs.yaml` - The OWCS specification
- `openapi.yaml` - OpenAPI 3.1 specification for integration

### Validation

```bash
# Validate the generated spec
npx owcs validate owcs.yaml

# View specification details
npx owcs info owcs.yaml
```

## Expected OpenAPI Output

When using `--openapi`, you'll also get an OpenAPI specification:

```yaml
openapi: 3.1.0
info:
  title: User Components
  version: 1.0.0
paths:
  /components/user-card:
    post:
      summary: User Card Component
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  type: string
                age:
                  type: number
                email:
                  type: string
                config:
                  type: object
                  properties:
                    theme:
                      type: string
                      enum: [light, dark]
                    showAvatar:
                      type: boolean
              required: [name]
      callbacks:
        clicked:
          '{$request.body#/callbackUrl}':
            post:
              requestBody:
                content:
                  application/json:
                    schema:
                      type: object
                      properties:
                        timestamp:
                          type: number
```

## Try It Yourself

1. **Install OWCS**: `npm install owcs`
2. **Create a component**: Use the example above or your own
3. **Generate spec**: `npx owcs generate`
4. **Validate**: `npx owcs validate owcs.yaml`
5. **Explore**: `npx owcs info owcs.yaml`
