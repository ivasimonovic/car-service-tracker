import { Component, inject, signal } from '@angular/core';
import { AbstractControl, ReactiveFormsModule, FormBuilder, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonContent,
  IonButton,
  IonItem,
  IonInput,
  IonInputPasswordToggle,
  IonIcon,
  IonText,
  IonSpinner,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { carSportOutline } from 'ionicons/icons';
import { firstFieldError } from '../../shared/form-errors';
import { AuthService } from '../auth.service';

const FIELD_MESSAGES: Record<string, Record<string, string>> = {
  displayName: { required: 'Ime i prezime su obavezni.', minlength: 'Unesite bar 2 karaktera.' },
  email: { required: 'Email je obavezan.', email: 'Unesite ispravnu email adresu.' },
  password: { required: 'Lozinka je obavezna.', minlength: 'Lozinka mora imati bar 6 karaktera.' },
  confirmPassword: { required: 'Potvrda lozinke je obavezna.' },
};

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password && confirmPassword && password !== confirmPassword ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  imports: [
    ReactiveFormsModule,
    RouterLink,
    IonContent,
    IonButton,
    IonItem,
    IonInput,
    IonInputPasswordToggle,
    IonIcon,
    IonText,
    IonSpinner,
  ],
})
export class RegisterPage {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group(
    {
      displayName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatchValidator },
  );

  constructor() {
    addIcons({ carSportOutline });
  }

  errorFor(field: string): string | null {
    const key = firstFieldError(this.form.get(field));
    return key ? (FIELD_MESSAGES[field]?.[key] ?? 'Neispravna vrednost.') : null;
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.isSubmitting.set(true);
    const { displayName, email, password } = this.form.getRawValue();

    try {
      await this.authService.register(email, password, displayName);
      await this.router.navigateByUrl('/tabs/vehicles');
    } catch (error) {
      this.errorMessage.set(this.authService.mapAuthError(error));
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
