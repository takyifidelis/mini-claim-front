import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { LoginPageComponent } from './login-page.component';

describe('LoginPageComponent', () => {
  let component: LoginPageComponent;
  let fixture: ComponentFixture<LoginPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should keep the user on the login page when the form is invalid', () => {
    component.login();
    fixture.detectChanges();

    expect(component.form.touched).toBe(true);
    const errors = fixture.nativeElement.querySelectorAll('.form-input__error');
    expect(errors).toHaveLength(2);
    expect(errors[0].textContent).toContain('This field is required.');
    expect(errors[1].textContent).toContain('This field is required.');
  });
});
