import * as ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';
import { RuntimeModel } from '../../model/intermediate.js';
import { extractFederationConfigFromObject, extractWebpackFederationConfig } from '../shared/webpack-federation-extractor.js';

/**
 * Extracts Module Federation and bundler configuration
 * Supports both webpack and vite
 */
export function extractFederationConfig(projectRoot: string): RuntimeModel {
  const viteConfig = findViteConfig(projectRoot);
  if (viteConfig) {
    const federation = parseViteConfig(viteConfig);
    return {
      bundler: 'vite',
      federation,
    };
  }

  // Default to webpack if no config found
  return extractWebpackFederationConfig(projectRoot);
}

/**
 * Finds vite config file in the project
 */
function findViteConfig(projectRoot: string): string | undefined {
  const possibleNames = ['vite.config.js', 'vite.config.ts', 'vite.config.mjs'];

  for (const name of possibleNames) {
    const fullPath = path.join(projectRoot, name);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }

  return undefined;
}

/**
 * Parses vite config to extract Module Federation settings
 */
function parseViteConfig(configPath: string): RuntimeModel['federation'] | undefined {
  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    const sourceFile = ts.createSourceFile(configPath, content, ts.ScriptTarget.Latest, true);

    return extractViteFederationPlugin(sourceFile);
  } catch (error) {
    console.warn(`Failed to parse vite config: ${error}`);
    return undefined;
  }
}

/**
 * Extracts vite-plugin-federation configuration from vite config AST
 */
function extractViteFederationPlugin(sourceFile: ts.SourceFile): RuntimeModel['federation'] | undefined {
  let federationConfig: RuntimeModel['federation'] | undefined;

  function visit(node: ts.Node): void {
    if (federationConfig) return;

    // Look for "federation({ ... })" in plugins array
    if (ts.isCallExpression(node)) {
      const expression = node.expression;

      if (ts.isIdentifier(expression) && (expression.text === 'federation' || expression.text === 'moduleFederation')) {
        if (node.arguments.length > 0) {
          const arg = node.arguments[0];
          if (ts.isObjectLiteralExpression(arg)) {
            federationConfig = extractFederationConfigFromObject(arg);
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
