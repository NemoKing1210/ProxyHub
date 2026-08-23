# Repository Guidelines

## Project Overview

ProxyHub is a cross-platform desktop app (Electron + React 19 + MUI 9 + TypeScript 5.9) for bulk testing HTTP/HTTPS/SOCKS4/5/MTProto proxies. Features: bulk import (host:port, CSV/JSON/TXT), concurrent checks with metrics (status/latency/external IP), groups/favorites, virtualized list (80+), 11-language i18n, system tray, GitHub Gist / Google Drive sync with optional encryption, auto-update via `electron-updater`. Offline-first; packaging via `electron-builder` (Windows NSIS primary, macOS DMG+ZIP, Linux AppImage+deb).

## Architecture & Data Flow

**Electron 3-process + shared:**

- **Main (Node/Electron)** — owns persistence (`electron-store` `proxyhub.json` in `app.getPath('userData')`, `clearInvalidConfig:false`), proxy checking (TCP `net` + HTTPS HEAD via `HttpsProxyAgent`/`SocksProxyAgent`), sync (Gist/Drive + `safeStorage` secrets + pull sessions), tray/title-bar/updater.
- **Preload** — `contextBridge` exposing typed `window.api` (`src/preload/index.ts` → `src/shared/types/api.ts`).
- **Renderer (Vite/React + Zustand + HashRouter)** — UI via Zustand stores (`proxyStore`, `settingsStore`, `groupStore`, `toastStore`), 8 bootstrap syncs in `AppProviders.tsx`.
- **Shared** — pure types/utils/constants/theme, no side effects.

**Data flow (IPC):**

```
Zustand action → window.api.invoke('proxy:check'|'settings:save'|...) → ipcMain.handle → main service (app-store/proxy-checker/sync) → electron-store → broadcast (tray:proxies-updated, proxy:check-progress throttled, proxy:check-all-state, updater:state-changed) → renderer store + debounced persist/sync-on-change
```

**Proxy check:** `renderer checkAll` → `main checkAllProxies` (pool `checkAllConcurrency 2-20` + per-proxy `domainCheckConcurrency 1-5`, `AbortSignal` cancellable) → `ProxyCheckProgress` throttled → renderer `applyLiveProgress` batched 120ms → `debounced-persist`.

**Sync:** `pushOnChange` debounced scheduler (`services/sync-on-change.ts`) or manual `push` → `buildBackupContent` (full/proxies/settings, optional encrypt via `backup-crypto`) → provider `push` → `syncStatus`; `pull` → preview (decrypt) → `sessionId` → `applyBackupImport` (`merge`|`replace`) → `electron-store` → tray refresh.

## Key Directories

| Path                  | Purpose                                                                                                                                                                                                                                                                                                                                                  |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/main/`           | Electron main: `index.ts` (window + IPC), `ipc/` (proxy, proxy-import, backup, settings, sync, app, tray, updater), `services/` (app-store, proxy-checker, check-cancellation, tray, title-bar, auto-updater, backup-content, sync/), `utils/`                                                                                                           |
| `src/preload/`        | `index.ts` + `index.d.ts` — secure bridge (`window.api` + `window.electronAPI`)                                                                                                                                                                                                                                                                          |
| `src/renderer/src/`   | Vite React app: `main.tsx` entry, `app/` (App.tsx router, providers/AppProviders, bootstrap/ 8 syncs), `components/` (proxy/, group/, layout/, ui/, settings/ primitives), `pages/` (Home + settings/ 8 leaves + SettingsShell), `store/` (Zustand), `lib/` (pure helpers), `services/` (side-effect modules), `hooks/`, `theme/`, `i18n/locales/*.json` |
| `src/shared/`         | `types/` (api, proxy, settings, sync, backup, updater), `utils/` (proxy-format, proxy-check-results, run-with-concurrency, proxy-progress-throttle, backup), `constants/`, `i18n/`, `theme/`                                                                                                                                                             |
| `tests/shared/utils/` | Vitest specs (only `tests/**/*.test.ts` is included)                                                                                                                                                                                                                                                                                                     |
| `scripts/`            | `benchmark-list-ops.mjs` — 10k proxy filter/sort benchmark                                                                                                                                                                                                                                                                                               |
| `build/`              | `entitlements.mac.plist`, `icon.*`                                                                                                                                                                                                                                                                                                                       |
| `out/` → `dist/`      | `electron-vite` output → `electron-builder` installers                                                                                                                                                                                                                                                                                                   |
| `.github/workflows/`  | `ci.yml` (typecheck+lint), `release.yml` (tag `v*` → draft release)                                                                                                                                                                                                                                                                                      |
| `.hermes/`            | Internal plans (excluded from language rule)                                                                                                                                                                                                                                                                                                             |

## Development Commands

```bash
npm ci              # CI uses npm ci with cache:npm (Node 20)
npm run dev         # electron-vite dev with HMR, F12 DevTools
npm start           # preview production build (out/)
npm run build       # typecheck + electron-vite build → out/
npm run build:win   # electron-builder --win → dist/ProxyHub-*-setup.exe
npm run build:mac   # --mac (paused in CI, run locally)
npm run build:linux # --linux (paused)
npm run build:unpack# unpacked without installer
npm run release:win # build + publish (needs GH_TOKEN)
npm run typecheck   # tsc -p tsconfig.node.json && tsc -p tsconfig.web.json
npm run lint        # eslint --cache . (flat config, react-hooks/refresh)
npm run format      # prettier --write . (singleQuote, printWidth 100)
npm run benchmark:perf # node scripts/benchmark-list-ops.mjs (10k proxies, 20 iter)
npx vitest run      # tests (no npm test script) — see vitest.config.ts include
npx vitest run --coverage # requires @vitest/coverage-v8
```

Publishing: `git add package.json CHANGELOG.md && git commit -m "chore: release v1.37.x" && git tag v1.37.x && git push origin main v1.37.x` → `release.yml` validates tag==package.json version, creates draft, matrix build, publishes.

## Code Conventions & Common Patterns

- **Language policy:** All comments/docs/`*.md`/commit messages in **English**; other languages only in `src/renderer/src/i18n/locales/*.json` and `src/shared/i18n/**` (tray fallbacks, `SUPPORTED_LANGUAGES` native names). No non-English `defaultValue` in `t()`.
- **Formatting:** Prettier (`singleQuote:true, semi:false, printWidth:100, trailingComma:none`), ESLint flat (`@electron-toolkit/eslint-config-ts` + `react`/`jsx-runtime` + `react-hooks` + `react-refresh` + `prettier`), `.editorconfig` (utf-8, lf, 2 spaces). Run `format` + `lint` before PR.
- **Imports:** Top-level `import type` for type-only; aliases `@shared/*` → `src/shared/*`, `@renderer/*` → `src/renderer/src/*` (via `tsconfig.*` + `electron.vite.config.ts`). No inline `import("pkg").Type`.
- **Naming:** Components `PascalCase.tsx` (e.g., `ProxyCard.tsx`, `SettingsCardList.tsx`), hooks `useCamelCase.ts`, stores `*Store.ts` (Zustand), IPC `src/main/ipc/*.ts`, services `src/main/services/*.ts`, shared utils `kebab-case.ts`. Settings sections: `pages/settings/sections/*Section.tsx` + `sectionsRegistry.tsx`.
- **Async:** `async/await` + `AbortSignal` for cancellable checks (`check-cancellation.ts`: `beginCancellableCheck`/`cancelActiveCheck`). Concurrency via `runWithConcurrency(items, fn, concurrency, {shouldStop})` (`src/shared/utils/run-with-concurrency.ts`). IPC `window.api.invoke` for request/response, `window.api.on*` for streaming (`proxy:check-progress` throttled 75ms, `updater:state-changed`).
- **State (Zustand):** Stores expose `load`/`updateSettings`/`checkAll` actions; side effects update store optimistically then `persist(previous,next)` + `notifySyncDataChange`. Pattern:
  ```ts
  const settings = useSettingsStore((s) => s.settings)
  const updateSettings = useSettingsStore((s) => s.updateSettings)
  await updateSettings({ toastPosition: 'top-left' })
  ```
- **Error handling:** No silent `catch`; normalize via `normalizeSettings`/`normalizeSyncConfig` (clamp, `!==false` defaults, `EMPTY_AUTO_CHECK_GROUP_IDS`). Backup/sync errors typed `SyncError` with codes (`auth_required`, `remote_not_found`, etc.). Toasts via `toastStore.show({severity,title,message,duration})` — `message` required.
- **DI/Providers:** `AppProviders.tsx` composes `ThemeProvider` + `I18nProvider` + `HashRouter` + bootstrap syncs (`ProxyDataSync`, `AutoCheckSync`, `SyncOnChangeSync`, `TitleBarThemeSync` etc.). No manual DI container.
- **UI system:** MUI dark default, accent `#5c8aff`, `background.paper #1a1d27`, Roboto, `elevationShadow`/`surfaceTint`. **Mandatory card radius:** outer `SettingsCardList` `full=16 seam=6` via `getListCardRadius(getListCardPosition(i,total))`, nested `full=12 seam=6` — never hardcode `borderRadius`. Icon tiles use `surfaceTint(accent,0.18)`.

## Important Files

- **Entries:** `src/main/index.ts` (BrowserWindow, IPC, tray/updater), `src/preload/index.ts` (bridge), `src/renderer/src/main.tsx` → `src/renderer/src/app/App.tsx` (HashRouter routes) → `AppProviders.tsx`
- **IPC contract:** `src/shared/types/api.ts` (`AppAPI` — all `window.api` methods)
- **Persistence:** `src/main/services/app-store.ts` (`electron-store` `proxyhub`, `cwd: app.getPath('userData')`, `clearInvalidConfig:false`), `src/main/services/sync-secrets.ts` (`proxyhub-secrets` + `safeStorage`)
- **Core logic:** `src/main/services/proxy-checker.ts`, `src/shared/utils/run-with-concurrency.ts`, `src/shared/utils/proxy-progress-throttle.ts`, `src/shared/utils/proxy-format.ts`, `src/shared/utils/backup.ts`
- **Stores:** `src/renderer/src/store/{proxyStore,settingsStore,groupStore,toastStore}.ts`
- **Settings routing:** `src/renderer/src/pages/settings/SettingsShell.tsx` + `sectionsRegistry.tsx` (8 pages)
- **Theme/i18n:** `src/renderer/src/theme.ts`, `src/renderer/src/i18n/locales/{en,ru,...}.json` (11 langs), `src/shared/i18n/tray-menu.ts`
- **Configs:** `package.json`, `electron.vite.config.ts` (aliases, `GOOGLE_OAUTH_CLIENT_ID` define), `electron-builder.yml` (appId `com.nemoking1210.proxyhub`), `tsconfig.{node,web}.json` (project references), `eslint.config.mjs`, `.prettierrc.yaml`, `vitest.config.ts`, `.env.example`

## Runtime/Tooling Preferences

- **Runtime:** Node.js `>=18` (engines), **20+ recommended**; CI/release pin `Node 20` (`actions/setup-node@v4`).
- **Package manager:** **npm** — `package-lock.json` (lockfileVersion 3), `npm ci` in workflows. No `yarn.lock`/`pnpm-lock.yaml`/`bun.lockb` despite legacy `pnpm.onlyBuiltDependencies` allowlist. Do not introduce pnpm/yarn/bun.
- **Build:** `electron-vite@5` (Vite 7) for dev/build, `electron-builder@26` for packaging (`out/` → `dist/`, `asarUnpack: resources/**`, `npmRebuild:false`, `publish: github draft`). Targets: `win` NSIS `ProxyHub-${version}-setup.exe` (active), `mac` DMG+ZIP and `linux` AppImage+deb (currently paused in release.yml matrix).
- **Env:** `GOOGLE_OAUTH_CLIENT_ID` from `.env` (dev `cp .env.example .env`) or GitHub secret (release) — injected via `electron.vite.config.ts` `define`.
- **Constraints:** Keep `appId` `com.nemoking1210.proxyhub` stable (store path depends on it), `productName` `ProxyHub`, `buildResources` `build/`, output `dist/`. Preserve dual `tsconfig` project references and `@shared`/`@renderer` aliases.

## Testing & QA

- **Framework:** Vitest `^4.1.11` + `@vitest/coverage-v8` (installed but no `npm test` script). Config `vitest.config.ts`: `environment: node`, `include: ['tests/**/*.test.ts']`, `testTimeout: 10000`, aliases `@renderer`/`@shared`. Run directly via `npx vitest run` / `npx vitest run --coverage`.
- **Existing tests (35 cases, 3 files, `tests/shared/utils/`):**
  - `proxy-format.test.ts` (24) — `parseProxyUrl`, MTProto `tg://`/`t.me`, `isValidMtprotoSecret` (32-char hex), `buildProxyUrl`, `formatProxyAddress`, `skipsDomainChecks`
  - `run-with-concurrency.test.ts` (7) — empty, peak concurrency enforcement (`c=3` gates), `shouldStop`, fractional `2.7`
  - `proxy-progress-throttle.test.ts` (4) — domain batching (75ms), non-domain flush, `flush()` with `vi.useFakeTimers`
- **QA gates:** `npm run typecheck` (dual) + `npm run lint --cache` — CI (`ci.yml`: `npm ci → typecheck → lint`, concurrency `cancel-in-progress`). No test/coverage gate yet. Prettier via `npm run format`. Benchmark via `benchmark:perf` (10k proxies) for perf regressions.
- **Expectations before PR:** `typecheck` + `lint` green; add Vitest case for new `shared/utils` logic (follow `describe/it/expect` + `vi.fn`/`createDeferred` patterns); keep English-only comments/docs.
