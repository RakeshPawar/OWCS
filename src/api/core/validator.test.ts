import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { OWCSValidator, validateOWCSSpec, validateOWCSFile } from './validator.js';
import { OWCSSpec } from '../model/intermediate.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import yaml from 'js-yaml';

describe('OWCSValidator', () => {
  let validator: OWCSValidator;
  let tempDir: string;

  beforeEach(() => {
    validator = new OWCSValidator();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'owcs-validator-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  const createValidSpec = (): OWCSSpec => ({
    owcs: '1.0.0',
    info: {
      title: 'Test Components',
      version: '1.0.0',
    },
    components: {
      webComponents: {
        'user-card': {
          tagName: 'user-card',
        },
      },
    },
  });

  describe('validateSpec', () => {
    it('should validate a valid OWCS spec', () => {
      const spec = createValidSpec();
      const result = validator.validateSpec(spec);

      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should reject spec without owcs version', () => {
      const spec: any = {
        info: {
          title: 'Test',
          version: '1.0.0',
        },
        components: {
          webComponents: {},
        },
      };

      const result = validator.validateSpec(spec);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
    });

    it('should reject spec without info section', () => {
      const spec: any = {
        owcs: '1.0.0',
        components: {
          webComponents: {},
        },
      };

      const result = validator.validateSpec(spec);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should reject spec without components section', () => {
      const spec: any = {
        owcs: '1.0.0',
        info: {
          title: 'Test',
          version: '1.0.0',
        },
      };

      const result = validator.validateSpec(spec);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should validate spec with complete component', () => {
      const spec: OWCSSpec = {
        owcs: '1.0.0',
        info: {
          title: 'Test',
          version: '1.0.0',
          description: 'Test description',
        },
        components: {
          webComponents: {
            'user-card': {
              tagName: 'user-card',
              module: './UserCard',
              props: {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    age: { type: 'number' },
                  },
                  required: ['name'],
                },
              },
              events: {
                click: {
                  type: 'CustomEvent',
                  payload: {
                    type: 'object',
                    properties: {
                      userId: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      };

      const result = validator.validateSpec(spec);

      expect(result.valid).toBe(true);
    });

    it('should validate spec with runtime configuration', () => {
      const spec: OWCSSpec = {
        owcs: '1.0.0',
        info: {
          title: 'Test',
          version: '1.0.0',
        },
        runtime: {
          bundler: {
            name: 'webpack',
            moduleFederation: {
              remoteName: 'myRemote',
              libraryType: 'module',
              exposes: {
                './Component': './src/component.ts',
              },
            },
          },
        },
        components: {
          webComponents: {},
        },
      };

      const result = validator.validateSpec(spec);

      expect(result.valid).toBe(true);
    });

    it('should reject spec with invalid owcs version format', () => {
      const spec: any = {
        owcs: '2.0.0', // Invalid version
        info: {
          title: 'Test',
          version: '1.0.0',
        },
        components: {
          webComponents: {},
        },
      };

      const result = validator.validateSpec(spec);

      expect(result.valid).toBe(false);
    });

    it('should provide detailed error messages', () => {
      const spec: any = {
        owcs: '1.0.0',
        info: {
          title: 'Test',
          // Missing version
        },
        components: {
          webComponents: {},
        },
      };

      const result = validator.validateSpec(spec);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some((err) => err.includes('version'))).toBe(true);
    });

    it('should validate empty web components', () => {
      const spec: OWCSSpec = {
        owcs: '1.0.0',
        info: {
          title: 'Empty',
          version: '1.0.0',
        },
        components: {
          webComponents: {},
        },
      };

      const result = validator.validateSpec(spec);

      expect(result.valid).toBe(true);
    });
  });

  describe('validateFile', () => {
    it('should validate valid YAML file', () => {
      const spec = createValidSpec();
      const filePath = path.join(tempDir, 'valid.yaml');
      fs.writeFileSync(filePath, yaml.dump(spec), 'utf-8');

      const result = validator.validateFile(filePath);

      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should validate valid JSON file', () => {
      const spec = createValidSpec();
      const filePath = path.join(tempDir, 'valid.json');
      fs.writeFileSync(filePath, JSON.stringify(spec, null, 2), 'utf-8');

      const result = validator.validateFile(filePath);

      expect(result.valid).toBe(true);
    });

    it('should reject invalid YAML file', () => {
      const invalidSpec: any = {
        owcs: '1.0.0',
        // Missing required fields
      };
      const filePath = path.join(tempDir, 'invalid.yaml');
      fs.writeFileSync(filePath, yaml.dump(invalidSpec), 'utf-8');

      const result = validator.validateFile(filePath);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should reject invalid JSON file', () => {
      const invalidSpec: any = {
        owcs: '1.0.0',
        // Missing required fields
      };
      const filePath = path.join(tempDir, 'invalid.json');
      fs.writeFileSync(filePath, JSON.stringify(invalidSpec), 'utf-8');

      const result = validator.validateFile(filePath);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should reject unsupported file extension', () => {
      const spec = createValidSpec();
      const filePath = path.join(tempDir, 'spec.txt');
      fs.writeFileSync(filePath, JSON.stringify(spec), 'utf-8');

      const result = validator.validateFile(filePath);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toContain('.yaml, .yml, or .json');
    });

    it('should handle non-existent file', () => {
      const filePath = path.join(tempDir, 'non-existent.yaml');

      const result = validator.validateFile(filePath);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should handle malformed YAML file', () => {
      const filePath = path.join(tempDir, 'malformed.yaml');
      fs.writeFileSync(filePath, 'owcs: 1.0.0\n  bad: indent\n-invalid', 'utf-8');

      const result = validator.validateFile(filePath);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should handle malformed JSON file', () => {
      const filePath = path.join(tempDir, 'malformed.json');
      fs.writeFileSync(filePath, '{ "owcs": "1.0.0", invalid json }', 'utf-8');

      const result = validator.validateFile(filePath);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should validate .yml extension', () => {
      const spec = createValidSpec();
      const filePath = path.join(tempDir, 'valid.yml');
      fs.writeFileSync(filePath, yaml.dump(spec), 'utf-8');

      const result = validator.validateFile(filePath);

      expect(result.valid).toBe(true);
    });
  });

  describe('isValidOWCSSpec', () => {
    it('should return true for valid spec', () => {
      const spec = createValidSpec();
      const result = validator.isValidOWCSSpec(spec);

      expect(result).toBe(true);
    });

    it('should return false for invalid spec', () => {
      const spec: any = {
        owcs: '1.0.0',
        // Missing required fields
      };
      const result = validator.isValidOWCSSpec(spec);

      expect(result).toBe(false);
    });

    it('should work as type guard', () => {
      const spec: unknown = createValidSpec();

      if (validator.isValidOWCSSpec(spec)) {
        // TypeScript should recognize spec as OWCSSpec here
        expect(spec.owcs).toBe('1.0.0');
        expect(spec.info.title).toBe('Test Components');
      }
    });
  });

  describe('Convenience functions', () => {
    describe('validateOWCSSpec', () => {
      it('should validate spec using convenience function', () => {
        const spec = createValidSpec();
        const result = validateOWCSSpec(spec);

        expect(result.valid).toBe(true);
      });

      it('should reject invalid spec', () => {
        const spec: any = { owcs: '1.0.0' };
        const result = validateOWCSSpec(spec);

        expect(result.valid).toBe(false);
      });
    });

    describe('validateOWCSFile', () => {
      it('should validate file using convenience function', () => {
        const spec = createValidSpec();
        const filePath = path.join(tempDir, 'convenience.yaml');
        fs.writeFileSync(filePath, yaml.dump(spec), 'utf-8');

        const result = validateOWCSFile(filePath);

        expect(result.valid).toBe(true);
      });

      it('should reject invalid file', () => {
        const spec: any = { owcs: '1.0.0' };
        const filePath = path.join(tempDir, 'invalid-convenience.yaml');
        fs.writeFileSync(filePath, yaml.dump(spec), 'utf-8');

        const result = validateOWCSFile(filePath);

        expect(result.valid).toBe(false);
      });
    });
  });

  describe('Schema Version Support', () => {
    it('should create validator with default version', () => {
      const validator = new OWCSValidator();
      
      expect(validator.getSchemaVersion()).toBe('latest');
    });

    it('should create validator with specific version 1.0.0', () => {
      const validator = new OWCSValidator('1.0.0');
      
      expect(validator.getSchemaVersion()).toBe('1.0.0');
    });

    it('should create validator with latest version', () => {
      const validator = new OWCSValidator('latest');
      
      expect(validator.getSchemaVersion()).toBe('latest');
    });

    it('should validate spec using v1.0.0 schema', () => {
      const validator = new OWCSValidator('1.0.0');
      const spec = createValidSpec();
      
      const result = validator.validateSpec(spec);
      
      expect(result.valid).toBe(true);
    });

    it('should validate spec using latest schema', () => {
      const validator = new OWCSValidator('latest');
      const spec = createValidSpec();
      
      const result = validator.validateSpec(spec);
      
      expect(result.valid).toBe(true);
    });

    it('should throw error for invalid schema version', () => {
      expect(() => new OWCSValidator('99.0.0' as any)).toThrow(
        /Schema version '99.0.0' not found/
      );
    });

    it('should return list of available versions', () => {
      const versions = OWCSValidator.getAvailableVersions();
      
      expect(Array.isArray(versions)).toBe(true);
      expect(versions).toContain('1.0.0');
      expect(versions).toContain('latest');
    });

    it('should maintain version after validation', () => {
      const validator = new OWCSValidator('1.0.0');
      const spec = createValidSpec();
      
      validator.validateSpec(spec);
      
      expect(validator.getSchemaVersion()).toBe('1.0.0');
    });
  });

  describe('Convenience Functions with Version Support', () => {
    it('should validate spec with default version using validateOWCSSpec', () => {
      const spec = createValidSpec();
      
      const result = validateOWCSSpec(spec);
      
      expect(result.valid).toBe(true);
    });

    it('should validate spec with specific version using validateOWCSSpec', () => {
      const spec = createValidSpec();
      
      const result = validateOWCSSpec(spec, '1.0.0');
      
      expect(result.valid).toBe(true);
    });

    it('should validate file with default version using validateOWCSFile', () => {
      const spec = createValidSpec();
      const filePath = path.join(tempDir, 'test-version.yaml');
      fs.writeFileSync(filePath, yaml.dump(spec), 'utf-8');
      
      const result = validateOWCSFile(filePath);
      
      expect(result.valid).toBe(true);
    });

    it('should validate file with specific version using validateOWCSFile', () => {
      const spec = createValidSpec();
      const filePath = path.join(tempDir, 'test-version-specific.yaml');
      fs.writeFileSync(filePath, yaml.dump(spec), 'utf-8');
      
      const result = validateOWCSFile(filePath, '1.0.0');
      
      expect(result.valid).toBe(true);
    });

    it('should validate file with different versions', () => {
      const spec = createValidSpec();
      const filePath = path.join(tempDir, 'test-multi-version.yaml');
      fs.writeFileSync(filePath, yaml.dump(spec), 'utf-8');

      const result100 = validateOWCSFile(filePath, '1.0.0');
      const resultLatest = validateOWCSFile(filePath, 'latest');

      expect(result100.valid).toBe(true);
      expect(resultLatest.valid).toBe(true);
    });

    it('should reject invalid spec with any version', () => {
      const invalidSpec: any = { owcs: '1.0.0' }; // Missing required fields
      
      const result100 = validateOWCSSpec(invalidSpec, '1.0.0');
      
      expect(result100.valid).toBe(false);
    });
  });

  describe('Future Version Extensibility', () => {
    it('should allow multiple validators with different versions simultaneously', () => {
      const validator1 = new OWCSValidator('1.0.0');
      const validator2 = new OWCSValidator('latest');
      
      expect(validator1.getSchemaVersion()).toBe('1.0.0');
      expect(validator2.getSchemaVersion()).toBe('latest');
    });

    it('should support validating same spec with multiple versions', () => {
      const spec = createValidSpec();
      
      const versions = ['1.0.0', 'latest'];
      const results = versions.map(v => validateOWCSSpec(spec, v as any));
      
      results.forEach((result, i) => {
        expect(result.valid).toBe(true);
      });
    });

    it('should prepare for future schema versions without breaking existing code', () => {
      // This test ensures that the architecture supports future versions
      // When v2.0.0 is added, this test should still pass
      
      const availableVersions = OWCSValidator.getAvailableVersions();
      
      expect(availableVersions.length).toBeGreaterThanOrEqual(2);
      expect(availableVersions).toContain('latest');
      
      // Ensure all versions work
      availableVersions.forEach(version => {
        expect(() => new OWCSValidator(version)).not.toThrow();
      });
    });
  });
});

