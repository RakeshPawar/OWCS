import { UserCardComponent } from "./user-card.component";
import { createCustomElement } from '@angular/elements';
import { Injector } from '@angular/core';

export function registerUserCard(injector: Injector) {
  
  if (!customElements.get('user-card')) {
    // FIX: Pass the real injector provided by the app
    const ce = createCustomElement(UserCardComponent, { injector });
    
    // FIX: Ensure no trailing spaces in tag name
    customElements.define('user-card', ce);
  }
}