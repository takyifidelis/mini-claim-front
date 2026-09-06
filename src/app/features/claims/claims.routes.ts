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
    path: 'review',
    loadComponent: () =>
      import('./components/claim-review-list/claim-review-list.component').then(
        (m) => m.ClaimReviewListComponent,
      ),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./components/claim-form/claim-form.component').then(
        (m) => m.ClaimFormComponent,
      ),
  },
  {
    path: ':id/review',
    loadComponent: () =>
      import('./components/claim-review/claim-review.component').then(
        (m) => m.ClaimReviewComponent,
      ),
  },
];
