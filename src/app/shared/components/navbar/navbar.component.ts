import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Top-level navigation bar rendered at the top of the application shell.
 *
 * Provides primary navigation links to the main feature sections.
 */
@Component({
  selector: 'app-navbar',
  imports: [RouterLink],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {}
