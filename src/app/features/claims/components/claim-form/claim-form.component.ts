import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngxs/store';
import { DatePipe } from '@angular/common';
import { CreateClaim, ClaimsState } from '../../claims.state';
import { LoadSelectablePolicies, PoliciesState } from '../../../policies/policies.state';
import { PoliciesApiService } from '../../../../core/api/policies-api.service';
import { FormInputComponent } from '../../../../shared/form-input/form-input.component';
import {
  dateBeforeOrEqualValidator,
  moneyValidator,
  normalizeMoneyString,
} from '../../../../shared/utilities/decimal.validator';
import { PolicyDetail } from '../../../../shared/models';
import { MoneyPipe } from '../../../../shared/pipes/money.pipe';

/**
 * Claim registration form.
 *
 * Dynamically loads selectable policies.  When a policy is selected, fetches
 * its full detail to populate the cover selector.  Validates that the loss
 * date is not after the notification date.  On success navigates to the
 * newly registered claim's detail page.
 */
@Component({
  selector: 'app-claim-form',
  imports: [RouterLink, ReactiveFormsModule, DatePipe, FormInputComponent, MoneyPipe],
  templateUrl: './claim-form.component.html',
})
export class ClaimFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly policiesApi = inject(PoliciesApiService);

  protected readonly submitting = signal(false);
  protected readonly serverError = signal<string | null>(null);

  protected readonly policies = this.store.selectSignal(PoliciesState.selectablePolicies);
  protected readonly selectedPolicy = signal<PolicyDetail | null>(null);

  protected readonly policyOptions = computed(() =>
    this.policies().map((p) => ({
      id: p.id,
      name: `${p.policyNumber} — ${p.insuredName} (${p.currency})`,
    })),
  );

  protected readonly coverOptions = computed(() => {
    const p = this.selectedPolicy();
    if (!p || !p.covers) return [];
    return p.covers.map((c) => ({
      id: c.id,
      name: `${c.coverCodeSnapshot} — ${c.coverNameSnapshot} (Limit: ${c.coverageLimit} ${p.currency})`,
    }));
  });

  protected readonly selectedCover = computed(() => {
    const covId = this.form.get('policyRiskCoverId')?.value;
    const p = this.selectedPolicy();
    if (!covId || !p || !p.covers) return null;
    return p.covers.find((c) => c.id === covId) || null;
  });

  protected readonly form: FormGroup = this.fb.group(
    {
      policyId: [null, [Validators.required]],
      policyRiskCoverId: ['', [Validators.required]],
      lossDate: [new Date().toISOString().substring(0, 10), [Validators.required]],
      dateNotified: [new Date().toISOString().substring(0, 10), [Validators.required]],
      lossNature: ['', [Validators.required]],
      estimatedLossAmount: ['', [Validators.required, moneyValidator({ allowZero: true })]],
    },
    { validators: [dateBeforeOrEqualValidator('lossDate', 'dateNotified')] },
  );

  /**
   * Dispatches `LoadSelectablePolicies` and subscribes to `policyId`
   * value changes to fetch the selected policy's full detail.
   */
  ngOnInit(): void {
    this.store.dispatch(new LoadSelectablePolicies());

    this.form.get('policyId')?.valueChanges.subscribe((policyId) => {
      if (policyId) {
        this.policiesApi.getById(policyId).subscribe({
          next: (policyDetail) => {
            this.selectedPolicy.set(policyDetail);
            this.form.get('policyRiskCoverId')?.setValue('');
          },
          error: () => {
            this.selectedPolicy.set(null);
          },
        });
      } else {
        this.selectedPolicy.set(null);
        this.form.get('policyRiskCoverId')?.setValue('');
      }
    });
  }

  protected onSubmit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.serverError.set(null);

    const val = this.form.getRawValue();
    const dto = {
      policyId: val.policyId,
      policyRiskCoverId: val.policyRiskCoverId,
      lossDate: val.lossDate,
      dateNotified: val.dateNotified,
      lossNature: (val.lossNature || '').trim(),
      estimatedLossAmount: normalizeMoneyString(val.estimatedLossAmount),
    };

    this.store.dispatch(new CreateClaim(dto)).subscribe({
      next: () => {
        this.submitting.set(false);
        const selected = this.store.selectSnapshot(ClaimsState.selectedClaim);
        if (selected?.id) {
          this.router.navigate(['/claims', selected.id]);
        } else {
          this.router.navigate(['/claims']);
        }
      },
      error: (err) => {
        this.submitting.set(false);
        this.serverError.set(err?.message || 'Failed to register claim.');
      },
    });
  }
}
