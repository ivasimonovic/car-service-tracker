import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthSessionService } from './auth-session.service';

export const SERVER_TIMESTAMP = { '.sv': 'timestamp' };

const PUSH_CHARS = '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz';
let lastPushTime = 0;
const lastRandChars: number[] = [];

function generatePushId(): string {
  let now = Date.now();
  const duplicateTime = now === lastPushTime;
  lastPushTime = now;

  const timeStampChars = new Array<string>(8);
  for (let i = 7; i >= 0; i--) {
    timeStampChars[i] = PUSH_CHARS.charAt(now % 64);
    now = Math.floor(now / 64);
  }

  let id = timeStampChars.join('');

  if (!duplicateTime) {
    for (let i = 0; i < 12; i++) {
      lastRandChars[i] = Math.floor(Math.random() * 64);
    }
  } else {
    let i = 11;
    for (; i >= 0 && lastRandChars[i] === 63; i--) {
      lastRandChars[i] = 0;
    }
    lastRandChars[i]++;
  }

  for (let i = 0; i < 12; i++) {
    id += PUSH_CHARS.charAt(lastRandChars[i]);
  }

  return id;
}

@Injectable({ providedIn: 'root' })
export class RtdbService {
  private readonly http = inject(HttpClient);
  private readonly session = inject(AuthSessionService);
  private readonly baseUrl = environment.firebaseConfig.databaseURL;

  private async urlFor(path: string): Promise<string> {
    const token = await this.session.getIdToken();
    const authParam = token ? `?auth=${encodeURIComponent(token)}` : '';
    return `${this.baseUrl}/${path}.json${authParam}`;
  }

  async get<T>(path: string): Promise<T | null> {
    const url = await this.urlFor(path);
    return firstValueFrom(this.http.get<T | null>(url));
  }

  async put(path: string, data: unknown): Promise<void> {
    const url = await this.urlFor(path);
    await firstValueFrom(this.http.put(url, data));
  }

  async patch(path: string, data: unknown): Promise<void> {
    const url = await this.urlFor(path);
    await firstValueFrom(this.http.patch(url, data));
  }

  newKey(): string {
    return generatePushId();
  }
}
