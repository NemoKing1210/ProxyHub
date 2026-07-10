# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.26.0] - 2026-07-10

### Added

- Auto-check countdown badge: live timer in the auto-check settings section header and inside the **Check all** button on the proxy list (shown only when auto-check is enabled)
- Backup export proxy picker: when exporting proxies or a full backup, choose which proxies to include via a searchable checklist grouped by folders
- Backup import proxy picker: review backup file info and select which proxies to import before confirming, with the same selection UI as export

### Changed

- Auto-check translations added for all supported languages

## [1.25.0] - 2026-07-10

### Added

- Settings import and export: back up or restore proxies, groups, and app settings in a versioned ProxyChecker JSON format (`.pcbackup.json`), with export scope (full, proxies only, settings only), import preview before confirmation, and import modes (merge or replace)

## [1.24.0] - 2026-07-10

### Added

- Auto-check settings: enable scheduled re-checks, configure interval (from 1 minute), choose scope (all proxies, favorites, or selected groups), and toggle result notifications independently from manual checks

## [1.23.0] - 2026-07-10

### Added

- Proxy groups (folders): create groups from the Add menu, optionally assign a group when adding or editing a proxy, and browse the list with ungrouped proxies first followed by grouped sections
- Group appearance: custom icon and color, with the group section background tinted to match
- Quick group actions: move a proxy to or from a group via the proxy card context menu; add a proxy directly into a group from the group header

## [1.22.0] - 2026-07-10

### Added

- Activity filter in the proxy list (enabled / disabled), alongside the existing status filter

### Fixed

- MTProto secret is now shown in the proxy card connection section

## [1.21.0] - 2026-07-10

### Added

- MTProto proxy support: `tg://proxy` and `t.me/proxy` link parsing, secret field in the form, and TCP-only availability checks (domain checks are skipped for this protocol)
- Per-proxy check action in the tray menu favorites list

## [1.20.0] - 2026-07-10

### Added

- Check result toasts with detailed single-proxy messages, batch summaries, and severity-based colors
- Native system notifications for check results when the window is minimized or hidden (on by default)
- “Start minimized” setting in System, shown only when tray integration is enabled
- Active filter count badge in the Filters section header

### Changed

- System settings redesigned as card-style toggle rows with grouped tray options

## [1.19.0] - 2026-07-10

### Added

- Enabled and favorites count badges on the proxy list page
- Motion animations for proxy list stat badges and cards (layout, enter, and exit)

### Changed

- Proxy list stat badges are hidden when their count is zero

## [1.18.0] - 2026-07-10

### Added

- Proxy card view setting in Appearance: standard layout or compact expandable cards on the proxy list
- Compact card header shows connection latency after a proxy check
- Context menu on proxy cards with check, edit, share, delete, favorites, enable/disable, icon change, and copy actions

## [1.17.0] - 2026-07-10

### Added

- Proxy list sorting with field selector and ascending/descending toggle below search
- Persistence of proxy list filters, search query, and sort preferences between sessions

### Changed

- Search and sort controls are shown side by side on large screens
- Settings page sections are now collapsible; only Appearance is expanded by default

### Fixed

- Fixed infinite proxy list reload loop caused by search persistence triggering tray sync and full-page loading state

## [1.16.0] - 2026-07-10

### Added

- System tray support with a setting to enable minimize-to-tray behavior
- Native tray context menu with favorite proxies, server latency, external IP, and location details
- View-only proxy details dialog opened from the tray favorites menu
- «Check all» and «Check all favorites» actions in the tray menu
- Loading indicator on the Proxies nav item while a bulk check is running

### Changed

- Native Windows title bar now matches the selected app theme (light, dark, or system)
- Tray menu latency shows server connectivity time instead of domain check time

## [1.15.0] - 2026-07-10

### Added

- Quick fill from proxy link when adding a proxy (with or without protocol, including credentials)
- Duplicate proxy validation when adding or editing (protocol, host, port, and credentials)
- Protocol filter in the proxy list filters
- Universal search below filters (name, host, IP, country, city, protocol, and more) with debounced input

### Changed

- Removed app name from the header navigation bar
- Renamed proxy card action from “Check proxy” to “Check”
- Protocol badges on proxy cards use distinct colors per protocol (HTTP, HTTPS, SOCKS4, SOCKS5)
- Redesigned quick-fill and search panels with clearer layout and focus states

## [1.14.0] - 2026-07-10

### Added

- Share button on proxy cards opens a dialog with a copyable proxy URL, QR code, and send options
- Share channels: Telegram, WhatsApp, Viber, VK, OK, Facebook, X, LinkedIn, Reddit, LINE, email, and system share when available
- Social network icons via `react-icons` (Simple Icons)

### Changed

- Removed “Copy as link” button from proxy cards (copying is available in the share dialog)

## [1.13.0] - 2026-07-10

### Added

- Proxy list filter by status (alive / dead)
- Ukrainian interface language
- About section: developer name, email, GitHub avatar, and repository link
- Check domain enable/disable toggles in settings (domains stay in the list when disabled)
- Per-proxy enable/disable toggle; disabled proxies are skipped by “Check all”
- Short connectivity failure message when a proxy check error has no details

### Changed

- Proxy server check results show only status, external IP, and error text (no duplicate address/protocol/URL/latency)
- “Check all” no longer updates UI or results for disabled proxies

## [1.12.0] - 2026-07-10

### Added

- Proxy list filters: country, city, anonymity, favorites (all / favorites only / non-favorites), and max latency
- Filtered count badge and empty state when no proxies match the filters
- Collapsible filters panel (collapsed by default)

### Changed

- “Check all” runs on the currently filtered proxy list

## [1.11.0] - 2026-07-10

### Added

- Favorite proxies with a star toggle; favorites are always shown at the top of the list
- Confirmation dialog before deleting a proxy

## [1.10.0] - 2026-07-10

### Added

- Custom icon per proxy (12 variants) shown in the card header
- Custom accent color per proxy with tinted icon background on the card
- Optional proxy metadata: country, city, and anonymity level (elite / anonymous / transparent)
- Proxy editor grouped into collapsible sections: Connection, Authentication, Location & metadata, and Appearance
- CSV import/export helpers for the metadata line format (`host,port,protocol,anonymity,false,country,city`)

### Changed

- Proxy form: Connection section is expanded by default; other sections are collapsed
- Icon and color are selected via dropdowns with preview
- Country field uses flag icons in the select (same style as Settings)
- Metadata badges on proxy cards use consistent padding and icons

### Fixed

- Country select crash when rendering flag labels
- Parallel “Check all” could hide the results section when the batch finished
- Proxy card icon background not rendering due to invalid CSS from `theme.alpha()` on hex colors

## [1.9.1] - 2026-07-10

### Fixed

- Domain checks through HTTP proxies now use `HttpsProxyAgent` with CONNECT tunneling instead of `HttpProxyAgent`, which caused HTTP 503 errors on all HTTPS domain tests
- HTTPS check requests now send browser-like headers (User-Agent, Accept, Accept-Language) and use HEAD for domain availability probes

### Changed

- Settings hint for check domains recommends example.com or httpbin.org over google.com, which often blocks proxy traffic

## [1.9.0] - 2026-07-10

### Added

- About section on the settings page with app version and parsed `CHANGELOG.md`
- Separate stat badges on the proxy list (total, alive, dead)
- Check all mode setting: sequential (default) or parallel with configurable concurrency limit (2–20)

### Changed

- Results section stays expanded after a proxy check completes
- Removed page transition animations between routes

## [1.8.0] - 2026-07-10

### Added

- Connection latency shown in the results section header alongside check date
- Color-coded latency: green (≤100 ms), orange (>100 ms), red (>300 ms)
- Proxy URL in connectivity results blurred until hover (on pointer devices)

### Changed

- Results section hidden until a proxy has been checked at least once
- Check date in results header shows time only when the check was today

### Fixed

- Scroll jumping to top when expanding Connection or Results sections on proxy cards

## [1.7.0] - 2026-07-10

### Changed

- Domain checks are now optional; proxies can be validated by address reachability only
- Removed default check domain (`google.com`); new installs start with an empty domain list
- Proxy checks now use current UI settings directly instead of re-reading stale values from disk
- Fixed stale `google.com` appearing in results when domain list is empty
- Check date moved to the results section header; date and latency summary fields removed from results body

### Added

- Proxy address connectivity check (TCP) with live progress before domain tests
- External IP detection through working proxies via api.ipify.org
- Proxy server result card showing address, protocol, URL, connection latency, and reachability status

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
