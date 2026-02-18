/**
 * Utility functions for the OWCS viewer component
 */

import type { OWCSValidator } from '@owcs/api';

/**
 * Fetch YAML content from a URL
 */
export async function fetchYamlFromUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch YAML: ${response.statusText}`);
    }
    return await response.text();
  } catch (error) {
    throw new Error(`Error fetching YAML from URL: ${error}`);
  }
}

/**
 * Parse YAML string to object
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function parseYaml(yamlString: string): Promise<any> {
  try {
    // Dynamically import js-yaml to avoid bundling issues
    const jsYaml = await import('js-yaml');
    return jsYaml.load(yamlString);
  } catch (error) {
    throw new Error(`Failed to parse YAML: ${error}`);
  }
}

/**
 * Validate OWCS specification
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function validateOwcsSpec(spec: any, validator: OWCSValidator): Promise<void> {
  const result = validator.validateSpec(spec);
  if (!result.valid) {
    const errors = result.errors?.map((e) => e).join(', ') || 'Unknown validation error';
    throw new Error(`OWCS validation failed: ${errors}`);
  }
}

/**
 * Filter components by search query (tag name)
 */
export function filterComponentsByTagName(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  components: Record<string, any>,
  searchQuery: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<string, any> {
  if (!searchQuery.trim()) {
    return components;
  }

  const query = searchQuery.toLowerCase().trim();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filtered: Record<string, any> = {};

  for (const [key, component] of Object.entries(components)) {
    const tagName = component.tagName?.toLowerCase() || '';
    if (tagName.includes(query)) {
      filtered[key] = component;
    }
  }

  return filtered;
}
