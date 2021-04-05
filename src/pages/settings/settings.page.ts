import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import 'webrtc-adapter';
import { ElectronService as NgxService } from 'ngx-electron';
import { ElectronService } from '../../app/core/services';
import settings from 'electron-settings';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage implements OnInit {
  compName = '';
  autoStartEnabled = false;
  autoLaunch;

  hiddenAccess = false;

  settings = {
    hiddenAccess: false,
  };

  constructor(
    private ngxService: NgxService,
    private electronService: ElectronService,
    private cdr: ChangeDetectorRef
  ) {}
  async ngOnInit() {
    const settings = await this.electronService.settings.get('settings');
    console.log(settings);
    Object.assign(this.settings, settings);
    this.compName = this.electronService.os.hostname();
    this.autoLaunch = new this.electronService.autoLaunch({
      name: 'Remotecontrol - Desktop',
      path: this.electronService.remote.app.getPath('exe'),
      isHidden: true,
    });
    const isEnabled = await this.autoLaunch.isEnabled();
    this.autoStartEnabled = isEnabled;
    this.cdr.detectChanges();
  }

  async changeHiddenAccess() {
    await this.electronService.settings.set('settings', {
      hiddenAccess: this.settings.hiddenAccess,
    });
  }

  changeAutoStart() {
    this.autoLaunch.isEnabled().then((isEnabled) => {
      if (isEnabled) {
        this.autoLaunch.disable();
      } else {
        this.autoLaunch.enable();
      }
    });
  }
}
