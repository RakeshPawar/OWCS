import { OWCSSpec, JSONSchema, OWCSComponent, OWCSEvent } from '../model/intermediate.js';

/**
 * OpenAPI 3.1 specification structure (partial)
 */
export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  paths: Record<string, PathItem>;
  components?: {
    schemas?: Record<string, JSONSchema>;
  };
}

export interface PathItem {
  post?: Operation;
}

export interface Operation {
  summary?: string;
  description?: string;
  operationId?: string;
  requestBody?: RequestBody;
  responses: Record<string, Response>;
  callbacks?: Record<string, Callback>;
}

export interface RequestBody {
  description?: string;
  required?: boolean;
  content: {
    'application/json': {
      schema: JSONSchema;
    };
  };
}

export interface Response {
  description: string;
  content?: {
    'application/json': {
      schema: JSONSchema;
    };
  };
}

export interface Callback {
  [expression: string]: PathItem;
}

/**
 * Converts OWCS specification to OpenAPI 3.1 specification
 */
export class OpenAPIConverter {
  /**
   * Converts OWCS spec to OpenAPI spec
   */
  public convert(owcsSpec: OWCSSpec): OpenAPISpec {
    const openApiSpec: OpenAPISpec = {
      openapi: '3.1.0',
      info: {
        title: owcsSpec.info.title,
        version: owcsSpec.info.version,
        description: owcsSpec.info.description || 'Web Components specification',
      },
      paths: {},
      components: {
        schemas: {},
      },
    };

    // Convert each web component to a path
    for (const [tagName, component] of Object.entries(owcsSpec.components.webComponents)) {
      const path = this.componentToPath(tagName, component);
      openApiSpec.paths[`/components/${tagName}`] = path;

      // Add schemas to components
      if (component.props?.schema) {
        openApiSpec.components!.schemas![`${tagName}-props`] = component.props.schema;
      }

      if (component.events) {
        for (const [eventName, event] of Object.entries(component.events)) {
          if (event.payload) {
            openApiSpec.components!.schemas![`${tagName}-${eventName}-payload`] = event.payload;
          }
        }
      }
    }

    return openApiSpec;
  }

  /**
   * Converts a web component to an OpenAPI path
   */
  private componentToPath(tagName: string, component: OWCSComponent): PathItem {
    const operation: Operation = {
      summary: `Interact with ${tagName} component`,
      description: `Send props to the ${tagName} web component`,
      operationId: `use${this.toPascalCase(tagName)}`,
      responses: {
        '200': {
          description: 'Component rendered successfully',
        },
      },
    };

    // Add request body for props
    if (component.props?.schema) {
      operation.requestBody = {
        description: 'Component properties',
        required: true,
        content: {
          'application/json': {
            schema: component.props.schema,
          },
        },
      };
    }

    // Add callbacks for events
    if (component.events && Object.keys(component.events).length > 0) {
      operation.callbacks = {};

      for (const [eventName, eventData] of Object.entries(component.events)) {
        const event = eventData as OWCSEvent;
        operation.callbacks[eventName] = {
          '{$request.body#/callbackUrl}': {
            post: {
              summary: `${eventName} event callback`,
              description: `Triggered when ${tagName} emits ${eventName} event`,
              requestBody: event.payload
                ? {
                    description: 'Event payload',
                    content: {
                      'application/json': {
                        schema: event.payload,
                      },
                    },
                  }
                : undefined,
              responses: {
                '200': {
                  description: 'Event received',
                },
              },
            },
          },
        };
      }
    }

    return { post: operation };
  }

  /**
   * Converts kebab-case to PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }
}

/**
 * Convenience function to convert OWCS to OpenAPI
 */
export function convertToOpenAPI(owcsSpec: OWCSSpec): OpenAPISpec {
  const converter = new OpenAPIConverter();
  return converter.convert(owcsSpec);
}
