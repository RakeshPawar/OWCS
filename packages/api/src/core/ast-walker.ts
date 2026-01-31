import * as ts from 'typescript';

/**
 * Generic visitor function for AST traversal
 */
export type ASTVisitor<T> = (node: ts.Node, context: T) => void;

/**
 * Traverses the AST and calls the visitor for each node
 */
export function walkAST<T>(node: ts.Node, visitor: ASTVisitor<T>, context: T): void {
  visitor(node, context);
  ts.forEachChild(node, (child) => walkAST(child, visitor, context));
}

/**
 * Finds all class declarations in a source file
 */
export function findClassDeclarations(sourceFile: ts.SourceFile): ts.ClassDeclaration[] {
  const classes: ts.ClassDeclaration[] = [];

  walkAST(
    sourceFile,
    (node) => {
      if (ts.isClassDeclaration(node) && node.name) {
        classes.push(node);
      }
    },
    null
  );

  return classes;
}

/**
 * Finds decorator by name on a node
 */
export function findDecorator(node: ts.Node, decoratorName: string): ts.Decorator | undefined {
  if (!ts.canHaveDecorators(node)) {
    return undefined;
  }

  const decorators = ts.getDecorators(node);
  if (!decorators) {
    return undefined;
  }

  return decorators.find((decorator) => {
    const expression = decorator.expression;

    if (ts.isCallExpression(expression)) {
      const identifier = expression.expression;
      if (ts.isIdentifier(identifier) && identifier.text === decoratorName) {
        return true;
      }
    } else if (ts.isIdentifier(expression) && expression.text === decoratorName) {
      return true;
    }

    return false;
  });
}

/**
 * Gets the first argument of a decorator call expression
 */
export function getDecoratorArgument(decorator: ts.Decorator, index: number = 0): ts.Expression | undefined {
  const expression = decorator.expression;

  if (ts.isCallExpression(expression) && expression.arguments.length > index) {
    return expression.arguments[index];
  }

  return undefined;
}

/**
 * Extracts string literal value from an expression
 */
export function getStringLiteralValue(expression: ts.Expression | undefined): string | undefined {
  if (!expression) {
    return undefined;
  }

  if (ts.isStringLiteral(expression)) {
    return expression.text;
  }

  return undefined;
}

/**
 * Checks if a property has a specific decorator
 */
export function hasDecorator(node: ts.Node, decoratorName: string): boolean {
  return findDecorator(node, decoratorName) !== undefined;
}

/**
 * Gets all properties of a class
 */
export function getClassProperties(classDecl: ts.ClassDeclaration): ts.PropertyDeclaration[] {
  const properties: ts.PropertyDeclaration[] = [];

  classDecl.members.forEach((member) => {
    if (ts.isPropertyDeclaration(member)) {
      properties.push(member);
    }
  });

  return properties;
}

/**
 * Checks if a property is optional
 */
export function isPropertyOptional(property: ts.PropertyDeclaration): boolean {
  return property.questionToken !== undefined || property.exclamationToken !== undefined;
}

/**
 * Gets the type of a node as a string representation
 */
export function getTypeString(node: ts.Node, typeChecker?: ts.TypeChecker): string {
  if (!typeChecker) {
    return 'any';
  }

  const type = typeChecker.getTypeAtLocation(node);
  return typeChecker.typeToString(type);
}

/**
 * Finds all call expressions matching a specific pattern
 */
export function findCallExpressions(sourceFile: ts.SourceFile, predicate: (call: ts.CallExpression) => boolean): ts.CallExpression[] {
  const calls: ts.CallExpression[] = [];

  walkAST(
    sourceFile,
    (node) => {
      if (ts.isCallExpression(node) && predicate(node)) {
        calls.push(node);
      }
    },
    null
  );

  return calls;
}

/**
 * Checks if a call expression is a method call on a specific object
 */
export function isMethodCall(call: ts.CallExpression, objectName: string, methodName: string): boolean {
  const expression = call.expression;

  if (ts.isPropertyAccessExpression(expression)) {
    const obj = expression.expression;
    const method = expression.name;

    if (ts.isIdentifier(method) && method.text === methodName) {
      if (ts.isIdentifier(obj) && obj.text === objectName) {
        return true;
      }
      if (obj.kind === ts.SyntaxKind.ThisKeyword) {
        return objectName === 'this';
      }
    }
  }

  return false;
}

/**
 * Gets object literal properties as a map
 */
export function getObjectLiteralProperties(node: ts.ObjectLiteralExpression): Map<string, ts.Expression> {
  const map = new Map<string, ts.Expression>();

  node.properties.forEach((prop) => {
    if (ts.isPropertyAssignment(prop)) {
      const name = prop.name;
      if (ts.isIdentifier(name) || ts.isStringLiteral(name)) {
        const key = ts.isIdentifier(name) ? name.text : name.text;
        map.set(key, prop.initializer);
      }
    }
  });

  return map;
}
