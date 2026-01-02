<script lang="ts">
  import { onMount, onDestroy, tick } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { connection } from '$lib/stores';
  import { on, off, sendSignal, sendPasswordResponse } from '$lib/services/socket';
  import {
    startScreenCapture,
    stopScreenCapture,
    onScreenFrame,
    mouseMove,
    mouseClick,
    mouseDown,
    mouseUp,
    mouseScroll,
    keyPress,
    typeText,
    isTauriApp,
    type UnlistenFn
  } from '$lib/services/tauri';
  import { Buffer } from 'buffer';
  
  if (typeof window !== 'undefined') {
    window.Buffer = Buffer;
  }
  
  import Peer from 'simple-peer';

  let peerId: string;
  let isHost: boolean;
  let screenId: number;

  let peer: Peer.Instance | null = null;
  let canvasElement: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;

  let isConnected = false;
  let isStreaming = false;
  let statusMessage = 'Initializing...';

  let frameUnlisten: UnlistenFn | null = null;

  let remoteWidth = 1920;
  let remoteHeight = 1080;

  let showPasswordModal = false;
  let passwordInput = '';
  let passwordError = '';

  // Frame handling for client - reuse Image object to avoid GC churn
  let frameImage: HTMLImageElement | null = null;
  let pendingFrame: string | null = null;
  let isRenderingFrame = false;
  let canvasReady = false;
  let showDisconnectModal = false;
  let disconnectReason = '';

  let frameCount = 0;
  let lastFpsTime = 0;
  let currentFps = 0;

  onMount(async () => {
    const params = $page.url.searchParams;
    peerId = params.get('peer') || '';
    isHost = params.get('mode') === 'host';
    screenId = parseInt(params.get('screen') || '0');

    console.log('[Remote] Mounted:', { peerId, isHost, screenId });

    if (!peerId) {
      goto('/');
      return;
    }

    on('signal', handleSignal);
    on('password-request', handlePasswordRequest);
    on('peer-disconnected', handlePeerDisconnected);
    on('peer-ready', handlePeerReady);
    console.log('[Remote] Signal handler registered');

    lastFpsTime = performance.now();

    if (isHost) {
      await initHostMode();
    } else {
      await initClientMode();
    }
  });

  function handlePeerReady(data: { fromId: string }) {
    if (!isHost || data.fromId !== peerId) return;
    
    console.log('[Remote] Peer is ready, creating WebRTC connection');
    statusMessage = 'Peer ready, connecting...';
    createPeer(true);
  }

  function handlePasswordRequest(data: { fromId: string }) {
    console.log('[Remote] Password requested from:', data.fromId);
    if (data.fromId === peerId) {
      showPasswordModal = true;
      statusMessage = 'Password required...';
    }
  }

  function handlePeerDisconnected() {
    console.log('[Remote] Peer disconnected via signaling server');
    handleConnectionLost('Remote peer disconnected');
  }

  function handleConnectionLost(reason: string) {
    if (showDisconnectModal) return;
    
    console.log('[Remote] Connection lost:', reason);
    disconnectReason = reason;
    showDisconnectModal = true;
    isConnected = false;
    statusMessage = 'Disconnected';
    
    if (isHost) {
      stopScreenCapture();
      frameUnlisten?.();
    }
  }

  function submitPassword() {
    if (passwordInput) {
      sendPasswordResponse(peerId, passwordInput);
      showPasswordModal = false;
      statusMessage = 'Verifying password...';
      passwordInput = '';
    }
  }

  onDestroy(() => {
    cleanup();
  });

  function cleanup() {
    off('signal');
    off('password-request');
    off('peer-disconnected');
    off('peer-ready');
    peer?.destroy();
    peer = null;

    if (isHost) {
      stopScreenCapture();
      frameUnlisten?.();
    }

    connection.disconnect();
  }

  async function initHostMode() {
    statusMessage = 'Setting up screen capture...';

    await startScreenCapture(screenId, 30, 70);
    isStreaming = true;
    statusMessage = 'Waiting for peer to connect...';
  }

  async function initClientMode() {
    console.log('[Remote] Initializing client mode');
    statusMessage = 'Waiting for host connection...';
    
    await tick();
    
    if (canvasElement) {
      ctx = canvasElement.getContext('2d', { desynchronized: true });
      canvasReady = true;
    }
    
    frameImage = new Image();
    frameImage.onload = () => {
      if (!ctx || !frameImage || !canvasElement) return;
      
      if (canvasElement.width !== frameImage.width || canvasElement.height !== frameImage.height) {
        canvasElement.width = frameImage.width;
        canvasElement.height = frameImage.height;
        remoteWidth = frameImage.width;
        remoteHeight = frameImage.height;
      }
      
      ctx.drawImage(frameImage, 0, 0);
      
      frameCount++;
      const now = performance.now();
      if (now - lastFpsTime >= 1000) {
        currentFps = frameCount;
        frameCount = 0;
        lastFpsTime = now;
      }
      
      isRenderingFrame = false;
      if (pendingFrame) {
        const nextFrame = pendingFrame;
        pendingFrame = null;
        renderFrame(nextFrame);
      }
    };
    
    createPeer(false);
    console.log('[Remote] Client peer created, waiting for signals');
  }

  function renderFrame(base64: string) {
    if (!frameImage || isRenderingFrame) {
      // Drop frame if still rendering previous one (prevents queue buildup)
      pendingFrame = base64;
      return;
    }
    
    isRenderingFrame = true;
    frameImage.src = `data:image/jpeg;base64,${base64}`;
  }

  function createPeer(initiator: boolean) {
    console.log('[Remote] Creating peer:', { initiator });
    
    peer = new Peer({
      initiator,
      trickle: true,
      channelConfig: {
        ordered: false,  // Unordered for lower latency
        maxRetransmits: 0  // No retransmits - drop stale frames
      },
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' }
        ]
      }
    });

    peer.on('signal', (data) => {
      console.log('[Remote] Sending signal to:', peerId, data.type);
      sendSignal(peerId, data);
    });

    peer.on('connect', () => {
      console.log('[Remote] Peer connected!');
      isConnected = true;
      statusMessage = 'Connected';
      connection.setConnected({
        id: peerId,
        hostname: 'Remote',
        platform: 'unknown'
      });

      if (isHost) {
        startFrameStreaming();
      }
    });

    peer.on('data', (data) => {
      handleDataChannelMessage(data);
    });

    peer.on('close', () => {
      handleConnectionLost('Connection closed by remote peer');
    });

    peer.on('error', (err) => {
      console.error('Peer error:', err);
      handleConnectionLost(`Connection error: ${err.message}`);
    });
  }

  function startFrameStreaming() {
    if (!isHost) return;
    
    console.log('[Remote] Starting frame streaming via data channel');
    
    onScreenFrame((base64) => {
      if (!peer || !isConnected) return;
      
      try {
        peer.send(JSON.stringify({ type: 'frame', data: base64 }));
      } catch (e) {
        console.warn('Failed to send frame:', e);
      }
    }).then(unlisten => {
      frameUnlisten = unlisten;
    });
  }

  function handleDataChannelMessage(data: Uint8Array | string) {
    try {
      const message = JSON.parse(data.toString());
      
      if (message.type === 'frame' && !isHost) {
        renderFrame(message.data);
      } else if (message.type !== 'frame') {
        handleRemoteInput(message);
      }
    } catch (e) {
      console.error('Failed to parse data channel message:', e);
    }
  }

  function handleSignal(data: { fromId: string; signal: any }) {
    console.log('[Remote] Received signal from:', data.fromId, 'expected:', peerId, 'signal type:', data.signal?.type);
    if (data.fromId === peerId && peer) {
      console.log('[Remote] Processing signal');
      peer.signal(data.signal);
    } else {
      console.log('[Remote] Ignoring signal - fromId mismatch or no peer');
    }
  }

  async function handleRemoteInput(input: any) {
    if (!isHost) return;

    try {
      switch (input.type) {
        case 'mousemove':
          await mouseMove(input.x, input.y);
          break;
        case 'mousedown':
          await mouseDown(input.button);
          break;
        case 'mouseup':
          await mouseUp(input.button);
          break;
        case 'click':
          await mouseClick(input.button);
          break;
        case 'scroll':
          await mouseScroll(input.direction, input.amount);
          break;
        case 'keypress':
          await keyPress(input.key, input.modifiers);
          break;
        case 'type':
          await typeText(input.text);
          break;
      }
    } catch (e) {
      console.error('Input error:', e);
    }
  }

  function sendInput(input: any) {
    if (peer && isConnected && !isHost) {
      peer.send(JSON.stringify(input));
    }
  }

  function handleMouseMove(e: MouseEvent) {
    if (!canvasElement) return;
    const rect = canvasElement.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) / rect.width * remoteWidth);
    const y = Math.round((e.clientY - rect.top) / rect.height * remoteHeight);
    sendInput({ type: 'mousemove', x, y });
  }

  function handleMouseDown(e: MouseEvent) {
    const button = e.button === 0 ? 'left' : e.button === 2 ? 'right' : 'middle';
    sendInput({ type: 'mousedown', button });
  }

  function handleMouseUp(e: MouseEvent) {
    const button = e.button === 0 ? 'left' : e.button === 2 ? 'right' : 'middle';
    sendInput({ type: 'mouseup', button });
  }

  function handleWheel(e: WheelEvent) {
    e.preventDefault();
    const direction = e.deltaY > 0 ? 'down' : 'up';
    sendInput({ type: 'scroll', direction, amount: 3 });
  }

  function handleKeyDown(e: KeyboardEvent) {
    e.preventDefault();
    sendInput({
      type: 'keypress',
      key: e.key,
      modifiers: {
        shift: e.shiftKey,
        control: e.ctrlKey,
        alt: e.altKey,
        meta: e.metaKey
      }
    });
  }

  function disconnect() {
    cleanup();
    goto('/');
  }
</script>

<svelte:window on:keydown={handleKeyDown} />

<div class="h-full flex flex-col bg-dark-900">
  <!-- Toolbar -->
  <div class="flex items-center justify-between px-4 py-2 bg-dark-800 border-b border-dark-700">
    <div class="flex items-center gap-4">
      <button class="btn-secondary text-sm" on:click={disconnect}>
        Disconnect
      </button>
      <span class="text-sm text-dark-400">
        {isHost ? 'Hosting' : 'Viewing'}: {peerId}
      </span>
    </div>

    <div class="flex items-center gap-2">
      <span class="w-2 h-2 rounded-full {isConnected ? 'bg-green-500' : 'bg-yellow-500'}"></span>
      <span class="text-sm text-dark-300">{statusMessage}</span>
    </div>
  </div>

  <!-- Video Container -->
  <div class="flex-1 flex items-center justify-center bg-black overflow-hidden relative">
    {#if !isHost}
      <canvas
        bind:this={canvasElement}
        class="max-w-full max-h-full cursor-none"
        on:mousemove={handleMouseMove}
        on:mousedown={handleMouseDown}
        on:mouseup={handleMouseUp}
        on:wheel={handleWheel}
        on:contextmenu|preventDefault
        width={remoteWidth}
        height={remoteHeight}
      />
      <div class="absolute top-2 right-2 bg-black/50 px-2 py-1 rounded text-xs text-green-400 font-mono">
        {currentFps} FPS
      </div>
    {:else}
      <div class="text-center text-dark-400">
        <p class="text-lg mb-2">Screen sharing active</p>
        <p class="text-sm">Your screen is being shared with the remote peer</p>
      </div>
    {/if}
  </div>
</div>

{#if showPasswordModal}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-dark-800 rounded-lg p-6 max-w-md w-full mx-4">
      <h3 class="text-lg font-semibold mb-4">Password Required</h3>
      <p class="text-dark-300 mb-4 text-sm">Enter the password for the remote device.</p>
      <input
        type="password"
        bind:value={passwordInput}
        placeholder="Password"
        class="input mb-4 w-full"
        on:keydown={(e) => e.key === 'Enter' && submitPassword()}
      />
      {#if passwordError}
        <p class="text-red-400 text-sm mb-4">{passwordError}</p>
      {/if}
      <div class="flex gap-3">
        <button class="btn-secondary flex-1" on:click={disconnect}>Cancel</button>
        <button class="btn-primary flex-1" on:click={submitPassword}>Submit</button>
      </div>
    </div>
  </div>
{/if}

{#if showDisconnectModal}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-dark-800 rounded-lg p-6 max-w-md w-full mx-4 text-center">
      <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
        <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h3 class="text-lg font-semibold mb-2">Disconnected</h3>
      <p class="text-dark-300 mb-6 text-sm">{disconnectReason}</p>
      <button class="btn-primary w-full" on:click={disconnect}>
        Return to Home
      </button>
    </div>
  </div>
{/if}
