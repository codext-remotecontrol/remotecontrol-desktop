import { Component, OnInit } from '@angular/core';
import { TauriService } from '../../app/core/services/tauri.service';
import { ConnectService } from '../../app/core/services/connect.service';

@Component({
  selector: 'app-info-window',
  template: `
    <div
      class="w-full h-full flex items-center justify-center cursor-move"
      (mousedown)="startDrag($event)">
      <div class="flex items-center space-x-2 px-3 py-2 bg-red-600 rounded-full shadow-lg">
        <div class="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        <span class="text-white text-sm font-medium">{{ 'Live' | translate }}</span>
        <button
          (click)="stopConnection($event)"
          class="w-5 h-5 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full transition-colors"
          title="Stop">
          <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12"/>
          </svg>
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      background: transparent;
      -webkit-app-region: drag;
    }

    button {
      -webkit-app-region: no-drag;
    }
  `]
})
export class InfoWindowPage implements OnInit {
  constructor(
    private tauriService: TauriService,
    private connectService: ConnectService
  ) {}

  ngOnInit(): void {}

  startDrag(event: MouseEvent): void {
    // Tauri handles window dragging via CSS -webkit-app-region
  }

  async stopConnection(event: MouseEvent): Promise<void> {
    event.stopPropagation();
    await this.connectService.reconnect();
  }
}
