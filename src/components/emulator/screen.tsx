'use client'

import { useEffect, useRef, useCallback } from 'react'
import { NES } from '@/core'

interface EmulatorScreenProps {
  nes: NES | null
  width?: number
  height?: number
}

export function EmulatorScreen({ nes, width = 256, height = 240 }: EmulatorScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)

  const render = useCallback(() => {
    if (!nes || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const buffer = nes.getScreenBuffer()
    if (!buffer) return

    // Create ImageData from buffer
    const imageData = ctx.createImageData(256, 240)
    const data = imageData.data

    for (let i = 0; i < buffer.length; i++) {
      const pixel = buffer[i]
      data[i * 4 + 0] = (pixel >> 16) & 0xFF // R
      data[i * 4 + 1] = (pixel >> 8) & 0xFF  // G
      data[i * 4 + 2] = pixel & 0xFF          // B
      data[i * 4 + 3] = (pixel >> 24) & 0xFF  // A
    }

    ctx.putImageData(imageData, 0, 0)
    animationRef.current = requestAnimationFrame(render)
  }, [nes])

  useEffect(() => {
    if (nes) {
      animationRef.current = requestAnimationFrame(render)
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [nes, render])

  return (
    <canvas
      ref={canvasRef}
      width={256}
      height={240}
      className="w-full max-w-2xl aspect-[256/240] bg-black rounded-lg shadow-2xl"
      style={{ imageRendering: 'pixelated' }}
    />
  )
}
