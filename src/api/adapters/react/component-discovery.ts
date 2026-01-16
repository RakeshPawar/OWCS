import * as ts from 'typescript';
import { findCallExpressions, getStringLiteralValue } from '../../core/ast-walker.js';
import path from 'node:path';

/**
 * Component registration info extracted from customElements.define()
 */
export interface ComponentRegistration {
  tagName: string;
  className: string;
  sourceFile: ts.SourceFile;
}

/**
 * Discovers React web components by finding customElements.define() calls
 */
export function discoverComponents(program: ts.Program): ComponentRegistration[] {
  const registrations: ComponentRegistration[] = [];

  for (const sourceFile of program.getSourceFiles()) {
    // Skip declaration files and node_modules
    if (sourceFile.isDeclarationFile || sourceFile.fileName.includes('node_modules')) {
      continue;
    }

    console.log(`Analyzing file: ${sourceFile.fileName}`);
    const fileRegistrations = findCustomElementsDefine(sourceFile);
    registrations.push(...fileRegistrations);
  }

  return registrations;
}

/**
 * Finds all customElements.define() calls in a source file
 */
function findCustomElementsDefine(sourceFile: ts.SourceFile): ComponentRegistration[] {
  const registrations: ComponentRegistration[] = [];

  const calls = findCallExpressions(sourceFile, (call) => {
    const expression = call.expression;

    // Check for customElements.define pattern
    if (ts.isPropertyAccessExpression(expression)) {
      const obj = expression.expression;
      const method = expression.name;

      if (ts.isIdentifier(obj) && obj.text === 'customElements' && ts.isIdentifier(method) && method.text === 'define') {
        return true;
      }
    }

    return false;
  });

  for (const call of calls) {
    const registration = extractRegistration(call, sourceFile);
    if (registration) {
      registrations.push(registration);
    }
  }

  return registrations;
}

/**
 * Extracts registration info from a customElements.define() call
 */
function extractRegistration(call: ts.CallExpression, sourceFile: ts.SourceFile): ComponentRegistration | undefined {
  if (call.arguments.length < 2) {
    return undefined;
  }

  // First argument is the tag name
  const tagNameArg = call.arguments[0];
  const tagName = getStringLiteralValue(tagNameArg);

  if (!tagName) {
    console.warn('Could not extract tag name from customElements.define()');
    return undefined;
  }

  // Second argument is the component class or wrapper call
  let className: string | undefined;
  const componentArg = call.arguments[1];

  if (ts.isIdentifier(componentArg)) {
    // Direct reference: customElements.define('my-component', MyComponent)
    // or via variable: customElements.define('my-component', myWC)
    className = componentArg.text;
  }

  if (!className) {
    console.warn(`Could not extract component class name for tag: ${tagName}`);
    return undefined;
  }

  return {
    tagName,
    className,
    sourceFile,
  };
}

/**
 * Finds a class or function declaration by name in a source file
 */
export function findComponentByName(sourceFile: ts.SourceFile, name: string): ts.ClassDeclaration | ts.FunctionDeclaration | undefined {
  let result: ts.ClassDeclaration | ts.FunctionDeclaration | undefined;

  function visit(node: ts.Node): void {
    if (result) return;

    // Class component
    if (ts.isClassDeclaration(node) && node.name && node.name.text === name) {
      result = node;
      return;
    }

    // Function component or arrow function
    if (ts.isFunctionDeclaration(node) && node.name && node.name.text === name) {
      result = node;
      return;
    }

    // Variable declaration with arrow function: const MyComponent = () => {...}
    if (ts.isVariableStatement(node)) {
      for (const declaration of node.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name) && declaration.name.text === name) {
          if (declaration.initializer && (ts.isArrowFunction(declaration.initializer) || ts.isFunctionExpression(declaration.initializer))) {
            // Create a synthetic function declaration for consistency
            const syntheticFunc = ts.factory.createFunctionDeclaration(
              undefined,
              undefined,
              declaration.name,
              undefined,
              declaration.initializer.parameters,
              undefined,
              ts.isArrowFunction(declaration.initializer) && ts.isBlock(declaration.initializer.body)
                ? declaration.initializer.body
                : ts.factory.createBlock([])
            );
            result = syntheticFunc;
            return;
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return result;
}

/**
 * Gets the module path for a component's source file
 */
export function getModulePath(sourceFile: ts.SourceFile, projectRoot: string): string {
  const relativePath = path.relative(projectRoot, sourceFile.fileName);
  return relativePath.replace(/\\/g, '/');
}
