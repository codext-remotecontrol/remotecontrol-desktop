import { Component, OnInit } from '@angular/core';
import 'webrtc-adapter';
import { ElectronService as NgxService } from 'ngx-electron';
import { ElectronService } from '../../app/core/services';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage implements OnInit {
  compName = '';

  constructor(
    private ngxService: NgxService,
    private electronService: ElectronService
  ) {}
  ngOnInit() {
    this.compName = this.electronService.os.hostname();
  }
}
