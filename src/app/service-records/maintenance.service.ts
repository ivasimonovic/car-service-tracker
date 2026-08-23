import { Injectable } from '@angular/core';
import { MaintenanceLevel, MaintenanceStatus } from '../models/maintenance-status.model';
import { ServiceRecord } from '../models/service-record.model';

const YELLOW_THRESHOLD_KM = 1000;

@Injectable({ providedIn: 'root' })
export class MaintenanceService {
  getMaintenanceStatus(currentMileage: number, records: ServiceRecord[]): MaintenanceStatus[] {
    const lastSeen = new Map<string, { mileage: number; intervalKm: number }>();
    for (const record of records) {
      for (const item of record.items) {
        if (!lastSeen.has(item.name)) {
          lastSeen.set(item.name, { mileage: record.mileage, intervalKm: item.replacementIntervalKm });
        }
      }
    }

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
