'use client'

import { useI18n } from './index'
import { motion } from 'framer-motion'
import { Languages } from 'lucide-react'

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
    <motion.button
      onClick={toggleLocale}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent transition-colors ${className || ''}`}
      title={locale === 'ru' ? 'Switch to English' : 'Переключить на русский'}
    >
      <Languages className="h-4 w-4" />
      <motion.span
        key={locale}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="text-sm font-medium"
      >
        {locale === 'ru' ? 'RU' : 'EN'}
      </motion.span>
    </motion.button>
  )
}
