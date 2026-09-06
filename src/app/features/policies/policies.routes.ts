import { Routes } from '@angular/router';

export const POLICIES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/policy-list/policy-list.component').then((m) => m.PolicyListComponent),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./components/policy-form/policy-form.component').then((m) => m.PolicyFormComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/policy-detail/policy-detail.component').then(
        (m) => m.PolicyDetailComponent,
      ),
  },
];
