/**
 * OWCS - Open Web Component Specification
 * 
 * Main entry point for the library
 */

// Adapters
export { AngularAdapter, analyzeAngularProject } from './adapters/angular/index.js';

// Core
export { SchemaBuilder, buildOWCSSpec } from './core/schema-builder.js';
export { YAMLWriter, toYAML, toJSON, writeOWCSSpec, OutputFormat } from './core/yaml-writer.js';
export { OWCSValidator, validateOWCSSpec, validateOWCSFile } from './core/validator.js';
export * from './core/ast-walker.js';

// Models
export * from './model/intermediate.js';

// OpenAPI
export { OpenAPIConverter, convertToOpenAPI, OpenAPISpec } from './openapi/converter.js';
