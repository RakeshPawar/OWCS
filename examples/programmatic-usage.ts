/**
 * Example: Programmatic usage of OWCS library
 */

import { analyzeAngularProject, analyzeReactProject, buildOWCSSpec, writeOWCSSpec, convertToOpenAPI } from '../src/api';

async function analyzeAngular() {
  console.log('🔍 Analyzing Angular project...\n');

  // Analyze Angular project
  const intermediateModel = analyzeAngularProject('./examples/angular');

  console.log(`✅ Found ${intermediateModel.components.length} component(s)`);
  console.log(`📦 Bundler: ${intermediateModel.runtime.bundler}`);

  if (intermediateModel.runtime.federation) {
    console.log(`🌐 Remote: ${intermediateModel.runtime.federation.remoteName}`);
  }

  console.log('\nComponents:');
  intermediateModel.components.forEach((component) => {
    console.log(`  - ${component.tagName} (${component.className})`);
    console.log(`    Props: ${component.props.length}`);
    console.log(`    Events: ${component.events.length}`);
  });

  return intermediateModel;
}

async function analyzeReact() {
  console.log('⚛️  Analyzing React project...\n');

  // Analyze React project
  const intermediateModel = analyzeReactProject('./examples/react');

  console.log(`✅ Found ${intermediateModel.components.length} component(s)`);
  console.log(`📦 Bundler: ${intermediateModel.runtime.bundler}`);

  if (intermediateModel.runtime.federation) {
    console.log(`🌐 Remote: ${intermediateModel.runtime.federation.remoteName}`);
  }

  console.log('\nComponents:');
  intermediateModel.components.forEach((component) => {
    console.log(`  - ${component.tagName} (${component.className})`);
    console.log(`    Props: ${component.props.length}`);
    console.log(`    Events: ${component.events.length}`);
  });

  return intermediateModel;
}

async function main() {
  try {
    console.log('🔍 Starting OWCS analysis...\n');

    // 1. Analyze projects (choose one or both)
    console.log('=== Angular Example ===');
    const angularModel = await analyzeAngular();

    console.log('\n=== React Example ===');
    const reactModel = await analyzeReact();

    // 2. Build OWCS specification (using Angular as example)
    console.log('\nStep 2: Building OWCS specification...');
    const owcsSpec = buildOWCSSpec(angularModel, {
      title: 'User Components Library',
      version: '1.0.0',
      description: 'Web components for user management',
    });

    console.log('✅ OWCS spec built successfully');

    // 3. Write to file (YAML)
    console.log('\nStep 3: Writing YAML output...');
    writeOWCSSpec(owcsSpec, './examples/output/owcs.yaml', 'yaml');
    console.log('✅ Written to examples/output/owcs.yaml');

    // 4. Write to file (JSON)
    console.log('\nStep 4: Writing JSON output...');
    writeOWCSSpec(owcsSpec, './examples/output/owcs.json', 'json');
    console.log('✅ Written to examples/output/owcs.json');

    // 5. Convert to OpenAPI
    console.log('\nStep 5: Converting to OpenAPI...');
    const openApiSpec = convertToOpenAPI(owcsSpec);

    console.log('✅ OpenAPI spec generated');
    console.log(`   Paths: ${Object.keys(openApiSpec.paths).length}`);
    console.log(`   Schemas: ${Object.keys(openApiSpec.components?.schemas || {}).length}`);

    // Write OpenAPI spec
    const fs = require('fs');
    const yaml = require('js-yaml');

    fs.writeFileSync('./examples/output/openapi.yaml', yaml.dump(openApiSpec, { indent: 2, lineWidth: -1 }), 'utf-8');
    console.log('✅ Written to examples/output/openapi.yaml');

    fs.writeFileSync('./examples/output/openapi.json', JSON.stringify(openApiSpec, null, 2), 'utf-8');
    console.log('✅ Written to examples/output/openapi.json');

    // 6. Display sample output
    console.log('\n' + '='.repeat(50));
    console.log('Sample OWCS Specification:');
    console.log('='.repeat(50));
    console.log(yaml.dump(owcsSpec, { indent: 2, lineWidth: -1 }));

    console.log('\n✨ Done! All files generated successfully.\n');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
