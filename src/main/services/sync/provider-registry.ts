import type { SyncProviderType } from '../../../shared/types/sync'
import { githubGistProvider } from './providers/github-gist'
import { googleDriveProvider } from './providers/google-drive'
import type { SyncProvider } from './providers/types'

const providers: Record<Exclude<SyncProviderType, 'none'>, SyncProvider> = {
  'github-gist': githubGistProvider,
  'google-drive': googleDriveProvider
}

export function getSyncProvider(type: SyncProviderType): SyncProvider | null {
  if (type === 'none') {
    return null
  }

  return providers[type]
}
