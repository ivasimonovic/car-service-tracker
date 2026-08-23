import { Injectable, inject } from '@angular/core';
import { MaintenanceStatus } from '../models/maintenance-status.model';
import { ServiceRecord } from '../models/service-record.model';
import { Vehicle } from '../models/vehicle.model';
import { MaintenanceService } from '../service-records/maintenance.service';
import { ServiceRecordService } from '../service-records/service-record.service';
import { VehicleService } from '../vehicles/vehicle.service';

export interface VehicleSpending {
  vehicle: Vehicle;
  totalSpent: number;
  serviceCount: number;
}

export interface UpcomingMaintenance {
  vehicle: Vehicle;
  status: MaintenanceStatus;
}

export interface StatsOverview {
  totalSpent: number;
  totalServices: number;
  vehicleSpending: VehicleSpending[];
  upcoming: UpcomingMaintenance[];
}

@Injectable({ providedIn: 'root' })
export class StatsService {
  private readonly vehicleService = inject(VehicleService);
  private readonly serviceRecordService = inject(ServiceRecordService);
  private readonly maintenanceService = inject(MaintenanceService);

  async getOverview(): Promise<StatsOverview> {
    const [vehicles, records] = await Promise.all([
      this.vehicleService.getVehiclesOnce(),
      this.serviceRecordService.getServiceRecordsForUser(),
    ]);

    const recordsByVehicle = new Map<string, ServiceRecord[]>();
    for (const record of records) {
      const list = recordsByVehicle.get(record.vehicleId) ?? [];
      list.push(record);
      recordsByVehicle.set(record.vehicleId, list);
    }

    const vehicleSpending: VehicleSpending[] = vehicles
      .map((vehicle) => {
        const vehicleRecords = recordsByVehicle.get(vehicle.id) ?? [];
        return {
          vehicle,
          totalSpent: vehicleRecords.reduce((sum, record) => sum + record.totalPrice, 0),
          serviceCount: vehicleRecords.length,
        };
      })
      .sort((a, b) => b.totalSpent - a.totalSpent);

    const upcoming = vehicles
      .flatMap((vehicle) => {
        const vehicleRecords = (recordsByVehicle.get(vehicle.id) ?? [])
          .slice()
          .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));
        return this.maintenanceService
          .getMaintenanceStatus(vehicle.currentMileage, vehicleRecords)
          .filter((status) => status.level !== 'green')
          .map((status): UpcomingMaintenance => ({ vehicle, status }));
      })
      .sort((a, b) => a.status.remainingKm - b.status.remainingKm);

    return {
      totalSpent: vehicleSpending.reduce((sum, entry) => sum + entry.totalSpent, 0),
      totalServices: records.length,
      vehicleSpending,
      upcoming,
    };
  }
}
