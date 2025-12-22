"use client"

export type Theme = "light" | "dark" | "system"

export function getTheme(): Theme {
  if (typeof window === "undefined") return "dark"
  return (localStorage.getItem("theme") as Theme) || "dark"
}

export function setTheme(theme: Theme) {
  localStorage.setItem("theme", theme)
  applyTheme(theme)
}

export function applyTheme(theme: Theme) {
  const root = window.document.documentElement
  root.classList.remove("light", "dark")

  if (theme === "system") {
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    root.classList.add(systemTheme)
  } else {
    root.classList.add(theme)
  }
}

export function initializeTheme() {
  const theme = getTheme()
  applyTheme(theme)

  // Listen for system theme changes
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    const currentTheme = getTheme()
    if (currentTheme === "system") {
      applyTheme("system")
    }
  })
}
