import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormInputComponent } from './form-input.component';
import { FORM_VALIDATORS } from './form-input.validators';

@Component({
  imports: [FormInputComponent, ReactiveFormsModule],
  template: `
    <app-form-input
      label="Claim amount"
      type="money"
      helperText="Use two decimal places."
      [formControl]="control"
      [readOnly]="readOnly()"
    />
  `,
})
class TestHostComponent {
  readonly control = new FormControl('001250.00', {
    nonNullable: true,
    validators: [FORM_VALIDATORS.required, FORM_VALIDATORS.money],
  });
  readonly readOnly = signal(false);
}

describe('FormInputComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('works as a ControlValueAccessor and preserves money as a string', () => {
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('001250.00');

    input.value = '000045.60';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(host.control.value).toBe('000045.60');
    expect(typeof host.control.value).toBe('string');
  });

  it('connects its visible label and helper text to the control', () => {
    const label = fixture.nativeElement.querySelector('label') as HTMLLabelElement;
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const hint = fixture.nativeElement.querySelector('.form-input__hint') as HTMLElement;

    expect(label.htmlFor).toBe(input.id);
    expect(input.getAttribute('aria-describedby')).toContain(hint.id);
    expect(input.getAttribute('aria-required')).toBe('true');
  });

  it('displays and associates validation errors after the control is touched', () => {
    host.control.setValue('invalid amount');
    host.control.markAsTouched();
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const error = fixture.nativeElement.querySelector('.form-input__error') as HTMLElement;
    expect(error.textContent).toContain('Enter a valid format.');
    expect(input.getAttribute('aria-describedby')).toContain(error.id);
  });

  it('reflects disabled and read-only states', () => {
    host.control.disable();
    fixture.detectChanges();
    let input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.disabled).toBe(true);

    host.control.enable();
    host.readOnly.set(true);
    fixture.detectChanges();
    input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(input.readOnly).toBe(true);
  });
});
