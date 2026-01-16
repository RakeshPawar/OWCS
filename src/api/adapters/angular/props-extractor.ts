import * as ts from 'typescript';
import { PropModel, JSONSchema } from '../../model/intermediate.js';
import { getClassProperties, findDecorator, getDecoratorArgument, getStringLiteralValue, isPropertyOptional } from '../../core/ast-walker.js';
import { typeNodeToJsonSchema } from '../shared/type.utils.js';

/**
 * Extracts props from an Angular component class using @Input() decorators and input signals
 */
export function extractProps(classDecl: ts.ClassDeclaration, typeChecker: ts.TypeChecker): PropModel[] {
  const props: PropModel[] = [];
  const properties = getClassProperties(classDecl);

  for (const property of properties) {
    const inputDecorator = findDecorator(property, 'Input');

    if (inputDecorator) {
      const prop = extractInputProp(property, inputDecorator, typeChecker);
      if (prop) {
        props.push(prop);
      }
    } else if (property.initializer) {
      // Check for input signal: input() or input.required()
      const prop = extractInputSignalProp(property, typeChecker);
      if (prop) {
        props.push(prop);
      }
    }
  }

  return props;
}

/**
 * Extracts a single prop from a property with @Input() decorator
 */
function extractInputProp(property: ts.PropertyDeclaration, decorator: ts.Decorator, typeChecker: ts.TypeChecker): PropModel | undefined {
  const propertyName = property.name;

  if (!ts.isIdentifier(propertyName)) {
    return undefined;
  }

  const name = propertyName.text;

  // Check for @Input('alias') pattern
  const decoratorArg = getDecoratorArgument(decorator, 0);
  const attribute = getStringLiteralValue(decoratorArg) || name;

  // Determine if required
  const required = !isPropertyOptional(property);

  // Convert TypeScript type to JSON Schema
  const schema = typeNodeToJsonSchema(property.type, typeChecker);

  return {
    name,
    attribute,
    schema,
    required,
    source: 'input',
  };
}

/**
 * Extracts a single prop from a property with input signal (input() or input.required())
 */
function extractInputSignalProp(property: ts.PropertyDeclaration, typeChecker: ts.TypeChecker): PropModel | undefined {
  const propertyName = property.name;

  if (!ts.isIdentifier(propertyName)) {
    return undefined;
  }

  const name = propertyName.text;
  const initializer = property.initializer;

  if (!initializer) {
    return undefined;
  }

  // Check if it's a call to input() or input.required()
  let callExpression: ts.CallExpression | undefined;
  let isRequired = false;

  if (ts.isCallExpression(initializer)) {
    const expr = initializer.expression;

    // Check for input() direct call
    if (ts.isIdentifier(expr) && expr.text === 'input') {
      callExpression = initializer;
      isRequired = false;
    }
    // Check for input.required() call
    else if (ts.isPropertyAccessExpression(expr)) {
      if (ts.isIdentifier(expr.expression) && expr.expression.text === 'input' && expr.name.text === 'required') {
        callExpression = initializer;
        isRequired = true;
      }
    }
  }

  if (!callExpression) {
    return undefined;
  }

  // Extract type from generic type argument
  let schema: JSONSchema = { type: 'any' };

  if (callExpression.typeArguments && callExpression.typeArguments.length > 0) {
    schema = typeNodeToJsonSchema(callExpression.typeArguments[0], typeChecker);
  }

  // Check for alias in options: input({ alias: 'customName' })
  let attribute = name;

  if (callExpression.arguments.length > 0) {
    const firstArg = callExpression.arguments[0];

    // Check if it's an options object with alias property
    if (ts.isObjectLiteralExpression(firstArg)) {
      for (const prop of firstArg.properties) {
        if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name) && prop.name.text === 'alias') {
          const aliasValue = getStringLiteralValue(prop.initializer);
          if (aliasValue) {
            attribute = aliasValue;
          }
        }
      }
    }
  }

  return {
    name,
    attribute,
    schema,
    required: isRequired,
    source: 'input',
  };
}
