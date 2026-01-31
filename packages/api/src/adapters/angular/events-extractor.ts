import * as ts from 'typescript';
import { EventModel, JSONSchema } from '../../model/intermediate.js';
import { getClassProperties, findDecorator, findCallExpressions, isMethodCall, getStringLiteralValue, getDecoratorArgument } from '../../core/ast-walker.js';
import { typeNodeToJsonSchema } from '../shared/type.utils.js';
import { extractJSDocMetadata } from '../shared/jsdoc.utils.js';

/** Extracts events from @Output decorators and dispatchEvent calls */
export function extractEvents(classDecl: ts.ClassDeclaration, typeChecker: ts.TypeChecker): EventModel[] {
  const events: EventModel[] = [];

  const outputEvents = extractOutputEvents(classDecl, typeChecker);
  events.push(...outputEvents);

  const dispatchEvents = extractDispatchEvents(classDecl, typeChecker);
  events.push(...dispatchEvents);

  const uniqueEvents = new Map<string, EventModel>();
  for (const event of events) {
    if (!uniqueEvents.has(event.name)) {
      uniqueEvents.set(event.name, event);
    }
  }

  return Array.from(uniqueEvents.values());
}

function extractOutputEvents(classDecl: ts.ClassDeclaration, typeChecker: ts.TypeChecker): EventModel[] {
  const events: EventModel[] = [];
  const properties = getClassProperties(classDecl);

  for (const property of properties) {
    const outputDecorator = findDecorator(property, 'Output');

    if (outputDecorator) {
      const event = extractOutputEvent(property, typeChecker);
      if (event) {
        events.push(event);
      }
    } else if (property.initializer) {
      const event = extractOutputSignalEvent(property, typeChecker);
      if (event) {
        events.push(event);
      }
    }
  }

  return events;
}

function extractOutputEvent(property: ts.PropertyDeclaration, typeChecker: ts.TypeChecker): EventModel | undefined {
  const propertyName = property.name;

  if (!ts.isIdentifier(propertyName)) {
    return undefined;
  }

  const name = propertyName.text;

  const outputDecorator = findDecorator(property, 'Output');
  const decoratorArg = outputDecorator ? getDecoratorArgument(outputDecorator, 0) : undefined;
  const decoratorAlias = decoratorArg ? getStringLiteralValue(decoratorArg) : undefined;

  const jsDocMetadata = extractJSDocMetadata(property);

  // Precedence: decorator alias > @attribute > property name
  const eventName = decoratorAlias || jsDocMetadata.attribute || name;

  const payloadSchema = extractEventEmitterPayload(property, typeChecker);

  return {
    name: eventName,
    type: 'EventEmitter',
    payloadSchema,
    source: 'output',
    description: jsDocMetadata.description,
    deprecated: jsDocMetadata.deprecated,
  };
}

function extractOutputSignalEvent(property: ts.PropertyDeclaration, typeChecker: ts.TypeChecker): EventModel | undefined {
  const propertyName = property.name;

  if (!ts.isIdentifier(propertyName)) {
    return undefined;
  }

  const name = propertyName.text;
  const initializer = property.initializer;

  if (!initializer) {
    return undefined;
  }

  let callExpression: ts.CallExpression | undefined;

  if (ts.isCallExpression(initializer)) {
    const expr = initializer.expression;

    if (ts.isIdentifier(expr) && expr.text === 'output') {
      callExpression = initializer;
    }
  }

  if (!callExpression) {
    return undefined;
  }

  let payloadSchema: JSONSchema | undefined;

  if (callExpression.typeArguments && callExpression.typeArguments.length > 0) {
    payloadSchema = typeNodeToJsonSchema(callExpression.typeArguments[0], typeChecker);
  }

  const jsDocMetadata = extractJSDocMetadata(property);

  let eventName = name;

  if (callExpression.arguments.length > 0) {
    const firstArg = callExpression.arguments[0];

    if (ts.isObjectLiteralExpression(firstArg)) {
      for (const prop of firstArg.properties) {
        if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name) && prop.name.text === 'alias') {
          const aliasValue = getStringLiteralValue(prop.initializer);
          if (aliasValue) {
            eventName = aliasValue;
          }
        }
      }
    }
  }

  if (jsDocMetadata.attribute) {
    eventName = jsDocMetadata.attribute;
  }

  return {
    name: eventName,
    type: 'OutputSignal',
    payloadSchema,
    source: 'output',
    description: jsDocMetadata.description,
    deprecated: jsDocMetadata.deprecated,
  };
}

function extractEventEmitterPayload(property: ts.PropertyDeclaration, typeChecker: ts.TypeChecker): JSONSchema | undefined {
  const typeNode = property.type;

  if (!typeNode || !ts.isTypeReferenceNode(typeNode)) {
    return undefined;
  }

  const typeName = typeNode.typeName;

  if (!ts.isIdentifier(typeName) || typeName.text !== 'EventEmitter') {
    return undefined;
  }

  const typeArgs = typeNode.typeArguments;
  if (!typeArgs || typeArgs.length === 0) {
    return undefined;
  }

  const payloadType = typeArgs[0];
  return typeNodeToJsonSchema(payloadType, typeChecker);
}

function extractDispatchEvents(classDecl: ts.ClassDeclaration, typeChecker: ts.TypeChecker): EventModel[] {
  const events: EventModel[] = [];

  for (const member of classDecl.members) {
    if (ts.isMethodDeclaration(member) && member.body) {
      const methodEvents = extractDispatchEventsFromBlock(member.body, typeChecker);
      events.push(...methodEvents);
    }

    if (ts.isPropertyDeclaration(member) && member.initializer) {
      if (ts.isArrowFunction(member.initializer) && member.initializer.body) {
        if (ts.isBlock(member.initializer.body)) {
          const methodEvents = extractDispatchEventsFromBlock(member.initializer.body, typeChecker);
          events.push(...methodEvents);
        }
      }
    }
  }

  return events;
}

function extractDispatchEventsFromBlock(block: ts.Block, typeChecker: ts.TypeChecker): EventModel[] {
  const events: EventModel[] = [];

  const calls = findCallExpressions(block as unknown as ts.SourceFile, (call) => {
    return isMethodCall(call, 'this', 'dispatchEvent');
  });

  for (const call of calls) {
    const event = extractDispatchEvent(call, typeChecker);
    if (event) {
      events.push(event);
    }
  }

  return events;
}

/** Extracts event from: this.dispatchEvent(new CustomEvent('name', { detail })) */
function extractDispatchEvent(call: ts.CallExpression, typeChecker: ts.TypeChecker): EventModel | undefined {
  if (call.arguments.length === 0) {
    return undefined;
  }

  const eventArg = call.arguments[0];

  if (!ts.isNewExpression(eventArg)) {
    return undefined;
  }

  const expression = eventArg.expression;
  if (!ts.isIdentifier(expression) || expression.text !== 'CustomEvent') {
    return undefined;
  }

  if (!eventArg.arguments || eventArg.arguments.length === 0) {
    return undefined;
  }

  const eventName = getStringLiteralValue(eventArg.arguments[0]);
  if (!eventName) {
    return undefined;
  }

  let payloadSchema: JSONSchema | undefined;
  let bubbles: boolean | undefined;
  let composed: boolean | undefined;

  if (eventArg.arguments.length > 1) {
    const optionsArg = eventArg.arguments[1];

    if (ts.isObjectLiteralExpression(optionsArg)) {
      for (const prop of optionsArg.properties) {
        if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
          if (prop.name.text === 'detail') {
            payloadSchema = inferSchemaFromExpression(prop.initializer, typeChecker);
          } else if (prop.name.text === 'bubbles') {
            if (prop.initializer.kind === ts.SyntaxKind.TrueKeyword) {
              bubbles = true;
            } else if (prop.initializer.kind === ts.SyntaxKind.FalseKeyword) {
              bubbles = false;
            }
          } else if (prop.name.text === 'composed') {
            if (prop.initializer.kind === ts.SyntaxKind.TrueKeyword) {
              composed = true;
            } else if (prop.initializer.kind === ts.SyntaxKind.FalseKeyword) {
              composed = false;
            }
          }
        }
      }
    }
  }

  if (!payloadSchema && eventArg.typeArguments && eventArg.typeArguments.length > 0) {
    payloadSchema = typeNodeToJsonSchema(eventArg.typeArguments[0], typeChecker);
  }

  const method = findContainingMethod(call);
  const jsDocMetadata = method ? extractJSDocMetadata(method) : {};

  return {
    name: eventName,
    type: 'CustomEvent',
    payloadSchema,
    source: 'dispatchEvent',
    description: jsDocMetadata.description,
    deprecated: jsDocMetadata.deprecated,
    bubbles,
    composed,
  };
}

function findContainingMethod(node: ts.Node): ts.MethodDeclaration | undefined {
  let current = node.parent;

  while (current) {
    if (ts.isMethodDeclaration(current)) {
      return current;
    }
    current = current.parent;
  }

  return undefined;
}

/** Infers JSON Schema from AST expression (best-effort analysis) */
function inferSchemaFromExpression(expression: ts.Expression, typeChecker: ts.TypeChecker): JSONSchema {
  if (ts.isObjectLiteralExpression(expression)) {
    const properties: Record<string, JSONSchema> = {};

    for (const prop of expression.properties) {
      if (ts.isPropertyAssignment(prop)) {
        const name = prop.name;
        if (ts.isIdentifier(name) || ts.isStringLiteral(name)) {
          const key = ts.isIdentifier(name) ? name.text : name.text;
          properties[key] = inferSchemaFromExpression(prop.initializer, typeChecker);
        }
      }
    }

    return { type: 'object', properties };
  }

  if (ts.isStringLiteral(expression)) {
    return { type: 'string' };
  }

  if (ts.isNumericLiteral(expression)) {
    return { type: 'number' };
  }

  if (expression.kind === ts.SyntaxKind.TrueKeyword || expression.kind === ts.SyntaxKind.FalseKeyword) {
    return { type: 'boolean' };
  }

  if (ts.isArrayLiteralExpression(expression)) {
    if (expression.elements.length > 0) {
      return {
        type: 'array',
        items: inferSchemaFromExpression(expression.elements[0], typeChecker),
      };
    }
    return { type: 'array', items: { type: 'any' } };
  }

  return { type: 'any' };
}
