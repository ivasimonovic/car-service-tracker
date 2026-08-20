import { Injectable } from '@angular/core';
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { BehaviorSubject, Observable, filter, map, take } from 'rxjs';
import { auth, firestore } from '../core/firebase';
import { AppUser } from '../models/app-user.model';

function toAppUser(user: User | null): AppUser | null {
  if (!user) return null;
  return { uid: user.uid, email: user.email, displayName: user.displayName };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  // undefined = Firebase još nije obavestio o stanju prijave, null = neprijavljen korisnik
  private readonly _currentUser = new BehaviorSubject<AppUser | null | undefined>(undefined);

  readonly currentUser$: Observable<AppUser | null | undefined> = this._currentUser.asObservable();

  /** Emituje tačno jednom, pošto Firebase potvrdi (ne)postojanje prijavljenog korisnika. */
  readonly authReady$: Observable<AppUser | null> = this._currentUser.pipe(
    filter((user): user is AppUser | null => user !== undefined),
    take(1),
  );

  /** true kada je Firebase prvi put potvrdio stanje prijave (za splash/loading ekran). */
  readonly isReady$: Observable<boolean> = this._currentUser.pipe(map((user) => user !== undefined));

  constructor() {
    onAuthStateChanged(auth, (user) => {
      this._currentUser.next(toAppUser(user));
    });
  }

  get currentUser(): AppUser | null {
    const value = this._currentUser.value;
    return value === undefined ? null : value;
  }

  get isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  async register(email: string, password: string, displayName: string): Promise<void> {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName });

    await setDoc(doc(firestore, 'users', credential.user.uid), {
      uid: credential.user.uid,
      email: credential.user.email,
      displayName,
      createdAt: serverTimestamp(),
    });

    this._currentUser.next(toAppUser(credential.user));
  }

  async logIn(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async logOut(): Promise<void> {
    await signOut(auth);
  }

  /** Firebase ID token (JWT) trenutno prijavljenog korisnika. */
  getIdToken(forceRefresh = false): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) return Promise.resolve(null);
    return user.getIdToken(forceRefresh);
  }

  mapAuthError(error: unknown): string {
    const code = (error as { code?: string })?.code ?? '';

    switch (code) {
      case 'auth/invalid-email':
        return 'Email adresa nije ispravna.';
      case 'auth/email-already-in-use':
        return 'Nalog sa ovom email adresom već postoji.';
      case 'auth/weak-password':
        return 'Lozinka mora imati bar 6 karaktera.';
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Neispravan email ili lozinka.';
      case 'auth/too-many-requests':
        return 'Previše neuspešnih pokušaja. Pokušajte ponovo kasnije.';
      default:
        return 'Došlo je do greške. Pokušajte ponovo.';
    }
  }
}
