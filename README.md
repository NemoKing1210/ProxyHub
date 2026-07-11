# ProxyChecker

A cross-platform desktop application for testing the availability and performance of different proxy types. Built with **Electron**, **React 19**, **TypeScript**, and **Material UI**.

## Overview

ProxyChecker helps you validate proxy servers quickly from a single desktop interface. It is designed to support multiple proxy protocols and provide clear, actionable results for each endpoint you test.

### Supported proxy types (planned)

- **HTTP** — standard web proxies
- **HTTPS** — encrypted HTTP proxies
- **SOCKS4** — SOCKS version 4
- **SOCKS5** — SOCKS version 5 with optional authentication
- **MTProto** — Telegram MTProto proxies (server, port, secret)

### Key capabilities (planned)

- Bulk import of proxy lists (paste or file upload)
- Connectivity checks with response time measurement
- Export of working and failed proxies
- Clean, responsive UI powered by Material UI

## Tech stack

| Layer                | Technology                                                       |
| -------------------- | ---------------------------------------------------------------- |
| Desktop runtime      | [Electron](https://www.electronjs.org/)                          |
| Build tool           | [electron-vite](https://electron-vite.org/)                      |
| UI framework         | [React 19](https://react.dev/)                                   |
| Language             | [TypeScript](https://www.typescriptlang.org/)                    |
| Component library    | [Material UI (MUI)](https://mui.com/)                            |
| Packaging            | [electron-builder](https://www.electron.build/)                  |
| Linting / formatting | [ESLint](https://eslint.org/) + [Prettier](https://prettier.io/) |

## Prerequisites

- **Node.js** 18 or later (20+ recommended)
- **npm** 9 or later

## Getting started

### Install dependencies

```bash
npm install
```

### Run in development mode

Starts the app with hot module replacement (HMR) for the renderer process:

```bash
npm run dev
```

Press `F12` to open DevTools while the app is running.

### Preview a production build locally

```bash
npm run build
npm start
```

## Available scripts

| Command                | Description                         |
| ---------------------- | ----------------------------------- |
| `npm run dev`          | Start the app in development mode   |
| `npm start`            | Preview the built app               |
| `npm run build`        | Type-check and build for production |
| `npm run build:win`    | Build a Windows installer           |
| `npm run build:mac`    | Build a macOS installer             |
| `npm run build:linux`  | Build a Linux installer             |
| `npm run build:unpack` | Build without creating an installer |
| `npm run release:win`  | Build and publish Windows release to GitHub |
| `npm run release:mac`  | Build and publish macOS release to GitHub |
| `npm run release:linux`| Build and publish Linux release to GitHub |
| `npm run typecheck`    | Run TypeScript checks               |
| `npm run lint`         | Run ESLint                          |
| `npm run format`       | Format code with Prettier           |

## Building installers

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

Output artifacts are placed in the `dist/` directory.

## Releasing

Releases are published to [GitHub Releases](https://github.com/NemoKing1210/ProxyChecker/releases) via GitHub Actions when you push a version tag.

### Prerequisites

1. **Google OAuth secret** — in the GitHub repository, add `GOOGLE_OAUTH_CLIENT_ID` under **Settings → Secrets and variables → Actions**. Use the same Desktop app Client ID as in local `.env`.
2. **Version sync** — update `version` in `package.json` and add a section to `CHANGELOG.md` before tagging.

### Automated release (recommended)

```bash
# 1. Bump version in package.json and CHANGELOG.md, then commit
git add package.json CHANGELOG.md
git commit -m "chore: release v1.36.0"

# 2. Create and push a tag (must match package.json version)
git tag v1.36.0
git push origin main
git push origin v1.36.0
```

The **Release** workflow builds Windows, macOS, and Linux installers in parallel and uploads them to a GitHub Release.

Artifacts produced:

| Platform | Files |
| -------- | ----- |
| Windows  | `ProxyChecker-{version}-setup.exe` |
| macOS    | `ProxyChecker-{version}-x64.dmg`, `ProxyChecker-{version}-arm64.dmg` |
| Linux    | `ProxyChecker-{version}-x64.AppImage`, `ProxyChecker-{version}-amd64.deb` |

### Local release (single platform)

Requires a [GitHub personal access token](https://github.com/settings/tokens) with `repo` scope:

```powershell
$env:GH_TOKEN = "ghp_..."
$env:GOOGLE_OAUTH_CLIENT_ID = "your-client-id.apps.googleusercontent.com"
npm run release:win
```

Without `GH_TOKEN`, use `npm run build:win` to create a local installer only (no upload).

### Code signing (optional)

| Platform | Without signing | With signing |
| -------- | --------------- | ------------ |
| Windows  | SmartScreen warning for unknown publisher | Set `WIN_CSC_LINK` and `WIN_CSC_KEY_PASSWORD` secrets |
| macOS    | Gatekeeper blocks by default | Apple Developer account + `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID` |
| Linux    | No signing required | — |

Unsigned builds are fine for GitHub Releases; users may need to confirm the install prompt once.

## Project structure

```
src/
├── main/           # Electron main process (window management, IPC)
├── preload/        # Preload scripts (secure bridge between main and renderer)
└── renderer/       # React UI (Material UI components)
    └── src/
        ├── App.tsx
        ├── main.tsx
        ├── theme.ts
        └── components/
```

## Architecture

```
┌─────────────────────────────────────────┐
│              Renderer (React + MUI)      │
│         User interface & proxy input     │
└──────────────────┬──────────────────────┘
                   │ IPC (preload bridge)
┌──────────────────▼──────────────────────┐
│            Main process (Electron)       │
│    Proxy checks, file I/O, system APIs   │
└─────────────────────────────────────────┘
```

Proxy validation logic runs in the main process to avoid browser sandbox restrictions and to support native networking libraries.

## Google Drive sync (developer setup)

Google Drive sign-in uses an OAuth **Desktop app** Client ID embedded at **build time**. End users only click **Sign in with Google** — they do not enter a Client ID.

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/).
2. Enable **Google Drive API**.
3. Configure the **OAuth consent screen**.
4. Create **Credentials → OAuth client ID → Desktop app** and copy the Client ID.
5. Copy `.env.example` to `.env` and set:

```env
GOOGLE_OAUTH_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

6. Run or build the app (`npm run dev`, `npm run build:win`, etc.). The value is injected into the main process bundle.

For CI/release builds, set `GOOGLE_OAUTH_CLIENT_ID` as a secret environment variable in the pipeline instead of committing `.env`.

## License

MIT
