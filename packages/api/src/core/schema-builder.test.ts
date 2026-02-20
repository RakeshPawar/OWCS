import { describe, it, expect } from 'vitest';
import { SchemaBuilder, buildOWCSSpec } from './schema-builder.js';
import { IntermediateModel, WebComponentModel } from '../model/intermediate.js';

describe('SchemaBuilder', () => {
  describe('buildOWCSSpec', () => {
    it('should build a basic OWCS spec', () => {
      const model: IntermediateModel = {
        runtime: {
          bundler: 'webpack',
        },
        components: [
          {
            tagName: 'user-card',
            className: 'UserCardComponent',
            props: [],
            events: [],
          },
        ],
      };

      const spec = buildOWCSSpec(model);

      expect(spec.owcs).toBe('1.0.0');
      expect(spec.info.title).toBeDefined();
      expect(spec.info.version).toBe('1.0.0');
      expect(spec.components.webComponents).toHaveProperty('user-card');
      expect(spec.components.webComponents['user-card'].tagName).toBe('user-card');
    });

    it('should build spec with custom info', () => {
      const model: IntermediateModel = {
        runtime: {
          bundler: 'webpack',
        },
        components: [],
      };

      const spec = buildOWCSSpec(model, {
        title: 'My Components',
        version: '2.0.0',
        description: 'Custom description',
      });

      expect(spec.info.title).toBe('My Components');
      expect(spec.info.version).toBe('2.0.0');
      expect(spec.info.description).toBe('Custom description');
    });

    it('should include runtime configuration with bundler', () => {
      const model: IntermediateModel = {
        runtime: {
          bundler: 'webpack',
        },
        components: [],
      };

      const spec = buildOWCSSpec(model, { includeRuntimeExtension: false });

      expect(spec.runtime).toBeUndefined();
    });

    it('should include module federation config', () => {
      const model: IntermediateModel = {
        runtime: {
          bundler: 'webpack',
          federation: {
            remoteName: 'myRemote',
            libraryType: 'module',
            exposes: {
              './UserCard': './src/user-card.wc.ts',
            },
          },
        },
        components: [
          {
            tagName: 'user-card',
            className: 'UserCardComponent',
            props: [],
            events: [],
          },
        ],
      };

      const spec = buildOWCSSpec(model, { includeRuntimeExtension: true });

      expect(spec['x-owcs-runtime']?.bundler?.moduleFederation).toBeDefined();
      expect(spec['x-owcs-runtime']?.bundler?.moduleFederation?.remoteName).toBe('myRemote');
      expect(spec['x-owcs-runtime']?.bundler?.moduleFederation?.libraryType).toBe('module');
      expect(spec['x-owcs-runtime']?.bundler?.moduleFederation?.exposes).toEqual({
        './UserCard': './src/user-card.wc.ts',
      });
    });

    it('should build component with props schema', () => {
      const model: IntermediateModel = {
        runtime: {
          bundler: 'webpack',
        },
        components: [
          {
            tagName: 'user-card',
            className: 'UserCardComponent',
            props: [
              {
                name: 'name',
                required: true,
                schema: {
                  type: 'string',
                  description: 'User name',
                },
                source: 'input',
              },
              {
                name: 'age',
                required: false,
                schema: {
                  type: 'number',
                  description: 'User age',
                },
                source: 'input',
              },
            ],
            events: [],
          },
        ],
      };

      const spec = buildOWCSSpec(model);
      const component = spec.components.webComponents['user-card'];

      expect(component.props).toBeDefined();
      expect(component.props?.schema.type).toBe('object');
      expect(component.props?.schema.properties).toHaveProperty('name');
      expect(component.props?.schema.properties).toHaveProperty('age');
      expect(component.props?.schema.required).toEqual(['name']);
      expect(component.props?.schema.properties?.name.type).toBe('string');
      expect(component.props?.schema.properties?.name.description).toBe('User name');
    });

    it('should build component with events', () => {
      const model: IntermediateModel = {
        runtime: {
          bundler: 'webpack',
        },
        components: [
          {
            tagName: 'user-card',
            className: 'UserCardComponent',
            props: [],
            events: [
              {
                name: 'userClick',
                type: 'CustomEvent',
                payloadSchema: {
                  type: 'object',
                  properties: {
                    userId: { type: 'string' },
                  },
                },
                source: 'dispatchEvent',
              },
            ],
          },
        ],
      };

      const spec = buildOWCSSpec(model);
      const component = spec.components.webComponents['user-card'];

      expect(component.events).toBeDefined();
      expect(component.events).toHaveProperty('userClick');
      expect(component.events?.userClick.type).toBe('CustomEvent');
      expect(component.events?.userClick.payload).toBeDefined();
      expect(component.events?.userClick.payload?.type).toBe('object');
    });

    it('should handle empty props without required field', () => {
      const model: IntermediateModel = {
        runtime: {
          bundler: 'webpack',
        },
        components: [
          {
            tagName: 'simple-component',
            className: 'SimpleComponent',
            props: [
              {
                name: 'title',
                required: false,
                schema: {
                  type: 'string',
                },
                source: 'input',
              },
            ],
            events: [],
          },
        ],
      };

      const spec = buildOWCSSpec(model);
      const component = spec.components.webComponents['simple-component'];

      expect(component.props?.schema.required).toBeUndefined();
    });

    it('should infer title from remote name', () => {
      const model: IntermediateModel = {
        runtime: {
          bundler: 'webpack',
          federation: {
            remoteName: 'MyRemote',
            libraryType: 'module',
            exposes: {},
          },
        },
        components: [],
      };

      const spec = buildOWCSSpec(model);

      expect(spec.info.title).toBe('MyRemote');
    });

    it('should infer title from component class name', () => {
      const model: IntermediateModel = {
        runtime: {
          bundler: 'webpack',
        },
        components: [
          {
            tagName: 'user-card',
            className: 'UserCardComponent',
            props: [],
            events: [],
          },
        ],
      };

      const spec = buildOWCSSpec(model);

      expect(spec.info.title).toBe('UserCardComponent Components');
    });

    it('should use default title when no context available', () => {
      const model: IntermediateModel = {
        runtime: {
          bundler: 'webpack',
        },
        components: [],
      };

      const spec = buildOWCSSpec(model);

      expect(spec.info.title).toBe('Web Components');
    });

    it('should add custom extensions to spec', () => {
      const model: IntermediateModel = {
        runtime: {
          bundler: 'webpack',
        },
        components: [],
      };

      const spec = buildOWCSSpec(model, {
        extensions: {
          'x-owner': 'platform-team',
          'x-version': '2.0.0',
          'x-repo': 'https://github.com/org/repo',
        },
      });

      expect(spec['x-owner']).toBe('platform-team');
      expect(spec['x-version']).toBe('2.0.0');
      expect(spec['x-repo']).toBe('https://github.com/org/repo');
    });

    it('should support different extension value types', () => {
      const model: IntermediateModel = {
        runtime: {
          bundler: 'webpack',
        },
        components: [],
      };

      const spec = buildOWCSSpec(model, {
        extensions: {
          'x-string': 'value',
          'x-number': 123,
          'x-boolean': true,
        },
      });

      expect(spec['x-string']).toBe('value');
      expect(spec['x-number']).toBe(123);
      expect(spec['x-boolean']).toBe(true);
    });

    it('should throw error when extension keys do not start with x-', () => {
      const model: IntermediateModel = {
        runtime: {
          bundler: 'webpack',
        },
        components: [],
      };

      expect(() => {
        buildOWCSSpec(model, {
          extensions: {
            'x-valid': 'ok',
            invalid: 'bad',
          },
        });
      }).toThrow(/Invalid extension keys: invalid/);
    });

    it('should throw error for multiple invalid extension keys', () => {
      const model: IntermediateModel = {
        runtime: {
          bundler: 'webpack',
        },
        components: [],
      };

      expect(() => {
        buildOWCSSpec(model, {
          extensions: {
            'x-valid': 'ok',
            invalid1: 'bad',
            invalid2: 'bad',
          },
        });
      }).toThrow(/Invalid extension keys/);
      expect(() => {
        buildOWCSSpec(model, {
          extensions: {
            'x-valid': 'ok',
            invalid1: 'bad',
            invalid2: 'bad',
          },
        });
      }).toThrow(/invalid1/);
      expect(() => {
        buildOWCSSpec(model, {
          extensions: {
            'x-valid': 'ok',
            invalid1: 'bad',
            invalid2: 'bad',
          },
        });
      }).toThrow(/invalid2/);
    });

    it('should allow both custom extensions and runtime extension', () => {
      const model: IntermediateModel = {
        runtime: {
          bundler: 'webpack',
          federation: {
            remoteName: 'myRemote',
            libraryType: 'module',
            exposes: {},
          },
        },
        components: [],
      };

      const spec = buildOWCSSpec(model, {
        extensions: {
          'x-owner': 'team',
        },
        includeRuntimeExtension: true,
      });

      expect(spec['x-owner']).toBe('team');
      expect(spec['x-owcs-runtime']).toBeDefined();
      expect(spec['x-owcs-runtime']?.bundler?.name).toBe('webpack');
    });

    it('should handle empty extensions object', () => {
      const model: IntermediateModel = {
        runtime: {
          bundler: 'webpack',
        },
        components: [],
      };

      const spec = buildOWCSSpec(model, {
        extensions: {},
      });

      expect(spec).toBeDefined();
      expect(spec.owcs).toBe('1.0.0');
    });
  });

  describe('SchemaBuilder class', () => {
    it('should create instance and build spec', () => {
      const builder = new SchemaBuilder();
      const model: IntermediateModel = {
        runtime: {
          bundler: 'webpack',
        },
        components: [],
      };

      const spec = builder.build(model);

      expect(spec).toBeDefined();
      expect(spec.owcs).toBe('1.0.0');
    });
  });
});
