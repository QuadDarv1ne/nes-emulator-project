'use client'

import { useState, useEffect } from 'react'
import { getROMHistory, removeROMFromHistory, clearROMHistory, formatDate } from '@/lib/rom-history'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Gamepad2, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'

interface ROMHistoryListProps {
  onROMSelect?: (fileName: string) => void
}

export function ROMHistoryList({ onROMSelect }: ROMHistoryListProps) {
  const [history, setHistory] = useState<Array<{
    title: string
    fileName: string
    loadedAt: number
    mapperId: number
  }>>(() => getROMHistory())

  const handleSelect = (fileName: string) => {
    onROMSelect?.(fileName)
  }

  const handleRemove = (e: React.MouseEvent, fileName: string) => {
    e.stopPropagation()
    removeROMFromHistory(fileName)
    setHistory(history.filter(h => h.fileName !== fileName))
    toast.success('Удалено из истории')
  }

  const handleClearAll = () => {
    clearROMHistory()
    setHistory([])
    toast.success('История очищена')
  }

  if (history.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Gamepad2 className="h-4 w-4" />
            Последние игры
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="h-8 text-xs"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Очистить
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px] pr-4">
          <div className="space-y-2">
            {history.map((entry) => (
              <div
                key={entry.fileName}
                onClick={() => handleSelect(entry.fileName)}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{entry.title}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                    <span>{formatDate(entry.loadedAt)}</span>
                    <Badge variant="secondary" className="h-4 text-[10px] px-1">
                      Mapper {entry.mapperId}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => handleRemove(e, entry.fileName)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
