# @owcs/cli

Command-line interface for generating and validating OWCS (Open Web Component Specification) files.

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

## Usage

### Generate Specification

```bash
# Angular project
npx @owcs/cli generate --adapter angular

# React project
npx @owcs/cli generate --adapter react

# Custom options
npx @owcs/cli generate --adapter react \
  --format json \
  --output my-spec.json \
  --title "My Components" \
  --version "2.0.0"

# With OpenAPI output
npx @owcs/cli generate --adapter angular --openapi
```

### Validate Specification

```bash
owcs validate owcs.yaml
```

### Show Info

```bash
owcs info owcs.yaml
```

## Commands

### `generate`

Generate OWCS specification from source code.

**Options:**

- `-a, --adapter <adapter>` - Framework adapter: `angular` or `react` (required)
- `-f, --format <format>` - Output format: `yaml` (default) or `json`
- `-o, --output <file>` - Output file path (default: `owcs.yaml`)
- `-p, --project <path>` - Project root path (default: current directory)
- `-t, --tsconfig <path>` - Path to tsconfig.json
- `--title <title>` - Specification title
- `--version <version>` - Specification version (default: `1.0.0`)
- `--description <description>` - Specification description
- `--openapi` - Also generate OpenAPI specification

### `validate`

Validate an OWCS specification file.

**Arguments:**

- `<file>` - Path to OWCS specification file

### `info`

Display information about an OWCS specification.

**Arguments:**

- `<file>` - Path to OWCS specification file

## Examples

### Basic Angular Component Analysis

```bash
npx @owcs/cli generate --adapter angular
```

Analyzes your Angular components and creates `owcs.yaml` describing:

- Component registrations
- Input properties with types
- Output events
- Module federation config

### React with Module Federation

```bash
npx @owcs/cli generate \
  --adapter react \
  --project ./src \
  --format json \
  --title "Shared Components" \
  --openapi
```

Creates both `owcs.json` and `openapi.json` for your React components.

### Using Vendor Extensions

Create an `owcs.config.js` file in your project:

```javascript
export default {
  extensions: {
    'x-owner': 'platform-team',
    'x-package-version': '2.0.0',
    'x-team-name': 'Frontend Core',
    'x-git-repo': 'https://github.com/org/repo',
  },
};
```

Or use JSON format (`owcs.config.json`):

```json
{
  "extensions": {
    "x-owner": "platform-team",
    "x-package-version": "2.0.0",
    "x-team-name": "Frontend Core",
    "x-git-repo": "https://github.com/org/repo"
  }
}
```

The extensions will be automatically loaded from your config file when you run:

```bash
npx @owcs/cli generate --adapter angular
```

All extension keys must start with `x-`. The extensions will be added to the root level of your OWCS specification and preserved when converting to OpenAPI.

## Configuration File

You can create an `owcs.config.js` or `owcs.config.json` file to set defaults for all CLI options. CLI arguments always override config values.

```javascript
// owcs.config.js
export default {
  // Specification metadata
  title: 'My Components',
  description: 'A collection of reusable web components',
  version: '2.0.0',

  // Build options
  adapter: 'react', // 'angular' or 'react'
  format: 'yaml', // 'yaml' or 'json'
  outputPath: './dist/owcs.yaml',
  projectRoot: './src',
  includeRuntimeExtension: true,

  // Custom vendor extensions (all keys must start with 'x-')
  extensions: {
    'x-owner': 'platform-team',
    'x-team-name': 'Frontend Core',
    'x-git-repo': 'https://github.com/org/repo',
  },
};
```

Or use JSON format (`owcs.config.json`):

```json
{
  "extensions": {
    "x-owner": "platform-team",
    "x-package-version": "2.0.0",
    "x-team-name": "Frontend Core",
    "x-git-repo": "https://github.com/org/repo"
  }
}
```

**With a config file, you can run:**

```bash
# Use all config defaults
npx @owcs/cli generate

# Override specific options
npx @owcs/cli generate --title "Custom Title" --format json
```

**Supported config formats:** `owcs.config.js`, `owcs.config.mjs`, `owcs.config.cjs`, `owcs.config.json`

**Note:** The CLI looks for the config file in the project root directory (specified by the `-p, --project` option or the current working directory by default).

**Note:** `includeRuntimeExtension` and `extensions` options are only available via the config file. They are automatically applied when present in your config.

## What Gets Analyzed

### Angular

- `@Input()` decorators with types and custom attribute names
- `@Output()` decorators and EventEmitters with payload types
- Custom element definitions via `customElements.define()`
- Module federation configuration from webpack config

#### Example Angular Component

```typescript
export class UserCardComponent {
  @Input() name: string; // Required string property
  @Input() age?: number; // Optional number property
  @Input('userId') id: string; // Property with custom attribute name

  @Output() clicked = new EventEmitter<{ userId: string }>();
}

// Registration
customElements.define('user-card', UserCardComponent);
```

### React

- Component props and TypeScript interfaces
- Event handlers and callbacks with types
- Custom element wrappings via `customElements.define()`
- Webpack module federation config

#### Example React Component

```typescript
interface UserCardProps {
  name: string;           // Required string property
  age?: number;           // Optional number property
  theme: 'light' | 'dark'; // Union type (enum)
  onClick?: (event: { userId: string }) => void; // Callback prop
}

const UserCard: React.FC<UserCardProps> = (props) => {
  return <div>{props.name}</div>;
};

// Registration
customElements.define('user-card', UserCardWC);
```

## Bundled Dependencies

This CLI package includes:

- Core analysis engine from `@owcs/api`
- JSON schemas from `@owcs/schemas`
- All necessary TypeScript analysis tools

No additional dependencies are required to analyze your components.

## License

MIT - see [LICENSE](../../LICENSE) for details.
