'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import ruTranslations from './ru.json'
import enTranslations from './en.json'

type Locale = 'ru' | 'en'

const translations: Record<Locale, Record<string, any>> = {
  ru: ruTranslations,
  en: enTranslations,
}

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'ru'
  const savedLocale = localStorage.getItem('locale') as Locale
  if (savedLocale && (savedLocale === 'ru' || savedLocale === 'en')) {
    return savedLocale
  }
  return 'ru'
}

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale)

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem('locale', newLocale)
  }, [])

  const t = useCallback((key: string): string => {
    const keys = key.split('.')
    let value: any = translations[locale]

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        return key
      }
    }

    return typeof value === 'string' ? value : key
  }, [locale])

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}
