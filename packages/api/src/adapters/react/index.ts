import * as ts from 'typescript';
import path from 'node:path';
import { IntermediateModel, WebComponentModel } from '../../model/intermediate.js';
import { discoverComponents, findComponentByName, getModulePath } from './component-discovery.js';
import { extractProps } from './props-extractor.js';
import { extractEvents } from './events-extractor.js';
import { extractFederationConfig } from './federation-extractor.js';

/** React adapter - analyzes source code and produces IntermediateModel */
export class ReactAdapter {
  private program: ts.Program;
  private typeChecker: ts.TypeChecker;
  private projectRoot: string;

  constructor(projectRoot: string, tsConfigPath?: string) {
    this.projectRoot = projectRoot;
    this.program = this.createProgram(projectRoot, tsConfigPath);
    this.typeChecker = this.program.getTypeChecker();
  }

  private createProgram(projectRoot: string, tsConfigPath?: string): ts.Program {
    const configPath = tsConfigPath || this.findTsConfig(projectRoot);

    if (configPath) {
      const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
      const parsedConfig = ts.parseJsonConfigFileContent(configFile.config, ts.sys, path.dirname(configPath));

      return ts.createProgram({
        rootNames: parsedConfig.fileNames,
        options: parsedConfig.options,
      });
    }

    const srcDir = path.join(projectRoot, 'src');
    const files = this.findTsFiles(srcDir);

    return ts.createProgram(files, {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ES2015,
      jsx: ts.JsxEmit.React,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      skipLibCheck: true,
    });
  }

  private findTsConfig(projectRoot: string): string | undefined {
    const possiblePaths = [
      path.join(projectRoot, 'tsconfig.json'),
      path.join(projectRoot, 'src', 'tsconfig.json'),
      path.join(projectRoot, 'tsconfig.app.json'),
    ];

    for (const configPath of possiblePaths) {
      if (ts.sys.fileExists(configPath)) {
        return configPath;
      }
    }

    return undefined;
  }

  private findTsFiles(dir: string): string[] {
    const files: string[] = [];

    try {
      const entries = ts.sys.readDirectory(dir, ['.ts', '.tsx'], ['node_modules', 'dist'], undefined, 5);
      files.push(...entries);
    } catch {
      // Directory might not exist
    }

    return files;
  }

  public analyze(): IntermediateModel {
    const runtime = extractFederationConfig(this.projectRoot);

    const registrations = discoverComponents(this.program);

    // Extract component details
    const components: WebComponentModel[] = [];

    for (const registration of registrations) {
      const component = this.extractComponentDetails(registration);
      if (component) {
        components.push(component);
      }
    }

    return {
      runtime,
      components,
    };
  }

  private extractComponentDetails(registration: { tagName: string; className: string; sourceFile: ts.SourceFile }): WebComponentModel | undefined {
    const { tagName, className, sourceFile } = registration;

    const componentDecl = findComponentByName(sourceFile, className);

    if (!componentDecl) {
      console.warn(`Could not find component declaration for: ${className}`);
      return undefined;
    }

    const props = extractProps(componentDecl, this.typeChecker);

    const events = extractEvents(componentDecl, this.typeChecker);

    const modulePath = getModulePath(sourceFile, this.projectRoot);

    return {
      tagName,
      className,
      modulePath,
      props,
      events,
    };
  }
}

/** Convenience function for analyzing React projects */
export function analyzeReactProject(projectRoot: string, tsConfigPath?: string): IntermediateModel {
  const adapter = new ReactAdapter(projectRoot, tsConfigPath);
  return adapter.analyze();
}
