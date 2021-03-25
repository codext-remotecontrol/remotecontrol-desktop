import { LoadingController, ModalController } from '@ionic/angular';
import { Component, OnInit } from '@angular/core';
import { ElectronService } from '../../../core/services/electron/electron.service';

@Component({
  selector: 'app-screen-select',
  templateUrl: './screen-select.component.html',
  styleUrls: ['./screen-select.component.scss'],
})
export class ScreenSelectComponent implements OnInit {
  sources = [];
  constructor(
    private electronService: ElectronService,
    private modalCtrl: ModalController,
    private loadingCtrl: LoadingController
  ) {}

  async ngOnInit() {
    const loading = await this.loadingCtrl.create();
    loading.present();

    try {
      await this.electronService.desktopCapturer
        .getSources({ types: ['window', 'screen'] })
        .then(async (sources) => {
          console.log('sources', sources);
          for (const source of sources) {
            try {
              const stream = await (navigator as any).mediaDevices.getUserMedia(
                {
                  audio: false,
                  video: {
                    mandatory: {
                      chromeMediaSource: 'desktop',
                      chromeMediaSourceId: source.id,
                      maxFrameRate: 25,
                    },
                  },
                }
              );

              this.sources.push({ stream, source });
              console.log(this.sources);

              // this.handleStream(stream);
            } catch (e) {
              console.log('e', e);
            }
          }
        });
    } catch (error) {
    } finally {
      loading.dismiss();
    }
  }

  handleStream(stream) {
    const video = document.querySelector('video');
    video.srcObject = stream;
    video.onloadedmetadata = (e) => video.play();
  }

  close() {
    this.modalCtrl.dismiss();
  }
}
