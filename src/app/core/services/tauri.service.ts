import { Injectable, NgZone } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';
import { listen, emit, Event, UnlistenFn } from '@tauri-apps/api/event';
import { getCurrentWindow, Window } from '@tauri-apps/api/window';

export interface ScreenInfo {
  id: number;
  name: string;
  width: number;
  height: number;
  x: number;
  y: number;
  is_primary: boolean;
  scale_factor: number;
}

export interface ScreenSize {
  width: number;
  height: number;
}

export interface KeyModifiers {
  shift: boolean;
  control: boolean;
  alt: boolean;
  meta: boolean;
}

export interface SystemInfo {
  machine_id: string;
  hostname: string;
  platform: string;
  arch: string;
}

export interface ClipboardContent {
  content_type: string;
  text?: string;
  image_base64?: string;
  image_width?: number;
  image_height?: number;
}

@Injectable({
  providedIn: 'root'
})
export class TauriService {
  private currentWindow: Window;
  private screenFrameListeners: Set<(frame: string) => void> = new Set();
  private clipboardListeners: Set<(content: ClipboardContent) => void> = new Set();
  private screenFrameUnlisten?: UnlistenFn;
  private clipboardUnlisten?: UnlistenFn;

  constructor(private ngZone: NgZone) {
    this.currentWindow = getCurrentWindow();
    this.setupEventListeners();
  }

  private async setupEventListeners(): Promise<void> {
    // Listen for screen frame events
    this.screenFrameUnlisten = await listen<string>('screen-frame', (event) => {
      this.ngZone.run(() => {
        this.screenFrameListeners.forEach(listener => listener(event.payload));
      });
    });

    // Listen for clipboard change events
    this.clipboardUnlisten = await listen<ClipboardContent>('clipboard-changed', (event) => {
      this.ngZone.run(() => {
        this.clipboardListeners.forEach(listener => listener(event.payload));
      });
    });
  }

  // Platform detection
  get isTauri(): boolean {
    return '__TAURI__' in window;
  }

  // Screen Capture Commands
  async getScreens(): Promise<ScreenInfo[]> {
    return invoke<ScreenInfo[]>('get_screens');
  }

  async getScreenSize(screenId: number): Promise<ScreenSize> {
    return invoke<ScreenSize>('get_screen_size', { screenId });
  }

  async captureScreen(screenId: number, quality?: number): Promise<string> {
    return invoke<string>('capture_screen', { screenId, quality });
  }

  async captureScreenThumbnail(screenId: number, maxWidth: number = 320): Promise<string> {
    return invoke<string>('capture_screen_thumbnail', { screenId, maxWidth });
  }

  async startScreenCapture(screenId: number, fps: number = 30, quality?: number): Promise<void> {
    return invoke<void>('start_screen_capture', { screenId, fps, quality });
  }

  async stopScreenCapture(): Promise<void> {
    return invoke<void>('stop_screen_capture');
  }

  async isCapturing(): Promise<boolean> {
    return invoke<boolean>('is_capturing');
  }

  onScreenFrame(callback: (frame: string) => void): () => void {
    this.screenFrameListeners.add(callback);
    return () => {
      this.screenFrameListeners.delete(callback);
    };
  }

  // Input Simulation Commands
  async mouseMove(x: number, y: number): Promise<void> {
    return invoke<void>('mouse_move', { x: Math.round(x), y: Math.round(y) });
  }

  async mouseMoveRelative(dx: number, dy: number): Promise<void> {
    return invoke<void>('mouse_move_relative', { dx: Math.round(dx), dy: Math.round(dy) });
  }

  async mouseClick(button: number = 0): Promise<void> {
    return invoke<void>('mouse_click', { button });
  }

  async mouseDoubleClick(button: number = 0): Promise<void> {
    return invoke<void>('mouse_double_click', { button });
  }

  async mouseDown(button: number = 0): Promise<void> {
    return invoke<void>('mouse_down', { button });
  }

  async mouseUp(button: number = 0): Promise<void> {
    return invoke<void>('mouse_up', { button });
  }

  async mouseScroll(direction: 'up' | 'down' | 'left' | 'right', amount: number = 3): Promise<void> {
    return invoke<void>('mouse_scroll', { direction, amount });
  }

  async keyPress(key: string, modifiers?: KeyModifiers): Promise<void> {
    return invoke<void>('key_press', { key, modifiers });
  }

  async keyDown(key: string): Promise<void> {
    return invoke<void>('key_down', { key });
  }

  async keyUp(key: string): Promise<void> {
    return invoke<void>('key_up', { key });
  }

  async typeText(text: string): Promise<void> {
    return invoke<void>('type_text', { text });
  }

  // Clipboard Commands
  async clipboardReadText(): Promise<string> {
    return invoke<string>('clipboard_read_text');
  }

  async clipboardWriteText(text: string): Promise<void> {
    return invoke<void>('clipboard_write_text', { text });
  }

  async clipboardReadImage(): Promise<ClipboardContent | null> {
    return invoke<ClipboardContent | null>('clipboard_read_image');
  }

  async clipboardWriteImage(base64Data: string): Promise<void> {
    return invoke<void>('clipboard_write_image', { base64Data });
  }

  async clipboardClear(): Promise<void> {
    return invoke<void>('clipboard_clear');
  }

  async startClipboardWatch(): Promise<void> {
    return invoke<void>('start_clipboard_watch');
  }

  async stopClipboardWatch(): Promise<void> {
    return invoke<void>('stop_clipboard_watch');
  }

  async isClipboardWatching(): Promise<boolean> {
    return invoke<boolean>('is_clipboard_watching');
  }

  onClipboardChange(callback: (content: ClipboardContent) => void): () => void {
    this.clipboardListeners.add(callback);
    return () => {
      this.clipboardListeners.delete(callback);
    };
  }

  // System Info Commands
  async getMachineId(): Promise<string> {
    return invoke<string>('get_machine_id');
  }

  async getHostname(): Promise<string> {
    return invoke<string>('get_hostname');
  }

  async getPlatform(): Promise<string> {
    return invoke<string>('get_platform');
  }

  async getArch(): Promise<string> {
    return invoke<string>('get_arch');
  }

  async getSystemInfo(): Promise<SystemInfo> {
    return invoke<SystemInfo>('get_system_info');
  }

  // Password Commands
  async hashPassword(password: string): Promise<string> {
    return invoke<string>('hash_password', { password });
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return invoke<boolean>('verify_password', { password, hash });
  }

  // Connection ID Generation
  async generateConnectionId(useMachineId: boolean = false): Promise<string> {
    return invoke<string>('generate_connection_id', { useMachineId });
  }

  // Window Management Commands
  async minimize(): Promise<void> {
    return this.currentWindow.minimize();
  }

  async maximize(): Promise<void> {
    const isMaximized = await this.currentWindow.isMaximized();
    if (isMaximized) {
      return this.currentWindow.unmaximize();
    }
    return this.currentWindow.maximize();
  }

  async close(): Promise<void> {
    return this.currentWindow.close();
  }

  async hide(): Promise<void> {
    return this.currentWindow.hide();
  }

  async show(): Promise<void> {
    return this.currentWindow.show();
  }

  async focus(): Promise<void> {
    return this.currentWindow.setFocus();
  }

  async setTitle(title: string): Promise<void> {
    return this.currentWindow.setTitle(title);
  }

  async setAlwaysOnTop(alwaysOnTop: boolean): Promise<void> {
    return this.currentWindow.setAlwaysOnTop(alwaysOnTop);
  }

  async createRemoteWindow(partnerId: string): Promise<void> {
    return invoke<void>('create_remote_window', { partnerId });
  }

  async createInfoWindow(): Promise<void> {
    return invoke<void>('create_info_window');
  }

  async closeWindow(label: string): Promise<void> {
    return invoke<void>('close_window', { label });
  }

  // Cleanup
  async destroy(): Promise<void> {
    if (this.screenFrameUnlisten) {
      this.screenFrameUnlisten();
    }
    if (this.clipboardUnlisten) {
      this.clipboardUnlisten();
    }
    await this.stopScreenCapture();
    await this.stopClipboardWatch();
  }
}
