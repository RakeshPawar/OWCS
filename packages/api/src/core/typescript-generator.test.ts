import { describe, it, expect } from 'vitest';
import { schemaToTypeScript, generatePropsInterface, generateEventsType, generateComponentTypes, TypeScriptGeneratorOptions } from './typescript-generator.js';
import type { JSONSchema } from '../model/intermediate.js';

describe('TypeScript Generator', () => {
  describe('schemaToTypeScript', () => {
    it('should convert string type', () => {
      const schema: JSONSchema = { type: 'string' };
      expect(schemaToTypeScript(schema)).toBe('string');
    });

    it('should convert number type', () => {
      const schema: JSONSchema = { type: 'number' };
      expect(schemaToTypeScript(schema)).toBe('number');
    });

    it('should convert integer type to number', () => {
      const schema: JSONSchema = { type: 'integer' };
      expect(schemaToTypeScript(schema)).toBe('number');
    });

    it('should convert boolean type', () => {
      const schema: JSONSchema = { type: 'boolean' };
      expect(schemaToTypeScript(schema)).toBe('boolean');
    });

    it('should convert null type', () => {
      const schema: JSONSchema = { type: 'null' };
      expect(schemaToTypeScript(schema)).toBe('null');
    });

    it('should convert array type without items to unknown[]', () => {
      const schema: JSONSchema = { type: 'array' };
      expect(schemaToTypeScript(schema)).toBe('unknown[]');
    });

    it('should convert array type with items', () => {
      const schema: JSONSchema = {
        type: 'array',
        items: { type: 'string' },
      };
      expect(schemaToTypeScript(schema)).toBe('string[]');
    });

    it('should convert enum to union type', () => {
      const schema: JSONSchema = {
        type: 'string',
        enum: ['light', 'dark', 'auto'],
      };
      expect(schemaToTypeScript(schema)).toBe('"light" | "dark" | "auto"');
    });

    it('should convert union types', () => {
      const schema: JSONSchema = {
        type: ['string', 'number'],
      };
      expect(schemaToTypeScript(schema)).toBe('string | number');
    });

    it('should convert simple object without properties to Record<string, unknown>', () => {
      const schema: JSONSchema = { type: 'object' };
      expect(schemaToTypeScript(schema)).toBe('Record<string, unknown>');
    });

    it('should convert object with properties', () => {
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['name'],
      };
      const result = schemaToTypeScript(schema);
      expect(result).toContain('name: string;');
      expect(result).toContain('age?: number;');
    });

    it('should handle nested objects', () => {
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              email: { type: 'string' },
            },
            required: ['name'],
          },
        },
      };
      const result = schemaToTypeScript(schema);
      expect(result).toContain('user?:');
      expect(result).toContain('name: string;');
      expect(result).toContain('email?: string;');
    });

    it('should handle unknown type for unsupported types', () => {
      const schema: JSONSchema = { type: 'invalid' };
      expect(schemaToTypeScript(schema)).toBe('unknown');
    });

    it('should handle null schema', () => {
      expect(schemaToTypeScript(null as any)).toBe('unknown');
    });

    it('should handle schema with includeOptional=false', () => {
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['name'],
      };
      const options: TypeScriptGeneratorOptions = { includeOptional: false };
      const result = schemaToTypeScript(schema, options);
      expect(result).toContain('name: string;');
      expect(result).toContain('age: number;');
      expect(result).not.toContain('?');
    });

    it('should include JSDoc comments when includeComments is true', () => {
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'User name' },
        },
      };
      const options: TypeScriptGeneratorOptions = { includeComments: true };
      const result = schemaToTypeScript(schema, options);
      expect(result).toContain('/** User name */');
    });

    it('should handle array of objects', () => {
      const schema: JSONSchema = {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
          },
        },
      };
      const result = schemaToTypeScript(schema);
      expect(result).toContain('id?:');
      expect(result).toContain('name?:');
      expect(result).toContain('[]');
    });

    it('should handle custom indentation', () => {
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      };
      const options: TypeScriptGeneratorOptions = { indent: 4 };
      const result = schemaToTypeScript(schema, options);
      expect(result).toContain('    name');
    });

    it('should handle type: any', () => {
      const schema: JSONSchema = { type: 'any' };
      expect(schemaToTypeScript(schema)).toBe('any');
    });

    it('should handle oneOf as union type', () => {
      const schema: JSONSchema = {
        oneOf: [{ type: 'string' }, { type: 'number' }],
      };
      expect(schemaToTypeScript(schema)).toBe('string | number');
    });

    it('should handle oneOf with null', () => {
      const schema: JSONSchema = {
        oneOf: [{ type: 'null' }, { type: 'string' }],
      };
      expect(schemaToTypeScript(schema)).toBe('null | string');
    });

    it('should handle anyOf as union type', () => {
      const schema: JSONSchema = {
        anyOf: [{ type: 'boolean' }, { type: 'string' }],
      };
      expect(schemaToTypeScript(schema)).toBe('boolean | string');
    });

    it('should handle allOf (using first schema)', () => {
      const schema: JSONSchema = {
        allOf: [{ type: 'string' }, { minLength: 5 }],
      };
      expect(schemaToTypeScript(schema)).toBe('string');
    });

    it('should handle oneOf with complex objects', () => {
      const schema: JSONSchema = {
        oneOf: [
          { type: 'null' },
          {
            type: 'object',
            properties: {
              id: { type: 'string' },
            },
          },
        ],
      };
      const result = schemaToTypeScript(schema);
      expect(result).toContain('null');
      expect(result).toContain('id?:');
    });
  });

  describe('generatePropsInterface', () => {
    it('should generate interface for simple props', () => {
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          userName: { type: 'string' },
          isActive: { type: 'boolean' },
        },
        required: ['userName'],
      };
      const result = generatePropsInterface('user-card', schema);
      expect(result).toContain('interface UserCardProps');
      expect(result).toContain('userName: string;');
      expect(result).toContain('isActive?: boolean;');
    });

    it('should convert kebab-case to PascalCase', () => {
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      };
      const result = generatePropsInterface('my-custom-component', schema);
      expect(result).toContain('interface MyCustomComponentProps');
    });

    it('should handle complex nested props', () => {
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          config: {
            type: 'object',
            properties: {
              endpoint: { type: 'string' },
              timeout: { type: 'number' },
            },
            required: ['endpoint'],
          },
        },
      };
      const result = generatePropsInterface('api-client', schema);
      expect(result).toContain('interface ApiClientProps');
      expect(result).toContain('config?:');
      expect(result).toContain('endpoint: string;');
      expect(result).toContain('timeout?: number;');
    });

    it('should handle props with enums', () => {
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          theme: {
            type: 'string',
            enum: ['light', 'dark', 'auto'],
          },
        },
      };
      const result = generatePropsInterface('themed-component', schema);
      expect(result).toContain('"light" | "dark" | "auto"');
    });

    it('should respect custom options', () => {
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Component name' },
        },
      };
      const options: TypeScriptGeneratorOptions = {
        includeComments: true,
        indent: 4,
      };
      const result = generatePropsInterface('my-component', schema, options);
      expect(result).toContain('/** Component name */');
      expect(result).toContain('    name');
    });

    it('should handle props with oneOf (nullable fields)', () => {
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          description: {
            oneOf: [{ type: 'null' }, { type: 'string' }],
          },
        },
      };
      const result = generatePropsInterface('list-widget', schema);
      expect(result).toContain('interface ListWidgetProps');
      expect(result).toContain('description?: null | string;');
    });

    it('should handle props with complex oneOf including any type', () => {
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          showToolbar: {
            oneOf: [{ type: 'null' }, { type: 'any' }, { type: 'any' }],
          },
        },
      };
      const result = generatePropsInterface('toolbar-widget', schema);
      expect(result).toContain('showToolbar?: null | any | any;');
    });
  });

  describe('generateEventsType', () => {
    it('should generate empty events type for no events', () => {
      const result = generateEventsType('user-card', {});
      expect(result).toBe('type UserCardEvents = Record<string, never>;');
    });

    it('should generate events type with void payload', () => {
      const events = {
        click: { type: 'CustomEvent' },
      };
      const result = generateEventsType('button-component', events);
      expect(result).toContain('type ButtonComponentEvents');
      expect(result).toContain('click: CustomEvent<void>;');
    });

    it('should generate events type with EventEmitter', () => {
      const events = {
        userAction: { type: 'EventEmitter' },
      };
      const result = generateEventsType('action-panel', events);
      expect(result).toContain('userAction: EventEmitter<void>;');
    });

    it('should generate events type with OutputSignal', () => {
      const events = {
        notify: { type: 'OutputSignal' },
      };
      const result = generateEventsType('notification', events);
      expect(result).toContain('notify: OutputSignal<void>;');
    });

    it('should generate events with simple payload', () => {
      const events = {
        changed: {
          type: 'CustomEvent',
          payload: { type: 'string' },
        },
      };
      const result = generateEventsType('input-field', events);
      expect(result).toContain('changed: CustomEvent<string>;');
    });

    it('should generate events with number payload', () => {
      const events = {
        valueChanged: {
          type: 'CustomEvent',
          payload: { type: 'number' },
        },
      };
      const result = generateEventsType('counter', events);
      expect(result).toContain('valueChanged: CustomEvent<number>;');
    });

    it('should generate separate interface for object payload', () => {
      const events = {
        userAction: {
          type: 'CustomEvent',
          payload: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              timestamp: { type: 'number' },
            },
            required: ['action'],
          },
        },
      };
      const result = generateEventsType('user-panel', events);
      expect(result).toContain('interface UserActionPayload');
      expect(result).toContain('action: string;');
      expect(result).toContain('timestamp?: number;');
      expect(result).toContain('userAction: CustomEvent<UserActionPayload>;');
    });

    it('should generate multiple event interfaces', () => {
      const events = {
        notify: {
          type: 'OutputSignal',
          payload: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              type: { type: 'string', enum: ['info', 'warning', 'error'] },
            },
            required: ['message', 'type'],
          },
        },
        dataReady: {
          type: 'OutputSignal',
          payload: {
            type: 'object',
            properties: {
              ready: { type: 'boolean' },
            },
            required: ['ready'],
          },
        },
      };
      const result = generateEventsType('comprehensive-example', events);
      expect(result).toContain('interface NotifyPayload');
      expect(result).toContain('interface DataReadyPayload');
      expect(result).toContain('notify: OutputSignal<NotifyPayload>;');
      expect(result).toContain('dataReady: OutputSignal<DataReadyPayload>;');
    });

    it('should inline simple types and generate interfaces for complex types', () => {
      const events = {
        simpleEvent: {
          type: 'CustomEvent',
          payload: { type: 'string' },
        },
        complexEvent: {
          type: 'CustomEvent',
          payload: {
            type: 'object',
            properties: {
              data: { type: 'string' },
            },
          },
        },
      };
      const result = generateEventsType('mixed-component', events);
      expect(result).toContain('interface ComplexEventPayload');
      expect(result).toContain('simpleEvent: CustomEvent<string>;');
      expect(result).toContain('complexEvent: CustomEvent<ComplexEventPayload>;');
    });

    it('should handle array payloads', () => {
      const events = {
        itemsUpdated: {
          type: 'CustomEvent',
          payload: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      };
      const result = generateEventsType('list-component', events);
      expect(result).toContain('itemsUpdated: CustomEvent<string[]>;');
    });

    it('should respect custom indent option', () => {
      const events = {
        click: { type: 'CustomEvent' },
      };
      const options: TypeScriptGeneratorOptions = { indent: 4 };
      const result = generateEventsType('button', events, options);
      expect(result).toContain('    click: CustomEvent<void>;');
    });

    it('should convert kebab-case event names to PascalCase for interface names', () => {
      const events = {
        'user-action': {
          type: 'CustomEvent',
          payload: {
            type: 'object',
            properties: {
              id: { type: 'number' },
            },
          },
        },
      };
      const result = generateEventsType('my-component', events);
      expect(result).toContain('interface UserActionPayload');
    });

    it('should handle complex nested payload with arrays', () => {
      const events = {
        selectionChanged: {
          type: 'OutputSignal',
          payload: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string' },
              tags: {
                type: 'array',
                items: { type: 'string' },
              },
            },
            required: ['id', 'name', 'email', 'tags'],
          },
        },
      };
      const result = generateEventsType('data-selector-widget', events);
      expect(result).toContain('interface SelectionChangedPayload');
      expect(result).toContain('id: string;');
      expect(result).toContain('name: string;');
      expect(result).toContain('email: string;');
      expect(result).toContain('tags: string[];');
      expect(result).toContain('selectionChanged: OutputSignal<SelectionChangedPayload>;');
    });

    it('should handle event with any payload type', () => {
      const events = {
        settingChanged: {
          type: 'OutputSignal',
          payload: {
            type: 'any',
          },
        },
      };
      const result = generateEventsType('settings-widget', events);
      expect(result).toContain('settingChanged: OutputSignal<any>;');
      expect(result).not.toContain('interface');
    });

    it('should handle event with void payload (no payload property)', () => {
      const events = {
        closed: {
          type: 'OutputSignal',
        },
      };
      const result = generateEventsType('modal-widget', events);
      expect(result).toContain('closed: OutputSignal<void>;');
    });

    it('should handle deeply nested object payloads', () => {
      const events = {
        itemSelected: {
          type: 'OutputSignal',
          payload: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  userId: { type: 'string' },
                  accountNumber: { type: 'number' },
                  region: { type: 'string' },
                },
                required: ['userId', 'accountNumber', 'region'],
              },
              itemId: { type: 'string' },
              categoryId: { type: 'number' },
            },
            required: ['user', 'itemId', 'categoryId'],
          },
        },
      };
      const result = generateEventsType('item-selector', events);
      expect(result).toContain('interface ItemSelectedPayload');
      expect(result).toContain('user:');
      expect(result).toContain('userId: string;');
      expect(result).toContain('accountNumber: number;');
      expect(result).toContain('itemId: string;');
      expect(result).toContain('categoryId: number;');
    });
  });

  describe('generateComponentTypes', () => {
    it('should generate both props and events types', () => {
      const propsSchema: JSONSchema = {
        type: 'object',
        properties: {
          userName: { type: 'string' },
        },
      };
      const events = {
        click: { type: 'CustomEvent' },
      };
      const result = generateComponentTypes('user-card', propsSchema, events);
      expect(result).toContain('interface UserCardProps');
      expect(result).toContain('type UserCardEvents');
    });

    it('should generate only props when no events', () => {
      const propsSchema: JSONSchema = {
        type: 'object',
        properties: {
          title: { type: 'string' },
        },
      };
      const result = generateComponentTypes('header', propsSchema, {});
      expect(result).toContain('interface HeaderProps');
      expect(result).not.toContain('Events');
    });

    it('should generate only events when no props', () => {
      const propsSchema: JSONSchema = { type: 'object', properties: {} };
      const events = {
        submit: { type: 'CustomEvent' },
      };
      const result = generateComponentTypes('form', propsSchema, events);
      expect(result).not.toContain('interface FormProps');
      expect(result).toContain('type FormEvents');
    });

    it('should return empty string when no props and no events', () => {
      const propsSchema: JSONSchema = { type: 'object', properties: {} };
      const result = generateComponentTypes('empty', propsSchema, {});
      expect(result).toBe('');
    });

    it('should separate props and events with blank line', () => {
      const propsSchema: JSONSchema = {
        type: 'object',
        properties: {
          value: { type: 'string' },
        },
      };
      const events = {
        change: { type: 'CustomEvent' },
      };
      const result = generateComponentTypes('input', propsSchema, events);
      expect(result).toContain('interface InputProps');
      expect(result).toContain('type InputEvents');
      // Check that there's a blank line separating props and events
      const sections = result.split('\n\n');
      expect(sections.length).toBeGreaterThan(1);
    });

    it('should handle complex component with multiple props and events', () => {
      const propsSchema: JSONSchema = {
        type: 'object',
        properties: {
          userName: { type: 'string' },
          isActive: { type: 'boolean' },
          config: {
            type: 'object',
            properties: {
              endpoint: { type: 'string' },
            },
          },
        },
        required: ['userName'],
      };
      const events = {
        userAction: {
          type: 'CustomEvent',
          payload: {
            type: 'object',
            properties: {
              action: { type: 'string' },
            },
          },
        },
        dataLoad: { type: 'EventEmitter' },
      };
      const result = generateComponentTypes('comprehensive-component', propsSchema, events);
      expect(result).toContain('interface ComprehensiveComponentProps');
      expect(result).toContain('interface UserActionPayload');
      expect(result).toContain('type ComprehensiveComponentEvents');
      expect(result).toContain('userName: string;');
      expect(result).toContain('isActive?: boolean;');
      expect(result).toContain('userAction: CustomEvent<UserActionPayload>;');
      expect(result).toContain('dataLoad: EventEmitter<void>;');
    });

    it('should pass options to both props and events generation', () => {
      const propsSchema: JSONSchema = {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Component name' },
        },
      };
      const events = {
        click: { type: 'CustomEvent' },
      };
      const options: TypeScriptGeneratorOptions = {
        includeComments: true,
        indent: 4,
      };
      const result = generateComponentTypes('my-component', propsSchema, events, options);
      expect(result).toContain('/** Component name */');
      expect(result).toContain('    name');
      expect(result).toContain('    click');
    });

    it('should handle null or undefined props schema', () => {
      const events = {
        click: { type: 'CustomEvent' },
      };
      const result = generateComponentTypes('button', null as any, events);
      expect(result).not.toContain('interface');
      expect(result).toContain('type ButtonEvents');
    });
  });
});
