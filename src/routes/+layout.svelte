<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { settings } from '$lib/stores';
  import { connect as socketConnect, connected, connectionId } from '$lib/services/socket';
  import { generateConnectionId, getHostname, getPlatform } from '$lib/services/tauri';
  import '../app.css';

  let hostname = '';
  let platform = '';
  let initError = '';

  // Generate a random ID as fallback
  function generateFallbackId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  onMount(async () => {
    try {
      await settings.load();
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }

    let id = $settings.connectionId;

    // Try to get hostname and platform from Tauri
    try {
      hostname = await getHostname();
      platform = await getPlatform();
    } catch (e) {
      console.warn('Failed to get system info:', e);
      hostname = 'Unknown';
      platform = 'unknown';
    }

    // Generate connection ID if not set
    if (!id) {
      try {
        id = await generateConnectionId(false);
        settings.updateSetting('connectionId', id);
        await settings.save();
      } catch (e) {
        console.warn('Failed to generate connection ID via Tauri, using fallback:', e);
        id = generateFallbackId();
        settings.updateSetting('connectionId', id);
      }
    }

    // Connect to signaling server
    try {
      await socketConnect(id);
    } catch (e) {
      console.error('Failed to connect to signaling server:', e);
      initError = `Connection failed: ${e}`;
    }
  });

  $: currentPath = $page.url.pathname;
</script>

<div class="flex h-screen">
  <!-- Sidebar -->
  <nav class="w-64 bg-dark-800 border-r border-dark-700 flex flex-col">
    <!-- Logo -->
    <div class="p-4 border-b border-dark-700">
      <h1 class="text-xl font-bold text-primary-400">RemoteControl</h1>
      <p class="text-xs text-dark-400 mt-1">Desktop</p>
    </div>

    <!-- Navigation -->
    <div class="flex-1 p-3 space-y-1">
      <a
        href="/"
        class="nav-item {currentPath === '/' ? 'nav-item-active' : 'nav-item-inactive'}"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
        </svg>
        <span>Home</span>
      </a>

      <a
        href="/settings"
        class="nav-item {currentPath === '/settings' ? 'nav-item-active' : 'nav-item-inactive'}"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
        <span>Settings</span>
      </a>
    </div>

    <!-- Connection Status -->
    <div class="p-4 border-t border-dark-700">
      <div class="flex items-center gap-2 text-sm">
        <span class="w-2 h-2 rounded-full {$connected ? 'bg-green-500' : 'bg-red-500'}"></span>
        <span class="text-dark-300">{$connected ? 'Connected' : 'Disconnected'}</span>
      </div>
      {#if $connectionId}
        <p class="text-xs text-dark-400 mt-1 font-mono">{$connectionId}</p>
      {/if}
      {#if initError}
        <p class="text-xs text-red-400 mt-1">{initError}</p>
      {/if}
    </div>
  </nav>

  <!-- Main Content -->
  <main class="flex-1 overflow-auto">
    <slot />
  </main>
</div>
