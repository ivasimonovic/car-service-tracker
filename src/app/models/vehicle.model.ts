export type FuelType = 'benzin' | 'dizel' | 'hibrid' | 'električni' | 'gas';

export interface Vehicle {
  id: string;
  userId: string;
  brand: string;
  model: string;
  year: number;
  registrationNumber: string;
  fuelType: FuelType;
  engine: string;
  currentMileage: number;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export type VehicleInput = Omit<Vehicle, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
