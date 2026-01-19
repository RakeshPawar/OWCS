import { createRoot, Root } from 'react-dom/client';
import PropTypes from 'prop-types';

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
   * User's age (must be between 1-120)
   * @property {number} age
   */
  age?: number;

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

  // ========== ARRAYS ==========

  /**
   * List of tag names
   * @property {string[]} tags
   * @default []
   */
  tags?: string[];

  /**
   * Array of user objects
   */
  users?: User[];

  // ========== FUNCTIONS (CALLBACK PROPS) ==========

  /**
   * Fired when user clicks the component
   * @event click
   * @type {CustomEvent<{x: number, y: number}>}
   */
  onClick?: (x: number, y: number) => void;

  /**
   * Fired when data changes
   * @event change
   * @type {CustomEvent<{value: string}>}
   */
  onChange?: (value: string) => void;

  /**
   * Fired when user hovers over the component
   * @event hover
   */
  onHover?: () => void;

  /**
   * Fired when user submits the form
   * @fires submit
   * @type {CustomEvent<{data: User}>}
   */
  onSubmit?: (data: User) => void;

  // ========== ADVANCED TYPESCRIPT ==========

  /**
   * Union type with null
   */
  nullableValue?: string | null;

  /**
   * Multiple union types
   */
  mixedUnion?: string | number | boolean;

  /**
   * Array or single item
   */
  flexible?: string | string[];

  /**
   * Record type
   */
  metadata?: Record<string, any>;

  /**
   * Optional deep nested object
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
 * @fires statusChange - Dispatched when status changes
 * @fires error - Dispatched when an error occurs
 */
export class ComprehensiveExampleElement extends HTMLElement implements ComprehensiveExampleProps {
  // ========== PRIVATE FIELDS ==========
  private reactRoot?: Root;

  // ========== PROP STORAGE WITH DEFAULTS ==========
  private _userName: string = 'Guest';
  private _age?: number;
  private _isActive: boolean = false;
  private _theme: Theme = 'light';
  private _status: Status = 'idle';
  private _config?: Configuration;
  private _user?: User;
  private _tags: string[] = [];
  private _users?: User[];
  private _nullableValue?: string | null;
  private _mixedUnion?: string | number | boolean;
  private _flexible?: string | string[];
  private _metadata?: Record<string, any>;
  private _settings?: ComprehensiveExampleProps['settings'];

  // ========== CALLBACK HANDLERS ==========
  private _onClick?: (x: number, y: number) => void;
  private _onChange?: (value: string) => void;
  private _onHover?: () => void;
  private _onSubmit?: (data: User) => void;

  // ========== STATIC OBSERVED ATTRIBUTES ==========
  static get observedAttributes() {
    return ['user-name', 'age', 'is-active', 'theme', 'status'];
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
   * Age property
   * @property {number} age
   * @attribute age
   */
  get age(): number | undefined {
    return this._age;
  }

  set age(value: number | undefined) {
    this._age = value;
    if (value !== undefined) {
      this.setAttribute('age', String(value));
    } else {
      this.removeAttribute('age');
    }
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

  /**
   * Tags property
   * @default []
   */
  get tags(): string[] {
    return this._tags;
  }

  set tags(value: string[]) {
    this._tags = value;
    this.render();
  }

  /**
   * Users array property
   */
  get users(): User[] | undefined {
    return this._users;
  }

  set users(value: User[] | undefined) {
    this._users = value;
    this.render();
  }

  // Advanced TypeScript getters/setters
  get nullableValue() {
    return this._nullableValue;
  }
  set nullableValue(value: string | null | undefined) {
    this._nullableValue = value;
    this.render();
  }

  get mixedUnion() {
    return this._mixedUnion;
  }
  set mixedUnion(value: string | number | boolean | undefined) {
    this._mixedUnion = value;
    this.render();
  }

  get flexible() {
    return this._flexible;
  }
  set flexible(value: string | string[] | undefined) {
    this._flexible = value;
    this.render();
  }

  get metadata() {
    return this._metadata;
  }
  set metadata(value: Record<string, any> | undefined) {
    this._metadata = value;
    this.render();
  }

  get settings() {
    return this._settings;
  }
  set settings(value: ComprehensiveExampleProps['settings']) {
    this._settings = value;
    this.render();
  }

  // Callback prop getters/setters
  get onClick() {
    return this._onClick;
  }
  set onClick(handler: ((x: number, y: number) => void) | undefined) {
    this._onClick = handler;
  }

  get onChange() {
    return this._onChange;
  }
  set onChange(handler: ((value: string) => void) | undefined) {
    this._onChange = handler;
  }

  get onHover() {
    return this._onHover;
  }
  set onHover(handler: (() => void) | undefined) {
    this._onHover = handler;
  }

  get onSubmit() {
    return this._onSubmit;
  }
  set onSubmit(handler: ((data: User) => void) | undefined) {
    this._onSubmit = handler;
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
      case 'age':
        this._age = newValue ? parseInt(newValue, 10) : undefined;
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
   * Dispatch status change event
   * @fires statusChange
   */
  dispatchStatusChange(oldStatus: Status, newStatus: Status) {
    this.dispatchEvent(
      new CustomEvent<{ oldStatus: Status; newStatus: Status }>('statusChange', {
        detail: { oldStatus, newStatus },
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
   * Handle click with callback
   */
  handleClick(x: number, y: number) {
    // Call callback prop if provided
    if (this._onClick) {
      this._onClick(x, y);
    }

    // Also dispatch CustomEvent
    this.dispatchEvent(
      new CustomEvent('click', {
        detail: { x, y },
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Handle change with callback
   */
  handleChange(value: string) {
    if (this._onChange) {
      this._onChange(value);
    }

    this.dispatchEvent(
      new CustomEvent('change', {
        detail: { value },
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Handle hover with callback
   */
  handleHover() {
    if (this._onHover) {
      this._onHover();
    }

    this.dispatchEvent(new CustomEvent('hover', { bubbles: true, composed: true }));
  }

  /**
   * Handle submit with callback
   */
  handleSubmit(data: User) {
    if (this._onSubmit) {
      this._onSubmit(data);
    }

    this.dispatchEvent(
      new CustomEvent('submit', {
        detail: { data },
        bubbles: true,
        composed: true,
      })
    );
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
// PROPTYPES DEFINITION (Legacy React Pattern)
// ============================================================================

ComprehensiveExampleElement.propTypes = {
  userName: PropTypes.string,
  age: PropTypes.number,
  isActive: PropTypes.bool,
  theme: PropTypes.oneOf(['light', 'dark', 'auto']),
  status: PropTypes.oneOf(['idle', 'loading', 'success', 'error']),
  config: PropTypes.shape({
    endpoint: PropTypes.string.isRequired,
    timeout: PropTypes.number.isRequired,
    retry: PropTypes.bool,
    headers: PropTypes.objectOf(PropTypes.string),
  }),
  user: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    roles: PropTypes.arrayOf(PropTypes.string).isRequired,
  }),
  tags: PropTypes.arrayOf(PropTypes.string),
  users: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      email: PropTypes.string.isRequired,
      roles: PropTypes.arrayOf(PropTypes.string).isRequired,
    })
  ),
  onClick: PropTypes.func,
  onChange: PropTypes.func,
  onHover: PropTypes.func,
  onSubmit: PropTypes.func,
  nullableValue: PropTypes.string,
  mixedUnion: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool]),
  flexible: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
  metadata: PropTypes.object,
  settings: PropTypes.shape({
    display: PropTypes.shape({
      showHeader: PropTypes.bool,
      showFooter: PropTypes.bool,
    }),
    behavior: PropTypes.shape({
      autoSave: PropTypes.bool,
      interval: PropTypes.number,
    }),
  }),
} as any;

// ============================================================================
// CUSTOM ELEMENT REGISTRATION
// ============================================================================

if (!customElements.get('comprehensive-example-element')) {
  customElements.define('comprehensive-example-element', ComprehensiveExampleElement);
}
