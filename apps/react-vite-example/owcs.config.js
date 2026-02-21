export default {
  // Specification metadata
  title: 'React Vite Example Components',
  description: 'Example React web components built with Vite',
  version: '2.1.0',

  // Build options
  adapter: 'react',
  format: 'yaml',
  outputPath: './owcs-react-vite.yaml',

  // Include runtime extension
  includeRuntimeExtension: true,

  // Custom extensions
  extensions: {
    'x-owner': 'frontend-team',
    'x-package-version': '2.1.0',
    'x-team-name': 'React Team',
    'x-git-repo': 'https://github.com/owcs/react-vite-example',
  },
};
