# ProxyChecker

A cross-platform desktop application for testing the availability and performance of different proxy types. Built with **Electron**, **React 19**, **TypeScript**, and **Material UI**.

## Overview

ProxyChecker helps you validate proxy servers quickly from a single desktop interface. It is designed to support multiple proxy protocols and provide clear, actionable results for each endpoint you test.

### Supported proxy types (planned)

- **HTTP** — standard web proxies
- **HTTPS** — encrypted HTTP proxies
- **SOCKS4** — SOCKS version 4
- **SOCKS5** — SOCKS version 5 with optional authentication

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

## License

MIT
