/**
 * OWCS Viewer Web Component
 * Displays OWCS (Open Web Component Specification) YAML in a user-friendly format
 */

import { LitElement, html, nothing } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { customElement, property, state } from 'lit/decorators.js';
import { OWCSValidator, generateComponentTypes } from '@owcs/api';
import { owcsViewerStyles } from './styles.js';
import { fetchYamlFromUrl, parseYaml, validateOwcsSpec, filterComponentsByTagName } from './utils.js';
import { webComponentIcon, componentToggleIcon, metadataToggleIcon, sectionToggleIcon } from './icons.js';
import hljs from 'highlight.js';

@customElement('owcs-viewer')
export class OWCSViewer extends LitElement {
  static styles = owcsViewerStyles;

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
   * Render runtime section
   */
  private renderRuntime() {
    const runtime = this.spec['x-owcs-runtime'];
    if (!runtime) {
      return nothing;
    }

    // Format bundler content as JSON if it exists
    const bundlerContent = runtime.bundler ? JSON.stringify(runtime.bundler, null, 2) : null;

    return html`
      <div class="extensions">
        <details class="metadata-card">
          <summary class="metadata-header">
            <h2 class="extensions-title">Runtime Configuration</h2>
            ${metadataToggleIcon}
          </summary>
          <div class="metadata-content">
            ${bundlerContent
              ? html`
                  <div class="code-block">
                    <pre><code class="language-json">${bundlerContent}</code></pre>
                  </div>
                `
              : html`<div class="empty-state">No runtime configuration</div>`}
          </div>
        </details>
      </div>
    `;
  }

  /**
   * Render metadata section (extensions)
   */
  private renderExtensions() {
    // Get all properties that start with 'x-' (extensions), excluding x-owcs-runtime
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const extensions: Record<string, any> = {};
    for (const [key, value] of Object.entries(this.spec)) {
      if (key.startsWith('x-') && key !== 'x-owcs-runtime') {
        extensions[key.slice(2)] = value;
      }
    }

    if (Object.keys(extensions).length === 0) {
      return nothing;
    }

    // Format extensions as JSON
    const metadataContent = JSON.stringify(extensions, null, 2);

    return html`
      <div class="extensions">
        <details class="metadata-card" open>
          <summary class="metadata-header">
            <h2 class="extensions-title">Metadata</h2>
            ${metadataToggleIcon}
          </summary>
          <div class="metadata-content">
            <div class="code-block">
              <pre><code class="language-json">${metadataContent}</code></pre>
            </div>
          </div>
        </details>
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
   * Render components section with search bar and components list
   */
  private renderComponentsSection() {
    return html`
      <div class="extensions">
        <details class="metadata-card" open>
          <summary class="metadata-header">
            <h2 class="extensions-title">Components</h2>
            ${metadataToggleIcon}
          </summary>
          <div class="components-section-content">${this.renderSearchBar()} ${this.renderComponents()}</div>
        </details>
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
   * Get exposed module name for a component based on tag name
   * Returns the full module name (e.g., './user-card') if found, or null
   */
  private getExposedModuleForComponent(tagName: string): string | null {
    const runtime = this.spec?.['x-owcs-runtime'];
    if (!runtime?.bundler?.moduleFederation?.exposes) {
      return null;
    }

    const exposes = runtime.bundler.moduleFederation.exposes;
    const tagNameLower = tagName.toLowerCase();

    // Check each exposed module
    for (const [moduleName, _path] of Object.entries(exposes)) {
      // Strip the './' prefix and convert to lowercase
      const strippedModule = moduleName.replace(/^\.\//, '').toLowerCase();
      // Check if the stripped module name is a substring of the tag name (case-insensitive)
      if (tagNameLower.includes(strippedModule)) {
        return moduleName; // Return the original module name with './' prefix
      }
    }

    return null;
  }

  /**
   * Render component card item
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private renderComponent(key: string, component: any) {
    const tagName = component.tagName || key;
    const hasProps = component.props?.schema;
    const hasEvents = component.events && Object.keys(component.events).length > 0;

    const propsCode = hasProps ? this.generatePropsCode(component) : '';
    const eventsCode = hasEvents ? this.generateEventsCode(component) : '';

    const highlightedPropsCode = hasProps ? this.highlightCode(propsCode) : '';
    const highlightedEventsCode = hasEvents ? this.highlightCode(eventsCode) : '';

    // Check if runtime configuration exists and get exposure status
    const runtime = this.spec?.['x-owcs-runtime'];
    const hasRuntime = runtime?.bundler?.moduleFederation?.exposes;
    const exposedModule = hasRuntime ? this.getExposedModuleForComponent(tagName) : null;

    return html`
      <details class="component-card">
        <summary class="component-header${hasRuntime ? (exposedModule ? ' exposed' : ' not-exposed') : ''}">
          ${webComponentIcon}
          <h3 class="component-tag">&lt;${tagName}&gt;</h3>
          ${componentToggleIcon}
        </summary>
        <div class="component-body">
          ${hasRuntime && exposedModule
            ? html`
                <div class="exposure-status">
                  <div class="exposure-badge">
                    <span class="exposure-text"><b>ModuleName:</b> ${exposedModule}</span>
                  </div>
                </div>
              `
            : nothing}
          <details class="section-item" open>
            <summary class="section-header">
              <h4 class="section-title">Props</h4>
              ${sectionToggleIcon}
            </summary>
            <div class="section-content">
              ${hasProps
                ? html`
                    <div class="code-block">
                      <pre><code class="language-typescript">${unsafeHTML(highlightedPropsCode)}</code></pre>
                    </div>
                  `
                : html`<div class="empty-state">No props defined</div>`}
            </div>
          </details>
          <details class="section-item" open>
            <summary class="section-header">
              <h4 class="section-title">Events</h4>
              ${sectionToggleIcon}
            </summary>
            <div class="section-content">
              ${hasEvents
                ? html`
                    <div class="code-block">
                      <pre><code class="language-typescript">${unsafeHTML(highlightedEventsCode)}</code></pre>
                    </div>
                  `
                : html`<div class="empty-state">No events defined</div>`}
            </div>
          </details>
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

    return html` <div class="container">${this.renderHeader()} ${this.renderExtensions()} ${this.renderRuntime()} ${this.renderComponentsSection()}</div> `;
  }
}

// Declare the custom element for TypeScript
declare global {
  interface HTMLElementTagNameMap {
    'owcs-viewer': OWCSViewer;
  }
}
