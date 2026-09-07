import {
  Component,
  computed,
  DestroyRef,
  effect,
  forwardRef,
  inject,
  Injector,
  input,
  OnInit,
  signal,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  NG_VALUE_ACCESSOR,
  NgControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Checkbox } from 'primeng/checkbox';
import { DatePicker } from 'primeng/datepicker';
import { InputText } from 'primeng/inputtext';
import { MultiSelect } from 'primeng/multiselect';
import { Select } from 'primeng/select';
import { Textarea } from 'primeng/textarea';
import { getValidationMessage } from './form-input.validators';

let nextFormInputId = 0;

export type FormInputType =
  | 'text'
  | 'password'
  | 'textarea'
  | 'date'
  | 'money'
  | 'decimal-rate'
  | 'currency'
  | 'select'
  | 'multi-select'
  | 'checkbox';

export interface SelectOption {
  id: string | number;
  name: string;
}

/**
 * Universal form field wrapper that adapts to multiple input types and
 * integrates with Angular's `ControlValueAccessor` protocol.
 *
 * Renders as one of: `text`, `textarea`, `date`, `money`, `decimal-rate`,
 * `currency`, `select`, `multi-select`, or `checkbox`.  Automatically
 * resolves required/error states from the parent `NgControl` so that
 * reactive-form validation is reflected without any extra binding.
 *
 * ### Accessibility
 * - Generates unique IDs for the label and hint/error regions.
 * - Passes `aria-describedby`, `aria-required`, and `aria-disabled` to the
 *   underlying PrimeNG widget via passthrough (`pt`) objects.
 */
@Component({
  selector: 'app-form-input',
  imports: [Checkbox, DatePicker, InputText, MultiSelect, ReactiveFormsModule, Select, Textarea],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormInputComponent),
      multi: true,
    },
  ],
  templateUrl: './form-input.component.html',
  styleUrl: './form-input.component.scss',
  host: {
    '[attr.aria-disabled]': 'isDisabled() || null',
  },
})
export class FormInputComponent implements ControlValueAccessor, OnInit {
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly disabledByForms = signal(false);
  private readonly controlStateVersion = signal(0);
  private readonly generatedId = `form-input-${nextFormInputId++}`;
  private ngControl: NgControl | null = null;
  private currentValue: unknown = null;
  private onChange: (value: unknown) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  /** Visible label text rendered above the field. Required. */
  readonly label = input.required<string>();
  /** Explicit HTML `id` for the underlying input; auto-generated when omitted. */
  readonly inputId = input('');
  /** Determines which PrimeNG widget is rendered. Defaults to `'text'`. */
  readonly type = input<FormInputType>('text');
  /** Placeholder text passed to the underlying widget. */
  readonly placeholder = input('');
  /** Helper text displayed below the field when no error is active. */
  readonly helperText = input('');
  /** Per-instance overrides for validation error messages keyed by error token. */
  readonly validationMessages = input<Readonly<Record<string, string>>>({});
  /** Marks the field as required (adds asterisk). Automatically inferred from the parent control when not set. */
  readonly required = input(false);
  /** Disables the field regardless of the reactive form control state. */
  readonly disabled = input(false);
  /** Prevents value changes; the internal control reverts to the last written value on every change. */
  readonly readOnly = input(false);
  /** Options for `select` and `multi-select` input types. */
  readonly options = input<SelectOption[]>([]);
  /** Whether the select/multi-select widget shows a filter input. Defaults to `true`. */
  readonly filter = input(true);
  /** Comma-separated field names used for filtering select options. */
  readonly filterBy = input('name,id');
  /** Whether the select/multi-select widget shows a clear button. Defaults to `false`. */
  readonly showClear = input(false);

  protected readonly internalControl = new FormControl<unknown>(null);
  protected readonly controlId = computed(() => this.inputId() || this.generatedId);
  protected readonly labelId = computed(() => `${this.controlId()}-label`);
  protected readonly hintId = computed(() => `${this.controlId()}-hint`);
  protected readonly errorId = computed(() => `${this.controlId()}-error`);
  protected readonly isDisabled = computed(() => this.disabled() || this.disabledByForms());

  constructor() {
    this.internalControl.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
      if (this.readOnly()) {
        this.internalControl.setValue(this.currentValue, { emitEvent: false });
        return;
      }

      this.currentValue = value;
      this.onChange(value);
    });

    effect(() => {
      if (this.isDisabled()) {
        this.internalControl.disable({ emitEvent: false });
      } else {
        this.internalControl.enable({ emitEvent: false });
      }
    });
  }

  /**
   * Resolves the parent `NgControl` and subscribes to its control events so
   * that `isRequired` and `showError` are re-evaluated on each state change.
   */
  ngOnInit(): void {
    this.ngControl = this.injector.get(NgControl, null, { self: true });
    this.ngControl?.control?.events
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.controlStateVersion.update((version) => version + 1));
  }

  protected get isRequired(): boolean {
    this.controlStateVersion();
    const control = this.ngControl?.control;
    return Boolean(
      this.required() ||
      control?.hasValidator(Validators.required) ||
      control?.hasValidator(Validators.requiredTrue),
    );
  }

  protected get showError(): boolean {
    this.controlStateVersion();
    const control = this.ngControl?.control;
    return Boolean(control?.invalid && (control.touched || control.dirty));
  }

  protected get errorMessage(): string {
    return getValidationMessage(this.ngControl?.control?.errors ?? null, this.validationMessages());
  }

  protected get describedBy(): string | null {
    const ids = [
      this.helperText() ? this.hintId() : '',
      this.showError ? this.errorId() : '',
    ].filter(Boolean);
    return ids.length ? ids.join(' ') : null;
  }

  protected get controlAria(): Record<string, string | boolean | null> {
    return {
      'aria-describedby': this.describedBy,
      'aria-required': this.isRequired,
    };
  }

  protected get datePickerPt() {
    return { pcInputText: { root: this.controlAria } };
  }

  protected get selectPt() {
    return { root: this.controlAria };
  }

  protected get multiSelectPt() {
    return { root: this.controlAria };
  }

  protected get checkboxPt() {
    return { input: this.controlAria };
  }

  /** @inheritdoc */
  writeValue(value: unknown): void {
    this.currentValue = value;
    this.internalControl.setValue(value, { emitEvent: false });
  }

  /** @inheritdoc */
  registerOnChange(fn: (value: unknown) => void): void {
    this.onChange = fn;
  }

  /** @inheritdoc */
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  /** @inheritdoc — Syncs disabled state driven by the parent reactive form. */
  setDisabledState(isDisabled: boolean): void {
    this.disabledByForms.set(isDisabled);
  }

  protected markAsTouched(): void {
    this.onTouched();
  }
}
