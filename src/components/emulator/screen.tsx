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
  const nesRef = useRef<NES | null>(null)

  useEffect(() => {
    nesRef.current = nes
  }, [nes])

  const render = useCallback(() => {
    const currentNes = nesRef.current
    const canvas = canvasRef.current
    if (!currentNes || !canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const buffer = currentNes.getScreenBuffer()
    if (!buffer) return

    const imageData = ctx.createImageData(256, 240)
    const data = imageData.data

    for (let i = 0; i < buffer.length; i++) {
      const pixel = buffer[i]
      data[i * 4 + 0] = (pixel >> 16) & 0xFF
      data[i * 4 + 1] = (pixel >> 8) & 0xFF
      data[i * 4 + 2] = pixel & 0xFF
      data[i * 4 + 3] = (pixel >> 24) & 0xFF
    }

    ctx.putImageData(imageData, 0, 0)
  }, [])

  useEffect(() => {
    if (nes) {
      animationRef.current = requestAnimationFrame(function loop() {
        render()
        animationRef.current = requestAnimationFrame(loop)
      })
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
