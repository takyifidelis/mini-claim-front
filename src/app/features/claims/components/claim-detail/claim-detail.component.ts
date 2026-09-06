import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngxs/store';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import {
  ClaimsState,
  ClearApprovedPayout,
  LoadClaimDetail,
  LoadClaimPayments,
  RecordClaimPayment,
  SetApprovedPayout,
  SubmitClaimReview,
  UpdateClaimFacts,
} from '../../claims.state';
import { FormInputComponent } from '../../../../shared/form-input/form-input.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { MoneyPipe } from '../../../../shared/pipes/money.pipe';
import { RatePipe } from '../../../../shared/pipes/rate.pipe';
import {
  moneyValidator,
  normalizeMoneyString,
  dateBeforeOrEqualValidator,
  dateNotInFutureValidator,
} from '../../../../shared/utilities/decimal.validator';
import { Currency, ReviewDecision } from '../../../../shared/models';

/**
 * Comprehensive claim detail and workflow page.
 *
 * Combines four workflow panels into a single view:
 * 1. **Claim facts** — editable while `UNDER_REVIEW`.
 * 2. **Review decision** — APPROVED/DENIED with reason; shows confirmation dialog.
 * 3. **Approved payout** — set/clear approved payout amount.
 * 4. **Payment recording** — multi-currency payment form with live rate preview.
 *
 * Also displays a stage progress indicator, the payments history table, and
 * per-currency monetary totals for the policy context.
 */
@Component({
  selector: 'app-claim-detail',
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
  templateUrl: './claim-detail.component.html',
  styleUrl: './claim-detail.component.scss',
})
export class ClaimDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);

  protected readonly claim = this.store.selectSignal(ClaimsState.selectedClaim);
  protected readonly lockedExchangeRate = this.store.selectSignal(ClaimsState.lockedExchangeRate);
  protected readonly payments = this.store.selectSignal(ClaimsState.payments);
  protected readonly paymentsTotal = this.store.selectSignal(ClaimsState.paymentsTotal);
  protected readonly paymentsPage = this.store.selectSignal(ClaimsState.paymentsPage);
  protected readonly paymentsPageSize = this.store.selectSignal(ClaimsState.paymentsPageSize);
  protected readonly paymentsLoading = this.store.selectSignal(ClaimsState.paymentsLoading);
  protected readonly loading = this.store.selectSignal(ClaimsState.loading);
  protected readonly error = this.store.selectSignal(ClaimsState.error);
  protected readonly actionLoading = this.store.selectSignal(ClaimsState.actionLoading);

  protected readonly isEditingFacts = signal(false);
  protected readonly actionError = signal<string | null>(null);

  protected readonly reviewConfirmOpen = signal(false);
  protected readonly payoutOverpaymentConfirmOpen = signal(false);
  protected readonly paymentOverpaymentConfirmOpen = signal(false);

  protected readonly currencyOptions = [
    { id: 'GHS', name: 'GHS - Ghana Cedi' },
    { id: 'USD', name: 'USD - US Dollar' },
    { id: 'EUR', name: 'EUR - Euro' },
  ];

  protected readonly factsForm: FormGroup = this.fb.group(
    {
      lossDate: ['', [Validators.required]],
      dateNotified: ['', [Validators.required]],
      lossNature: ['', [Validators.required]],
      estimatedLossAmount: ['', [Validators.required, moneyValidator({ allowZero: true })]],
    },
    { validators: [dateBeforeOrEqualValidator('lossDate', 'dateNotified')] },
  );

  protected readonly reviewForm = this.fb.group({
    decision: ['APPROVED' as ReviewDecision, [Validators.required]],
    reason: ['', [Validators.required]],
  });

  protected readonly payoutForm = this.fb.group({
    approvedPayoutAmount: ['', [Validators.required, moneyValidator({ allowZero: true })]],
  });

  protected readonly paymentForm = this.fb.group({
    paymentDate: [
      new Date().toISOString().substring(0, 10),
      [Validators.required, dateNotInFutureValidator()],
    ],
    currency: ['USD' as Currency, [Validators.required]],
    amount: ['', [Validators.required, moneyValidator({ allowZero: false })]],
    reference: ['', [Validators.required]],
  });

  /**
   * Loads the claim detail, then side-loads the associated policy and locked exchange rate.
   * Pre-populates all forms from the loaded data.
   */
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.store.dispatch(new LoadClaimDetail(id)).subscribe({
        next: () => {
          const c = this.claim();
          if (c) {
            this.factsForm.patchValue({
              lossDate: c.lossDate,
              dateNotified: c.dateNotified,
              lossNature: c.lossNature,
              estimatedLossAmount: c.estimatedLossAmount,
            });
            if (c.approvedPayoutAmount !== null) {
              this.payoutForm.patchValue({
                approvedPayoutAmount: c.approvedPayoutAmount,
              });
            }
            this.paymentForm.patchValue({
              currency: c.currency,
            });
          }
        },
      });
    }
  }

  /**
   * Returns `true` if the signed outstanding balance is negative (overpaid).
   *
   * @param {string | null} balance - The `outstandingBalance` string from the claim.
   * @returns {boolean} Whether the claim has been overpaid.
   */
  protected isOverpaid(balance: string | null): boolean {
    if (!balance) return false;
    const num = Number(balance);
    return !isNaN(num) && num < 0;
  }

  protected isStageActive(stage: number): boolean {
    const c = this.claim();
    if (!c) return false;
    if (stage === 1) return true;
    if (stage === 2) return c.status === 'UNDER_REVIEW';
    if (stage === 3) return c.status === 'RESERVED_NOT_SETTLED';
    if (stage === 4) return c.status === 'PAYMENT_OUTSTANDING' || c.status === 'PAID';
    return false;
  }

  protected isStageComplete(stage: number): boolean {
    const c = this.claim();
    if (!c) return false;
    if (stage === 1) return c.status !== 'UNDER_REVIEW';
    if (stage === 2) return Boolean(c.review);
    if (stage === 3) return c.approvedPayoutAmount !== null;
    if (stage === 4) return c.status === 'PAID';
    return false;
  }

  protected canEditFacts(): boolean {
    return this.claim()?.status === 'UNDER_REVIEW';
  }

  protected isClaimApproved(): boolean {
    return this.claim()?.review?.decision === 'APPROVED';
  }

  protected canClearPayout(): boolean {
    const c = this.claim();
    if (!c || c.approvedPayoutAmount === null) return false;
    const totalPaidNum = Number(c.totalPaid);
    return totalPaidNum === 0;
  }

  /**
   * Returns `true` when a review decision is APPROVED and the approved payout
   * amount has been set, allowing the payment recording panel to be shown.
   *
   * @returns {boolean} Whether the payment form should be interactive.
   */
  protected canRecordPayment(): boolean {
    const c = this.claim();
    return Boolean(c && c.review?.decision === 'APPROVED' && c.approvedPayoutAmount !== null);
  }

  protected toggleEditFacts(): void {
    this.isEditingFacts.update((val) => !val);
  }

  protected onSaveFacts(): void {
    const c = this.claim();
    if (!c || this.factsForm.invalid) {
      this.factsForm.markAllAsTouched();
      return;
    }

    this.actionError.set(null);
    const val = this.factsForm.getRawValue();
    const dto = {
      expectedVersion: c.version,
      lossDate: val.lossDate,
      dateNotified: val.dateNotified,
      lossNature: val.lossNature.trim(),
      estimatedLossAmount: normalizeMoneyString(val.estimatedLossAmount),
    };

    this.store.dispatch(new UpdateClaimFacts(c.id, dto)).subscribe({
      next: () => {
        this.isEditingFacts.set(false);
      },
      error: (err) => {
        this.actionError.set(err?.message || 'Failed to update claim facts.');
      },
    });
  }

  protected onOpenReviewConfirm(): void {
    if (this.reviewForm.invalid) {
      this.reviewForm.markAllAsTouched();
      return;
    }
    this.reviewConfirmOpen.set(true);
  }

  protected onConfirmReview(): void {
    const c = this.claim();
    if (!c) return;
    this.reviewConfirmOpen.set(false);
    this.actionError.set(null);

    const val = this.reviewForm.getRawValue();
    const dto = {
      expectedVersion: c.version,
      decision: val.decision as ReviewDecision,
      reason: (val.reason || '').trim(),
    };

    this.store.dispatch(new SubmitClaimReview(c.id, dto)).subscribe({
      error: (err) => {
        this.actionError.set(err?.message || 'Failed to submit review.');
      },
    });
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
    const dto = {
      approvedPayoutAmount: payoutStr,
      expectedVersion: c.version,
      confirmOverpayment,
    };

    this.store.dispatch(new SetApprovedPayout(c.id, dto)).subscribe({
      next: () => {
        this.payoutOverpaymentConfirmOpen.set(false);
      },
      error: (err) => {
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

    this.store.dispatch(new ClearApprovedPayout(c.id, { expectedVersion: c.version })).subscribe({
      next: () => {
        this.payoutForm.patchValue({ approvedPayoutAmount: '' });
      },
      error: (err) => {
        this.actionError.set(err?.message || 'Failed to clear approved payout.');
      },
    });
  }

  protected readonly paymentPreview = computed(() => {
    const c = this.claim();
    if (!c || c.approvedPayoutAmount === null) return null;

    const paymentCurrency = this.paymentForm.get('currency')?.value as Currency;
    const amountStr = this.paymentForm.get('amount')?.value;
    if (!paymentCurrency || !amountStr) return null;

    const amountNum = Number(amountStr);
    if (isNaN(amountNum) || amountNum <= 0) return null;

    let appliedRate = '1.0000';
    if (paymentCurrency !== c.currency) {
      const sheet = this.lockedExchangeRate();
      if (!sheet || !sheet.entries) return null;
      const entry = sheet.entries.find(
        (e) => e.fromCurrency === paymentCurrency && e.toCurrency === c.currency,
      );
      if (!entry) return null;
      appliedRate = entry.rate;
    }

    const rateNum = Number(appliedRate);
    const convertedAmountNum = amountNum * rateNum;
    const convertedAmount = convertedAmountNum.toFixed(2);

    const currentBalance = Number(c.outstandingBalance || '0.00');
    const newBalanceNum = currentBalance - convertedAmountNum;
    const newBalance = newBalanceNum.toFixed(2);
    const isNegative = newBalanceNum < 0;

    return {
      appliedRate,
      convertedAmount,
      newBalance,
      isNegative,
    };
  });

  protected onOpenPaymentConfirm(): void {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    const preview = this.paymentPreview();
    if (preview && preview.isNegative) {
      this.paymentOverpaymentConfirmOpen.set(true);
      return;
    }

    this.onConfirmPayment(false);
  }

  protected onConfirmPayment(confirmOverpayment = true): void {
    const c = this.claim();
    if (!c) return;

    this.paymentOverpaymentConfirmOpen.set(false);
    this.actionError.set(null);

    const val = this.paymentForm.getRawValue();
    const dto = {
      paymentDate: val.paymentDate || new Date().toISOString().split('T')[0],
      currency: val.currency as Currency,
      amount: normalizeMoneyString(val.amount),
      reference: (val.reference || '').trim() || undefined,
      expectedVersion: c.version,
      confirmOverpayment,
    };

    this.store.dispatch(new RecordClaimPayment(c.id, dto)).subscribe({
      next: () => {
        this.paymentForm.patchValue({
          amount: '',
          reference: '',
        });
      },
      error: (err) => {
        this.actionError.set(err?.message || 'Failed to record payment.');
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
