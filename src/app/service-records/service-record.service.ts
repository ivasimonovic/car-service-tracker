import { Injectable, inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { RtdbService, SERVER_TIMESTAMP } from '../core/rtdb.service';
import { ServiceItem, ServiceItemInput, ServiceRecord, ServiceRecordInput } from '../models/service-record.model';

function toServiceItems(raw: Record<string, unknown> | undefined): ServiceItem[] {
  if (!raw) return [];
  return Object.entries(raw).map(([id, value]) => {
    const data = value as Record<string, unknown>;
    return {
      id,
      name: data['name'] as string,
      price: data['price'] as number,
      replacementIntervalKm: data['replacementIntervalKm'] as number,
    };
  });
}

function toServiceRecord(id: string, data: Record<string, unknown>): ServiceRecord {
  return {
    id,
    vehicleId: data['vehicleId'] as string,
    userId: data['userId'] as string,
    date: data['date'] ? new Date(data['date'] as number) : null,
    mileage: data['mileage'] as number,
    serviceType: data['serviceType'] as string,
    note: (data['note'] as string) ?? '',
    totalPrice: data['totalPrice'] as number,
    createdAt: data['createdAt'] ? new Date(data['createdAt'] as number) : null,
    updatedAt: data['updatedAt'] ? new Date(data['updatedAt'] as number) : null,
    items: toServiceItems(data['items'] as Record<string, unknown> | undefined),
  };
}

function sortByDateDesc(records: ServiceRecord[]): ServiceRecord[] {
  return records.slice().sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));
}

@Injectable({ providedIn: 'root' })
export class ServiceRecordService {
  private readonly authService = inject(AuthService);
  private readonly rtdb = inject(RtdbService);

  async getServiceRecords(vehicleId: string): Promise<ServiceRecord[]> {
    const userId = this.authService.currentUser?.uid;
    if (!userId) return [];

    const value = (await this.rtdb.get<Record<string, Record<string, unknown>>>(
      `serviceRecords/${userId}/${vehicleId}`,
    )) ?? {};
    const records = Object.entries(value).map(([id, data]) => toServiceRecord(id, data));
    return sortByDateDesc(records);
  }

  async getServiceRecordsForUser(): Promise<ServiceRecord[]> {
    const userId = this.authService.currentUser?.uid;
    if (!userId) return [];

    const byVehicle =
      (await this.rtdb.get<Record<string, Record<string, unknown>>>(`serviceRecords/${userId}`)) ?? {};
    const records: ServiceRecord[] = [];
    for (const vehicleRecords of Object.values(byVehicle)) {
      for (const [id, data] of Object.entries(vehicleRecords)) {
        records.push(toServiceRecord(id, data as Record<string, unknown>));
      }
    }
    return records;
  }

  async getServiceRecord(vehicleId: string, id: string): Promise<ServiceRecord | null> {
    const userId = this.authService.currentUser?.uid;
    if (!userId) return null;

    const data = await this.rtdb.get<Record<string, unknown>>(`serviceRecords/${userId}/${vehicleId}/${id}`);
    return data ? toServiceRecord(id, data) : null;
  }

  async updateServiceRecord(vehicleId: string, id: string, input: ServiceRecordInput): Promise<void> {
    const userId = this.authService.currentUser?.uid;
    if (!userId) throw new Error('Korisnik nije prijavljen.');

    await this.rtdb.patch(`serviceRecords/${userId}/${vehicleId}/${id}`, {
      ...input,
      date: input.date ? input.date.getTime() : Date.now(),
      updatedAt: SERVER_TIMESTAMP,
    });
  }

  async deleteServiceRecord(vehicleId: string, id: string): Promise<void> {
    const userId = this.authService.currentUser?.uid;
    if (!userId) throw new Error('Korisnik nije prijavljen.');

    await this.rtdb.patch('', {
      [`serviceRecords/${userId}/${vehicleId}/${id}`]: null,
    });
  }

  async addCompleteService(input: ServiceRecordInput, items: ServiceItemInput[]): Promise<string> {
    const userId = this.authService.currentUser?.uid;
    if (!userId) throw new Error('Korisnik nije prijavljen.');

    const vehicleId = input.vehicleId;
    const currentMileage =
      (await this.rtdb.get<number>(`vehicles/${userId}/${vehicleId}/currentMileage`)) ?? 0;

    const totalPrice = items.reduce((sum, item) => sum + item.price, 0);
    const recordId = this.rtdb.newKey();

    const itemsData: Record<string, ServiceItemInput> = {};
    for (const item of items) {
      itemsData[this.rtdb.newKey()] = item;
    }

    const updates: Record<string, unknown> = {
      [`serviceRecords/${userId}/${vehicleId}/${recordId}`]: {
        ...input,
        totalPrice,
        date: input.date ? input.date.getTime() : Date.now(),
        userId,
        createdAt: SERVER_TIMESTAMP,
        updatedAt: SERVER_TIMESTAMP,
        items: itemsData,
      },
    };

    if (input.mileage > currentMileage) {
      updates[`vehicles/${userId}/${vehicleId}/currentMileage`] = input.mileage;
      updates[`vehicles/${userId}/${vehicleId}/updatedAt`] = SERVER_TIMESTAMP;
    }

    await this.rtdb.patch('', updates);
    return recordId;
  }
}
