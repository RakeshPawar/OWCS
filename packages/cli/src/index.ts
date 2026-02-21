#!/usr/bin/env node

import { Command } from 'commander';
import path from 'node:path';
import fs from 'node:fs';
import yaml from 'js-yaml';
import { analyzeAngularProject, analyzeReactProject, buildOWCSSpec, writeOWCSSpec, OutputFormat, convertToOpenAPI, validateOWCSFile } from '@owcs/api';
import { loadConfig } from '@owcs/api/node';
const program = new Command();

program.name('owcs').description('Open Web Component Specification - Generate and validate OWCS specs').version('1.0.0');

/**
 * Generate command - analyzes source code and generates OWCS spec
 */
program
  .command('generate')
  .description('Generate OWCS specification from source code')
  .option('-a, --adapter <adapter>', 'Framework adapter (angular or react)', 'angular')
  .option('-f, --format <format>', 'Output format (yaml or json)', 'yaml')
  .option('-o, --output <file>', 'Output file path', 'owcs.yaml')
  .option('-p, --project <path>', 'Project root path', process.cwd())
  .option('-t, --tsconfig <path>', 'Path to tsconfig.json')
  .option('--title <title>', 'Specification title')
  .option('--version <version>', 'Specification version', '1.0.0')
  .option('--description <description>', 'Specification description')
  .option('-r, --include-runtime-extension', 'Include x-owcs-runtime extension with bundler and module federation metadata')
  .option('--extensions', 'Load extensions from config file (owcs.config.js or owcs.config.json)')
  .option('--openapi', 'Also generate OpenAPI specification(partial support)')
  .action(async (options) => {
    try {
      console.log('🔍 Analyzing project...');

      // Load config file first
      const initialProjectRoot = path.resolve(options.project);
      let config;
      try {
        config = await loadConfig(initialProjectRoot);
        if (config) {
          console.log(`📄 Loaded configuration from config file`);
        }
      } catch (error) {
        console.error('⚠️  Warning: Failed to load config file:', error instanceof Error ? error.message : error);
      }

      // Merge config with CLI options - CLI options take precedence
      const projectRoot =
        options.project !== process.cwd()
          ? path.resolve(options.project)
          : config?.projectRoot
            ? path.resolve(config.projectRoot)
            : path.resolve(options.project);

      const format = (options.format !== 'yaml' ? options.format : config?.format || options.format) as OutputFormat;
      const adapter = (options.adapter !== 'angular' ? options.adapter : config?.adapter || options.adapter).toLowerCase();
      const title = options.title || config?.title;
      const version = options.version !== '1.0.0' ? options.version : config?.version || options.version;
      const description = options.description || config?.description;
      const includeRuntimeExtension = options.includeRuntimeExtension || config?.includeRuntimeExtension || false;
      const outputPath = options.output !== 'owcs.yaml' ? options.output : config?.outputPath || options.output;
      const configExtensions = options.extensions && config?.extensions ? config.extensions : undefined;

      if (format !== 'yaml' && format !== 'json') {
        console.error('❌ Error: Format must be either "yaml" or "json"');
        process.exit(1);
      }

      if (adapter !== 'angular' && adapter !== 'react') {
        console.error('❌ Error: Adapter must be either "angular" or "react"');
        process.exit(1);
      }

      // Analyze the project based on adapter
      let intermediateModel;

      if (adapter === 'angular') {
        console.log('📦 Using Angular adapter...');
        intermediateModel = analyzeAngularProject(projectRoot, options.tsconfig ? path.resolve(options.tsconfig) : undefined);
      } else {
        console.log('⚛️  Using React adapter...');
        intermediateModel = analyzeReactProject(projectRoot, options.tsconfig ? path.resolve(options.tsconfig) : undefined);
      }

      console.log(`✅ Found ${intermediateModel.components.length} component(s)`);

      // Build OWCS spec
      const owcsSpec = buildOWCSSpec(intermediateModel, {
        title: title,
        version: version,
        description: description,
        includeRuntimeExtension: includeRuntimeExtension,
        extensions: configExtensions,
      });

      // Determine output path
      let resolvedOutputPath = outputPath;
      if (format === 'json' && outputPath === 'owcs.yaml') {
        resolvedOutputPath = 'owcs.json';
      }
      resolvedOutputPath = path.resolve(resolvedOutputPath);

      // Write OWCS spec
      writeOWCSSpec(owcsSpec, resolvedOutputPath, format);
      console.log(`📝 Generated OWCS specification: ${resolvedOutputPath}`);

      // Generate OpenAPI spec if requested
      if (options.openapi) {
        const openApiSpec = convertToOpenAPI(owcsSpec);
        const openApiPath = resolvedOutputPath.replace(/\.(yaml|json)$/, '.openapi.$1');

        if (format === 'yaml') {
          const yamlContent = yaml.dump(openApiSpec, {
            indent: 2,
            lineWidth: -1,
            noRefs: true,
          });
          fs.writeFileSync(openApiPath, yamlContent, 'utf-8');
        } else {
          fs.writeFileSync(openApiPath, JSON.stringify(openApiSpec, null, 2), 'utf-8');
        }

        console.log(`📝 Generated OpenAPI specification: ${openApiPath}`);
      }

      console.log('✨ Done!');
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

/**
 * Validate command - validates an OWCS specification file
 */
program
  .command('validate')
  .description('Validate an OWCS specification file')
  .argument('<file>', 'OWCS specification file to validate')
  .action(async (file) => {
    try {
      const filePath = path.resolve(file);

      if (!fs.existsSync(filePath)) {
        console.error(`❌ Error: File not found: ${filePath}`);
        process.exit(1);
      }

      console.log(`🔍 Validating ${filePath}...`);

      // Validate using the validator API
      const result = validateOWCSFile(filePath);

      if (result.valid) {
        console.log('✅ Specification is valid!');
      } else {
        console.error('❌ Validation errors:');
        for (const error of result.errors || []) {
          console.error(`  - ${error}`);
        }
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

/**
 * Info command - displays information about a spec
 */
program
  .command('info')
  .description('Display information about an OWCS specification')
  .argument('<file>', 'OWCS specification file')
  .action(async (file) => {
    try {
      const filePath = path.resolve(file);

      if (!fs.existsSync(filePath)) {
        console.error(`❌ Error: File not found: ${filePath}`);
        process.exit(1);
      }

      // Read and parse the file
      const content = fs.readFileSync(filePath, 'utf-8');
      let spec: any;

      if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
        spec = yaml.load(content);
      } else if (filePath.endsWith('.json')) {
        spec = JSON.parse(content);
      } else {
        console.error('❌ Error: File must be .yaml, .yml, or .json');
        process.exit(1);
      }

      // Display info
      console.log('\n📋 OWCS Specification Info');
      console.log('─'.repeat(40));
      console.log(`Title:       ${spec.info?.title || 'N/A'}`);
      console.log(`Version:     ${spec.info?.version || 'N/A'}`);
      console.log(`OWCS:        ${spec.owcs || 'N/A'}`);

      if (spec.runtime?.bundler) {
        console.log(`\n🔧 Runtime:`);
        console.log(`  Bundler:   ${spec.runtime.bundler.name}`);
        if (spec.runtime.bundler.moduleFederation) {
          console.log(`  Remote:    ${spec.runtime.bundler.moduleFederation.remoteName}`);
        }
      }

      if (spec.components?.webComponents) {
        const components = Object.keys(spec.components.webComponents);
        console.log(`\n🧩 Components (${components.length}):`);
        for (const tagName of components) {
          const component = spec.components.webComponents[tagName];
          const propsCount = component.props?.schema?.properties ? Object.keys(component.props.schema.properties).length : 0;
          const eventsCount = component.events ? Object.keys(component.events).length : 0;
          console.log(`  - ${tagName}`);
          console.log(`    Props:   ${propsCount}`);
          console.log(`    Events:  ${eventsCount}`);
        }
      }

      console.log('');
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();
