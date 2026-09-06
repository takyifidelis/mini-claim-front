import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';

export const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    children: [
      {
        path: '',
        redirectTo: 'claims',
        pathMatch: 'full',
      },
      {
        path: 'claims',
        loadChildren: () =>
          import('./features/claims/claims.routes').then((m) => m.CLAIMS_ROUTES),
      },
      {
        path: 'policies',
        loadChildren: () =>
          import('./features/policies/policies.routes').then((m) => m.POLICIES_ROUTES),
      },
      {
        path: 'risk-covers',
        loadChildren: () =>
          import('./features/risk-covers/risk-covers.routes').then(
            (m) => m.RISK_COVERS_ROUTES,
          ),
      },
      {
        path: 'exchange-rates',
        loadChildren: () =>
          import('./features/exchange-rates/exchange-rates.routes').then(
            (m) => m.EXCHANGE_RATES_ROUTES,
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'claims',
  },
];
