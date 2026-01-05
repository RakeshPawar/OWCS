# Expected output for user-card.component.ts

When running:
```bash
npx owcs generate -p examples/angular --format yaml
```

Expected output (owcs.yaml):

```yaml
owcs: 1.0.0
info:
  title: userComponents
  version: 1.0.0
runtime:
  bundler:
    name: webpack
    moduleFederation:
      remoteName: userComponents
      libraryType: module
      exposes:
        ./UserCard: ./examples/angular/user-card.component.ts
        ./AnotherComponent: ./examples/angular/another.component.ts
components:
  webComponents:
    user-card:
      tagName: user-card
      module: ./UserCard
      props:
        schema:
          type: object
          properties:
            name:
              type: string
            age:
              type: number
            email:
              type: string
            config:
              type: object
              properties:
                theme:
                  type: string
                  enum:
                    - light
                    - dark
                showAvatar:
                  type: boolean
          required:
            - name
      events:
        clicked:
          type: EventEmitter
          payload:
            type: object
            properties:
              timestamp:
                type: number
        userUpdated:
          type: EventEmitter
          payload:
            type: object
            properties:
              name:
                type: string
              age:
                type: number
```

## Testing the library

1. Build the project:
```bash
npm install
npm run build
```

2. Generate spec from example:
```bash
node dist/cli/index.js generate -p examples/angular --format yaml --output examples/owcs.yaml
```

3. Validate the spec:
```bash
node dist/cli/index.js validate examples/owcs.yaml
```

4. View spec info:
```bash
node dist/cli/index.js info examples/owcs.yaml
```

5. Generate with OpenAPI:
```bash
node dist/cli/index.js generate -p examples/angular --openapi
```
