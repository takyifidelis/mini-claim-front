import { Component, input } from '@angular/core';
import { CurrencyTotals } from '../../models';
import { MoneyPipe } from '../../pipes/money.pipe';

@Component({
  selector: 'app-currency-totals',
  imports: [MoneyPipe],
  template: `
    @if (totals().length > 0) {
      <div
        class="currency-totals-grid"
        role="region"
        aria-label="Filtered Claim Totals by Currency"
      >
        @for (tot of totals(); track tot.currency) {
          <div class="currency-total-card">
            <div class="currency-total-card__header">
              <span class="currency-total-card__currency">{{ tot.currency }}</span>
              <span class="currency-total-card__count"
                >{{ tot.totalClaims }} {{ tot.totalClaims === 1 ? 'claim' : 'claims' }}</span
              >
            </div>
            <div class="currency-total-card__body">
              <div class="currency-total-card__stat">
                <span class="stat-label">Estimated Loss</span>
                <span class="stat-value">{{ tot.totalEstimatedLoss | money: tot.currency }}</span>
              </div>
              <div class="currency-total-card__stat">
                <span class="stat-label">Approved Payout</span>
                <span class="stat-value">{{ tot.totalApprovedPayout | money: tot.currency }}</span>
              </div>
              <div class="currency-total-card__stat">
                <span class="stat-label">Total Paid</span>
                <span class="stat-value">{{ tot.totalPaid | money: tot.currency }}</span>
              </div>
              <div class="currency-total-card__stat currency-total-card__stat--highlight">
                <span class="stat-label">
                  @if (isOverpaid(tot.signedOutstandingBalance)) {
                    Overpaid Balance
                  } @else {
                    Outstanding Balance
                  }
                </span>
                <span
                  class="stat-value"
                  [class.text-danger]="isOverpaid(tot.signedOutstandingBalance)"
                  [class.text-success]="isFullyPaid(tot.signedOutstandingBalance)"
                >
                  @if (isOverpaid(tot.signedOutstandingBalance)) {
                    -{{
                      getAbsValue(tot.signedOutstandingBalance) | money: tot.currency
                    }}
                    (Overpaid)
                  } @else {
                    {{ tot.signedOutstandingBalance | money: tot.currency }}
                  }
                </span>
              </div>
            </div>
            @if (tot.unapprovedCount > 0) {
              <div class="currency-total-card__footer">
                <small class="text-muted"
                  >{{ tot.unapprovedCount }} claim(s) pending approved payout</small
                >
              </div>
            }
          </div>
        }
      </div>
    }
  `,
  styles: [
    `
      .currency-totals-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      .currency-total-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 1rem 1.25rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

        &__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #f1f5f9;
        }

        &__currency {
          font-size: 1.125rem;
          font-weight: 700;
          color: #0f172a;
        }

        &__count {
          font-size: 0.8125rem;
          color: #64748b;
          background: #f1f5f9;
          padding: 0.125rem 0.5rem;
          border-radius: 9999px;
        }

        &__body {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        &__stat {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.875rem;

          .stat-label {
            color: #64748b;
          }

          .stat-value {
            font-weight: 600;
            color: #1e293b;
          }

          &--highlight {
            margin-top: 0.25rem;
            padding-top: 0.5rem;
            border-top: 1px dashed #e2e8f0;

            .stat-label {
              font-weight: 600;
              color: #0f172a;
            }

            .stat-value {
              font-size: 0.9375rem;
              font-weight: 700;
            }
          }
        }

        &__footer {
          margin-top: 0.75rem;
          padding-top: 0.5rem;
          border-top: 1px solid #f8fafc;
          font-size: 0.75rem;
        }
      }

      .text-danger {
        color: #dc2626 !important;
      }

      .text-success {
        color: #16a34a !important;
      }
    `,
  ],
})
/**
 * Displays a responsive grid of per-currency monetary aggregate cards for a
 * filtered set of claims.
 *
 * Each card shows estimated loss, approved payout, total paid, and the
 * signed outstanding/overpaid balance.  The balance row is coloured red for
 * overpayments and green for fully settled claims.
 */
export class CurrencyTotalsComponent {
  /** Array of per-currency aggregates to render; renders nothing when empty. */
  readonly totals = input<CurrencyTotals[]>([]);

  protected isOverpaid(val: string): boolean {
    const num = Number(val);
    return !isNaN(num) && num < 0;
  }

  protected isFullyPaid(val: string): boolean {
    const num = Number(val);
    return !isNaN(num) && num === 0;
  }

  protected getAbsValue(val: string): string {
    const num = Math.abs(Number(val));
    return isNaN(num) ? val : num.toFixed(2);
  }
}
