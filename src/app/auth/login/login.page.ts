import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
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
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
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
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor() {
    addIcons({ carSportOutline });
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.isSubmitting.set(true);
    const { email, password } = this.form.getRawValue();

    try {
      await this.authService.logIn(email, password);
      await this.router.navigateByUrl('/vehicles');
    } catch (error) {
      this.errorMessage.set(this.authService.mapAuthError(error));
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
