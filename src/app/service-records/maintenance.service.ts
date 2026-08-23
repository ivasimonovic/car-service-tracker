import { Injectable, inject } from '@angular/core';
import { MaintenanceLevel, MaintenanceStatus } from '../models/maintenance-status.model';
import { ServiceRecord } from '../models/service-record.model';
import { ServiceRecordService } from './service-record.service';

const YELLOW_THRESHOLD_KM = 1000;

@Injectable({ providedIn: 'root' })
export class MaintenanceService {
  private readonly serviceRecordService = inject(ServiceRecordService);

  async getMaintenanceStatus(currentMileage: number, records: ServiceRecord[]): Promise<MaintenanceStatus[]> {
    const itemsByRecord = await Promise.all(
      records.map((record) => this.serviceRecordService.getServiceItems(record.id)),
    );

    const lastSeen = new Map<string, { mileage: number; intervalKm: number }>();
    records.forEach((record, index) => {
      for (const item of itemsByRecord[index]) {
        if (!lastSeen.has(item.name)) {
          lastSeen.set(item.name, { mileage: record.mileage, intervalKm: item.replacementIntervalKm });
        }
      }
    });

    return Array.from(lastSeen.entries())
      .map(([itemName, { mileage, intervalKm }]) => {
        const nextDueMileage = mileage + intervalKm;
        const remainingKm = nextDueMileage - currentMileage;
        const level: MaintenanceLevel = remainingKm <= 0 ? 'red' : remainingKm <= YELLOW_THRESHOLD_KM ? 'yellow' : 'green';
        return { itemName, lastMileage: mileage, nextDueMileage, remainingKm, level };
      })
      .sort((a, b) => a.remainingKm - b.remainingKm);
  }
}
