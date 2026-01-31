import { Component, Input, Output, EventEmitter, input, output } from '@angular/core';
import { UserCardDto } from './user-card.types';

/**
 * Example Angular component that will be analyzed by OWCS
 */
@Component({
  selector: 'app-user-card',
  template: ` <div class="user-card">test</div> `,
})
export class UserCardComponent {
  data = input.required<UserCardDto>();

  /**
   * Click event emitter
   */
  clicked = output<{ timestamp: number }>();

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
