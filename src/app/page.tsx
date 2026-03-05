'use client'

import { useI18n } from '@/lib/i18n'
import { LocaleSwitcher } from '@/lib/i18n/locale-switcher'
import { ThemeToggle } from '@/components/theme-toggle'
import { Emulator } from '@/components/emulator'
import { Footer } from '@/components/footer'
import { Gamepad2, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

export default function Home() {
  const { t } = useI18n()
  const [particles, setParticles] = useState<Array<{ x: number; y: number; duration: number; delay: number; targetY: number }>>([])

  useEffect(() => {
    setParticles(
      Array.from({ length: 20 }, (_, i) => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        duration: Math.random() * 3 + 2,
        delay: Math.random() * 2,
        targetY: -50 - Math.random() * 100,
      }))
    )
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 flex flex-col">
      {/* Animated background particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {particles.map((particle, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/20 rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
            }}
            initial={{ opacity: 0 }}
            animate={{ 
              y: [null, particle.targetY],
              opacity: [0, 1, 0],
            }}
            transition={{ 
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <motion.header 
        className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-2 md:gap-3"
            whileHover={{ scale: 1.02 }}
          >
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Gamepad2 className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            </motion.div>
            <div className="min-w-0">
              <motion.h1 
                className="text-base md:text-xl font-bold flex items-center gap-1 md:gap-2 truncate"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <span className="hidden sm:inline">{t('emulator.title')}</span>
                <span className="sm:hidden">NES</span>
                <Sparkles className="h-3 w-3 md:h-4 md:w-4 text-amber-500 flex-shrink-0" />
              </motion.h1>
              <p className="text-xs text-muted-foreground">Maestro7IT</p>
            </div>
          </motion.div>
          <motion.div 
            className="flex items-center gap-1 md:gap-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ThemeToggle />
            <LocaleSwitcher />
          </motion.div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 md:py-8 flex-grow">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="w-full"
        >
          <Emulator />
        </motion.div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
