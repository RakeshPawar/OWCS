import { Injector } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { ComprehensiveExampleComponent } from './comprehensive-example.component';

/**
 * Web Component wrapper for Comprehensive Example
 *
 * This file demonstrates the registration pattern for Angular Elements
 */

export function registerComprehensiveExample(injector: Injector): void {
  const comprehensiveElement = createCustomElement(ComprehensiveExampleComponent, { injector });

  if (!customElements.get('comprehensive-example-angular')) {
    customElements.define('comprehensive-example-angular', comprehensiveElement);
  }
}
