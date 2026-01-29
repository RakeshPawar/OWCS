import fs from 'node:fs';
import path from 'node:path';
import { RuntimeModel } from '../../model/intermediate.js';
import * as ts from 'typescript';

export function extractWebpackFederationConfig(projectRoot: string): RuntimeModel {
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

function findWebpackConfig(projectRoot: string): string | undefined {
  const possibleNames = ['webpack.config.js', 'webpack.config.ts', 'webpack.config.mjs', 'config/webpack.config.js', 'webpack/webpack.config.js'];

  for (const name of possibleNames) {
    const fullPath = path.join(projectRoot, name);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }

  return undefined;
}

function parseWebpackConfig(configPath: string): RuntimeModel['federation'] | undefined {
  try {
    const content = fs.readFileSync(configPath, 'utf-8');

    const sourceFile = ts.createSourceFile(configPath, content, ts.ScriptTarget.Latest, true);

    const federationConfig = extractModuleFederationPlugin(sourceFile);

    return federationConfig;
  } catch (error) {
    console.warn(`Failed to parse webpack config: ${error}`);
    return undefined;
  }
}

function extractModuleFederationPlugin(sourceFile: ts.SourceFile): RuntimeModel['federation'] | undefined {
  let federationConfig: RuntimeModel['federation'] | undefined;

  function visit(node: ts.Node): void {
    if (federationConfig) return;

    if (ts.isNewExpression(node)) {
      const expression = node.expression;

      if (ts.isIdentifier(expression) && expression.text === 'ModuleFederationPlugin') {
        federationConfig = extractPluginConfig(node);
        return;
      }

      if (ts.isPropertyAccessExpression(expression)) {
        const property = expression.name;
        if (ts.isIdentifier(property) && property.text === 'ModuleFederationPlugin') {
          federationConfig = extractPluginConfig(node);
          return;
        }
      }
    }

    if (ts.isCallExpression(node)) {
      const expression = node.expression;

      if (ts.isIdentifier(expression) && expression.text === 'withModuleFederationPlugin') {
        if (node.arguments.length > 0) {
          const arg = node.arguments[0];
          if (ts.isObjectLiteralExpression(arg)) {
            federationConfig = extractPluginConfig(ts.factory.createNewExpression(ts.factory.createIdentifier('ModuleFederationPlugin'), undefined, [arg]));
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
export function extractPluginConfig(newExpr: ts.NewExpression): RuntimeModel['federation'] | undefined {
  if (!newExpr.arguments || newExpr.arguments.length === 0) {
    return undefined;
  }

  const configArg = newExpr.arguments[0];

  if (!ts.isObjectLiteralExpression(configArg)) {
    return undefined;
  }

  return extractFederationConfigFromObject(configArg);
}

export function extractFederationConfigFromObject(objLiteral: ts.ObjectLiteralExpression): RuntimeModel['federation'] | undefined {
  let remoteName: string | undefined;
  let libraryType: string | undefined;
  const exposes: Record<string, string> = {};

  for (const prop of objLiteral.properties) {
    if (ts.isPropertyAssignment(prop)) {
      const propName = prop.name;

      if (ts.isIdentifier(propName)) {
        const name = propName.text;

        if (name === 'name') {
          if (ts.isStringLiteral(prop.initializer)) {
            remoteName = prop.initializer.text;
          }
        }

        if (name === 'library') {
          if (ts.isObjectLiteralExpression(prop.initializer)) {
            const typeProp = prop.initializer.properties.find((p) => ts.isPropertyAssignment(p) && ts.isIdentifier(p.name) && p.name.text === 'type');

            if (typeProp && ts.isPropertyAssignment(typeProp) && ts.isStringLiteral(typeProp.initializer)) {
              libraryType = typeProp.initializer.text;
            }
          }
        }

        if (name === 'libraryType') {
          if (ts.isStringLiteral(prop.initializer)) {
            libraryType = prop.initializer.text;
          }
        }

        if (name === 'exposes') {
          if (ts.isObjectLiteralExpression(prop.initializer)) {
            for (const exposeProp of prop.initializer.properties) {
              if (ts.isPropertyAssignment(exposeProp)) {
                const exposeName = exposeProp.name;
                const exposeValue = exposeProp.initializer;

                if (ts.isStringLiteral(exposeName) && ts.isStringLiteral(exposeValue)) {
                  exposes[exposeName.text] = exposeValue.text;
                } else if (ts.isIdentifier(exposeName) && ts.isStringLiteral(exposeValue)) {
                  exposes[exposeName.text] = exposeValue.text;
                }
              }
            }
          }
        }
      }
    }
  }

  if (!remoteName) {
    return undefined;
  }

  return {
    remoteName,
    libraryType,
    exposes: Object.keys(exposes).length > 0 ? exposes : undefined,
  };
}
