import { Injectable } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { ToastrService } from 'ngx-toastr';

@Injectable({ providedIn: 'root' })
export class HelperService {
  constructor(
    private alertController: AlertController,
    private toastCtrl: ToastController,
    private toastr: ToastrService
  ) {}

  confirmDelete(message?) {
    return new Promise(async (resolve, reject) => {
      const alert = await this.alertController.create({
        header: 'Löschen',
        message: message || 'Möchten Sie diesen Eintrag wirklich löschen?',
        buttons: [
          {
            text: 'Abbrechen',
            role: 'cancel',
            cssClass: 'secondary',
            handler: () => {
              console.log('Confirm Cancel');
              reject();
            },
          },
          {
            text: 'Löschen',
            role: 'delete',
            cssClass: 'danger',
            handler: async (data) => {
              resolve();
            },
          },
        ],
      });
      await alert.present();
    });
  }

  async showToast(message, mode: 'success' | 'warning' | 'error' = 'success') {
    this.toastr[mode](message, 'Info', {
      timeOut: 3000,
      progressBar: true,
      positionClass: 'toast-bottom-right',
    });

    /*let toast = await this.toastCtrl.create({
      message: message,
      duration: 2000,
      position: 'middle'
    });
    toast.present();*/
  }
  async presentAlert(message) {
    return new Promise(async (resolve) => {
      const alert = await this.alertController.create({
        header: 'Info',
        message: message,
        buttons: [
          {
            text: 'Ok',
            handler: () => {
              resolve();
            },
          },
        ],
      });

      await alert.present();
    });
  }
}
