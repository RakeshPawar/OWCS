import * as ts from 'typescript';
import { findCallExpressions, getStringLiteralValue } from '../../core/ast-walker';

/**
 * Component registration info extracted from customElements.define()
 */
export interface ComponentRegistration {
  tagName: string;
  className: string;
  sourceFile: ts.SourceFile;
}

/**
 * Discovers web components by finding customElements.define() calls
 * 
 * Example pattern:
 * customElements.define('my-component', MyComponent);
 */
export function discoverComponents(
  program: ts.Program
): ComponentRegistration[] {
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
      
      if (
        ts.isIdentifier(obj) &&
        obj.text === 'customElements' &&
        ts.isIdentifier(method) &&
        method.text === 'define'
      ) {
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
function extractRegistration(
  call: ts.CallExpression,
  sourceFile: ts.SourceFile
): ComponentRegistration | undefined {
  // customElements.define() must have at least 2 arguments
  if (call.arguments.length < 2) {
    return undefined;
  }
  
  // First argument must be a string literal (tag name)
  const tagNameArg = call.arguments[0];
  const tagName = getStringLiteralValue(tagNameArg);
  
  if (!tagName) {
    console.warn(`Invalid tag name in customElements.define at ${sourceFile.fileName}`);
    return undefined;
  }
  
  // Second argument must be an identifier (class name)
  const classArg = call.arguments[1];
  if (!ts.isIdentifier(classArg)) {
    console.warn(`Invalid class reference in customElements.define for tag ${tagName} at ${sourceFile.fileName}, ${classArg.getText()}`);
    return undefined;
  }
  
  const className = classArg.text;
  
  return {
    tagName,
    className,
    sourceFile,
  };
}

/**
 * Finds a class declaration by name in the program
 */
export function findClassByName(
  program: ts.Program,
  className: string,
  sourceFile: ts.SourceFile
): ts.ClassDeclaration | undefined {
  // First, try to find in the same source file
  const localClass = findClassInFile(sourceFile, className);
  if (localClass) {
    return localClass;
  }
  
  // Try to resolve through imports
  const importedClass = resolveImportedClass(sourceFile, className, program);
  if (importedClass) {
    return importedClass;
  }
  
  return undefined;
}

/**
 * Finds a class declaration in a specific source file
 */
function findClassInFile(
  sourceFile: ts.SourceFile,
  className: string
): ts.ClassDeclaration | undefined {
  let result: ts.ClassDeclaration | undefined;
  
  function visit(node: ts.Node): void {
    if (result) return;
    
    if (ts.isClassDeclaration(node) && node.name?.text === className) {
      result = node;
      return;
    }
    
    ts.forEachChild(node, visit);
  }
  
  visit(sourceFile);
  return result;
}

/**
 * Resolves an imported class by following import statements
 */
function resolveImportedClass(
  sourceFile: ts.SourceFile,
  className: string,
  program: ts.Program
): ts.ClassDeclaration | undefined {
  const typeChecker = program.getTypeChecker();
  
  // Find import declaration for the class
  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement)) {
      const importClause = statement.importClause;
      if (!importClause) continue;
      
      const namedBindings = importClause.namedBindings;
      if (namedBindings && ts.isNamedImports(namedBindings)) {
        for (const element of namedBindings.elements) {
          if (element.name.text === className) {
            // Found the import, now resolve the symbol
            const symbol = typeChecker.getSymbolAtLocation(element.name);
            if (symbol) {
              const declarations = symbol.getDeclarations();
              if (declarations && declarations.length > 0) {
                const declaration = declarations[0];
                if (ts.isClassDeclaration(declaration)) {
                  return declaration;
                }
              }
            }
          }
        }
      }
    }
  }
  
  return undefined;
}

/**
 * Gets the module path for a component (relative to project root)
 */
export function getModulePath(sourceFile: ts.SourceFile, projectRoot: string): string {
  let path = sourceFile.fileName;
  
  if (path.startsWith(projectRoot)) {
    path = path.substring(projectRoot.length);
  }
  
  // Remove leading slash
  if (path.startsWith('/')) {
    path = path.substring(1);
  }
  
  return path;
}
