'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="icon-sm"
        className="relative bg-card/60 border-border"
        aria-label="Toggle theme"
        disabled
      >
        <Sun className="h-4 w-4 opacity-50" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  const currentTheme = (resolvedTheme ?? theme ?? 'dark') as 'light' | 'dark'
  const isDark = currentTheme === 'dark'

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      className="relative bg-card/60 border-border"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label="Toggle theme"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="h-4 w-4 absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
