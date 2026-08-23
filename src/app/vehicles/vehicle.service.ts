import { Injectable, inject } from '@angular/core';
import {
  DocumentData,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { firestore } from '../core/firebase';
import { Vehicle, VehicleInput } from '../models/vehicle.model';

const VEHICLES_COLLECTION = 'vehicles';

function toVehicle(id: string, data: DocumentData): Vehicle {
  return {
    id,
    userId: data['userId'],
    brand: data['brand'],
    model: data['model'],
    year: data['year'],
    registrationNumber: data['registrationNumber'],
    fuelType: data['fuelType'],
    engine: data['engine'],
    currentMileage: data['currentMileage'],
    createdAt: data['createdAt']?.toDate() ?? null,
    updatedAt: data['updatedAt']?.toDate() ?? null,
  };
}

@Injectable({ providedIn: 'root' })
export class VehicleService {
  private readonly authService = inject(AuthService);

  /** Vozila trenutno prijavljenog korisnika, uživo (real-time). */
  getVehicles$(): Observable<Vehicle[]> {
    return new Observable<Vehicle[]>((subscriber) => {
      const userId = this.authService.currentUser?.uid;
      if (!userId) {
        subscriber.next([]);
        subscriber.complete();
        return;
      }

      const vehiclesQuery = query(
        collection(firestore, VEHICLES_COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
      );

      return onSnapshot(
        vehiclesQuery,
        (snapshot) => subscriber.next(snapshot.docs.map((docSnap) => toVehicle(docSnap.id, docSnap.data()))),
        (error) => subscriber.error(error),
      );
    });
  }

  /** Sva vozila trenutnog korisnika, jednokratno (za statistiku, bez uživo pretplate). */
  async getVehiclesOnce(): Promise<Vehicle[]> {
    const userId = this.authService.currentUser?.uid;
    if (!userId) return [];

    const snapshot = await getDocs(query(collection(firestore, VEHICLES_COLLECTION), where('userId', '==', userId)));
    return snapshot.docs.map((docSnap) => toVehicle(docSnap.id, docSnap.data()));
  }

  async getVehicle(id: string): Promise<Vehicle | null> {
    const snapshot = await getDoc(doc(firestore, VEHICLES_COLLECTION, id));
    return snapshot.exists() ? toVehicle(snapshot.id, snapshot.data()) : null;
  }

  /** Jedno vozilo, uživo (real-time) - za Dashboard ekran. */
  getVehicleById$(id: string): Observable<Vehicle | null> {
    return new Observable<Vehicle | null>((subscriber) =>
      onSnapshot(
        doc(firestore, VEHICLES_COLLECTION, id),
        (snap) => subscriber.next(snap.exists() ? toVehicle(snap.id, snap.data()) : null),
        (error) => subscriber.error(error),
      ),
    );
  }

  async addVehicle(input: VehicleInput): Promise<string> {
    const userId = this.authService.currentUser?.uid;
    if (!userId) throw new Error('Korisnik nije prijavljen.');

    const docRef = await addDoc(collection(firestore, VEHICLES_COLLECTION), {
      ...input,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  }

  async updateVehicle(id: string, input: VehicleInput): Promise<void> {
    await updateDoc(doc(firestore, VEHICLES_COLLECTION, id), {
      ...input,
      updatedAt: serverTimestamp(),
    });
  }

  async deleteVehicle(id: string): Promise<void> {
    await deleteDoc(doc(firestore, VEHICLES_COLLECTION, id));
  }

  async updateMileage(id: string, mileage: number): Promise<void> {
    await updateDoc(doc(firestore, VEHICLES_COLLECTION, id), {
      currentMileage: mileage,
      updatedAt: serverTimestamp(),
    });
  }
}
