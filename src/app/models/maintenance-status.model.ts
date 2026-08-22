export type MaintenanceLevel = 'green' | 'yellow' | 'red';

export interface MaintenanceStatus {
  itemName: string;
  lastMileage: number;
  nextDueMileage: number;
  remainingKm: number;
  level: MaintenanceLevel;
}
