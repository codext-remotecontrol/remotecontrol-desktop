import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';

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

// Screen capture
export async function getScreens(): Promise<ScreenInfo[]> {
  return invoke('get_screens');
}

export async function captureScreenThumbnail(screenId: number, maxWidth: number): Promise<string> {
  return invoke('capture_screen_thumbnail', { screenId, maxWidth });
}

export async function startScreenCapture(screenId: number, fps: number, quality?: number): Promise<void> {
  return invoke('start_screen_capture', { screenId, fps, quality });
}

export async function stopScreenCapture(): Promise<void> {
  return invoke('stop_screen_capture');
}

export function onScreenFrame(callback: (base64: string) => void): Promise<UnlistenFn> {
  return listen<string>('screen-frame', (event) => callback(event.payload));
}

// Input simulation
export async function mouseMove(x: number, y: number): Promise<void> {
  return invoke('mouse_move', { x, y });
}

export async function mouseMoveRelative(dx: number, dy: number): Promise<void> {
  return invoke('mouse_move_relative', { dx, dy });
}

export async function mouseClick(button: string): Promise<void> {
  return invoke('mouse_click', { button });
}

export async function mouseDown(button: string): Promise<void> {
  return invoke('mouse_down', { button });
}

export async function mouseUp(button: string): Promise<void> {
  return invoke('mouse_up', { button });
}

export async function mouseScroll(direction: string, amount: number): Promise<void> {
  return invoke('mouse_scroll', { direction, amount });
}

export async function keyPress(key: string, modifiers?: KeyModifiers): Promise<void> {
  return invoke('key_press', { key, modifiers });
}

export async function keyDown(key: string): Promise<void> {
  return invoke('key_down', { key });
}

export async function keyUp(key: string): Promise<void> {
  return invoke('key_up', { key });
}

export async function typeText(text: string): Promise<void> {
  return invoke('type_text', { text });
}

// Clipboard
export async function clipboardReadText(): Promise<string> {
  return invoke('clipboard_read_text');
}

export async function clipboardWriteText(text: string): Promise<void> {
  return invoke('clipboard_write_text', { text });
}

export async function startClipboardWatch(): Promise<void> {
  return invoke('start_clipboard_watch');
}

export async function stopClipboardWatch(): Promise<void> {
  return invoke('stop_clipboard_watch');
}

export function onClipboardChanged(callback: (text: string) => void): Promise<UnlistenFn> {
  return listen<string>('clipboard-changed', (event) => callback(event.payload));
}

// System info
export async function getMachineId(): Promise<string> {
  return invoke('get_machine_id');
}

export async function generateConnectionId(random: boolean): Promise<string> {
  return invoke('generate_connection_id', { random });
}

export async function hashPassword(password: string): Promise<string> {
  return invoke('hash_password', { password });
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return invoke('verify_password', { password, hash });
}

export async function getPlatform(): Promise<string> {
  return invoke('get_platform');
}

export async function getHostname(): Promise<string> {
  return invoke('get_hostname');
}

// Window management
export async function createRemoteWindow(peerId: string): Promise<void> {
  return invoke('create_remote_window', { peerId });
}

export async function createInfoWindow(): Promise<void> {
  return invoke('create_info_window');
}
