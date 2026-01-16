import * as ts from 'typescript';
import { EventModel, JSONSchema } from '../../model/intermediate.js';
import { getStringLiteralValue } from '../../core/ast-walker.js';
import { typeToJsonSchema } from '../shared/type.utils.js';

/**
 * Extracts events from a React component
 * Looks for dispatchEvent calls and callback props (on* pattern)
 */
export function extractEvents(component: ts.ClassDeclaration | ts.FunctionDeclaration, typeChecker: ts.TypeChecker): EventModel[] {
  const events: EventModel[] = [];

  // Extract dispatchEvent calls from component body
  const dispatchEvents = extractDispatchEvents(component, typeChecker);
  events.push(...dispatchEvents);

  // Extract callback props (onSomething pattern)
  const callbackEvents = extractCallbackProps(component, typeChecker);
  events.push(...callbackEvents);

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
 * Extracts events from dispatchEvent() calls in the component
 */
function extractDispatchEvents(component: ts.ClassDeclaration | ts.FunctionDeclaration, typeChecker: ts.TypeChecker): EventModel[] {
  const events: EventModel[] = [];

  // Get the component body
  let body: ts.Node | undefined;

  if (ts.isClassDeclaration(component)) {
    // For class components, search all methods
    body = component;
  } else if (ts.isFunctionDeclaration(component)) {
    body = component.body;
  }

  if (!body) {
    return events;
  }

  // Find all dispatchEvent calls
  const dispatchCalls: ts.CallExpression[] = [];

  function visit(node: ts.Node): void {
    if (ts.isCallExpression(node)) {
      const expression = node.expression;

      // Check for this.dispatchEvent or element.dispatchEvent
      if (ts.isPropertyAccessExpression(expression)) {
        const method = expression.name;
        if (ts.isIdentifier(method) && method.text === 'dispatchEvent') {
          dispatchCalls.push(node);
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(body);

  // Process each dispatchEvent call
  for (const call of dispatchCalls) {
    const event = extractEventFromDispatchCall(call, typeChecker);
    if (event) {
      events.push(event);
    }
  }

  return events;
}

/**
 * Extracts event info from a dispatchEvent call
 * Patterns:
 * - this.dispatchEvent(new CustomEvent('eventName', { detail: payload }))
 * - element.dispatchEvent(new Event('eventName'))
 */
function extractEventFromDispatchCall(call: ts.CallExpression, typeChecker: ts.TypeChecker): EventModel | undefined {
  if (call.arguments.length === 0) {
    return undefined;
  }

  const eventArg = call.arguments[0];

  // Check if it's a new CustomEvent or new Event
  if (ts.isNewExpression(eventArg)) {
    const eventExpression = eventArg.expression;

    if (ts.isIdentifier(eventExpression)) {
      const eventType = eventExpression.text;

      if (eventType === 'CustomEvent' || eventType === 'Event') {
        // Extract event name from first argument
        if (eventArg.arguments && eventArg.arguments.length > 0) {
          const eventName = getStringLiteralValue(eventArg.arguments[0]);

          if (!eventName) {
            return undefined;
          }

          // For CustomEvent, try to extract detail type from second argument
          let payloadSchema: JSONSchema | undefined;

          if (eventType === 'CustomEvent' && eventArg.arguments.length > 1) {
            const detailArg = eventArg.arguments[1];

            if (ts.isObjectLiteralExpression(detailArg)) {
              // Look for detail property
              const detailProp = detailArg.properties.find(
                (prop) => ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name) && prop.name.text === 'detail'
              );

              if (detailProp && ts.isPropertyAssignment(detailProp)) {
                const detailType = typeChecker.getTypeAtLocation(detailProp.initializer);
                payloadSchema = typeToJsonSchema(detailType, typeChecker);
              }
            }
          }

          return {
            name: eventName,
            type: 'CustomEvent',
            payloadSchema,
            source: 'dispatchEvent',
          };
        }
      }
    }
  }

  return undefined;
}

/**
 * Extracts callback props (on* pattern) from React component props
 */
function extractCallbackProps(component: ts.ClassDeclaration | ts.FunctionDeclaration, typeChecker: ts.TypeChecker): EventModel[] {
  const events: EventModel[] = [];

  // Get props type
  let propsType: ts.Type | undefined;

  if (ts.isClassDeclaration(component)) {
    // For class components, check heritage clause
    const heritageClause = component.heritageClauses?.find((clause) => clause.token === ts.SyntaxKind.ExtendsKeyword);

    if (heritageClause && heritageClause.types.length > 0) {
      const extendsType = heritageClause.types[0];

      if (extendsType.typeArguments && extendsType.typeArguments.length > 0) {
        propsType = typeChecker.getTypeFromTypeNode(extendsType.typeArguments[0]);
      }
    }
  } else if (ts.isFunctionDeclaration(component)) {
    // For function components, check first parameter
    if (component.parameters.length > 0) {
      const propsParam = component.parameters[0];

      if (propsParam.type) {
        propsType = typeChecker.getTypeFromTypeNode(propsParam.type);
      } else {
        propsType = typeChecker.getTypeAtLocation(propsParam);
      }
    }
  }

  if (!propsType) {
    return events;
  }

  // Get all properties from props type
  const properties = propsType.getProperties();

  for (const prop of properties) {
    const propName = prop.getName();

    // Check if it's a callback prop (starts with 'on')
    if (propName.startsWith('on')) {
      const propType = typeChecker.getTypeOfSymbolAtLocation(prop, prop.valueDeclaration!);

      // Check if it's a function type
      const signatures = propType.getCallSignatures();

      if (signatures.length > 0) {
        const signature = signatures[0];

        // Extract event name from prop name (e.g., onClick -> click)
        const eventName = propName.substring(2).charAt(0).toLowerCase() + propName.substring(3);

        // Try to extract payload schema from function parameter
        let payloadSchema: JSONSchema | undefined;

        if (signature.parameters.length > 0) {
          const param = signature.parameters[0];
          const paramType = typeChecker.getTypeOfSymbolAtLocation(param, param.valueDeclaration!);
          payloadSchema = typeToJsonSchema(paramType, typeChecker);
        }

        events.push({
          name: eventName,
          type: 'CustomEvent',
          payloadSchema,
          source: 'output',
        });
      }
    }
  }

  return events;
}
