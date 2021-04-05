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
        .getSources({ types: ['screen'] })
        .then(async (sources: any) => {
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
                      minWidth: 200,
                      maxWidth: 1920,
                      minHeight: 200,
                      maxHeight: 1080,
                      /*minWidth: 1280,
                      maxWidth: 1920,
                      minHeight: 720,
                      maxHeight: 1080,*/
                    },
                  },
                }
              );

              this.sources.push({ stream, source });
            } catch (e) {
              console.log('e', e);
            }
          }
        });
    } catch (error) {
      console.log('error', error);
    } finally {
      // this.electronService.window.show();
      // this.electronService.window.focus();
      setTimeout(() => {
        this.electronService.window.show();
        this.electronService.window.focus();
      }, 500);
      loading.dismiss();
    }
  }

  selectStream(video) {
    this.modalCtrl.dismiss(video);
  }

  handleStream(stream) {
    const video = document.querySelector('video');
    video.srcObject = stream;
    video.onloadedmetadata = () => video.play();
  }

  close() {
    this.modalCtrl.dismiss();
  }
}
