# Commit Message Guidelines

This project uses [Conventional Commits](https://www.conventionalcommits.org/) with [commitlint](https://commitlint.js.org/) to ensure consistent commit messages.

## Commit Message Format

Each commit message must follow this format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type (Required)

Must be one of the following:

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **build**: Changes that affect the build system or external dependencies
- **ci**: Changes to CI configuration files and scripts
- **chore**: Other changes that don't modify src or test files
- **revert**: Reverts a previous commit

### Scope (Optional)

The scope should be the name of the affected module or component (e.g., `cli`, `api`, `adapters`, `react`, `angular`).

### Subject (Required)

- Use the imperative, present tense: "change" not "changed" nor "changes"
- Don't capitalize the first letter
- No period (.) at the end
- Maximum 100 characters

### Body (Optional)

- Use the imperative, present tense
- Include motivation for the change and contrast with previous behavior

### Footer (Optional)

- Reference issues and PRs
- Note breaking changes

## Examples

### Good Commit Messages

```
feat(cli): add support for custom output directory

fix(adapters): resolve incorrect prop type extraction for union types

docs: update README with installation instructions

test(schema-builder): add tests for nested component structures

refactor(core): simplify AST walker logic

perf(api): optimize component discovery performance

build: update typescript to version 5.9.3

ci: add automated release workflow

chore: update dependencies
```

### Bad Commit Messages

```
❌ Fixed bug                    # Missing type
❌ FEAT: new feature            # Type should be lowercase
❌ feat: Added new feature.     # Should not end with period
❌ feat: Add New Feature        # Subject should not be capitalized
❌ updated docs                 # Missing type
```

## Breaking Changes

If your commit introduces breaking changes, add `BREAKING CHANGE:` in the footer:

```
feat(api)!: change API interface

BREAKING CHANGE: The `generate` function now returns a Promise instead of synchronous result.
```

Or use `!` after the type/scope:

```
refactor(core)!: remove deprecated validator methods
```

## Husky Integration

This project uses Husky to automatically run commitlint on every commit. If your commit message doesn't follow the conventions, the commit will be rejected with an error message explaining what's wrong.

## Testing Commit Messages

You can test your commit message without making a commit:

```bash
echo "feat: add new feature" | npx commitlint
```

## Resources

- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [commitlint Documentation](https://commitlint.js.org/)
- [Angular Commit Message Guidelines](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#commit)
