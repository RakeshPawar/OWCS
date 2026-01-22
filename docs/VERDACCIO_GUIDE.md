# Local Development with Verdaccio

> **Note**: For OWCS contributors testing locally before publishing. End users: `npm install owcs`

Local npm registry setup using Verdaccio for development and testing.

### Prerequisites

```bash
npm install -g verdaccio
```

### Quick Start

**1. Start Server**

```bash
npm run verdaccio:start
```

Or start manually:

```bash
verdaccio --config ./verdaccio.yaml
```

The server will start at `http://localhost:4873`

#### 2. Create a User (First Time Only)

```bash
npm adduser --registry http://localhost:4873
# Username: test, Password: test, Email: test@test.com
```

**3. Publish Package**

```bash
npm run verdaccio:publish
```

Or manually:

```bash
npm publish --registry http://localhost:4873
```

#### 4. Using the Local Package

In another project, install from the local registry:

```bash
# Set the registry temporarily
npm install owcs --registry http://localhost:4873

# Or add to .npmrc in the project
echo "registry=http://localhost:4873" > .npmrc
npm install owcs
```

### Available Scripts

| Script                        | Description                           |
| ----------------------------- | ------------------------------------- |
| `npm run verdaccio:start`     | Start the Verdaccio server            |
| `npm run verdaccio:publish`   | Publish package to local registry     |
| `npm run verdaccio:unpublish` | Remove package from local registry    |
| `npm run verdaccio:set`       | Set npm registry to local Verdaccio   |
| `npm run verdaccio:reset`     | Reset npm registry to default (npmjs) |

### Best Practices

1. **Version Management**: Update the version in `package.json` before publishing

   ```bash
   npm version patch  # 1.0.0 -> 1.0.1
   npm version minor  # 1.0.0 -> 1.1.0
   npm version major  # 1.0.0 -> 2.0.0
   npm run verdaccio:publish
   ```

2. **Clean Build**: Always ensure a clean build before publishing

   ```bash
   rm -rf dist
   npm run build
   npm run verdaccio:publish
   ```

3. **Testing Before Publish**: Test the build in a separate project

   ```bash
   # In a test project
   npm install /path/to/OWCS
   # Test functionality
   # If OK, then publish to verdaccio
   ```

4. **Storage Management**: The `verdaccio-storage` directory contains all published packages
   - Add to `.gitignore` to avoid committing
   - Backup periodically if needed

5. **Multiple Projects**: Use `.npmrc` files in consumer projects

   ```
   # In the consumer project's .npmrc
   registry=http://localhost:4873
   ```

6. **Reset to Public Registry**: After testing, reset your registry
   ```bash
   npm run verdaccio:reset
   ```

### Troubleshooting

#### Port Already in Use

If port 4873 is already in use:

```bash
# Find the process
lsof -i :4873
# Kill it
kill -9 <PID>
```

Or change the port in `verdaccio.yaml`:

```yaml
listen:
  - 0.0.0.0:4874
```

#### Authentication Issues

Clear npm credentials and re-authenticate:

```bash
npm logout --registry http://localhost:4873
npm adduser --registry http://localhost:4873
```

#### Cannot Publish - Version Exists

```bash
# Unpublish the existing version
npm run verdaccio:unpublish
# Or increment version
npm version patch
npm run verdaccio:publish
```

#### Package Not Found in Consumer Project

Ensure the registry is set:

```bash
npm config get registry
# Should show: http://localhost:4873
```

### Advanced Configuration

#### Custom Storage Location

Edit `verdaccio.yaml`:

```yaml
storage: /path/to/custom/storage
```

#### Proxy Configuration

The configuration proxies unknown packages to npmjs:

```yaml
uplinks:
  npmjs:
    url: https://registry.npmjs.org/
```

#### Access Control

Modify package access in `verdaccio.yaml`:

```yaml
packages:
  'owcs':
    access: $authenticated # Require auth to install
    publish: $authenticated
```

### Integration with CI/CD

For automated testing in CI:

```bash
# Start verdaccio in background
verdaccio --config ./verdaccio.yaml &
VERDACCIO_PID=$!

# Wait for server to start
sleep 5

# Create user programmatically
npm-cli-adduser -u test -p test -e test@test.com -r http://localhost:4873

# Publish
npm publish --registry http://localhost:4873

# Run tests in consumer projects
cd ../test-project
npm install owcs --registry http://localhost:4873
npm test

# Cleanup
kill $VERDACCIO_PID
```

### Web Interface

Access the Verdaccio web UI at `http://localhost:4873` to:

- Browse published packages
- View package details
- Search packages
- Monitor downloads

### Security Notes

- This is for **local development only**
- Default configuration allows anonymous access for reading packages
- Requires authentication for publishing packages
- Do not expose to public networks
- Use firewall rules if needed

### Files Created

- `verdaccio.yaml` - Main configuration
- `verdaccio-storage/` - Package storage (git-ignored)
- `htpasswd` - User authentication (auto-created)
