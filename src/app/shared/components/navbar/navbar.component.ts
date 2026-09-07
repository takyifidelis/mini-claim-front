import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { Menu } from 'primeng/menu';

/**
 * Top-level navigation bar rendered at the top of the application shell.
 *
 * Provides primary navigation links to the main feature sections.
 */
@Component({
  selector: 'app-navbar',
  imports: [Menu, RouterLink],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  private readonly router = inject(Router);

  protected readonly profileMenuItems: MenuItem[] = [
    {
      label: 'Logout',
      command: () => this.logout(),
    },
  ];

  private logout(): void {
    void this.router.navigate(['/login']);
  }
}
