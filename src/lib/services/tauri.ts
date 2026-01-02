import type { UnlistenFn } from '@tauri-apps/api/event';

export type { UnlistenFn };

const isTauri = typeof window !== 'undefined' && !!(window as any).__TAURI__;

async function invokeCommand<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  if (!isTauri) {
    throw new Error(`Tauri command '${cmd}' not available in browser`);
  }
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<T>(cmd, args);
}

async function listenEvent<T>(event: string, callback: (payload: T) => void): Promise<UnlistenFn> {
  if (!isTauri) {
    return () => {};
  }
  const { listen } = await import('@tauri-apps/api/event');
  return listen<T>(event, (e) => callback(e.payload));
}

export interface ScreenInfo {
  id: number;
  name: string;
  width: number;
  height: number;
  x: number;
  y: number;
  scale_factor: number;
  is_primary: boolean;
}

export interface KeyModifiers {
  shift: boolean;
  control: boolean;
  alt: boolean;
  meta: boolean;
}

export async function getScreens(): Promise<ScreenInfo[]> {
  if (!isTauri) {
    return [{ id: 0, name: 'Browser Screen', width: 1920, height: 1080, x: 0, y: 0, scale_factor: 1, is_primary: true }];
  }
  return invokeCommand('get_screens');
}

export async function getScreenSize(screenId: number): Promise<{ width: number; height: number }> {
  if (!isTauri) {
    return { width: 1920, height: 1080 };
  }
  return invokeCommand('get_screen_size', { screenId });
}

export async function captureScreenThumbnail(screenId: number, maxWidth: number): Promise<string> {
  return invokeCommand('capture_screen_thumbnail', { screenId, maxWidth });
}

export async function startScreenCapture(screenId: number, fps: number, quality?: number): Promise<void> {
  return invokeCommand('start_screen_capture', { screenId, fps, quality });
}

export async function stopScreenCapture(): Promise<void> {
  if (!isTauri) return;
  return invokeCommand('stop_screen_capture');
}

export function onScreenFrame(callback: (base64: string) => void): Promise<UnlistenFn> {
  return listenEvent<string>('screen-frame', callback);
}

export async function mouseMove(x: number, y: number): Promise<void> {
  return invokeCommand('mouse_move', { x, y });
}

export async function mouseMoveRelative(dx: number, dy: number): Promise<void> {
  return invokeCommand('mouse_move_relative', { dx, dy });
}

export async function mouseClick(button: string): Promise<void> {
  return invokeCommand('mouse_click', { button });
}

export async function mouseDown(button: string): Promise<void> {
  return invokeCommand('mouse_down', { button });
}

export async function mouseUp(button: string): Promise<void> {
  return invokeCommand('mouse_up', { button });
}

export async function mouseScroll(direction: string, amount: number): Promise<void> {
  return invokeCommand('mouse_scroll', { direction, amount });
}

export async function keyPress(key: string, modifiers?: KeyModifiers): Promise<void> {
  return invokeCommand('key_press', { key, modifiers });
}

export async function keyDown(key: string): Promise<void> {
  return invokeCommand('key_down', { key });
}

export async function keyUp(key: string): Promise<void> {
  return invokeCommand('key_up', { key });
}

export async function typeText(text: string): Promise<void> {
  return invokeCommand('type_text', { text });
}

export async function clipboardReadText(): Promise<string> {
  if (!isTauri) {
    return navigator.clipboard.readText();
  }
  return invokeCommand('clipboard_read_text');
}

export async function clipboardWriteText(text: string): Promise<void> {
  if (!isTauri) {
    return navigator.clipboard.writeText(text);
  }
  return invokeCommand('clipboard_write_text', { text });
}

export async function startClipboardWatch(): Promise<void> {
  if (!isTauri) return;
  return invokeCommand('start_clipboard_watch');
}

export async function stopClipboardWatch(): Promise<void> {
  if (!isTauri) return;
  return invokeCommand('stop_clipboard_watch');
}

export function onClipboardChanged(callback: (text: string) => void): Promise<UnlistenFn> {
  return listenEvent<string>('clipboard-changed', callback);
}

export async function getMachineId(): Promise<string> {
  if (!isTauri) {
    return 'browser-' + Math.random().toString(36).substring(2, 10);
  }
  return invokeCommand('get_machine_id');
}

export async function generateConnectionId(random: boolean): Promise<string> {
  if (!isTauri) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let id = '';
    for (let i = 0; i < 6; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  }
  return invokeCommand('generate_connection_id', { random });
}

export async function hashPassword(password: string): Promise<string> {
  if (!isTauri) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  return invokeCommand('hash_password', { password });
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!isTauri) {
    const computed = await hashPassword(password);
    return computed === hash;
  }
  return invokeCommand('verify_password', { password, hash });
}

export async function getPlatform(): Promise<string> {
  if (!isTauri) {
    return 'browser';
  }
  return invokeCommand('get_platform');
}

export async function getHostname(): Promise<string> {
  if (!isTauri) {
    return 'Browser Client';
  }
  return invokeCommand('get_hostname');
}

export async function createRemoteWindow(peerId: string): Promise<void> {
  if (!isTauri) return;
  return invokeCommand('create_remote_window', { peerId });
}

export async function createInfoWindow(): Promise<void> {
  if (!isTauri) return;
  return invokeCommand('create_info_window');
}

export interface PermissionStatus {
  screen_recording: boolean;
  accessibility: boolean;
}

export async function checkPermissions(): Promise<PermissionStatus> {
  if (!isTauri) {
    return { screen_recording: true, accessibility: true };
  }
  return invokeCommand('check_permissions');
}

export async function checkScreenRecordingPermission(): Promise<boolean> {
  if (!isTauri) return true;
  return invokeCommand('check_screen_recording_permission');
}

export async function checkAccessibilityPermission(): Promise<boolean> {
  if (!isTauri) return true;
  return invokeCommand('check_accessibility_permission');
}

export async function requestScreenRecordingPermission(): Promise<boolean> {
  if (!isTauri) return true;
  return invokeCommand('request_screen_recording_permission');
}

export async function openScreenRecordingSettings(): Promise<void> {
  if (!isTauri) return;
  return invokeCommand('open_screen_recording_settings');
}

export async function openAccessibilitySettings(): Promise<void> {
  if (!isTauri) return;
  return invokeCommand('open_accessibility_settings');
}

export async function getPlatformName(): Promise<string> {
  if (!isTauri) {
    return 'browser';
  }
  return invokeCommand('get_platform_name');
}

export function isTauriApp(): boolean {
  return isTauri;
}
