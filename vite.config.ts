import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

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
      buffer: 'buffer/',
      process: 'process/browser'
    }
  },
  optimizeDeps: {
    include: ['buffer', 'process', 'simple-peer', 'readable-stream']
  }
});
