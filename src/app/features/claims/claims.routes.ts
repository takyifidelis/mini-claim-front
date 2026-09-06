import { Routes } from '@angular/router';

export const CLAIMS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/claim-list/claim-list.component').then(
        (m) => m.ClaimListComponent,
      ),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./components/claim-form/claim-form.component').then(
        (m) => m.ClaimFormComponent,
      ),
  },
];
