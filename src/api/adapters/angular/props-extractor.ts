import * as ts from 'typescript';
import { PropModel, JSONSchema } from '../../model/intermediate.js';
import { getClassProperties, findDecorator, getDecoratorArgument, getStringLiteralValue, isPropertyOptional } from '../../core/ast-walker.js';

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
  const schema = typeToJsonSchema(property.type, property, typeChecker);

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
    schema = typeToJsonSchema(callExpression.typeArguments[0], property, typeChecker);
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

/**
 * Converts a TypeScript type to JSON Schema
 */
export function typeToJsonSchema(typeNode: ts.TypeNode | undefined, context: ts.Node, typeChecker: ts.TypeChecker): JSONSchema {
  if (!typeNode) {
    return { type: 'any' };
  }

  // Handle primitive types
  if (typeNode.kind === ts.SyntaxKind.StringKeyword) {
    return { type: 'string' };
  }

  if (typeNode.kind === ts.SyntaxKind.NumberKeyword) {
    return { type: 'number' };
  }

  if (typeNode.kind === ts.SyntaxKind.BooleanKeyword) {
    return { type: 'boolean' };
  }

  if (typeNode.kind === ts.SyntaxKind.AnyKeyword) {
    return { type: 'any' };
  }

  if (typeNode.kind === ts.SyntaxKind.UnknownKeyword) {
    return { type: 'any' };
  }

  if (typeNode.kind === ts.SyntaxKind.NullKeyword) {
    return { type: 'null' };
  }

  if (typeNode.kind === ts.SyntaxKind.UndefinedKeyword) {
    return { type: 'null' };
  }

  // Handle array types
  if (ts.isArrayTypeNode(typeNode)) {
    return {
      type: 'array',
      items: typeToJsonSchema(typeNode.elementType, context, typeChecker),
    };
  }

  // Handle union types
  if (ts.isUnionTypeNode(typeNode)) {
    const types = typeNode.types.map((t) => typeToJsonSchema(t, context, typeChecker));

    // Check if all types are literals of the same primitive type (e.g., 'light' | 'dark')
    const allEnums = types.every((t) => t.enum && Array.isArray(t.enum));
    if (allEnums && types.length > 0) {
      const firstType = types[0].type;
      const allSameType = types.every((t) => t.type === firstType);
      if (allSameType) {
        // Combine all enum values into a single enum array
        const allEnumValues = types.flatMap((t) => t.enum as any[]);
        return {
          type: firstType,
          enum: allEnumValues,
        };
      }
    }

    // Check if it's a simple type union (e.g., string | number)
    const simpleTypes = types.filter((t) => typeof t.type === 'string' && !t.enum);
    if (simpleTypes.length === types.length) {
      return {
        type: simpleTypes.map((t) => t.type as string),
      };
    }

    return { oneOf: types };
  }

  // Handle literal types
  if (ts.isLiteralTypeNode(typeNode)) {
    const literal = typeNode.literal;

    if (ts.isStringLiteral(literal)) {
      return { type: 'string', enum: [literal.text] };
    }

    if (ts.isNumericLiteral(literal)) {
      return { type: 'number', enum: [Number(literal.text)] };
    }

    if (literal.kind === ts.SyntaxKind.TrueKeyword || literal.kind === ts.SyntaxKind.FalseKeyword) {
      return { type: 'boolean', enum: [literal.kind === ts.SyntaxKind.TrueKeyword] };
    }
  }

  // Handle type references (interfaces, classes, etc.)
  if (ts.isTypeReferenceNode(typeNode)) {
    const typeName = typeNode.typeName;

    if (ts.isIdentifier(typeName)) {
      const name = typeName.text;

      // Handle common built-in types
      if (name === 'Array') {
        const typeArg = typeNode.typeArguments?.[0];
        return {
          type: 'array',
          items: typeArg ? typeToJsonSchema(typeArg, context, typeChecker) : { type: 'any' },
        };
      }

      if (name === 'Date') {
        return { type: 'string', format: 'date-time' };
      }

      if (name === 'Record' || name === 'Object') {
        return { type: 'object' };
      }

      // For other types, try to resolve with type checker
      const type = typeChecker.getTypeAtLocation(typeNode);
      return resolveTypeToJsonSchema(type, typeChecker);
    }
  }

  // Handle object types
  if (ts.isTypeLiteralNode(typeNode)) {
    const properties: Record<string, JSONSchema> = {};
    const required: string[] = [];

    for (const member of typeNode.members) {
      if (ts.isPropertySignature(member) && member.name && ts.isIdentifier(member.name)) {
        const propName = member.name.text;
        properties[propName] = typeToJsonSchema(member.type, context, typeChecker);

        if (!member.questionToken) {
          required.push(propName);
        }
      }
    }

    return {
      type: 'object',
      properties,
      required: required.length > 0 ? required : undefined,
    };
  }

  // Fallback
  return { type: 'any' };
}

/**
 * Resolves a TypeScript Type to JSON Schema using type checker
 */
function resolveTypeToJsonSchema(type: ts.Type, typeChecker: ts.TypeChecker): JSONSchema {
  // Check for primitive types
  if (type.flags & ts.TypeFlags.String) {
    return { type: 'string' };
  }

  if (type.flags & ts.TypeFlags.Number) {
    return { type: 'number' };
  }

  if (type.flags & ts.TypeFlags.Boolean) {
    return { type: 'boolean' };
  }

  if (type.flags & ts.TypeFlags.Null || type.flags & ts.TypeFlags.Undefined) {
    return { type: 'null' };
  }

  // Check for object types
  if (type.flags & ts.TypeFlags.Object) {
    const objectType = type as ts.ObjectType;

    // Handle arrays
    if (typeChecker.isArrayType(objectType)) {
      const typeArgs = typeChecker.getTypeArguments(objectType as ts.TypeReference);
      if (typeArgs.length > 0) {
        return {
          type: 'array',
          items: resolveTypeToJsonSchema(typeArgs[0], typeChecker),
        };
      }
      return { type: 'array', items: { type: 'any' } };
    }

    // Handle object properties
    const properties: Record<string, JSONSchema> = {};
    const required: string[] = [];
    const props = typeChecker.getPropertiesOfType(type);

    for (const prop of props) {
      const propName = prop.getName();
      const propType = typeChecker.getTypeOfSymbolAtLocation(prop, prop.valueDeclaration!);
      properties[propName] = resolveTypeToJsonSchema(propType, typeChecker);

      // Check if property is optional
      if (!(prop.flags & ts.SymbolFlags.Optional)) {
        required.push(propName);
      }
    }

    if (Object.keys(properties).length > 0) {
      return {
        type: 'object',
        properties,
        required: required.length > 0 ? required : undefined,
      };
    }

    return { type: 'object' };
  }

  // Fallback
  return { type: 'any' };
}
