import { describe, it, expect, vi } from 'vitest';
import { extractProps } from './props-extractor.js';
import { extractEvents } from './events-extractor.js';
import { extractFederationConfig } from './federation-extractor.js';
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
      const result = extractFederationConfig('/non/existent/path');

      expect(result.bundler).toBe('webpack');
      expect(result.federation).toBeUndefined();
    });

    it('should handle directory without federation config', () => {
      const result = extractFederationConfig('/tmp');

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
