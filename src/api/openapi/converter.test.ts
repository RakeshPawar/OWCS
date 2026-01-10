import { describe, it, expect } from 'vitest';
import { OpenAPIConverter, convertToOpenAPI } from './converter.js';
import { OWCSSpec } from '../model/intermediate.js';

describe('OpenAPIConverter', () => {
  const createBasicSpec = (): OWCSSpec => ({
    owcs: '1.0.0',
    info: {
      title: 'Test Components',
      version: '1.0.0',
      description: 'Test description',
    },
    components: {
      webComponents: {},
    },
  });

  describe('convert', () => {
    it('should convert basic OWCS spec to OpenAPI', () => {
      const owcsSpec = createBasicSpec();
      const converter = new OpenAPIConverter();

      const openApiSpec = converter.convert(owcsSpec);

      expect(openApiSpec.openapi).toBe('3.1.0');
      expect(openApiSpec.info.title).toBe('Test Components');
      expect(openApiSpec.info.version).toBe('1.0.0');
      expect(openApiSpec.info.description).toBe('Test description');
      expect(openApiSpec.paths).toBeDefined();
      expect(openApiSpec.components).toBeDefined();
    });

    it('should use default description when not provided', () => {
      const owcsSpec: OWCSSpec = {
        owcs: '1.0.0',
        info: {
          title: 'Test',
          version: '1.0.0',
        },
        components: {
          webComponents: {},
        },
      };
      const converter = new OpenAPIConverter();

      const openApiSpec = converter.convert(owcsSpec);

      expect(openApiSpec.info.description).toBe('Web Components specification');
    });

    it('should convert component to path', () => {
      const owcsSpec: OWCSSpec = {
        owcs: '1.0.0',
        info: {
          title: 'Test',
          version: '1.0.0',
        },
        components: {
          webComponents: {
            'user-card': {
              tagName: 'user-card',
            },
          },
        },
      };
      const converter = new OpenAPIConverter();

      const openApiSpec = converter.convert(owcsSpec);

      expect(openApiSpec.paths['/components/user-card']).toBeDefined();
      expect(openApiSpec.paths['/components/user-card'].post).toBeDefined();
    });

    it('should include component props in request body', () => {
      const owcsSpec: OWCSSpec = {
        owcs: '1.0.0',
        info: {
          title: 'Test',
          version: '1.0.0',
        },
        components: {
          webComponents: {
            'user-card': {
              tagName: 'user-card',
              props: {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    age: { type: 'number' },
                  },
                  required: ['name'],
                },
              },
            },
          },
        },
      };
      const converter = new OpenAPIConverter();

      const openApiSpec = converter.convert(owcsSpec);
      const operation = openApiSpec.paths['/components/user-card'].post!;

      expect(operation.requestBody).toBeDefined();
      expect(operation.requestBody?.required).toBe(true);
      expect(operation.requestBody?.content['application/json'].schema).toEqual({
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['name'],
      });
    });

    it('should add props schema to components schemas', () => {
      const owcsSpec: OWCSSpec = {
        owcs: '1.0.0',
        info: {
          title: 'Test',
          version: '1.0.0',
        },
        components: {
          webComponents: {
            'user-card': {
              tagName: 'user-card',
              props: {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      };
      const converter = new OpenAPIConverter();

      const openApiSpec = converter.convert(owcsSpec);

      expect(openApiSpec.components?.schemas?.['user-card-props']).toBeDefined();
      expect(openApiSpec.components?.schemas?.['user-card-props']).toEqual({
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      });
    });

    it('should include events as callbacks', () => {
      const owcsSpec: OWCSSpec = {
        owcs: '1.0.0',
        info: {
          title: 'Test',
          version: '1.0.0',
        },
        components: {
          webComponents: {
            'user-card': {
              tagName: 'user-card',
              events: {
                userClick: {
                  type: 'CustomEvent',
                  payload: {
                    type: 'object',
                    properties: {
                      userId: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      };
      const converter = new OpenAPIConverter();

      const openApiSpec = converter.convert(owcsSpec);
      const operation = openApiSpec.paths['/components/user-card'].post!;

      expect(operation.callbacks).toBeDefined();
      expect(operation.callbacks?.userClick).toBeDefined();
      expect(operation.callbacks?.userClick['{$request.body#/callbackUrl}']).toBeDefined();
    });

    it('should add event payload schema to components schemas', () => {
      const owcsSpec: OWCSSpec = {
        owcs: '1.0.0',
        info: {
          title: 'Test',
          version: '1.0.0',
        },
        components: {
          webComponents: {
            'user-card': {
              tagName: 'user-card',
              events: {
                userClick: {
                  type: 'CustomEvent',
                  payload: {
                    type: 'object',
                    properties: {
                      userId: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      };
      const converter = new OpenAPIConverter();

      const openApiSpec = converter.convert(owcsSpec);

      expect(openApiSpec.components?.schemas?.['user-card-userClick-payload']).toBeDefined();
      expect(openApiSpec.components?.schemas?.['user-card-userClick-payload']).toEqual({
        type: 'object',
        properties: {
          userId: { type: 'string' },
        },
      });
    });

    it('should generate PascalCase operationId from kebab-case tag name', () => {
      const owcsSpec: OWCSSpec = {
        owcs: '1.0.0',
        info: {
          title: 'Test',
          version: '1.0.0',
        },
        components: {
          webComponents: {
            'user-card': {
              tagName: 'user-card',
            },
          },
        },
      };
      const converter = new OpenAPIConverter();

      const openApiSpec = converter.convert(owcsSpec);
      const operation = openApiSpec.paths['/components/user-card'].post!;

      expect(operation.operationId).toBe('useUserCard');
    });

    it('should handle multiple components', () => {
      const owcsSpec: OWCSSpec = {
        owcs: '1.0.0',
        info: {
          title: 'Test',
          version: '1.0.0',
        },
        components: {
          webComponents: {
            'user-card': {
              tagName: 'user-card',
            },
            'profile-widget': {
              tagName: 'profile-widget',
            },
          },
        },
      };
      const converter = new OpenAPIConverter();

      const openApiSpec = converter.convert(owcsSpec);

      expect(openApiSpec.paths['/components/user-card']).toBeDefined();
      expect(openApiSpec.paths['/components/profile-widget']).toBeDefined();
      expect(openApiSpec.paths['/components/profile-widget'].post?.operationId).toBe('useProfileWidget');
    });

    it('should handle component with both props and events', () => {
      const owcsSpec: OWCSSpec = {
        owcs: '1.0.0',
        info: {
          title: 'Test',
          version: '1.0.0',
        },
        components: {
          webComponents: {
            'user-card': {
              tagName: 'user-card',
              props: {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                  },
                },
              },
              events: {
                click: {
                  type: 'Event',
                },
              },
            },
          },
        },
      };
      const converter = new OpenAPIConverter();

      const openApiSpec = converter.convert(owcsSpec);
      const operation = openApiSpec.paths['/components/user-card'].post!;

      expect(operation.requestBody).toBeDefined();
      expect(operation.callbacks).toBeDefined();
    });

    it('should handle event without payload', () => {
      const owcsSpec: OWCSSpec = {
        owcs: '1.0.0',
        info: {
          title: 'Test',
          version: '1.0.0',
        },
        components: {
          webComponents: {
            'simple-button': {
              tagName: 'simple-button',
              events: {
                click: {
                  type: 'Event',
                },
              },
            },
          },
        },
      };
      const converter = new OpenAPIConverter();

      const openApiSpec = converter.convert(owcsSpec);
      const operation = openApiSpec.paths['/components/simple-button'].post!;
      const callback = operation.callbacks?.click['{$request.body#/callbackUrl}'].post;

      expect(callback).toBeDefined();
      expect(callback?.requestBody).toBeUndefined();
    });

    it('should include standard responses', () => {
      const owcsSpec: OWCSSpec = {
        owcs: '1.0.0',
        info: {
          title: 'Test',
          version: '1.0.0',
        },
        components: {
          webComponents: {
            'user-card': {
              tagName: 'user-card',
            },
          },
        },
      };
      const converter = new OpenAPIConverter();

      const openApiSpec = converter.convert(owcsSpec);
      const operation = openApiSpec.paths['/components/user-card'].post!;

      expect(operation.responses['200']).toBeDefined();
      expect(operation.responses['200'].description).toBe('Component rendered successfully');
    });

    it('should set operation summary and description', () => {
      const owcsSpec: OWCSSpec = {
        owcs: '1.0.0',
        info: {
          title: 'Test',
          version: '1.0.0',
        },
        components: {
          webComponents: {
            'user-card': {
              tagName: 'user-card',
            },
          },
        },
      };
      const converter = new OpenAPIConverter();

      const openApiSpec = converter.convert(owcsSpec);
      const operation = openApiSpec.paths['/components/user-card'].post!;

      expect(operation.summary).toBe('Interact with user-card component');
      expect(operation.description).toBe('Send props to the user-card web component');
    });

    it('should handle empty web components', () => {
      const owcsSpec = createBasicSpec();
      const converter = new OpenAPIConverter();

      const openApiSpec = converter.convert(owcsSpec);

      expect(openApiSpec.paths).toEqual({});
      expect(openApiSpec.components?.schemas).toEqual({});
    });

    it('should handle multiple events', () => {
      const owcsSpec: OWCSSpec = {
        owcs: '1.0.0',
        info: {
          title: 'Test',
          version: '1.0.0',
        },
        components: {
          webComponents: {
            'user-card': {
              tagName: 'user-card',
              events: {
                click: {
                  type: 'Event',
                },
                hover: {
                  type: 'Event',
                },
                submit: {
                  type: 'CustomEvent',
                  payload: {
                    type: 'object',
                    properties: {
                      data: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      };
      const converter = new OpenAPIConverter();

      const openApiSpec = converter.convert(owcsSpec);
      const operation = openApiSpec.paths['/components/user-card'].post!;

      expect(operation.callbacks?.click).toBeDefined();
      expect(operation.callbacks?.hover).toBeDefined();
      expect(operation.callbacks?.submit).toBeDefined();
      expect(openApiSpec.components?.schemas?.['user-card-submit-payload']).toBeDefined();
    });
  });

  describe('convertToOpenAPI convenience function', () => {
    it('should convert using convenience function', () => {
      const owcsSpec = createBasicSpec();
      owcsSpec.components.webComponents['test-component'] = {
        tagName: 'test-component',
      };

      const openApiSpec = convertToOpenAPI(owcsSpec);

      expect(openApiSpec.openapi).toBe('3.1.0');
      expect(openApiSpec.info.title).toBe('Test Components');
      expect(openApiSpec.paths['/components/test-component']).toBeDefined();
    });
  });
});
