import { Injectable, NgZone } from '@angular/core';
import { TauriService } from './tauri.service';

@Injectable({
  providedIn: 'root'
})
export class FrameStreamService {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private stream: MediaStream | null = null;
  private unlistenFn: (() => void) | null = null;
  private isStreaming = false;
  private frameCount = 0;
  private lastFrameTime = 0;
  private currentFps = 0;
  private screenWidth = 0;
  private screenHeight = 0;

  // Image loading optimization
  private imageCache = new Map<string, HTMLImageElement>();
  private pendingFrame: string | null = null;
  private isDrawing = false;

  constructor(
    private tauriService: TauriService,
    private ngZone: NgZone
  ) {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', {
      alpha: false,
      desynchronized: true, // Performance optimization
    })!;
  }

  async startCapture(screenId: number, width: number, height: number, fps: number = 30): Promise<MediaStream> {
    // Stop any existing capture
    await this.stopCapture();

    this.screenWidth = width;
    this.screenHeight = height;
    this.canvas.width = width;
    this.canvas.height = height;

    // Create MediaStream from canvas at target framerate
    this.stream = this.canvas.captureStream(fps);

    // Listen for frame events from Rust
    this.unlistenFn = this.tauriService.onScreenFrame((base64Frame) => {
      this.handleFrame(base64Frame);
    });

    // Start capturing in Rust
    await this.tauriService.startScreenCapture(screenId, fps, 75);
    this.isStreaming = true;
    this.frameCount = 0;
    this.lastFrameTime = performance.now();

    return this.stream;
  }

  private handleFrame(base64Data: string): void {
    // If we're already drawing, just update the pending frame
    if (this.isDrawing) {
      this.pendingFrame = base64Data;
      return;
    }

    this.drawFrame(base64Data);
  }

  private drawFrame(base64Data: string): void {
    this.isDrawing = true;

    const img = new Image();

    img.onload = () => {
      // Draw to canvas
      this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);

      // Update stats
      this.frameCount++;
      const now = performance.now();
      if (now - this.lastFrameTime >= 1000) {
        this.currentFps = this.frameCount;
        this.frameCount = 0;
        this.lastFrameTime = now;
      }

      this.isDrawing = false;

      // If there's a pending frame, draw it
      if (this.pendingFrame) {
        const nextFrame = this.pendingFrame;
        this.pendingFrame = null;
        this.drawFrame(nextFrame);
      }
    };

    img.onerror = () => {
      console.error('Failed to load frame');
      this.isDrawing = false;

      // Try the pending frame if available
      if (this.pendingFrame) {
        const nextFrame = this.pendingFrame;
        this.pendingFrame = null;
        this.drawFrame(nextFrame);
      }
    };

    img.src = `data:image/jpeg;base64,${base64Data}`;
  }

  async stopCapture(): Promise<void> {
    if (this.unlistenFn) {
      this.unlistenFn();
      this.unlistenFn = null;
    }

    await this.tauriService.stopScreenCapture();

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    this.isStreaming = false;
    this.pendingFrame = null;
    this.isDrawing = false;
  }

  getStream(): MediaStream | null {
    return this.stream;
  }

  isActive(): boolean {
    return this.isStreaming;
  }

  getCurrentFps(): number {
    return this.currentFps;
  }

  getScreenDimensions(): { width: number; height: number } {
    return {
      width: this.screenWidth,
      height: this.screenHeight
    };
  }

  // Get canvas element for direct rendering if needed
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
}
