/**
 * TypeScript code generator for OWCS schemas
 * Converts OWCS schema definitions to TypeScript code
 */

import type { JSONSchema } from '../model/intermediate.js';

/**
 * Options for TypeScript generation
 */
export interface TypeScriptGeneratorOptions {
  /** Include optional fields with '?' syntax */
  includeOptional?: boolean;
  /** Add JSDoc comments */
  includeComments?: boolean;
  /** Indentation (number of spaces) */
  indent?: number;
}

/**
 * Convert simple schema type to TypeScript type
 */
function schemaTypeToTS(type: string): string {
  switch (type) {
    case 'string':
      return 'string';
    case 'number':
    case 'integer':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'null':
      return 'null';
    case 'array':
      return 'unknown[]';
    case 'object':
      return 'object';
    case 'any':
      return 'any';
    default:
      return 'unknown';
  }
}

/**
 * Convert object schema to TypeScript interface definition
 */
function objectSchemaToTypeScript(schema: JSONSchema, options: TypeScriptGeneratorOptions, level = 0): string {
  const { includeOptional = true, indent = 2 } = options;
  const properties = schema.properties || {};
  const required = schema.required || [];

  const indentStr = ' '.repeat(indent * level); // indentation for current block
  const innerIndentStr = ' '.repeat(indent * (level + 1)); // indentation for properties

  const lines = ['{'];

  for (const [key, propSchema] of Object.entries(properties)) {
    const isRequired = required.includes(key);
    const optional = includeOptional && !isRequired ? '?' : '';
    const propType = schemaToTypeScript(propSchema as JSONSchema, options, level + 1);

    // Add description as comment if available
    if (options.includeComments && (propSchema as JSONSchema).description) {
      lines.push(`${innerIndentStr}/** ${(propSchema as JSONSchema).description} */`);
    }

    lines.push(`${innerIndentStr}${key}${optional}: ${propType};`);
  }

  lines.push(`${indentStr}}`);
  return lines.join('\n');
}

/**
 * Convert JSON Schema to TypeScript type definition
 */
export function schemaToTypeScript(schema: JSONSchema, options: TypeScriptGeneratorOptions = {}, level = 0): string {
  if (!schema) {
    return 'unknown';
  }

  // Handle oneOf - generate union type
  if (schema.oneOf && Array.isArray(schema.oneOf)) {
    return schema.oneOf.map((s) => schemaToTypeScript(s, options, level)).join(' | ');
  }

  // Handle anyOf - generate union type
  if (schema.anyOf && Array.isArray(schema.anyOf)) {
    return schema.anyOf.map((s) => schemaToTypeScript(s, options, level)).join(' | ');
  }

  // Handle allOf - for now, just use the first one (proper merge would be complex)
  if (schema.allOf && Array.isArray(schema.allOf) && schema.allOf.length > 0) {
    return schemaToTypeScript(schema.allOf[0], options, level);
  }

  if (schema.enum && Array.isArray(schema.enum)) {
    return schema.enum.map((v) => JSON.stringify(v)).join(' | ');
  }

  if (Array.isArray(schema.type)) {
    return schema.type.map((t) => schemaTypeToTS(t)).join(' | ');
  }

  const type = schema.type as string;

  switch (type) {
    case 'string':
      return 'string';
    case 'number':
    case 'integer':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'null':
      return 'null';
    case 'any':
      return 'any';
    case 'array':
      if (schema.items) {
        const itemType = schemaToTypeScript(schema.items, options, level);
        return `${itemType}[]`;
      }
      return 'unknown[]';
    case 'object':
      if (schema.properties) {
        return objectSchemaToTypeScript(schema, options, level);
      }
      return 'Record<string, unknown>';
    default:
      return 'unknown';
  }
}

/**
 * Generate TypeScript interface for props
 */
export function generatePropsInterface(componentName: string, propsSchema: JSONSchema, options: TypeScriptGeneratorOptions = {}): string {
  const interfaceName = `${toPascalCase(componentName)}Props`;
  const typeDefinition = schemaToTypeScript(propsSchema, options);

  return `interface ${interfaceName} ${typeDefinition}`;
}

/**
 * Generate TypeScript type for events
 */
export function generateEventsType(
  componentName: string,
  events: Record<string, { type: string; payload?: JSONSchema }>,
  options: TypeScriptGeneratorOptions = {}
): string {
  const lines: string[] = [];
  const payloadInterfaces: string[] = [];
  const indent = ' '.repeat(options.indent || 2);

  for (const [eventName, eventDef] of Object.entries(events)) {
    let payloadType: string;

    if (eventDef.payload) {
      // If payload schema is an object with properties, create a separate interface
      if (eventDef.payload.type === 'object' && eventDef.payload.properties) {
        const payloadInterfaceName = `${toPascalCase(eventName)}Payload`;
        const typeDefinition = schemaToTypeScript(eventDef.payload, options);
        payloadInterfaces.push(`interface ${payloadInterfaceName} ${typeDefinition}`);
        payloadType = payloadInterfaceName;
      } else {
        // For simple types, inline them
        payloadType = schemaToTypeScript(eventDef.payload, options);
      }
    } else {
      payloadType = 'void';
    }

    lines.push(`${indent}${eventName}: ${eventDef.type}<${payloadType}>;`);
  }

  if (lines.length === 0) {
    return `type ${toPascalCase(componentName)}Events = Record<string, never>;`;
  }

  const result: string[] = [];

  // Add payload interfaces first
  if (payloadInterfaces.length > 0) {
    result.push(...payloadInterfaces);
    result.push('');
  }

  // Add events type
  result.push(`type ${toPascalCase(componentName)}Events = {\n${lines.join('\n')}\n};`);

  return result.join('\n');
}

/**
 * Convert kebab-case or snake_case to PascalCase
 */
function toPascalCase(str: string): string {
  return str
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

/**
 * Generate complete TypeScript code for a component
 */
export function generateComponentTypes(
  tagName: string,
  propsSchema: JSONSchema,
  events: Record<string, { type: string; payload?: JSONSchema }>,
  options: TypeScriptGeneratorOptions = {}
): string {
  const lines: string[] = [];

  // Generate props interface
  if (propsSchema && propsSchema.properties && Object.keys(propsSchema.properties).length > 0) {
    lines.push(generatePropsInterface(tagName, propsSchema, options));
    lines.push('');
  }

  // Generate events type
  if (events && Object.keys(events).length > 0) {
    lines.push(generateEventsType(tagName, events, options));
  }

  return lines.join('\n');
}
