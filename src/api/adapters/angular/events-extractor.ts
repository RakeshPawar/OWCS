import * as ts from 'typescript';
import { EventModel, JSONSchema } from '../../model/intermediate.js';
import { getClassProperties, findDecorator, findCallExpressions, isMethodCall, getStringLiteralValue } from '../../core/ast-walker.js';
import { typeNodeToJsonSchema } from '../shared/type.utils.js';

/**
 * Extracts events from an Angular component class
 * Supports both @Output() EventEmitter and dispatchEvent patterns
 */
export function extractEvents(classDecl: ts.ClassDeclaration, typeChecker: ts.TypeChecker): EventModel[] {
  const events: EventModel[] = [];

  // Extract @Output() decorators
  const outputEvents = extractOutputEvents(classDecl, typeChecker);
  events.push(...outputEvents);

  // Extract dispatchEvent calls
  const dispatchEvents = extractDispatchEvents(classDecl, typeChecker);
  events.push(...dispatchEvents);

  // Deduplicate by event name
  const uniqueEvents = new Map<string, EventModel>();
  for (const event of events) {
    if (!uniqueEvents.has(event.name)) {
      uniqueEvents.set(event.name, event);
    }
  }

  return Array.from(uniqueEvents.values());
}

/**
 * Extracts events from @Output() decorators and output signals
 */
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
      // Check for output signal: output()
      const event = extractOutputSignalEvent(property, typeChecker);
      if (event) {
        events.push(event);
      }
    }
  }

  return events;
}

/**
 * Extracts a single event from @Output() property
 */
function extractOutputEvent(property: ts.PropertyDeclaration, typeChecker: ts.TypeChecker): EventModel | undefined {
  const propertyName = property.name;

  if (!ts.isIdentifier(propertyName)) {
    return undefined;
  }

  const name = propertyName.text;

  // Extract payload type from EventEmitter<T>
  const payloadSchema = extractEventEmitterPayload(property, typeChecker);

  return {
    name,
    type: 'EventEmitter',
    payloadSchema,
    source: 'output',
  };
}

/**
 * Extracts a single event from a property with output signal (output())
 */
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

  // Check if it's a call to output()
  let callExpression: ts.CallExpression | undefined;

  if (ts.isCallExpression(initializer)) {
    const expr = initializer.expression;

    // Check for output() direct call
    if (ts.isIdentifier(expr) && expr.text === 'output') {
      callExpression = initializer;
    }
  }

  if (!callExpression) {
    return undefined;
  }

  // Extract type from generic type argument
  let payloadSchema: JSONSchema | undefined;

  if (callExpression.typeArguments && callExpression.typeArguments.length > 0) {
    payloadSchema = typeNodeToJsonSchema(callExpression.typeArguments[0], typeChecker);
  }

  // Check for alias in options: output({ alias: 'customName' })
  let eventName = name;

  if (callExpression.arguments.length > 0) {
    const firstArg = callExpression.arguments[0];

    // Check if it's an options object with alias property
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

  return {
    name: eventName,
    type: 'OutputSignal',
    payloadSchema,
    source: 'output',
  };
}

/**
 * Extracts payload type from EventEmitter<T>
 */
function extractEventEmitterPayload(property: ts.PropertyDeclaration, typeChecker: ts.TypeChecker): JSONSchema | undefined {
  const typeNode = property.type;

  if (!typeNode || !ts.isTypeReferenceNode(typeNode)) {
    return undefined;
  }

  const typeName = typeNode.typeName;

  if (!ts.isIdentifier(typeName) || typeName.text !== 'EventEmitter') {
    return undefined;
  }

  // Get type argument
  const typeArgs = typeNode.typeArguments;
  if (!typeArgs || typeArgs.length === 0) {
    return undefined;
  }

  const payloadType = typeArgs[0];
  return typeNodeToJsonSchema(payloadType, typeChecker);
}

/**
 * Extracts events from dispatchEvent calls in class methods
 */
function extractDispatchEvents(classDecl: ts.ClassDeclaration, typeChecker: ts.TypeChecker): EventModel[] {
  const events: EventModel[] = [];

  // Visit all methods in the class
  for (const member of classDecl.members) {
    if (ts.isMethodDeclaration(member) && member.body) {
      const methodEvents = extractDispatchEventsFromBlock(member.body, typeChecker);
      events.push(...methodEvents);
    }

    // Also check property initializers (arrow functions)
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

/**
 * Extracts dispatchEvent calls from a block of code
 */
function extractDispatchEventsFromBlock(block: ts.Block, typeChecker: ts.TypeChecker): EventModel[] {
  const events: EventModel[] = [];

  // Find all this.dispatchEvent() calls
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

/**
 * Extracts event info from a dispatchEvent call
 * Pattern: this.dispatchEvent(new CustomEvent('event-name', { detail: payload }))
 */
function extractDispatchEvent(call: ts.CallExpression, typeChecker: ts.TypeChecker): EventModel | undefined {
  // dispatchEvent must have at least 1 argument
  if (call.arguments.length === 0) {
    return undefined;
  }

  const eventArg = call.arguments[0];

  // Check if it's "new CustomEvent(...)"
  if (!ts.isNewExpression(eventArg)) {
    return undefined;
  }

  const expression = eventArg.expression;
  if (!ts.isIdentifier(expression) || expression.text !== 'CustomEvent') {
    return undefined;
  }

  // Extract event name from first argument
  if (!eventArg.arguments || eventArg.arguments.length === 0) {
    return undefined;
  }

  const eventName = getStringLiteralValue(eventArg.arguments[0]);
  if (!eventName) {
    return undefined;
  }

  // Extract payload schema from detail property
  let payloadSchema: JSONSchema | undefined;

  if (eventArg.arguments.length > 1) {
    const optionsArg = eventArg.arguments[1];

    if (ts.isObjectLiteralExpression(optionsArg)) {
      for (const prop of optionsArg.properties) {
        if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name) && prop.name.text === 'detail') {
          // Try to infer schema from the detail value
          payloadSchema = inferSchemaFromExpression(prop.initializer, typeChecker);
          break;
        }
      }
    }
  }

  // Try to extract type from CustomEvent<T> generic
  if (!payloadSchema && eventArg.typeArguments && eventArg.typeArguments.length > 0) {
    payloadSchema = typeNodeToJsonSchema(eventArg.typeArguments[0], typeChecker);
  }

  return {
    name: eventName,
    type: 'CustomEvent',
    payloadSchema,
    source: 'dispatchEvent',
  };
}

/**
 * Infers JSON Schema from an expression (best effort)
 */
function inferSchemaFromExpression(expression: ts.Expression, typeChecker: ts.TypeChecker): JSONSchema {
  // Object literal
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

  // String literal
  if (ts.isStringLiteral(expression)) {
    return { type: 'string' };
  }

  // Numeric literal
  if (ts.isNumericLiteral(expression)) {
    return { type: 'number' };
  }

  // Boolean
  if (expression.kind === ts.SyntaxKind.TrueKeyword || expression.kind === ts.SyntaxKind.FalseKeyword) {
    return { type: 'boolean' };
  }

  // Array literal
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
