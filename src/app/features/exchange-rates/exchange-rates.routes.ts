import { Routes } from '@angular/router';

export const EXCHANGE_RATES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/exchange-rate-list/exchange-rate-list.component').then(
        (m) => m.ExchangeRateListComponent,
      ),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./components/exchange-rate-form/exchange-rate-form.component').then(
        (m) => m.ExchangeRateFormComponent,
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/exchange-rate-detail/exchange-rate-detail.component').then(
        (m) => m.ExchangeRateDetailComponent,
      ),
  },
];
