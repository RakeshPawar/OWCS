# OWCS - Open Web Component Specification

Generate standardized specifications for your web components automatically. OWCS analyzes your Angular and React components and creates documentation and configuration files that help you share and use components across projects.

## What is OWCS?

OWCS creates detailed specifications from your existing web components, including:

- **Component properties** (inputs/props) with types and validation
- **Events** (outputs/callbacks) that components emit
- **Module federation** configuration for micro-frontends
- **OpenAPI documentation** for integration
- **Support for multiple frameworks**: Angular, React (with more coming)

## Installation

```bash
npm install owcs
```

## Requirements

- Node.js 18+
- TypeScript project with Angular or React components

## Quick Start

### Angular Projects

**Generate a specification from your Angular project:**

```bash
npx owcs generate --adapter angular
```

### React Projects

**Generate a specification from your React project:**

```bash
npx owcs generate --adapter react
```

This creates an `owcs.yaml` file describing your components.

**Common options:**

```bash
# Generate JSON instead of YAML
npx owcs generate --adapter react --format json

# Specify output file
npx owcs generate --adapter angular --output my-components.yaml

# Also create OpenAPI documentation
npx owcs generate --adapter react --openapi

# Validate an existing specification
npx owcs validate owcs.yaml
```

## Using in Code

If you need to generate specifications programmatically:

### Angular

```typescript
import { analyzeAngularProject, buildOWCSSpec, writeOWCSSpec } from 'owcs';

// Analyze your Angular project
const analysis = analyzeAngularProject('./src');

// Create specification
const spec = buildOWCSSpec(analysis, {
  title: 'My Angular Components',
  version: '1.0.0',
});

// Save to file
writeOWCSSpec(spec, 'owcs.yaml', 'yaml');
```

### React

```typescript
import { analyzeReactProject, buildOWCSSpec, writeOWCSSpec } from 'owcs';

// Analyze your React project
const analysis = analyzeReactProject('./src');

// Create specification
const spec = buildOWCSSpec(analysis, {
  title: 'My React Components',
  version: '1.0.0',
});

// Save to file
writeOWCSSpec(spec, 'owcs.yaml', 'yaml');
```

## What Gets Analyzed

### Angular Components

OWCS examines your Angular components and extracts:

#### Component Registration

```typescript
// Finds web component definitions
customElements.define('user-card', UserCardComponent);
```

#### Input Properties

```typescript
@Input() name: string;        // Required string property
@Input() age?: number;        // Optional number property
@Input('userId') id: string;  // Property with custom attribute name
```

#### Output Events

```typescript
@Output() clicked = new EventEmitter<{userId: string}>();

// Also detects custom events
this.dispatchEvent(new CustomEvent('userChanged', {
  detail: { name: 'John', age: 30 }
}));
```

### React Components

OWCS examines your React components wrapped as Web Components:

#### Component Registration

```typescript
customElements.define('user-card', UserCardWC);
```

#### Props

```typescript
interface UserCardProps {
  name: string;           // Required string property
  age?: number;           // Optional number property
  theme: 'light' | 'dark'; // Union type (enum)
  config?: {              // Object type
    showAvatar: boolean;
  };
}

const UserCard: React.FC<UserCardProps> = (props) => {
  return <div>{props.name}</div>;
};
```

#### Events

```typescript
interface UserCardProps {
  onClick?: (event: { userId: string }) => void; // Callback prop
  onHover?: () => void;
}

// Or custom event dispatch
const handleClick = () => {
  const event = new CustomEvent('userClick', {
    detail: { userId: '123' },
  });
  dispatchEvent(event);
};
```

### Module Federation Configuration

```javascript
// Extracts from webpack.config.js
new ModuleFederationPlugin({
  name: 'userComponents',
  exposes: {
    './UserCard': './src/user-card.component.ts',
  },
});
```

## Generated Specification

OWCS creates a YAML file that describes your components:

```yaml
owcs: 1.0.0
info:
  title: My Components
  version: 1.0.0

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
      module: ./UserCard
      props:
        schema:
          type: object
          properties:
            name:
              type: string
            age:
              type: number
          required: [name]
      events:
        clicked:
          type: CustomEvent
          payload:
            type: object
            properties:
              userId:
                type: string
```

## OpenAPI Integration

Convert your component specification to OpenAPI format for API documentation:

```bash
npx owcs generate --openapi
```

This creates both `owcs.yaml` and `openapi.yaml` files, making your components discoverable by API documentation tools like Swagger UI.

## Commands

| Command                | Description                                      |
| ---------------------- | ------------------------------------------------ |
| `owcs generate`        | Generate specification from your Angular project |
| `owcs validate <file>` | Check if a specification file is valid           |
| `owcs info <file>`     | Show details about a specification file          |

### Generate Options

- `-f, --format <format>` - Output format: `yaml` (default) or `json`
- `-o, --output <file>` - Output file path (default: `owcs.yaml`)
- `-p, --project <path>` - Project directory (default: current directory)
- `--title <title>` - Specification title
- `--version <version>` - Specification version
- `--openapi` - Also generate OpenAPI documentation

## Contributing

Want to help improve OWCS? Contributions are welcome! The project is designed to support multiple frameworks:

- **Add framework support** - Create adapters for React, Vue, or other frameworks
- **Enhance Angular support** - Add features like template parsing or CSS custom properties
- **Improve documentation** - Help make the docs even more user-friendly

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

**Note**: This project uses [Conventional Commits](https://www.conventionalcommits.org/) with commitlint to ensure consistent commit messages. Please read [docs/COMMIT_GUIDELINES.md](docs/COMMIT_GUIDELINES.md) before making commits.

## License

MIT License - see [LICENSE](LICENSE) file for details.
