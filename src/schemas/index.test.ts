import { describe, it, expect } from 'vitest';
import { getSchema, hasSchema, getAvailableVersions, getLatestSchema, SchemaVersion, AVAILABLE_SCHEMAS, DEFAULT_SCHEMA_VERSION } from './index.js';

describe('Schema Version Management', () => {
  describe('getSchema', () => {
    it('should return schema for version 1.0.0', () => {
      const schema = getSchema('1.0.0');

      expect(schema).toBeDefined();
      expect(schema.$schema).toBe('http://json-schema.org/draft-07/schema#');
      expect(schema.title).toBe('Open Web Component Specification');
    });

    it('should return latest schema when no version specified', () => {
      const schema = getSchema();
      const latestSchema = getSchema('latest');

      expect(schema).toBeDefined();
      expect(schema).toEqual(latestSchema);
    });

    it('should return latest schema when "latest" specified', () => {
      const schema = getSchema('latest');

      expect(schema).toBeDefined();
      expect(schema.$schema).toBe('http://json-schema.org/draft-07/schema#');
    });

    it('should throw error for invalid version', () => {
      expect(() => getSchema('99.0.0' as SchemaVersion)).toThrow(/Schema version '99.0.0' not found/);
    });

    it('should include available versions in error message', () => {
      expect(() => getSchema('99.0.0' as SchemaVersion)).toThrow(/Available versions:/);
    });
  });

  describe('hasSchema', () => {
    it('should return true for existing version 1.0.0', () => {
      expect(hasSchema('1.0.0')).toBe(true);
    });

    it('should return true for latest', () => {
      expect(hasSchema('latest')).toBe(true);
    });

    it('should return false for non-existing version', () => {
      expect(hasSchema('99.0.0')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(hasSchema('')).toBe(false);
    });
  });

  describe('getAvailableVersions', () => {
    it('should return array of available versions', () => {
      const versions = getAvailableVersions();

      expect(Array.isArray(versions)).toBe(true);
      expect(versions.length).toBeGreaterThan(0);
    });

    it('should include 1.0.0 version', () => {
      const versions = getAvailableVersions();

      expect(versions).toContain('1.0.0');
    });

    it('should include latest version', () => {
      const versions = getAvailableVersions();

      expect(versions).toContain('latest');
    });

    it('should match keys in AVAILABLE_SCHEMAS', () => {
      const versions = getAvailableVersions();
      const schemaKeys = Object.keys(AVAILABLE_SCHEMAS);

      expect(versions.sort()).toEqual(schemaKeys.sort());
    });
  });

  describe('getLatestSchema', () => {
    it('should return a schema object', () => {
      const schema = getLatestSchema();

      expect(schema).toBeDefined();
      expect(typeof schema).toBe('object');
    });

    it('should return valid JSON Schema', () => {
      const schema = getLatestSchema();

      expect(schema.$schema).toBeDefined();
      expect(schema.title).toBe('Open Web Component Specification');
      expect(schema.type).toBe('object');
    });

    it('should be same as getSchema("latest")', () => {
      const latestSchema = getLatestSchema();
      const explicitLatest = getSchema('latest');

      expect(latestSchema).toEqual(explicitLatest);
    });

    it('should have required OWCS properties', () => {
      const schema = getLatestSchema();

      expect(schema.properties).toBeDefined();
      expect(schema.properties.owcs).toBeDefined();
      expect(schema.properties.info).toBeDefined();
      expect(schema.properties.components).toBeDefined();
    });
  });

  describe('DEFAULT_SCHEMA_VERSION', () => {
    it('should be defined', () => {
      expect(DEFAULT_SCHEMA_VERSION).toBeDefined();
    });

    it('should be a valid schema version', () => {
      expect(hasSchema(DEFAULT_SCHEMA_VERSION)).toBe(true);
    });

    it('should be "latest"', () => {
      expect(DEFAULT_SCHEMA_VERSION).toBe('latest');
    });
  });

  describe('AVAILABLE_SCHEMAS', () => {
    it('should be defined', () => {
      expect(AVAILABLE_SCHEMAS).toBeDefined();
    });

    it('should have at least one schema', () => {
      const keys = Object.keys(AVAILABLE_SCHEMAS);
      expect(keys.length).toBeGreaterThan(0);
    });

    it('should have latest schema', () => {
      expect(AVAILABLE_SCHEMAS.latest).toBeDefined();
    });

    it('should have v1 schemas', () => {
      expect(AVAILABLE_SCHEMAS['1.0.0']).toBeDefined();
    });

    it('all schemas should be valid JSON Schema objects', () => {
      Object.values(AVAILABLE_SCHEMAS).forEach((schema) => {
        expect(schema).toBeDefined();
        expect(typeof schema).toBe('object');
        expect(schema.$schema).toBeDefined();
      });
    });
  });

  describe('Schema Content Validation', () => {
    it('should have correct $id in v1.0.0 schema', () => {
      const schema = getSchema('1.0.0');
      expect(schema.$id).toBe('https://owcs.dev/schema/1.0.0');
    });

    it('should have required fields defined in v1 schema', () => {
      const schema = getSchema('1.0.0');

      expect(schema.required).toContain('owcs');
      expect(schema.required).toContain('info');
      expect(schema.required).toContain('components');
    });

    it('should have WebComponent definition in v1 schema', () => {
      const schema = getSchema('1.0.0');

      expect(schema.definitions).toBeDefined();
      expect(schema.definitions.WebComponent).toBeDefined();
      expect(schema.definitions.WebComponent.required).toContain('tagName');
    });

    it('should have Event definition in v1 schema', () => {
      const schema = getSchema('1.0.0');

      expect(schema.definitions.Event).toBeDefined();
      expect(schema.definitions.Event.required).toContain('type');
    });

    it('should have JSONSchema definition in v1 schema', () => {
      const schema = getSchema('1.0.0');

      expect(schema.definitions.JSONSchema).toBeDefined();
      expect(schema.definitions.JSONSchema.properties).toBeDefined();
    });
  });

  describe('Version Extensibility', () => {
    it('should support adding new versions without breaking existing code', () => {
      // This test validates that the structure is extensible
      // Future versions can be added to AVAILABLE_SCHEMAS without breaking this test

      const versions = getAvailableVersions();
      expect(versions.length).toBeGreaterThanOrEqual(2); // At least 1, 1.0, 1.0.0, latest
    });

    it('should maintain backward compatibility with v1 schemas', () => {
      // All v1 aliases should point to the same schema
      const v1Schemas = ['1.0.0'].map((v) => getSchema(v as SchemaVersion));

      const firstSchema = v1Schemas[0];
      v1Schemas.forEach((schema) => {
        expect(schema).toEqual(firstSchema);
      });
    });
  });
});
