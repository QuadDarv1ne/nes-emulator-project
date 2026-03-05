'use client'

import { useI18n } from '@/lib/i18n'
import { LocaleSwitcher } from '@/lib/i18n/locale-switcher'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Gamepad2, Upload, Settings, Library } from 'lucide-react'

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
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {t('emulator.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Веб-эмулятор Nintendo Entertainment System с современным интерфейсом.
            Обучающий проект школы программирования Maestro7IT.
          </p>
        </section>

        {/* Action Cards */}
        <section className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader>
              <Upload className="h-12 w-12 text-primary mb-2 group-hover:scale-110 transition-transform" />
              <CardTitle>{t('emulator.loadRom')}</CardTitle>
              <CardDescription>
                {t('emulator.dropRom')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                {t('emulator.loadRom')}
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader>
              <Library className="h-12 w-12 text-primary mb-2 group-hover:scale-110 transition-transform" />
              <CardTitle>{t('library.title')}</CardTitle>
              <CardDescription>
                {t('library.allGames')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                <Library className="h-4 w-4 mr-2" />
                {t('library.allGames')}
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader>
              <Settings className="h-12 w-12 text-primary mb-2 group-hover:scale-110 transition-transform" />
              <CardTitle>{t('settings.title')}</CardTitle>
              <CardDescription>
                {t('settings.general')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                <Settings className="h-4 w-4 mr-2" />
                {t('settings.title')}
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Controls Info */}
        <section className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gamepad2 className="h-5 w-5" />
                {t('controls.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="font-semibold mb-1">↑ ↓ ← →</div>
                  <div className="text-muted-foreground">{t('controls.up')} / {t('controls.down')} / {t('controls.left')} / {t('controls.right')}</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="font-semibold mb-1">Z / Enter</div>
                  <div className="text-muted-foreground">{t('controls.a')}</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="font-semibold mb-1">X / Space</div>
                  <div className="text-muted-foreground">{t('controls.b')}</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="font-semibold mb-1">A / S</div>
                  <div className="text-muted-foreground">Select / Start</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
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
