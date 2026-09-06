import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngxs/store';
import { DatePipe } from '@angular/common';
import { LoadRiskCoverDetail, RiskCoversState } from '../../risk-covers.state';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

/**
 * Risk cover detail page.
 *
 * Loads the full risk cover record from NGXS state and renders it in a
 * read-only view.  Dispatches `LoadRiskCoverDetail` on init using the
 * `:id` route parameter.
 */
@Component({
  selector: 'app-risk-cover-detail',
  imports: [RouterLink, DatePipe, StatusBadgeComponent],
  templateUrl: './risk-cover-detail.component.html',
})
export class RiskCoverDetailComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);

  protected readonly cover = this.store.selectSignal(RiskCoversState.selected);
  protected readonly loading = this.store.selectSignal(RiskCoversState.loading);
  protected readonly error = this.store.selectSignal(RiskCoversState.error);

  /**
   * Dispatches `LoadRiskCoverDetail` with the `:id` route parameter.
   */
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.store.dispatch(new LoadRiskCoverDetail(id));
    }
  }
}
