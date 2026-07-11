let trayEnabled = false
let appQuitting = false

export function setTrayEnabledState(enabled: boolean): void {
  trayEnabled = enabled
}

export function isTrayEnabled(): boolean {
  return trayEnabled
}

export function setAppQuitting(quitting: boolean): void {
  appQuitting = quitting
}

export function isAppQuitting(): boolean {
  return appQuitting
}
