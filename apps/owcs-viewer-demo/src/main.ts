/**
 * OWCS Viewer Demo Application
 * Demonstrates the usage of the OWCS Viewer web component
 */

// Import the OWCS Viewer web component
import '@owcs/ui';

// Sample YAML from Angular example
const angularExampleYaml = `owcs: 1.0.0
info:
  title: userComponents
  version: 1.0.0
components:
  webComponents:
    comprehensive-example-angular:
      tagName: comprehensive-example-angular
      props:
        schema:
          type: object
          properties:
            userName:
              type: string
            isActive:
              type: boolean
            theme:
              type: string
              enum:
                - light
                - dark
                - auto
            status:
              type: string
              enum:
                - idle
                - loading
                - success
                - error
            config:
              type: object
              properties:
                endpoint:
                  type: string
                timeout:
                  type: number
                retry:
                  type: boolean
                headers:
                  type: object
              required:
                - endpoint
                - timeout
            user:
              type: object
              properties:
                id:
                  type: number
                name:
                  type: string
                email:
                  type: string
                roles:
                  type: array
                  items:
                    type: string
              required:
                - id
                - name
                - email
                - roles
            emailAddress:
              type: string
            settings:
              type: object
              properties:
                display:
                  type: object
                  properties:
                    showHeader:
                      type: boolean
                    showFooter:
                      type: boolean
                behavior:
                  type: object
                  properties:
                    autoSave:
                      type: boolean
                    interval:
                      type: number
            signalName:
              type: string
            counter:
              type: number
            priority:
              type: number
          required:
            - userName
            - isActive
            - theme
            - status
            - signalName
      events:
        userAction:
          type: EventEmitter
        dataLoad:
          type: EventEmitter
        error:
          type: EventEmitter
        hover:
          type: EventEmitter
        user-updated:
          type: EventEmitter
        notify:
          type: OutputSignal
          payload:
            type: object
            properties:
              message:
                type: string
              type:
                type: string
                enum:
                  - info
                  - warning
                  - error
            required:
              - message
              - type
        data-ready:
          type: OutputSignal
          payload:
            type: object
            properties:
              ready:
                type: boolean
            required:
              - ready
    user-card:
      tagName: user-card
      props:
        schema:
          type: object
          properties:
            data:
              type: object
              properties:
                name:
                  type: string
                age:
                  type: number
                email:
                  type: string
                config:
                  type: object
                  properties:
                    theme:
                      type: string
                      enum:
                        - light
                        - dark
                    showAvatar:
                      type: boolean
                  required:
                    - theme
                    - showAvatar
              required:
                - name
          required:
            - data
      events:
        clicked:
          type: OutputSignal
          payload:
            type: object
            properties:
              timestamp:
                type: number
            required:
              - timestamp
        userUpdated:
          type: EventEmitter
x-owner: platform-team
x-package-version: 1.0.0
x-team-name: Frontend Core
x-git-repo: https://github.com/owcs/angular-example
x-owcs-runtime:
  bundler:
    name: webpack
    moduleFederation:
      remoteName: userComponents
      libraryType: module
      exposes:
        ./user-card: ./src/user-card/user-card.wc.ts

`;

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

// Load Angular example by default
viewer.yaml = angularExampleYaml;

console.log('OWCS Viewer Demo loaded successfully!');
