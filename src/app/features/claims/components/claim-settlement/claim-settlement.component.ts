import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngxs/store';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import {
  ClaimsState,
  LoadClaimDetail,
  LoadClaimPayments,
  RecordClaimPayment,
} from '../../claims.state';
import { FormInputComponent } from '../../../../shared/form-input/form-input.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { MoneyPipe } from '../../../../shared/pipes/money.pipe';
import { RatePipe } from '../../../../shared/pipes/rate.pipe';
import {
  dateNotInFutureValidator,
  moneyValidator,
  normalizeMoneyString,
} from '../../../../shared/utilities/decimal.validator';
import { Currency } from '../../../../shared/models';

/**
 * Claim payment settlement workflow page.
 *
 * Loads the claim detail, its locked exchange rate, and the existing
 * payments history.  Provides a multi-currency payment form with a live
 * conversion preview.  Shows an overpayment confirmation dialog when the
 * payment would push the total paid above the approved payout.
 */
@Component({
  selector: 'app-claim-settlement',
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
  templateUrl: './claim-settlement.component.html',
})
export class ClaimSettlementComponent implements OnInit {
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

  protected readonly actionError = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly paymentOverpaymentConfirmOpen = signal(false);

  protected readonly currencyOptions = [
    { id: 'GHS', name: 'GHS - Ghana Cedi' },
    { id: 'USD', name: 'USD - US Dollar' },
    { id: 'EUR', name: 'EUR - Euro' },
  ];

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
   * Loads the claim detail and sets the default payment currency from the claim.
   */
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.store.dispatch(new LoadClaimDetail(id)).subscribe({
        next: () => {
          const c = this.claim();
          if (c) {
            this.paymentForm.patchValue({
              currency: c.currency,
            });
          }
        },
      });
    }
  }

  protected isOverpaid(balance: string | null): boolean {
    if (!balance) return false;
    const num = Number(balance);
    return !isNaN(num) && num < 0;
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

  protected onConfirmPayment(confirmOverpayment = false): void {
    const c = this.claim();
    if (!c) return;

    this.paymentOverpaymentConfirmOpen.set(false);
    this.actionError.set(null);
    this.successMessage.set(null);

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
        this.successMessage.set('Payment recorded successfully.');
      },
      error: (err) => {
        if (err?.code === 'OVERPAYMENT_CONFIRMATION_REQUIRED') {
          this.paymentOverpaymentConfirmOpen.set(true);
          return;
        }
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
