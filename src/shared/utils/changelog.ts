import type { ChangelogEntry, ChangelogSection } from '../types/app'

const VERSION_HEADING_RE = /^## \[([^\]]+)\](?: - (\S+))?/
const SECTION_HEADING_RE = /^### (.+)$/
const LIST_ITEM_RE = /^- (.+)$/

export function parseChangelog(markdown: string): ChangelogEntry[] {
  const entries: ChangelogEntry[] = []
  let currentEntry: ChangelogEntry | null = null
  let currentSection: ChangelogSection | null = null

  for (const line of markdown.split(/\r?\n/)) {
    const versionMatch = line.match(VERSION_HEADING_RE)

    if (versionMatch) {
      if (currentEntry) {
        entries.push(currentEntry)
      }

      currentEntry = {
        version: versionMatch[1],
        date: versionMatch[2],
        sections: []
      }
      currentSection = null
      continue
    }

    if (!currentEntry) {
      continue
    }

    const sectionMatch = line.match(SECTION_HEADING_RE)

    if (sectionMatch) {
      currentSection = {
        title: sectionMatch[1],
        items: []
      }
      currentEntry.sections.push(currentSection)
      continue
    }

    const itemMatch = line.match(LIST_ITEM_RE)

    if (itemMatch && currentSection) {
      currentSection.items.push(itemMatch[1])
    }
  }

  if (currentEntry) {
    entries.push(currentEntry)
  }

  return entries
}
