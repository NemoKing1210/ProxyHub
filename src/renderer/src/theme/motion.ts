export const MD3_EASING = {
  standard: 'cubic-bezier(0.2, 0, 0, 1)',
  emphasized: 'cubic-bezier(0.2, 0, 0, 1)',
  emphasizedDecelerate: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
  emphasizedAccelerate: 'cubic-bezier(0.3, 0, 0.8, 0.15)'
} as const

/** Same curves as numeric arrays — the format framer-motion accepts. */
export const MD3_EASING_CURVES = {
  standard: [0.2, 0, 0, 1],
  emphasizedDecelerate: [0.05, 0.7, 0.1, 1],
  emphasizedAccelerate: [0.3, 0, 0.8, 0.15]
} as const

export const MD3_DURATION = {
  short1: 50,
  short2: 100,
  short3: 150,
  short4: 200,
  medium1: 250,
  medium2: 300,
  medium3: 350,
  medium4: 400,
  long1: 450,
  long2: 500
} as const

export const staggerDelay = (index: number, stepMs = 40): string => `${index * stepMs}ms`

/**
 * Single CSS transition for interactive surfaces (cards, rows, swatches):
 * the listed properties animate with one duration and curve, replacing
 * scattered "160ms ease" / "200ms cubic-bezier(...)" across the codebase.
 */
export function surfaceTransition(
  properties: readonly string[] = ['background-color', 'box-shadow', 'transform'],
  durationMs: number = MD3_DURATION.short4
): string {
  return properties
    .map((property) => `${property} ${durationMs}ms ${MD3_EASING.standard}`)
    .join(', ')
}
