import { Injectable, inject } from '@angular/core';
import { get, onValue, push, ref, serverTimestamp, update } from 'firebase/database';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { database } from '../core/firebase';
import { Vehicle, VehicleInput } from '../models/vehicle.model';

function toVehicle(id: string, data: Record<string, unknown>): Vehicle {
  return {
    id,
    userId: data['userId'] as string,
    brand: data['brand'] as string,
    model: data['model'] as string,
    year: data['year'] as number,
    registrationNumber: data['registrationNumber'] as string,
    fuelType: data['fuelType'] as Vehicle['fuelType'],
    engine: data['engine'] as string,
    currentMileage: data['currentMileage'] as number,
    createdAt: data['createdAt'] ? new Date(data['createdAt'] as number) : null,
    updatedAt: data['updatedAt'] ? new Date(data['updatedAt'] as number) : null,
  };
}

function sortByCreatedDesc(vehicles: Vehicle[]): Vehicle[] {
  return vehicles.slice().sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
}

@Injectable({ providedIn: 'root' })
export class VehicleService {
  private readonly authService = inject(AuthService);

  getVehicles$(): Observable<Vehicle[]> {
    return new Observable<Vehicle[]>((subscriber) => {
      const userId = this.authService.currentUser?.uid;
      if (!userId) {
        subscriber.next([]);
        subscriber.complete();
        return;
      }

      const unsubscribe = onValue(
        ref(database, `vehicles/${userId}`),
        (snapshot) => {
          const value = snapshot.val() ?? {};
          const vehicles = Object.entries(value).map(([id, data]) => toVehicle(id, data as Record<string, unknown>));
          subscriber.next(sortByCreatedDesc(vehicles));
        },
        (error) => subscriber.error(error),
      );
      return unsubscribe;
    });
  }

  async getVehiclesOnce(): Promise<Vehicle[]> {
    const userId = this.authService.currentUser?.uid;
    if (!userId) return [];

    const snapshot = await get(ref(database, `vehicles/${userId}`));
    const value = snapshot.val() ?? {};
    return sortByCreatedDesc(
      Object.entries(value).map(([id, data]) => toVehicle(id, data as Record<string, unknown>)),
    );
  }

  async getVehicle(id: string): Promise<Vehicle | null> {
    const userId = this.authService.currentUser?.uid;
    if (!userId) return null;

    const snapshot = await get(ref(database, `vehicles/${userId}/${id}`));
    return snapshot.exists() ? toVehicle(id, snapshot.val()) : null;
  }

  getVehicleById$(id: string): Observable<Vehicle | null> {
    return new Observable<Vehicle | null>((subscriber) => {
      const userId = this.authService.currentUser?.uid;
      if (!userId) {
        subscriber.next(null);
        subscriber.complete();
        return;
      }

      const unsubscribe = onValue(
        ref(database, `vehicles/${userId}/${id}`),
        (snap) => subscriber.next(snap.exists() ? toVehicle(id, snap.val()) : null),
        (error) => subscriber.error(error),
      );
      return unsubscribe;
    });
  }

  async addVehicle(input: VehicleInput): Promise<string> {
    const userId = this.authService.currentUser?.uid;
    if (!userId) throw new Error('Korisnik nije prijavljen.');

    const newRef = push(ref(database, `vehicles/${userId}`));
    await update(newRef, {
      ...input,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return newRef.key as string;
  }

  async updateVehicle(id: string, input: VehicleInput): Promise<void> {
    const userId = this.authService.currentUser?.uid;
    if (!userId) throw new Error('Korisnik nije prijavljen.');

    await update(ref(database, `vehicles/${userId}/${id}`), {
      ...input,
      updatedAt: serverTimestamp(),
    });
  }

  async deleteVehicle(id: string): Promise<void> {
    const userId = this.authService.currentUser?.uid;
    if (!userId) throw new Error('Korisnik nije prijavljen.');

    await update(ref(database), {
      [`vehicles/${userId}/${id}`]: null,
      [`serviceRecords/${userId}/${id}`]: null,
    });
  }

  async updateMileage(id: string, mileage: number): Promise<void> {
    const userId = this.authService.currentUser?.uid;
    if (!userId) throw new Error('Korisnik nije prijavljen.');

    await update(ref(database, `vehicles/${userId}/${id}`), {
      currentMileage: mileage,
      updatedAt: serverTimestamp(),
    });
  }
}
