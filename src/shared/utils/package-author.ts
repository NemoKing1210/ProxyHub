interface PackageAuthorObject {
  name?: string
  email?: string
}

export interface ParsedPackageAuthor {
  name?: string
  email?: string
}

const AUTHOR_EMAIL_IN_STRING_RE = /<([^>]+)>\s*$/

export function parsePackageAuthor(
  author: string | PackageAuthorObject | undefined
): ParsedPackageAuthor {
  if (!author) {
    return {}
  }

  if (typeof author === 'object') {
    return {
      name: author.name?.trim() || undefined,
      email: author.email?.trim() || undefined
    }
  }

  const emailMatch = author.match(AUTHOR_EMAIL_IN_STRING_RE)

  if (emailMatch) {
    return {
      name: author.replace(AUTHOR_EMAIL_IN_STRING_RE, '').trim() || undefined,
      email: emailMatch[1].trim()
    }
  }

  return {
    name: author.trim() || undefined
  }
}
