import * as ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';
import { RuntimeModel } from '../../model/intermediate.js';

/**
 * Extracts Module Federation configuration from webpack config
 */
export function extractFederationConfig(projectRoot: string): RuntimeModel {
  const webpackConfigPath = findWebpackConfig(projectRoot);
  
  if (!webpackConfigPath) {
    return { bundler: 'webpack' };
  }
  
  const federation = parseWebpackConfig(webpackConfigPath);
  
  return {
    bundler: 'webpack',
    federation,
  };
}

/**
 * Finds webpack config file in the project
 */
function findWebpackConfig(projectRoot: string): string | undefined {
  const possibleNames = [
    'webpack.config.js',
    'webpack.config.ts',
    'webpack.config.mjs',
    'config/webpack.config.js',
    'webpack/webpack.config.js',
  ];
  
  for (const name of possibleNames) {
    const fullPath = path.join(projectRoot, name);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }
  
  return undefined;
}

/**
 * Parses webpack config to extract Module Federation settings
 */
function parseWebpackConfig(
  configPath: string
): RuntimeModel['federation'] | undefined {
  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    
    // Create a program to parse the webpack config
    const sourceFile = ts.createSourceFile(
      configPath,
      content,
      ts.ScriptTarget.Latest,
      true
    );
    
    const federationConfig = extractModuleFederationPlugin(sourceFile);
    
    return federationConfig;
  } catch (error) {
    console.warn(`Failed to parse webpack config: ${error}`);
    return undefined;
  }
}

/**
 * Extracts ModuleFederationPlugin configuration from AST
 */
function extractModuleFederationPlugin(
  sourceFile: ts.SourceFile
): RuntimeModel['federation'] | undefined {
  let federationConfig: RuntimeModel['federation'] | undefined;
  
  function visit(node: ts.Node): void {
    if (federationConfig) return;
    
    // Look for "new ModuleFederationPlugin({ ... })"
    if (ts.isNewExpression(node)) {
      const expression = node.expression;
      
      if (ts.isIdentifier(expression) && expression.text === 'ModuleFederationPlugin') {
        federationConfig = extractPluginConfig(node);
        return;
      }
      
      // Also check for namespaced access: container.ModuleFederationPlugin
      if (ts.isPropertyAccessExpression(expression)) {
        const property = expression.name;
        if (ts.isIdentifier(property) && property.text === 'ModuleFederationPlugin') {
          federationConfig = extractPluginConfig(node);
          return;
        }
      }
    }

    // Look for "withModuleFederationPlugin({ ... })"
    if (ts.isCallExpression(node)) {
      const expression = node.expression;
      
      if (ts.isIdentifier(expression) && expression.text === 'withModuleFederationPlugin') {
        if (node.arguments.length > 0) {
          const arg = node.arguments[0];
          if (ts.isObjectLiteralExpression(arg)) {
            federationConfig = extractPluginConfig(
              ts.factory.createNewExpression(
                ts.factory.createIdentifier('ModuleFederationPlugin'),
                undefined,
                [arg]
              )
            );
            return;
          }
        }
      }
    }
    
    ts.forEachChild(node, visit);
  }
  
  visit(sourceFile);
  return federationConfig;
}

/**
 * Extracts configuration from ModuleFederationPlugin arguments
 */
function extractPluginConfig(
  newExpression: ts.NewExpression
): RuntimeModel['federation'] | undefined {
  if (!newExpression.arguments || newExpression.arguments.length === 0) {
    return undefined;
  }
  
  const configArg = newExpression.arguments[0];
  
  if (!ts.isObjectLiteralExpression(configArg)) {
    return undefined;
  }
  
  const config: RuntimeModel['federation'] = {
    remoteName: '',
  };
  
  for (const prop of configArg.properties) {
    if (!ts.isPropertyAssignment(prop)) {
      continue;
    }
    
    const name = prop.name;
    if (!ts.isIdentifier(name) && !ts.isStringLiteral(name)) {
      continue;
    }
    
    const key = ts.isIdentifier(name) ? name.text : name.text;
    
    if (key === 'name') {
      const value = extractStringValue(prop.initializer);
      if (value) {
        config.remoteName = value;
      }
    } else if (key === 'library') {
      // library can be an object { type: '...' } or just a type string
      if (ts.isObjectLiteralExpression(prop.initializer)) {
        const typeValue = extractPropertyValue(prop.initializer, 'type');
        if (typeValue) {
          config.libraryType = typeValue;
        }
      } else {
        const value = extractStringValue(prop.initializer);
        if (value) {
          config.libraryType = value;
        }
      }
    } else if (key === 'exposes') {
      const exposes = extractExposesObject(prop.initializer);
      if (exposes) {
        config.exposes = exposes;
      }
    }
  }
  
  return config.remoteName ? config : undefined;
}

/**
 * Extracts string value from an expression
 */
function extractStringValue(expression: ts.Expression): string | undefined {
  if (ts.isStringLiteral(expression)) {
    return expression.text;
  }
  return undefined;
}

/**
 * Extracts a property value from an object literal
 */
function extractPropertyValue(
  objectLiteral: ts.ObjectLiteralExpression,
  propertyName: string
): string | undefined {
  for (const prop of objectLiteral.properties) {
    if (!ts.isPropertyAssignment(prop)) {
      continue;
    }
    
    const name = prop.name;
    if (ts.isIdentifier(name) && name.text === propertyName) {
      return extractStringValue(prop.initializer);
    }
  }
  return undefined;
}

/**
 * Extracts the exposes object as a Record<string, string>
 */
function extractExposesObject(
  expression: ts.Expression
): Record<string, string> | undefined {
  if (!ts.isObjectLiteralExpression(expression)) {
    return undefined;
  }
  
  const exposes: Record<string, string> = {};
  
  for (const prop of expression.properties) {
    if (!ts.isPropertyAssignment(prop)) {
      continue;
    }
    
    const name = prop.name;
    let key: string | undefined;
    
    if (ts.isIdentifier(name)) {
      key = name.text;
    } else if (ts.isStringLiteral(name)) {
      key = name.text;
    }
    
    if (key) {
      const value = extractStringValue(prop.initializer);
      if (value) {
        exposes[key] = value;
      }
    }
  }
  
  return Object.keys(exposes).length > 0 ? exposes : undefined;
}
