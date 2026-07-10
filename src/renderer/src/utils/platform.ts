export function getPlatform(): string {
  return window.electron.process.platform
}

export function isWindows(): boolean {
  return getPlatform() === 'win32'
}
