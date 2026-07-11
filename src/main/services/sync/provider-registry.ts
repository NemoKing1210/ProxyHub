import type { SyncProviderType } from '../../../shared/types/sync'
import { githubGistProvider } from './providers/github-gist'
import type { SyncProvider } from './providers/types'

const providers: Record<Exclude<SyncProviderType, 'none'>, SyncProvider> = {
  'github-gist': githubGistProvider
}

export function getSyncProvider(type: SyncProviderType): SyncProvider | null {
  if (type === 'none') {
    return null
  }

  return providers[type]
}
