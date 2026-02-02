<script lang="ts">
  import { onMount, onDestroy, tick } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { connection } from '$lib/stores';
  import {
    startScreenCapture,
    stopScreenCapture,
    onScreenFrame,
    getScreenSize,
    mouseMove,
    mouseClick,
    mouseDown,
    mouseUp,
    mouseScroll,
    keyPress,
    typeText,
    type UnlistenFn
  } from '$lib/services/tauri';
  import { Buffer } from 'buffer';
  
  if (typeof window !== 'undefined') {
    window.Buffer = Buffer;
  }
  
  import Peer from 'simple-peer';
  import { io, type Socket } from 'socket.io-client';

  const SOCKET_URL = 'https://node.remote-control.codext.de';
  const ICE_SERVERS = [
    { urls: ['stun:turn.codext.de', 'stun:stun.nextcloud.com:443'] },
    {
      username: 'Z1VCyC6DDDrwtgeipeplGmJ0',
      credential: '8a630ce342e1ec3fb2b8dbc8eaa395f837038ddcc5',
      urls: [
        'turn:turn.codext.de:80?transport=udp',
        'turn:turn.codext.de:80?transport=tcp',
        'turns:turn.codext.de:443?transport=tcp'
      ]
    }
  ];

  let peerId: string;
  let isHost: boolean;
  let screenId: number;
  let myId: string;

  let socket: Socket | null = null;
  let peer: Peer.Instance | null = null;
  let canvasElement: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;

  let isConnected = false;
  let isStreaming = false;
  let statusMessage = 'Initializing...';

  let frameUnlisten: UnlistenFn | null = null;

  let remoteWidth = 1920;
  let remoteHeight = 1080;
  let hostScreenSize = { width: 1920, height: 1080 };

  let showPasswordModal = false;
  let passwordInput = '';
  let passwordError = '';

  let frameImage: HTMLImageElement | null = null;
  let pendingFrame: string | null = null;
  let isRenderingFrame = false;
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
    myId = params.get('myId') || peerId;

    console.log('[Remote] Mounted:', { peerId, isHost, screenId, myId });

    if (!peerId) {
      goto('/');
      return;
    }

    lastFpsTime = performance.now();

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
    peer?.destroy();
    peer = null;
    socket?.disconnect();
    socket = null;

    if (isHost) {
      stopScreenCapture();
      frameUnlisten?.();
    }

    connection.disconnect();
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

  async function initHostMode() {
    statusMessage = 'Waiting for connection...';
    
    console.log('[Host] Joining own room:', myId);
    
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      timeout: 10000
    });

    socket.on('connect', () => {
      console.log('[Host] Socket connected, joining room:', myId);
      socket?.emit('join', myId);
    });

    socket.on('disconnect', () => {
      console.log('[Host] Socket disconnected');
      handleConnectionLost('Socket disconnected');
    });

    socket.on('disconnected', () => {
      console.log('[Host] Peer left the room');
      handleConnectionLost('Remote peer disconnected');
    });

    socket.on('remoteData', async (data: any) => {
      console.log('[Host] Received:', typeof data === 'string' ? data : JSON.stringify(data).substring(0, 100));
      
      if (typeof data === 'string') {
        if (data === 'hi') {
          console.log('[Host] Client said hi, starting connection');
          statusMessage = 'Client connected, starting stream...';
          
          const screenSize = await getScreenSize(screenId);
          hostScreenSize = { width: screenSize.width, height: screenSize.height };
          socket?.emit('remoteData', `screenSize,${screenSize.width},${screenSize.height}`);
          
          await startScreenCapture(screenId, 30, 70);
          isStreaming = true;
          
          createHostPeer();
        }
      } else if (data && peer) {
        console.log('[Host] Signaling data received, type:', data.type);
        peer.signal(data);
      }
    });
  }

  function createHostPeer() {
    console.log('[Host] Creating peer as initiator');
    
    peer = new Peer({
      initiator: true,
      trickle: true,
      config: { iceServers: ICE_SERVERS }
    });

    peer.on('signal', (data) => {
      console.log('[Host] Sending signal:', data.type);
      socket?.emit('remoteData', data);
    });

    peer.on('connect', () => {
      console.log('[Host] Peer connected!');
      isConnected = true;
      statusMessage = 'Connected - Streaming';
      
      startFrameStreaming();
    });

    peer.on('data', (data) => {
      handleRemoteInput(data);
    });

    peer.on('close', () => {
      handleConnectionLost('Connection closed');
    });

    peer.on('error', (err) => {
      console.error('[Host] Peer error:', err);
      handleConnectionLost(`Error: ${err.message}`);
    });
  }

  function startFrameStreaming() {
    console.log('[Host] Starting frame streaming');
    
    onScreenFrame((base64) => {
      if (!peer || !isConnected) return;
      
      try {
        peer.send(JSON.stringify({ type: 'frame', data: base64 }));
      } catch (e) {
        // Channel full, drop frame
      }
    }).then(unlisten => {
      frameUnlisten = unlisten;
    });
  }

  async function initClientMode() {
    console.log('[Client] Initializing, will connect to host room:', peerId);
    statusMessage = 'Connecting to host...';
    
    await tick();
    
    if (canvasElement) {
      ctx = canvasElement.getContext('2d', { desynchronized: true });
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
    
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      timeout: 10000
    });

    socket.on('connect', () => {
      console.log('[Client] Socket connected, joining HOST room:', peerId);
      socket?.emit('join', peerId);
      
      let hiRetries = 0;
      const maxRetries = 10;
      const sendHi = () => {
        if (hiRetries >= maxRetries || isConnected || peer) {
          return;
        }
        hiRetries++;
        console.log(`[Client] Sending hi to host (attempt ${hiRetries}/${maxRetries})`);
        socket?.emit('remoteData', 'hi');
        statusMessage = `Waiting for host... (${hiRetries})`;
        setTimeout(sendHi, 1000);
      };
      
      setTimeout(sendHi, 200);
    });

    socket.on('disconnect', () => {
      console.log('[Client] Socket disconnected');
      handleConnectionLost('Socket disconnected');
    });

    socket.on('disconnected', () => {
      console.log('[Client] Host left the room');
      handleConnectionLost('Host disconnected');
    });

    socket.on('remoteData', (data: any) => {
      console.log('[Client] Received:', typeof data === 'string' ? data.substring(0, 50) : (data?.type || 'object'));
      
      if (typeof data === 'string') {
        if (data.startsWith('screenSize')) {
          const parts = data.split(',');
          hostScreenSize = {
            width: parseInt(parts[1]),
            height: parseInt(parts[2])
          };
          console.log('[Client] Host screen size:', hostScreenSize);
        } else if (data === 'pwRequest') {
          showPasswordModal = true;
          statusMessage = 'Password required...';
        } else if (data === 'pwWrong') {
          passwordError = 'Incorrect password';
          showPasswordModal = true;
        } else if (data === 'decline') {
          handleConnectionLost('Connection declined by host');
        }
      } else if (data && typeof data === 'object') {
        if (!peer) {
          console.log('[Client] Received first signal, creating peer');
          createClientPeer();
        }
        console.log('[Client] Passing signal to peer, type:', data.type);
        peer?.signal(data);
      }
    });
  }

  function createClientPeer() {
    console.log('[Client] Creating peer (non-initiator)');
    
    peer = new Peer({
      initiator: false,
      trickle: true,
      config: { iceServers: ICE_SERVERS }
    });

    peer.on('signal', (data) => {
      console.log('[Client] Sending signal:', data.type);
      socket?.emit('remoteData', data);
    });

    peer.on('connect', () => {
      console.log('[Client] Peer connected!');
      isConnected = true;
      statusMessage = 'Connected';
      connection.setConnected({
        id: peerId,
        hostname: 'Remote',
        platform: 'unknown'
      });
    });

    peer.on('data', (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === 'frame') {
          renderFrame(message.data);
        }
      } catch (e) {
        console.error('[Client] Failed to parse data:', e);
      }
    });

    peer.on('close', () => {
      handleConnectionLost('Connection closed');
    });

    peer.on('error', (err) => {
      console.error('[Client] Peer error:', err);
      handleConnectionLost(`Error: ${err.message}`);
    });
  }

  function renderFrame(base64: string) {
    if (!frameImage || isRenderingFrame) {
      pendingFrame = base64;
      return;
    }
    
    isRenderingFrame = true;
    frameImage.src = `data:image/jpeg;base64,${base64}`;
  }

  function submitPassword() {
    if (passwordInput) {
      socket?.emit('remoteData', `pwAnswer:${passwordInput}`);
      showPasswordModal = false;
      statusMessage = 'Verifying password...';
      passwordInput = '';
      passwordError = '';
    }
  }

  async function handleRemoteInput(data: Uint8Array | string) {
    if (!isHost) return;

    try {
      const text = data.toString();
      
      if (text.startsWith('{')) {
        const input = JSON.parse(text);
        
        if (input.type === 'frame') return;
        
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
      }
    } catch (e) {
      console.error('[Host] Input error:', e);
    }
  }

  function sendInput(input: any) {
    if (peer && isConnected && !isHost) {
      peer.send(JSON.stringify(input));
    }
  }

  function handleMouseMove(e: MouseEvent) {
    if (!canvasElement || !isConnected) return;
    const rect = canvasElement.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) / rect.width * hostScreenSize.width);
    const y = Math.round((e.clientY - rect.top) / rect.height * hostScreenSize.height);
    sendInput({ type: 'mousemove', x, y });
  }

  function handleMouseDown(e: MouseEvent) {
    if (!isConnected) return;
    const button = e.button === 0 ? 'left' : e.button === 2 ? 'right' : 'middle';
    sendInput({ type: 'mousedown', button });
  }

  function handleMouseUp(e: MouseEvent) {
    if (!isConnected) return;
    const button = e.button === 0 ? 'left' : e.button === 2 ? 'right' : 'middle';
    sendInput({ type: 'mouseup', button });
  }

  function handleWheel(e: WheelEvent) {
    if (!isConnected) return;
    e.preventDefault();
    const direction = e.deltaY > 0 ? 'down' : 'up';
    sendInput({ type: 'scroll', direction, amount: 3 });
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (!isConnected) return;
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
        {#if isConnected}
          <p class="text-green-400 mt-2">Streaming...</p>
        {/if}
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
