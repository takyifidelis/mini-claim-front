import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { NavbarComponent } from '../shared/components/navbar/navbar.component';

/**
 * Application shell / dashboard layout component.
 *
 * Renders the collapsible sidebar navigation and hosts the primary
 * `<router-outlet>` for all feature pages.  Each sidebar section
 * (Claims, Policies, Risk Covers, Exchange Rates) can be toggled
 * independently via signal-backed boolean state.
 */
@Component({
  selector: 'app-dashboard',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NavbarComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  /** Controls visibility of the Claims sidebar section. */
  readonly claimsExpanded = signal(false);
  /** Controls visibility of the Policies sidebar section. */
  readonly policiesExpanded = signal(false);
  /** Controls visibility of the Risk Covers sidebar section. */
  readonly riskCoversExpanded = signal(true);
  /** Controls visibility of the Exchange Rates sidebar section. */
  readonly exchangeRatesExpanded = signal(true);

  /** Toggles the Claims sidebar section. */
  toggleClaims(): void {
    const next = !this.claimsExpanded();
    this.claimsExpanded.set(next);
    if (next) {
      this.policiesExpanded.set(false);
    }
  }

  /** Toggles the Policies sidebar section. */
  togglePolicies(): void {
    const next = !this.policiesExpanded();
    this.policiesExpanded.set(next);
    if (next) {
      this.claimsExpanded.set(false);
    }
  }

  /** Toggles the Risk Covers sidebar section. */
  toggleRiskCovers(): void {
    this.riskCoversExpanded.update((v) => !v);
  }

  /** Toggles the Exchange Rates sidebar section. */
  toggleExchangeRates(): void {
    this.exchangeRatesExpanded.update((v) => !v);
  }
}
