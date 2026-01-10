#!/usr/bin/env node
// Test ESM imports

import { analyzeAngularProject, buildOWCSSpec, convertToOpenAPI } from './dist/index.js';

console.log('✅ ESM import successful!');
console.log('Available exports:');
console.log('  - analyzeAngularProject:', typeof analyzeAngularProject);
console.log('  - buildOWCSSpec:', typeof buildOWCSSpec);
console.log('  - convertToOpenAPI:', typeof convertToOpenAPI);

// Test subpath exports
import { AngularAdapter } from './dist/adapters/angular/index.js';
console.log('  - AngularAdapter:', typeof AngularAdapter);

console.log('\n✅ All ESM exports working correctly!');
