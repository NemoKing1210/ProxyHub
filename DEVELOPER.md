# Developer guide

This document covers local development, building installers, releasing, and OAuth setup for **ProxyChecker**.

For product overview and download links, see [README.md](./README.md).

## Tech stack

| Layer           | Technology                                                       |
| --------------- | ---------------------------------------------------------------- |
| Desktop runtime | [Electron](https://www.electronjs.org/)                          |
| Build tool      | [electron-vite](https://electron-vite.org/)                      |
| UI              | [React 19](https://react.dev/) + [Material UI](https://mui.com/) |
| Language        | [TypeScript](https://www.typescriptlang.org/)                    |
| State           | [Zustand](https://github.com/pmndrs/zustand)                     |
| Packaging       | [electron-builder](https://www.electron.build/)                  |
| Auto-update     | [electron-updater](https://www.electron.build/auto-update)       |
| i18n            | [i18next](https://www.i18next.com/)                              |
| Lint / format   | [ESLint](https://eslint.org/) + [Prettier](https://prettier.io/) |

## Prerequisites

- [Node.js](https://nodejs.org/) **18+** (20+ recommended)
- [npm](https://www.npmjs.com/) **9+**

## Setup

```bash
git clone https://github.com/NemoKing1210/ProxyChecker.git
cd ProxyChecker
npm install
```

For **Google Drive sync** in dev builds, copy [`.env.example`](./.env.example) to `.env` and set `GOOGLE_OAUTH_CLIENT_ID`. See [Google Drive OAuth](#google-drive-oauth) below.

## Scripts

| Command                 | Description                              |
| ----------------------- | ---------------------------------------- |
| `npm run dev`           | Start with HMR (`F12` — DevTools)        |
| `npm start`             | Preview production build                 |
| `npm run build`         | Type-check + production build            |
| `npm run build:win`     | Windows installer → `dist/`              |
| `npm run build:mac`     | macOS installer → `dist/`                |
| `npm run build:linux`   | Linux AppImage + deb → `dist/`           |
| `npm run build:unpack`  | Unpacked build (no installer)            |
| `npm run release:win`   | Build and publish Windows release        |
| `npm run release:mac`   | Build and publish macOS release          |
| `npm run release:linux` | Build and publish Linux release          |
| `npm run typecheck`     | TypeScript checks                        |
| `npm run lint`          | ESLint                                   |
| `npm run format`        | Prettier                                 |

## Project structure

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

## Architecture

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

For product vision and design decisions, see [DESIGN.md](./DESIGN.md).

## Releasing

Releases are published to [GitHub Releases](https://github.com/NemoKing1210/ProxyChecker/releases) automatically via the [**Release** workflow](.github/workflows/release.yml) when a version tag is pushed.

### Prerequisites

1. Add **`GOOGLE_OAUTH_CLIENT_ID`** in GitHub → **Settings → Secrets and variables → Actions**
2. Update `version` in [`package.json`](./package.json) and add a section to [`CHANGELOG.md`](./CHANGELOG.md)

### Automated release (recommended)

```bash
# 1. Commit version bump
git add package.json CHANGELOG.md
git commit -m "chore: release v1.37.0"

# 2. Tag (must match package.json version, with v prefix)
git tag v1.37.0

# 3. Push
git push origin main
git push origin v1.37.0
```

The workflow builds **Windows**, **macOS**, and **Linux** in parallel and uploads installers to GitHub Releases.

Artifacts produced:

| Platform  | Files                                                                 |
| --------- | --------------------------------------------------------------------- |
| Windows   | `ProxyChecker-{version}-setup.exe`                                    |
| macOS     | `ProxyChecker-{version}-x64.dmg`, `ProxyChecker-{version}-arm64.dmg`, zip (auto-update) |
| Linux     | `ProxyChecker-{version}-x64.AppImage`, `ProxyChecker-{version}-amd64.deb` |

### Local release (single platform)

Requires a [GitHub personal access token](https://github.com/settings/tokens) with `repo` scope:

```powershell
$env:GH_TOKEN = "ghp_..."
$env:GOOGLE_OAUTH_CLIENT_ID = "your-client-id.apps.googleusercontent.com"
npm run release:win
```

Without `GH_TOKEN`, use `npm run build:win` to build locally without uploading.

### Code signing (optional)

| Platform | Without signing     | With signing                                                                 |
| -------- | ------------------- | ---------------------------------------------------------------------------- |
| Windows  | SmartScreen warning | `WIN_CSC_LINK` + `WIN_CSC_KEY_PASSWORD` secrets                              |
| macOS    | Gatekeeper block    | Apple Developer + `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID` |
| Linux    | Not required        | —                                                                            |

Unsigned builds are fine for GitHub Releases; users may need to confirm the install prompt once.

## Google Drive OAuth

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

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-change`
3. Run `npm run typecheck` and `npm run lint` before opening a PR
4. Commit your changes and open a Pull Request

Bug reports and feature requests are welcome in [Issues](https://github.com/NemoKing1210/ProxyChecker/issues).
