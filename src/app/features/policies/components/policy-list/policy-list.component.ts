import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '@ngxs/store';
import { DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Table, SortIcon, SortableColumn, TableLazyLoadEvent } from 'primeng/table';
import {
  ClearPoliciesFilter,
  LoadPolicies,
  PoliciesState,
  SetPoliciesFilter,
  SetPoliciesPage,
} from '../../policies.state';
import { FormInputComponent } from '../../../../shared/form-input/form-input.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { MoneyPipe } from '../../../../shared/pipes/money.pipe';
import { Currency, PolicyStatus } from '../../../../shared/models';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';

/**
 * Policy list page.
 *
 * Renders a server-paginated, sortable, searchable table of policy summaries
 * with currency and status filter support.  Dispatches `LoadPolicies` on
 * init and wires filter/sort/page actions to PrimeNG table events.
 */
@Component({
  selector: 'app-policy-list',
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
  templateUrl: './policy-list.component.html',
})
export class PolicyListComponent implements OnInit {
  private readonly store = inject(Store);

  protected readonly items = this.store.selectSignal(PoliciesState.items);
  protected readonly total = this.store.selectSignal(PoliciesState.total);
  protected readonly page = this.store.selectSignal(PoliciesState.page);
  protected readonly pageSize = this.store.selectSignal(PoliciesState.pageSize);
  protected readonly loading = this.store.selectSignal(PoliciesState.loading);
  protected readonly error = this.store.selectSignal(PoliciesState.error);
  protected readonly filters = this.store.selectSignal(PoliciesState.filters);

  protected readonly searchControl = new FormControl('');
  protected readonly currencyControl = new FormControl<any>('');
  protected readonly statusControl = new FormControl<any>('');

  protected readonly currencyOptions = [
    { id: '', name: 'All Currencies' },
    { id: 'GHS', name: 'GHS - Ghana Cedi' },
    { id: 'USD', name: 'USD - US Dollar' },
    { id: 'EUR', name: 'EUR - Euro' },
  ];

  protected readonly statusOptions = [
    { id: '', name: 'All Statuses' },
    { id: 'ACTIVE', name: 'Active' },
    { id: 'EXPIRED', name: 'Expired' },
    { id: 'CANCELLED', name: 'Cancelled' },
  ];

  /**
   * Subscribes to currency/status filter controls and dispatches `LoadPolicies`.
   */
  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(
        map((value) => value?.trim() ?? ''),
        debounceTime(300),
        distinctUntilChanged(),
      )
      .subscribe((search) => this.store.dispatch(new SetPoliciesFilter({ search })));

    this.currencyControl.valueChanges.subscribe((currency) => {
      this.store.dispatch(new SetPoliciesFilter({ currency: (currency as Currency) || null }));
    });
    this.statusControl.valueChanges.subscribe((status) => {
      this.store.dispatch(new SetPoliciesFilter({ status: (status as PolicyStatus) || null }));
    });
    this.store.dispatch(new LoadPolicies());
  }

  protected clearFilters(): void {
    this.searchControl.setValue('', { emitEvent: false });
    this.currencyControl.setValue('', { emitEvent: false });
    this.statusControl.setValue('', { emitEvent: false });
    this.store.dispatch(new ClearPoliciesFilter());
  }

  protected retry(): void {
    this.store.dispatch(new LoadPolicies());
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

    this.store.dispatch(new SetPoliciesPage(page, rows, sortField, sortDirection));
  }

  protected onEmptyAction(): void {
    if (this.filters().search || this.filters().currency || this.filters().status) {
      this.clearFilters();
    }
  }
}
