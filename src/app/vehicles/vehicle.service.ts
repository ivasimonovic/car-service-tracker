import { Injectable, inject } from '@angular/core';
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

  async getVehicles(): Promise<Vehicle[]> {
    const userId = this.authService.currentUser?.uid;
    if (!userId) return [];

    const value = (await this.rtdb.get<Record<string, Record<string, unknown>>>(`vehicles/${userId}`)) ?? {};
    return sortByCreatedDesc(Object.entries(value).map(([id, data]) => toVehicle(id, data)));
  }

  async getVehicle(id: string): Promise<Vehicle | null> {
    const userId = this.authService.currentUser?.uid;
    if (!userId) return null;

    const data = await this.rtdb.get<Record<string, unknown>>(`vehicles/${userId}/${id}`);
    return data ? toVehicle(id, data) : null;
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
    return id;
  }

  async updateVehicle(id: string, input: VehicleInput): Promise<void> {
    const userId = this.authService.currentUser?.uid;
    if (!userId) throw new Error('Korisnik nije prijavljen.');

    await this.rtdb.patch(`vehicles/${userId}/${id}`, {
      ...input,
      updatedAt: SERVER_TIMESTAMP,
    });
  }

  async deleteVehicle(id: string): Promise<void> {
    const userId = this.authService.currentUser?.uid;
    if (!userId) throw new Error('Korisnik nije prijavljen.');

    await this.rtdb.patch('', {
      [`vehicles/${userId}/${id}`]: null,
      [`serviceRecords/${userId}/${id}`]: null,
    });
  }

  async updateMileage(id: string, mileage: number): Promise<void> {
    const userId = this.authService.currentUser?.uid;
    if (!userId) throw new Error('Korisnik nije prijavljen.');

    await this.rtdb.patch(`vehicles/${userId}/${id}`, {
      currentMileage: mileage,
      updatedAt: SERVER_TIMESTAMP,
    });
  }
}
