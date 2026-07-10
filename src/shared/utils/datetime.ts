function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function formatDateTime(iso: string, locale: string): string {
  const date = new Date(iso)

  if (Number.isNaN(date.getTime())) {
    return iso
  }

  const isToday = isSameCalendarDay(date, new Date())

  return new Intl.DateTimeFormat(
    locale,
    isToday ? { timeStyle: 'short' } : { dateStyle: 'short', timeStyle: 'short' }
  ).format(date)
}
