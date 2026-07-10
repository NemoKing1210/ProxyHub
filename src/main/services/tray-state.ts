let trayEnabled = false

export function setTrayEnabledState(enabled: boolean): void {
  trayEnabled = enabled
}

export function isTrayEnabled(): boolean {
  return trayEnabled
}
