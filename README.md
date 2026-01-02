# Remotecontrol Desktop

A fast and stable remote desktop control application built with **Tauri 2** and **Angular 18**.

## Features

- **Screen Sharing**: Share your screen with remote users via WebRTC
- **Remote Control**: Mouse and keyboard input simulation
- **File Transfer**: Send files to the remote computer
- **Clipboard Sync**: Automatic clipboard synchronization
- **Address Book**: Save frequently connected partners
- **Password Protection**: Secure unattended access with password
- **Multi-Screen Support**: Choose which screen to share
- **Cross-Platform**: Windows, macOS, and Linux support

## Tech Stack

- **Frontend**: Angular 18 + Tailwind CSS
- **Backend**: Rust (Tauri 2)
- **Screen Capture**: xcap (Rust)
- **Input Simulation**: enigo (Rust)
- **Real-time Communication**: WebRTC (simple-peer)
- **Signaling**: Socket.IO

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://www.rust-lang.org/tools/install) 1.70+
- [Tauri CLI](https://tauri.app/v2/guides/get-started/prerequisites)

### Platform-specific Requirements

**Windows:**
- Microsoft Visual Studio C++ Build Tools
- WebView2 (usually pre-installed on Windows 10/11)

**macOS:**
- Xcode Command Line Tools
- Screen Recording permission (will be requested on first use)

**Linux:**
- `webkit2gtk-4.1` and `libappindicator3-1`
- X11 or Wayland display server

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd remotecontrol-desktop

# Install Node.js dependencies
npm install

# Install Rust dependencies (automatic on first build)
```

## Development

```bash
# Start development server (Angular + Tauri)
npm run tauri:dev

# Or run Angular and Tauri separately:
npm run dev        # Angular dev server on port 4200
npm run tauri dev  # Tauri development build
```

## Building

```bash
# Production build
npm run tauri:build

# The installer will be created in:
# - Windows: src-tauri/target/release/bundle/nsis/
# - macOS: src-tauri/target/release/bundle/dmg/
# - Linux: src-tauri/target/release/bundle/appimage/
```

## Project Structure

```
remotecontrol-desktop/
├── src/                    # Angular frontend
│   ├── app/
│   │   ├── core/services/  # Core services (Tauri, Socket, etc.)
│   │   └── shared/         # Shared components
│   ├── pages/              # Application pages
│   ├── assets/             # Static assets and i18n
│   └── environments/       # Environment configs
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── commands/       # Tauri commands
│   │   └── services/       # Background services
│   ├── Cargo.toml          # Rust dependencies
│   └── tauri.conf.json     # Tauri configuration
└── old/                    # Previous Electron version (archived)
```

## Architecture

### WebRTC Flow
1. Host captures screen using Rust (`xcap` crate)
2. Frames are encoded as JPEG and sent via Tauri events
3. Frontend draws frames to canvas
4. Canvas is converted to MediaStream using `captureStream()`
5. MediaStream is sent to remote viewer via WebRTC

### Input Flow
1. Remote viewer captures mouse/keyboard events
2. Events are sent via WebRTC data channel
3. Host receives events and calls Rust commands
4. `enigo` crate simulates input on the host system

## Configuration

Settings are stored using `tauri-plugin-store`:
- Language preference
- Connection ID mode (random/permanent)
- Unattended access settings
- Auto-launch on startup

## Security

- Password-protected unattended access (bcrypt hashed)
- Permission dialog for manual connection approval
- Machine-unique IDs for permanent connections
- TURN server for NAT traversal

## License

MIT License - See LICENSE file for details

## Credits

- Built with [Tauri](https://tauri.app/)
- UI powered by [Angular](https://angular.io/) and [Tailwind CSS](https://tailwindcss.com/)
- Screen capture by [xcap](https://github.com/aspect-build/xcap)
- Input simulation by [enigo](https://github.com/enigo-rs/enigo)
