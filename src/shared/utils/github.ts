const GITHUB_USERNAME_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37})?$/

export function resolveGitHubUsername(repositoryUrl?: string, author?: string): string | undefined {
  if (repositoryUrl) {
    const match = repositoryUrl.match(/github\.com\/([^/?#]+)/i)
    const username = match?.[1]

    if (username && username !== 'github.com') {
      return username
    }
  }

  if (author && GITHUB_USERNAME_RE.test(author)) {
    return author
  }

  return undefined
}

export function resolveGitHubProfileUrl(
  repositoryUrl?: string,
  author?: string
): string | undefined {
  const username = resolveGitHubUsername(repositoryUrl, author)
  return username ? `https://github.com/${username}` : undefined
}

export function resolveGitHubAvatarUrl(
  repositoryUrl?: string,
  author?: string
): string | undefined {
  const username = resolveGitHubUsername(repositoryUrl, author)
  return username ? `https://github.com/${username}.png` : undefined
}
