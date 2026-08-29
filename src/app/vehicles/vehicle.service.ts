import { Injectable, inject, signal } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { RtdbService, SERVER_TIMESTAMP } from '../core/rtdb.service';
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
  private readonly rtdb = inject(RtdbService);

  /**
   * Shared, always-current list kept in sync locally on every mutation, so pages
   * that read it show the correct data immediately without waiting on a network
   * refetch (which may lag behind a write it was issued right after).
   */
  readonly vehicles = signal<Vehicle[]>([]);

  async loadVehicles(): Promise<Vehicle[]> {
    const userId = this.authService.currentUser?.uid;
    if (!userId) {
      this.vehicles.set([]);
      return [];
    }

    const value = (await this.rtdb.get<Record<string, Record<string, unknown>>>(`vehicles/${userId}`)) ?? {};
    const vehicles = sortByCreatedDesc(Object.entries(value).map(([id, data]) => toVehicle(id, data)));
    this.vehicles.set(vehicles);
    return vehicles;
  }

  async getVehicle(id: string): Promise<Vehicle | null> {
    const userId = this.authService.currentUser?.uid;
    if (!userId) return null;

    const data = await this.rtdb.get<Record<string, unknown>>(`vehicles/${userId}/${id}`);
    const vehicle = data ? toVehicle(id, data) : null;
    if (vehicle) {
      this.vehicles.update((list) =>
        list.some((v) => v.id === id) ? list.map((v) => (v.id === id ? vehicle : v)) : list,
      );
    }
    return vehicle;
  }

  async addVehicle(input: VehicleInput): Promise<string> {
    const userId = this.authService.currentUser?.uid;
    if (!userId) throw new Error('Korisnik nije prijavljen.');

    const id = this.rtdb.newKey();
    await this.rtdb.put(`vehicles/${userId}/${id}`, {
      ...input,
      userId,
      createdAt: SERVER_TIMESTAMP,
      updatedAt: SERVER_TIMESTAMP,
    });

    const now = new Date();
    const vehicle: Vehicle = { id, userId, ...input, createdAt: now, updatedAt: now };
    this.vehicles.update((list) => sortByCreatedDesc([vehicle, ...list]));
    return id;
  }

  async updateVehicle(id: string, input: VehicleInput): Promise<void> {
    const userId = this.authService.currentUser?.uid;
    if (!userId) throw new Error('Korisnik nije prijavljen.');

    await this.rtdb.patch(`vehicles/${userId}/${id}`, {
      ...input,
      updatedAt: SERVER_TIMESTAMP,
    });

    const now = new Date();
    this.vehicles.update((list) => list.map((v) => (v.id === id ? { ...v, ...input, updatedAt: now } : v)));
  }

  async deleteVehicle(id: string): Promise<void> {
    const userId = this.authService.currentUser?.uid;
    if (!userId) throw new Error('Korisnik nije prijavljen.');

    await this.rtdb.patch('', {
      [`vehicles/${userId}/${id}`]: null,
      [`serviceRecords/${userId}/${id}`]: null,
    });

    this.vehicles.update((list) => list.filter((v) => v.id !== id));
  }

  async updateMileage(id: string, mileage: number): Promise<void> {
    const userId = this.authService.currentUser?.uid;
    if (!userId) throw new Error('Korisnik nije prijavljen.');

    await this.rtdb.patch(`vehicles/${userId}/${id}`, {
      currentMileage: mileage,
      updatedAt: SERVER_TIMESTAMP,
    });

    const now = new Date();
    this.vehicles.update((list) =>
      list.map((v) => (v.id === id ? { ...v, currentMileage: mileage, updatedAt: now } : v)),
    );
  }
}
