'use client'

import { useState, useCallback } from 'react'
import {
  getKeyBindings,
  saveKeyBindings,
  resetKeyBindings,
  KeyBindings,
  getKeyName,
} from '@/lib/key-bindings'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Settings, RotateCcw, Check } from 'lucide-react'
import { toast } from 'sonner'

interface KeyBindingButtonProps {
  label: string
  value: string
  onChange: (code: string) => void
}

function KeyBindingButton({ label, value, onChange }: KeyBindingButtonProps) {
  const [isRecording, setIsRecording] = useState(false)

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    e.preventDefault()
    onChange(e.code)
    setIsRecording(false)
  }, [onChange])

  const handleClick = () => {
    setIsRecording(true)
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <Label className="text-sm font-normal">{label}</Label>
      <Button
        variant={isRecording ? 'default' : 'outline'}
        size="sm"
        className={`w-24 ${isRecording ? 'animate-pulse' : ''}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        {isRecording ? (
          <span className="text-xs">Нажмите...</span>
        ) : (
          <span className="text-xs">{getKeyName(value)}</span>
        )}
      </Button>
    </div>
  )
}

export function KeyBindingsDialog() {
  const [open, setOpen] = useState(false)
  const [bindings, setBindings] = useState<KeyBindings>(getKeyBindings())

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      // Reload bindings when closing
      setBindings(getKeyBindings())
    }
  }

  const updateBinding = useCallback((key: keyof KeyBindings, code: string) => {
    setBindings(prev => ({ ...prev, [key]: code }))
  }, [])

  const handleSave = () => {
    saveKeyBindings(bindings)
    toast.success('Настройки управления сохранены')
    setOpen(false)
  }

  const handleReset = () => {
    resetKeyBindings()
    setBindings(getKeyBindings())
    toast.success('Настройки управления сброшены')
  }

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setOpen(true)}
        title="Настройки управления"
        className="h-10 w-10"
      >
        <Settings className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Настройки управления
            </DialogTitle>
            <DialogDescription>
              Нажмите на кнопку и нажмите нужную клавишу для переназначения
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* Player 1 */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                Игрок 1 (Клавиатура)
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <KeyBindingButton
                  label="Вверх"
                  value={bindings.p1Up}
                  onChange={(code) => updateBinding('p1Up', code)}
                />
                <KeyBindingButton
                  label="Вниз"
                  value={bindings.p1Down}
                  onChange={(code) => updateBinding('p1Down', code)}
                />
                <KeyBindingButton
                  label="Влево"
                  value={bindings.p1Left}
                  onChange={(code) => updateBinding('p1Left', code)}
                />
                <KeyBindingButton
                  label="Вправо"
                  value={bindings.p1Right}
                  onChange={(code) => updateBinding('p1Right', code)}
                />
                <KeyBindingButton
                  label="Кнопка A"
                  value={bindings.p1A}
                  onChange={(code) => updateBinding('p1A', code)}
                />
                <KeyBindingButton
                  label="Кнопка B"
                  value={bindings.p1B}
                  onChange={(code) => updateBinding('p1B', code)}
                />
                <KeyBindingButton
                  label="Select"
                  value={bindings.p1Select}
                  onChange={(code) => updateBinding('p1Select', code)}
                />
                <KeyBindingButton
                  label="Start"
                  value={bindings.p1Start}
                  onChange={(code) => updateBinding('p1Start', code)}
                />
              </div>
            </div>

            {/* Player 2 */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-secondary" />
                Игрок 2 (Numpad)
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <KeyBindingButton
                  label="Вверх"
                  value={bindings.p2Up}
                  onChange={(code) => updateBinding('p2Up', code)}
                />
                <KeyBindingButton
                  label="Вниз"
                  value={bindings.p2Down}
                  onChange={(code) => updateBinding('p2Down', code)}
                />
                <KeyBindingButton
                  label="Влево"
                  value={bindings.p2Left}
                  onChange={(code) => updateBinding('p2Left', code)}
                />
                <KeyBindingButton
                  label="Вправо"
                  value={bindings.p2Right}
                  onChange={(code) => updateBinding('p2Right', code)}
                />
                <KeyBindingButton
                  label="Кнопка A"
                  value={bindings.p2A}
                  onChange={(code) => updateBinding('p2A', code)}
                />
                <KeyBindingButton
                  label="Кнопка B"
                  value={bindings.p2B}
                  onChange={(code) => updateBinding('p2B', code)}
                />
                <KeyBindingButton
                  label="Select"
                  value={bindings.p2Select}
                  onChange={(code) => updateBinding('p2Select', code)}
                />
                <KeyBindingButton
                  label="Start"
                  value={bindings.p2Start}
                  onChange={(code) => updateBinding('p2Start', code)}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Сбросить
            </Button>
            <Button onClick={handleSave}>
              <Check className="h-4 w-4 mr-2" />
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
