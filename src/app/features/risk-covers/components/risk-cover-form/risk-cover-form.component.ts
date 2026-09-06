import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngxs/store';
import { CreateRiskCover, RiskCoversState } from '../../risk-covers.state';
import { FormInputComponent } from '../../../../shared/form-input/form-input.component';
import { RiskCoverStatus } from '../../../../shared/models';

/**
 * Risk cover creation form.
 *
 * Collects code, name, description, and initial status for a new risk cover
 * catalogue entry.  Dispatches `CreateRiskCover` on submit and navigates to
 * the newly created record's detail page on success.
 */
@Component({
  selector: 'app-risk-cover-form',
  imports: [RouterLink, ReactiveFormsModule, FormInputComponent],
  templateUrl: './risk-cover-form.component.html',
})
export class RiskCoverFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly router = inject(Router);

  protected readonly submitting = signal(false);
  protected readonly serverError = signal<string | null>(null);

  protected readonly statusOptions = [
    { id: 'ACTIVE', name: 'Active' },
    { id: 'INACTIVE', name: 'Inactive' },
  ];

  protected readonly form = this.fb.group({
    code: ['', [Validators.required, Validators.maxLength(50)]],
    name: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.required]],
    status: ['ACTIVE' as RiskCoverStatus, [Validators.required]],
  });

  /**
   * Validates and submits the form, dispatching `CreateRiskCover`.
   * Navigates to the new record's detail page on success.
   */
  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.serverError.set(null);

    const val = this.form.getRawValue();
    const dto = {
      code: (val.code || '').trim().toUpperCase(),
      name: (val.name || '').trim(),
      description: (val.description || '').trim(),
      status: val.status as RiskCoverStatus,
    };

    this.store.dispatch(new CreateRiskCover(dto)).subscribe({
      next: () => {
        this.submitting.set(false);
        const selected = this.store.selectSnapshot(RiskCoversState.selected);
        if (selected?.id) {
          this.router.navigate(['/risk-covers', selected.id]);
        } else {
          this.router.navigate(['/risk-covers']);
        }
      },
      error: (err) => {
        this.submitting.set(false);
        this.serverError.set(err?.message || 'Failed to create risk cover.');
      },
    });
  }
}
