import { describe, it, expect } from 'vitest';
import { extractProps } from './props-extractor.js';
import { extractEvents } from './events-extractor.js';
import { extractFederationConfig } from './federation-extractor.js';
import { discoverComponents, findComponentByName } from './component-discovery.js';
import * as ts from 'typescript';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';

/**
 * Helper to create a TypeScript program with proper file resolution
 */
function createTestProgram(files: Record<string, string>): {
  program: ts.Program;
  getSourceFile: (fileName: string) => ts.SourceFile | undefined;
} {
  const compilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.Latest,
    module: ts.ModuleKind.ESNext,
    jsx: ts.JsxEmit.React,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    strict: true,
  };

  const compilerHost = ts.createCompilerHost(compilerOptions);
  const originalGetSourceFile = compilerHost.getSourceFile;

  // Override getSourceFile to serve our in-memory files
  compilerHost.getSourceFile = (fileName, languageVersion, onError, shouldCreateNewSourceFile) => {
    const normalizedFileName = fileName.replace(/\\/g, '/');
    for (const [testFileName, content] of Object.entries(files)) {
      if (normalizedFileName.endsWith(testFileName)) {
        return ts.createSourceFile(fileName, content, languageVersion, true);
      }
    }
    // Fall back to original for lib files
    return originalGetSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile);
  };

  const fileNames = Object.keys(files);
  const program = ts.createProgram(fileNames, compilerOptions, compilerHost);

  return {
    program,
    getSourceFile: (fileName: string) => program.getSourceFile(fileName),
  };
}

describe('React Adapter - Props Extractor', () => {
  describe('Function Component Props', () => {
    it('should extract props from a function component with inline type', () => {
      const sourceCode = `
        import React from 'react';
        
        function UserCard(props: { name: string; age?: number }) {
          return <div>{props.name}</div>;
        }
      `;

      const sourceFile = ts.createSourceFile('test.tsx', sourceCode, ts.ScriptTarget.Latest, true);

      const program = ts.createProgram(['test.tsx'], {
        noResolve: true,
        target: ts.ScriptTarget.Latest,
        module: ts.ModuleKind.ESNext,
        jsx: ts.JsxEmit.React,
      });

      const typeChecker = program.getTypeChecker();
      let funcDecl: ts.FunctionDeclaration | undefined;

      ts.forEachChild(sourceFile, (node) => {
        if (ts.isFunctionDeclaration(node)) {
          funcDecl = node;
        }
      });

      if (!funcDecl) {
        throw new Error('Function declaration not found');
      }

      const props = extractProps(funcDecl, typeChecker);

      expect(props.length).toBe(2);

      const nameProp = props.find((p) => p.name === 'name');
      expect(nameProp).toBeDefined();
      expect(nameProp?.required).toBe(true);
      expect(nameProp?.schema.type).toBe('string');
      expect(nameProp?.attribute).toBe('name');

      const ageProp = props.find((p) => p.name === 'age');
      expect(ageProp).toBeDefined();
      expect(ageProp?.required).toBe(false);
      expect(ageProp?.schema.type).toBe('number');
    });

    it('should extract props from a function component with type reference', () => {
      const sourceCode = `
        interface UserCardProps {
          name: string;
          email: string;
          age?: number;
          active: boolean;
        }
        
        function UserCard(props: UserCardProps) {
          return <div>{props.name}</div>;
        }
      `;

      const { program, getSourceFile } = createTestProgram({ 'test.tsx': sourceCode });
      const sourceFile = getSourceFile('test.tsx');

      if (!sourceFile) {
        throw new Error('Source file not found');
      }

      const typeChecker = program.getTypeChecker();
      let funcDecl: ts.FunctionDeclaration | undefined;

      ts.forEachChild(sourceFile, (node) => {
        if (ts.isFunctionDeclaration(node) && node.name?.text === 'UserCard') {
          funcDecl = node;
        }
      });

      if (!funcDecl) {
        throw new Error('Function declaration not found');
      }

      const props = extractProps(funcDecl, typeChecker);

      expect(props.length).toBe(4);
      expect(props.some((p) => p.name === 'name' && p.required)).toBe(true);
      expect(props.some((p) => p.name === 'email' && p.required)).toBe(true);
      expect(props.some((p) => p.name === 'age' && !p.required)).toBe(true);
      expect(props.some((p) => p.name === 'active' && p.schema.type === 'boolean')).toBe(true);
    });

    it('should extract union type props correctly', () => {
      const sourceCode = `
        import React from 'react';
        
        interface UserCardProps {
          theme: 'light' | 'dark';
          size: 'small' | 'medium' | 'large';
        }
        
        function UserCard(props: UserCardProps) {
          return <div />;
        }
      `;

      const { program, getSourceFile } = createTestProgram({ 'test.tsx': sourceCode });
      const sourceFile = getSourceFile('test.tsx');

      if (!sourceFile) {
        throw new Error('Source file not found');
      }

      const typeChecker = program.getTypeChecker();
      let funcDecl: ts.FunctionDeclaration | undefined;

      ts.forEachChild(sourceFile, (node) => {
        if (ts.isFunctionDeclaration(node)) {
          funcDecl = node;
        }
      });

      if (!funcDecl) {
        throw new Error('Function declaration not found');
      }

      const props = extractProps(funcDecl, typeChecker);

      expect(props.length).toBe(2);

      const themeProp = props.find((p) => p.name === 'theme');
      expect(themeProp).toBeDefined();
      expect(themeProp?.schema.type).toBe('string');
      expect(themeProp?.schema.enum).toEqual(['light', 'dark']);

      const sizeProp = props.find((p) => p.name === 'size');
      expect(sizeProp).toBeDefined();
      expect(sizeProp?.schema.type).toBe('string');
      expect(sizeProp?.schema.enum).toContain('small');
      expect(sizeProp?.schema.enum).toContain('medium');
      expect(sizeProp?.schema.enum).toContain('large');
    });

    it('should extract object type props', () => {
      const sourceCode = `
        import React from 'react';
        
        interface UserCardProps {
          config: {
            theme: string;
            showAvatar: boolean;
          };
        }
        
        function UserCard(props: UserCardProps) {
          return <div />;
        }
      `;

      const { program, getSourceFile } = createTestProgram({ 'test.tsx': sourceCode });
      const sourceFile = getSourceFile('test.tsx');

      if (!sourceFile) {
        throw new Error('Source file not found');
      }

      const typeChecker = program.getTypeChecker();
      let funcDecl: ts.FunctionDeclaration | undefined;

      ts.forEachChild(sourceFile, (node) => {
        if (ts.isFunctionDeclaration(node)) {
          funcDecl = node;
        }
      });

      if (!funcDecl) {
        throw new Error('Function declaration not found');
      }

      const props = extractProps(funcDecl, typeChecker);

      expect(props.length).toBe(1);

      const configProp = props.find((p) => p.name === 'config');
      expect(configProp).toBeDefined();
      expect(configProp?.schema.type).toBe('object');
      expect(configProp?.schema.properties).toBeDefined();
      expect(configProp?.schema.properties?.theme).toEqual({ type: 'string' });
      expect(configProp?.schema.properties?.showAvatar).toEqual({ type: 'boolean' });
    });

    it('should skip React built-in props (children, key, ref)', () => {
      const sourceCode = `
        import React from 'react';
        
        interface UserCardProps {
          name: string;
          children?: React.ReactNode;
          key?: string;
          ref?: React.Ref<HTMLDivElement>;
        }
        
        function UserCard(props: UserCardProps) {
          return <div />;
        }
      `;

      const { program, getSourceFile } = createTestProgram({ 'test.tsx': sourceCode });
      const sourceFile = getSourceFile('test.tsx');

      if (!sourceFile) {
        throw new Error('Source file not found');
      }

      const typeChecker = program.getTypeChecker();
      let funcDecl: ts.FunctionDeclaration | undefined;

      ts.forEachChild(sourceFile, (node) => {
        if (ts.isFunctionDeclaration(node)) {
          funcDecl = node;
        }
      });

      if (!funcDecl) {
        throw new Error('Function declaration not found');
      }

      const props = extractProps(funcDecl, typeChecker);

      expect(props.length).toBe(1);
      expect(props[0].name).toBe('name');
      expect(props.some((p) => p.name === 'children')).toBe(false);
      expect(props.some((p) => p.name === 'key')).toBe(false);
      expect(props.some((p) => p.name === 'ref')).toBe(false);
    });
  });

  describe('Class Component Props', () => {
    it('should extract props from a class component', () => {
      const sourceCode = `
        import React from 'react';
        
        interface UserCardProps {
          name: string;
          age?: number;
        }
        
        class UserCard extends React.Component<UserCardProps> {
          render() {
            return <div>{this.props.name}</div>;
          }
        }
      `;

      const { program, getSourceFile } = createTestProgram({ 'test.tsx': sourceCode });
      const sourceFile = getSourceFile('test.tsx');

      if (!sourceFile) {
        throw new Error('Source file not found');
      }

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

      expect(props.length).toBe(2);
      expect(props.some((p) => p.name === 'name' && p.required)).toBe(true);
      expect(props.some((p) => p.name === 'age' && !p.required)).toBe(true);
    });
  });
});

describe('React Adapter - Events Extractor', () => {
  describe('Callback Props', () => {
    it('should extract events from callback props (on* pattern)', () => {
      const sourceCode = `
        import React from 'react';
        
        interface UserCardProps {
          onClick: (event: { id: string }) => void;
          onHover?: () => void;
        }
        
        function UserCard(props: UserCardProps) {
          return <div onClick={() => props.onClick({ id: '123' })} />;
        }
      `;

      const { program, getSourceFile } = createTestProgram({ 'test.tsx': sourceCode });
      const sourceFile = getSourceFile('test.tsx');

      if (!sourceFile) {
        throw new Error('Source file not found');
      }

      const typeChecker = program.getTypeChecker();
      let funcDecl: ts.FunctionDeclaration | undefined;

      ts.forEachChild(sourceFile, (node) => {
        if (ts.isFunctionDeclaration(node)) {
          funcDecl = node;
        }
      });

      if (!funcDecl) {
        throw new Error('Function declaration not found');
      }

      const events = extractEvents(funcDecl, typeChecker);

      expect(events.length).toBeGreaterThanOrEqual(1);

      const clickEvent = events.find((e) => e.name === 'click');
      expect(clickEvent).toBeDefined();
      expect(clickEvent?.type).toBe('CustomEvent');
      expect(clickEvent?.source).toBe('output');
    });
  });

  describe('DispatchEvent Calls', () => {
    it('should extract events from dispatchEvent calls', () => {
      const sourceCode = `
        import React from 'react';
        
        class UserCard extends React.Component {
          handleClick() {
            this.dispatchEvent(new CustomEvent('userClick', { detail: { id: '123' } }));
          }
          
          render() {
            return <div />;
          }
        }
      `;

      const { program, getSourceFile } = createTestProgram({ 'test.tsx': sourceCode });
      const sourceFile = getSourceFile('test.tsx');

      if (!sourceFile) {
        throw new Error('Source file not found');
      }

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

      const userClickEvent = events.find((e) => e.name === 'userClick');
      expect(userClickEvent).toBeDefined();
      expect(userClickEvent?.type).toBe('CustomEvent');
      expect(userClickEvent?.source).toBe('dispatchEvent');
    });
  });
});

describe('React Adapter - Component Discovery', () => {
  it('should find function component by name', () => {
    const sourceCode = `
      import React from 'react';
      
      function MyComponent() {
        return <div>Hello</div>;
      }
      
      const OtherComponent = () => <div>Other</div>;
    `;

    const sourceFile = ts.createSourceFile('test.tsx', sourceCode, ts.ScriptTarget.Latest, true);

    const myComponent = findComponentByName(sourceFile, 'MyComponent');
    expect(myComponent).toBeDefined();
    expect(ts.isFunctionDeclaration(myComponent!)).toBe(true);

    const otherComponent = findComponentByName(sourceFile, 'OtherComponent');
    expect(otherComponent).toBeDefined();
  });

  it('should find class component by name', () => {
    const sourceCode = `
      import React from 'react';
      
      class MyClassComponent extends React.Component {
        render() {
          return <div>Hello</div>;
        }
      }
    `;

    const sourceFile = ts.createSourceFile('test.tsx', sourceCode, ts.ScriptTarget.Latest, true);

    const myComponent = findComponentByName(sourceFile, 'MyClassComponent');
    expect(myComponent).toBeDefined();
    expect(ts.isClassDeclaration(myComponent!)).toBe(true);
  });
});

describe('React Adapter - Federation Config', () => {
  it('should extract webpack module federation config', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'owcs-test-'));

    const webpackConfig = `
      const ModuleFederationPlugin = require('webpack/container/ModuleFederationPlugin');
      
      module.exports = {
        plugins: [
          new ModuleFederationPlugin({
            name: 'reactApp',
            filename: 'remoteEntry.js',
            exposes: {
              './UserCard': './src/components/UserCard',
            },
            library: {
              type: 'var',
            },
          }),
        ],
      };
    `;

    fs.writeFileSync(path.join(tempDir, 'webpack.config.js'), webpackConfig);

    const config = extractFederationConfig(tempDir);

    expect(config.bundler).toBe('webpack');
    expect(config.federation).toBeDefined();
    expect(config.federation?.remoteName).toBe('reactApp');
    expect(config.federation?.libraryType).toBe('var');
    expect(config.federation?.exposes).toBeDefined();
    expect(config.federation?.exposes?.['./UserCard']).toBe('./src/components/UserCard');

    // Cleanup
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should extract vite federation config', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'owcs-test-'));

    const viteConfig = `
      import { defineConfig } from 'vite';
      import federation from '@originjs/vite-plugin-federation';
      
      export default defineConfig({
        plugins: [
          federation({
            name: 'viteReactApp',
            filename: 'remoteEntry.js',
            exposes: {
              './Button': './src/components/Button.tsx',
            },
          }),
        ],
      });
    `;

    fs.writeFileSync(path.join(tempDir, 'vite.config.js'), viteConfig);

    const config = extractFederationConfig(tempDir);

    expect(config.bundler).toBe('vite');
    expect(config.federation).toBeDefined();
    expect(config.federation?.remoteName).toBe('viteReactApp');
    expect(config.federation?.exposes).toBeDefined();
    expect(config.federation?.exposes?.['./Button']).toBe('./src/components/Button.tsx');

    // Cleanup
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should default to webpack when no config found', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'owcs-test-'));

    const config = extractFederationConfig(tempDir);

    expect(config.bundler).toBe('webpack');
    expect(config.federation).toBeUndefined();

    // Cleanup
    fs.rmSync(tempDir, { recursive: true, force: true });
  });
});
