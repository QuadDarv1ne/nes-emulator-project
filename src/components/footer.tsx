'use client'

import { useState, useEffect } from 'react'
import { Gamepad2, Github, Heart, Code, Coffee, ExternalLink } from 'lucide-react'
import { motion } from 'framer-motion'
import { ThemeToggle } from '@/components/theme-toggle'

const socialLinks = [
  { name: 'GitHub', icon: Github, href: 'https://github.com/QuadDarv1ne/nes-emulator-project', color: 'hover:text-gray-300' },
  { name: 'Maestro7IT', icon: Code, href: 'https://maestro7it.ru', color: 'hover:text-blue-400' },
  { name: 'Support', icon: Coffee, href: '#', color: 'hover:text-amber-400' },
]

const quickLinks = [
  { name: 'Главная', href: '/' },
  { name: 'Библиотека', href: '#library' },
  { name: 'О проекте', href: '#about' },
]

const techStack = [
  { name: 'Next.js', version: '16' },
  { name: 'React', version: '19' },
  { name: 'TypeScript', version: '5' },
]

export function Footer() {
  const [currentYear] = useState(new Date().getFullYear())
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <footer className="border-t bg-gradient-to-b from-background to-muted/30 mt-auto">
      {/* Decorative top border */}
      <div className="h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />
      
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Gamepad2 className="h-8 w-8 text-primary" />
              </motion.div>
              <div>
                <h3 className="font-bold text-lg">NES Emulator</h3>
                <p className="text-xs text-muted-foreground">Maestro7IT</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Веб-эмулятор Nintendo Entertainment System с современным интерфейсом. 
              Обучающий проект школы программирования Maestro7IT.
            </p>
            
            {/* Social Links */}
            <div className="flex gap-3 pt-2">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-2 rounded-lg bg-muted/50 transition-colors ${social.color}`}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  title={social.name}
                >
                  <social.icon className="h-4 w-4" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h4 className="font-semibold text-sm uppercase tracking-wider">Навигация</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <motion.li key={link.name}>
                  <a 
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/50 group-hover:bg-primary transition-colors" />
                    {link.name}
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Tech Stack */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h4 className="font-semibold text-sm uppercase tracking-wider">Технологии</h4>
            <div className="flex flex-wrap gap-2">
              {techStack.map((tech) => (
                <motion.span
                  key={tech.name}
                  className="px-3 py-1.5 text-xs font-medium rounded-full bg-primary/10 text-primary border border-primary/20"
                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(var(--primary), 0.15)' }}
                >
                  {tech.name} <span className="opacity-60">v{tech.version}</span>
                </motion.span>
              ))}
            </div>
            
            {/* Status Indicator */}
            <div className="flex items-center gap-2 pt-2">
              <motion.span
                className="w-2 h-2 rounded-full bg-green-500"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-xs text-muted-foreground">Система работает</span>
            </div>
          </motion.div>

          {/* Contact/Author */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h4 className="font-semibold text-sm uppercase tracking-wider">Автор</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <motion.div
                  className="p-2 rounded-lg bg-primary/10"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <Heart className="h-4 w-4 text-primary" />
                </motion.div>
                <div>
                  <p className="text-sm font-medium">Дуплей Максим</p>
                  <p className="text-xs text-muted-foreground">Разработчик</p>
                </div>
              </div>
              
              <motion.a
                href="https://maestro7it.ru"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors group"
                whileHover={{ x: 5 }}
              >
                <ExternalLink className="h-3 w-3" />
                maestro7it.ru
              </motion.a>
            </div>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div 
          className="border-t mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="text-xs text-muted-foreground text-center md:text-left">
            <p>© {currentYear} <span className="text-foreground font-medium">Дуплей Максим Игоревич</span> | Школа программирования Maestro7IT</p>
            <p className="mt-1">Обучающий проект • Все права защищены</p>
          </div>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Лицензия</a>
              <span className="w-1 h-1 rounded-full bg-muted-foreground" />
              <a href="#" className="hover:text-foreground transition-colors">Конфиденциальность</a>
              <span className="w-1 h-1 rounded-full bg-muted-foreground" />
              <a href="#" className="hover:text-foreground transition-colors">Контакты</a>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}
