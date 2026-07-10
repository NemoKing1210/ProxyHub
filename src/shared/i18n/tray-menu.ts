import type { AppLanguage } from '../types/settings'
import type { ProxyAnonymityLevel } from '../types/proxy'

export interface TrayMenuStrings {
  openApp: string
  checkAll: string
  checkAllFavorites: string
  quit: string
  noFavorites: string
  statusAlive: string
  statusDead: string
  statusChecking: string
  statusUnknown: string
  serverLatency: string
  externalIp: string
  disabled: string
  anonymity: Record<ProxyAnonymityLevel, string>
}

const ANONYMITY_EN: TrayMenuStrings['anonymity'] = {
  elite: 'elite',
  anonymous: 'anonymous',
  transparent: 'transparent'
}

const ANONYMITY_RU: TrayMenuStrings['anonymity'] = {
  elite: 'элитный',
  anonymous: 'анонимный',
  transparent: 'прозрачный'
}

const TRAY_MENU_STRINGS: Record<AppLanguage, TrayMenuStrings> = {
  en: {
    openApp: 'Open ProxyChecker',
    checkAll: 'Check all',
    checkAllFavorites: 'Check all favorites',
    quit: 'Quit',
    noFavorites: 'No favorite proxies',
    statusAlive: 'alive',
    statusDead: 'dead',
    statusChecking: 'checking',
    statusUnknown: 'not checked',
    serverLatency: '{{value}} ms to server',
    externalIp: 'IP',
    disabled: 'disabled',
    anonymity: ANONYMITY_EN
  },
  ru: {
    openApp: 'Открыть ProxyChecker',
    checkAll: 'Проверить все',
    checkAllFavorites: 'Проверить все избранные',
    quit: 'Закрыть приложение',
    noFavorites: 'Нет избранных прокси',
    statusAlive: 'рабочий',
    statusDead: 'нерабочий',
    statusChecking: 'проверка',
    statusUnknown: 'не проверен',
    serverLatency: '{{value}} мс до сервера',
    externalIp: 'IP',
    disabled: 'отключён',
    anonymity: ANONYMITY_RU
  },
  uk: {
    openApp: 'Відкрити ProxyChecker',
    checkAll: 'Перевірити всі',
    checkAllFavorites: 'Перевірити всі обрані',
    quit: 'Закрити програму',
    noFavorites: 'Немає обраних проксі',
    statusAlive: 'робочий',
    statusDead: 'неробочий',
    statusChecking: 'перевірка',
    statusUnknown: 'не перевірено',
    serverLatency: '{{value}} мс до сервера',
    externalIp: 'IP',
    disabled: 'вимкнено',
    anonymity: ANONYMITY_RU
  },
  de: {
    openApp: 'ProxyChecker öffnen',
    checkAll: 'Alle prüfen',
    checkAllFavorites: 'Alle Favoriten prüfen',
    quit: 'Beenden',
    noFavorites: 'Keine Favoriten',
    statusAlive: 'aktiv',
    statusDead: 'tot',
    statusChecking: 'prüft',
    statusUnknown: 'unbekannt',
    serverLatency: '{{value}} ms zum Server',
    externalIp: 'IP',
    disabled: 'deaktiviert',
    anonymity: ANONYMITY_EN
  },
  fr: {
    openApp: 'Ouvrir ProxyChecker',
    checkAll: 'Tout vérifier',
    checkAllFavorites: 'Vérifier tous les favoris',
    quit: 'Quitter',
    noFavorites: 'Aucun favori',
    statusAlive: 'actif',
    statusDead: 'mort',
    statusChecking: 'vérification',
    statusUnknown: 'inconnu',
    serverLatency: '{{value}} ms vers le serveur',
    externalIp: 'IP',
    disabled: 'désactivé',
    anonymity: {
      elite: 'élite',
      anonymous: 'anonyme',
      transparent: 'transparent'
    }
  },
  es: {
    openApp: 'Abrir ProxyChecker',
    checkAll: 'Comprobar todos',
    checkAllFavorites: 'Comprobar todos los favoritos',
    quit: 'Salir',
    noFavorites: 'Sin favoritos',
    statusAlive: 'activo',
    statusDead: 'caído',
    statusChecking: 'comprobando',
    statusUnknown: 'sin comprobar',
    serverLatency: '{{value}} ms al servidor',
    externalIp: 'IP',
    disabled: 'desactivado',
    anonymity: {
      elite: 'élite',
      anonymous: 'anónimo',
      transparent: 'transparente'
    }
  },
  pt: {
    openApp: 'Abrir ProxyChecker',
    checkAll: 'Verificar todos',
    checkAllFavorites: 'Verificar todos os favoritos',
    quit: 'Sair',
    noFavorites: 'Sem favoritos',
    statusAlive: 'ativo',
    statusDead: 'inativo',
    statusChecking: 'verificando',
    statusUnknown: 'não verificado',
    serverLatency: '{{value}} ms ao servidor',
    externalIp: 'IP',
    disabled: 'desativado',
    anonymity: {
      elite: 'elite',
      anonymous: 'anônimo',
      transparent: 'transparente'
    }
  },
  zh: {
    openApp: '打开 ProxyChecker',
    checkAll: '全部检测',
    checkAllFavorites: '检查所有收藏',
    quit: '退出',
    noFavorites: '没有收藏的代理',
    statusAlive: '可用',
    statusDead: '不可用',
    statusChecking: '检查中',
    statusUnknown: '未检查',
    serverLatency: '{{value}} ms 到服务器',
    externalIp: 'IP',
    disabled: '已禁用',
    anonymity: ANONYMITY_EN
  },
  ja: {
    openApp: 'ProxyChecker を開く',
    checkAll: 'すべて確認',
    checkAllFavorites: 'お気に入りをすべて確認',
    quit: '終了',
    noFavorites: 'お気に入りなし',
    statusAlive: '稼働',
    statusDead: '停止',
    statusChecking: '確認中',
    statusUnknown: '未確認',
    serverLatency: 'サーバーまで {{value}} ms',
    externalIp: 'IP',
    disabled: '無効',
    anonymity: ANONYMITY_EN
  },
  hi: {
    openApp: 'ProxyChecker खोलें',
    checkAll: 'सभी जांचें',
    checkAllFavorites: 'सभी पसंदीदा जांचें',
    quit: 'बंद करें',
    noFavorites: 'कोई पसंदीदा नहीं',
    statusAlive: 'सक्रिय',
    statusDead: 'निष्क्रिय',
    statusChecking: 'जांच',
    statusUnknown: 'अज्ञात',
    serverLatency: 'सर्वर तक {{value}} ms',
    externalIp: 'IP',
    disabled: 'अक्षम',
    anonymity: ANONYMITY_EN
  },
  ar: {
    openApp: 'فتح ProxyChecker',
    checkAll: 'فحص الكل',
    checkAllFavorites: 'فحص جميع المفضلة',
    quit: 'إغلاق التطبيق',
    noFavorites: 'لا توجد بروكسيات مفضلة',
    statusAlive: 'نشط',
    statusDead: 'معطل',
    statusChecking: 'جارٍ الفحص',
    statusUnknown: 'غير مفحوص',
    serverLatency: '{{value}} مللي ثانية إلى الخادم',
    externalIp: 'IP',
    disabled: 'معطّل',
    anonymity: ANONYMITY_EN
  }
}

export function getTrayMenuStrings(language: AppLanguage): TrayMenuStrings {
  return TRAY_MENU_STRINGS[language] ?? TRAY_MENU_STRINGS.en
}
