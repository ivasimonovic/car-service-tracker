import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonHeader, IonIcon, IonSpinner, IonText, IonTitle, IonToolbar, ViewWillEnter } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { carSportOutline, cashOutline, checkmarkCircleOutline, constructOutline } from 'ionicons/icons';
import { StatsOverview, StatsService } from './stats.service';

@Component({
  selector: 'app-stats',
  templateUrl: './stats.page.html',
  styleUrls: ['./stats.page.scss'],
  imports: [DecimalPipe, RouterLink, IonContent, IonHeader, IonToolbar, IonTitle, IonIcon, IonSpinner, IonText],
})
export class StatsPage implements ViewWillEnter {
  private readonly statsService = inject(StatsService);

  readonly overview = signal<StatsOverview | null>(null);
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);

  constructor() {
    addIcons({ cashOutline, constructOutline, checkmarkCircleOutline, carSportOutline });
  }

  ionViewWillEnter(): void {
    this.isLoading.set(true);
    this.loadError.set(null);
    this.statsService
      .getOverview()
      .then((overview) => this.overview.set(overview))
      .catch((error) => {
        console.error('Greška pri učitavanju statistike', error);
        this.loadError.set(`Greška pri učitavanju statistike (${error.code ?? error.message}).`);
      })
      .finally(() => this.isLoading.set(false));
  }

  maxSpent(overview: StatsOverview): number {
    return Math.max(1, ...overview.vehicleSpending.map((entry) => entry.totalSpent));
  }
}
