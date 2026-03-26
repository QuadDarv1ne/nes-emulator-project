'use client'

import { useState, useRef, useCallback } from 'react'
import { NES } from '@/core'
import { LoadingScreen } from '../loading-screen'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'
import { toast } from 'sonner'

interface RomLoaderProps {
  onROMLoaded: (nes: NES, romName: string) => void
}

export function RomLoader({ onROMLoaded }: RomLoaderProps) {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [loadingMessage, setLoadingMessage] = useState('')
  const error = useState<string | null>(null)[0]
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadROM = useCallback(async (file: File) => {
    setLoading(true)
    setProgress(0)
    setLoadingMessage('Чтение файла...')

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 100)

      const arrayBuffer = await file.arrayBuffer()
      setProgress(50)
      setLoadingMessage('Обработка ROM...')
      
      const romData = new Uint8Array(arrayBuffer)

      const nes = new NES()
      setLoadingMessage('Инициализация эмулятора...')
      
      const rom = nes.loadROM(romData)

      clearInterval(progressInterval)
      setProgress(100)
      setLoadingMessage('Запуск...')

      // Small delay to show 100%
      await new Promise(resolve => setTimeout(resolve, 300))

      onROMLoaded(nes, rom.title)
      setLoading(false)
      setProgress(0)
      toast.success(`ROM загружен: ${rom.title}`)
    } catch (err) {
      console.error('ROM load error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to load ROM'
      toast.error(errorMessage)
      setLoading(false)
      setProgress(0)
    }
  }, [onROMLoaded])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      loadROM(file)
    }
  }, [loadROM])

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.name.endsWith('.nes')) {
      loadROM(file)
    }
  }, [loadROM])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  return (
    <div className="w-full max-w-md">
      {loading && (
        <LoadingScreen progress={progress} message={loadingMessage} />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".nes"
        onChange={handleFileChange}
        className="hidden"
        disabled={loading}
      />

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
        onClick={handleClick}
      >
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />

        {loading ? (
          <p className="text-sm text-muted-foreground">Загрузка...</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <>
            <p className="text-sm font-medium mb-1">Перетащите .nes файл</p>
            <p className="text-xs text-muted-foreground">или нажмите для выбора</p>
          </>
        )}
      </div>

      <Button
        onClick={handleClick}
        className="w-full mt-4"
        disabled={loading}
      >
        <Upload className="h-4 w-4 mr-2" />
        Выбрать ROM
      </Button>
    </div>
  )
}
