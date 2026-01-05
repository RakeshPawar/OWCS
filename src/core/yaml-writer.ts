import * as yaml from 'js-yaml';
import * as fs from 'fs';
import { OWCSSpec } from '../model/intermediate';

/**
 * Output format for OWCS specification
 */
export type OutputFormat = 'yaml' | 'json';

/**
 * Writes OWCS specification to file or returns as string
 */
export class YAMLWriter {
  /**
   * Converts OWCS spec to YAML string
   */
  public toYAML(spec: OWCSSpec): string {
    return yaml.dump(spec, {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
      sortKeys: false,
    });
  }
  
  /**
   * Converts OWCS spec to JSON string
   */
  public toJSON(spec: OWCSSpec): string {
    return JSON.stringify(spec, null, 2);
  }
  
  /**
   * Converts OWCS spec to specified format
   */
  public toString(spec: OWCSSpec, format: OutputFormat): string {
    if (format === 'yaml') {
      return this.toYAML(spec);
    } else {
      return this.toJSON(spec);
    }
  }
  
  /**
   * Writes OWCS spec to file
   */
  public writeToFile(spec: OWCSSpec, filePath: string, format: OutputFormat): void {
    const content = this.toString(spec, format);
    fs.writeFileSync(filePath, content, 'utf-8');
  }
}

/**
 * Convenience functions
 */
export function toYAML(spec: OWCSSpec): string {
  const writer = new YAMLWriter();
  return writer.toYAML(spec);
}

export function toJSON(spec: OWCSSpec): string {
  const writer = new YAMLWriter();
  return writer.toJSON(spec);
}

export function writeOWCSSpec(spec: OWCSSpec, filePath: string, format: OutputFormat = 'yaml'): void {
  const writer = new YAMLWriter();
  writer.writeToFile(spec, filePath, format);
}
