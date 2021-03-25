import { ElectronService } from "./../../app/core/services/electron/electron.service";

import { Component, OnInit } from "@angular/core";
import "webrtc-adapter";
import { ModalController } from "@ionic/angular";
import { ScreenSelectComponent } from "../../app/shared/components/screen-select/screen-select.component";

@Component({
  selector: "app-home",
  templateUrl: "./home.page.html",
  styleUrls: ["./home.page.scss"],
})
export class HomePage implements OnInit {
  myId = "133 331 123";

  constructor(private modalCtrl: ModalController) {}

  async ngOnInit() {
    const modal = await this.modalCtrl.create({
      component: ScreenSelectComponent,
    });
    return await modal.present();
  }
}
