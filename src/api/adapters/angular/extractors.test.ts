import { describe, it, expect, vi } from 'vitest';
import { extractProps } from './props-extractor.js';
import { extractEvents } from './events-extractor.js';
import { extractWebpackFederationConfig } from '../shared/webpack-federation-extractor.js';
import * as ts from 'typescript';

describe('Angular Adapter Extractors', () => {
  describe('extractProps', () => {
    it('should extract props from a class with Input decorators', () => {
      const sourceCode = `
        import { Component, Input } from '@angular/core';
        
        @Component({
          selector: 'user-card',
          template: '<div>{{name}}</div>'
        })
        export class UserCardComponent {
          @Input() name!: string;
          @Input() age?: number;
        }
      `;

      const sourceFile = ts.createSourceFile('test.ts', sourceCode, ts.ScriptTarget.Latest, true);

      const program = ts.createProgram(['test.ts'], {
        noResolve: true,
        target: ts.ScriptTarget.Latest,
        module: ts.ModuleKind.ESNext,
      });

      const typeChecker = program.getTypeChecker();
      let classDecl: ts.ClassDeclaration | undefined;

      ts.forEachChild(sourceFile, (node) => {
        if (ts.isClassDeclaration(node)) {
          classDecl = node;
        }
      });

      if (!classDecl) {
        throw new Error('Class declaration not found');
      }

      const props = extractProps(classDecl, typeChecker);

      expect(props.length).toBeGreaterThan(0);
      expect(props.some((p) => p.name === 'name')).toBe(true);
    });

    it('should return empty array for class without Input decorators', () => {
      const sourceCode = `
        export class PlainComponent {
          plainProp: string = 'test';
        }
      `;

      const sourceFile = ts.createSourceFile('test.ts', sourceCode, ts.ScriptTarget.Latest, true);

      const program = ts.createProgram(['test.ts'], {
        noResolve: true,
        target: ts.ScriptTarget.Latest,
      });

      const typeChecker = program.getTypeChecker();
      let classDecl: ts.ClassDeclaration | undefined;

      ts.forEachChild(sourceFile, (node) => {
        if (ts.isClassDeclaration(node)) {
          classDecl = node;
        }
      });

      if (!classDecl) {
        throw new Error('Class declaration not found');
      }

      const props = extractProps(classDecl, typeChecker);

      expect(props).toEqual([]);
    });
  });

  describe('extractEvents', () => {
    it('should extract events from a class with Output decorators', () => {
      const sourceCode = `
        import { Component, Output, EventEmitter } from '@angular/core';
        
        @Component({
          selector: 'user-card',
          template: '<div></div>'
        })
        export class UserCardComponent {
          @Output() userClick = new EventEmitter<string>();
        }
      `;

      const sourceFile = ts.createSourceFile('test.ts', sourceCode, ts.ScriptTarget.Latest, true);

      const program = ts.createProgram(['test.ts'], {
        noResolve: true,
        target: ts.ScriptTarget.Latest,
      });

      const typeChecker = program.getTypeChecker();
      let classDecl: ts.ClassDeclaration | undefined;

      ts.forEachChild(sourceFile, (node) => {
        if (ts.isClassDeclaration(node)) {
          classDecl = node;
        }
      });

      if (!classDecl) {
        throw new Error('Class declaration not found');
      }

      const events = extractEvents(classDecl, typeChecker);

      expect(events.length).toBeGreaterThan(0);
      expect(events.some((e) => e.name === 'userClick')).toBe(true);
    });

    it('should return empty array for class without Output decorators', () => {
      const sourceCode = `
        export class PlainComponent {
          plainMethod() {
            console.log('test');
          }
        }
      `;

      const sourceFile = ts.createSourceFile('test.ts', sourceCode, ts.ScriptTarget.Latest, true);

      const program = ts.createProgram(['test.ts'], {
        noResolve: true,
        target: ts.ScriptTarget.Latest,
      });

      const typeChecker = program.getTypeChecker();
      let classDecl: ts.ClassDeclaration | undefined;

      ts.forEachChild(sourceFile, (node) => {
        if (ts.isClassDeclaration(node)) {
          classDecl = node;
        }
      });

      if (!classDecl) {
        throw new Error('Class declaration not found');
      }

      const events = extractEvents(classDecl, typeChecker);

      expect(events).toEqual([]);
    });
  });

  describe('extractFederationConfig', () => {
    it('should return empty config when no webpack config exists', () => {
      const result = extractWebpackFederationConfig('/non/existent/path');

      expect(result.bundler).toBe('webpack');
      expect(result.federation).toBeUndefined();
    });

    it('should handle directory without federation config', () => {
      const result = extractWebpackFederationConfig('/tmp');

      expect(result.bundler).toBe('webpack');
      expect(result.federation).toBeUndefined();
    });
  });
});

describe('Angular Adapter Integration', () => {
  it('should handle complete component analysis workflow', () => {
    const sourceCode = `
      import { Component, Input, Output, EventEmitter } from '@angular/core';
      
      @Component({
        selector: 'user-card',
        template: '<div>{{name}}</div>'
      })
      export class UserCardComponent {
        @Input() name!: string;
        @Output() nameChange = new EventEmitter<string>();
      }
    `;

    const sourceFile = ts.createSourceFile('test.ts', sourceCode, ts.ScriptTarget.Latest, true);

    const program = ts.createProgram(['test.ts'], {
      noResolve: true,
      target: ts.ScriptTarget.Latest,
    });

    const typeChecker = program.getTypeChecker();
    let classDecl: ts.ClassDeclaration | undefined;

    ts.forEachChild(sourceFile, (node) => {
      if (ts.isClassDeclaration(node)) {
        classDecl = node;
      }
    });

    if (!classDecl) {
      throw new Error('Class declaration not found');
    }

    const props = extractProps(classDecl, typeChecker);
    const events = extractEvents(classDecl, typeChecker);

    // Verify we can analyze both props and events together
    expect(props.length).toBeGreaterThan(0);
    expect(events.length).toBeGreaterThan(0);
    expect(props.some((p) => p.name === 'name')).toBe(true);
    expect(events.some((e) => e.name === 'nameChange')).toBe(true);
  });
});

describe('Angular Adapter - Enhanced Features', () => {
  describe('Signal-based Inputs', () => {
    it('should extract input() signal properties', () => {
      const sourceCode = `
        import { Component, input } from '@angular/core';
        
        @Component({
          selector: 'user-card',
          template: '<div>{{name()}}</div>'
        })
        export class UserCardComponent {
          name = input<string>('Guest');
          age = input<number>(0);
        }
      `;

      const sourceFile = ts.createSourceFile('test.ts', sourceCode, ts.ScriptTarget.Latest, true);
      const program = ts.createProgram(['test.ts'], {
        noResolve: true,
        target: ts.ScriptTarget.Latest,
      });
      const typeChecker = program.getTypeChecker();

      let classDecl: ts.ClassDeclaration | undefined;
      ts.forEachChild(sourceFile, (node) => {
        if (ts.isClassDeclaration(node)) {
          classDecl = node;
        }
      });

      const props = extractProps(classDecl!, typeChecker);

      expect(props.length).toBeGreaterThanOrEqual(2);

      const nameProp = props.find((p) => p.name === 'name');
      expect(nameProp).toBeDefined();
      expect(nameProp?.required).toBe(false);
      expect(nameProp?.schema.type).toBe('string');
      expect(nameProp?.default).toBe('Guest');

      const ageProp = props.find((p) => p.name === 'age');
      expect(ageProp).toBeDefined();
      expect(ageProp?.default).toBe(0);
    });

    it('should extract input.required() signal properties', () => {
      const sourceCode = `
        import { Component, input } from '@angular/core';
        
        @Component({
          selector: 'user-card',
          template: '<div>{{name()}}</div>'
        })
        export class UserCardComponent {
          name = input.required<string>();
          userId = input.required<number>();
        }
      `;

      const sourceFile = ts.createSourceFile('test.ts', sourceCode, ts.ScriptTarget.Latest, true);
      const program = ts.createProgram(['test.ts'], {
        noResolve: true,
        target: ts.ScriptTarget.Latest,
      });
      const typeChecker = program.getTypeChecker();

      let classDecl: ts.ClassDeclaration | undefined;
      ts.forEachChild(sourceFile, (node) => {
        if (ts.isClassDeclaration(node)) {
          classDecl = node;
        }
      });

      const props = extractProps(classDecl!, typeChecker);

      const nameProp = props.find((p) => p.name === 'name');
      expect(nameProp).toBeDefined();
      expect(nameProp?.required).toBe(true);

      const userIdProp = props.find((p) => p.name === 'userId');
      expect(userIdProp).toBeDefined();
      expect(userIdProp?.required).toBe(true);
    });

    it('should extract alias from input signal options', () => {
      const sourceCode = `
        import { Component, input } from '@angular/core';
        
        @Component({
          selector: 'user-card',
          template: '<div></div>'
        })
        export class UserCardComponent {
          userName = input<string>('', { alias: 'user-name' });
        }
      `;

      const sourceFile = ts.createSourceFile('test.ts', sourceCode, ts.ScriptTarget.Latest, true);
      const program = ts.createProgram(['test.ts'], {
        noResolve: true,
        target: ts.ScriptTarget.Latest,
      });
      const typeChecker = program.getTypeChecker();

      let classDecl: ts.ClassDeclaration | undefined;
      ts.forEachChild(sourceFile, (node) => {
        if (ts.isClassDeclaration(node)) {
          classDecl = node;
        }
      });

      const props = extractProps(classDecl!, typeChecker);

      const userNameProp = props.find((p) => p.name === 'userName');
      expect(userNameProp).toBeDefined();
      expect(userNameProp?.attribute).toBe('user-name');
    });
  });

  describe('Signal-based Outputs', () => {
    it('should extract output() signal properties', () => {
      const sourceCode = `
        import { Component, output } from '@angular/core';
        
        @Component({
          selector: 'user-card',
          template: '<div></div>'
        })
        export class UserCardComponent {
          clicked = output<{ x: number; y: number }>();
          changed = output<string>();
        }
      `;

      const sourceFile = ts.createSourceFile('test.ts', sourceCode, ts.ScriptTarget.Latest, true);
      const program = ts.createProgram(['test.ts'], {
        noResolve: true,
        target: ts.ScriptTarget.Latest,
      });
      const typeChecker = program.getTypeChecker();

      let classDecl: ts.ClassDeclaration | undefined;
      ts.forEachChild(sourceFile, (node) => {
        if (ts.isClassDeclaration(node)) {
          classDecl = node;
        }
      });

      const events = extractEvents(classDecl!, typeChecker);

      const clickedEvent = events.find((e) => e.name === 'clicked');
      expect(clickedEvent).toBeDefined();
      expect(clickedEvent?.type).toBe('OutputSignal');
      expect(clickedEvent?.payloadSchema).toBeDefined();
      expect(clickedEvent?.payloadSchema?.type).toBe('object');

      const changedEvent = events.find((e) => e.name === 'changed');
      expect(changedEvent).toBeDefined();
      expect(changedEvent?.payloadSchema?.type).toBe('string');
    });

    it('should extract alias from output signal options', () => {
      const sourceCode = `
        import { Component, output } from '@angular/core';
        
        @Component({
          selector: 'user-card',
          template: '<div></div>'
        })
        export class UserCardComponent {
          userChanged = output<void>({ alias: 'user-changed' });
        }
      `;

      const sourceFile = ts.createSourceFile('test.ts', sourceCode, ts.ScriptTarget.Latest, true);
      const program = ts.createProgram(['test.ts'], {
        noResolve: true,
        target: ts.ScriptTarget.Latest,
      });
      const typeChecker = program.getTypeChecker();

      let classDecl: ts.ClassDeclaration | undefined;
      ts.forEachChild(sourceFile, (node) => {
        if (ts.isClassDeclaration(node)) {
          classDecl = node;
        }
      });

      const events = extractEvents(classDecl!, typeChecker);

      const userChangedEvent = events.find((e) => e.name === 'user-changed');
      expect(userChangedEvent).toBeDefined();
    });
  });

  describe('JSDoc Metadata for Inputs', () => {
    it('should extract JSDoc description and default value', () => {
      const sourceCode = `
        import { Component, Input } from '@angular/core';
        
        @Component({
          selector: 'user-card',
          template: '<div></div>'
        })
        export class UserCardComponent {
          /**
           * User's display name
           * @default 'Guest'
           */
          @Input() userName?: string = 'Guest';
          
          /**
           * User's age
           * @deprecated Use birthDate instead
           */
          @Input() age?: number;
        }
      `;

      const sourceFile = ts.createSourceFile('test.ts', sourceCode, ts.ScriptTarget.Latest, true);
      const program = ts.createProgram(['test.ts'], {
        noResolve: true,
        target: ts.ScriptTarget.Latest,
      });
      const typeChecker = program.getTypeChecker();

      let classDecl: ts.ClassDeclaration | undefined;
      ts.forEachChild(sourceFile, (node) => {
        if (ts.isClassDeclaration(node)) {
          classDecl = node;
        }
      });

      const props = extractProps(classDecl!, typeChecker);

      const userNameProp = props.find((p) => p.name === 'userName');
      expect(userNameProp?.description).toContain('display name');
      expect(userNameProp?.default).toBe("'Guest'");

      const ageProp = props.find((p) => p.name === 'age');
      expect(ageProp?.description).toContain('age');
      expect(ageProp?.deprecated).toBe(true);
    });

    it('should extract custom attribute name from JSDoc', () => {
      const sourceCode = `
        import { Component, Input } from '@angular/core';
        
        @Component({
          selector: 'user-card',
          template: '<div></div>'
        })
        export class UserCardComponent {
          /**
           * User ID
           * @attribute user-id
           */
          @Input() userId?: string;
        }
      `;

      const sourceFile = ts.createSourceFile('test.ts', sourceCode, ts.ScriptTarget.Latest, true);
      const program = ts.createProgram(['test.ts'], {
        noResolve: true,
        target: ts.ScriptTarget.Latest,
      });
      const typeChecker = program.getTypeChecker();

      let classDecl: ts.ClassDeclaration | undefined;
      ts.forEachChild(sourceFile, (node) => {
        if (ts.isClassDeclaration(node)) {
          classDecl = node;
        }
      });

      const props = extractProps(classDecl!, typeChecker);

      const userIdProp = props.find((p) => p.name === 'userId');
      expect(userIdProp?.attribute).toBe('user-id');
    });

    it('should prefer decorator alias over JSDoc attribute', () => {
      const sourceCode = `
        import { Component, Input } from '@angular/core';
        
        @Component({
          selector: 'user-card',
          template: '<div></div>'
        })
        export class UserCardComponent {
          /**
           * @attribute jsdoc-name
           */
          @Input('decorator-name') userName?: string;
        }
      `;

      const sourceFile = ts.createSourceFile('test.ts', sourceCode, ts.ScriptTarget.Latest, true);
      const program = ts.createProgram(['test.ts'], {
        noResolve: true,
        target: ts.ScriptTarget.Latest,
      });
      const typeChecker = program.getTypeChecker();

      let classDecl: ts.ClassDeclaration | undefined;
      ts.forEachChild(sourceFile, (node) => {
        if (ts.isClassDeclaration(node)) {
          classDecl = node;
        }
      });

      const props = extractProps(classDecl!, typeChecker);

      const userNameProp = props.find((p) => p.name === 'userName');
      expect(userNameProp?.attribute).toBe('decorator-name');
    });
  });

  describe('JSDoc Metadata for Outputs', () => {
    it('should extract JSDoc description from Output decorators', () => {
      const sourceCode = `
        import { Component, Output, EventEmitter } from '@angular/core';
        
        @Component({
          selector: 'user-card',
          template: '<div></div>'
        })
        export class UserCardComponent {
          /**
           * Fired when user clicks
           * @event clicked
           */
          @Output() clicked = new EventEmitter<void>();
          
          /**
           * Deprecated event
           * @deprecated Use newEvent instead
           */
          @Output() oldEvent = new EventEmitter<string>();
        }
      `;

      const sourceFile = ts.createSourceFile('test.ts', sourceCode, ts.ScriptTarget.Latest, true);
      const program = ts.createProgram(['test.ts'], {
        noResolve: true,
        target: ts.ScriptTarget.Latest,
      });
      const typeChecker = program.getTypeChecker();

      let classDecl: ts.ClassDeclaration | undefined;
      ts.forEachChild(sourceFile, (node) => {
        if (ts.isClassDeclaration(node)) {
          classDecl = node;
        }
      });

      const events = extractEvents(classDecl!, typeChecker);

      const clickedEvent = events.find((e) => e.name === 'clicked');
      expect(clickedEvent?.description).toContain('clicks');

      const oldEvent = events.find((e) => e.name === 'oldEvent');
      expect(oldEvent?.deprecated).toBe(true);
    });

    it('should extract alias from Output decorator', () => {
      const sourceCode = `
        import { Component, Output, EventEmitter } from '@angular/core';
        
        @Component({
          selector: 'user-card',
          template: '<div></div>'
        })
        export class UserCardComponent {
          @Output('user-clicked') userClicked = new EventEmitter<void>();
        }
      `;

      const sourceFile = ts.createSourceFile('test.ts', sourceCode, ts.ScriptTarget.Latest, true);
      const program = ts.createProgram(['test.ts'], {
        noResolve: true,
        target: ts.ScriptTarget.Latest,
      });
      const typeChecker = program.getTypeChecker();

      let classDecl: ts.ClassDeclaration | undefined;
      ts.forEachChild(sourceFile, (node) => {
        if (ts.isClassDeclaration(node)) {
          classDecl = node;
        }
      });

      const events = extractEvents(classDecl!, typeChecker);

      const event = events.find((e) => e.name === 'user-clicked');
      expect(event).toBeDefined();
    });
  });

  describe('dispatchEvent Extraction', () => {
    it('should extract CustomEvent dispatch calls with bubbles and composed', () => {
      const sourceCode = `
        import { Component } from '@angular/core';
        
        @Component({
          selector: 'user-card',
          template: '<div></div>'
        })
        export class UserCardComponent {
          handleClick() {
            this.dispatchEvent(
              new CustomEvent('action', {
                detail: { type: 'click' },
                bubbles: true,
                composed: true,
              })
            );
          }
        }
      `;

      const sourceFile = ts.createSourceFile('test.ts', sourceCode, ts.ScriptTarget.Latest, true);
      const program = ts.createProgram(['test.ts'], {
        noResolve: true,
        target: ts.ScriptTarget.Latest,
      });
      const typeChecker = program.getTypeChecker();

      let classDecl: ts.ClassDeclaration | undefined;
      ts.forEachChild(sourceFile, (node) => {
        if (ts.isClassDeclaration(node)) {
          classDecl = node;
        }
      });

      const events = extractEvents(classDecl!, typeChecker);

      const actionEvent = events.find((e) => e.name === 'action');
      expect(actionEvent).toBeDefined();
      expect(actionEvent?.type).toBe('CustomEvent');
      expect(actionEvent?.bubbles).toBe(true);
      expect(actionEvent?.composed).toBe(true);
    });

    it('should extract payload schema from CustomEvent detail', () => {
      const sourceCode = `
        import { Component } from '@angular/core';
        
        @Component({
          selector: 'user-card',
          template: '<div></div>'
        })
        export class UserCardComponent {
          handleAction() {
            this.dispatchEvent(
              new CustomEvent<{ id: number; name: string }>('userAction', {
                detail: { id: 123, name: 'John' },
              })
            );
          }
        }
      `;

      const sourceFile = ts.createSourceFile('test.ts', sourceCode, ts.ScriptTarget.Latest, true);
      const program = ts.createProgram(['test.ts'], {
        noResolve: true,
        target: ts.ScriptTarget.Latest,
      });
      const typeChecker = program.getTypeChecker();

      let classDecl: ts.ClassDeclaration | undefined;
      ts.forEachChild(sourceFile, (node) => {
        if (ts.isClassDeclaration(node)) {
          classDecl = node;
        }
      });

      const events = extractEvents(classDecl!, typeChecker);

      const userActionEvent = events.find((e) => e.name === 'userAction');
      expect(userActionEvent).toBeDefined();
      expect(userActionEvent?.payloadSchema).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle components without any inputs or outputs', () => {
      const sourceCode = `
        import { Component } from '@angular/core';
        
        @Component({
          selector: 'simple-card',
          template: '<div>Static content</div>'
        })
        export class SimpleCardComponent {
          someMethod() {
            console.log('hello');
          }
        }
      `;

      const sourceFile = ts.createSourceFile('test.ts', sourceCode, ts.ScriptTarget.Latest, true);
      const program = ts.createProgram(['test.ts'], {
        noResolve: true,
        target: ts.ScriptTarget.Latest,
      });
      const typeChecker = program.getTypeChecker();

      let classDecl: ts.ClassDeclaration | undefined;
      ts.forEachChild(sourceFile, (node) => {
        if (ts.isClassDeclaration(node)) {
          classDecl = node;
        }
      });

      const props = extractProps(classDecl!, typeChecker);
      const events = extractEvents(classDecl!, typeChecker);

      expect(props).toEqual([]);
      expect(events).toEqual([]);
    });
  });
});
