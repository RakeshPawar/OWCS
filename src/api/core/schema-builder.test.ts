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
            modulePath: './src/user-card.component.ts',
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

      const spec = buildOWCSSpec(model);

      expect(spec.runtime).toBeDefined();
      expect(spec.runtime?.bundler?.name).toBe('webpack');
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
            modulePath: './src/user-card.component.ts',
            props: [],
            events: [],
          },
        ],
      };

      const spec = buildOWCSSpec(model);

      expect(spec.runtime?.bundler?.moduleFederation).toBeDefined();
      expect(spec.runtime?.bundler?.moduleFederation?.remoteName).toBe('myRemote');
      expect(spec.runtime?.bundler?.moduleFederation?.libraryType).toBe('module');
      expect(spec.runtime?.bundler?.moduleFederation?.exposes).toEqual({
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
            modulePath: './src/user-card.component.ts',
            props: [
              {
                name: 'name',
                required: true,
                schema: {
                  type: 'string',
                  description: 'User name',
                },
                source: 'input'
              },
              {
                name: 'age',
                required: false,
                schema: {
                  type: 'number',
                  description: 'User age',
                },
                source: 'input'
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
          bundler: 'webpack'
        },
        components: [
          {
            tagName: 'user-card',
            className: 'UserCardComponent',
            modulePath: './src/user-card.component.ts',
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
                source: 'dispatchEvent'
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

    it('should link component to exposed module', () => {
      const model: IntermediateModel = {
        runtime: {
          bundler: 'webpack',
          federation: {
            remoteName: 'myRemote',
            libraryType: 'module',
            exposes: {
              './user-card': './src/user-card.wc.ts',
            },
          },
        },
        components: [
          {
            tagName: 'user-card',
            className: 'UserCardComponent',
            modulePath: './src/user-card.wc.ts',
            props: [],
            events: [],
          },
        ],
      };

      const spec = buildOWCSSpec(model);
      const component = spec.components.webComponents['user-card'];

      expect(component.module).toBe('./user-card');
    });

    it('should handle empty props without required field', () => {
      const model: IntermediateModel = {
        runtime: {
          bundler: 'webpack'
        },
        components: [
          {
            tagName: 'simple-component',
            className: 'SimpleComponent',
            modulePath: './src/simple.component.ts',
            props: [
              {
                name: 'title',
                required: false,
                schema: {
                  type: 'string',
                },
                source: 'input'
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
          bundler: 'webpack'
        },
        components: [
          {
            tagName: 'user-card',
            className: 'UserCardComponent',
            modulePath: './src/user-card.component.ts',
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
          bundler: 'webpack'
        },
        components: [],
      };

      const spec = buildOWCSSpec(model);

      expect(spec.info.title).toBe('Web Components');
    });
  });

  describe('SchemaBuilder class', () => {
    it('should create instance and build spec', () => {
      const builder = new SchemaBuilder();
      const model: IntermediateModel = {
        runtime: {
          bundler: 'webpack'
        },
        components: [],
      };

      const spec = builder.build(model);

      expect(spec).toBeDefined();
      expect(spec.owcs).toBe('1.0.0');
    });
  });
});
