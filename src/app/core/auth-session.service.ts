import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, filter, firstValueFrom, map, take } from 'rxjs';
import { environment } from '../../environments/environment';
import { AppUser } from '../models/app-user.model';

const STORAGE_KEY = 'car-service-tracker-auth';
const API_KEY = environment.firebaseConfig.apiKey;
const IDENTITY_BASE = 'https://identitytoolkit.googleapis.com/v1';
const TOKEN_BASE = 'https://securetoken.googleapis.com/v1';

interface StoredSession {
  uid: string;
  email: string | null;
  displayName: string | null;
  idToken: string;
  refreshToken: string;
  expiresAt: number;
}

interface IdentityAuthResponse {
  localId: string;
  email: string;
  displayName?: string;
  idToken: string;
  refreshToken: string;
  expiresIn: string;
}

interface RefreshResponse {
  id_token: string;
  refresh_token: string;
  expires_in: string;
}

function toAppUser(session: StoredSession | null): AppUser | null {
  if (!session) return null;
  return { uid: session.uid, email: session.email, displayName: session.displayName };
}

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly http = inject(HttpClient);
  private session: StoredSession | null = this.readStorage();
  private refreshInFlight: Promise<string | null> | null = null;

  private readonly _currentUser = new BehaviorSubject<AppUser | null | undefined>(toAppUser(this.session));

  readonly currentUser$: Observable<AppUser | null | undefined> = this._currentUser.asObservable();

  readonly authReady$: Observable<AppUser | null> = this._currentUser.pipe(
    filter((user): user is AppUser | null => user !== undefined),
    take(1),
  );

  readonly isReady$: Observable<boolean> = this._currentUser.pipe(map((user) => user !== undefined));

  get currentUser(): AppUser | null {
    return toAppUser(this.session);
  }

  private readStorage(): StoredSession | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as StoredSession) : null;
    } catch {
      return null;
    }
  }

  private writeStorage(): void {
    if (this.session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.session));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  private applyAuthResponse(data: IdentityAuthResponse, displayNameOverride?: string): void {
    this.session = {
      uid: data.localId,
      email: data.email ?? null,
      displayName: displayNameOverride ?? data.displayName ?? null,
      idToken: data.idToken,
      refreshToken: data.refreshToken,
      expiresAt: Date.now() + Number(data.expiresIn) * 1000,
    };
    this.writeStorage();
    this._currentUser.next(toAppUser(this.session));
  }

  async signUp(email: string, password: string): Promise<void> {
    const data = await firstValueFrom(
      this.http.post<IdentityAuthResponse>(`${IDENTITY_BASE}/accounts:signUp?key=${API_KEY}`, {
        email,
        password,
        returnSecureToken: true,
      }),
    );
    this.applyAuthResponse(data);
  }

  async signIn(email: string, password: string): Promise<void> {
    const data = await firstValueFrom(
      this.http.post<IdentityAuthResponse>(`${IDENTITY_BASE}/accounts:signInWithPassword?key=${API_KEY}`, {
        email,
        password,
        returnSecureToken: true,
      }),
    );
    this.applyAuthResponse(data);
  }

  async updateDisplayName(displayName: string): Promise<void> {
    if (!this.session) throw new Error('Korisnik nije prijavljen.');

    const data = await firstValueFrom(
      this.http.post<IdentityAuthResponse>(`${IDENTITY_BASE}/accounts:update?key=${API_KEY}`, {
        idToken: this.session.idToken,
        displayName,
        returnSecureToken: true,
      }),
    );
    this.applyAuthResponse(data, displayName);
  }

  clear(): void {
    this.session = null;
    this.writeStorage();
    this._currentUser.next(null);
  }

  async getIdToken(forceRefresh = false): Promise<string | null> {
    if (!this.session) return null;

    const isExpiring = Date.now() > this.session.expiresAt - 60_000;
    if (!forceRefresh && !isExpiring) return this.session.idToken;

    if (!this.refreshInFlight) {
      this.refreshInFlight = this.refreshToken().finally(() => {
        this.refreshInFlight = null;
      });
    }
    return this.refreshInFlight;
  }

  private async refreshToken(): Promise<string | null> {
    if (!this.session) return null;

    try {
      const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.session.refreshToken,
      }).toString();

      const data = await firstValueFrom(
        this.http.post<RefreshResponse>(`${TOKEN_BASE}/token?key=${API_KEY}`, body, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }),
      );

      this.session = {
        ...this.session,
        idToken: data.id_token,
        refreshToken: data.refresh_token,
        expiresAt: Date.now() + Number(data.expires_in) * 1000,
      };
      this.writeStorage();
      return this.session.idToken;
    } catch (error) {
      this.clear();
      throw error;
    }
  }
}
