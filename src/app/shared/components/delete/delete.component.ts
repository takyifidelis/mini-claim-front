import { Component, inject } from '@angular/core';
import { DynamicDialogRef } from 'primeng/dynamicdialog';

/**
 * PrimeNG dynamic dialog for confirming permanent deletion of an item.
 *
 * Closes with `true` on confirm and without a value on cancel.
 */
@Component({
  selector: 'app-delete',
  templateUrl: './delete.component.html',
  styleUrl: './delete.component.scss',
})
export class DeleteComponent {
  private readonly dialogRef = inject(DynamicDialogRef<boolean>);

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected confirm(): void {
    this.dialogRef.close(true);
  }
}
