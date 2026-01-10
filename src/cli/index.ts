#!/usr/bin/env node

import { Command } from 'commander';
import path from 'node:path';
import fs from 'node:fs';
import Ajv from 'ajv';
import yaml from 'js-yaml';
import { analyzeAngularProject } from '../adapters/angular/index.js';
import { buildOWCSSpec } from '../core/schema-builder.js';
import { writeOWCSSpec, OutputFormat } from '../core/yaml-writer.js';
import { convertToOpenAPI } from '../openapi/converter.js';
import owcsSchema from '../owcs.schema.json' with { type: 'json' };

const program = new Command();

program
  .name('owcs')
  .description('Open Web Component Specification - Generate and validate OWCS specs')
  .version('1.0.0');

/**
 * Generate command - analyzes source code and generates OWCS spec
 */
program
  .command('generate')
  .description('Generate OWCS specification from source code')
  .option('-f, --format <format>', 'Output format (yaml or json)', 'yaml')
  .option('-o, --output <file>', 'Output file path', 'owcs.yaml')
  .option('-p, --project <path>', 'Project root path', process.cwd())
  .option('-t, --tsconfig <path>', 'Path to tsconfig.json')
  .option('--title <title>', 'Specification title')
  .option('--version <version>', 'Specification version', '1.0.0')
  .option('--description <description>', 'Specification description')
  .option('--openapi', 'Also generate OpenAPI specification')
  .action(async (options) => {
    try {
      console.log('🔍 Analyzing project...');
      
      const projectRoot = path.resolve(options.project);
      const format = options.format as OutputFormat;
      
      if (format !== 'yaml' && format !== 'json') {
        console.error('❌ Error: Format must be either "yaml" or "json"');
        process.exit(1);
      }
      
      // Analyze the project
      const intermediateModel = analyzeAngularProject(
        projectRoot,
        options.tsconfig ? path.resolve(options.tsconfig) : undefined
      );
      
      console.log(`✅ Found ${intermediateModel.components.length} component(s)`);
      
      // Build OWCS spec
      const owcsSpec = buildOWCSSpec(intermediateModel, {
        title: options.title,
        version: options.version,
        description: options.description,
      });
      
      // Determine output path
      let outputPath = options.output;
      if (format === 'json' && outputPath === 'owcs.yaml') {
        outputPath = 'owcs.json';
      }
      outputPath = path.resolve(outputPath);
      
      // Write OWCS spec
      writeOWCSSpec(owcsSpec, outputPath, format);
      console.log(`📝 Generated OWCS specification: ${outputPath}`);
      
      // Generate OpenAPI spec if requested
      if (options.openapi) {
        const openApiSpec = convertToOpenAPI(owcsSpec);
        const openApiPath = outputPath.replace(/\.(yaml|json)$/, '.openapi.$1');
        
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
      
      // Read and parse the file
      const content = fs.readFileSync(filePath, 'utf-8');
      let spec: unknown;
      
      if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
        spec = yaml.load(content);
      } else if (filePath.endsWith('.json')) {
        spec = JSON.parse(content);
      } else {
        console.error('❌ Error: File must be .yaml, .yml, or .json');
        process.exit(1);
      }
      
      // Validate against schema
      const ajv = new Ajv.default({ allErrors: true, strict: false });
      const validate = ajv.compile(owcsSchema);
      const valid = validate(spec);
      
      if (valid) {
        console.log('✅ Specification is valid!');
      } else {
        console.error('❌ Validation errors:');
        for (const error of validate.errors || []) {
          console.error(`  - ${error.instancePath}: ${error.message}`);
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
          const propsCount = component.props?.schema?.properties
            ? Object.keys(component.props.schema.properties).length
            : 0;
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
