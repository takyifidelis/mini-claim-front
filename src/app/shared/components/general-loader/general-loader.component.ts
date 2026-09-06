import { Component } from '@angular/core';

/**
 * Full-page loading overlay component.
 *
 * Displays a centred spinner animation while data is being fetched.
 * Shown/hidden by the parent via the `ToastrService.isLoading` signal.
 */
@Component({
  selector: 'app-general-loader',
  imports: [],
  templateUrl: './general-loader.component.html',
  styleUrl: './general-loader.component.scss',
})
export class GeneralLoaderComponent {}
