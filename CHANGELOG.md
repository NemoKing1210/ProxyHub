# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.1] - 2026-07-10

### Changed

- Removed borders from all card surfaces (proxy cards, sections, domain results, copyable fields, settings list items, and popovers)

## [1.6.0] - 2026-07-10

### Added

- Material Design 3 / Material You redesign across the application
- MD3 theme system with CSS variables, tonal surfaces, and motion tokens
- Roboto Flex variable font
- Page, card, and domain result animations with `prefers-reduced-motion` support
- `getPalette` / `withThemeAlpha` helpers for correct colors with `cssVariables`

### Changed

- Navigation header, proxy cards, settings, and form dialogs updated to MD3 style
- ToggleButtonGroup segmented control for theme selection
- Improved empty state and list stagger animations on the proxies page

### Fixed

- Header and component backgrounds invisible in dark theme with CSS variables
- Theme toggle text unreadable (dark text on dark background) in dark mode

## [1.5.0] - 2026-07-10

### Added

- Real-time per-domain check progress with pending, checking, alive, and dead states
- Domain result animations and auto-expand of results while a proxy is being checked

### Fixed

- Proxy and domain list could stay in "checking" after the check button stopped loading
- `loadProxies` no longer overwrites in-progress check state from disk

### Changed

- Single-check completion now applies the invoke result as the source of truth
- Check results section is collapsible (collapsed by default)

## [1.4.0] - 2026-07-10

### Added

- Centered pill navigation header with icons and proxy count badge
- Page transition animations between routes
- Per-domain check results in proxy cards (status, latency, URL, errors)
- `checkedAt` timestamp saved on check and shown in cards
- `ProxyDomainResults` component for domain-level check output
- Theme-aware scrollbar styling for light and dark modes
- Sticky navigation header with backdrop blur

### Changed

- Proxy checker tests all configured domains instead of stopping at the first success
- Check results section is collapsible (collapsed by default), like connection
- Removed classic app bar with logo and title

## [1.3.0] - 2026-07-10

### Added

- Collapsible connection section in proxy cards (collapsed by default)
- `ContentSection` component shared by settings and proxy cards

### Changed

- Redesigned proxy cards to match settings page layout and grouping
- Connection and check results grouped into separate sections
- Section description remains visible when connection block is collapsed
- Removed linear progress bar during “Check all”

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

[1.6.1]: https://github.com/your-username/proxy-checker/releases/tag/v1.6.1
[1.6.0]: https://github.com/your-username/proxy-checker/releases/tag/v1.6.0
[1.5.0]: https://github.com/your-username/proxy-checker/releases/tag/v1.5.0
[1.4.0]: https://github.com/your-username/proxy-checker/releases/tag/v1.4.0
[1.3.0]: https://github.com/your-username/proxy-checker/releases/tag/v1.3.0
[1.2.0]: https://github.com/your-username/proxy-checker/releases/tag/v1.2.0
[1.1.0]: https://github.com/your-username/proxy-checker/releases/tag/v1.1.0
[1.0.0]: https://github.com/your-username/proxy-checker/releases/tag/v1.0.0
