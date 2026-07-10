# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-07-10

### Added

- Configurable proxy check connection timeout (1–120 s) in Settings
- `SettingsSection` component for grouped settings blocks
- i18n strings for settings sections and timeout controls

### Changed

- Redesigned Settings page: appearance and checking sections with toggle theme picker and slider UI
- Proxy checker respects user-defined timeout from app settings

## [1.1.0] - 2026-07-10

### Added

- Full-width proxy cards with copyable fields (click anywhere on a field to copy)
- One-click copy of proxy URL from card footer
- Show/hide password toggle in proxy cards
- Text action buttons in card footer (copy link, check, edit, delete)
- Shared `proxy-format` utility for building proxy URLs
- i18n strings for copy actions and field labels

### Changed

- Proxy list displays only important non-empty fields per card
- Host and port shown as separate fields instead of combined address
- Username/password labels in cards no longer show “optional” hint (kept in form dialog)
- Refined field styling: no borders, hover highlight, vertical field layout
- Removed colored status border from proxy cards

## [1.0.0] - 2026-07-10

### Added

- Initial project scaffold with Electron, React 19, TypeScript, and Material UI
- electron-vite build pipeline with HMR for development
- Dark MUI theme with Roboto font via `@fontsource/roboto`
- Base application layout: app bar, main content area, and version footer
- IPC bridge between main and renderer processes (preload script)
- Production build scripts for Windows, macOS, and Linux via electron-builder
- ESLint and Prettier configuration
- Project documentation in `README.md`

### Changed

- Replaced default electron-vite template UI with Material UI components
- Updated application identity to **ProxyChecker** (`com.proxychecker`)

[1.2.0]: https://github.com/your-username/proxy-checker/releases/tag/v1.2.0
[1.1.0]: https://github.com/your-username/proxy-checker/releases/tag/v1.1.0
[1.0.0]: https://github.com/your-username/proxy-checker/releases/tag/v1.0.0
