import * as ts from 'typescript';
import { PropModel } from '../../model/intermediate.js';
import { typeNodeToJsonSchema, typeToJsonSchema } from '../shared/type.utils.js';
import { extractJSDocMetadata, extractDefaultValue } from '../shared/jsdoc.utils.js';

export function extractProps(component: ts.ClassDeclaration | ts.FunctionDeclaration, typeChecker: ts.TypeChecker): PropModel[] {
  const props: PropModel[] = [];

  if (ts.isClassDeclaration(component)) {
    props.push(...extractClassComponentProps(component, typeChecker));
  } else {
    props.push(...extractFunctionComponentProps(component, typeChecker));
  }

  return props;
}

/** Extracts props from class component via React.Component<Props> type parameters */
function extractClassComponentProps(classDecl: ts.ClassDeclaration, typeChecker: ts.TypeChecker): PropModel[] {
  const props: PropModel[] = [];

  const heritageClause = classDecl.heritageClauses?.find((clause) => clause.token === ts.SyntaxKind.ExtendsKeyword);

  if (heritageClause && heritageClause.types.length > 0) {
    const extendsType = heritageClause.types[0];

    const extendsText = extendsType.expression.getText();
    if (extendsText === 'HTMLElement') {
      const implementsClause = classDecl.heritageClauses?.find((clause) => clause.token === ts.SyntaxKind.ImplementsKeyword);

      if (implementsClause && implementsClause.types.length > 0) {
        const implementsType = implementsClause.types[0];
        const type = typeChecker.getTypeAtLocation(implementsType);
        return extractPropsFromTypeObject(type, typeChecker);
      }

      return props;
    }

    if (extendsType.typeArguments && extendsType.typeArguments.length > 0) {
      const propsType = extendsType.typeArguments[0];
      return extractPropsFromType(propsType, typeChecker);
    }
  }

  return props;
}

/** Extracts props from function component's first parameter type */
function extractFunctionComponentProps(funcDecl: ts.FunctionDeclaration, typeChecker: ts.TypeChecker): PropModel[] {
  if (funcDecl.parameters.length === 0) {
    return [];
  }

  const propsParam = funcDecl.parameters[0];

  const type = typeChecker.getTypeAtLocation(propsParam);
  if (type) {
    return extractPropsFromTypeObject(type, typeChecker);
  }

  if (propsParam.type) {
    return extractPropsFromType(propsParam.type, typeChecker);
  }

  return [];
}

function extractPropsFromType(typeNode: ts.TypeNode, typeChecker: ts.TypeChecker): PropModel[] {
  if (ts.isTypeReferenceNode(typeNode)) {
    const type = typeChecker.getTypeFromTypeNode(typeNode);
    return extractPropsFromTypeObject(type, typeChecker);
  }

  if (ts.isTypeLiteralNode(typeNode)) {
    return extractPropsFromTypeLiteral(typeNode, typeChecker);
  }

  if (ts.isIntersectionTypeNode(typeNode)) {
    const props: PropModel[] = [];
    for (const subType of typeNode.types) {
      props.push(...extractPropsFromType(subType, typeChecker));
    }
    return props;
  }

  return [];
}

function extractPropsFromTypeObject(type: ts.Type, typeChecker: ts.TypeChecker): PropModel[] {
  const props: PropModel[] = [];

  const properties = type.getProperties();

  for (const prop of properties) {
    const propName = prop.getName();

    // Skip React built-in props
    if (propName === 'children' || propName === 'key' || propName === 'ref') {
      continue;
    }

    const propType = typeChecker.getTypeOfSymbolAtLocation(prop, prop.valueDeclaration!);
    const schema = typeToJsonSchema(propType, typeChecker);

    const isOptional = (prop.flags & ts.SymbolFlags.Optional) !== 0;

    const jsDocMetadata = prop.valueDeclaration ? extractJSDocMetadata(prop.valueDeclaration) : {};

    let defaultValue = jsDocMetadata.default;
    if (defaultValue === undefined && prop.valueDeclaration && ts.isPropertyDeclaration(prop.valueDeclaration)) {
      defaultValue = extractDefaultValue(prop.valueDeclaration);
    }

    const attributeName = jsDocMetadata.attribute || toKebabCase(propName);

    props.push({
      name: propName,
      attribute: attributeName,
      schema,
      required: !isOptional,
      source: 'attribute',
      description: jsDocMetadata.description,
      default: defaultValue,
      tags: jsDocMetadata.tags,
    });
  }

  return props;
}

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

      const jsDocMetadata = extractJSDocMetadata(member);

      const attributeName = jsDocMetadata.attribute || toKebabCase(propName);

      props.push({
        name: propName,
        attribute: attributeName,
        schema,
        required: !isOptional,
        source: 'attribute',
        description: jsDocMetadata.description,
        default: jsDocMetadata.default,
        tags: jsDocMetadata.tags,
      });
    }
  }

  return props;
}

function toKebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}
