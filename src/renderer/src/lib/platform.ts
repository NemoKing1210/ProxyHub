export function getPlatform(): string {
  return window.electron?.process?.platform ?? 'unknown'
}

export function isWindows(): boolean {
  return getPlatform() === 'win32'
}
