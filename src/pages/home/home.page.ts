import { ElectronService } from "./../../app/core/services/electron/electron.service";

import { Component, OnInit } from "@angular/core";
import "webrtc-adapter";

@Component({
  selector: "app-home",
  templateUrl: "./home.page.html",
  styleUrls: ["./home.page.scss"],
})
export class HomePage implements OnInit {
  myId = "133 331 123";

  constructor(private electronService: ElectronService) {}

  async ngOnInit() {
    await this.electronService.desktopCapturer
      .getSources({ types: ["window", "screen"] })
      .then(async (sources) => {
        console.log("sources", sources);
        for (const source of sources) {
          if (source.name === "Screen 1") {
            try {
              const stream = await (navigator as any).mediaDevices.getUserMedia(
                {
                  audio: false,
                  video: {
                    mandatory: {
                      chromeMediaSource: "desktop",
                      chromeMediaSourceId: source.id,
                    },
                  },
                }
              );

              this.handleStream(stream);
            } catch (e) {}
            return;
          }
        }
      });
  }

  handleStream(stream) {
    const video = document.querySelector("video");
    video.srcObject = stream;
    video.onloadedmetadata = (e) => video.play();
  }
}
