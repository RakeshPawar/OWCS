export default {
  // Specification metadata
  title: 'Angular Example Components',
  description: 'Example Angular web components demonstrating OWCS',
  version: '1.0.0',

  // Build options
  adapter: 'angular',
  format: 'yaml',
  outputPath: './owcs-angular-webpack.yaml',

  // Include runtime extension
  includeRuntimeExtension: true,

  // Custom extensions
  extensions: {
    'x-owner': 'platform-team',
    'x-package-version': '1.0.0',
    'x-team-name': 'Frontend Core',
    'x-git-repo': 'https://github.com/owcs/angular-example',
  },
};
