"use client"

import { useState, useEffect, useCallback } from "react"
import { ArrowLeft, Moon, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { getUserSettings, calculateTotalDebt } from "@/lib/storage"
import { calculateBedtime, calculateIdealCycles, formatTime, getDebtLevel, formatDuration } from "@/lib/sleep-calculator"

export default function NormalModePage() {
  const [mounted, setMounted] = useState(false)
  const [wakeTime, setWakeTime] = useState("")
  const [cycles, setCycles] = useState(5)
  const [result, setResult] = useState<{
    bedtime: Date
    sleepTime: Date
    wakeTime: Date
    totalHours: number
    debtAdjustedBedtime?: Date
    debtAdjustedSleepTime?: Date
    debtAdjustedTotalHours?: number
    debtMinutes?: number
    debtRecoveryMinutes?: number
    recoveryNights?: number
  } | null>(null)

  useEffect(() => {
    setMounted(true)

    // Set default wake time to 7 AM tomorrow
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(7, 0, 0, 0)
    setWakeTime(tomorrow.toTimeString().slice(0, 5))
  }, [])

  const handleCalculate = useCallback(() => {
    const settings = getUserSettings()
    if (!settings || !wakeTime) return

    // Get current sleep debt
    const currentDebt = calculateTotalDebt()
    const debtLevel = getDebtLevel(currentDebt)

    // Parse wake time
    const [hours, minutes] = wakeTime.split(":").map(Number)
    const wakeDate = new Date()
    wakeDate.setHours(hours, minutes, 0, 0)

    // If wake time is earlier than current time, assume it's tomorrow
    if (wakeDate <= new Date()) {
      wakeDate.setDate(wakeDate.getDate() + 1)
    }

    // Calculate standard bedtime
    const calculation = calculateBedtime(wakeDate, cycles, {
      cycleDuration: settings.cycleDuration,
      fallAsleepTime: settings.fallAsleepTime,
      idealSleepHours: settings.idealSleepHours,
    })

    const sleepTime = new Date(calculation.bedtime.getTime() + settings.fallAsleepTime * 60000)

    // Calculate debt-adjusted bedtime based on debt level
    let debtRecoveryMinutes = 0
    let debtAdjustedBedtime: Date | undefined
    let debtAdjustedSleepTime: Date | undefined
    let debtAdjustedTotalHours: number | undefined
    let recoveryNights: number | undefined

    if (currentDebt > 0) {
      // Determine recovery buffer based on debt level
      switch (debtLevel.level) {
        case "good":
          // 0-2h debt: No adjustment
          debtRecoveryMinutes = 0
          break
        case "caution":
          // 2-7h debt: +30 min earlier
          debtRecoveryMinutes = 30
          break
        case "moderate":
          // 7-14h debt: +60 min earlier
          debtRecoveryMinutes = 60
          break
        case "critical":
          // >14h debt: +90 min earlier
          debtRecoveryMinutes = 90
          break
      }

      if (debtRecoveryMinutes > 0) {
        // Calculate debt-adjusted bedtime (earlier by recovery minutes)
        debtAdjustedBedtime = new Date(calculation.bedtime.getTime() - debtRecoveryMinutes * 60000)
        debtAdjustedSleepTime = new Date(debtAdjustedBedtime.getTime() + settings.fallAsleepTime * 60000)
        
        // Calculate total sleep with debt adjustment
        const adjustedTotalMinutes = (wakeDate.getTime() - debtAdjustedSleepTime.getTime()) / (1000 * 60)
        debtAdjustedTotalHours = adjustedTotalMinutes / 60

        // Estimate recovery nights (assuming 30-45 min recovery per night with adjustment)
        const recoveryPerNight = 35 // Average recovery per night with adjustment
        recoveryNights = Math.ceil(currentDebt / recoveryPerNight)
      }
    }

    setResult({
      bedtime: calculation.bedtime,
      sleepTime,
      wakeTime: calculation.wakeTime,
      totalHours: calculation.totalSleepMinutes / 60,
      debtAdjustedBedtime,
      debtAdjustedSleepTime,
      debtAdjustedTotalHours,
      debtMinutes: currentDebt,
      debtRecoveryMinutes: debtRecoveryMinutes > 0 ? debtRecoveryMinutes : undefined,
      recoveryNights,
    })
  }, [wakeTime, cycles])

  // Auto-calculate when wake time or cycles change
  useEffect(() => {
    if (wakeTime && mounted) {
      handleCalculate()
    }
  }, [wakeTime, cycles, handleCalculate, mounted])


  if (!mounted) return null

  const settings = getUserSettings()
  if (!settings) return null

  const idealCycles = calculateIdealCycles({
    cycleDuration: settings.cycleDuration,
    fallAsleepTime: settings.fallAsleepTime,
    idealSleepHours: settings.idealSleepHours,
  })

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
            <h1 className="text-2xl font-bold">Normal Mode</h1>
            <p className="text-sm text-muted-foreground">Plan your optimal sleep</p>
          </div>
        </div>

        <Card className="mb-6 p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Moon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">Nightly Sleep Planner</h2>
              <p className="text-sm text-muted-foreground">Plan your sleep for tomorrow</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="wakeTime">What time do you need to wake up tomorrow?</Label>
              <input
                id="wakeTime"
                type="time"
                value={wakeTime}
                onChange={(e) => {
                  setWakeTime(e.target.value)
                  setResult(null) // Clear previous result when wake time changes
                }}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-lg"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Enter the time you need to wake up tomorrow (not a fixed schedule)
              </p>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>Number of complete sleep cycles</Label>
                <span className="text-sm text-muted-foreground">
                  {cycles} cycles = {(cycles * settings.cycleDuration) / 60}h
                </span>
              </div>
              <div className="flex gap-2">
                {[3, 4, 5, 6].map((num) => (
                  <Button
                    key={num}
                    variant={cycles === num ? "default" : "outline"}
                    onClick={() => {
                      setCycles(num)
                      setResult(null) // Clear previous result when cycles change
                    }}
                    className="flex-1"
                  >
                    {num}
                  </Button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Recommended: {idealCycles} cycles ({settings.idealSleepHours}h) for optimal rest
              </p>
            </div>

            <p className="text-xs text-muted-foreground">
              Bedtime will be calculated automatically based on your wake time and selected cycles.
            </p>
          </div>
        </Card>

        {/* Results */}
        {result && (
          <Card className="border-2 border-primary p-6">
            {result.debtAdjustedBedtime && result.debtMinutes && result.debtMinutes > 0 ? (
              // Show debt-adjusted recommendation when debt exists
              <>
                <div className="mb-4 text-center">
                  <p className="mb-1 text-sm font-medium text-muted-foreground">To wake at {formatTimeWithPreference(result.wakeTime)}</p>
                  <div className="mb-2">
                    <p className="text-xs text-muted-foreground mb-1">Recommended bedtime (with debt recovery)</p>
                    <p className="text-5xl font-bold text-primary">{formatTimeWithPreference(result.debtAdjustedBedtime)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      (Sleep by {formatTimeWithPreference(result.debtAdjustedSleepTime!)} = {cycles} complete cycle{cycles !== 1 ? "s" : ""})
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Standard bedtime (maintenance)</p>
                    <p className="text-2xl font-semibold text-muted-foreground">{formatTimeWithPreference(result.bedtime)}</p>
                  </div>
                </div>

                <div className="mb-4 rounded-lg bg-primary/10 p-4">
                  <p className="text-sm font-semibold text-primary mb-2">
                    💤 Debt Recovery Recommendation
                  </p>
                  <p className="text-sm text-pretty mb-2">
                    Going to bed <strong>{result.debtRecoveryMinutes} minutes earlier</strong> than usual will help you recover ~30-45 minutes of your{" "}
                    <strong>{formatDuration(result.debtMinutes)}</strong> debt per night.
                  </p>
                  {result.recoveryNights && (
                    <p className="text-sm text-pretty">
                      At this rate, you'll clear your debt in approximately <strong>{result.recoveryNights} nights</strong>.
                    </p>
                  )}
                </div>
              </>
            ) : (
              // Show standard recommendation when no debt
              <>
                <div className="mb-4 text-center">
                  <p className="mb-1 text-sm font-medium text-muted-foreground">To wake at {formatTimeWithPreference(result.wakeTime)}, go to bed at</p>
                  <p className="text-5xl font-bold text-primary">{formatTimeWithPreference(result.bedtime)}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    (Sleep by {formatTimeWithPreference(result.sleepTime)} = {cycles} complete cycle{cycles !== 1 ? "s" : ""})
                  </p>
                </div>
                {result.debtMinutes === 0 && (
                  <div className="mb-4 rounded-lg bg-green-500/10 p-3 text-center">
                    <p className="text-sm text-green-600 dark:text-green-400">
                      ✓ No sleep debt! Your current bedtime is optimal for maintenance.
                    </p>
                  </div>
                )}
              </>
            )}

            <div className="mb-6 space-y-3 rounded-lg bg-muted/50 p-4">
              {result.debtAdjustedBedtime ? (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Recommended bedtime</span>
                    <span className="font-semibold text-primary">{formatTimeWithPreference(result.debtAdjustedBedtime)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Standard bedtime</span>
                    <span className="font-semibold text-muted-foreground">{formatTimeWithPreference(result.bedtime)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Fall asleep around</span>
                    <span className="font-semibold">{formatTimeWithPreference(result.debtAdjustedSleepTime!)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Wake up at</span>
                    <span className="font-semibold">{formatTimeWithPreference(result.wakeTime)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total sleep</span>
                    <span className="font-semibold">{result.debtAdjustedTotalHours?.toFixed(1) || result.totalHours.toFixed(1)} hours</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Complete cycles</span>
                    <span className="font-semibold">{cycles} cycles</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Bedtime</span>
                    <span className="font-semibold">{formatTimeWithPreference(result.bedtime)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Fall asleep around</span>
                    <span className="font-semibold">{formatTimeWithPreference(result.sleepTime)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Wake up at</span>
                    <span className="font-semibold">{formatTimeWithPreference(result.wakeTime)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total sleep</span>
                    <span className="font-semibold">{result.totalHours.toFixed(1)} hours</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Complete cycles</span>
                    <span className="font-semibold">{cycles} cycles</span>
                  </div>
                </>
              )}
            </div>

            <div className="mb-4 rounded-lg bg-primary/10 p-4">
              <p className="text-sm text-pretty">
                <Clock className="mb-1 mr-2 inline h-4 w-4" />
                <strong>Tip:</strong> Set a bedtime reminder for{" "}
                {formatTimeWithPreference(new Date((result.debtAdjustedBedtime || result.bedtime).getTime() - 30 * 60000))} to start winding down. Turn off screens 30
                minutes before bed.
              </p>
            </div>

            <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
              <p className="text-sm font-semibold text-primary mb-2">📝 Log Your Sleep</p>
              <p className="text-sm text-muted-foreground text-pretty">
                This is a planning tool. After you sleep, use the <strong>"Log Sleep"</strong> button on the home page to record your actual sleep and update your sleep debt.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
