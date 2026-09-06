import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngxs/store';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClaimsState, LoadClaimDetail, SubmitClaimReview } from '../../claims.state';
import { FormInputComponent } from '../../../../shared/form-input/form-input.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { MoneyPipe } from '../../../../shared/pipes/money.pipe';
import { ReviewDecision } from '../../../../shared/models';

/**
 * Claim review workflow page.
 *
 * Loads the claim detail and provides APPROVE/DENY decision buttons.  Each
 * button opens a modal where the adjuster enters a mandatory reason before
 * confirming the decision.  Dispatches `SubmitClaimReview` on confirmation.
 */
@Component({
  selector: 'app-claim-review',
  imports: [
    RouterLink,
    DatePipe,
    ReactiveFormsModule,
    FormInputComponent,
    StatusBadgeComponent,
    MoneyPipe,
  ],
  templateUrl: './claim-review.component.html',
})
export class ClaimReviewComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);

  protected readonly claim = this.store.selectSignal(ClaimsState.selectedClaim);
  protected readonly loading = this.store.selectSignal(ClaimsState.loading);
  protected readonly error = this.store.selectSignal(ClaimsState.error);
  protected readonly actionLoading = this.store.selectSignal(ClaimsState.actionLoading);

  protected readonly actionError = signal<string | null>(null);
  protected readonly isModalOpen = signal(false);
  protected readonly selectedDecision = signal<ReviewDecision>('APPROVED');

  protected readonly reasonForm = this.fb.group({
    reason: ['', [Validators.required, Validators.minLength(5)]],
  });

  /**
   * Dispatches `LoadClaimDetail` with the `:id` route parameter.
   */
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.store.dispatch(new LoadClaimDetail(id));
    }
  }

  protected openDecisionModal(decision: ReviewDecision): void {
    this.selectedDecision.set(decision);
    this.reasonForm.reset();
    this.actionError.set(null);
    this.isModalOpen.set(true);
  }

  protected openModal(decision: ReviewDecision): void {
    this.openDecisionModal(decision);
  }

  protected closeModal(): void {
    this.isModalOpen.set(false);
    this.reasonForm.reset();
  }

  protected onSubmitDecision(): void {
    const c = this.claim();
    if (!c || this.reasonForm.invalid) {
      this.reasonForm.markAllAsTouched();
      return;
    }

    this.actionError.set(null);
    const dto = {
      expectedVersion: c.version,
      decision: this.selectedDecision(),
      reason: (this.reasonForm.get('reason')?.value || '').trim(),
    };

    this.store.dispatch(new SubmitClaimReview(c.id, dto)).subscribe({
      next: () => {
        this.isModalOpen.set(false);
      },
      error: (err) => {
        this.actionError.set(err?.message || 'Failed to submit review decision.');
      },
    });
  }
}
