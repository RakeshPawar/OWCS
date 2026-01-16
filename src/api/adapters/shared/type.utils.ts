import { JSONSchema } from '../../model/intermediate.js';
import * as ts from 'typescript';

/**
 * Converts a TypeScript type to JSON Schema
 */
export function typeNodeToJsonSchema(typeNode: ts.TypeNode | undefined, typeChecker: ts.TypeChecker): JSONSchema {
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
      items: typeNodeToJsonSchema(typeNode.elementType, typeChecker),
    };
  }

  // Handle union types
  if (ts.isUnionTypeNode(typeNode)) {
    const types = typeNode.types.map((t) => typeNodeToJsonSchema(t, typeChecker));

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
          items: typeArg ? typeNodeToJsonSchema(typeArg, typeChecker) : { type: 'any' },
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
      return typeToJsonSchema(type, typeChecker);
    }
  }

  // Handle object types
  if (ts.isTypeLiteralNode(typeNode)) {
    const properties: Record<string, JSONSchema> = {};
    const required: string[] = [];

    for (const member of typeNode.members) {
      if (ts.isPropertySignature(member) && member.name && ts.isIdentifier(member.name)) {
        const propName = member.name.text;
        properties[propName] = typeNodeToJsonSchema(member.type, typeChecker);

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
export function typeToJsonSchema(type: ts.Type, typeChecker: ts.TypeChecker): JSONSchema {
  // Handle string literal types
  if (type.isStringLiteral()) {
    return {
      type: 'string',
      enum: [type.value],
    };
  }

  // Handle number literal types
  if (type.isNumberLiteral()) {
    return {
      type: 'number',
      enum: [type.value],
    };
  }

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

  // Handle union types
  if (type.isUnion()) {
    const schemas = type.types.map((t) => typeToJsonSchema(t, typeChecker));

    // If all are string literals, create an enum
    if (schemas.every((s) => s.type === 'string' && s.enum)) {
      const enumValues = schemas.flatMap((s) => s.enum || []);
      return {
        type: 'string',
        enum: enumValues,
      };
    }

    return { oneOf: schemas };
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
          items: typeToJsonSchema(typeArgs[0], typeChecker),
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
      properties[propName] = typeToJsonSchema(propType, typeChecker);

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

  // Handle function types
  if (type.getCallSignatures().length > 0) {
    return { type: 'function' };
  }

  // Fallback
  return { type: 'any' };
}
