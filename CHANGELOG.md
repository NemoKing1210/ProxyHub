# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[1.0.0]: https://github.com/your-username/proxy-checker/releases/tag/v1.0.0
