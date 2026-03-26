'use client'

import { useEffect, useState } from 'react'

interface LogEntry {
  timestamp: string
  level: string
  message: string
}

export function DebugOverlay() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Toggle overlay with Ctrl+L
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'l') {
        e.preventDefault()
        setVisible(v => !v)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (!visible) return

    // Poll logs from API
    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/log')
        const data = await res.json()
        if (data.logs) {
          const parsed = data.logs.map((line: string) => {
            const match = line.match(/\[([^\]]+)\] \[(\w+)\] (.+)/)
            if (match) {
              return { timestamp: match[1], level: match[2], message: match[3] }
            }
            return { timestamp: '', level: 'INFO', message: line }
          })
          setLogs(parsed.slice(-20)) // Keep last 20 logs
        }
      } catch (err) {
        console.error('Failed to fetch logs:', err)
      }
    }

    fetchLogs()
    const interval = setInterval(fetchLogs, 1000)
    return () => clearInterval(interval)
  }, [visible])

  if (!visible) return null

  return (
    <div className="fixed bottom-4 left-4 bg-black/90 text-green-400 p-4 rounded-lg font-mono text-xs max-w-md max-h-96 overflow-auto z-50">
      <div className="flex justify-between items-center mb-2">
        <span className="font-bold">DEBUG LOGS</span>
        <span className="text-gray-400">Ctrl+L to close</span>
      </div>
      {logs.map((log, i) => (
        <div key={i} className="border-t border-gray-700 pt-1">
          <span className="text-gray-500">[{log.timestamp.split('T')[1]?.split('.')[0]}]</span>
          <span className="ml-2">{log.message}</span>
        </div>
      ))}
      {logs.length === 0 && <div className="text-gray-500">No logs yet...</div>}
    </div>
  )
}
