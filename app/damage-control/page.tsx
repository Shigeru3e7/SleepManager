"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, AlertTriangle, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { getUserSettings, calculateTotalDebt } from "@/lib/storage"
import { calculateDamageControl, formatTime, getDebtLevel } from "@/lib/sleep-calculator"

export default function DamageControlPage() {
  const [mounted, setMounted] = useState(false)
  const [wakeTime, setWakeTime] = useState("")
  const [currentTime, setCurrentTime] = useState(new Date())
  const [result, setResult] = useState<ReturnType<typeof calculateDamageControl> | null>(null)
  const [existingDebt, setExistingDebt] = useState(0)

  useEffect(() => {
    setMounted(true)

    // Set default wake time to 6 hours from now
    const defaultWake = new Date()
    defaultWake.setHours(defaultWake.getHours() + 6)
    setWakeTime(defaultWake.toTimeString().slice(0, 5))

    // Get existing debt
    setExistingDebt(calculateTotalDebt())

    // Update current time every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  const handleCalculate = () => {
    const settings = getUserSettings()
    if (!settings) return

    // Parse wake time
    const [hours, minutes] = wakeTime.split(":").map(Number)
    const wakeDate = new Date()
    wakeDate.setHours(hours, minutes, 0, 0)

    // If wake time is earlier than current time, assume it's tomorrow
    if (wakeDate <= currentTime) {
      wakeDate.setDate(wakeDate.getDate() + 1)
    }

    const calculation = calculateDamageControl(currentTime, wakeDate, {
      cycleDuration: settings.cycleDuration,
      fallAsleepTime: settings.fallAsleepTime,
      idealSleepHours: settings.idealSleepHours,
    })

    setResult(calculation)
  }


  if (!mounted) return null

  const settings = getUserSettings()
  if (!settings) return null

  const debtLevel = getDebtLevel(existingDebt)

  // Helper to format time with user preference
  const formatTimeWithPreference = (date: Date) => formatTime(date, settings.timeFormat)

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-destructive">Damage Control</h1>
            <p className="text-sm text-muted-foreground">Emergency sleep guidance</p>
          </div>
        </div>

        {/* Existing Debt Warning */}
        {existingDebt > 0 && (
          <Card className="mb-6 border-l-4 border-l-destructive bg-destructive/5 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div className="flex-1">
                <p className="mb-1 text-sm font-semibold text-destructive">Warning: Existing Sleep Debt</p>
                <p className="text-sm text-muted-foreground">
                  You already have {(existingDebt / 60).toFixed(1)} hours of debt over the last 14 days. This situation
                  will add more debt.
                </p>
              </div>
            </div>
          </Card>
        )}

        <Card className="mb-6 border-2 border-destructive/50 p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <Sun className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <h2 className="font-semibold">Emergency Calculator</h2>
              <p className="text-sm text-muted-foreground">Current time: {formatTimeWithPreference(currentTime)}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="wakeTime">What time MUST you wake up?</Label>
              <input
                id="wakeTime"
                type="time"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-lg"
              />
            </div>

            <Button className="w-full" size="lg" onClick={handleCalculate} variant="destructive">
              Calculate Best Option
            </Button>
          </div>
        </Card>

        {/* Results */}
        {result && (
          <Card className="border-2 border-primary p-6">
            {result.canSleep && result.sleepUntil ? (
              <>
                <div className="mb-4 text-center">
                  <p className="mb-1 text-sm font-medium text-muted-foreground">
                    {result.cycles > 0 ? "Sleep until" : "Power nap until"}
                  </p>
                  <p className="text-5xl font-bold text-primary">{formatTimeWithPreference(result.sleepUntil)}</p>
                </div>

                <div className="mb-4 rounded-lg bg-primary/10 p-4">
                  <p className="text-sm font-semibold text-pretty">{result.recommendation}</p>
                </div>

                {result.cycles > 0 && (
                  <div className="mb-4 space-y-2 rounded-lg bg-muted/50 p-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Complete cycles</span>
                      <span className="font-semibold">{result.cycles}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total sleep</span>
                      <span className="font-semibold">{((result.totalMinutes || 0) / 60).toFixed(1)}h</span>
                    </div>
                  </div>
                )}

                {result.warning && (
                  <div className="mb-4 rounded-lg bg-yellow-500/10 p-3">
                    <p className="text-sm text-yellow-200">{result.warning}</p>
                  </div>
                )}

                {existingDebt > 300 && result.cycles < 5 && (
                  <div className="mb-4 rounded-lg bg-destructive/10 p-4">
                    <p className="text-sm font-semibold text-destructive">
                      Critical: You must take a 20-minute nap this afternoon and sleep earlier tonight to recover.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="mb-4 rounded-lg bg-destructive/10 p-4 text-center">
                  <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-destructive" />
                  <p className="font-semibold text-destructive">Don't Sleep</p>
                </div>

                <div className="mb-4 rounded-lg bg-muted/50 p-4">
                  <p className="text-sm font-semibold text-pretty">{result.recommendation}</p>
                </div>
              </>
            )}

            <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
              <p className="text-sm font-semibold text-primary mb-2">📝 Log Your Sleep</p>
              <p className="text-sm text-muted-foreground text-pretty">
                This is an emergency guidance tool. After you sleep, use the <strong>"Log Sleep"</strong> button on the home page to record your actual sleep and update your sleep debt.
              </p>
            </div>
          </Card>
        )}

        {/* Explanation */}
        <Card className="mt-6 bg-muted/30 p-4">
          <p className="text-sm text-muted-foreground text-pretty">
            <strong className="text-foreground">Why these recommendations?</strong> Waking during a sleep cycle feels
            worse than sleeping less but waking between cycles. This calculator ensures you wake at optimal times for
            better alertness, even with minimal sleep.
          </p>
        </Card>
      </div>
    </div>
  )
}
