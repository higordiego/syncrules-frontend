"use client"

import type * as React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { getTheme, setTheme as saveTheme, initializeTheme, type Theme } from "@/lib/theme"

type ThemeContextType = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    initializeTheme()
    setThemeState(getTheme())
  }, [])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    saveTheme(newTheme)
  }

  if (!mounted) {
    return <>{children}</>
  }

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    // Return default values during SSR to avoid errors
    if (typeof window === "undefined") {
      return { theme: "dark" as Theme, setTheme: () => {} }
    }
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
