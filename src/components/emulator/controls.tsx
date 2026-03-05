'use client'

import { useEffect, useCallback, useRef } from 'react'
import { NES, Button } from '@/core'

interface EmulatorControlsProps {
  nes: NES | null
}

const KEY_MAP: Record<string, Button> = {
  'z': Button.A,
  'Z': Button.A,
  'Enter': Button.A,
  'x': Button.B,
  'X': Button.B,
  ' ': Button.B,
  'a': Button.Select,
  'A': Button.Select,
  's': Button.Start,
  'S': Button.Start,
  'ArrowUp': Button.Up,
  'ArrowDown': Button.Down,
  'ArrowLeft': Button.Left,
  'ArrowRight': Button.Right,
}

const PRESSED_KEYS = new Set<string>()

export function EmulatorControls({ nes }: EmulatorControlsProps) {
  const nesRef = useRef<NES | null>(null)

  useEffect(() => {
    nesRef.current = nes
  }, [nes])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!nesRef.current) return
    if (PRESSED_KEYS.has(e.key)) return // Prevent auto-repeat

    const button = KEY_MAP[e.key]
    if (button !== undefined) {
      e.preventDefault()
      PRESSED_KEYS.add(e.key)
      nesRef.current.pressButton(button)
    }
  }, [])

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (!nesRef.current) return

    const button = KEY_MAP[e.key]
    if (button !== undefined) {
      e.preventDefault()
      PRESSED_KEYS.delete(e.key)
      nesRef.current.releaseButton(button)
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, { passive: false })
    window.addEventListener('keyup', handleKeyUp, { passive: false })

    // Cleanup on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      PRESSED_KEYS.clear()
      // Release all buttons on cleanup
      if (nesRef.current) {
        Object.values(Button).forEach(button => {
          if (typeof button === 'number') {
            nesRef.current?.releaseButton(button)
          }
        })
      }
    }
  }, [handleKeyDown, handleKeyUp])

  return null
}
