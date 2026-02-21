import * as ts from 'typescript';

/** JSDoc metadata extracted from AST nodes */
export interface JSDocMetadata {
  description?: string;
  default?: unknown;
  deprecated?: boolean;
  property?: string;
  attribute?: string;
  event?: string;
  fires?: string[];
  tags?: Record<string, string>;
}

export function extractJSDocMetadata(node: ts.Node): JSDocMetadata {
  const metadata: JSDocMetadata = {};
  const jsDocTags = ts.getJSDocTags(node);
  const jsDocComments = (node as any).jsDoc as ts.JSDoc[] | undefined;

  if (jsDocComments && jsDocComments.length > 0) {
    const comment = jsDocComments[0].comment;
    if (typeof comment === 'string') {
      metadata.description = comment.trim();
    } else if (comment) {
      metadata.description = comment
        .map((c: any) => c.text)
        .join('')
        .trim();
    }
  }

  const tags: Record<string, string> = {};

  for (const tag of jsDocTags) {
    const tagName = tag.tagName.text;
    let tagValue = '';

    if (tag.comment) {
      if (typeof tag.comment === 'string') {
        tagValue = tag.comment;
      } else {
        tagValue = tag.comment.map((c: any) => c.text).join('');
      }
    }

    tags[tagName] = tagValue;

    switch (tagName) {
      case 'default':
        metadata.default = parseDefaultValue(tagValue);
        break;

      case 'deprecated':
        metadata.deprecated = true;
        break;
    }
  }

  if (Object.keys(tags).length > 0) {
    metadata.tags = tags;
  }

  return metadata;
}

/** Parses JSDoc @default value as JSON or primitive type */
function parseDefaultValue(value: string): unknown {
  const trimmed = value.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;
    if (trimmed === 'null') return null;
    if (trimmed === 'undefined') return undefined;
    if (!isNaN(Number(trimmed))) return Number(trimmed);
    return trimmed;
  }
}

export function extractDefaultValue(property: ts.PropertyDeclaration): unknown {
  if (property.initializer) {
    if (ts.isStringLiteral(property.initializer)) {
      return property.initializer.text;
    }
    if (ts.isNumericLiteral(property.initializer)) {
      return Number(property.initializer.text);
    }
    if (property.initializer.kind === ts.SyntaxKind.TrueKeyword) {
      return true;
    }
    if (property.initializer.kind === ts.SyntaxKind.FalseKeyword) {
      return false;
    }
    if (property.initializer.kind === ts.SyntaxKind.NullKeyword) {
      return null;
    }
    if (ts.isArrayLiteralExpression(property.initializer) && property.initializer.elements.length === 0) {
      return [];
    }
    if (ts.isObjectLiteralExpression(property.initializer) && property.initializer.properties.length === 0) {
      return {};
    }
  }

  return undefined;
}
