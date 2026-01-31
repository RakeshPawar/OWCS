import { Component, Input, Output, EventEmitter, input, output } from '@angular/core';
import { ActionPayload, Configuration, DataLoadPayload, ErrorPayload, Status, Theme, User } from './comprehensive-example.types';

/**
 * Comprehensive example demonstrating all supported patterns for props and events
 * in Angular components
 */

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
  template: `<div>test</div> `,
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

  // ========== @Input WITH ATTRIBUTE ALIAS ==========

  /**
   * Email address with custom attribute name
   * @property {string} emailAddress
   * @attribute data-email
   */
  @Input('data-email') emailAddress?: string;

  // ========== ADVANCED TYPESCRIPT TYPES ==========

  /**
   * Optional deep nested object demonstrating complex TypeScript types
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
   * Fired when an error occurs
   * @event error
   */
  @Output() error = new EventEmitter<ErrorPayload>();

  /**
   * Fired when user hovers (demonstrates void event)
   * @event hover
   */
  @Output() hover = new EventEmitter<void>();

  // ========== @Output WITH ALIAS ==========

  /**
   * User updated event with custom name
   * @event user-updated
   * @attribute user-updated
   */
  @Output('user-updated') userUpdated = new EventEmitter<User>();

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
   * Dispatch error event
   */
  dispatchError(error: Error): void {
    this.error.emit({
      message: error.message,
      stack: error.stack,
    });
  }

  /**
   * Handle hover event (demonstrates void event)
   */
  handleHover(): void {
    this.hover.emit();
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
