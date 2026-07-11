<div align="center">

<img src="resources/icon.png" alt="ProxyChecker" width="96" />

# ProxyChecker

**Cross-platform desktop app for testing proxy availability and performance**

[Download](#-download) · [Features](#-features) · [Development](#-development) · [Releases](https://github.com/NemoKing1210/ProxyChecker/releases) · [Changelog](./CHANGELOG.md) · [Report Bug](https://github.com/NemoKing1210/ProxyChecker/issues)

<br />

[![GitHub release](https://img.shields.io/github/v/release/NemoKing1210/ProxyChecker?label=release&sort=semver)](https://github.com/NemoKing1210/ProxyChecker/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](#-license)
[![CI](https://github.com/NemoKing1210/ProxyChecker/actions/workflows/ci.yml/badge.svg)](https://github.com/NemoKing1210/ProxyChecker/actions/workflows/ci.yml)
[![Release](https://github.com/NemoKing1210/ProxyChecker/actions/workflows/release.yml/badge.svg)](https://github.com/NemoKing1210/ProxyChecker/actions/workflows/release.yml)

[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)](#-download)
[![Electron](https://img.shields.io/badge/Electron-39-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MUI](https://img.shields.io/badge/MUI-9-007FFF?logo=mui&logoColor=white)](https://mui.com/)

</div>

---

ProxyChecker helps you validate proxy servers quickly from a single desktop interface. Check connectivity, measure latency, organize lists into groups, sync settings across devices, and export results — all without leaving the app.

## ✨ Features

### Proxy checking

| | |
|---|---|
| **Protocols** | HTTP, HTTPS, SOCKS4, SOCKS5, [MTProto](https://core.telegram.org/mtproto) |
| **Bulk import** | Paste, file upload, quick-fill parser |
| **Metrics** | Response time, external IP, geo hints, country flags |
| **Batch checks** | Check all, per-group checks, tray quick actions |
| **Export** | Working / failed proxies, backup files |

### Organization & UI

- **Groups** — folders with custom icons and colors
- **Favorites** — pin proxies for tray menu access
- **Virtualized list** — smooth scrolling for large lists (80+ cards)
- **Themes** — light, dark, and system mode
- **i18n** — English, Russian, Ukrainian, German, French, Spanish, Portuguese, Japanese, Chinese, Arabic, Hindi
- **Tray** — background mode, notifications, favorite proxies from the tray

### Sync & backup

- **GitHub Gist** — encrypted cloud sync with auto-sync and startup pull
- **Google Drive** — OAuth sign-in, hidden app data folder storage
- **Local backup** — import / export with optional encryption
- **Scopes** — sync full data, proxies only, or settings only

## 📥 Download

Pre-built installers are available on **[GitHub Releases](https://github.com/NemoKing1210/ProxyChecker/releases)**.

| Platform | File |
| -------- | ---- |
| **Windows** | `ProxyChecker-{version}-setup.exe` |
| **macOS** | `ProxyChecker-{version}-x64.dmg`, `ProxyChecker-{version}-arm64.dmg` |
| **Linux** | `ProxyChecker-{version}-x64.AppImage`, `ProxyChecker-{version}-amd64.deb` |

> **Note:** Builds are unsigned by default. Windows may show a SmartScreen prompt; macOS may require allowing the app in System Settings.

## 🛠 Tech stack

| Layer | Technology |
| ----- | ---------- |
| Desktop runtime | [Electron](https://www.electronjs.org/) |
| Build tool | [electron-vite](https://electron-vite.org/) |
| UI | [React 19](https://react.dev/) + [Material UI](https://mui.com/) |
| Language | [TypeScript](https://www.typescriptlang.org/) |
| State | [Zustand](https://github.com/pmndrs/zustand) |
| Packaging | [electron-builder](https://www.electron.build/) |
| i18n | [i18next](https://www.i18next.com/) |
| Lint / format | [ESLint](https://eslint.org/) + [Prettier](https://prettier.io/) |

## 🚀 Development

### Prerequisites

- [Node.js](https://nodejs.org/) **18+** (20+ recommended)
- [npm](https://www.npmjs.com/) **9+**

### Setup

```bash
git clone https://github.com/NemoKing1210/ProxyChecker.git
cd ProxyChecker
npm install
```

For **Google Drive sync** in dev builds, copy [`.env.example`](./.env.example) to `.env` and set `GOOGLE_OAUTH_CLIENT_ID`. See [Google Drive setup](#-google-drive-sync-developer-setup) below.

### Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Start with HMR (`F12` — DevTools) |
| `npm start` | Preview production build |
| `npm run build` | Type-check + production build |
| `npm run build:win` | Windows installer → `dist/` |
| `npm run build:mac` | macOS installer → `dist/` |
| `npm run build:linux` | Linux AppImage + deb → `dist/` |
| `npm run build:unpack` | Unpacked build (no installer) |
| `npm run typecheck` | TypeScript checks |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

### Project structure

```
src/
├── main/           # Electron main process (IPC, proxy checks, sync, tray)
├── preload/        # Secure bridge between main and renderer
└── renderer/       # React UI
    └── src/
        ├── components/
        ├── pages/
        ├── store/
        └── i18n/
```

### Architecture

```
┌─────────────────────────────────────────┐
│           Renderer (React + MUI)         │
│      UI, settings, proxy list, sync      │
└──────────────────┬──────────────────────┘
                   │ IPC (preload bridge)
┌──────────────────▼──────────────────────┐
│          Main process (Electron)         │
│  Proxy checks · file I/O · sync · tray  │
└─────────────────────────────────────────┘
```

Proxy validation runs in the main process to avoid browser sandbox limits and use native networking libraries.

## 📦 Releasing

Releases are published to [GitHub Releases](https://github.com/NemoKing1210/ProxyChecker/releases) automatically via the [**Release** workflow](.github/workflows/release.yml) when a version tag is pushed.

### Prerequisites

1. Add **`GOOGLE_OAUTH_CLIENT_ID`** in GitHub → **Settings → Secrets and variables → Actions**
2. Update `version` in [`package.json`](./package.json) and add a section to [`CHANGELOG.md`](./CHANGELOG.md)

### Automated release (recommended)

```bash
# 1. Commit version bump
git add package.json CHANGELOG.md
git commit -m "chore: release v1.36.0"

# 2. Tag (must match package.json version, with v prefix)
git tag v1.36.0

# 3. Push
git push origin main
git push origin v1.36.0
```

The workflow builds **Windows**, **macOS**, and **Linux** in parallel and uploads installers to GitHub Releases.

### Local release (single platform)

Requires a [GitHub personal access token](https://github.com/settings/tokens) with `repo` scope:

```powershell
$env:GH_TOKEN = "ghp_..."
$env:GOOGLE_OAUTH_CLIENT_ID = "your-client-id.apps.googleusercontent.com"
npm run release:win
```

Without `GH_TOKEN`, use `npm run build:win` to build locally without uploading.

### Code signing (optional)

| Platform | Without signing | With signing |
| -------- | --------------- | ------------ |
| Windows | SmartScreen warning | `WIN_CSC_LINK` + `WIN_CSC_KEY_PASSWORD` secrets |
| macOS | Gatekeeper block | Apple Developer + `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID` |
| Linux | Not required | — |

## ☁ Google Drive sync (developer setup)

Google Drive sign-in uses an OAuth **Desktop app** Client ID embedded at **build time**. End users only click **Sign in with Google**.

1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Enable **Google Drive API**
3. Configure the **OAuth consent screen**
4. Create **Credentials → OAuth client ID → Desktop app**
5. Copy [`.env.example`](./.env.example) → `.env`:

```env
GOOGLE_OAUTH_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

6. Run or build: `npm run dev`, `npm run build:win`, etc.

For CI/release builds, set `GOOGLE_OAUTH_CLIENT_ID` as a repository secret instead of committing `.env`.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-change`
3. Commit your changes and open a Pull Request

Bug reports and feature requests are welcome in [Issues](https://github.com/NemoKing1210/ProxyChecker/issues).

## 📄 License

This project is licensed under the **MIT License** — see [`package.json`](./package.json).

---

<div align="center">

Made with ❤️ by [NemoKing1210](https://github.com/NemoKing1210)

</div>
