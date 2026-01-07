import * as ts from 'typescript';
import { findCallExpressions, getStringLiteralValue } from '../../core/ast-walker';
import * as path from 'path';

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
  
  // First, build a map of createCustomElement calls: variable -> component class
  const customElementMap = buildCustomElementMap(sourceFile);
  
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
    const registration = extractRegistration(call, sourceFile, customElementMap);
    if (registration) {
      registrations.push(registration);
    }
  }
  
  return registrations;
}

/**
 * Builds a map of variables created by createCustomElement() calls
 * Maps variable name to the component class name used in createCustomElement()
 * Searches recursively through all nested contexts (functions, blocks, etc.)
 */
function buildCustomElementMap(sourceFile: ts.SourceFile): Map<string, string> {
  const map = new Map<string, string>();
  
  function visit(node: ts.Node): void {
    // Look for: const ce = createCustomElement(ComponentClass, {...})
    // This can be nested inside functions, if statements, etc.
    if (ts.isVariableDeclaration(node)) {
      if (node.initializer && ts.isCallExpression(node.initializer)) {
        const call = node.initializer;
        
        // Check if it's a createCustomElement call
        if (ts.isIdentifier(call.expression) && call.expression.text === 'createCustomElement') {
          // First argument should be the component class
          if (call.arguments.length > 0 && ts.isIdentifier(call.arguments[0])) {
            const componentClass = call.arguments[0].text;
            
            // Get the variable name
            if (ts.isIdentifier(node.name)) {
              const variableName = node.name.text;
              map.set(variableName, componentClass);
              console.log(`Found createCustomElement: ${variableName} -> ${componentClass}`);
            }
          }
        }
      }
    }
    
    // Recursively visit all child nodes
    ts.forEachChild(node, visit);
  }
  
  visit(sourceFile);
  return map;
}

/**
 * Extracts registration info from a customElements.define() call
 */
function extractRegistration(
  call: ts.CallExpression,
  sourceFile: ts.SourceFile,
  customElementMap: Map<string, string>
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
  
  // Second argument can be either:
  // 1. Direct class reference: customElements.define('tag', ComponentClass)
  // 2. Variable from createCustomElement: customElements.define('tag', ce)
  const classArg = call.arguments[1];
  let className: string | undefined;
  
  if (ts.isIdentifier(classArg)) {
    const argText = classArg.text;
    
    // Check if this is a variable from createCustomElement
    if (customElementMap.has(argText)) {
      className = customElementMap.get(argText);
      console.log(`Resolved ${argText} -> ${className} for tag ${tagName}`);
    } else {
      // Direct class reference
      className = argText;
    }
  }
  
  if (!className) {
    console.warn(`Could not resolve class for tag ${tagName} at ${sourceFile.fileName}`);
    return undefined;
  }
  
  return {
    tagName,
    className,
    sourceFile,
  };
}

/**
 * Finds a class declaration by name in the program
 * Prioritizes imports since component classes are typically imported into registration files
 */
export function findClassByName(
  program: ts.Program,
  className: string,
  sourceFile: ts.SourceFile
): ts.ClassDeclaration | undefined {
  // First, try to resolve through imports (most common case)
  const importedClass = resolveImportedClass(sourceFile, className, program);
  if (importedClass) {
    console.log(`Found ${className} via import in ${sourceFile.fileName}`);
    return importedClass;
  }
  
  // Fallback: check if defined locally in the same source file
  const localClass = findClassInFile(sourceFile, className);
  if (localClass) {
    console.log(`Found ${className} locally in ${sourceFile.fileName}`);
    return localClass;
  }
  
  console.warn(`Could not find class ${className} in ${sourceFile.fileName} or its imports`);
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
  
  console.log(`Resolving imported class ${className} in ${sourceFile.fileName}`);
  
  // Find import declaration for the class
  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement)) {
      const importClause = statement.importClause;
      if (!importClause) continue;
      
      const namedBindings = importClause.namedBindings;
      if (namedBindings && ts.isNamedImports(namedBindings)) {
        for (const element of namedBindings.elements) {
          console.log(`  Checking import: ${element.name.text}`);
          if (element.name.text === className) {
            console.log(`  Found matching import for ${className}`);
            
            // Method 1: Try using TypeChecker to resolve symbol
            const symbol = typeChecker.getSymbolAtLocation(element.name);
            if (symbol) {
              console.log(`  Symbol found for ${className}`);
              const declarations = symbol.getDeclarations();
              if (declarations && declarations.length > 0) {
                console.log(`  Found ${declarations.length} declaration(s)`);
                for (const declaration of declarations) {
                  if (ts.isClassDeclaration(declaration)) {
                    console.log(`  ✓ Resolved to class declaration via symbol`);
                    return declaration;
                  }
                }
                console.log(`  ✗ No class declaration found in symbols`);
              }
            }
            
            // Method 2: Manually resolve the import path
            console.log(`  Attempting manual import resolution...`);
            const moduleSpecifier = statement.moduleSpecifier;
            if (ts.isStringLiteral(moduleSpecifier)) {
              const importPath = moduleSpecifier.text;
              console.log(`  Import path: ${importPath}`);
              const resolvedClass = resolveImportManually(sourceFile, importPath, className, program);
              if (resolvedClass) {
                console.log(`  ✓ Resolved via manual resolution`);
                return resolvedClass;
              }
            }
          }
        }
      }
    }
  }
  
  console.log(`  ✗ Import not found for ${className}`);
  return undefined;
}

/**
 * Manually resolves an import by searching for the file
 */
function resolveImportManually(
  sourceFile: ts.SourceFile,
  importPath: string,
  className: string,
  program: ts.Program
): ts.ClassDeclaration | undefined {
  const sourceDir = path.dirname(sourceFile.fileName);
  
  // Handle relative imports
  let resolvedPath: string;
  if (importPath.startsWith('./') || importPath.startsWith('../')) {
    resolvedPath = path.resolve(sourceDir, importPath);
    
    // Try with different extensions
    const possiblePaths = [
      `${resolvedPath}.ts`,
      `${resolvedPath}.tsx`,
      `${resolvedPath}/index.ts`,
      `${resolvedPath}/index.tsx`,
      resolvedPath, // In case it already has extension
    ];
    
    for (const filePath of possiblePaths) {
      console.log(`    Trying: ${filePath}`);
      const targetFile = program.getSourceFile(filePath);
      if (targetFile) {
        console.log(`    Found source file: ${filePath}`);
        const classDecl = findClassInFile(targetFile, className);
        if (classDecl) {
          return classDecl;
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
