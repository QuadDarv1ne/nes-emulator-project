'use client'

import { useEffect, useRef, useCallback } from 'react'
import { NES } from '@/core'
import { cn } from '@/lib/utils'

interface EmulatorScreenProps {
  nes: NES | null
  width?: number
  height?: number
  className?: string
}

export function EmulatorScreen({ nes, width = 256, height = 240, className }: EmulatorScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const nesRef = useRef<NES | null>(null)
  const imageDataRef = useRef<ImageData | null>(null)
  const canvasCtxRef = useRef<CanvasRenderingContext2D | null>(null)
  const isReady = !!nes

  // Инициализация canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    ctx.imageSmoothingEnabled = false
    canvasCtxRef.current = ctx
  }, [])

  useEffect(() => {
    nesRef.current = nes
  }, [nes])

  const render = useCallback(() => {
    const currentNes = nesRef.current
    const ctx = canvasCtxRef.current
    if (!currentNes || !ctx) return

    const buffer = currentNes.getScreenBuffer()
    if (!buffer || buffer.length !== 256 * 240) {
      console.log('Render skipped:', buffer?.length, 'expected:', 256 * 240)
      return
    }

    // Создаем ImageData только один раз для производительности
    if (!imageDataRef.current) {
      imageDataRef.current = ctx.createImageData(256, 240)
    }
    const imageData = imageDataRef.current
    const data = imageData.data

    // Подсчитываем ненулевые пиксели для отладки
    let nonZeroPixels = 0
    
    // Оптимизированное копирование пикселей
    for (let i = 0; i < buffer.length; i++) {
      const pixel = buffer[i]
      const idx = i * 4
      data[idx] = (pixel >> 16) & 0xFF     // R
      data[idx + 1] = (pixel >> 8) & 0xFF  // G
      data[idx + 2] = pixel & 0xFF         // B
      data[idx + 3] = (pixel >> 24) & 0xFF // A
      
      if ((pixel & 0xFFFFFF) !== 0) nonZeroPixels++
    }

    ctx.putImageData(imageData, 0, 0)
    
    // Отладка: выводим информацию каждые 60 кадров
    if (Math.random() < 0.01) {
      const logMsg = `Rendered: ${nonZeroPixels}/${256*240} non-zero pixels, sample: ${buffer[0].toString(16)}`
      console.log(logMsg)
      if (typeof window !== 'undefined') {
        fetch('/api/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: logMsg, level: 'info' })
        }).catch(() => {})
      }
    }
  }, [])

  useEffect(() => {
    if (nes && isReady) {
      let lastTime = 0
      const targetFPS = 60
      const frameInterval = 1000 / targetFPS

      const renderLoop = (currentTime: number) => {
        const deltaTime = currentTime - lastTime

        if (deltaTime >= frameInterval) {
          render()
          lastTime = currentTime - (deltaTime % frameInterval)
        }

        animationRef.current = requestAnimationFrame(renderLoop)
      }

      animationRef.current = requestAnimationFrame(renderLoop)
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      // Очистка ImageData при unmount
      imageDataRef.current = null
    }
  }, [nes, isReady, render])

  return (
    <div className={cn("relative", className)}>
      <canvas
        ref={canvasRef}
        width={256}
        height={240}
        className="w-full max-w-4xl mx-auto bg-black rounded-lg shadow-2xl"
        style={{ 
          imageRendering: 'pixelated',
          aspectRatio: '256/240'
        }}
      />
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg backdrop-blur-sm">
          <div className="text-white text-sm font-medium">Ожидание ROM...</div>
        </div>
      )}
    </div>
  )
}
