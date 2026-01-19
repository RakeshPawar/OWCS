import { Component, Input, Output, EventEmitter, input, output } from '@angular/core';

/**
 * Comprehensive example demonstrating all supported patterns for props and events
 * in Angular components
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Theme options
 */
export type Theme = 'light' | 'dark' | 'auto';

/**
 * Status enum
 */
export type Status = 'idle' | 'loading' | 'success' | 'error';

/**
 * Complex nested configuration
 */
export interface Configuration {
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
export interface User {
  id: number;
  name: string;
  email: string;
  roles: string[];
}

/**
 * Action event payload
 */
export interface ActionPayload {
  action: string;
  payload?: any;
  timestamp: number;
}

/**
 * Data load event payload
 */
export interface DataLoadPayload {
  data: any[];
  count: number;
}

/**
 * Status change event payload
 */
export interface StatusChangePayload {
  oldStatus: Status;
  newStatus: Status;
}

/**
 * Error event payload
 */
export interface ErrorPayload {
  message: string;
  stack?: string;
}

/**
 * Click event payload
 */
export interface ClickPayload {
  x: number;
  y: number;
}

/**
 * Change event payload
 */
export interface ChangePayload {
  value: string;
}

/**
 * Submit event payload
 */
export interface SubmitPayload {
  data: User;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Comprehensive Example Component
 *
 * Demonstrates all supported patterns for defining props and events
 * in Angular web components.
 *
 * @component
 * @selector app-comprehensive-example
 */
@Component({
  selector: 'app-comprehensive-example',
  standalone: true,
  template: `
    <div class="comprehensive-example">
      <h2>Comprehensive Example</h2>
      <p>User: {{ userName }}</p>
      <p>Theme: {{ theme }}</p>
      <p>Status: {{ status }}</p>
      <p>Active: {{ isActive ? 'Yes' : 'No' }}</p>

      @if (signalName()) {
        <p>Signal Name: {{ signalName() }}</p>
      }

      @if (user) {
        <div>
          <h3>User Info</h3>
          <p>ID: {{ user.id }}</p>
          <p>Name: {{ user.name }}</p>
          <p>Email: {{ user.email }}</p>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .comprehensive-example {
        padding: 1rem;
        border: 1px solid #ccc;
        border-radius: 4px;
      }
    `,
  ],
})
export class ComprehensiveExampleComponent {
  // ========== @Input DECORATORS (Traditional Pattern) ==========

  /**
   * User's display name
   * @property {string} userName - The name to display
   * @default 'Guest'
   */
  @Input() userName: string = 'Guest';

  /**
   * User's age (must be between 1-120)
   * @property {number} age
   */
  @Input() age?: number;

  /**
   * Whether the component is in active state
   * @property {boolean} isActive
   * @default false
   */
  @Input() isActive: boolean = false;

  /**
   * Visual theme
   * @property {Theme} theme
   * @default 'light'
   */
  @Input() theme: Theme = 'light';

  /**
   * Current status
   */
  @Input() status: Status = 'idle';

  /**
   * Configuration object
   * @property {Configuration} config
   */
  @Input() config?: Configuration;

  /**
   * Current user data
   */
  @Input() user?: User;

  /**
   * List of tag names
   * @property {string[]} tags
   * @default []
   */
  @Input() tags: string[] = [];

  /**
   * Array of user objects
   */
  @Input() users?: User[];

  // ========== @Input WITH ATTRIBUTE ALIAS ==========

  /**
   * Email address with custom attribute name
   * @property {string} emailAddress
   * @attribute data-email
   */
  @Input('data-email') emailAddress?: string;

  /**
   * User ID with custom attribute
   * @attribute user-id
   */
  @Input('user-id') userId?: number;

  // ========== ADVANCED TYPESCRIPT TYPES ==========

  /**
   * Union type with null
   */
  @Input() nullableValue?: string | null;

  /**
   * Multiple union types
   */
  @Input() mixedUnion?: string | number | boolean;

  /**
   * Array or single item
   */
  @Input() flexible?: string | string[];

  /**
   * Record type
   */
  @Input() metadata?: Record<string, any>;

  /**
   * Optional deep nested object
   */
  @Input() settings?: {
    display?: {
      showHeader?: boolean;
      showFooter?: boolean;
    };
    behavior?: {
      autoSave?: boolean;
      interval?: number;
    };
  };

  // ========== input() SIGNAL-BASED INPUTS (Angular 17+) ==========

  /**
   * Required signal-based name input
   * @property {string} signalName - Name using signal API
   */
  signalName = input.required<string>();

  /**
   * Optional signal-based counter
   * @property {number} counter
   * @default 0
   */
  counter = input<number>(0);

  /**
   * Signal with alias
   * @property {boolean} enabledFlag
   * @attribute data-enabled
   */
  enabledFlag = input<boolean>(false, { alias: 'data-enabled' });

  /**
   * Signal with transform function
   */
  priority = input<number, string | number>(0, {
    transform: (value: string | number) => (typeof value === 'string' ? parseInt(value, 10) : value),
  });

  // ========== @Output DECORATORS (Traditional Pattern) ==========

  /**
   * Fired when user performs an action
   * @event userAction
   * @type {EventEmitter<ActionPayload>}
   */
  @Output() userAction = new EventEmitter<ActionPayload>();

  /**
   * Fired when data is loaded
   * @event dataLoad
   * @type {EventEmitter<DataLoadPayload>}
   */
  @Output() dataLoad = new EventEmitter<DataLoadPayload>();

  /**
   * Fired when status changes
   * @event statusChange
   */
  @Output() statusChange = new EventEmitter<StatusChangePayload>();

  /**
   * Fired when an error occurs
   * @event error
   */
  @Output() error = new EventEmitter<ErrorPayload>();

  /**
   * Fired when user clicks
   * @event click
   */
  @Output() click = new EventEmitter<ClickPayload>();

  /**
   * Fired when data changes
   * @event change
   */
  @Output() change = new EventEmitter<ChangePayload>();

  /**
   * Fired when user hovers
   * @event hover
   */
  @Output() hover = new EventEmitter<void>();

  /**
   * Fired when form is submitted
   * @event submit
   */
  @Output() submit = new EventEmitter<SubmitPayload>();

  // ========== @Output WITH ALIAS ==========

  /**
   * User updated event with custom name
   * @event user-updated
   * @attribute user-updated
   */
  @Output('user-updated') userUpdated = new EventEmitter<User>();

  /**
   * Item selected event with alias
   * @attribute item-select
   */
  @Output('item-select') itemSelected = new EventEmitter<{ id: number }>();

  // ========== output() SIGNAL-BASED OUTPUTS (Angular 17+) ==========

  /**
   * Signal-based output for notifications
   * @event notify
   */
  notify = output<{ message: string; type: 'info' | 'warning' | 'error' }>();

  /**
   * Signal-based output with alias
   * @event data-ready
   * @attribute data-ready
   */
  dataReady = output<{ ready: boolean }>({ alias: 'data-ready' });

  /**
   * Signal-based simple output
   */
  completed = output<void>();

  // ========== PUBLIC METHODS THAT DISPATCH EVENTS ==========

  /**
   * Dispatch user action event using EventEmitter
   * @param {string} action - The action performed
   * @param {any} payload - Additional data
   */
  dispatchUserAction(action: string, payload?: any): void {
    this.userAction.emit({
      action,
      payload,
      timestamp: Date.now(),
    });
  }

  /**
   * Dispatch data load event
   */
  dispatchDataLoad(data: any[]): void {
    this.dataLoad.emit({
      data,
      count: data.length,
    });
  }

  /**
   * Dispatch status change event
   */
  dispatchStatusChange(oldStatus: Status, newStatus: Status): void {
    this.statusChange.emit({ oldStatus, newStatus });
  }

  /**
   * Dispatch error event
   */
  dispatchError(error: Error): void {
    this.error.emit({
      message: error.message,
      stack: error.stack,
    });
  }

  /**
   * Handle click event
   */
  handleClick(x: number, y: number): void {
    this.click.emit({ x, y });
  }

  /**
   * Handle change event
   */
  handleChange(value: string): void {
    this.change.emit({ value });
  }

  /**
   * Handle hover event
   */
  handleHover(): void {
    this.hover.emit();
  }

  /**
   * Handle submit event
   */
  handleSubmit(data: User): void {
    this.submit.emit({ data });
  }

  /**
   * Emit signal-based notification
   */
  sendNotification(message: string, type: 'info' | 'warning' | 'error'): void {
    this.notify.emit({ message, type });
  }

  /**
   * Emit data ready signal
   */
  markDataReady(): void {
    this.dataReady.emit({ ready: true });
  }

  /**
   * Emit completion signal
   */
  markCompleted(): void {
    this.completed.emit();
  }

  // ========== NATIVE CUSTOMEVENT DISPATCH PATTERN ==========

  /**
   * Dispatch native CustomEvent for custom-action
   * This pattern directly uses browser's CustomEvent API
   *
   * @fires custom-action
   */
  dispatchCustomAction(actionType: string): void {
    const event = new CustomEvent<{ actionType: string; timestamp: number }>('custom-action', {
      detail: {
        actionType,
        timestamp: Date.now(),
      },
      bubbles: true,
      composed: true,
    });

    // In a real component, this would be dispatched on the host element
    // For demonstration purposes only
    if (typeof window !== 'undefined') {
      window.dispatchEvent(event);
    }
  }

  /**
   * Dispatch native CustomEvent for validation
   *
   * @fires validation
   */
  dispatchValidation(isValid: boolean, errors?: string[]): void {
    const event = new CustomEvent('validation', {
      detail: {
        isValid,
        errors: errors || [],
      },
      bubbles: true,
      composed: true,
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(event);
    }
  }

  /**
   * Dispatch simple native CustomEvent without payload
   *
   * @fires ready
   */
  dispatchReady(): void {
    const event = new CustomEvent('ready', {
      bubbles: true,
      composed: true,
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(event);
    }
  }

  // ========== LIFECYCLE HOOK ==========

  ngOnInit(): void {
    // Initialization logic
    console.log('Component initialized');
  }

  ngOnChanges(): void {
    // React to input changes
    console.log('Inputs changed');
  }
}
