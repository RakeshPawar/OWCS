# OWCS - Open Web Component Specification

Generate standardized specifications for your web components automatically. OWCS analyzes your Angular and React components and creates documentation and configuration files that help you share and use components across projects.

## Monorepo Structure

This project is organized as an Nx monorepo with three packages:

- **[@owcs/schemas](packages/schemas)** - JSON Schema definitions and validation utilities
- **[@owcs/api](packages/api)** - Core API for analyzing components and generating specifications
- **[@owcs/cli](packages/cli)** - Command-line interface

## What is OWCS?

OWCS creates detailed specifications from your existing web components, including:

- **Component properties** (inputs/props) with types and validation
- **Events** (outputs/callbacks) that components emit
- **Module federation** configuration for micro-frontends
- **OpenAPI documentation** for integration
- **Support for multiple frameworks**: Angular, React (with more coming)

## Installation

```bash
pnpm add -g @owcs/cli
```

Or use directly with npx:

```bash
npx @owcs/cli generate --adapter angular
```

## Requirements

- Node.js 18+
- TypeScript project with Angular or React components

## Quick Start

### Angular Projects

**Generate a specification from your Angular project:**

```bash
npx @owcs/cli generate --adapter angular
```

### React Projects

**Generate a specification from your React project:**

```bash
npx @owcs/cli generate --adapter react
```

This creates an `owcs.yaml` file describing your components.

**Common options:**

```bash
# Generate JSON instead of YAML
npx @owcs/cli generate --adapter react --format json

# Specify output file
npx @owcs/cli generate --adapter angular --output my-components.yaml

# Also create OpenAPI documentation
npx @owcs/cli generate --adapter react --openapi

# Validate an existing specification
npx @owcs/cli validate owcs.yaml
```

## Using in Code

If you need to generate specifications programmatically, install the API package:

```bash
pnpm add @owcs/api
```

### Angular

```typescript
import { analyzeAngularProject, buildOWCSSpec, writeOWCSSpec } from '@owcs/api';

// Analyze your Angular project
const analysis = analyzeAngularProject('./src');

// Build specification
const spec = buildOWCSSpec(analysis, {
  title: 'My Angular Components',
  version: '1.0.0',
});

// Save to file
writeOWCSSpec(spec, 'owcs.yaml', 'yaml');
```

### React

```typescript
import { analyzeReactProject, buildOWCSSpec, writeOWCSSpec } from '@owcs/api';

// Analyze your React project
const analysis = analyzeReactProject('./src');

// Build specification
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
// Extracted from webpack.config.js
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
npx @owcs/cli generate --openapi
```

This creates both `owcs.yaml` and `openapi.yaml` files, making your components discoverable by API documentation tools like Swagger UI.

## Commands

| Command                | Description                                                 |
| ---------------------- | ----------------------------------------------------------- |
| `owcs generate`        | Generate specification from your project (Angular or React) |
| `owcs validate <file>` | Check if a specification file is valid                      |
| `owcs info <file>`     | Show details about a specification file                     |

### Generate Options

- `-a, --adapter <adapter>` - Framework adapter: `angular` or `react` (required)
- `-f, --format <format>` - Output format: `yaml` (default) or `json`
- `-o, --output <file>` - Output file path (default: `owcs.yaml`)
- `-p, --project <path>` - Project directory (default: current directory)
- `--title <title>` - Specification title
- `--version <version>` - Specification version
- `--openapi` - Also generate OpenAPI documentation

## Development

This project uses [Nx](https://nx.dev) for monorepo management.

### Setup

```bash
# Clone the repository
git clone https://github.com/RakeshPawar/OWCS.git
cd OWCS

# Install dependencies
pnpm install
```

### Build

```bash
# Build all packages
pnpm run build

# Build specific package
npx nx build schemas
npx nx build api
npx nx build cli
```

### Test

```bash
# Run all tests
pnpm test

# Test specific package
npx nx test schemas
npx nx test api
```

### Lint

```bash
# Lint all packages
pnpm run lint

# Lint specific package
npx nx lint api
```

### Package Structure

- `packages/schemas` - JSON Schema definitions
- `packages/api` - Core analysis and spec generation
- `packages/cli` - CLI application (bundled for publishing)
- `apps/*-example` - Example applications for testing
- `tools/` - Build scripts and utilities

### Example Apps

Test the CLI with example applications:

```bash
# Generate specs for examples
npx nx generate-spec angular-example
npx nx generate-spec react-vite-example
npx nx generate-spec react-webpack-example
```

## Contributing

Want to help improve OWCS? Contributions are welcome! The project is designed to support multiple frameworks:

- **Add framework support** - Create adapters for Vue, Svelte, or other frameworks
- **Enhance existing adapters** - Add features like template parsing or CSS custom properties
- **Improve documentation** - Help make the docs even more user-friendly

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

**Note**: This project uses [Conventional Commits](https://www.conventionalcommits.org/) with commitlint to ensure consistent commit messages. Please read [docs/COMMIT_GUIDELINES.md](docs/COMMIT_GUIDELINES.md) before making commits.

## License

MIT License - see [LICENSE](LICENSE) file for details.
