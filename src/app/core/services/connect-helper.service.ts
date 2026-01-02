import { Injectable } from '@angular/core';
import { TauriService } from './tauri.service';

@Injectable({
  providedIn: 'root',
})
export class ConnectHelperService {
  constructor(private tauriService: TauriService) {}

  async handleScroll(text: string): Promise<void> {
    const textArray = text.split(',');
    const direction = textArray[1] as 'up' | 'down';
    await this.tauriService.mouseScroll(direction, 3);
  }

  async handleMouse(text: string): Promise<void> {
    const textArray = text.split(',');
    const data = {
      type: textArray[0],
      x: parseFloat(textArray[1]) || 0,
      y: parseFloat(textArray[2]) || 0,
      button: parseInt(textArray[3], 10) || 0,
    };

    try {
      switch (data.type) {
        case 'dc': // Double click
          await this.tauriService.mouseDoubleClick(data.button);
          break;
        case 'md': // Mouse down
          await this.tauriService.mouseDown(data.button);
          break;
        case 'mu': // Mouse up
          await this.tauriService.mouseUp(data.button);
          break;
        case 'mm': // Mouse move
          await this.tauriService.mouseMove(data.x, data.y);
          break;
        case 'mc': // Mouse click
          await this.tauriService.mouseClick(data.button);
          break;
      }
    } catch (error) {
      console.error('Mouse action error:', error);
    }
  }

  async handleKey(data: any): Promise<void> {
    try {
      const key = data.key;
      const modifiers = {
        shift: !!data.shift,
        control: !!data.control,
        alt: !!data.alt,
        meta: !!data.meta,
      };

      // Map common key names to the format expected by Rust
      let mappedKey = this.mapKeyName(key);

      if (mappedKey) {
        await this.tauriService.keyPress(mappedKey, modifiers);
      }
    } catch (error) {
      console.error('Key action error:', error);
    }
  }

  private mapKeyName(key: string): string {
    // Map JavaScript key names to enigo-compatible names
    const keyMap: Record<string, string> = {
      'Enter': 'enter',
      'Backspace': 'backspace',
      'Tab': 'tab',
      'Escape': 'escape',
      'Space': 'space',
      ' ': 'space',
      'ArrowUp': 'up',
      'ArrowDown': 'down',
      'ArrowLeft': 'left',
      'ArrowRight': 'right',
      'Delete': 'delete',
      'Insert': 'insert',
      'Home': 'home',
      'End': 'end',
      'PageUp': 'pageup',
      'PageDown': 'pagedown',
      'CapsLock': 'capslock',
      'Shift': 'shift',
      'Control': 'control',
      'Alt': 'alt',
      'Meta': 'meta',
      'F1': 'f1',
      'F2': 'f2',
      'F3': 'f3',
      'F4': 'f4',
      'F5': 'f5',
      'F6': 'f6',
      'F7': 'f7',
      'F8': 'f8',
      'F9': 'f9',
      'F10': 'f10',
      'F11': 'f11',
      'F12': 'f12',
    };

    // Check if it's a mapped key
    if (keyMap[key]) {
      return keyMap[key];
    }

    // For single characters, return lowercase
    if (key.length === 1) {
      return key.toLowerCase();
    }

    // Return as-is for other keys
    return key.toLowerCase();
  }

  async handleClipboard(text: string): Promise<void> {
    try {
      await this.tauriService.clipboardWriteText(text);
    } catch (error) {
      console.error('Clipboard write error:', error);
    }
  }

  threeDigit(): number {
    return Math.floor(Math.random() * (999 - 100 + 1) + 100);
  }

  async showInfoWindow(): Promise<void> {
    try {
      await this.tauriService.createInfoWindow();
    } catch (error) {
      console.error('Failed to show info window:', error);
    }
  }

  async closeInfoWindow(): Promise<void> {
    try {
      await this.tauriService.closeWindow('info');
    } catch (error) {
      // Window might already be closed
    }
  }
}
