# @owcs/ui

A web component library for rendering OWCS (Open Web Component Specification) YAML files in a user-friendly, interactive format.

## Features

- 🎨 **Beautiful UI**: Professional, modern design with smooth animations
- 🔍 **Search & Filter**: Quickly find components by tag name
- 📝 **TypeScript Code Generation**: Automatically displays props and events as TypeScript code
- ✅ **Schema Validation**: Built-in OWCS schema validation
- 🌐 **URL Support**: Load YAML from URLs or inline strings
- 📱 **Responsive**: Works on all screen sizes
- ⚡ **Fast**: Built with Lit for optimal performance

## Installation

```bash
pnpm add @owcs/ui
```

Or with npm:

```bash
npm install @owcs/ui
```

## Usage

### Basic Usage

```html
<!DOCTYPE html>
<html>
  <head>
    <script type="module" src="node_modules/@owcs/ui/dist/owcs-viewer.js"></script>
  </head>
  <body>
    <owcs-viewer
      yaml="owcs: 1.0.0
info:
  title: My Components
  version: 1.0.0
components:
  webComponents:
    my-button:
      tagName: my-button
      props:
        schema:
          type: object
          properties:
            label:
              type: string
          required:
            - label
      events:
        click:
          type: CustomEvent"
    ></owcs-viewer>
  </body>
</html>
```

### Load from URL

```html
<owcs-viewer yaml-url="/path/to/owcs.yaml"></owcs-viewer>
```

### Dynamic Updates

```javascript
import '@owcs/ui';

const viewer = document.querySelector('owcs-viewer');

// Update YAML content
viewer.yaml = `owcs: 1.0.0
info:
  title: Updated Components
  ...`;

// Or load from URL
viewer.yamlUrl = 'https://example.com/owcs.yaml';
```

## API

### Properties

| Property   | Type     | Description                   |
| ---------- | -------- | ----------------------------- |
| `yaml`     | `string` | OWCS YAML content as a string |
| `yaml-url` | `string` | URL to fetch OWCS YAML from   |

### Display Features

#### Header Section

- Shows title and description from the YAML
- Displays OWCS version as a popover badge
- Gradient background for visual appeal

#### Extensions

- Displays all custom extensions (properties starting with `x-`)
- Shown as key-value pairs in a grid layout

#### Search Bar

- Real-time filtering of components by tag name
- Sticky positioning for easy access

#### Components List

- Accordion-style display for each web component
- Tag name as the accordion header
- Props displayed as TypeScript interface code
- Events displayed as TypeScript type code
- Syntax-highlighted code blocks

## Tech Stack

- **Lit**: Fast, lightweight web components
- **TypeScript**: Type-safe development
- **Vite**: Fast build tooling (library mode)
- **@owcs/api**: OWCS parsing and validation
- **@owcs/schemas**: OWCS JSON Schema

## Development

### Install Dependencies

```bash
pnpm install
```

### Build

```bash
pnpm run build
```

### Run Demo

```bash
cd apps/owcs-viewer-demo
pnpm run dev
```

## Example Output

When rendering an OWCS specification, the viewer displays:

1. **Header**: Title, description, and OWCS version
2. **Extensions**: Any custom extensions defined in the spec
3. **Search Bar**: Filter components by tag name
4. **Components**: Expandable accordion for each component showing:
   - Component tag name
   - Props as TypeScript interface
   - Events as TypeScript type definition

## License

MIT - see [LICENSE](../../LICENSE) for details.
