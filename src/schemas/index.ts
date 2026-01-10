/**
 * Schema version management for OWCS
 * This module provides centralized access to different versions of the OWCS schema
 */

import schemaV1 from './v1/owcs-schema-v1.0.0.json' with { type: 'json' };

export type SchemaVersion = '1.0.0' | 'latest';

/**
 * Map of available schema versions
 */
export const AVAILABLE_SCHEMAS = {
  '1.0.0': schemaV1,
  'latest': schemaV1,
} as const;

/**
 * Default schema version
 */
export const DEFAULT_SCHEMA_VERSION: SchemaVersion = 'latest';

/**
 * Get schema by version
 * @param version - Schema version to retrieve (defaults to 'latest')
 * @returns The schema object for the specified version
 * @throws Error if version not found
 */
export function getSchema(version: SchemaVersion = DEFAULT_SCHEMA_VERSION): any {
  const schema = AVAILABLE_SCHEMAS[version];
  
  if (!schema) {
    const available = Object.keys(AVAILABLE_SCHEMAS).join(', ');
    throw new Error(
      `Schema version '${version}' not found. Available versions: ${available}`
    );
  }
  
  return schema;
}

/**
 * Check if a schema version is available
 * @param version - Version to check
 * @returns true if the version exists
 */
export function hasSchema(version: string): version is SchemaVersion {
  return version in AVAILABLE_SCHEMAS;
}

/**
 * Get all available schema versions
 * @returns Array of available schema version strings
 */
export function getAvailableVersions(): SchemaVersion[] {
  return Object.keys(AVAILABLE_SCHEMAS) as SchemaVersion[];
}

/**
 * Get the latest schema version
 * @returns The latest schema object
 */
export function getLatestSchema(): any {
  return AVAILABLE_SCHEMAS.latest;
}
