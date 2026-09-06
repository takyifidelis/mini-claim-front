import { Component, inject, signal } from '@angular/core';
import {
  Event as RouterEvent,
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterOutlet,
} from '@angular/router';
import { GeneralLoaderComponent } from './shared/components/general-loader/general-loader.component';

/**
 * Root application component.
 *
 * Serves as the top-level host for the Angular router outlet.  The
 * `DashboardComponent` is loaded as the default route child.
 */
@Component({
  imports: [RouterOutlet, GeneralLoaderComponent],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  private readonly router = inject(Router);
  protected readonly showLoader = signal(false);
  protected readonly title = signal('mini-claim');

  constructor() {
    this.router.events.subscribe((event: RouterEvent) => {
      if (event instanceof NavigationStart) {
        this.showLoader.set(true);
      }

      if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.showLoader.set(false);
      }
    });
  }
}
