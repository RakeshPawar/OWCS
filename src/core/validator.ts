import Ajv from 'ajv';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { OWCSSpec } from '../model/intermediate';
import owcsSchema from '../owcs.schema.json';

/**
 * Validates OWCS specifications against the schema
 */
export class OWCSValidator {
  private ajv: Ajv;
  private validate: any;
  
  constructor() {
    this.ajv = new Ajv({
      allErrors: true,
      strict: false,
      validateFormats: true,
    });
    
    this.validate = this.ajv.compile(owcsSchema);
  }
  
  /**
   * Validates an OWCS spec object
   */
  public validateSpec(spec: unknown): { valid: boolean; errors?: string[] } {
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
 */
export function validateOWCSSpec(spec: unknown): { valid: boolean; errors?: string[] } {
  const validator = new OWCSValidator();
  return validator.validateSpec(spec);
}

/**
 * Convenience function to validate OWCS file
 */
export function validateOWCSFile(filePath: string): { valid: boolean; errors?: string[] } {
  const validator = new OWCSValidator();
  return validator.validateFile(filePath);
}
