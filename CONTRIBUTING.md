# Contributing to OWCS

Thank you for your interest in contributing to OWCS (Open Web Component Specification)! We welcome contributions from the community to help make web component development more standardized and accessible.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Code Guidelines](#code-guidelines)
- [Testing](#testing)
- [Documentation](#documentation)
- [Submitting Changes](#submitting-changes)
- [Community Guidelines](#community-guidelines)

## Getting Started

OWCS is designed to be extensible and framework-agnostic. We're particularly interested in:

- **Framework adapters**: Adding support for React, Vue, Svelte, or other frameworks
- **Enhanced Angular support**: Template parsing, CSS custom properties, lifecycle hooks
- **Tooling integrations**: Webpack plugins, Vite plugins, build tool integrations
- **Documentation improvements**: Examples, guides, and API documentation
- **Bug fixes and optimizations**: Performance improvements and reliability enhancements

## Development Setup

For detailed development setup instructions, including architecture overview and API documentation, please see [docs/COMPLETE_GUIDE.md](docs/COMPLETE_GUIDE.md).

**Quick setup:**

```bash
# Clone the repository
git clone https://github.com/yourusername/OWCS.git
cd OWCS

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Start development mode (watch for changes)
npm run dev
```

## How to Contribute

### 1. Choose Your Contribution Type

#### Adding Framework Support

If you want to add support for a new framework:

1. Create a new adapter directory: `src/api/adapters/[framework]/`
2. Implement the adapter interface (see Angular adapter as reference)
3. Add framework-specific extractors for:
   - Component registration/discovery
   - Properties/props extraction
   - Event handling extraction
   - Module federation (if applicable)
4. Write comprehensive tests
5. Update documentation

#### Enhancing Angular Support

Current Angular adapter supports basic component analysis. Areas for enhancement:

- Template parsing and analysis
- CSS custom properties detection
- Lifecycle hook documentation
- Angular-specific decorators (@HostBinding, @HostListener, etc.)
- Standalone components support

#### Bug Fixes and Features

- Check existing issues for bugs or feature requests
- Create an issue to discuss larger changes before implementation
- Follow the existing code patterns and architecture

### 2. Development Workflow

1. **Fork the repository** and create your feature branch:

   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```

2. **Make your changes** following the code guidelines below

3. **Add or update tests** for your changes

4. **Update documentation** if needed

5. **Test your changes** thoroughly:

   ```bash
   npm run build
   npm test
   npm run test:coverage
   ```

6. **Commit your changes** following the [Conventional Commits](https://www.conventionalcommits.org/) standard:

   ```bash
   git commit -m "feat(angular): add template parsing support"
   # or
   git commit -m "fix(validator): handle edge case in schema validation"
   ```

   📖 **Important**: This project uses commitlint to enforce commit message standards. Please read [docs/COMMIT_GUIDELINES.md](docs/COMMIT_GUIDELINES.md) for detailed guidelines on writing proper commit messages. Commits that don't follow the standard will be automatically rejected by the pre-commit hook.

## Code Guidelines

### Code Style

- **TypeScript**: Use strict TypeScript with proper type annotations
- **Formatting**: The project uses ESLint and Prettier (run `npm run lint:fix`)
- **Naming**: Use descriptive names for functions, variables, and classes
- **Imports**: Use absolute imports for internal modules when possible

### Architecture Principles

- **Separation of concerns**: Keep framework-specific logic in adapters
- **Framework-agnostic core**: Core functionality should not depend on specific frameworks
- **Extensibility**: Design APIs to be easily extended for new frameworks
- **Type safety**: Leverage TypeScript's type system for better reliability

### File Structure

```
src/
├── cli/                    # Command-line interface
├── api/                    # Programmatic API
│   ├── core/              # Framework-agnostic core functionality
│   ├── adapters/          # Framework-specific adapters
│   │   ├── angular/       # Angular adapter
│   │   └── [new-framework]/ # Your new framework adapter
│   ├── model/             # TypeScript interfaces and types
│   └── openapi/           # OpenAPI conversion utilities
└── schemas/               # JSON Schema definitions
```

### Adapter Implementation

When creating a new framework adapter, implement these key methods:

```typescript
interface FrameworkAdapter {
  analyze(projectRoot: string, configPath?: string): IntermediateModel;
  discoverComponents(): ComponentInfo[];
  extractProps(component: ComponentInfo): PropInfo[];
  extractEvents(component: ComponentInfo): EventInfo[];
  extractRuntimeConfig?(): RuntimeConfig;
}
```

## Testing

### Test Structure

- **Unit tests**: Test individual functions and classes
- **Integration tests**: Test adapter functionality with real code examples
- **CLI tests**: Test command-line interface behavior
- **Schema validation tests**: Ensure generated specifications are valid

### Writing Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- your-test.test.ts

# Generate coverage report
npm run test:coverage
```

### Test Guidelines

- Write tests for all new functionality
- Include edge cases and error scenarios
- Use descriptive test names that explain the expected behavior
- Mock external dependencies appropriately
- Test both positive and negative cases

## Documentation

### Types of Documentation

1. **API Documentation**: JSDoc comments for all public APIs
2. **User Documentation**: README updates for new features
3. **Developer Documentation**: Architecture and implementation details
4. **Examples**: Real-world usage examples in `examples/` directory

### Documentation Guidelines

- Keep documentation up-to-date with code changes
- Use clear, concise language
- Include code examples for new features
- Document breaking changes clearly
- Update the COMPLETE_GUIDE.md for architectural changes

## Submitting Changes

### Pull Request Process

1. **Create a Pull Request** against the main branch
2. **Fill out the PR template** with:
   - Clear description of changes
   - Related issue numbers (if applicable)
   - Breaking changes (if any)
   - Testing approach

3. **Ensure all checks pass**:
   - All tests must pass
   - Linting must pass
   - Build must succeed
   - Coverage should not decrease significantly

4. **Request review** from maintainers

### PR Guidelines

- **Title**: Use conventional commit format (feat:, fix:, docs:, etc.)
- **Description**: Explain what and why, not just what changed
- **Size**: Keep PRs focused and reasonably sized
- **Commits**: Use meaningful commit messages following conventional commits

### Review Process

- Maintainers will review PRs within a few days
- Address feedback promptly and professionally
- Be open to suggestions and improvements
- Keep discussions focused on the code and technical aspects

## Community Guidelines

### Code of Conduct

- Be respectful and inclusive in all interactions
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Respect different perspectives and approaches

### Getting Help

- **Issues**: Use GitHub issues for bug reports and feature requests
- **Discussions**: Use GitHub discussions for general questions
- **Documentation**: Check docs/COMPLETE_GUIDE.md for detailed information

### Recognition

Contributors are recognized in:

- Release notes for significant contributions
- README.md contributors section (coming soon)
- Special thanks in documentation

## Development Tips

### Common Patterns

1. **AST Walking**: Use the existing AST walker utilities in `src/api/core/ast-walker.ts`
2. **Error Handling**: Follow existing error handling patterns with meaningful error messages
3. **Configuration**: Use the established configuration patterns for framework-specific options
4. **Schema Validation**: Leverage JSON Schema for specification validation

### Debugging

- Use the CLI with the `--debug` flag for verbose output
- Run specific test cases while developing
- Use TypeScript's compiler API documentation for AST manipulation
- Check existing adapter implementations as reference

### Performance Considerations

- Consider memory usage when processing large codebases
- Use efficient AST traversal patterns
- Cache expensive operations when appropriate
- Profile performance for large projects

---

Thank you for contributing to OWCS! Your efforts help make web component development more accessible and standardized across the ecosystem.

## Questions?

If you have questions not covered in this guide, please:

1. Check the [docs/COMPLETE_GUIDE.md](docs/COMPLETE_GUIDE.md) for technical details
2. Search existing issues and discussions
3. Create a new discussion or issue with your question

We're here to help and appreciate your contributions! 🚀
