import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngxs/store';
import { DatePipe } from '@angular/common';
import { CreatePolicy, LoadSelectableRiskCovers, PoliciesState } from '../../policies.state';
import {
  ExchangeRatesState,
  LoadCurrentExchangeRate,
} from '../../../exchange-rates/exchange-rates.state';
import { FormInputComponent } from '../../../../shared/form-input/form-input.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import {
  dateBeforeOrEqualValidator,
  moneyValidator,
  normalizeMoneyString,
} from '../../../../shared/utilities/decimal.validator';
import { Currency, PolicyStatus } from '../../../../shared/models';
import { RatePipe } from '../../../../shared/pipes/rate.pipe';

/**
 * Policy creation form.
 *
 * Dynamically loads selectable risk covers and the current exchange rate
 * sheet.  Supports a dynamic array of cover lines with coverage limit and
 * deductible inputs.  A confirmation dialog is shown before final submission.
 * On success navigates to the new policy's detail page.
 */
@Component({
  selector: 'app-policy-form',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    DatePipe,
    FormInputComponent,
    ConfirmDialogComponent,
    RatePipe,
  ],
  templateUrl: './policy-form.component.html',
})
export class PolicyFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly router = inject(Router);

  protected readonly submitting = signal(false);
  protected readonly serverError = signal<string | null>(null);
  protected readonly confirmDialogOpen = signal(false);

  protected readonly currentExchangeRate = this.store.selectSignal(ExchangeRatesState.currentSheet);
  protected readonly selectableRiskCovers = this.store.selectSignal(
    PoliciesState.selectableRiskCovers,
  );

  protected readonly selectableCoverOptions = computed(() =>
    this.selectableRiskCovers().map((c) => ({
      id: c.id,
      name: `${c.code} - ${c.name}`,
    })),
  );

  protected readonly currencyOptions = [
    { id: 'GHS', name: 'GHS - Ghana Cedi' },
    { id: 'USD', name: 'USD - US Dollar' },
    { id: 'EUR', name: 'EUR - Euro' },
  ];

  protected readonly form: FormGroup = this.fb.group(
    {
      insuredName: ['', [Validators.required, Validators.maxLength(200)]],
      policyType: ['Commercial Property', [Validators.required, Validators.maxLength(100)]],
      startDate: [new Date().toISOString().substring(0, 10), [Validators.required]],
      endDate: [
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
        [Validators.required],
      ],
      currency: ['GHS' as Currency, [Validators.required]],
      sumInsured: ['', [Validators.required, moneyValidator({ allowZero: true })]],
      premiumAmount: ['', [moneyValidator({ allowZero: true })]],
      status: ['ACTIVE' as PolicyStatus, [Validators.required]],
      covers: this.fb.array([this.createCoverFormGroup()]),
    },
    { validators: [dateBeforeOrEqualValidator('startDate', 'endDate')] },
  );

  /**
   * Dispatches `LoadCurrentExchangeRate` and `LoadSelectableRiskCovers` to
   * populate the exchange rate preview and cover selector.
   */
  ngOnInit(): void {
    this.store.dispatch([new LoadCurrentExchangeRate(), new LoadSelectableRiskCovers()]);
  }

  protected get coversArray(): FormArray {
    return this.form.get('covers') as FormArray;
  }

  protected createCoverFormGroup(): FormGroup {
    return this.fb.group({
      riskCoverId: [null, [Validators.required]],
      coverageLimit: [null, [Validators.required, moneyValidator({ allowZero: false })]],
      deductibleAmount: ['0.00', [moneyValidator({ allowZero: true })]],
      terms: [''],
    });
  }

  protected addCover(): void {
    this.coversArray.push(this.createCoverFormGroup());
  }

  protected removeCover(index: number): void {
    if (this.coversArray.length > 1) {
      this.coversArray.removeAt(index);
    }
  }

  /**
   * Opens the confirmation dialog if the form is valid.
   * Marks all controls as touched to surface validation errors when invalid.
   */
  protected onOpenConfirm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.confirmDialogOpen.set(true);
  }

  /**
   * Closes the confirmation dialog and dispatches `CreatePolicy`.
   * Normalises all monetary string values before submission.
   * Navigates to the new policy's detail page on success.
   */
  protected onConfirmCreate(): void {
    this.confirmDialogOpen.set(false);
    this.submitting.set(true);
    this.serverError.set(null);

    const val = this.form.getRawValue();
    const covers = (val.covers || []).map((c: any) => ({
      riskCoverId: c.riskCoverId,
      coverageLimit: normalizeMoneyString(c.coverageLimit),
      deductibleAmount: normalizeMoneyString(c.deductibleAmount || '0.00'),
      terms: (c.terms || '').trim() || undefined,
    }));

    const dto = {
      insuredName: (val.insuredName || '').trim(),
      policyType: (val.policyType || '').trim(),
      startDate: val.startDate,
      endDate: val.endDate,
      currency: val.currency as Currency,
      sumInsured: normalizeMoneyString(val.sumInsured),
      premiumAmount: val.premiumAmount ? normalizeMoneyString(val.premiumAmount) : undefined,
      status: val.status as PolicyStatus,
      covers,
    };

    this.store.dispatch(new CreatePolicy(dto)).subscribe({
      next: () => {
        this.submitting.set(false);
        const selected = this.store.selectSnapshot(PoliciesState.selectedPolicy);
        if (selected?.id) {
          this.router.navigate(['/policies', selected.id]);
        } else {
          this.router.navigate(['/policies']);
        }
      },
      error: (err) => {
        this.submitting.set(false);
        this.serverError.set(err?.message || 'Failed to create policy.');
      },
    });
  }
}
