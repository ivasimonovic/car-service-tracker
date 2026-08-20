import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { IonApp, IonRouterOutlet, IonSpinner } from '@ionic/angular';
import { AuthService } from './auth/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [IonApp, IonRouterOutlet, IonSpinner, AsyncPipe],
})
export class AppComponent {
  readonly authService = inject(AuthService);
}
