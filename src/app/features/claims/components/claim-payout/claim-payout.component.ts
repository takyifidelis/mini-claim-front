import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngxs/store';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import {
  ClaimsState,
  ClearApprovedPayout,
  LoadClaimDetail,
  LoadClaimPayments,
  SetApprovedPayout,
} from '../../claims.state';
import { FormInputComponent } from '../../../../shared/form-input/form-input.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { MoneyPipe } from '../../../../shared/pipes/money.pipe';
import { RatePipe } from '../../../../shared/pipes/rate.pipe';
import {
  moneyValidator,
  normalizeMoneyString,
} from '../../../../shared/utilities/decimal.validator';

/**
 * Claim payout approval workflow page.
 *
 * Loads the claim detail and provides a form to set or update the approved
 * payout amount.  Shows an overpayment confirmation dialog when the amount
 * is below the total already paid.  Also allows clearing the payout when no
 * payments have been recorded.
 */
@Component({
  selector: 'app-claim-payout',
  imports: [
    RouterLink,
    DatePipe,
    ReactiveFormsModule,
    TableModule,
    FormInputComponent,
    StatusBadgeComponent,
    ConfirmDialogComponent,
    MoneyPipe,
    RatePipe,
  ],
  templateUrl: './claim-payout.component.html',
})
export class ClaimPayoutComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);

  protected readonly claim = this.store.selectSignal(ClaimsState.selectedClaim);
  protected readonly payments = this.store.selectSignal(ClaimsState.payments);
  protected readonly paymentsTotal = this.store.selectSignal(ClaimsState.paymentsTotal);
  protected readonly paymentsPage = this.store.selectSignal(ClaimsState.paymentsPage);
  protected readonly paymentsPageSize = this.store.selectSignal(ClaimsState.paymentsPageSize);
  protected readonly paymentsLoading = this.store.selectSignal(ClaimsState.paymentsLoading);
  protected readonly loading = this.store.selectSignal(ClaimsState.loading);
  protected readonly error = this.store.selectSignal(ClaimsState.error);
  protected readonly actionLoading = this.store.selectSignal(ClaimsState.actionLoading);

  protected readonly actionError = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly payoutOverpaymentConfirmOpen = signal(false);

  protected readonly payoutForm = this.fb.group({
    approvedPayoutAmount: ['', [Validators.required, moneyValidator({ allowZero: true })]],
  });

  /**
   * Loads the claim detail and pre-populates the payout form from the current approved payout.
   */
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.store.dispatch(new LoadClaimDetail(id)).subscribe({
        next: () => {
          const c = this.claim();
          if (c) {
            this.payoutForm.patchValue({
              approvedPayoutAmount: c.approvedPayoutAmount,
            });
          }
        },
      });
    }
  }

  protected canClearPayout(): boolean {
    const c = this.claim();
    if (!c || c.approvedPayoutAmount === null) return false;
    const totalPaidNum = Number(c.totalPaid);
    return totalPaidNum === 0;
  }

  protected onSavePayout(confirmOverpayment = false): void {
    const c = this.claim();
    if (!c || this.payoutForm.invalid) {
      this.payoutForm.markAllAsTouched();
      return;
    }

    const val = this.payoutForm.getRawValue();
    const payoutStr = normalizeMoneyString(val.approvedPayoutAmount);
    const payoutNum = Number(payoutStr);
    const totalPaidNum = Number(c.totalPaid);

    if (!confirmOverpayment && payoutNum < totalPaidNum) {
      this.payoutOverpaymentConfirmOpen.set(true);
      return;
    }

    this.actionError.set(null);
    this.successMessage.set(null);

    const dto = {
      approvedPayoutAmount: payoutStr,
      expectedVersion: c.version,
      confirmOverpayment,
    };

    this.store.dispatch(new SetApprovedPayout(c.id, dto)).subscribe({
      next: () => {
        this.payoutOverpaymentConfirmOpen.set(false);
        this.successMessage.set('Approved payout amount saved successfully.');
      },
      error: (err) => {
        if (err?.code === 'OVERPAYMENT_CONFIRMATION_REQUIRED') {
          this.payoutOverpaymentConfirmOpen.set(true);
          return;
        }
        this.actionError.set(err?.message || 'Failed to set approved payout.');
      },
    });
  }

  protected onConfirmPayoutOverpayment(): void {
    this.onSavePayout(true);
  }

  protected onClearPayout(): void {
    const c = this.claim();
    if (!c) return;
    this.actionError.set(null);
    this.successMessage.set(null);

    this.store.dispatch(new ClearApprovedPayout(c.id, { expectedVersion: c.version })).subscribe({
      next: () => {
        this.payoutForm.patchValue({ approvedPayoutAmount: '' });
        this.successMessage.set('Approved payout amount cleared.');
      },
      error: (err) => {
        this.actionError.set(err?.message || 'Failed to clear approved payout.');
      },
    });
  }

  protected onPaymentsLazyLoad(event: TableLazyLoadEvent): void {
    const c = this.claim();
    if (!c) return;

    const rows = event.rows || 10;
    const first = event.first || 0;
    const page = Math.floor(first / rows) + 1;
    this.store.dispatch(new LoadClaimPayments(c.id, page, rows));
  }
}
