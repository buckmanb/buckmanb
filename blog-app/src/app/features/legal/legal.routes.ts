// src/app/features/legal/legal.routes.ts
// This file defines routes for legal pages like privacy policy, terms of service, etc.
import { Routes } from '@angular/router';
import { PrivacyPolicyComponent } from './privacy-policy.component';

export const LEGAL_ROUTES: Routes = [
  {
    path: 'privacy-policy',
    component: PrivacyPolicyComponent
  }
];