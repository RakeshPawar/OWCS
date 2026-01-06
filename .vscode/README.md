# OWCS Project Configuration for VS Code

## Files Created

### 1. `.vscode/launch.json`
Debug configurations for running and debugging the OWCS library:
- **Debug CLI**: Run the CLI with default example file
- **Debug CLI (Custom Args)**: Run with custom component path and output
- **Debug Programmatic Usage**: Debug the programmatic API example
- **Debug Current TypeScript File**: Debug any currently open TS file
- **Attach to Process**: Attach debugger to a running Node.js process

### 2. `.vscode/tasks.json`
Build automation tasks:
- **npm: build**: Default build task using TypeScript compiler
- **npm: dev**: Watch mode for continuous compilation
- **Build and Run CLI on Current File**: Quick test execution
- **Build TypeScript**: Manual build trigger

## Usage

### Debugging

1. **Quick Debug**: Press `F5` to start debugging with the default configuration
2. **Select Configuration**: Click the debug icon in the sidebar, select a configuration from the dropdown, then press `F5`
3. **Breakpoints**: Click in the gutter next to line numbers to set breakpoints
4. **Debug Console**: Use the debug console to evaluate expressions during debugging

### Building

- Press `Cmd+Shift+B` (Mac) or `Ctrl+Shift+B` (Windows/Linux) to run the default build task
- Or open the command palette (`Cmd+Shift+P`) and type "Tasks: Run Task"

### Source Maps

The project is configured with source maps enabled (`"sourceMap": true` in tsconfig.json), allowing you to debug TypeScript files directly.
