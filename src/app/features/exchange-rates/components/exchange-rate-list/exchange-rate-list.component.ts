import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '@ngxs/store';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import {
  ClearExchangeRatesFilter,
  CreateExchangeRate,
  ExchangeRatesState,
  LoadCurrentExchangeRate,
  LoadExchangeRates,
  SetExchangeRatesFilter,
  SetExchangeRatesPage,
} from '../../exchange-rates.state';
import { FormInputComponent } from '../../../../shared/form-input/form-input.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { RatePipe } from '../../../../shared/pipes/rate.pipe';
import { rateValidator } from '../../../../shared/utilities/decimal.validator';

/**
 * Exchange rate list and quick-update page.
 *
 * Renders a server-paginated, sortable, searchable table of exchange rate
 * sheet summaries alongside an inline rate-update form.  The form
 * pre-populates from the currently active sheet and provides a live
 * bidirectional rate preview (GHS/USD/EUR) before submission.
 *
 * On successful submission a new sheet is created and immediately becomes
 * the active rate used by future policies.  Existing policies are unaffected.
 */
@Component({
  selector: 'app-exchange-rate-list',
  imports: [
    RouterLink,
    DatePipe,
    ReactiveFormsModule,
    TableModule,
    FormInputComponent,
    EmptyStateComponent,
    RatePipe,
  ],
  templateUrl: './exchange-rate-list.component.html',
})
export class ExchangeRateListComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);

  protected readonly items = this.store.selectSignal(ExchangeRatesState.items);
  protected readonly total = this.store.selectSignal(ExchangeRatesState.total);
  protected readonly page = this.store.selectSignal(ExchangeRatesState.page);
  protected readonly pageSize = this.store.selectSignal(ExchangeRatesState.pageSize);
  protected readonly loading = this.store.selectSignal(ExchangeRatesState.loading);
  protected readonly error = this.store.selectSignal(ExchangeRatesState.error);
  protected readonly filters = this.store.selectSignal(ExchangeRatesState.filters);
  protected readonly currentSheet = this.store.selectSignal(ExchangeRatesState.currentSheet);
  protected readonly mutating = this.store.selectSignal(ExchangeRatesState.mutating);

  protected readonly formSuccess = signal<string | null>(null);
  protected readonly formError = signal<string | null>(null);

  protected readonly searchControl = new FormControl('');

  protected readonly rateForm = this.fb.group({
    usdRate: ['', [Validators.required, rateValidator()]],
    eurRate: ['', [Validators.required, rateValidator()]],
  });

  protected readonly ratePreview = computed(() => {
    const usdVal = this.rateForm.get('usdRate')?.value;
    const eurVal = this.rateForm.get('eurRate')?.value;

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
   * Dispatches both `LoadExchangeRates` and `LoadCurrentExchangeRate`.
   * Pre-populates the rate form from the current active sheet on success.
   */
  ngOnInit(): void {
    this.store.dispatch(new LoadExchangeRates());
    this.store.dispatch(new LoadCurrentExchangeRate()).subscribe({
      next: () => {
        const sheet = this.currentSheet();
        if (sheet && sheet.entries) {
          const usdGhs = sheet.entries.find(
            (e) => e.fromCurrency === 'USD' && e.toCurrency === 'GHS',
          );
          const eurGhs = sheet.entries.find(
            (e) => e.fromCurrency === 'EUR' && e.toCurrency === 'GHS',
          );
          if (usdGhs && eurGhs && !this.rateForm.dirty) {
            this.rateForm.patchValue({
              usdRate: Number(usdGhs.rate).toFixed(4),
              eurRate: Number(eurGhs.rate).toFixed(4),
            });
          }
        }
      },
    });
  }

  /**
   * Validates and submits the rate form with GHS conversion rates
   * before dispatching `CreateExchangeRate`.
   */
  protected onUpdateRates(): void {
    if (this.rateForm.invalid || this.mutating()) {
      this.rateForm.markAllAsTouched();
      return;
    }

    this.formError.set(null);
    this.formSuccess.set(null);

    const { usdRate, eurRate } = this.rateForm.getRawValue();
    const usdToGhs = Number(usdRate);
    const eurToGhs = Number(eurRate);

    if (isNaN(usdToGhs) || usdToGhs <= 0 || isNaN(eurToGhs) || eurToGhs <= 0) {
      this.formError.set('Please provide valid positive exchange rates.');
      return;
    }

    const dto = {
      effectiveAt: new Date().toISOString(),
      usdToGhsRate: usdToGhs.toFixed(4),
      eurToGhsRate: eurToGhs.toFixed(4),
    };

    this.store.dispatch(new CreateExchangeRate(dto)).subscribe({
      next: () => {
        this.formSuccess.set(
          'New exchange rate sheet created and activated. Future policies will use these rates; existing policies remain unchanged.',
        );
        this.store.dispatch(new LoadCurrentExchangeRate());
        this.store.dispatch(new LoadExchangeRates());
      },
      error: (err) => {
        this.formError.set(err?.message || 'Failed to update exchange rates.');
      },
    });
  }

  protected applySearch(): void {
    const search = this.searchControl.value || '';
    this.store.dispatch(new SetExchangeRatesFilter({ search }));
  }

  protected clearFilters(): void {
    this.searchControl.setValue('');
    this.store.dispatch(new ClearExchangeRatesFilter());
  }

  protected retry(): void {
    this.store.dispatch(new LoadExchangeRates());
  }

  protected onLazyLoad(event: TableLazyLoadEvent): void {
    const rows = event.rows || 10;
    const first = event.first || 0;
    const page = Math.floor(first / rows) + 1;

    const sortField = event.sortField
      ? Array.isArray(event.sortField)
        ? event.sortField[0]
        : event.sortField
      : undefined;
    const sortDirection = sortField ? (event.sortOrder === 1 ? 'asc' : 'desc') : undefined;

    this.store.dispatch(new SetExchangeRatesPage(page, rows, sortField, sortDirection));
  }

  protected onEmptyAction(): void {
    if (this.filters().search) {
      this.clearFilters();
    }
  }
}
