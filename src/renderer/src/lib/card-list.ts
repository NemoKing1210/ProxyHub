export type ListCardPosition = 'single' | 'first' | 'middle' | 'last'

export function getListCardPosition(index: number, total: number): ListCardPosition {
  if (total <= 1) {
    return 'single'
  }

  if (index === 0) {
    return 'first'
  }

  if (index === total - 1) {
    return 'last'
  }

  return 'middle'
}

// Adjacent list cards are "stitched": outer corners of edge cards get a
// larger radius (16px) while the seam between cards stays small.
export function getListCardRadius(position: ListCardPosition, full = 16, seam = 6): string {
  switch (position) {
    case 'single':
      return `${full}px`
    case 'first':
      return `${full}px ${full}px ${seam}px ${seam}px`
    case 'middle':
      return `${seam}px`
    case 'last':
      return `${seam}px ${seam}px ${full}px ${full}px`
  }
}
