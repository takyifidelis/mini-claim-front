import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DynamicDialogRef } from 'primeng/dynamicdialog';

/**
 * PrimeNG dynamic dialog content for submitting a denial reason.
 *
 * Opened programmatically via `DialogService.open(DenialComponent, ...)`.  On
 * confirmation the dialog closes and returns the reason string to the caller.
 * Cancelling closes without a return value.
 */
@Component({
  selector: 'app-denial',
  imports: [ReactiveFormsModule],
  templateUrl: './denial.component.html',
  styleUrl: './denial.component.scss',
})
export class DenialComponent {
  private dialogRef = inject(DynamicDialogRef<DenialComponent>);
  reason = new FormControl('', [Validators.required]);

  data: any = this.reason.value;

  /** Closes the dialog without returning a value. */
  cancel() {
    this.dialogRef.close();
  }

  onConfirm() {
    if (this.reason.valid) {
      this.dialogRef.close(this.data);
    }
  }
}
