import { Component, Input, Output, EventEmitter, Injector } from '@angular/core';

/**
 * Example Angular component that will be analyzed by OWCS
 */
@Component({
  selector: 'app-user-card',
  template: `
    <div class="user-card">
      <h2>{{ name }}</h2>
      <p>Age: {{ age }}</p>
      <button (click)="handleClick()">Click Me</button>
    </div>
  `,
  styles: [`
    .user-card {
      border: 1px solid #ccc;
      padding: 16px;
      border-radius: 8px;
    }
  `]
})
export class UserCardComponent {
  /**
   * User's name (required)
   */
  @Input() name!: string;
  
  /**
   * User's age (optional)
   */
  @Input() age?: number;
  
  /**
   * User's email with attribute alias
   */
  @Input('data-email') email?: string;
  
  /**
   * Configuration object
   */
  @Input() config?: {
    theme: 'light' | 'dark';
    showAvatar: boolean;
  };
  
  /**
   * Click event emitter
   */
  @Output() clicked = new EventEmitter<{ timestamp: number }>();
  
  /**
   * User updated event with custom event
   */
  @Output() userUpdated = new EventEmitter<{
    name: string;
    age: number;
  }>();
  
  handleClick(): void {
    // Emit using Angular EventEmitter
    this.clicked.emit({ timestamp: Date.now() });
    
    // Also emit using native CustomEvent
    this.dispatchEvent(
      new CustomEvent<{ timestamp: number }>('clicked', {
        detail: { timestamp: Date.now() },
        bubbles: true,
        composed: true,
      })
    );
  }
  
  updateUser(name: string, age: number): void {
    this.userUpdated.emit({ name, age });
  }
  
  private dispatchEvent(event: Event): void {
    // Helper method to dispatch events
    if (typeof window !== 'undefined') {
      window.dispatchEvent(event);
    }
  }
}

export function registerUserCard(injector: Injector) {
  
  if (!customElements.get('user-card')) {
    // FIX: Ensure no trailing spaces in tag name
    customElements.define('user-card', UserCardComponent);
  }
}