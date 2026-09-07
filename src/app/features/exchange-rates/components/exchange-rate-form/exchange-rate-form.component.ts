import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngxs/store';
import { CreateExchangeRate, ExchangeRatesState } from '../../exchange-rates.state';
import { FormInputComponent } from '../../../../shared/form-input/form-input.component';
import { rateValidator } from '../../../../shared/utilities/decimal.validator';

/**
 * Standalone exchange rate sheet creation form.
 *
 * Accepts two GHS-base rates (GHS→USD and GHS→EUR) and derives all six
 * bidirectional entries.  Provides a live rate preview before the user
 * confirms and submits. On success navigates to the new sheet's detail page.
 */
@Component({
  selector: 'app-exchange-rate-form',
  imports: [RouterLink, ReactiveFormsModule, FormInputComponent],
  templateUrl: './exchange-rate-form.component.html',
})
export class ExchangeRateFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly router = inject(Router);

  protected readonly submitting = signal(false);
  protected readonly serverError = signal<string | null>(null);

  protected readonly form = this.fb.group({
    usdRate: ['', [Validators.required, rateValidator()]],
    eurRate: ['', [Validators.required, rateValidator()]],
    confirmed: [false, [Validators.requiredTrue]],
  });

  protected readonly ratePreview = computed(() => {
    const usdVal = this.form.get('usdRate')?.value;
    const eurVal = this.form.get('eurRate')?.value;

    const usdToGhs = Number(usdVal);
    const eurToGhs = Number(eurVal);

    if (isNaN(usdToGhs) || usdToGhs <= 0 || isNaN(eurToGhs) || eurToGhs <= 0) {
      return null;
    }

    const ghsToUsd = (1 / usdToGhs).toFixed(4);
    const ghsToEur = (1 / eurToGhs).toFixed(4);
    const usdToEur = (eurToGhs / usdToGhs).toFixed(4);
    const eurToUsd = (usdToGhs / eurToGhs).toFixed(4);

    return {
      usdToGhs: usdToGhs.toFixed(4),
      ghsToUsd,
      eurToGhs: eurToGhs.toFixed(4),
      ghsToEur,
      usdToEur,
      eurToUsd,
    };
  });

  /**
   * Validates and submits the form with GHS conversion rates before dispatching `CreateExchangeRate`.
   * Navigates to the new sheet's detail page on success.
   */
  protected onSubmit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.serverError.set(null);

    const val = this.form.getRawValue();
    const usdToGhs = Number(val.usdRate);
    const eurToGhs = Number(val.eurRate);

    const dto = {
      effectiveAt: new Date().toISOString(),
      usdToGhsRate: usdToGhs.toFixed(4),
      eurToGhsRate: eurToGhs.toFixed(4),
    };

    this.store.dispatch(new CreateExchangeRate(dto)).subscribe({
      next: () => {
        this.submitting.set(false);
        const selected = this.store.selectSnapshot(ExchangeRatesState.selectedSheet);
        if (selected?.id) {
          this.router.navigate(['/dashboard/exchange-rates', selected.id]);
        } else {
          this.router.navigate(['/dashboard/exchange-rates']);
        }
      },
      error: (err) => {
        this.submitting.set(false);
        this.serverError.set(err?.message || 'Failed to publish exchange rate sheet.');
      },
    });
  }
}
