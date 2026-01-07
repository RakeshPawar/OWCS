# OWCS Documentation Index

Welcome to the **OWCS (Open Web Component Specification)** library documentation.

## 📚 Documentation Files

### Getting Started

1. **[README.md](README.md)** - Main project documentation
   - Features overview
   - Installation guide
   - Quick start examples
   - CLI commands
   - API reference

2. **[QUICKSTART.md](docs/QUICKSTART.md)** - Quick start guide
   - Installation steps
   - Running examples
   - What gets analyzed
   - Output formats
   - Common issues

3. **[COMPLETE_GUIDE.md](docs/COMPLETE_GUIDE.md)** - Comprehensive guide
   - Full API documentation
   - Architecture details
   - Examples
   - Testing guide
   - Troubleshooting

### Architecture & Design

4. **[STRUCTURE.md](docs/STRUCTURE.md)** - Project structure
   - Directory layout
   - File descriptions
   - Architecture flow
   - Adding new adapters

5. **[IMPLEMENTATION_SUMMARY.md](docs/IMPLEMENTATION_SUMMARY.md)** - Implementation details
   - What was built
   - Technical highlights
   - Statistics
   - Key features

### Examples

6. **[examples/EXAMPLE_OUTPUT.md](examples/EXAMPLE_OUTPUT.md)** - Expected outputs
   - Sample components
   - Generated specifications
   - Testing instructions

7. **[examples/programmatic-usage.ts](examples/programmatic-usage.ts)** - Code examples
   - Programmatic API usage
   - Step-by-step workflow

8. **[examples/angular/user-card.component.ts](examples/angular/user-card.component.ts)** - Sample component
   - Real Angular component
   - All supported patterns

## 🎯 Where to Start

### For New Users
Start here: [README.md](README.md) → [QUICKSTART.md](QUICKSTART.md)

### For Developers
Start here: [STRUCTURE.md](STRUCTURE.md) → [COMPLETE_GUIDE.md](COMPLETE_GUIDE.md)

### For Contributors
Start here: [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) → [STRUCTURE.md](STRUCTURE.md)

## 📖 Quick Reference

### CLI Commands
```bash
# Generate specification
npx owcs generate [options]

# Validate specification
npx owcs validate <file>

# Show specification info
npx owcs info <file>
```

### Programmatic API
```typescript
import { 
  analyzeAngularProject,
  buildOWCSSpec,
  writeOWCSSpec,
  convertToOpenAPI
} from 'owcs';
```

### Key Concepts

- **IntermediateModel**: Framework-agnostic component representation
- **OWCSSpec**: Final specification format (YAML/JSON)
- **AngularAdapter**: Angular-specific AST analyzer
- **OpenAPI Conversion**: OWCS → OpenAPI 3.1

## 🔍 Find What You Need

| I want to...                          | Read this...                    |
|---------------------------------------|--------------------------------|
| Get started quickly                   | QUICKSTART.md                  |
| Understand the architecture           | STRUCTURE.md                   |
| Use the CLI                          | README.md (CLI section)         |
| Use the programmatic API             | COMPLETE_GUIDE.md (API section) |
| See code examples                    | examples/programmatic-usage.ts  |
| Add a new framework adapter          | STRUCTURE.md (Adding adapters)  |
| Understand implementation details     | IMPLEMENTATION_SUMMARY.md       |
| Troubleshoot issues                  | COMPLETE_GUIDE.md (Troubleshooting) |

## 🚀 Try It Now

```bash
# 1. Install dependencies
npm install

# 2. Build the project
npm run build

# 4. Try generating a spec
npx owcs generate -p examples/angular
```

## 📦 Project Structure at a Glance

```
OWCS/
├── src/                    # Source code
│   ├── cli/               # CLI implementation
│   ├── core/              # Core functionality
│   ├── adapters/angular/  # Angular adapter
│   ├── model/             # Type definitions
│   └── openapi/           # OpenAPI converter
├── examples/              # Usage examples
├── dist/                  # Compiled output
└── docs/                  # This file!
```

## 💡 Key Features

- ✅ AST-based analysis (no regex)
- ✅ Angular support with @Input/@Output
- ✅ Module Federation extraction
- ✅ YAML & JSON output
- ✅ OpenAPI 3.1 conversion
- ✅ Validation
- ✅ Extensible architecture

## 🔗 Related Resources

- [TypeScript Compiler API](https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API)
- [JSON Schema](https://json-schema.org/)
- [OpenAPI Specification](https://swagger.io/specification/)
- [Module Federation](https://webpack.js.org/concepts/module-federation/)

## 📝 License

MIT - See [LICENSE](LICENSE)

---

**Built with TypeScript Compiler API • Zero Regex • 100% AST-based** 🎯
