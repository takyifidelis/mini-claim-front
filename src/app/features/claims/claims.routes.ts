import { Routes } from '@angular/router';

export const CLAIMS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/claim-list/claim-list.component').then((m) => m.ClaimListComponent),
  },
  {
    path: 'review',
    loadComponent: () =>
      import('./components/claim-review-list/claim-review-list.component').then(
        (m) => m.ClaimReviewListComponent,
      ),
  },
  {
    path: 'payouts',
    loadComponent: () =>
      import('./components/claim-payout-list/claim-payout-list.component').then(
        (m) => m.ClaimPayoutListComponent,
      ),
  },
  {
    path: 'settlements',
    loadComponent: () =>
      import('./components/claim-settlement-list/claim-settlement-list.component').then(
        (m) => m.ClaimSettlementListComponent,
      ),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./components/claim-form/claim-form.component').then((m) => m.ClaimFormComponent),
  },
  {
    path: ':id/review',
    loadComponent: () =>
      import('./components/claim-review/claim-review.component').then(
        (m) => m.ClaimReviewComponent,
      ),
  },
  {
    path: ':id/payout',
    loadComponent: () =>
      import('./components/claim-payout/claim-payout.component').then(
        (m) => m.ClaimPayoutComponent,
      ),
  },
  {
    path: ':id/settle',
    loadComponent: () =>
      import('./components/claim-settlement/claim-settlement.component').then(
        (m) => m.ClaimSettlementComponent,
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/claim-detail/claim-detail.component').then(
        (m) => m.ClaimDetailComponent,
      ),
  },
];
