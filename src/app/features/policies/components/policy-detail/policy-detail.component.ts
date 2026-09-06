import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngxs/store';
import { DatePipe } from '@angular/common';
import { TableModule } from 'primeng/table';
import { LoadPolicyDetail, PoliciesState } from '../../policies.state';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { MoneyPipe } from '../../../../shared/pipes/money.pipe';

/**
 * Policy detail page.
 *
 * Loads the full policy detail (including risk covers and exchange rate sheet)
 * from NGXS state and renders it in a read-only view.  Dispatches
 * `LoadPolicyDetail` on init using the `:id` route parameter.
 */
@Component({
  selector: 'app-policy-detail',
  imports: [RouterLink, DatePipe, TableModule, StatusBadgeComponent, MoneyPipe],
  templateUrl: './policy-detail.component.html',
})
export class PolicyDetailComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);

  protected readonly policy = this.store.selectSignal(PoliciesState.selectedPolicy);
  protected readonly loading = this.store.selectSignal(PoliciesState.loading);
  protected readonly error = this.store.selectSignal(PoliciesState.error);

  /**
   * Dispatches `LoadPolicyDetail` with the `:id` route parameter.
   */
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.store.dispatch(new LoadPolicyDetail(id));
    }
  }
}
