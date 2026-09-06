import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '@ngxs/store';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Table, SortIcon, SortableColumn, TableLazyLoadEvent } from 'primeng/table';
import {
  ClaimsState,
  ClearClaimsFilter,
  LoadClaims,
  SetClaimsFilter,
  SetClaimsPage,
} from '../../claims.state';
import { FormInputComponent } from '../../../../shared/form-input/form-input.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { MoneyPipe } from '../../../../shared/pipes/money.pipe';
import { Currency } from '../../../../shared/models';

/**
 * Claims settlement queue list.
 *
 * Pre-filters the claims list to `PAYMENT_OUTSTANDING` status on init so
 * finance staff see only claims awaiting payment recording.
 * Supports currency and date-range filters and highlights overpaid balances.
 */
@Component({
  selector: 'app-claim-settlement-list',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    Table,
    SortIcon,
    SortableColumn,
    FormInputComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    MoneyPipe,
  ],
  templateUrl: './claim-settlement-list.component.html',
})
export class ClaimSettlementListComponent implements OnInit {
  private readonly store = inject(Store);

  protected readonly items = this.store.selectSignal(ClaimsState.items);
  protected readonly total = this.store.selectSignal(ClaimsState.total);
  protected readonly page = this.store.selectSignal(ClaimsState.page);
  protected readonly pageSize = this.store.selectSignal(ClaimsState.pageSize);
  protected readonly loading = this.store.selectSignal(ClaimsState.loading);
  protected readonly error = this.store.selectSignal(ClaimsState.error);
  protected readonly filters = this.store.selectSignal(ClaimsState.filters);

  protected readonly searchControl = new FormControl('');
  protected readonly currencyControl = new FormControl<any>('');
  protected readonly dateFromControl = new FormControl('');
  protected readonly dateToControl = new FormControl('');

  protected readonly currencyOptions = [
    { id: '', name: 'All Currencies' },
    { id: 'GHS', name: 'GHS - Ghana Cedi' },
    { id: 'USD', name: 'USD - US Dollar' },
    { id: 'EUR', name: 'EUR - Euro' },
  ];

  ngOnInit(): void {
    this.currencyControl.valueChanges.subscribe((currency) => {
      this.store.dispatch(new SetClaimsFilter({ currency: (currency as Currency) || null }));
    });
    this.dateFromControl.valueChanges.subscribe((dateNotifiedFrom) => {
      this.store.dispatch(new SetClaimsFilter({ dateNotifiedFrom: dateNotifiedFrom || null }));
    });
    this.dateToControl.valueChanges.subscribe((dateNotifiedTo) => {
      this.store.dispatch(new SetClaimsFilter({ dateNotifiedTo: dateNotifiedTo || null }));
    });

    this.store.dispatch(new ClearClaimsFilter({ status: 'PAYMENT_OUTSTANDING' }));
  }

  protected applySearch(): void {
    const search = this.searchControl.value || '';
    this.store.dispatch(new SetClaimsFilter({ search }));
  }

  protected clearFilters(): void {
    this.searchControl.setValue('', { emitEvent: false });
    this.currencyControl.setValue('', { emitEvent: false });
    this.dateFromControl.setValue('', { emitEvent: false });
    this.dateToControl.setValue('', { emitEvent: false });
    this.store.dispatch(new ClearClaimsFilter({ status: 'PAYMENT_OUTSTANDING' }));
  }

  protected retry(): void {
    this.store.dispatch(new LoadClaims());
  }

  protected isOverpaid(balance: string | null): boolean {
    if (!balance) return false;
    const num = Number(balance);
    return !isNaN(num) && num < 0;
  }

  protected hasActiveFilters(): boolean {
    const f = this.filters();
    return Boolean(f.search || f.currency || f.dateNotifiedFrom || f.dateNotifiedTo);
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

    this.store.dispatch(new SetClaimsPage(page, rows, sortField, sortDirection));
  }
}
