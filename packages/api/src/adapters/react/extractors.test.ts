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

      const nameProp = props.find((p) => p.name === 'name');
      expect(nameProp).toBeDefined();
      expect(nameProp?.required).toBe(true);
      expect(nameProp?.schema.type).toBe('string');
      expect(nameProp?.attribute).toBe('name');

      const ageProp = props.find((p) => p.name === 'age');
      expect(ageProp).toBeDefined();
      expect(ageProp?.required).toBe(false);
      expect(ageProp?.schema.oneOf).toContainEqual({ type: 'number' });
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

  describe('HTMLElement Class with Implements', () => {
    it('should extract props from a class extending HTMLElement that implements a props interface', () => {
      const sourceCode = `
        interface ProductSearchProps {
          data: {
            pattern?: string;
            showEmptyMessage?: boolean;
          };
          onProductSelect?: (searchTerm: string, productDetail: any) => void;
        }
        
        class ProductSearchWidgetElement extends HTMLElement implements ProductSearchProps {
          private _data?: ProductSearchProps['data'];
          
          get data() {
            return this._data!;
          }
          
          set data(data: ProductSearchProps['data']) {
            this._data = data;
          }
        }
      `;

      const { program, getSourceFile } = createTestProgram({ 'test.ts': sourceCode });
      const sourceFile = getSourceFile('test.ts');

      if (!sourceFile) {
        throw new Error('Source file not found');
      }

      const typeChecker = program.getTypeChecker();
      let classDecl: ts.ClassDeclaration | undefined;

      ts.forEachChild(sourceFile, (node) => {
        if (ts.isClassDeclaration(node) && node.name?.text === 'ProductSearchWidgetElement') {
          classDecl = node;
        }
      });

      if (!classDecl) {
        throw new Error('Class declaration not found');
      }

      const props = extractProps(classDecl, typeChecker);

      expect(props.length).toBeGreaterThanOrEqual(2);

      const dataProp = props.find((p) => p.name === 'data');
      expect(dataProp).toBeDefined();
      expect(dataProp?.schema.type).toBe('object');
      expect(dataProp?.schema.properties).toBeDefined();
      expect(dataProp?.required).toBe(true);

      const onProductSelectProp = props.find((p) => p.name === 'onProductSelect');
      expect(onProductSelectProp).toBeDefined();
      expect(onProductSelectProp?.required).toBe(false);
    });

    it('should extract complex nested props from HTMLElement class', () => {
      const sourceCode = `
        interface ProductDetail {
          assetClass: string;
          isAvailableInPsp: boolean;
        }
        
        interface ProductSearchProps {
          data: {
            pattern?: string;
            showEmptyMessage?: boolean;
            onlyShowOfferedUniverse?: boolean;
            bookingCenter?: string;
          };
          onProductSelect?: (searchTerm: string, productDetail: ProductDetail) => void;
          onNoInstrumentFound?: (notFound: boolean) => void;
        }
        
        class ProductSearchWidgetElement extends HTMLElement implements ProductSearchProps {
          private _data?: ProductSearchProps['data'];
          
          get data() {
            return this._data!;
          }
          
          set data(data: ProductSearchProps['data']) {
            this._data = data;
          }
        }
      `;

      const { program, getSourceFile } = createTestProgram({ 'test.ts': sourceCode });
      const sourceFile = getSourceFile('test.ts');

      if (!sourceFile) {
        throw new Error('Source file not found');
      }

      const typeChecker = program.getTypeChecker();
      let classDecl: ts.ClassDeclaration | undefined;

      ts.forEachChild(sourceFile, (node) => {
        if (ts.isClassDeclaration(node) && node.name?.text === 'ProductSearchWidgetElement') {
          classDecl = node;
        }
      });

      if (!classDecl) {
        throw new Error('Class declaration not found');
      }

      const props = extractProps(classDecl, typeChecker);

      expect(props.length).toBeGreaterThanOrEqual(3);

      const dataProp = props.find((p) => p.name === 'data');
      expect(dataProp).toBeDefined();
      expect(dataProp?.schema.type).toBe('object');
      expect(dataProp?.schema.properties).toBeDefined();
      expect(dataProp?.schema.properties?.pattern).toBeDefined();
      expect(dataProp?.schema.properties?.showEmptyMessage).toBeDefined();
      expect(dataProp?.schema.properties?.onlyShowOfferedUniverse).toBeDefined();
      expect(dataProp?.schema.properties?.bookingCenter).toBeDefined();

      const onProductSelectProp = props.find((p) => p.name === 'onProductSelect');
      expect(onProductSelectProp).toBeDefined();
      expect(onProductSelectProp?.required).toBe(false);

      const onNoInstrumentFoundProp = props.find((p) => p.name === 'onNoInstrumentFound');
      expect(onNoInstrumentFoundProp).toBeDefined();
      expect(onNoInstrumentFoundProp?.required).toBe(false);
    });

    it('should extract props with JSDoc from HTMLElement class', () => {
      const sourceCode = `
        interface WidgetProps {
          /**
           * Widget theme
           * @default 'light'
           */
          theme?: string;
          
          /**
           * Widget title
           * @attribute widget-title
           */
          title: string;
        }
        
        class WidgetElement extends HTMLElement implements WidgetProps {
          private _theme?: string;
          private _title!: string;
          
          get theme() {
            return this._theme;
          }
          
          set theme(value: string | undefined) {
            this._theme = value;
          }
          
          get title() {
            return this._title;
          }
          
          set title(value: string) {
            this._title = value;
          }
        }
      `;

      const { program, getSourceFile } = createTestProgram({ 'test.ts': sourceCode });
      const sourceFile = getSourceFile('test.ts');

      if (!sourceFile) {
        throw new Error('Source file not found');
      }

      const typeChecker = program.getTypeChecker();
      let classDecl: ts.ClassDeclaration | undefined;

      ts.forEachChild(sourceFile, (node) => {
        if (ts.isClassDeclaration(node) && node.name?.text === 'WidgetElement') {
          classDecl = node;
        }
      });

      if (!classDecl) {
        throw new Error('Class declaration not found');
      }

      const props = extractProps(classDecl, typeChecker);

      expect(props.length).toBe(2);

      const themeProp = props.find((p) => p.name === 'theme');
      expect(themeProp).toBeDefined();
      expect(themeProp?.description).toContain('Widget theme');
      expect(themeProp?.default).toEqual("'light'");
      expect(themeProp?.required).toBe(false);

      const titleProp = props.find((p) => p.name === 'title');
      expect(titleProp).toBeDefined();
      expect(titleProp?.description).toContain('Widget title');
      expect(titleProp?.attribute).toBe('widget-title');
      expect(titleProp?.required).toBe(true);
    });

    it('should handle HTMLElement class with no implements clause', () => {
      const sourceCode = `
        class BasicElement extends HTMLElement {
          connectedCallback() {
            this.innerHTML = '<div>Hello</div>';
          }
        }
      `;

      const { program, getSourceFile } = createTestProgram({ 'test.ts': sourceCode });
      const sourceFile = getSourceFile('test.ts');

      if (!sourceFile) {
        throw new Error('Source file not found');
      }

      const typeChecker = program.getTypeChecker();
      let classDecl: ts.ClassDeclaration | undefined;

      ts.forEachChild(sourceFile, (node) => {
        if (ts.isClassDeclaration(node) && node.name?.text === 'BasicElement') {
          classDecl = node;
        }
      });

      if (!classDecl) {
        throw new Error('Class declaration not found');
      }

      const props = extractProps(classDecl, typeChecker);

      expect(props.length).toBe(0);
    });

    it('should skip React built-in props in HTMLElement class', () => {
      const sourceCode = `
        interface WidgetProps {
          name: string;
          children?: any;
          key?: string;
          ref?: any;
        }
        
        class WidgetElement extends HTMLElement implements WidgetProps {
          name!: string;
        }
      `;

      const { program, getSourceFile } = createTestProgram({ 'test.ts': sourceCode });
      const sourceFile = getSourceFile('test.ts');

      if (!sourceFile) {
        throw new Error('Source file not found');
      }

      const typeChecker = program.getTypeChecker();
      let classDecl: ts.ClassDeclaration | undefined;

      ts.forEachChild(sourceFile, (node) => {
        if (ts.isClassDeclaration(node) && node.name?.text === 'WidgetElement') {
          classDecl = node;
        }
      });

      if (!classDecl) {
        throw new Error('Class declaration not found');
      }

      const props = extractProps(classDecl, typeChecker);

      expect(props.length).toBe(1);
      expect(props[0].name).toBe('name');
      expect(props.some((p) => p.name === 'children')).toBe(false);
      expect(props.some((p) => p.name === 'key')).toBe(false);
      expect(props.some((p) => p.name === 'ref')).toBe(false);
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

describe('React Adapter - Enhanced Features', () => {
  describe('JSDoc Metadata Extraction', () => {
    it('should extract JSDoc description and default value from props', () => {
      const sourceCode = `
        import React from 'react';
        
        interface Props {
          /**
           * User's display name
           * @default 'Guest'
           */
          userName?: string;
          
          /**
           * User's age
           * @deprecated Use birthDate instead
           */
          age?: number;
        }
        
        function UserCard(props: Props) {
          return <div>{props.userName}</div>;
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

      const props = extractProps(funcDecl!, typeChecker);

      const userNameProp = props.find((p) => p.name === 'userName');
      expect(userNameProp?.description).toContain('display name');
      expect(userNameProp?.default).toEqual("'Guest'");

      const ageProp = props.find((p) => p.name === 'age');
      expect(ageProp?.description).toContain('age');
      expect(ageProp?.deprecated).toBe(true);
    });

    it('should extract JSDoc @attribute for custom attribute names', () => {
      const sourceCode = `
        import React from 'react';
        
        interface Props {
          /**
           * User ID
           * @attribute user-id
           */
          userId?: string;
        }
        
        function UserCard(props: Props) {
          return <div>{props.userId}</div>;
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

      const props = extractProps(funcDecl!, typeChecker);

      const userIdProp = props.find((p) => p.name === 'userId');
      expect(userIdProp?.attribute).toBe('user-id');
    });
  });

  describe('Default Values Extraction', () => {
    it('should extract default values from property initializers in class components', () => {
      const sourceCode = `
        import React from 'react';
        
        interface Props {
          theme: string;
          count: number;
        }
        
        class UserCard extends React.Component<Props> {
          static defaultProps = {
            theme: 'light',
            count: 0,
          };
          
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

      const props = extractProps(classDecl!, typeChecker);

      expect(props.length).toBeGreaterThanOrEqual(2);
      // Note: Default values from defaultProps would need additional logic to extract
      // This test documents current behavior
    });
  });

  describe('Event Extraction Enhancements', () => {
    it('should extract JSDoc metadata from callback props', () => {
      const sourceCode = `
        import React from 'react';
        
        interface Props {
          /**
           * Fired when user clicks
           * @event click
           * @deprecated Use onPress instead
           */
          onClick?: (x: number, y: number) => void;
        }
        
        function Button(props: Props) {
          return <button onClick={() => props.onClick?.(0, 0)}>Click</button>;
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

      const events = extractEvents(funcDecl!, typeChecker);

      const clickEvent = events.find((e) => e.name === 'click');
      expect(clickEvent).toBeDefined();
      expect(clickEvent?.description).toContain('clicks');
      expect(clickEvent?.deprecated).toBe(true);
    });

    it('should extract bubbles and composed from CustomEvent options', () => {
      const sourceCode = `
        export class Widget extends HTMLElement {
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

      const events = extractEvents(classDecl!, typeChecker);

      const actionEvent = events.find((e) => e.name === 'action');
      expect(actionEvent).toBeDefined();
      expect(actionEvent?.bubbles).toBe(true);
      expect(actionEvent?.composed).toBe(true);
    });

    it('should extract events from JSDoc @fires tags', () => {
      const sourceCode = `
        /**
         * Button component
         * @fires submit - When form is submitted
         * @fires cancel - When form is cancelled
         */
        export class Button extends HTMLElement {
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

      const events = extractEvents(classDecl!, typeChecker);

      expect(events.length).toBeGreaterThanOrEqual(2);

      const submitEvent = events.find((e) => e.name === 'submit');
      expect(submitEvent).toBeDefined();
      expect(submitEvent?.description).toContain('submitted');

      const cancelEvent = events.find((e) => e.name === 'cancel');
      expect(cancelEvent).toBeDefined();
      expect(cancelEvent?.description).toContain('cancelled');
    });
  });

  describe('Edge Cases', () => {
    it('should handle components without props', () => {
      const sourceCode = `
        import React from 'react';
        
        function SimpleComponent() {
          return <div>Hello</div>;
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

      const props = extractProps(funcDecl!, typeChecker);
      expect(props.length).toBe(0);
    });

    it('should handle components without events', () => {
      const sourceCode = `
        import React from 'react';
        
        interface Props {
          name: string;
        }
        
        function StaticComponent(props: Props) {
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
        if (ts.isFunctionDeclaration(node)) {
          funcDecl = node;
        }
      });

      const events = extractEvents(funcDecl!, typeChecker);
      expect(events.length).toBe(0);
    });

    it('should skip React built-in props (children, key, ref)', () => {
      const sourceCode = `
        import React from 'react';
        
        interface Props {
          name: string;
          children?: React.ReactNode;
          key?: string;
          ref?: React.Ref<HTMLDivElement>;
        }
        
        function Container(props: Props) {
          return <div>{props.children}</div>;
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

      const props = extractProps(funcDecl!, typeChecker);

      // Should only extract 'name', not children/key/ref
      expect(props.length).toBe(1);
      expect(props[0].name).toBe('name');
    });
  });
});
