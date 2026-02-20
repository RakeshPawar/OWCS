/**
 * OWCS Viewer Demo Application
 * Demonstrates the usage of the OWCS Viewer web component
 */

// Import the OWCS Viewer web component
import '@owcs/ui';

// Load YAML from public directory
let angularExampleYaml = '';

// Fetch the YAML file
fetch('/owcs-angular-webpack.yaml')
  .then((response) => response.text())
  .then((yaml) => {
    angularExampleYaml = yaml;
    // Load Angular example by default after fetching
    if (viewer) {
      viewer.yaml = angularExampleYaml;
    }
  })
  .catch((error) => {
    console.error('Failed to load YAML file:', error);
  });

// Get viewer element
const viewer = document.getElementById('viewer') as any;

// Load Angular example
document.getElementById('loadAngularExample')?.addEventListener('click', () => {
  viewer.yaml = angularExampleYaml;
});

// Load from URL (example)
document.getElementById('loadFromUrl')?.addEventListener('click', () => {
  // In a real scenario, you might want to show an input dialog
  const url = prompt('Enter OWCS YAML URL:');
  if (url) {
    viewer.yamlUrl = url;
    viewer.yaml = ''; // Clear inline YAML
  }
});

// Clear viewer
document.getElementById('clearViewer')?.addEventListener('click', () => {
  viewer.yaml = '';
  viewer.yamlUrl = '';
});

console.log('OWCS Viewer Demo loaded successfully!');
