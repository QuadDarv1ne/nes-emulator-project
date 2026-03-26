'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { NES, EmulatorState } from '@/core'
import { EmulatorScreen } from './screen'
import { EmulatorControls } from './controls'
import { RomLoader } from './rom-loader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Gamepad2, Play, Pause, RotateCcw, Download, Upload } from 'lucide-react'
import { toast } from 'sonner'

export function Emulator() {
  const [nes, setNes] = useState<NES | null>(null)
  const [romName, setRomName] = useState<string>('')
  const [state, setState] = useState<EmulatorState | null>(null)
  const nesRef = useRef<NES | null>(null)
  const intervalRef = useRef<number | null>(null)
  const autoSaveIntervalRef = useRef<number | null>(null)
  const STORAGE_KEY = 'nes-emulator-save-state'

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current)
      }
      if (nesRef.current) {
        nesRef.current.stop()
      }
    }
  }, [])

  // Auto-save state to localStorage every 5 minutes
  useEffect(() => {
    if (nesRef.current) {
      // Clear any existing auto-save interval
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current)
      }

      // Set up auto-save every 5 minutes (300000ms)
      autoSaveIntervalRef.current = window.setInterval(() => {
        try {
          const saveState = nesRef.current!.saveState()
          const data = JSON.stringify(saveState)
          localStorage.setItem(STORAGE_KEY, data)
          console.log('Auto-saved state to localStorage')
        } catch (error) {
          console.error('Auto-save failed:', error)
        }
      }, 300000) // 5 minutes
    }
  }, [nes])

  // Load auto-saved state on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY)
      if (savedState && nesRef.current) {
        console.log('Found auto-saved state in localStorage')
        // State will be loaded when user clicks load button
      }
    } catch (error) {
      console.error('Failed to load auto-saved state:', error)
    }
  }, [])

  const handleROMLoaded = useCallback((loadedNes: NES, name: string) => {
    try {
      // Cleanup previous interval if exists
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }

      nesRef.current = loadedNes
      setNes(loadedNes)
      setRomName(name)
      loadedNes.start()

      toast.success(`ROM загружен: ${name}`)

      // Update state periodically
      intervalRef.current = window.setInterval(() => {
        setState(loadedNes.getState())
      }, 1000)
    } catch (error) {
      console.error('Failed to start emulator:', error)
      toast.error('Ошибка запуска эмулятора')
      setNes(null)
      setRomName('')
    }
  }, [])

  const handlePause = useCallback(() => {
    if (nesRef.current) {
      nesRef.current.pause()
      setState(nesRef.current.getState())
    }
  }, [])

  const handleReset = useCallback(() => {
    if (nesRef.current) {
      nesRef.current.reset()
    }
  }, [])

  const handleSaveState = useCallback(() => {
    if (!nesRef.current) {
      toast.error('Нет активного эмулятора')
      return
    }

    try {
      const saveState = nesRef.current.saveState()
      const data = JSON.stringify(saveState)
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = `${romName || 'save'}.state.json`
      a.click()

      URL.revokeObjectURL(url)
      toast.success('Состояние сохранено')
    } catch (error) {
      console.error('Failed to save state:', error)
      toast.error('Ошибка сохранения состояния')
    }
  }, [romName])

  const handleLoadState = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file || !nesRef.current) {
        toast.error('Нет активного эмулятора')
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const saveState = JSON.parse(event.target?.result as string)
          nesRef.current?.loadState(saveState)
          toast.success('Состояние загружено')
        } catch (err) {
          console.error('Failed to load state:', err)
          toast.error('Ошибка загрузки состояния')
        }
      }
      reader.onerror = () => {
        toast.error('Ошибка чтения файла')
      }
      reader.readAsText(file)
    }

    input.click()
  }, [])

  const handleLoadAutoSave = useCallback(() => {
    if (!nesRef.current) {
      toast.error('Нет активного эмулятора')
      return
    }

    try {
      const savedState = localStorage.getItem('nes-emulator-save-state')
      if (!savedState) {
        toast.error('Нет автосохранения')
        return
      }

      const saveState = JSON.parse(savedState)
      nesRef.current.loadState(saveState)
      toast.success('Автосохранение загружено')
    } catch (err) {
      console.error('Failed to load auto-save:', err)
      toast.error('Ошибка загрузки автосохранения')
    }
  }, [])

  const handleClearAutoSave = useCallback(() => {
    try {
      localStorage.removeItem('nes-emulator-save-state')
      toast.success('Автосохранение очищено')
    } catch (err) {
      console.error('Failed to clear auto-save:', err)
      toast.error('Ошибка очистки автосохранения')
    }
  }, [])

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4 md:space-y-6">
      {/* ROM Loader */}
      {!nes && (
        <Card>
          <CardContent className="pt-6">
            <RomLoader onROMLoaded={handleROMLoaded} />
          </CardContent>
        </Card>
      )}

      {/* Emulator */}
      {nes && (
        <>
          {/* Screen */}
          <Card>
            <CardContent className="pt-6">
              <EmulatorScreen nes={nes} />
            </CardContent>
          </Card>

          {/* Controls */}
          <EmulatorControls nes={nes} />

          {/* Action Buttons */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-2 justify-center">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePause}
                  title={state?.paused ? 'Продолжить' : 'Пауза'}
                  className="h-10 w-10"
                >
                  {state?.paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleReset}
                  title="Сброс"
                  className="h-10 w-10"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleSaveState}
                  title="Сохранить состояние"
                  className="h-10 w-10"
                >
                  <Download className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleLoadState}
                  title="Загрузить состояние"
                  className="h-10 w-10"
                >
                  <Upload className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleLoadAutoSave}
                  title="Загрузить автосохранение"
                  className="h-10 w-10"
                >
                  <span className="text-xs font-bold">A</span>
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleClearAutoSave}
                  title="Очистить автосохранение"
                  className="h-10 w-10"
                >
                  <span className="text-xs font-bold">✕</span>
                </Button>
              </div>

              {/* Info */}
              <div className="mt-4 text-center text-xs md:text-sm text-muted-foreground">
                {romName && <p className="font-medium truncate px-2">{romName}</p>}
                {state && (
                  <div className="flex gap-3 md:gap-4 justify-center mt-2 flex-wrap">
                    <span>FPS: {state.fps}</span>
                    <span>Frames: {state.frameCount}</span>
                    {state.paused && <span className="text-yellow-500">PAUSED</span>}
                    {localStorage.getItem('nes-emulator-save-state') && (
                      <span className="text-green-500" title="Есть автосохранение">💾</span>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Controls Help */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm md:text-base">
                <Gamepad2 className="h-4 w-4 md:h-5 md:w-5" />
                <span className="hidden sm:inline">Управление</span>
                <span className="sm:hidden">Ctrl</span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 text-xs md:text-sm">
                <div className="bg-muted p-2 md:p-3 rounded text-center">
                  <div className="font-medium">↑ ↓ ← →</div>
                  <div className="text-muted-foreground text-[10px] md:text-xs">D-Pad</div>
                </div>
                <div className="bg-muted p-2 md:p-3 rounded text-center">
                  <div className="font-medium">Z / Enter</div>
                  <div className="text-muted-foreground text-[10px] md:text-xs">Кнопка A</div>
                </div>
                <div className="bg-muted p-2 md:p-3 rounded text-center">
                  <div className="font-medium">X / Space</div>
                  <div className="text-muted-foreground text-[10px] md:text-xs">Кнопка B</div>
                </div>
                <div className="bg-muted p-2 md:p-3 rounded text-center">
                  <div className="font-medium">A / S</div>
                  <div className="text-muted-foreground text-[10px] md:text-xs">Select / Start</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
