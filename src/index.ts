/**
 * OWCS - Open Web Component Specification
 * 
 * Main entry point for the library
 */

// Adapters
export { AngularAdapter, analyzeAngularProject } from './adapters/angular';

// Core
export { SchemaBuilder, buildOWCSSpec } from './core/schema-builder';
export { YAMLWriter, toYAML, toJSON, writeOWCSSpec, OutputFormat } from './core/yaml-writer';
export { OWCSValidator, validateOWCSSpec, validateOWCSFile } from './core/validator';
export * from './core/ast-walker';

// Models
export * from './model/intermediate';

// OpenAPI
export { OpenAPIConverter, convertToOpenAPI, OpenAPISpec } from './openapi/converter';
