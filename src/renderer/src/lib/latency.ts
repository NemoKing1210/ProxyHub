export type LatencyColor = 'success.main' | 'warning.main' | 'error.main'

export function getLatencyColor(latencyMs: number): LatencyColor {
  if (latencyMs > 300) return 'error.main'
  if (latencyMs > 100) return 'warning.main'
  return 'success.main'
}
