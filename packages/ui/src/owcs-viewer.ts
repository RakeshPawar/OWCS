/**
 * OWCS Viewer Web Component
 * Displays OWCS (Open Web Component Specification) YAML in a user-friendly format
 */

import { LitElement, html, nothing, css } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { customElement, property, state } from 'lit/decorators.js';
import { OWCSValidator, generateComponentTypes } from '@owcs/api';
import { owcsViewerStyles } from './styles.js';
import { fetchYamlFromUrl, parseYaml, validateOwcsSpec, filterComponentsByTagName } from './utils.js';
import hljs from 'highlight.js';

@customElement('owcs-viewer')
export class OWCSViewer extends LitElement {
  static styles = [
    owcsViewerStyles,
    css`
      /* Highlight.js GitHub theme - inlined */
      pre code.hljs {
        display: block;
        overflow-x: auto;
        padding: 1em;
      }
      code.hljs {
        padding: 3px 5px;
      }
      .hljs {
        color: #24292e;
        background: #fff;
      }
      .hljs-doctag,
      .hljs-keyword,
      .hljs-meta .hljs-keyword,
      .hljs-template-tag,
      .hljs-template-variable,
      .hljs-type,
      .hljs-variable.language_ {
        color: #d73a49;
      }
      .hljs-title,
      .hljs-title.class_,
      .hljs-title.class_.inherited__,
      .hljs-title.function_ {
        color: #6f42c1;
      }
      .hljs-attr,
      .hljs-attribute,
      .hljs-literal,
      .hljs-meta,
      .hljs-number,
      .hljs-operator,
      .hljs-variable,
      .hljs-selector-attr,
      .hljs-selector-class,
      .hljs-selector-id {
        color: #005cc5;
      }
      .hljs-regexp,
      .hljs-string,
      .hljs-meta .hljs-string {
        color: #032f62;
      }
      .hljs-built_in,
      .hljs-symbol {
        color: #e36209;
      }
      .hljs-comment,
      .hljs-code,
      .hljs-formula {
        color: #6a737d;
      }
      .hljs-name,
      .hljs-quote,
      .hljs-selector-tag,
      .hljs-selector-pseudo {
        color: #22863a;
      }
      .hljs-subst {
        color: #24292e;
      }
      .hljs-section {
        color: #005cc5;
        font-weight: 700;
      }
      .hljs-bullet {
        color: #735c0f;
      }
      .hljs-emphasis {
        color: #24292e;
        font-style: italic;
      }
      .hljs-strong {
        color: #24292e;
        font-weight: 700;
      }
      .hljs-addition {
        color: #22863a;
        background-color: #f0fff4;
      }
      .hljs-deletion {
        color: #b31d28;
        background-color: #ffeef0;
      }
    `,
  ];

  /**
   * OWCS YAML content as a string
   */
  @property({ type: String })
  yaml = '';

  /**
   * URL to fetch OWCS YAML from
   */
  @property({ type: String, attribute: 'yaml-url' })
  yamlUrl = '';

  /**
   * Parsed and validated OWCS specification
   */
  @state()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private spec: any = null;

  /**
   * Loading state
   */
  @state()
  private loading = false;

  /**
   * Error message
   */
  @state()
  private error = '';

  /**
   * Search query for filtering components
   */
  @state()
  private searchQuery = '';

  /**
   * Validator instance
   */
  private validator = new OWCSValidator();

  /**
   * Load and validate OWCS spec when properties change
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async updated(changedProperties: Map<string, any>) {
    if (changedProperties.has('yaml') || changedProperties.has('yamlUrl')) {
      await this.loadSpec();
    }
  }

  /**
   * Load and validate the OWCS specification
   */
  private async loadSpec() {
    this.loading = true;
    this.error = '';
    this.spec = null;

    try {
      let yamlContent = this.yaml;

      // Fetch from URL if provided
      if (this.yamlUrl && !yamlContent) {
        yamlContent = await fetchYamlFromUrl(this.yamlUrl);
      }

      if (!yamlContent) {
        throw new Error('No YAML content provided. Set either "yaml" property or "yaml-url" attribute.');
      }

      // Parse YAML
      const parsedSpec = await parseYaml(yamlContent);

      // Validate against OWCS schema
      await validateOwcsSpec(parsedSpec, this.validator);

      // Store validated spec
      this.spec = parsedSpec;
    } catch (err) {
      this.error = err instanceof Error ? err.message : String(err);
    } finally {
      this.loading = false;
    }
  }

  /**
   * Handle search input
   */
  private handleSearch(e: Event) {
    const input = e.target as HTMLInputElement;
    this.searchQuery = input.value;
  }

  /**
   * Render loading state
   */
  private renderLoading() {
    return html`
      <div class="loading">
        <div class="spinner"></div>
        <p>Loading OWCS specification...</p>
      </div>
    `;
  }

  /**
   * Render error state
   */
  private renderError() {
    return html`
      <div class="error">
        <p class="error-title">Error Loading OWCS Specification</p>
        <p class="error-message">${this.error}</p>
      </div>
    `;
  }

  /**
   * Render header section
   */
  private renderHeader() {
    const info = this.spec.info || {};
    const title = this.spec.title || info.title || 'OWCS Specification';
    const description = this.spec.description || info.description || '';
    const version = this.spec.owcs || '1.0.0';

    return html`
      <div class="header">
        <div class="header-content">
          <div class="title-section">
            <h1 class="title">
              ${title}
              <span class="version-badge">
                <span class="version-icon">v${version}</span>
              </span>
            </h1>
            ${description ? html`<p class="description">${description}</p>` : nothing}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render extensions section
   */
  private renderExtensions() {
    // Get all properties that start with 'x-' (extensions)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const extensions: Record<string, any> = {};
    for (const [key, value] of Object.entries(this.spec)) {
      if (key.startsWith('x-')) {
        extensions[key] = value;
      }
    }

    if (Object.keys(extensions).length === 0) {
      return nothing;
    }

    return html`
      <div class="extensions">
        <h2 class="extensions-title">Extensions</h2>
        <div class="extensions-list">
          ${Object.entries(extensions).map(
            ([key, value]) => html`
              <div class="extension-item">
                <span class="extension-key">${key}:</span>
                <span class="extension-value">${JSON.stringify(value)}</span>
              </div>
            `
          )}
        </div>
      </div>
    `;
  }

  /**
   * Render search bar
   */
  private renderSearchBar() {
    return html`
      <div class="search-bar">
        <input type="text" class="search-input" placeholder="Search components by tag name..." .value=${this.searchQuery} @input=${this.handleSearch} />
      </div>
    `;
  }

  /**
   * Generate TypeScript code for props
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private generatePropsCode(component: any): string {
    if (!component.props?.schema) {
      return '// No props defined';
    }

    try {
      const tsCode = generateComponentTypes(component.tagName, component.props.schema, {}, { includeOptional: true, includeComments: false, indent: 2 });
      return tsCode || '// No props defined';
    } catch {
      return '// Error generating TypeScript';
    }
  }

  /**
   * Generate TypeScript code for events
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private generateEventsCode(component: any): string {
    if (!component.events || Object.keys(component.events).length === 0) {
      return '// No events defined';
    }

    try {
      const lines: string[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const [eventName, eventDef] of Object.entries(component.events as Record<string, any>)) {
        const payloadType = eventDef.payloadSchema ? 'CustomEventPayload' : 'void';
        lines.push(`  ${eventName}: CustomEvent<${payloadType}>;`);
      }
      return `type ${this.toPascalCase(component.tagName)}Events = {\n${lines.join('\n')}\n};`;
    } catch {
      return '// Error generating TypeScript';
    }
  }

  /**
   * Highlight code with Highlight.js
   */
  private highlightCode(code: string, language: string = 'typescript'): string {
    try {
      return hljs.highlight(code, { language }).value;
    } catch {
      return code; // Fallback to plain text if highlighting fails
    }
  }

  /**
   * Convert to PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .split(/[-_]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  /**
   * Render component accordion item
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private renderComponent(key: string, component: any) {
    const tagName = component.tagName || key;
    const propsCode = this.generatePropsCode(component);
    const eventsCode = this.generateEventsCode(component);
    const highlightedPropsCode = this.highlightCode(propsCode);
    const highlightedEventsCode = this.highlightCode(eventsCode);

    return html`
      <details class="accordion-item">
        <summary class="accordion-header">
          <h3 class="accordion-title">&lt;${tagName}&gt;</h3>
          <svg class="accordion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </summary>
        <div class="accordion-content">
          ${component.props?.schema
            ? html`
                <div class="code-section">
                  <h4 class="code-label">Props</h4>
                  <div class="code-block">
                    <pre><code class="language-typescript">${unsafeHTML(highlightedPropsCode)}</code></pre>
                  </div>
                </div>
              `
            : nothing}
          ${component.events && Object.keys(component.events).length > 0
            ? html`
                <div class="code-section">
                  <h4 class="code-label">Events</h4>
                  <div class="code-block">
                    <pre><code class="language-typescript">${unsafeHTML(highlightedEventsCode)}</code></pre>
                  </div>
                </div>
              `
            : nothing}
        </div>
      </details>
    `;
  }

  /**
   * Render components list
   */
  private renderComponents() {
    const webComponents = this.spec.components?.webComponents || {};
    const filteredComponents = filterComponentsByTagName(webComponents, this.searchQuery);

    if (Object.keys(filteredComponents).length === 0) {
      return html`
        <div class="no-results">
          <p>No components found${this.searchQuery ? ` matching "${this.searchQuery}"` : ''}.</p>
        </div>
      `;
    }

    return html` <div class="components-list">${Object.entries(filteredComponents).map(([key, component]) => this.renderComponent(key, component))}</div> `;
  }

  /**
   * Render the component
   */
  render() {
    if (this.loading) {
      return this.renderLoading();
    }

    if (this.error) {
      return this.renderError();
    }

    if (!this.spec) {
      return html`
        <div class="no-results">
          <p>No OWCS specification loaded.</p>
        </div>
      `;
    }

    return html` <div class="container">${this.renderHeader()} ${this.renderExtensions()} ${this.renderSearchBar()} ${this.renderComponents()}</div> `;
  }
}

// Declare the custom element for TypeScript
declare global {
  interface HTMLElementTagNameMap {
    'owcs-viewer': OWCSViewer;
  }
}
