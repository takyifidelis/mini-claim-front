import { Routes } from '@angular/router';

export const RISK_COVERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/risk-cover-list/risk-cover-list.component').then(
        (m) => m.RiskCoverListComponent,
      ),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./components/risk-cover-form/risk-cover-form.component').then(
        (m) => m.RiskCoverFormComponent,
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/risk-cover-detail/risk-cover-detail.component').then(
        (m) => m.RiskCoverDetailComponent,
      ),
  },
];
