# @owcs/cli

Command-line interface for generating and validating OWCS (Open Web Component Specification) files.

## Installation

```bash
pnpm add -g @owcs/cli
```

Or use with npx:

```bash
npx @owcs/cli generate --adapter angular
```

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
  --version "2.0.0" \
  --include-runtime-extension

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
- `-r, --include-runtime-extension` - Include x-owcs-runtime extension with bundler metadata
- `--extensions` - Load vendor extensions from config file (owcs.config.js or owcs.config.json)
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
  --extensions \
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

Then generate with extensions:

```bash
npx @owcs/cli generate --adapter angular --extensions
```

All extension keys must start with `x-`. The extensions will be added to the root level of your OWCS specification and preserved when converting to OpenAPI.

## What Gets Analyzed

### Angular

- `@Input()` decorators
- `@Output()` decorators and EventEmitters
- Custom element definitions
- Module federation configuration

### React

- Component props and TypeScript interfaces
- Event handlers and callbacks
- Custom element wrappings
- Webpack module federation config

## Bundled Dependencies

This package includes:

- Core analysis engine from `@owcs/api`
- JSON schemas from `@owcs/schemas`
- All necessary TypeScript analysis tools

## License

MIT
