'use client'

import { useEffect, useCallback } from 'react'
import { NES, Button } from '@/core'

interface EmulatorControlsProps {
  nes: NES | null
}

const KEY_MAP: Record<string, Button> = {
  'z': Button.A,
  'Enter': Button.A,
  'x': Button.B,
  ' ': Button.B,
  'a': Button.Select,
  's': Button.Start,
  'ArrowUp': Button.Up,
  'ArrowDown': Button.Down,
  'ArrowLeft': Button.Left,
  'ArrowRight': Button.Right,
}

export function EmulatorControls({ nes }: EmulatorControlsProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!nes) return
    
    const button = KEY_MAP[e.key]
    if (button !== undefined) {
      e.preventDefault()
      nes.pressButton(button)
    }
  }, [nes])

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (!nes) return
    
    const button = KEY_MAP[e.key]
    if (button !== undefined) {
      e.preventDefault()
      nes.releaseButton(button)
    }
  }, [nes])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleKeyDown, handleKeyUp])

  return null
}
