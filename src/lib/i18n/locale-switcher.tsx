'use client'

import { useI18n } from './index'

type Locale = 'ru' | 'en'

interface LocaleSwitcherProps {
  className?: string
}

export function LocaleSwitcher({ className }: LocaleSwitcherProps) {
  const { locale, setLocale } = useI18n()

  const toggleLocale = () => {
    setLocale(locale === 'ru' ? 'en' : 'ru')
  }

  return (
    <button
      onClick={toggleLocale}
      className={`flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent transition-colors ${className || ''}`}
      title={locale === 'ru' ? 'Switch to English' : 'Переключить на русский'}
    >
      {locale === 'ru' ? (
        <>
          <span className="text-lg">🇷🇺</span>
          <span className="text-sm font-medium">RU</span>
        </>
      ) : (
        <>
          <span className="text-lg">🇬🇧</span>
          <span className="text-sm font-medium">EN</span>
        </>
      )}
    </button>
  )
}
