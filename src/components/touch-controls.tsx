'use client'

import { useCallback, useEffect } from 'react'
import { NES } from '@/core'
import { Button } from '../ui/button'
import { cn } from '@/lib/utils'

interface TouchControlsProps {
  nes: NES | null
}

export function TouchControls({ nes }: TouchControlsProps) {
  const handleTouchStart = useCallback((button: number, player: number = 0) => {
    if (nes) {
      nes.pressButton(button, player)
    }
  }, [nes])

  const handleTouchEnd = useCallback((button: number, player: number = 0) => {
    if (nes) {
      nes.releaseButton(button, player)
    }
  }, [nes])

  // Prevent default touch behaviors
  useEffect(() => {
    const preventDefault = (e: TouchEvent) => {
      e.preventDefault()
    }

    const touchElements = document.querySelectorAll('.touch-button')
    touchElements.forEach(el => {
      el.addEventListener('touchstart', preventDefault, { passive: false })
      el.addEventListener('touchend', preventDefault, { passive: false })
    })

    return () => {
      touchElements.forEach(el => {
        el.removeEventListener('touchstart', preventDefault)
        el.removeEventListener('touchend', preventDefault)
      })
    }
  }, [])

  if (!nes) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 md:hidden select-none touch-none">
      <div className="flex justify-between items-end gap-4 max-w-lg mx-auto">
        {/* D-Pad */}
        <div className="relative w-32 h-32">
          {/* Up */}
          <Button
            className="touch-button absolute top-0 left-1/2 -translate-x-1/2 w-10 h-10 rounded-lg bg-white/20 active:bg-white/40"
            onTouchStart={() => handleTouchStart(4, 0)}
            onTouchEnd={() => handleTouchEnd(4, 0)}
          >
            <span className="text-2xl">↑</span>
          </Button>
          
          {/* Down */}
          <Button
            className="touch-button absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-10 rounded-lg bg-white/20 active:bg-white/40"
            onTouchStart={() => handleTouchStart(5, 0)}
            onTouchEnd={() => handleTouchEnd(5, 0)}
          >
            <span className="text-2xl">↓</span>
          </Button>
          
          {/* Left */}
          <Button
            className="touch-button absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-white/20 active:bg-white/40"
            onTouchStart={() => handleTouchStart(6, 0)}
            onTouchEnd={() => handleTouchEnd(6, 0)}
          >
            <span className="text-2xl">←</span>
          </Button>
          
          {/* Right */}
          <Button
            className="touch-button absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-white/20 active:bg-white/40"
            onTouchStart={() => handleTouchStart(7, 0)}
            onTouchEnd={() => handleTouchEnd(7, 0)}
          >
            <span className="text-2xl">→</span>
          </Button>
          
          {/* Center */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-white/10" />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          {/* B Button */}
          <div className="flex flex-col items-center gap-2">
            <Button
              className="touch-button w-14 h-14 rounded-full bg-red-500/80 active:bg-red-500 text-white font-bold text-lg"
              onTouchStart={() => handleTouchStart(1, 0)}
              onTouchEnd={() => handleTouchEnd(1, 0)}
            >
              B
            </Button>
          </div>
          
          {/* A Button */}
          <div className="flex flex-col items-center gap-2 mt-4">
            <Button
              className="touch-button w-14 h-14 rounded-full bg-red-500/80 active:bg-red-500 text-white font-bold text-lg"
              onTouchStart={() => handleTouchStart(0, 0)}
              onTouchEnd={() => handleTouchEnd(0, 0)}
            >
              A
            </Button>
          </div>
        </div>
      </div>

      {/* Select / Start */}
      <div className="flex justify-center gap-8 mt-4">
        <Button
          className="touch-button w-16 h-8 rounded-full bg-white/10 active:bg-white/20 text-xs text-white/80"
          onTouchStart={() => handleTouchStart(2, 0)}
          onTouchEnd={() => handleTouchEnd(2, 0)}
        >
          SELECT
        </Button>
        <Button
          className="touch-button w-16 h-8 rounded-full bg-white/10 active:bg-white/20 text-xs text-white/80"
          onTouchStart={() => handleTouchStart(3, 0)}
          onTouchEnd={() => handleTouchEnd(3, 0)}
        >
          START
        </Button>
      </div>
    </div>
  )
}
