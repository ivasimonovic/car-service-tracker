import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, IonButton, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { logOutOutline, mailOutline } from 'ionicons/icons';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  imports: [IonContent, IonHeader, IonToolbar, IonTitle, IonIcon, IonButton],
})
export class ProfilePage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly alertController = inject(AlertController);

  readonly currentUser = this.authService.currentUser;

  constructor() {
    addIcons({ logOutOutline, mailOutline });
  }

  get initials(): string {
    const name = this.currentUser?.displayName || this.currentUser?.email || '?';
    return name.trim().charAt(0).toUpperCase();
  }

  async onLogOut(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Odjava',
      message: 'Da li ste sigurni da želite da se odjavite?',
      buttons: [
        { text: 'Otkaži', role: 'cancel' },
        {
          text: 'Odjavi se',
          role: 'destructive',
          handler: async () => {
            await this.authService.logOut();
            await this.router.navigateByUrl('/login');
          },
        },
      ],
    });
    await alert.present();
  }
}
