import * as ts from 'typescript';
import { PropModel } from '../../model/intermediate.js';
import { typeNodeToJsonSchema, typeToJsonSchema } from '../shared/type.utils.js';

/**
 * Extracts props from a React component (class or function)
 */
export function extractProps(component: ts.ClassDeclaration | ts.FunctionDeclaration, typeChecker: ts.TypeChecker): PropModel[] {
  if (ts.isClassDeclaration(component)) {
    return extractClassComponentProps(component, typeChecker);
  } else {
    return extractFunctionComponentProps(component, typeChecker);
  }
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

  // Check if parameter has a type annotation
  if (propsParam.type) {
    return extractPropsFromType(propsParam.type, typeChecker);
  }

  // Try to infer type from the parameter
  const type = typeChecker.getTypeAtLocation(propsParam);
  if (type) {
    return extractPropsFromTypeObject(type, typeChecker);
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

    props.push({
      name: propName,
      attribute: toKebabCase(propName),
      schema,
      required: !isOptional,
      source: 'attribute',
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

      props.push({
        name: propName,
        attribute: toKebabCase(propName),
        schema,
        required: !isOptional,
        source: 'attribute',
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
