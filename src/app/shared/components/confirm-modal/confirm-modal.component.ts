import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DynamicDialogRef } from 'primeng/dynamicdialog';

/**
 * PrimeNG confirmation modal opened via `DialogService`.
 *
 * Closes the dialog with `true` when the user confirms, and `false` when
 * they cancel.  Primarily used by legacy dialog-based flows; new features
 * should prefer `ConfirmDialogComponent` for inline confirmation.
 */
@Component({
  selector: 'app-confirm-modal',
  templateUrl: './confirm-modal.component.html',
  styleUrl: './confirm-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmModalComponent {
  private readonly dialogRef = inject(DynamicDialogRef<boolean>);

  protected cancel(): void {
    this.dialogRef.close(false);
  }

  protected confirm(): void {
    this.dialogRef.close(true);
  }
}
