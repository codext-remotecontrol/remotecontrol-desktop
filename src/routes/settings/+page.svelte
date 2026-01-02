<script lang="ts">
  import { settings } from '$lib/stores';
  import { hashPassword, generateConnectionId } from '$lib/services/tauri';

  let password = '';
  let confirmPassword = '';
  let passwordError = '';
  let saveMessage = '';

  async function savePassword() {
    passwordError = '';

    if (!password) {
      passwordError = 'Password is required';
      return;
    }

    if (password !== confirmPassword) {
      passwordError = 'Passwords do not match';
      return;
    }

    if (password.length < 4) {
      passwordError = 'Password must be at least 4 characters';
      return;
    }

    const hash = await hashPassword(password);
    settings.updateSetting('password', password);
    settings.updateSetting('passwordHash', hash);
    await settings.save();

    password = '';
    confirmPassword = '';
    showSaveMessage('Password updated');
  }

  async function regenerateId() {
    const newId = await generateConnectionId(true);
    settings.updateSetting('connectionId', newId);
    await settings.save();
    showSaveMessage('Connection ID regenerated');
  }

  async function updateSetting(key: keyof typeof $settings, value: any) {
    settings.updateSetting(key, value);
    await settings.save();
    showSaveMessage('Settings saved');
  }

  function showSaveMessage(msg: string) {
    saveMessage = msg;
    setTimeout(() => saveMessage = '', 2000);
  }
</script>

<div class="p-6 animate-fade-in max-w-2xl">
  <h1 class="text-2xl font-bold mb-6">Settings</h1>

  {#if saveMessage}
    <div class="mb-4 p-3 bg-green-600/20 border border-green-600 rounded-lg text-green-400 text-sm">
      {saveMessage}
    </div>
  {/if}

  <!-- Connection Settings -->
  <section class="card mb-6">
    <h2 class="text-lg font-semibold mb-4 text-dark-200">Connection</h2>

    <div class="space-y-4">
      <div>
        <label class="block text-sm text-dark-400 mb-1">Connection ID</label>
        <div class="flex gap-2">
          <input
            type="text"
            readonly
            value={$settings.connectionId}
            class="input font-mono"
          />
          <button class="btn-secondary" on:click={regenerateId}>
            Regenerate
          </button>
        </div>
        <p class="text-xs text-dark-500 mt-1">
          Others use this ID to connect to your device
        </p>
      </div>
    </div>
  </section>

  <!-- Security Settings -->
  <section class="card mb-6">
    <h2 class="text-lg font-semibold mb-4 text-dark-200">Security</h2>

    <div class="space-y-4">
      <div>
        <label class="block text-sm text-dark-400 mb-1">Access Password</label>
        <input
          type="password"
          bind:value={password}
          placeholder="Enter new password"
          class="input"
        />
      </div>

      <div>
        <label class="block text-sm text-dark-400 mb-1">Confirm Password</label>
        <input
          type="password"
          bind:value={confirmPassword}
          placeholder="Confirm password"
          class="input"
        />
      </div>

      {#if passwordError}
        <p class="text-red-400 text-sm">{passwordError}</p>
      {/if}

      <button class="btn-primary" on:click={savePassword}>
        Update Password
      </button>

      <p class="text-xs text-dark-500">
        {$settings.passwordHash ? 'Password is set' : 'No password set - connections will require manual approval'}
      </p>
    </div>
  </section>

  <!-- Performance Settings -->
  <section class="card mb-6">
    <h2 class="text-lg font-semibold mb-4 text-dark-200">Performance</h2>

    <div class="space-y-4">
      <div>
        <label class="block text-sm text-dark-400 mb-1">
          Quality: {$settings.quality}%
        </label>
        <input
          type="range"
          min="30"
          max="100"
          step="5"
          value={$settings.quality}
          on:change={(e) => updateSetting('quality', parseInt(e.currentTarget.value))}
          class="w-full"
        />
        <div class="flex justify-between text-xs text-dark-500">
          <span>Lower bandwidth</span>
          <span>Higher quality</span>
        </div>
      </div>

      <div>
        <label class="block text-sm text-dark-400 mb-1">
          Frame Rate: {$settings.fps} FPS
        </label>
        <input
          type="range"
          min="10"
          max="60"
          step="5"
          value={$settings.fps}
          on:change={(e) => updateSetting('fps', parseInt(e.currentTarget.value))}
          class="w-full"
        />
        <div class="flex justify-between text-xs text-dark-500">
          <span>Smoother connection</span>
          <span>Smoother video</span>
        </div>
      </div>
    </div>
  </section>

  <!-- Startup Settings -->
  <section class="card">
    <h2 class="text-lg font-semibold mb-4 text-dark-200">Startup</h2>

    <div class="space-y-4">
      <label class="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={$settings.autoStart}
          on:change={(e) => updateSetting('autoStart', e.currentTarget.checked)}
          class="w-4 h-4 rounded border-dark-500 bg-dark-700 text-primary-600 focus:ring-primary-500"
        />
        <span class="text-sm">Start with system</span>
      </label>

      <label class="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={$settings.minimizeToTray}
          on:change={(e) => updateSetting('minimizeToTray', e.currentTarget.checked)}
          class="w-4 h-4 rounded border-dark-500 bg-dark-700 text-primary-600 focus:ring-primary-500"
        />
        <span class="text-sm">Minimize to system tray</span>
      </label>
    </div>
  </section>
</div>
