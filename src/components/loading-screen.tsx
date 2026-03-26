'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'

interface LoadingScreenProps {
  progress: number
  message: string
}

export function LoadingScreen({ progress, message }: LoadingScreenProps) {
  const [displayProgress, setDisplayProgress] = useState(0)

  useEffect(() => {
    // Smooth progress animation
    const timer = setTimeout(() => {
      setDisplayProgress(progress)
    }, 100)

    return () => clearTimeout(timer)
  }, [progress])

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="w-full max-w-md p-8 space-y-6">
        {/* Logo / Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <Loader2 className="h-16 w-16 text-primary animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-primary-foreground">
                {Math.round(displayProgress)}%
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${displayProgress}%` }}
            />
          </div>
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Загрузка...</span>
            <span>{Math.round(displayProgress)}%</span>
          </div>
        </div>

        {/* Message */}
        <p className="text-center text-sm text-muted-foreground animate-pulse">
          {message}
        </p>

        {/* Tips */}
        <div className="pt-4 text-xs text-muted-foreground text-center space-y-1">
          <p>💡 Совет:</p>
          <p className="text-[10px]">
            Используйте геймпад или сенсорное управление для игры
          </p>
        </div>
      </div>
    </div>
  )
}
