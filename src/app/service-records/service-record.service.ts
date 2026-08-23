import { Injectable, inject } from '@angular/core';
import { get, onValue, push, ref, serverTimestamp, update } from 'firebase/database';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { database } from '../core/firebase';
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

  getServiceRecords$(vehicleId: string): Observable<ServiceRecord[]> {
    return new Observable<ServiceRecord[]>((subscriber) => {
      const userId = this.authService.currentUser?.uid;
      if (!userId) {
        subscriber.next([]);
        subscriber.complete();
        return;
      }

      const unsubscribe = onValue(
        ref(database, `serviceRecords/${userId}/${vehicleId}`),
        (snapshot) => {
          const value = snapshot.val() ?? {};
          const records = Object.entries(value).map(([id, data]) =>
            toServiceRecord(id, data as Record<string, unknown>),
          );
          subscriber.next(sortByDateDesc(records));
        },
        (error) => subscriber.error(error),
      );
      return unsubscribe;
    });
  }

  async getServiceRecordsForUser(): Promise<ServiceRecord[]> {
    const userId = this.authService.currentUser?.uid;
    if (!userId) return [];

    const snapshot = await get(ref(database, `serviceRecords/${userId}`));
    const byVehicle = (snapshot.val() ?? {}) as Record<string, Record<string, unknown>>;
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

    const snapshot = await get(ref(database, `serviceRecords/${userId}/${vehicleId}/${id}`));
    return snapshot.exists() ? toServiceRecord(id, snapshot.val()) : null;
  }

  async updateServiceRecord(vehicleId: string, id: string, input: ServiceRecordInput): Promise<void> {
    const userId = this.authService.currentUser?.uid;
    if (!userId) throw new Error('Korisnik nije prijavljen.');

    await update(ref(database, `serviceRecords/${userId}/${vehicleId}/${id}`), {
      ...input,
      date: input.date ? input.date.getTime() : Date.now(),
      updatedAt: serverTimestamp(),
    });
  }

  async deleteServiceRecord(vehicleId: string, id: string): Promise<void> {
    const userId = this.authService.currentUser?.uid;
    if (!userId) throw new Error('Korisnik nije prijavljen.');

    await update(ref(database), {
      [`serviceRecords/${userId}/${vehicleId}/${id}`]: null,
    });
  }

  async addCompleteService(input: ServiceRecordInput, items: ServiceItemInput[]): Promise<string> {
    const userId = this.authService.currentUser?.uid;
    if (!userId) throw new Error('Korisnik nije prijavljen.');

    const vehicleId = input.vehicleId;
    const vehicleSnap = await get(ref(database, `vehicles/${userId}/${vehicleId}/currentMileage`));
    const currentMileage: number = vehicleSnap.val() ?? 0;

    const totalPrice = items.reduce((sum, item) => sum + item.price, 0);
    const recordRef = push(ref(database, `serviceRecords/${userId}/${vehicleId}`));
    const recordId = recordRef.key as string;

    const itemsData: Record<string, ServiceItemInput> = {};
    for (const item of items) {
      const itemKey = push(ref(database, `serviceRecords/${userId}/${vehicleId}/${recordId}/items`)).key as string;
      itemsData[itemKey] = item;
    }

    const updates: Record<string, unknown> = {
      [`serviceRecords/${userId}/${vehicleId}/${recordId}`]: {
        ...input,
        totalPrice,
        date: input.date ? input.date.getTime() : Date.now(),
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        items: itemsData,
      },
    };

    if (input.mileage > currentMileage) {
      updates[`vehicles/${userId}/${vehicleId}/currentMileage`] = input.mileage;
      updates[`vehicles/${userId}/${vehicleId}/updatedAt`] = serverTimestamp();
    }

    await update(ref(database), updates);
    return recordId;
  }
}
