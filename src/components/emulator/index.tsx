'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { NES, EmulatorState } from '@/core'
import { EmulatorScreen } from './screen'
import { EmulatorControls } from './controls'
import { RomLoader } from './rom-loader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Gamepad2, Play, Pause, RotateCcw, Download, Upload } from 'lucide-react'

export function Emulator() {
  const [nes, setNes] = useState<NES | null>(null)
  const [romName, setRomName] = useState<string>('')
  const [state, setState] = useState<EmulatorState | null>(null)
  const nesRef = useRef<NES | null>(null)
  const intervalRef = useRef<number | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (nesRef.current) {
        nesRef.current.stop()
      }
    }
  }, [])

  const handleROMLoaded = useCallback((loadedNes: NES, name: string) => {
    // Cleanup previous interval if exists
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    nesRef.current = loadedNes
    setNes(loadedNes)
    setRomName(name)
    loadedNes.start()

    // Update state periodically
    intervalRef.current = window.setInterval(() => {
      setState(loadedNes.getState())
    }, 1000)
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
    if (!nesRef.current) return
    
    const saveState = nesRef.current.saveState()
    const data = JSON.stringify(saveState)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `${romName || 'save'}.state.json`
    a.click()
    
    URL.revokeObjectURL(url)
  }, [romName])

  const handleLoadState = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file || !nesRef.current) return
      
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const saveState = JSON.parse(event.target?.result as string)
          nesRef.current?.loadState(saveState)
        } catch (err) {
          console.error('Failed to load state:', err)
        }
      }
      reader.readAsText(file)
    }
    
    input.click()
  }, [])

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
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
                >
                  {state?.paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleReset}
                  title="Сброс"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleSaveState}
                  title="Сохранить состояние"
                >
                  <Download className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleLoadState}
                  title="Загрузить состояние"
                >
                  <Upload className="h-4 w-4" />
                </Button>
              </div>

              {/* Info */}
              <div className="mt-4 text-center text-sm text-muted-foreground">
                {romName && <p>ROM: {romName}</p>}
                {state && (
                  <div className="flex gap-4 justify-center mt-2">
                    <span>FPS: {state.fps}</span>
                    <span>Frames: {state.frameCount}</span>
                    {state.paused && <span className="text-yellow-500">PAUSED</span>}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Controls Help */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Gamepad2 className="h-5 w-5" />
                Управление
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="bg-muted p-3 rounded text-center">
                  <div className="font-medium">↑ ↓ ← →</div>
                  <div className="text-muted-foreground">D-Pad</div>
                </div>
                <div className="bg-muted p-3 rounded text-center">
                  <div className="font-medium">Z / Enter</div>
                  <div className="text-muted-foreground">Кнопка A</div>
                </div>
                <div className="bg-muted p-3 rounded text-center">
                  <div className="font-medium">X / Space</div>
                  <div className="text-muted-foreground">Кнопка B</div>
                </div>
                <div className="bg-muted p-3 rounded text-center">
                  <div className="font-medium">A / S</div>
                  <div className="text-muted-foreground">Select / Start</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
