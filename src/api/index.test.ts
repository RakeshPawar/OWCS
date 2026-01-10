import { describe, it, expect } from 'vitest';
import {
  // Adapters
  AngularAdapter,
  analyzeAngularProject,
  // Core
  SchemaBuilder,
  buildOWCSSpec,
  YAMLWriter,
  toYAML,
  toJSON,
  writeOWCSSpec,
  OWCSValidator,
  validateOWCSSpec,
  validateOWCSFile,
  // OpenAPI
  OpenAPIConverter,
  convertToOpenAPI,
  IntermediateModel,
} from './index.js';

describe('API Index Exports', () => {
  describe('Adapter exports', () => {
    it('should export AngularAdapter class', () => {
      expect(AngularAdapter).toBeDefined();
      expect(typeof AngularAdapter).toBe('function');
    });

    it('should export analyzeAngularProject function', () => {
      expect(analyzeAngularProject).toBeDefined();
      expect(typeof analyzeAngularProject).toBe('function');
    });
  });

  describe('Core exports', () => {
    it('should export SchemaBuilder class', () => {
      expect(SchemaBuilder).toBeDefined();
      expect(typeof SchemaBuilder).toBe('function');
    });

    it('should export buildOWCSSpec function', () => {
      expect(buildOWCSSpec).toBeDefined();
      expect(typeof buildOWCSSpec).toBe('function');
    });

    it('should export YAMLWriter class', () => {
      expect(YAMLWriter).toBeDefined();
      expect(typeof YAMLWriter).toBe('function');
    });

    it('should export YAML/JSON utility functions', () => {
      expect(toYAML).toBeDefined();
      expect(typeof toYAML).toBe('function');
      expect(toJSON).toBeDefined();
      expect(typeof toJSON).toBe('function');
      expect(writeOWCSSpec).toBeDefined();
      expect(typeof writeOWCSSpec).toBe('function');
    });

    it('should export OWCSValidator class', () => {
      expect(OWCSValidator).toBeDefined();
      expect(typeof OWCSValidator).toBe('function');
    });

    it('should export validation utility functions', () => {
      expect(validateOWCSSpec).toBeDefined();
      expect(typeof validateOWCSSpec).toBe('function');
      expect(validateOWCSFile).toBeDefined();
      expect(typeof validateOWCSFile).toBe('function');
    });
  });

  describe('OpenAPI exports', () => {
    it('should export OpenAPIConverter class', () => {
      expect(OpenAPIConverter).toBeDefined();
      expect(typeof OpenAPIConverter).toBe('function');
    });

    it('should export convertToOpenAPI function', () => {
      expect(convertToOpenAPI).toBeDefined();
      expect(typeof convertToOpenAPI).toBe('function');
    });
  });

  describe('Integration: Full workflow', () => {
    it('should allow building and converting a spec', () => {
      const model: IntermediateModel = {
        runtime: {
          bundler: 'webpack',
        },
        components: [
          {
            tagName: 'test-component',
            className: 'TestComponent',
            modulePath: './test.component.ts',
            props: [],
            events: [],
          },
        ],
      };

      // Build OWCS spec
      const owcsSpec = buildOWCSSpec(model);
      expect(owcsSpec).toBeDefined();
      expect(owcsSpec.owcs).toBe('1.0.0');

      // Validate spec
      const validation = validateOWCSSpec(owcsSpec);
      expect(validation.valid).toBe(true);

      // Convert to YAML
      const yamlOutput = toYAML(owcsSpec);
      expect(yamlOutput).toContain('owcs: 1.0.0');
      expect(yamlOutput).toContain('test-component');

      // Convert to JSON
      const jsonOutput = toJSON(owcsSpec);
      expect(jsonOutput).toContain('"owcs": "1.0.0"');
      expect(jsonOutput).toContain('"test-component"');

      // Convert to OpenAPI
      const openApiSpec = convertToOpenAPI(owcsSpec);
      expect(openApiSpec.openapi).toBe('3.1.0');
      expect(openApiSpec.paths['/components/test-component']).toBeDefined();
    });

    it('should work with SchemaBuilder and YAMLWriter classes', () => {
      const model: IntermediateModel = {
        runtime: {
          bundler: 'webpack',
        },
        components: [],
      };

      const builder = new SchemaBuilder();
      const spec = builder.build(model);

      const writer = new YAMLWriter();
      const yaml = writer.toYAML(spec);
      const json = writer.toJSON(spec);

      expect(yaml).toContain('owcs: 1.0.0');
      expect(json).toContain('"owcs": "1.0.0"');
    });

    it('should work with OWCSValidator and OpenAPIConverter classes', () => {
      const model: IntermediateModel = {
        runtime: {
          bundler: 'webpack',
        },
        components: [],
      };

      const spec = buildOWCSSpec(model);

      const validator = new OWCSValidator();
      const isValid = validator.isValidOWCSSpec(spec);
      expect(isValid).toBe(true);

      const converter = new OpenAPIConverter();
      const openApiSpec = converter.convert(spec);
      expect(openApiSpec.openapi).toBe('3.1.0');
    });
  });
});
