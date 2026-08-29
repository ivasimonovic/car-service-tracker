import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthSessionService } from '../core/auth-session.service';
import { RtdbService, SERVER_TIMESTAMP } from '../core/rtdb.service';
import { AppUser } from '../models/app-user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly session = inject(AuthSessionService);
  private readonly rtdb = inject(RtdbService);

  readonly currentUser$: Observable<AppUser | null | undefined> = this.session.currentUser$;
  readonly authReady$: Observable<AppUser | null> = this.session.authReady$;
  readonly isReady$: Observable<boolean> = this.session.isReady$;

  get currentUser(): AppUser | null {
    return this.session.currentUser;
  }

  get isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  async register(email: string, password: string, displayName: string): Promise<void> {
    await this.session.signUp(email, password);
    await this.session.updateDisplayName(displayName);

    const user = this.session.currentUser;
    if (!user) throw new Error('Registracija nije uspela.');

    await this.rtdb.put(`users/${user.uid}`, {
      uid: user.uid,
      email: user.email,
      displayName,
      createdAt: SERVER_TIMESTAMP,
    });
  }

  async logIn(email: string, password: string): Promise<void> {
    await this.session.signIn(email, password);
  }

  async logOut(): Promise<void> {
    this.session.clear();
  }

  getIdToken(forceRefresh = false): Promise<string | null> {
    return this.session.getIdToken(forceRefresh);
  }

  mapAuthError(error: unknown): string {
    const message = (error as HttpErrorResponse)?.error?.error?.message ?? '';

    if (typeof message === 'string' && message.startsWith('WEAK_PASSWORD')) {
      return 'Lozinka mora imati bar 6 karaktera.';
    }

    switch (message) {
      case 'EMAIL_EXISTS':
        return 'Nalog sa ovom email adresom već postoji.';
      case 'EMAIL_NOT_FOUND':
      case 'INVALID_PASSWORD':
      case 'INVALID_LOGIN_CREDENTIALS':
        return 'Neispravan email ili lozinka.';
      case 'INVALID_EMAIL':
        return 'Email adresa nije ispravna.';
      case 'TOO_MANY_ATTEMPTS_TRY_LATER':
        return 'Previše neuspešnih pokušaja. Pokušajte ponovo kasnije.';
      default:
        return 'Došlo je do greške. Pokušajte ponovo.';
    }
  }
}
