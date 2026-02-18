# OWCS Viewer Demo

Interactive demonstration of the OWCS Viewer web component.

## Running the Demo

```bash
# From the root of the monorepo
cd apps/owcs-viewer-demo
npm run dev
```

This will start a development server at http://localhost:3000

## Features Demonstrated

- **Loading YAML**: Shows how to load OWCS YAML content
- **URL Loading**: Demonstrates loading from URLs
- **Interactive UI**: Search, accordion, and TypeScript code display
- **Real-time Updates**: Dynamic YAML content updates

## Usage Example

The demo shows how to use the `<owcs-viewer>` web component:

```html
<owcs-viewer yaml="..."></owcs-viewer>
<!-- or -->
<owcs-viewer yaml-url="https://example.com/spec.yaml"></owcs-viewer>
```

## Building

```bash
npm run build
```

## Preview Built Version

```bash
npm run preview
```
