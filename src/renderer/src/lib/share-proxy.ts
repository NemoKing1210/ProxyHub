export interface ShareProxyPayload {
  title: string
  text: string
}

export async function trySystemShare(payload: ShareProxyPayload): Promise<boolean> {
  const shareData: ShareData = {
    title: payload.title,
    text: payload.text
  }

  if (typeof navigator.share !== 'function') {
    return false
  }

  const canShare = typeof navigator.canShare !== 'function' || navigator.canShare(shareData)

  if (!canShare) {
    return false
  }

  await navigator.share(shareData)
  return true
}
