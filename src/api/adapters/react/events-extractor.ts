import * as ts from 'typescript';
import { EventModel, JSONSchema } from '../../model/intermediate.js';
import { getStringLiteralValue } from '../../core/ast-walker.js';
import { typeToJsonSchema } from '../shared/type.utils.js';
import { extractJSDocMetadata } from '../shared/jsdoc.utils.js';

/** Extracts events from JSDoc @fires, dispatchEvent, and callback props */
export function extractEvents(component: ts.ClassDeclaration | ts.FunctionDeclaration, typeChecker: ts.TypeChecker): EventModel[] {
  const events: EventModel[] = [];

  const jsDocEvents = extractEventsFromJSDoc(component);
  events.push(...jsDocEvents);

  const dispatchEvents = extractDispatchEvents(component, typeChecker);
  events.push(...dispatchEvents);

  const callbackEvents = extractCallbackProps(component, typeChecker);
  events.push(...callbackEvents);

  // Dedupe: dispatchEvent > JSDoc > callbacks
  const uniqueEvents = new Map<string, EventModel>();

  for (const event of jsDocEvents) {
    uniqueEvents.set(event.name, event);
  }

  for (const event of callbackEvents) {
    if (!uniqueEvents.has(event.name)) {
      uniqueEvents.set(event.name, event);
    }
  }

  for (const event of dispatchEvents) {
    uniqueEvents.set(event.name, event);
  }

  return Array.from(uniqueEvents.values());
}

function extractEventsFromJSDoc(component: ts.ClassDeclaration | ts.FunctionDeclaration): EventModel[] {
  const events: EventModel[] = [];
  const jsDocMetadata = extractJSDocMetadata(component);

  if (jsDocMetadata.fires) {
    for (const eventName of jsDocMetadata.fires) {
      // Parse: "eventName - description" or just "eventName"
      const parts = eventName.split('-').map((s) => s.trim());
      const name = parts[0];
      const description = parts.length > 1 ? parts.slice(1).join('-').trim() : undefined;

      events.push({
        name,
        type: 'CustomEvent',
        source: 'dispatchEvent',
        description,
      });
    }
  }

  return events;
}

function extractDispatchEvents(component: ts.ClassDeclaration | ts.FunctionDeclaration, typeChecker: ts.TypeChecker): EventModel[] {
  const events: EventModel[] = [];

  let body: ts.Node | undefined;

  if (ts.isClassDeclaration(component)) {
    body = component;
  } else if (ts.isFunctionDeclaration(component)) {
    body = component.body;
  }

  if (!body) {
    return events;
  }

  const dispatchCalls: ts.CallExpression[] = [];

  function visit(node: ts.Node): void {
    if (ts.isCallExpression(node)) {
      const expression = node.expression;

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

  for (const call of dispatchCalls) {
    const event = extractEventFromDispatchCall(call, typeChecker);
    if (event) {
      events.push(event);
    }
  }

  return events;
}

/** Extracts event from: dispatchEvent(new CustomEvent('name', { detail, bubbles })) */
function extractEventFromDispatchCall(call: ts.CallExpression, typeChecker: ts.TypeChecker): EventModel | undefined {
  if (call.arguments.length === 0) {
    return undefined;
  }

  const eventArg = call.arguments[0];

  if (ts.isNewExpression(eventArg)) {
    const eventExpression = eventArg.expression;

    if (ts.isIdentifier(eventExpression)) {
      const eventType = eventExpression.text;

      if (eventType === 'CustomEvent' || eventType === 'Event') {
        if (eventArg.arguments && eventArg.arguments.length > 0) {
          const eventName = getStringLiteralValue(eventArg.arguments[0]);

          if (!eventName) {
            return undefined;
          }

          let payloadSchema: JSONSchema | undefined;
          let bubbles: boolean | undefined;
          let composed: boolean | undefined;

          if (eventType === 'CustomEvent' && eventArg.arguments.length > 1) {
            const detailArg = eventArg.arguments[1];

            if (ts.isObjectLiteralExpression(detailArg)) {
              const detailProp = detailArg.properties.find(
                (prop) => ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name) && prop.name.text === 'detail'
              );

              if (detailProp && ts.isPropertyAssignment(detailProp)) {
                const detailType = typeChecker.getTypeAtLocation(detailProp.initializer);
                payloadSchema = typeToJsonSchema(detailType, typeChecker);
              }

              const bubblesProp = detailArg.properties.find(
                (prop) => ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name) && prop.name.text === 'bubbles'
              );
              if (bubblesProp && ts.isPropertyAssignment(bubblesProp)) {
                if (bubblesProp.initializer.kind === ts.SyntaxKind.TrueKeyword) {
                  bubbles = true;
                } else if (bubblesProp.initializer.kind === ts.SyntaxKind.FalseKeyword) {
                  bubbles = false;
                }
              }

              const composedProp = detailArg.properties.find(
                (prop) => ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name) && prop.name.text === 'composed'
              );
              if (composedProp && ts.isPropertyAssignment(composedProp)) {
                if (composedProp.initializer.kind === ts.SyntaxKind.TrueKeyword) {
                  composed = true;
                } else if (composedProp.initializer.kind === ts.SyntaxKind.FalseKeyword) {
                  composed = false;
                }
              }
            }
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
      }
    }
  }

  return undefined;
}

function findContainingMethod(node: ts.Node): ts.MethodDeclaration | ts.FunctionDeclaration | undefined {
  let current = node.parent;

  while (current) {
    if (ts.isMethodDeclaration(current) || ts.isFunctionDeclaration(current)) {
      return current;
    }
    current = current.parent;
  }

  return undefined;
}

/** Extracts callback props with on* pattern (e.g., onClick -> click event) */
function extractCallbackProps(component: ts.ClassDeclaration | ts.FunctionDeclaration, typeChecker: ts.TypeChecker): EventModel[] {
  const events: EventModel[] = [];

  let propsType: ts.Type | undefined;

  if (ts.isClassDeclaration(component)) {
    const heritageClause = component.heritageClauses?.find((clause) => clause.token === ts.SyntaxKind.ExtendsKeyword);

    if (heritageClause && heritageClause.types.length > 0) {
      const extendsType = heritageClause.types[0];

      if (extendsType.typeArguments && extendsType.typeArguments.length > 0) {
        propsType = typeChecker.getTypeFromTypeNode(extendsType.typeArguments[0]);
      }
    }
  } else if (ts.isFunctionDeclaration(component)) {
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

  const properties = propsType.getProperties();

  for (const prop of properties) {
    const propName = prop.getName();

    if (propName.startsWith('on')) {
      let propType = prop.valueDeclaration ? typeChecker.getTypeOfSymbolAtLocation(prop, prop.valueDeclaration) : typeChecker.getTypeOfSymbol(prop);

      if (propType.isUnion()) {
        const nonUndefinedTypes = propType.types.filter((t) => !(t.flags & ts.TypeFlags.Undefined));
        if (nonUndefinedTypes.length === 1) {
          propType = nonUndefinedTypes[0];
        }
      }

      const signatures = propType.getCallSignatures();

      if (signatures.length > 0) {
        const signature = signatures[0];

        // Event name: onClick -> click
        const eventName = propName.substring(2).charAt(0).toLowerCase() + propName.substring(3);

        let payloadSchema: JSONSchema | undefined;

        if (signature.parameters.length > 0) {
          const param = signature.parameters[0];
          const paramType = typeChecker.getTypeOfSymbolAtLocation(param, param.valueDeclaration!);
          payloadSchema = typeToJsonSchema(paramType, typeChecker);
        }

        const jsDocMetadata = prop.valueDeclaration ? extractJSDocMetadata(prop.valueDeclaration) : {};

        let finalEventName = eventName;
        if (jsDocMetadata.event) {
          finalEventName = jsDocMetadata.event;
        } else if (jsDocMetadata.fires && jsDocMetadata.fires.length > 0) {
          finalEventName = jsDocMetadata.fires[0];
        }

        events.push({
          name: finalEventName,
          type: 'CustomEvent',
          payloadSchema,
          source: 'output',
          description: jsDocMetadata.description,
          deprecated: jsDocMetadata.deprecated,
        });
      }
    }
  }

  return events;
}
