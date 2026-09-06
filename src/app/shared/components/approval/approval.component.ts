import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { DynamicDialogRef } from 'primeng/dynamicdialog';

/**
 * PrimeNG dynamic dialog content for submitting an approval reason.
 *
 * Opened programmatically via `DialogService.open(ApprovalComponent, ...)`.  On
 * confirmation the dialog closes and returns the reason string to the caller.
 */
@Component({
  selector: 'app-approval',
  imports: [ReactiveFormsModule],
  templateUrl: './approval.component.html',
  styleUrl: './approval.component.scss',
})
export class ApprovalComponent {
  private dialogRef = inject(DynamicDialogRef<ApprovalComponent>);

  reason = new FormControl('', [Validators.required]);
  approvalForm = new FormGroup({ reason: this.reason });

  data = this.reason.value;

  /** Closes the dialog without returning a value. */
  close() {
    this.dialogRef.close();
  }

  onConfirm() {
    if (this.reason.valid) {
      this.dialogRef.close(this.data);
    }
  }
}
