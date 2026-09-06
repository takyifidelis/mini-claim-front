import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '@ngxs/store';
import { DatePipe } from '@angular/common';
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
 * Claims payout queue list.
 *
 * Pre-filters the claims list to `RESERVED_NOT_SETTLED` status on init so
 * claim managers see only claims awaiting an approved payout amount.
 * Supports currency and date-range filters.
 */
@Component({
  selector: 'app-claim-payout-list',
  imports: [
    RouterLink,
    DatePipe,
    ReactiveFormsModule,
    Table,
    SortIcon,
    SortableColumn,
    FormInputComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    MoneyPipe,
  ],
  templateUrl: './claim-payout-list.component.html',
})
export class ClaimPayoutListComponent implements OnInit {
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

    this.store.dispatch(new ClearClaimsFilter({ status: 'RESERVED_NOT_SETTLED' }));
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
    this.store.dispatch(new ClearClaimsFilter({ status: 'RESERVED_NOT_SETTLED' }));
  }

  protected retry(): void {
    this.store.dispatch(new LoadClaims());
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
