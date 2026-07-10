export interface ChangelogSection {
  title: string
  items: string[]
}

export interface ChangelogEntry {
  version: string
  date?: string
  sections: ChangelogSection[]
}

export interface AppInfo {
  version: string
  changelog: ChangelogEntry[]
}
