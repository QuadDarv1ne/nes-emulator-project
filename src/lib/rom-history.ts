/**
 * Утилита для управления историей загруженных ROM
 */

export interface ROMHistoryEntry {
  title: string
  fileName: string
  loadedAt: number
  mapperId: number
  prgSize: number
  chrSize: number
}

const STORAGE_KEY = 'nes-emulator-rom-history'
const MAX_HISTORY_ENTRIES = 10

export function getROMHistory(): ROMHistoryEntry[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return []
    
    const history = JSON.parse(data)
    return Array.isArray(history) ? history : []
  } catch (error) {
    console.error('Failed to load ROM history:', error)
    return []
  }
}

export function addROMToHistory(entry: Omit<ROMHistoryEntry, 'loadedAt'>): void {
  try {
    const history = getROMHistory()
    
    // Remove existing entry with same fileName
    const filteredHistory = history.filter(h => h.fileName !== entry.fileName)
    
    // Add new entry at the beginning
    const newEntry: ROMHistoryEntry = {
      ...entry,
      loadedAt: Date.now(),
    }
    
    // Keep only last MAX_HISTORY_ENTRIES
    const updatedHistory = [newEntry, ...filteredHistory].slice(0, MAX_HISTORY_ENTRIES)
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory))
  } catch (error) {
    console.error('Failed to add ROM to history:', error)
  }
}

export function removeROMFromHistory(fileName: string): void {
  try {
    const history = getROMHistory()
    const updatedHistory = history.filter(h => h.fileName !== fileName)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory))
  } catch (error) {
    console.error('Failed to remove ROM from history:', error)
  }
}

export function clearROMHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear ROM history:', error)
  }
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  } else if (diffDays === 1) {
    return 'Вчера'
  } else if (diffDays < 7) {
    return date.toLocaleDateString('ru-RU', { weekday: 'long' })
  } else {
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  }
}
