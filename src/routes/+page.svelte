<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { settings, connection } from '$lib/stores';
  import { connected, connectionId, on, off, requestConnection, respondToConnection, requestPassword, sendPasswordResponse } from '$lib/services/socket';
  import { getHostname, getPlatform, verifyPassword, getScreens, type ScreenInfo } from '$lib/services/tauri';
  import type { PeerInfo } from '$lib/services/socket';

  let remoteId = '';
  let screens: ScreenInfo[] = [];
  let selectedScreen: number = 0;
  let hostname = '';
  let platform = '';

  // Connection request modal
  let showConnectionRequest = false;
  let pendingRequest: { peerId: string; info: PeerInfo } | null = null;

  // Password modal
  let showPasswordModal = false;
  let passwordInput = '';
  let passwordError = '';
  let pendingPasswordRequest: { peerId: string } | null = null;

  onMount(async () => {
    hostname = await getHostname();
    platform = await getPlatform();
    screens = await getScreens();
    if (screens.length > 0) {
      selectedScreen = screens.find(s => s.is_primary)?.id ?? screens[0].id;
    }

    // Handle incoming connection requests
    on('connection-request', (data: { fromId: string; info: PeerInfo }) => {
      pendingRequest = { peerId: data.fromId, info: data.info };
      showConnectionRequest = true;
    });

    // Handle connection response
    on('connection-response', (data: { fromId: string; accepted: boolean }) => {
      if (data.accepted) {
        // Connection accepted, request password or proceed
        connection.setConnecting('client', data.fromId);
        goto(`/remote?peer=${data.fromId}&screen=${selectedScreen}`);
      } else {
        connection.setError('Connection was rejected');
      }
    });

    // Handle password request
    on('password-request', (data: { fromId: string }) => {
      pendingPasswordRequest = { peerId: data.fromId };
      showPasswordModal = true;
      passwordError = '';
      passwordInput = '';
    });

    on('password-response', async (data: { fromId: string; password: string }) => {
      const isValid = await verifyPassword(data.password, $settings.passwordHash);
      if (isValid) {
        connection.setConnecting('host', data.fromId);
        goto(`/remote?peer=${data.fromId}&mode=host&screen=${selectedScreen}`);
      }
    });
  });

  onDestroy(() => {
    off('connection-request');
    off('connection-response');
    off('password-request');
    off('password-response');
  });

  async function connectToRemote() {
    if (!remoteId.trim()) return;

    connection.setConnecting('client', remoteId);

    requestConnection(remoteId, {
      id: $connectionId,
      hostname,
      platform
    });
  }

  function acceptConnection() {
    if (pendingRequest) {
      const peerId = pendingRequest.peerId;
      respondToConnection(peerId, true);
      showConnectionRequest = false;
      
      if ($settings.passwordHash) {
        requestPassword(peerId);
      } else {
        connection.setConnecting('host', peerId);
        pendingRequest = null;
        goto(`/remote?peer=${peerId}&mode=host&screen=${selectedScreen}`);
      }
    }
  }

  function rejectConnection() {
    if (pendingRequest) {
      respondToConnection(pendingRequest.peerId, false);
      showConnectionRequest = false;
      pendingRequest = null;
    }
  }

  function submitPassword() {
    if (pendingPasswordRequest && passwordInput) {
      sendPasswordResponse(pendingPasswordRequest.peerId, passwordInput);
      showPasswordModal = false;
      pendingPasswordRequest = null;
    }
  }

  function copyConnectionId() {
    navigator.clipboard.writeText($connectionId);
  }
</script>

<div class="p-6 animate-fade-in">
  <h1 class="text-2xl font-bold mb-6">Remote Connection</h1>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- This Device -->
    <div class="card">
      <h2 class="text-lg font-semibold mb-4 text-dark-200">This Device</h2>

      <div class="space-y-4">
        <div>
          <label class="block text-sm text-dark-400 mb-1">Connection ID</label>
          <div class="flex gap-2">
            <input
              type="text"
              readonly
              value={$connectionId}
              class="input font-mono text-lg tracking-wider"
            />
            <button class="btn-secondary" on:click={copyConnectionId}>
              Copy
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-dark-400">Hostname:</span>
            <span class="ml-2">{hostname}</span>
          </div>
          <div>
            <span class="text-dark-400">Platform:</span>
            <span class="ml-2 capitalize">{platform}</span>
          </div>
        </div>

        {#if screens.length > 1}
          <div>
            <label class="block text-sm text-dark-400 mb-1">Screen to Share (when hosting)</label>
            <select bind:value={selectedScreen} class="input">
              {#each screens as screen}
                <option value={screen.id}>
                  {screen.name} ({screen.width}x{screen.height})
                  {screen.is_primary ? '(Primary)' : ''}
                </option>
              {/each}
            </select>
          </div>
        {/if}

        <div class="flex items-center gap-2 pt-2">
          <span class="w-2 h-2 rounded-full {$connected ? 'bg-green-500' : 'bg-red-500'}"></span>
          <span class="text-sm text-dark-300">
            {$connected ? 'Ready to accept connections' : 'Not connected to server'}
          </span>
        </div>
      </div>
    </div>

    <!-- Connect to Remote -->
    <div class="card">
      <h2 class="text-lg font-semibold mb-4 text-dark-200">Connect to Remote</h2>

      <div class="space-y-4">
        <div>
          <label class="block text-sm text-dark-400 mb-1">Remote Connection ID</label>
          <input
            type="text"
            bind:value={remoteId}
            placeholder="Enter remote ID"
            class="input font-mono text-lg tracking-wider"
          />
        </div>

        <button
          class="btn-primary w-full"
          disabled={!$connected || !remoteId.trim()}
          on:click={connectToRemote}
        >
          Connect
        </button>

        {#if $connection.status === 'error'}
          <p class="text-red-400 text-sm">{$connection.error}</p>
        {/if}
      </div>
    </div>
  </div>
</div>

<!-- Connection Request Modal -->
{#if showConnectionRequest && pendingRequest}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="card max-w-md w-full mx-4 animate-fade-in">
      <h3 class="text-lg font-semibold mb-4">Incoming Connection</h3>

      <p class="text-dark-300 mb-4">
        <span class="font-semibold text-white">{pendingRequest.info.hostname}</span>
        wants to connect to your device.
      </p>

      <div class="text-sm text-dark-400 mb-4">
        <p>ID: {pendingRequest.info.id}</p>
        <p>Platform: {pendingRequest.info.platform}</p>
      </div>

      <div class="flex gap-3">
        <button class="btn-danger flex-1" on:click={rejectConnection}>
          Reject
        </button>
        <button class="btn-success flex-1" on:click={acceptConnection}>
          Accept
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Password Modal -->
{#if showPasswordModal}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="card max-w-md w-full mx-4 animate-fade-in">
      <h3 class="text-lg font-semibold mb-4">Password Required</h3>

      <p class="text-dark-300 mb-4">
        Enter the password for the remote device.
      </p>

      <input
        type="password"
        bind:value={passwordInput}
        placeholder="Password"
        class="input mb-4"
        on:keydown={(e) => e.key === 'Enter' && submitPassword()}
      />

      {#if passwordError}
        <p class="text-red-400 text-sm mb-4">{passwordError}</p>
      {/if}

      <div class="flex gap-3">
        <button class="btn-secondary flex-1" on:click={() => showPasswordModal = false}>
          Cancel
        </button>
        <button class="btn-primary flex-1" on:click={submitPassword}>
          Submit
        </button>
      </div>
    </div>
  </div>
{/if}
