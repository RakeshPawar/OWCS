import * as ts from 'typescript';
import * as path from 'path';
import { IntermediateModel, WebComponentModel } from '../../model/intermediate';
import {
  discoverComponents,
  findClassByName,
  getModulePath,
} from './component-discovery';
import { extractProps } from './props-extractor';
import { extractEvents } from './events-extractor';
import { extractFederationConfig } from './federation-extractor';

/**
 * Angular adapter - analyzes Angular source code and produces IntermediateModel
 */
export class AngularAdapter {
  private program: ts.Program;
  private typeChecker: ts.TypeChecker;
  private projectRoot: string;
  
  constructor(projectRoot: string, tsConfigPath?: string) {
    this.projectRoot = projectRoot;
    this.program = this.createProgram(projectRoot, tsConfigPath);
    this.typeChecker = this.program.getTypeChecker();
  }
  
  /**
   * Creates TypeScript program for analysis
   */
  private createProgram(projectRoot: string, tsConfigPath?: string): ts.Program {
    const configPath = tsConfigPath || this.findTsConfig(projectRoot);
    
    if (configPath) {
      const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
      const parsedConfig = ts.parseJsonConfigFileContent(
        configFile.config,
        ts.sys,
        path.dirname(configPath)
      );
      
      return ts.createProgram({
        rootNames: parsedConfig.fileNames,
        options: parsedConfig.options,
      });
    }
    
    // Fallback: create program with all TS files in src/
    const srcDir = path.join(projectRoot, 'src');
    const files = this.findTsFiles(srcDir);
    
    return ts.createProgram(files, {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ES2015,
      experimentalDecorators: true,
      emitDecoratorMetadata: true,
    });
  }
  
  /**
   * Finds tsconfig.json in the project
   */
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
  
  /**
   * Recursively finds all .ts files in a directory
   */
  private findTsFiles(dir: string): string[] {
    const files: string[] = [];
    
    try {
      const entries = ts.sys.readDirectory(
        dir,
        ['.ts'],
        ['node_modules', 'dist'],
        undefined,
        5
      );
      
      files.push(...entries);
    } catch (error) {
      // Directory might not exist
    }
    
    return files;
  }
  
  /**
   * Analyzes the project and produces IntermediateModel
   */
  public analyze(): IntermediateModel {
    // Extract runtime configuration
    const runtime = extractFederationConfig(this.projectRoot);
    
    // Discover all web components
    const registrations = discoverComponents(this.program);
    
    // Extract component details
    const components: WebComponentModel[] = [];
    
    for (const registration of registrations) {
      const component = this.analyzeComponent(registration);
      if (component) {
        components.push(component);
      }
    }
    
    return {
      runtime,
      components,
    };
  }
  
  /**
   * Analyzes a single component
   */
  private analyzeComponent(registration: {
    tagName: string;
    className: string;
    sourceFile: ts.SourceFile;
  }): WebComponentModel | undefined {
    // Find the class declaration
    const classDecl = findClassByName(
      this.program,
      registration.className,
      registration.sourceFile
    );
    
    if (!classDecl) {
      console.warn(`Could not find class ${registration.className}`);
      return undefined;
    }
    
    // Extract props
    const props = extractProps(classDecl, this.typeChecker);
    
    // Extract events
    const events = extractEvents(classDecl, this.typeChecker);
    
    // Get module path
    const modulePath = getModulePath(registration.sourceFile, this.projectRoot);
    
    return {
      tagName: registration.tagName,
      className: registration.className,
      modulePath,
      props,
      events,
    };
  }
}

/**
 * Convenience function to analyze an Angular project
 */
export function analyzeAngularProject(
  projectRoot: string,
  tsConfigPath?: string
): IntermediateModel {
  const adapter = new AngularAdapter(projectRoot, tsConfigPath);
  return adapter.analyze();
}
