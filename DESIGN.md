# ProxyChecker — Design Document

This document describes the product vision, system architecture, UI/UX guidelines, and technical design decisions for **ProxyChecker**.

## 1. Product vision

ProxyChecker is a cross-platform desktop application that helps users quickly validate proxy servers. The app should feel fast, reliable, and straightforward — optimized for bulk operations on large proxy lists.

### Goals

- Support multiple proxy protocols from a single interface
- Provide clear, scannable results (status, latency, error reason)
- Handle large proxy lists without blocking the UI
- Work offline as a standalone desktop app (no cloud dependency)

### Non-goals (v1)

- Proxy rotation or traffic routing for other applications
- Paid proxy provider integrations
- Account management or cloud sync

## 2. Supported proxy types

| Protocol | Default port | Authentication | Notes |
|----------|-------------|----------------|-------|
| HTTP | 80 | Optional (Basic) | Standard web proxy |
| HTTPS | 443 | Optional (Basic) | TLS tunnel to proxy |
| SOCKS4 | 1080 | No | IPv4 only |
| SOCKS5 | 1080 | Optional (user/pass) | Full TCP/UDP support planned later |

### Proxy input formats

The parser should accept common formats:

```
host:port
host:port:user:pass
protocol://host:port
protocol://user:pass@host:port
```

## 3. System architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Renderer (React + MUI)                   │
│  ┌────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ ProxyInput │  │ ResultsTable │  │ Settings / Export │  │
│  └─────┬──────┘  └──────┬───────┘  └─────────┬─────────┘  │
│        │                │                     │            │
│        └────────────────┼─────────────────────┘            │
│                         │ IPC (contextBridge)              │
└─────────────────────────┼──────────────────────────────────┘
                          │
┌─────────────────────────▼──────────────────────────────────┐
│                   Main process (Electron)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │ ProxyChecker │  │  File I/O    │  │  Window / Shell │ │
│  │   Service    │  │  (import/    │  │  management     │ │
│  │              │  │   export)    │  │                 │ │
│  └──────┬───────┘  └──────────────┘  └─────────────────┘ │
│         │                                                   │
│         ▼                                                   │
│  Native networking (Node.js sockets / proxy agents)         │
└────────────────────────────────────────────────────────────┘
```

### Process responsibilities

| Process | Responsibility |
|---------|----------------|
| **Renderer** | UI rendering, user input, result display, progress feedback |
| **Preload** | Secure IPC bridge via `contextBridge` — no direct Node.js access in renderer |
| **Main** | Proxy validation, concurrency control, file read/write, system dialogs |

Proxy checks run in the **main process** to avoid browser sandbox restrictions and to use native Node.js networking libraries.

## 4. Core user flow

```
1. User pastes or imports a proxy list
2. User selects protocol filter and check settings (timeout, target URL)
3. User clicks "Start check"
4. App validates proxies concurrently (configurable pool size)
5. Results stream into the table in real time
6. User filters/sorts results and exports working proxies
```

## 5. Data models

### ProxyEntry (input)

```typescript
interface ProxyEntry {
  id: string
  raw: string           // original input line
  protocol: ProxyProtocol
  host: string
  port: number
  username?: string
  password?: string
}
```

### ProxyResult (output)

```typescript
type ProxyStatus = 'pending' | 'checking' | 'alive' | 'dead' | 'error'

interface ProxyResult {
  id: string
  proxy: ProxyEntry
  status: ProxyStatus
  latencyMs?: number    // round-trip time
  externalIp?: string   // IP seen by target server
  error?: string        // human-readable failure reason
  checkedAt?: string    // ISO timestamp
}
```

### CheckSettings

```typescript
interface CheckSettings {
  targetUrl: string       // default: https://api.ipify.org?format=json
  timeoutMs: number     // default: 10000
  concurrency: number   // default: 50
  protocols: ProxyProtocol[]
}
```

## 6. IPC API (planned)

Exposed via `window.api` in the preload script.

| Channel | Direction | Payload | Description |
|---------|-----------|---------|-------------|
| `proxy:check` | renderer → main | `{ proxies, settings }` | Start a batch check |
| `proxy:cancel` | renderer → main | — | Cancel running check |
| `proxy:progress` | main → renderer | `ProxyResult` | Stream single result update |
| `proxy:complete` | main → renderer | `{ total, alive, dead }` | Batch finished |
| `file:import` | renderer → main | — | Open file dialog, return parsed proxies |
| `file:export` | renderer → main | `{ results, format }` | Save results to file |

### Event streaming

Results should be pushed to the renderer as each proxy is checked (not batched at the end) to keep the UI responsive and give immediate feedback.

## 7. UI design

### Layout structure

```
┌─────────────────────────────────────────────────┐
│  AppBar — logo, title, settings icon            │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─ Input panel ─────────────────────────────┐  │
│  │  Textarea / file import / protocol filter │  │
│  │  [Start]  [Stop]  [Clear]                 │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  ┌─ Stats bar ───────────────────────────────┐  │
│  │  Total: 100  Alive: 42  Dead: 58  ⏱ 3.2s │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  ┌─ Results table ────────────────────────────┐  │
│  │  Status │ Protocol │ Address │ Latency    │  │
│  │  ───────┼──────────┼─────────┼──────────  │  │
│  │  ✓      │ SOCKS5   │ 1.2.3.4 │ 234ms      │  │
│  │  ✗      │ HTTP     │ 5.6.7.8 │ timeout    │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
├─────────────────────────────────────────────────┤
│  Footer — version info                          │
└─────────────────────────────────────────────────┘
```

### Screen states

| State | UI behavior |
|-------|-------------|
| **Idle** | Input enabled, Start button active |
| **Checking** | Progress in stats bar, table rows update live, Stop button active |
| **Complete** | Export and filter controls enabled |
| **Error** | Snackbar with error message, return to idle |

### Status indicators

| Status | Color | Icon |
|--------|-------|------|
| Alive | `success` (green) | `CheckCircle` |
| Dead | `error` (red) | `Cancel` |
| Checking | `info` (blue) | `HourglassEmpty` |
| Pending | `text.disabled` (grey) | `RadioButtonUnchecked` |
| Error | `warning` (amber) | `Warning` |

## 8. Visual design system

Based on the MUI theme defined in `src/renderer/src/theme.ts`.

### Color palette

| Token | Value | Usage |
|-------|-------|-------|
| `primary.main` | `#5c8aff` | Buttons, active elements, links |
| `secondary.main` | `#7c93ee` | Accents, secondary actions |
| `background.default` | `#0f1117` | App background |
| `background.paper` | `#1a1d27` | Cards, panels, table rows |
| Mode | `dark` | Default theme |

### Typography

- **Font family:** Roboto (loaded via `@fontsource/roboto`)
- **Headings:** MUI `h4`–`h6` variants
- **Body:** `body1` / `body2`
- **Monospace:** proxy addresses and error messages (`<code>` or `Typography` with `fontFamily: 'monospace'`)

### Shape and spacing

- **Border radius:** `10px` (theme `shape.borderRadius`)
- **Spacing unit:** MUI default (8px grid)
- **Panels:** `Paper` with `elevation={0}` and `border: 1, borderColor: 'divider'`

### Components

Prefer standard MUI components:

| UI element | MUI component |
|------------|---------------|
| Navigation | `AppBar` + `Toolbar` |
| Content panels | `Paper` |
| Proxy list input | `TextField` (multiline) or `TextareaAutosize` |
| Results | `DataGrid` or `Table` + `TableContainer` |
| Actions | `Button` (contained / outlined) |
| Status badges | `Chip` |
| Notifications | `Snackbar` + `Alert` |
| Settings | `Dialog` or dedicated `Drawer` |
| Loading | `LinearProgress` or `CircularProgress` |

## 9. Concurrency and performance

| Parameter | Default | Range |
|-----------|---------|-------|
| Concurrent checks | 50 | 1–200 |
| Timeout per proxy | 10 000 ms | 1 000–60 000 ms |
| Max list size | 10 000 | Soft limit with warning |

### Guidelines

- Use a worker pool in the main process — never check all proxies sequentially
- Cancel in-flight requests when the user clicks Stop
- Virtualize the results table for lists over 500 rows (`DataGrid` or `react-window`)
- Debounce filter/search input (300 ms)

## 10. File structure (planned)

```
src/
├── main/
│   ├── index.ts              # App entry, window creation
│   ├── ipc/
│   │   ├── proxy.ts          # proxy:check, proxy:cancel handlers
│   │   └── file.ts           # import/export handlers
│   └── services/
│       ├── proxy-checker.ts  # Core validation logic
│       ├── proxy-parser.ts   # Parse input formats
│       └── checker-pool.ts   # Concurrency pool
├── preload/
│   ├── index.ts              # contextBridge API
│   └── index.d.ts            # TypeScript declarations for window.api
└── renderer/
    └── src/
        ├── App.tsx
        ├── main.tsx
        ├── theme.ts
        ├── types/
        │   └── proxy.ts      # Shared type definitions
        ├── hooks/
        │   └── useProxyCheck.ts
        └── components/
            ├── ProxyInput.tsx
            ├── ResultsTable.tsx
            ├── StatsBar.tsx
            ├── SettingsDialog.tsx
            └── Versions.tsx
```

## 11. Security considerations

- **Context isolation** enabled — renderer has no direct Node.js access
- **No credential storage** in v1 — credentials exist only in memory during a session
- **CSP** configured in `index.html` — restrict script and style sources
- **External links** open via `shell.openExternal`, never in-app navigation
- Proxy credentials in exported files should be optional (user choice)

## 12. Error handling

| Scenario | User-facing message | Recovery |
|----------|--------------------|---------|
| Invalid proxy format | Highlight line in input | Skip invalid, continue with valid |
| Network unreachable | "Connection refused" / "Timeout" | Mark as dead |
| DNS failure | "Host not found" | Mark as dead |
| Auth failure | "Authentication failed" | Mark as dead with reason |
| File read error | Snackbar: "Could not read file" | Stay on current input |

## 13. Export formats

| Format | Extension | Content |
|--------|-----------|---------|
| Plain text | `.txt` | One proxy per line (alive only) |
| CSV | `.csv` | All results with status, latency, IP |
| JSON | `.json` | Full `ProxyResult[]` array |

## 14. Future considerations

- Light / dark theme toggle
- Custom check URL (user-defined endpoint)
- GeoIP lookup for proxy exit location
- Check history and session persistence
- SOCKS5 UDP support
- Scheduled / recurring checks
- System tray with background checking

## 15. Current implementation status

| Area | Status |
|------|--------|
| Electron + React + MUI scaffold | Done |
| Dark theme | Done |
| Base layout (AppBar, footer) | Done |
| IPC bridge (preload) | Scaffold only (`ping` test) |
| Proxy parsing | Not started |
| Proxy checking service | Not started |
| Results table | Not started |
| Import / export | Not started |
| Settings dialog | Not started |

---

*Last updated: 2026-07-10*
