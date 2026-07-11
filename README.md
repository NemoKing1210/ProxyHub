<div align="center">

<img src="resources/icon.png" alt="ProxyChecker" width="96" />

# ProxyChecker

**Cross-platform desktop app for testing proxy availability and performance**

[Download](#-download) · [Features](#-features) · [Releases](https://github.com/NemoKing1210/ProxyChecker/releases) · [Changelog](./CHANGELOG.md) · [Developer guide](./DEVELOPER.md) · [Report Bug](https://github.com/NemoKing1210/ProxyChecker/issues)

<br />

[![GitHub release](https://img.shields.io/github/v/release/NemoKing1210/ProxyChecker?label=release&sort=semver)](https://github.com/NemoKing1210/ProxyChecker/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](#-license)
[![CI](https://github.com/NemoKing1210/ProxyChecker/actions/workflows/ci.yml/badge.svg)](https://github.com/NemoKing1210/ProxyChecker/actions/workflows/ci.yml)
[![Release](https://github.com/NemoKing1210/ProxyChecker/actions/workflows/release.yml/badge.svg)](https://github.com/NemoKing1210/ProxyChecker/actions/workflows/release.yml)

[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)](#-platform-support)
[![Electron](https://img.shields.io/badge/Electron-39-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MUI](https://img.shields.io/badge/MUI-9-007FFF?logo=mui&logoColor=white)](https://mui.com/)

</div>

---

ProxyChecker helps you validate proxy servers quickly from a single desktop interface. Check connectivity, measure latency, organize lists into groups, sync settings across devices, and export results — all without leaving the app.

## ✨ Features

### Proxy checking

|                  |                                                                           |
| ---------------- | ------------------------------------------------------------------------- |
| **Protocols**    | HTTP, HTTPS, SOCKS4, SOCKS5, [MTProto](https://core.telegram.org/mtproto) |
| **Bulk import**  | Paste, file upload, quick-fill parser                                     |
| **Metrics**      | Response time, external IP, geo hints, country flags                      |
| **Batch checks** | Check all, per-group checks, tray quick actions                           |
| **Export**       | Working / failed proxies, backup files                                    |

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

### Updates

- **Auto-update** — check, download, and install new versions from Settings → About (via GitHub Releases)

## 📥 Download

Pre-built **Windows** installers are available on **[GitHub Releases](https://github.com/NemoKing1210/ProxyChecker/releases)**.

| Platform    | Installer                                                                 |
| ----------- | ------------------------------------------------------------------------- |
| **Windows** | `ProxyChecker-{version}-setup.exe`                                        |

> **Note:** Builds are unsigned by default. Windows may show a SmartScreen prompt.

## 🖥 Platform support

The app is built with Electron and can run on Windows, macOS, and Linux. **Automated release builds and published installers are Windows-only for now.**

| Platform    | Status              | Release builds | Published installers | Notes |
| ----------- | ------------------- | -------------- | -------------------- | ----- |
| **Windows** | ✅ Supported        | Yes            | Yes (NSIS `.exe`)    | Primary target; CI release workflow, auto-update |
| **macOS**   | ⏸ Paused            | No             | No                   | Can be built locally with `npm run build:mac` (DMG + zip) |
| **Linux**   | ⏸ Paused            | No             | No                   | Can be built locally with `npm run build:linux` (AppImage + deb) |

To build for macOS or Linux from source, see the **[Developer guide](./DEVELOPER.md)**.

## 📄 License

This project is licensed under the **MIT License** — see [`LICENSE`](./LICENSE).

---

<div align="center">

Made with ❤️ by [NemoKing1210](https://github.com/NemoKing1210)

Want to build from source or publish a release? See the **[Developer guide](./DEVELOPER.md)**.

</div>
