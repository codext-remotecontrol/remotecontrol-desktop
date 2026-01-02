import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [sveltekit()],
  clearScreen: false,
  server: {
    port: 4201,
    strictPort: true
  },
  envPrefix: ['VITE_', 'TAURI_'],
  resolve: {
    alias: {
      buffer: resolve('node_modules/buffer/'),
      process: resolve('node_modules/process/browser.js'),
      'readable-stream': resolve('node_modules/readable-stream/')
    }
  },
  optimizeDeps: {
    include: ['buffer', 'simple-peer'],
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  }
});
