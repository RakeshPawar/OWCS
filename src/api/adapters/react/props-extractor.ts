import * as ts from 'typescript';
import { PropModel } from '../../model/intermediate.js';
import { typeNodeToJsonSchema, typeToJsonSchema } from '../shared/type.utils.js';
import { extractJSDocMetadata, extractDefaultValue } from '../shared/jsdoc.utils.js';

/**
 * Extracts props from a React component (class or function)
 */
export function extractProps(component: ts.ClassDeclaration | ts.FunctionDeclaration, typeChecker: ts.TypeChecker): PropModel[] {
  const props: PropModel[] = [];

  // Extract TypeScript-based props
  if (ts.isClassDeclaration(component)) {
    props.push(...extractClassComponentProps(component, typeChecker));
  } else {
    props.push(...extractFunctionComponentProps(component, typeChecker));
  }

  // Try to extract PropTypes as fallback/supplement
  const propTypesProps = extractPropTypes(component, typeChecker);

  // Merge PropTypes with TypeScript props
  for (const propTypeProp of propTypesProps) {
    const existing = props.find((p) => p.name === propTypeProp.name);
    if (!existing) {
      props.push(propTypeProp);
    } else {
      // Merge metadata: prefer TypeScript types but use PropTypes for missing info
      if (!existing.description && propTypeProp.description) {
        existing.description = propTypeProp.description;
      }
      if (existing.default === undefined && propTypeProp.default !== undefined) {
        existing.default = propTypeProp.default;
      }
    }
  }

  return props;
}

/**
 * Extracts props from a React class component
 * Looks for the Props interface/type in the class's type parameters or heritage clause
 */
function extractClassComponentProps(classDecl: ts.ClassDeclaration, typeChecker: ts.TypeChecker): PropModel[] {
  const props: PropModel[] = [];

  // Check heritage clause for React.Component<PropsType>
  const heritageClause = classDecl.heritageClauses?.find((clause) => clause.token === ts.SyntaxKind.ExtendsKeyword);

  if (heritageClause && heritageClause.types.length > 0) {
    const extendsType = heritageClause.types[0];

    // Check for type arguments: Component<Props, State>
    if (extendsType.typeArguments && extendsType.typeArguments.length > 0) {
      const propsType = extendsType.typeArguments[0];
      return extractPropsFromType(propsType, typeChecker);
    }
  }

  return props;
}

/**
 * Extracts props from a React function component
 * Looks for the props parameter type
 */
function extractFunctionComponentProps(funcDecl: ts.FunctionDeclaration, typeChecker: ts.TypeChecker): PropModel[] {
  // Get the first parameter (props)
  if (funcDecl.parameters.length === 0) {
    return [];
  }

  const propsParam = funcDecl.parameters[0];

  // Try to infer type from the parameter
  const type = typeChecker.getTypeAtLocation(propsParam);
  if (type) {
    return extractPropsFromTypeObject(type, typeChecker);
  }

  // Check if parameter has a type annotation
  if (propsParam.type) {
    return extractPropsFromType(propsParam.type, typeChecker);
  }

  return [];
}

/**
 * Extracts props from a TypeScript type node
 */
function extractPropsFromType(typeNode: ts.TypeNode, typeChecker: ts.TypeChecker): PropModel[] {
  // Handle type reference (interface/type alias)
  if (ts.isTypeReferenceNode(typeNode)) {
    const type = typeChecker.getTypeFromTypeNode(typeNode);
    return extractPropsFromTypeObject(type, typeChecker);
  }

  // Handle inline type literal: { name: string; age?: number }
  if (ts.isTypeLiteralNode(typeNode)) {
    return extractPropsFromTypeLiteral(typeNode, typeChecker);
  }

  // Handle intersection types: Props & ExtraProps
  if (ts.isIntersectionTypeNode(typeNode)) {
    const props: PropModel[] = [];
    for (const subType of typeNode.types) {
      props.push(...extractPropsFromType(subType, typeChecker));
    }
    return props;
  }

  return [];
}

/**
 * Extracts props from a TypeScript Type object
 */
function extractPropsFromTypeObject(type: ts.Type, typeChecker: ts.TypeChecker): PropModel[] {
  const props: PropModel[] = [];

  // Get properties from the type
  const properties = type.getProperties();

  for (const prop of properties) {
    const propName = prop.getName();

    // Skip React built-in props
    if (propName === 'children' || propName === 'key' || propName === 'ref') {
      continue;
    }

    const propType = typeChecker.getTypeOfSymbolAtLocation(prop, prop.valueDeclaration!);
    const schema = typeToJsonSchema(propType, typeChecker);

    // Check if property is optional
    const isOptional = (prop.flags & ts.SymbolFlags.Optional) !== 0;

    // Extract JSDoc metadata
    const jsDocMetadata = prop.valueDeclaration ? extractJSDocMetadata(prop.valueDeclaration) : {};

    // Extract default value from initializer
    let defaultValue = jsDocMetadata.default;
    if (defaultValue === undefined && prop.valueDeclaration && ts.isPropertyDeclaration(prop.valueDeclaration)) {
      defaultValue = extractDefaultValue(prop.valueDeclaration);
    }

    // Determine attribute name (from JSDoc @attribute or kebab-case)
    const attributeName = jsDocMetadata.attribute || toKebabCase(propName);

    props.push({
      name: propName,
      attribute: attributeName,
      schema,
      required: !isOptional,
      source: 'attribute',
      description: jsDocMetadata.description,
      default: defaultValue,
      deprecated: jsDocMetadata.deprecated,
      tags: jsDocMetadata.tags,
    });
  }

  return props;
}

/**
 * Extracts props from a type literal node
 */
function extractPropsFromTypeLiteral(typeLiteral: ts.TypeLiteralNode, typeChecker: ts.TypeChecker): PropModel[] {
  const props: PropModel[] = [];

  for (const member of typeLiteral.members) {
    if (ts.isPropertySignature(member) && member.name) {
      const propName = member.name.getText();

      // Skip React built-in props
      if (propName === 'children' || propName === 'key' || propName === 'ref') {
        continue;
      }

      const schema = member.type ? typeNodeToJsonSchema(member.type, typeChecker) : { type: 'any' };

      const isOptional = member.questionToken !== undefined;

      // Extract JSDoc metadata
      const jsDocMetadata = extractJSDocMetadata(member);

      // Determine attribute name
      const attributeName = jsDocMetadata.attribute || toKebabCase(propName);

      props.push({
        name: propName,
        attribute: attributeName,
        schema,
        required: !isOptional,
        source: 'attribute',
        description: jsDocMetadata.description,
        default: jsDocMetadata.default,
        deprecated: jsDocMetadata.deprecated,
        tags: jsDocMetadata.tags,
      });
    }
  }

  return props;
}

/**
 * Converts camelCase to kebab-case
 */
function toKebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Extracts props from PropTypes definition
 * Pattern: Component.propTypes = { name: PropTypes.string, ... }
 */
function extractPropTypes(component: ts.ClassDeclaration | ts.FunctionDeclaration, typeChecker: ts.TypeChecker): PropModel[] {
  const props: PropModel[] = [];

  if (!component.name) {
    return props;
  }

  const componentName = component.name.text;
  const sourceFile = component.getSourceFile();

  // Find PropTypes assignment: Component.propTypes = { ... }
  function visit(node: ts.Node): void {
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
      const left = node.left;

      // Check if it's Component.propTypes
      if (ts.isPropertyAccessExpression(left)) {
        const obj = left.expression;
        const prop = left.name;

        if (ts.isIdentifier(obj) && obj.text === componentName && ts.isIdentifier(prop) && prop.text === 'propTypes') {
          // Right side should be an object literal
          const right = node.right;
          if (ts.isObjectLiteralExpression(right)) {
            props.push(...extractPropsFromPropTypesObject(right, typeChecker));
          } else if (ts.isAsExpression(right) && ts.isObjectLiteralExpression(right.expression)) {
            // Handle: { ... } as any
            props.push(...extractPropsFromPropTypesObject(right.expression, typeChecker));
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return props;
}

/**
 * Extract props from PropTypes object literal
 */
function extractPropsFromPropTypesObject(obj: ts.ObjectLiteralExpression, _typeChecker: ts.TypeChecker): PropModel[] {
  const props: PropModel[] = [];

  for (const property of obj.properties) {
    if (ts.isPropertyAssignment(property) && ts.isIdentifier(property.name)) {
      const propName = property.name.text;

      // Parse PropTypes expression
      const propTypeInfo = parsePropTypeExpression(property.initializer);

      if (propTypeInfo) {
        props.push({
          name: propName,
          attribute: toKebabCase(propName),
          schema: propTypeInfo.schema,
          required: propTypeInfo.required,
          source: 'attribute',
        });
      }
    }
  }

  return props;
}

/**
 * Parse PropTypes expression to JSON Schema
 */
function parsePropTypeExpression(expr: ts.Expression): { schema: any; required: boolean } | null {
  let required = false;
  let currentExpr = expr;

  // Check for .isRequired
  if (ts.isPropertyAccessExpression(expr)) {
    const prop = expr.name;
    if (ts.isIdentifier(prop) && prop.text === 'isRequired') {
      required = true;
      currentExpr = expr.expression;
    }
  }

  // Parse PropTypes.type
  if (ts.isPropertyAccessExpression(currentExpr)) {
    const obj = currentExpr.expression;
    const prop = currentExpr.name;

    if (ts.isIdentifier(obj) && obj.text === 'PropTypes' && ts.isIdentifier(prop)) {
      const type = prop.text;
      const schema = propTypeToSchema(type);
      return schema ? { schema, required } : null;
    }
  }

  // Parse PropTypes.shape({ ... })
  if (ts.isCallExpression(currentExpr)) {
    const callee = currentExpr.expression;

    if (ts.isPropertyAccessExpression(callee)) {
      const obj = callee.expression;
      const method = callee.name;

      if (ts.isIdentifier(obj) && obj.text === 'PropTypes' && ts.isIdentifier(method)) {
        const methodName = method.text;

        if (methodName === 'shape' && currentExpr.arguments.length > 0) {
          const arg = currentExpr.arguments[0];
          if (ts.isObjectLiteralExpression(arg)) {
            const properties: any = {};
            const requiredProps: string[] = [];

            for (const prop of arg.properties) {
              if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
                const name = prop.name.text;
                const propInfo = parsePropTypeExpression(prop.initializer);
                if (propInfo) {
                  properties[name] = propInfo.schema;
                  if (propInfo.required) {
                    requiredProps.push(name);
                  }
                }
              }
            }

            return {
              schema: {
                type: 'object',
                properties,
                ...(requiredProps.length > 0 && { required: requiredProps }),
              },
              required,
            };
          }
        }

        if (methodName === 'arrayOf' && currentExpr.arguments.length > 0) {
          const itemTypeInfo = parsePropTypeExpression(currentExpr.arguments[0]);
          return {
            schema: {
              type: 'array',
              items: itemTypeInfo?.schema || { type: 'any' },
            },
            required,
          };
        }

        if (methodName === 'objectOf' && currentExpr.arguments.length > 0) {
          const valueTypeInfo = parsePropTypeExpression(currentExpr.arguments[0]);
          return {
            schema: {
              type: 'object',
              additionalProperties: valueTypeInfo?.schema || { type: 'any' },
            },
            required,
          };
        }

        if (methodName === 'oneOf' && currentExpr.arguments.length > 0) {
          const arg = currentExpr.arguments[0];
          if (ts.isArrayLiteralExpression(arg)) {
            const enumValues = arg.elements
              .map((el) => {
                if (ts.isStringLiteral(el)) return el.text;
                if (ts.isNumericLiteral(el)) return Number(el.text);
                if (el.kind === ts.SyntaxKind.TrueKeyword) return true;
                if (el.kind === ts.SyntaxKind.FalseKeyword) return false;
                return null;
              })
              .filter((v) => v !== null);

            return {
              schema: { enum: enumValues },
              required,
            };
          }
        }

        if (methodName === 'oneOfType' && currentExpr.arguments.length > 0) {
          const arg = currentExpr.arguments[0];
          if (ts.isArrayLiteralExpression(arg)) {
            const schemas = arg.elements
              .map((el) => parsePropTypeExpression(el))
              .filter((info): info is NonNullable<typeof info> => info !== null)
              .map((info) => info.schema);

            return {
              schema: { oneOf: schemas },
              required,
            };
          }
        }
      }
    }
  }

  return null;
}

/**
 * Convert PropTypes type name to JSON Schema
 */
function propTypeToSchema(type: string): any {
  switch (type) {
    case 'string':
      return { type: 'string' };
    case 'number':
      return { type: 'number' };
    case 'bool':
      return { type: 'boolean' };
    case 'func':
      return { type: 'function' };
    case 'array':
      return { type: 'array' };
    case 'object':
      return { type: 'object' };
    case 'any':
      return { type: 'any' };
    case 'node':
      return { type: 'any' }; // React node
    case 'element':
      return { type: 'any' }; // React element
    case 'symbol':
      return { type: 'string' };
    default:
      return { type: 'any' };
  }
}
