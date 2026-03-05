'use client'

import { useI18n } from '@/lib/i18n'
import { LocaleSwitcher } from '@/lib/i18n/locale-switcher'
import { Emulator } from '@/components/emulator'
import { Gamepad2 } from 'lucide-react'

export default function Home() {
  const { t } = useI18n()

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gamepad2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold">{t('emulator.title')}</h1>
              <p className="text-xs text-muted-foreground">Maestro7IT</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LocaleSwitcher />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Emulator />
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/50 mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>
            © 2026 {t('footer.author')} | {t('footer.school')}
          </p>
          <p className="mt-1">
            {t('footer.educational')} • {t('footer.rights')}
          </p>
        </div>
      </footer>
    </div>
  )
}
