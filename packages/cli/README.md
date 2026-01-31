# @owcs/cli

Command-line interface for generating and validating OWCS (Open Web Component Specification) files.

## Overview

This is the main package published to npm. It bundles `@owcs/api` and `@owcs/schemas` for simplified installation and usage.

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
owcs generate --adapter angular

# React project
owcs generate --adapter react

# Custom options
owcs generate --adapter react \
  --format json \
  --output my-spec.json \
  --title "My Components" \
  --version "2.0.0"

# With OpenAPI output
owcs generate --adapter angular --openapi
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
owcs generate --adapter angular
```

Analyzes your Angular components and creates `owcs.yaml` describing:

- Component registrations
- Input properties with types
- Output events
- Module federation config

### React with Module Federation

```bash
owcs generate \
  --adapter react \
  --project ./src \
  --format json \
  --title "Shared Components" \
  --openapi
```

Creates both `owcs.json` and `openapi.json` for your React components.

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
