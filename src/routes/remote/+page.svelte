<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { connection } from '$lib/stores';
  import { on, off, sendSignal } from '$lib/services/socket';
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
    type UnlistenFn
  } from '$lib/services/tauri';
  import Peer from 'simple-peer';

  let peerId: string;
  let isHost: boolean;
  let screenId: number;

  let peer: Peer.Instance | null = null;
  let videoElement: HTMLVideoElement;
  let canvasElement: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;

  let isConnected = false;
  let isStreaming = false;
  let statusMessage = 'Initializing...';

  let frameUnlisten: UnlistenFn | null = null;
  let canvasStream: MediaStream | null = null;

  // Remote screen dimensions (for input mapping)
  let remoteWidth = 1920;
  let remoteHeight = 1080;

  onMount(async () => {
    const params = $page.url.searchParams;
    peerId = params.get('peer') || '';
    isHost = params.get('mode') === 'host';
    screenId = parseInt(params.get('screen') || '0');

    if (!peerId) {
      goto('/');
      return;
    }

    // Set up signaling handlers
    on('signal', handleSignal);

    if (isHost) {
      await initHostMode();
    } else {
      await initClientMode();
    }
  });

  onDestroy(() => {
    cleanup();
  });

  function cleanup() {
    off('signal');
    peer?.destroy();
    peer = null;

    if (isHost) {
      stopScreenCapture();
      frameUnlisten?.();
    }

    canvasStream?.getTracks().forEach(t => t.stop());
    connection.disconnect();
  }

  async function initHostMode() {
    statusMessage = 'Setting up screen capture...';

    // Set up canvas for frame streaming
    canvasElement = document.createElement('canvas');
    canvasElement.width = 1920;
    canvasElement.height = 1080;
    ctx = canvasElement.getContext('2d', { desynchronized: true });

    // Listen for screen frames from Rust
    frameUnlisten = await onScreenFrame((base64) => {
      if (!ctx) return;

      const img = new Image();
      img.onload = () => {
        canvasElement.width = img.width;
        canvasElement.height = img.height;
        remoteWidth = img.width;
        remoteHeight = img.height;
        ctx?.drawImage(img, 0, 0);
      };
      img.src = `data:image/jpeg;base64,${base64}`;
    });

    // Create MediaStream from canvas
    canvasStream = canvasElement.captureStream(30);

    // Create peer connection as initiator
    createPeer(true, canvasStream);

    // Start screen capture
    await startScreenCapture(screenId, 30, 75);
    isStreaming = true;
    statusMessage = 'Waiting for peer to connect...';
  }

  async function initClientMode() {
    statusMessage = 'Waiting for host connection...';

    // Create peer connection as receiver
    createPeer(false);
  }

  function createPeer(initiator: boolean, stream?: MediaStream) {
    peer = new Peer({
      initiator,
      trickle: true,
      stream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
    });

    peer.on('signal', (data) => {
      sendSignal(peerId, data);
    });

    peer.on('connect', () => {
      isConnected = true;
      statusMessage = 'Connected';
      connection.setConnected({
        id: peerId,
        hostname: 'Remote',
        platform: 'unknown'
      });
    });

    peer.on('stream', (stream) => {
      if (videoElement) {
        videoElement.srcObject = stream;
        videoElement.play();
      }
    });

    peer.on('data', (data) => {
      handleRemoteInput(JSON.parse(data.toString()));
    });

    peer.on('close', () => {
      statusMessage = 'Connection closed';
      isConnected = false;
    });

    peer.on('error', (err) => {
      statusMessage = `Error: ${err.message}`;
      console.error('Peer error:', err);
    });
  }

  function handleSignal(data: { fromId: string; signal: any }) {
    if (data.fromId === peerId && peer) {
      peer.signal(data.signal);
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
    if (!videoElement) return;
    const rect = videoElement.getBoundingClientRect();
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
  <div class="flex-1 flex items-center justify-center bg-black overflow-hidden">
    {#if !isHost}
      <video
        bind:this={videoElement}
        class="max-w-full max-h-full cursor-none"
        on:mousemove={handleMouseMove}
        on:mousedown={handleMouseDown}
        on:mouseup={handleMouseUp}
        on:wheel={handleWheel}
        on:contextmenu|preventDefault
        autoplay
        playsinline
        muted
      />
    {:else}
      <div class="text-center text-dark-400">
        <p class="text-lg mb-2">Screen sharing active</p>
        <p class="text-sm">Your screen is being shared with the remote peer</p>
      </div>
    {/if}
  </div>
</div>
