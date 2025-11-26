"use client"

import { useCallback, useEffect, useState } from "react"
import { ArrowLeft, Save, Moon, Sun, Trash2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useTheme } from "next-themes"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getUserSettings, saveUserSettings, getSleepRecords, clearAllData } from "@/lib/storage"
import type { UserSettings } from "@/lib/types"
import { getRecommendedSleepHours } from "@/lib/sleep-calculator"

export default function SettingsPage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [saved, setSaved] = useState(false)
  const [optimizedCycle, setOptimizedCycle] = useState<number | null>(null)

  const calculateOptimalCycle = useCallback(() => {
    const records = getSleepRecords().filter((r) => r.wakeQualityRating)
    if (records.length < 5) return

    // Group by cycle duration and calculate average wake quality
    const cycleQuality: { [key: number]: { total: number; count: number } } = {}

    records.forEach((record) => {
      const cycleDuration = Math.round(record.totalSleepMinutes / record.cycles)
      if (!cycleQuality[cycleDuration]) {
        cycleQuality[cycleDuration] = { total: 0, count: 0 }
      }
      cycleQuality[cycleDuration].total += record.wakeQualityRating || 0
      cycleQuality[cycleDuration].count += 1
    })

    // Find cycle duration with highest average quality
    let bestCycle = 90
    let bestAverage = 0

    Object.entries(cycleQuality).forEach(([duration, data]) => {
      const average = data.total / data.count
      if (data.count >= 3 && average > bestAverage) {
        bestAverage = average
        bestCycle = Number.parseInt(duration)
      }
    })

    if (bestCycle !== 90) {
      setOptimizedCycle(bestCycle)
    }
  }, [])

  useEffect(() => {
    setMounted(true)
    const current = getUserSettings()
    if (current) {
      setSettings(current)
      setTheme(current.themePreference)
      calculateOptimalCycle()
    }
  }, [calculateOptimalCycle, setTheme])

  const handleSave = () => {
    if (!settings) return

    saveUserSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const applyOptimization = () => {
    if (!settings || !optimizedCycle) return
    setSettings({ ...settings, cycleDuration: optimizedCycle })
    setOptimizedCycle(null)
  }

  const handleClearData = () => {
    clearAllData()
    router.push("/onboarding")
  }

  if (!mounted || !settings) return null

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-sm text-muted-foreground">Personalize your sleep tracking</p>
          </div>
        </div>

        {/* Optimization Suggestion */}
        {optimizedCycle && (
          <Card className="mb-6 border-2 border-primary bg-primary/5 p-4">
            <div className="mb-2">
              <p className="font-semibold">Personalized Optimization Available</p>
              <p className="text-sm text-muted-foreground">
                Based on your wake quality ratings, you feel best with {optimizedCycle}-minute cycles instead of{" "}
                {settings.cycleDuration}-minute cycles.
              </p>
            </div>
            <Button size="sm" onClick={applyOptimization}>
              Apply Optimization
            </Button>
          </Card>
        )}

        <div className="space-y-6">
          {/* Personal Info */}
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Personal Information</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={settings.age}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      age: Number.parseInt(e.target.value),
                      idealSleepHours: getRecommendedSleepHours(Number.parseInt(e.target.value)),
                    })
                  }
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Recommended sleep: {settings.idealSleepHours} hours
                </p>
              </div>
            </div>
          </Card>

          {/* Sleep Settings */}
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Sleep Cycle Settings</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="cycleDuration">Sleep Cycle Duration (minutes)</Label>
                <Input
                  id="cycleDuration"
                  type="number"
                  min="70"
                  max="120"
                  value={settings.cycleDuration}
                  onChange={(e) => setSettings({ ...settings, cycleDuration: Number.parseInt(e.target.value) })}
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Typical range: 70-120 minutes. Default is 90 minutes.
                </p>
              </div>

              <div>
                <Label htmlFor="fallAsleepTime">Time to Fall Asleep (minutes)</Label>
                <Input
                  id="fallAsleepTime"
                  type="number"
                  min="5"
                  max="60"
                  value={settings.fallAsleepTime}
                  onChange={(e) => setSettings({ ...settings, fallAsleepTime: Number.parseInt(e.target.value) })}
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-muted-foreground">How long it typically takes you to fall asleep</p>
              </div>

              <div>
                <Label htmlFor="idealSleep">Ideal Sleep Duration (hours)</Label>
                <Input
                  id="idealSleep"
                  type="number"
                  step="0.5"
                  min="6"
                  max="12"
                  value={settings.idealSleepHours}
                  onChange={(e) => setSettings({ ...settings, idealSleepHours: Number.parseFloat(e.target.value) })}
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-muted-foreground">Your target sleep duration per night</p>
              </div>
            </div>
          </Card>

          {/* Insights Card */}
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Pattern Detection</h2>
            <div className="space-y-3 text-sm">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="font-semibold text-muted-foreground">How it works</p>
                <p className="mt-1 text-muted-foreground text-pretty">
                  As you track your sleep and rate wake quality, the app learns your personal sleep patterns. After 5+
                  rated nights, we can suggest optimized cycle durations based on when you feel best.
                </p>
              </div>

              <div className="rounded-lg bg-primary/10 p-3">
                <p className="font-semibold">Tip</p>
                <p className="mt-1 text-muted-foreground text-pretty">
                  Complete morning check-ins regularly to improve personalization accuracy.
                </p>
              </div>
            </div>
          </Card>

          {/* Appearance Settings */}
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Appearance</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {theme === "dark" ? (
                    <Moon className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Sun className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <Label htmlFor="theme-toggle" className="cursor-pointer">
                      Dark Mode
                    </Label>
                    <p className="text-xs text-muted-foreground">Switch between light and dark theme</p>
                  </div>
                </div>
                <Switch
                  id="theme-toggle"
                  checked={settings.themePreference === "dark"}
                  onCheckedChange={(checked) => {
                    const nextTheme = checked ? "dark" : "light"
                    setTheme(nextTheme)
                    setSettings({ ...settings, themePreference: nextTheme })
                  }}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label htmlFor="time-format-toggle" className="cursor-pointer">
                      Time Format
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {settings.timeFormat === "12h" ? "12-hour (AM/PM)" : "24-hour (00:00-23:59)"}
                    </p>
                  </div>
                </div>
                <Switch
                  id="time-format-toggle"
                  checked={settings.timeFormat === "24h"}
                  onCheckedChange={(checked) => {
                    setSettings({
                      ...settings,
                      timeFormat: checked ? "24h" : "12h",
                    })
                  }}
                />
              </div>
            </div>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/50 p-6">
            <h2 className="mb-4 text-lg font-semibold text-destructive">Danger Zone</h2>
            <div className="space-y-4">
              <div className="rounded-lg bg-destructive/5 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Clear All Data</p>
                    <p className="text-sm text-muted-foreground">
                      This will permanently delete all your sleep records, settings, and reset your account.
                    </p>
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Clear All Data
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete all your sleep records, settings,
                        questionnaires, and reset your account. You will need to complete onboarding again.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleClearData} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Yes, clear all data
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </Card>

          {/* Save Button */}
          <Button className="w-full" size="lg" onClick={handleSave}>
            <Save className="mr-2 h-5 w-5" />
            {saved ? "Settings Saved!" : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  )
}
