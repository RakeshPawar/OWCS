import { createRoot, Root } from 'react-dom/client';

/**
 * Comprehensive example demonstrating all supported patterns for props and events
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Theme options for the component
 */
type Theme = 'light' | 'dark' | 'auto';

/**
 * Status enum
 */
type Status = 'idle' | 'loading' | 'success' | 'error';

/**
 * Complex nested configuration object
 */
interface Configuration {
  /** API endpoint URL */
  endpoint: string;
  /** Request timeout in milliseconds */
  timeout: number;
  /** Enable retry logic */
  retry?: boolean;
  /** Additional headers */
  headers?: Record<string, string>;
}

/**
 * User data structure
 */
interface User {
  id: number;
  name: string;
  email: string;
  roles: string[];
}

/**
 * Props interface demonstrating various TypeScript patterns
 */
export interface ComprehensiveExampleProps {
  // ========== BASIC TYPES ==========

  /**
   * User's display name
   * @property {string} userName - The name to display
   * @default 'Guest'
   */
  userName?: string;

  /**
   * Whether the component is in active state
   * @property {boolean} isActive
   * @default false
   */
  isActive?: boolean;

  // ========== ENUMS & UNIONS ==========

  /**
   * Visual theme
   * @property {Theme} theme
   * @default 'light'
   */
  theme?: Theme;

  /**
   * Current status
   */
  status?: Status;

  // ========== COMPLEX OBJECTS ==========

  /**
   * Configuration object
   * @property {Configuration} config
   */
  config?: Configuration;

  /**
   * Current user data
   */
  user?: User;

  // ========== FUNCTIONS (CALLBACK PROPS) ==========

  /**
   * Fired when user hovers over the component
   * @event hover
   */
  onHover?: () => void;

  // ========== ADVANCED TYPESCRIPT ==========

  /**
   * Optional deep nested object demonstrating complex TypeScript types
   */
  settings?: {
    display?: {
      showHeader?: boolean;
      showFooter?: boolean;
    };
    behavior?: {
      autoSave?: boolean;
      interval?: number;
    };
  };
}

// ============================================================================
// WEB COMPONENT CLASS
// ============================================================================

/**
 * Comprehensive Example Web Component
 *
 * Demonstrates all supported patterns for defining custom elements,
 * props, and events in React-based web components.
 *
 * @customElement comprehensive-example-element
 *
 * @fires userAction - Dispatched when user performs an action
 * @fires dataLoad - Dispatched when data is loaded
 * @fires error - Dispatched when an error occurs
 * @fires hover - Dispatched when user hovers (also demonstrates callback prop pattern)
 */
export class ComprehensiveExampleElement extends HTMLElement implements ComprehensiveExampleProps {
  // ========== PRIVATE FIELDS ==========
  private reactRoot?: Root;

  // ========== PROP STORAGE WITH DEFAULTS ==========
  private _userName: string = 'Guest';
  private _isActive: boolean = false;
  private _theme: Theme = 'light';
  private _status: Status = 'idle';
  private _config?: Configuration;
  private _user?: User;
  private _settings?: ComprehensiveExampleProps['settings'];

  // ========== CALLBACK HANDLERS ==========
  private _onHover?: () => void;

  // ========== STATIC OBSERVED ATTRIBUTES ==========
  static get observedAttributes() {
    return ['user-name', 'is-active', 'theme', 'status'];
  }

  // ========== CONSTRUCTOR ==========
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  // ========== PROP GETTERS/SETTERS ==========

  /**
   * User name property
   * @property {string} userName
   * @attribute user-name
   * @default 'Guest'
   */
  get userName(): string {
    return this._userName;
  }

  set userName(value: string) {
    this._userName = value;
    this.setAttribute('user-name', value);
    this.render();
  }

  /**
   * Active state property
   * @property {boolean} isActive
   * @attribute is-active
   * @default false
   */
  get isActive(): boolean {
    return this._isActive;
  }

  set isActive(value: boolean) {
    this._isActive = value;
    if (value) {
      this.setAttribute('is-active', '');
    } else {
      this.removeAttribute('is-active');
    }
    this.render();
  }

  /**
   * Theme property
   * @property {Theme} theme
   * @attribute theme
   * @default 'light'
   */
  get theme(): Theme {
    return this._theme;
  }

  set theme(value: Theme) {
    this._theme = value;
    this.setAttribute('theme', value);
    this.render();
  }

  /**
   * Status property
   */
  get status(): Status {
    return this._status;
  }

  set status(value: Status) {
    this._status = value;
    this.setAttribute('status', value);
    this.render();
  }

  /**
   * Configuration property
   */
  get config(): Configuration | undefined {
    return this._config;
  }

  set config(value: Configuration | undefined) {
    this._config = value;
    this.render();
  }

  /**
   * User property
   */
  get user(): User | undefined {
    return this._user;
  }

  set user(value: User | undefined) {
    this._user = value;
    this.render();
  }

  // Advanced TypeScript getters/setters
  get settings() {
    return this._settings;
  }
  set settings(value: ComprehensiveExampleProps['settings']) {
    this._settings = value;
    this.render();
  }

  // Callback prop getters/setters
  get onHover() {
    return this._onHover;
  }
  set onHover(handler: (() => void) | undefined) {
    this._onHover = handler;
  }

  // ========== LIFECYCLE METHODS ==========

  connectedCallback() {
    const reactRootElement = document.createElement('div');
    this.reactRoot = createRoot(reactRootElement);
    this.shadowRoot!.appendChild(reactRootElement);
    this.render();
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return;

    switch (name) {
      case 'user-name':
        this._userName = newValue || 'Guest';
        break;
      case 'is-active':
        this._isActive = newValue !== null;
        break;
      case 'theme':
        this._theme = (newValue as Theme) || 'light';
        break;
      case 'status':
        this._status = (newValue as Status) || 'idle';
        break;
    }
    this.render();
  }

  disconnectedCallback() {
    this.reactRoot?.unmount();
    this.reactRoot = undefined;
  }

  // ========== EVENT DISPATCHERS ==========

  /**
   * Dispatch user action event
   * @fires userAction
   * @param {string} action - The action performed
   * @param {any} payload - Additional data
   */
  dispatchUserAction(action: string, payload?: any) {
    this.dispatchEvent(
      new CustomEvent('userAction', {
        detail: { action, payload, timestamp: Date.now() },
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Dispatch data load event
   * @fires dataLoad
   */
  dispatchDataLoad(data: any[]) {
    this.dispatchEvent(
      new CustomEvent('dataLoad', {
        detail: { data, count: data.length },
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Dispatch error event
   * @fires error
   */
  dispatchError(error: Error) {
    this.dispatchEvent(
      new CustomEvent('error', {
        detail: { message: error.message, stack: error.stack },
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Handle hover with callback (demonstrates dual pattern: callback + CustomEvent)
   */
  handleHover() {
    if (this._onHover) {
      this._onHover();
    }

    this.dispatchEvent(new CustomEvent('hover', { bubbles: true, composed: true }));
  }

  // ========== PRIVATE RENDER METHOD ==========

  private render() {
    if (!this.isConnected || !this.reactRoot) return;

    // Render a simple div with the component state
    this.reactRoot.render(
      <div>
        <h2>Comprehensive Example</h2>
        <p>User: {this._userName}</p>
        <p>Theme: {this._theme}</p>
        <p>Status: {this._status}</p>
        <p>Active: {this._isActive ? 'Yes' : 'No'}</p>
      </div>
    );
  }
}

// ============================================================================
// CUSTOM ELEMENT REGISTRATION
// ============================================================================

if (!customElements.get('comprehensive-example-element')) {
  customElements.define('comprehensive-example-element', ComprehensiveExampleElement);
}
