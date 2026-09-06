import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngxs/store';
import { DatePipe } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ExchangeRatesState, LoadExchangeRateDetail } from '../../exchange-rates.state';
import { RatePipe } from '../../../../shared/pipes/rate.pipe';

/**
 * Exchange rate sheet detail page.
 *
 * Loads the full sheet detail (including all 6 rate entries) from NGXS state
 * and renders it in a read-only view.  Dispatches `LoadExchangeRateDetail`
 * on init using the `:id` route parameter.
 */
@Component({
  selector: 'app-exchange-rate-detail',
  imports: [RouterLink, DatePipe, TableModule, RatePipe],
  templateUrl: './exchange-rate-detail.component.html',
})
export class ExchangeRateDetailComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);

  protected readonly sheet = this.store.selectSignal(ExchangeRatesState.selectedSheet);
  protected readonly loading = this.store.selectSignal(ExchangeRatesState.loading);
  protected readonly error = this.store.selectSignal(ExchangeRatesState.error);

  /**
   * Dispatches `LoadExchangeRateDetail` with the `:id` route parameter.
   */
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.store.dispatch(new LoadExchangeRateDetail(id));
    }
  }
}
