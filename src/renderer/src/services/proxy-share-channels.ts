import type { TFunction } from 'i18next'

export type ShareChannelNetwork =
  | 'telegram'
  | 'whatsapp'
  | 'viber'
  | 'vk'
  | 'ok'
  | 'facebook'
  | 'x'
  | 'linkedin'
  | 'reddit'
  | 'line'
  | 'email'
  | 'system'

export interface ProxyShareChannelDefinition {
  id: string
  network: ShareChannelNetwork
  label: string
  color: string
  hidden?: boolean
  onClick: () => void | Promise<void>
}

interface BuildProxyShareChannelsParams {
  t: TFunction
  title: string
  proxyUrl: string
  systemShareAvailable: boolean
  systemColor: string
  onSystemShare: () => void | Promise<void>
}

export function buildProxyShareChannels({
  t,
  title,
  proxyUrl,
  systemShareAvailable,
  systemColor,
  onSystemShare
}: BuildProxyShareChannelsParams): ProxyShareChannelDefinition[] {
  const encodedUrl = encodeURIComponent(proxyUrl)
  const encodedTitle = encodeURIComponent(title)
  const shareText = encodeURIComponent(title ? `${title}\n${proxyUrl}` : proxyUrl)

  const openExternal = (url: string): void => {
    void window.api.openExternal(url)
  }

  return [
    {
      id: 'telegram',
      network: 'telegram',
      label: t('proxyList.shareDialog.channels.telegram'),
      color: '#229ED9',
      onClick: () => openExternal(`https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`)
    },
    {
      id: 'whatsapp',
      network: 'whatsapp',
      label: t('proxyList.shareDialog.channels.whatsapp'),
      color: '#25D366',
      onClick: () => openExternal(`https://api.whatsapp.com/send?text=${shareText}`)
    },
    {
      id: 'viber',
      network: 'viber',
      label: t('proxyList.shareDialog.channels.viber'),
      color: '#7360F2',
      onClick: () => openExternal(`viber://forward?text=${shareText}`)
    },
    {
      id: 'vk',
      network: 'vk',
      label: t('proxyList.shareDialog.channels.vk'),
      color: '#0077FF',
      onClick: () =>
        openExternal(`https://vk.com/share.php?url=${encodedUrl}&title=${encodedTitle}`)
    },
    {
      id: 'ok',
      network: 'ok',
      label: t('proxyList.shareDialog.channels.ok'),
      color: '#EE8208',
      onClick: () =>
        openExternal(`https://connect.ok.ru/offer?url=${encodedUrl}&title=${encodedTitle}`)
    },
    {
      id: 'facebook',
      network: 'facebook',
      label: t('proxyList.shareDialog.channels.facebook'),
      color: '#1877F2',
      onClick: () => openExternal(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`)
    },
    {
      id: 'x',
      network: 'x',
      label: t('proxyList.shareDialog.channels.x'),
      color: '#000000',
      onClick: () =>
        openExternal(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`)
    },
    {
      id: 'linkedin',
      network: 'linkedin',
      label: t('proxyList.shareDialog.channels.linkedin'),
      color: '#0A66C2',
      onClick: () =>
        openExternal(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`)
    },
    {
      id: 'reddit',
      network: 'reddit',
      label: t('proxyList.shareDialog.channels.reddit'),
      color: '#FF4500',
      onClick: () =>
        openExternal(`https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`)
    },
    {
      id: 'line',
      network: 'line',
      label: t('proxyList.shareDialog.channels.line'),
      color: '#06C755',
      onClick: () => openExternal(`https://social-plugins.line.me/lineit/share?url=${encodedUrl}`)
    },
    {
      id: 'email',
      network: 'email',
      label: t('proxyList.shareDialog.channels.email'),
      color: '#EA4335',
      onClick: () => openExternal(`mailto:?subject=${encodedTitle}&body=${encodedUrl}`)
    },
    {
      id: 'system',
      network: 'system',
      label: t('proxyList.shareDialog.channels.system'),
      color: systemColor,
      hidden: !systemShareAvailable,
      onClick: onSystemShare
    }
  ]
}
