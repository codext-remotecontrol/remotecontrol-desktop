import { ElectronService } from "./../../app/core/services/electron/electron.service";

import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import "webrtc-adapter";
import { LoadingController, ModalController } from "@ionic/angular";
import { ScreenSelectComponent } from "../../app/shared/components/screen-select/screen-select.component";

@Component({
  selector: "app-home",
  templateUrl: "./home.page.html",
  styleUrls: ["./home.page.scss"],
})
export class HomePage implements OnInit {
  myId = "";

  constructor(
    private modalCtrl: ModalController,
    private cdr: ChangeDetectorRef,
    private loadingCtrl: LoadingController,
    private electronService: ElectronService
  ) {}

  async ngOnInit() {
    this.myId = `${this.threeDigit()} ${this.threeDigit()} ${this.threeDigit()}`;
    this.cdr.detectChanges();
    console.log(" this.myId", this.myId);
    const modal = await this.modalCtrl.create({
      component: ScreenSelectComponent,
    });
    return await modal.present();
  }

  threeDigit() {
    return Math.floor(Math.random() * (999 - 100 + 1) + 100);
  }

  async connect() {
    const loading = await this.loadingCtrl.create();
    loading.present();
    setTimeout(() => {
      /*const remote = this.electronService.remote;
      const BrowserWindow = remote.BrowserWindow;
      const win = new BrowserWindow({
        width: 400,
        height: 400,
        frame: false,
        center: true,
        webPreferences: {
          nodeIntegration: true,
          allowRunningInsecureContent: true,
          contextIsolation: false,
          enableRemoteModule: true,
        },
      });

      win.loadURL("http://google.de");*/
      loading.dismiss();
    }, 1000);
  }
}
