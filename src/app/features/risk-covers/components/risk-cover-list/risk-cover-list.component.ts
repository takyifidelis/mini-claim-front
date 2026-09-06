import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '@ngxs/store';
import { DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Table, SortIcon, SortableColumn, TableLazyLoadEvent } from 'primeng/table';
import {
  ClearRiskCoversFilter,
  LoadRiskCovers,
  RiskCoversState,
  SetRiskCoversFilter,
  SetRiskCoversPage,
} from '../../risk-covers.state';
import { FormInputComponent } from '../../../../shared/form-input/form-input.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { RiskCoverStatus } from '../../../../shared/models';

/**
 * Risk cover catalogue list page.
 *
 * Renders a server-paginated, sortable, searchable table of risk covers with
 * status filter support.  Dispatches `LoadRiskCovers` on init and wires
 * filter/sort/page actions to PrimeNG table events.
 */
@Component({
  selector: 'app-risk-cover-list',
  imports: [
    RouterLink,
    DatePipe,
    ReactiveFormsModule,
    Table,
    SortIcon,
    SortableColumn,
    FormInputComponent,
    EmptyStateComponent,
  ],
  templateUrl: './risk-cover-list.component.html',
})
export class RiskCoverListComponent implements OnInit {
  private readonly store = inject(Store);

  protected readonly items = this.store.selectSignal(RiskCoversState.items);
  protected readonly total = this.store.selectSignal(RiskCoversState.total);
  protected readonly page = this.store.selectSignal(RiskCoversState.page);
  protected readonly pageSize = this.store.selectSignal(RiskCoversState.pageSize);
  protected readonly loading = this.store.selectSignal(RiskCoversState.loading);
  protected readonly error = this.store.selectSignal(RiskCoversState.error);
  protected readonly filters = this.store.selectSignal(RiskCoversState.filters);

  protected readonly searchControl = new FormControl('');
  protected readonly statusControl = new FormControl<any>('');

  protected readonly statusOptions = [
    { id: '', name: 'All Statuses' },
    { id: 'ACTIVE', name: 'Active' },
    { id: 'INACTIVE', name: 'Inactive' },
  ];

  /**
   * Subscribes to the status filter control and dispatches `LoadRiskCovers`.
   */
  ngOnInit(): void {
    this.statusControl.valueChanges.subscribe((status) => {
      this.store.dispatch(new SetRiskCoversFilter({ status: (status as RiskCoverStatus) || null }));
    });
    this.store.dispatch(new LoadRiskCovers());
  }

  protected applySearch(): void {
    const search = this.searchControl.value || '';
    this.store.dispatch(new SetRiskCoversFilter({ search }));
  }

  protected clearFilters(): void {
    this.searchControl.setValue('', { emitEvent: false });
    this.statusControl.setValue('', { emitEvent: false });
    this.store.dispatch(new ClearRiskCoversFilter());
  }

  protected retry(): void {
    this.store.dispatch(new LoadRiskCovers());
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

    this.store.dispatch(new SetRiskCoversPage(page, rows, sortField, sortDirection));
  }

  protected onEmptyAction(): void {
    if (this.filters().search || this.filters().status) {
      this.clearFilters();
    }
  }
}
