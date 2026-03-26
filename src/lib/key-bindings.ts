/**
 * Конфигурация управления эмулятором
 */

export interface KeyBindings {
  // Player 1
  p1Up: string
  p1Down: string
  p1Left: string
  p1Right: string
  p1A: string
  p1B: string
  p1Select: string
  p1Start: string
  
  // Player 2
  p2Up: string
  p2Down: string
  p2Left: string
  p2Right: string
  p2A: string
  p2B: string
  p2Select: string
  p2Start: string
}

export const DEFAULT_KEY_BINDINGS: KeyBindings = {
  // Player 1 - Keyboard
  p1Up: 'ArrowUp',
  p1Down: 'ArrowDown',
  p1Left: 'ArrowLeft',
  p1Right: 'ArrowRight',
  p1A: 'KeyZ',
  p1B: 'KeyX',
  p1Select: 'KeyA',
  p1Start: 'KeyS',
  
  // Player 2 - Numpad
  p2Up: 'Numpad8',
  p2Down: 'Numpad2',
  p2Left: 'Numpad4',
  p2Right: 'Numpad6',
  p2A: 'Numpad1',
  p2B: 'Numpad3',
  p2Select: 'Numpad0',
  p2Start: 'Numpad5',
}

const STORAGE_KEY = 'nes-emulator-key-bindings'

export function getKeyBindings(): KeyBindings {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return DEFAULT_KEY_BINDINGS
    
    const bindings = JSON.parse(data)
    return { ...DEFAULT_KEY_BINDINGS, ...bindings }
  } catch (error) {
    console.error('Failed to load key bindings:', error)
    return DEFAULT_KEY_BINDINGS
  }
}

export function saveKeyBindings(bindings: KeyBindings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bindings))
  } catch (error) {
    console.error('Failed to save key bindings:', error)
  }
}

export function resetKeyBindings(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to reset key bindings:', error)
  }
}

export function getKeyName(code: string): string {
  // Convert code to human-readable name
  const keyMap: Record<string, string> = {
    ArrowUp: '↑',
    ArrowDown: '↓',
    ArrowLeft: '←',
    ArrowRight: '→',
    KeyZ: 'Z',
    KeyX: 'X',
    KeyA: 'A',
    KeyS: 'S',
    Numpad8: 'Num 8',
    Numpad2: 'Num 2',
    Numpad4: 'Num 4',
    Numpad6: 'Num 6',
    Numpad1: 'Num 1',
    Numpad3: 'Num 3',
    Numpad0: 'Num 0',
    Numpad5: 'Num 5',
  }
  
  return keyMap[code] || code.replace('Key', '').replace('Numpad', 'Num ')
}
