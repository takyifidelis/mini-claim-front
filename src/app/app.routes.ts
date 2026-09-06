import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';

export const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    children: [
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
];
