'use client'

import { useState, useRef, useCallback } from 'react'
import { NES } from '@/core'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'

interface RomLoaderProps {
  onROMLoaded: (nes: NES, romName: string) => void
}

export function RomLoader({ onROMLoaded }: RomLoaderProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadROM = useCallback(async (file: File) => {
    setLoading(true)
    setError(null)

    try {
      console.log('Loading ROM:', file.name, file.size, 'bytes')
      const arrayBuffer = await file.arrayBuffer()
      const romData = new Uint8Array(arrayBuffer)
      console.log('ROM data loaded:', romData.length, 'bytes')
      console.log('ROM header:', Array.from(romData.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(' '))

      const nes = new NES()
      console.log('NES instance created')

      const rom = nes.loadROM(romData)
      console.log('ROM loaded:', rom.title, 'Mapper:', rom.mapperId, 'PRG size:', rom.prgROM.length, 'CHR size:', rom.chrROM.length)

      onROMLoaded(nes, rom.title)
    } catch (err) {
      console.error('ROM load error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to load ROM'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
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
      <input
        ref={fileInputRef}
        type="file"
        accept=".nes"
        onChange={handleFileChange}
        className="hidden"
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
