import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { YAMLWriter, toYAML, toJSON, writeOWCSSpec } from './yaml-writer.js';
import { OWCSSpec } from '../model/intermediate.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

describe('YAMLWriter', () => {
  let writer: YAMLWriter;
  let tempDir: string;
  let tempFile: string;

  beforeEach(() => {
    writer = new YAMLWriter();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'owcs-test-'));
    tempFile = path.join(tempDir, 'test-spec.yaml');
  });

  afterEach(() => {
    // Clean up temp files
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  const createTestSpec = (): OWCSSpec => ({
    owcs: '1.0.0',
    info: {
      title: 'Test Components',
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
                name: {
                  type: 'string',
                  description: 'User name',
                },
              },
              required: ['name'],
            },
          },
          events: {
            userClick: {
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
  });

  describe('toYAML', () => {
    it('should convert spec to YAML string', () => {
      const spec = createTestSpec();
      const yaml = writer.toYAML(spec);

      expect(yaml).toContain('owcs: 1.0.0');
      expect(yaml).toContain('title: Test Components');
      expect(yaml).toContain('user-card');
      expect(yaml).toContain('tagName: user-card');
    });

    it('should preserve structure in YAML', () => {
      const spec = createTestSpec();
      const yaml = writer.toYAML(spec);

      expect(yaml).toContain('components:');
      expect(yaml).toContain('webComponents:');
      expect(yaml).toContain('props:');
      expect(yaml).toContain('events:');
    });
  });

  describe('toJSON', () => {
    it('should convert spec to JSON string', () => {
      const spec = createTestSpec();
      const json = writer.toJSON(spec);

      expect(json).toContain('"owcs": "1.0.0"');
      expect(json).toContain('"title": "Test Components"');
      expect(json).toContain('"user-card"');
    });

    it('should produce valid JSON', () => {
      const spec = createTestSpec();
      const json = writer.toJSON(spec);

      expect(() => JSON.parse(json)).not.toThrow();
      const parsed = JSON.parse(json);
      expect(parsed.owcs).toBe('1.0.0');
    });

    it('should format JSON with 2-space indentation', () => {
      const spec = createTestSpec();
      const json = writer.toJSON(spec);

      expect(json).toContain('  "owcs"');
      expect(json).toContain('    "title"');
    });
  });

  describe('toString', () => {
    it('should convert to YAML when format is yaml', () => {
      const spec = createTestSpec();
      const result = writer.toString(spec, 'yaml');

      expect(result).toContain('owcs: 1.0.0');
      expect(result).not.toContain('"owcs"');
    });

    it('should convert to JSON when format is json', () => {
      const spec = createTestSpec();
      const result = writer.toString(spec, 'json');

      expect(result).toContain('"owcs": "1.0.0"');
      expect(result).not.toContain('owcs: 1.0.0');
    });
  });

  describe('writeToFile', () => {
    it('should write YAML file', () => {
      const spec = createTestSpec();
      const yamlFile = path.join(tempDir, 'test.yaml');

      writer.writeToFile(spec, yamlFile, 'yaml');

      expect(fs.existsSync(yamlFile)).toBe(true);
      const content = fs.readFileSync(yamlFile, 'utf-8');
      expect(content).toContain('owcs: 1.0.0');
    });

    it('should write JSON file', () => {
      const spec = createTestSpec();
      const jsonFile = path.join(tempDir, 'test.json');

      writer.writeToFile(spec, jsonFile, 'json');

      expect(fs.existsSync(jsonFile)).toBe(true);
      const content = fs.readFileSync(jsonFile, 'utf-8');
      expect(content).toContain('"owcs": "1.0.0"');
    });

    it('should overwrite existing file', () => {
      const spec = createTestSpec();
      const file = path.join(tempDir, 'test.yaml');

      // Write first time
      writer.writeToFile(spec, file, 'yaml');
      const firstContent = fs.readFileSync(file, 'utf-8');

      // Modify and write again
      spec.info.title = 'Modified Title';
      writer.writeToFile(spec, file, 'yaml');
      const secondContent = fs.readFileSync(file, 'utf-8');

      expect(secondContent).not.toBe(firstContent);
      expect(secondContent).toContain('Modified Title');
    });
  });

  describe('Convenience functions', () => {
    describe('toYAML', () => {
      it('should convert spec to YAML', () => {
        const spec = createTestSpec();
        const yaml = toYAML(spec);

        expect(yaml).toContain('owcs: 1.0.0');
        expect(yaml).toContain('user-card');
      });
    });

    describe('toJSON', () => {
      it('should convert spec to JSON', () => {
        const spec = createTestSpec();
        const json = toJSON(spec);

        expect(json).toContain('"owcs": "1.0.0"');
        expect(() => JSON.parse(json)).not.toThrow();
      });
    });

    describe('writeOWCSSpec', () => {
      it('should write YAML by default', () => {
        const spec = createTestSpec();
        const file = path.join(tempDir, 'default.yaml');

        writeOWCSSpec(spec, file);

        expect(fs.existsSync(file)).toBe(true);
        const content = fs.readFileSync(file, 'utf-8');
        expect(content).toContain('owcs: 1.0.0');
      });

      it('should write JSON when specified', () => {
        const spec = createTestSpec();
        const file = path.join(tempDir, 'spec.json');

        writeOWCSSpec(spec, file, 'json');

        expect(fs.existsSync(file)).toBe(true);
        const content = fs.readFileSync(file, 'utf-8');
        expect(content).toContain('"owcs": "1.0.0"');
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle spec with no components', () => {
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

      const yaml = writer.toYAML(spec);
      expect(yaml).toContain('owcs: 1.0.0');
      expect(yaml).toContain('webComponents: {}');
    });

    it('should handle spec with runtime config', () => {
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

      const yaml = writer.toYAML(spec);
      expect(yaml).toContain('runtime:');
      expect(yaml).toContain('bundler:');
      expect(yaml).toContain('moduleFederation:');
    });

    it('should handle component without optional fields', () => {
      const spec: OWCSSpec = {
        owcs: '1.0.0',
        info: {
          title: 'Simple',
          version: '1.0.0',
        },
        components: {
          webComponents: {
            'simple-tag': {
              tagName: 'simple-tag',
            },
          },
        },
      };

      const yaml = writer.toYAML(spec);
      expect(yaml).toContain('simple-tag');
      expect(yaml).toContain('tagName: simple-tag');
    });
  });
});
