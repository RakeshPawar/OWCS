import Ajv, { ValidateFunction } from 'ajv';
import fs from 'node:fs';
import yaml from 'js-yaml';
import { OWCSSpec } from '../model/intermediate.js';
import { getSchema, SchemaVersion, DEFAULT_SCHEMA_VERSION, getAvailableVersions, AVAILABLE_SCHEMAS } from '../../schemas/index.js';

/**
 * Validates OWCS specifications against the schema
 */
export class OWCSValidator {
  private ajv: any;
  private validate: ValidateFunction;
  private schemaVersion: SchemaVersion;

  /**
   * @param version - Schema version to use for validation (defaults to 'latest')
   */
  constructor(version: SchemaVersion = DEFAULT_SCHEMA_VERSION) {
    this.schemaVersion = version;
    this.ajv = new Ajv.default({
      allErrors: true,
      strict: false,
      validateFormats: true,
    });

    const schema = getSchema(version);
    this.validate = this.ajv.compile(schema);
  }

  /**
   * Get the schema version used by this validator
   */
  public getSchemaVersion(): SchemaVersion {
    return this.schemaVersion;
  }

  /**
   * Get all available schema versions
   */
  public static getAvailableVersions(): SchemaVersion[] {
    return getAvailableVersions();
  }

  /**
   * Validates an OWCS spec object
   */
  public validateSpec(spec: unknown): { valid: boolean; errors?: string[] } {
    if (!spec || typeof spec !== 'object' || !('owcs' in spec)) {
      return { valid: false, errors: ['Missing owcs version'] };
    }

    const version = (spec as { owcs: SchemaVersion }).owcs;
    console.log('Validating spec with OWCS version:', version);
    if (version && AVAILABLE_SCHEMAS[this.schemaVersion] !== AVAILABLE_SCHEMAS[version]) {
      return {
        valid: false,
        errors: [`Unsupported OWCS version: ${version}`],
      };
    }

    const valid = this.validate(spec);

    if (!valid && this.validate.errors) {
      const errors = this.validate.errors.map((error: any) => {
        const path = error.instancePath || 'root';
        return `${path}: ${error.message}`;
      });

      return { valid: false, errors };
    }

    return { valid: true };
  }

  /**
   * Validates an OWCS spec from a file
   */
  public validateFile(filePath: string): { valid: boolean; errors?: string[] } {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      let spec: unknown;

      if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
        spec = yaml.load(content);
      } else if (filePath.endsWith('.json')) {
        spec = JSON.parse(content);
      } else {
        return {
          valid: false,
          errors: ['File must be .yaml, .yml, or .json'],
        };
      }

      return this.validateSpec(spec);
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  /**
   * Checks if a spec conforms to OWCS format (type guard)
   */
  public isValidOWCSSpec(spec: unknown): spec is OWCSSpec {
    return this.validateSpec(spec).valid;
  }
}

/**
 * Convenience function to validate OWCS spec
 * @param spec - The spec to validate
 * @param version - Schema version to use (defaults to 'latest')
 */
export function validateOWCSSpec(spec: unknown, version?: SchemaVersion): { valid: boolean; errors?: string[] } {
  const validator = new OWCSValidator(version);
  return validator.validateSpec(spec);
}

/**
 * Convenience function to validate OWCS file
 * @param filePath - Path to the file to validate
 * @param version - Schema version to use (defaults to 'latest')
 */
export function validateOWCSFile(filePath: string, version?: SchemaVersion): { valid: boolean; errors?: string[] } {
  const validator = new OWCSValidator(version);
  return validator.validateFile(filePath);
}
