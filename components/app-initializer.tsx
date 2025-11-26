"use client"

import { useEffect } from "react"
import { useTheme } from "next-themes"
import { ensurePersistentStorage, getUserSettings } from "@/lib/storage"

export function AppInitializer() {
  const { setTheme } = useTheme()

  useEffect(() => {
    ensurePersistentStorage()

    const settings = getUserSettings()
    if (settings) {
      setTheme(settings.themePreference)
    }
  }, [setTheme])

  return null
}
