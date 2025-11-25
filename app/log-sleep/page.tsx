"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { getUserSettings, saveSleepRecord, setFirstSleepLogDate, getFirstSleepLogDate } from "@/lib/storage"
import { calculateNightDebt, formatDuration } from "@/lib/sleep-calculator"
import type { SleepRecord } from "@/lib/types"

export default function LogSleepPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [bedtime, setBedtime] = useState("")
  const [fallAsleepTime, setFallAsleepTime] = useState("")
  const [wakeTime, setWakeTime] = useState("")
  const [wakeQuality, setWakeQuality] = useState<number | null>(null)
  const [notes, setNotes] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [calculatedSleep, setCalculatedSleep] = useState<{
    totalMinutes: number
    cycles: number
    debtMinutes: number
  } | null>(null)

  useEffect(() => {
    setMounted(true)
    const settings = getUserSettings()
    if (settings) {
      // Set default fall asleep time from settings
      setFallAsleepTime(settings.fallAsleepTime.toString())
    }

    // Set default wake time to current time
    const now = new Date()
    setWakeTime(now.toTimeString().slice(0, 5))

    // Set default bedtime to 8 hours ago
    const defaultBedtime = new Date(now.getTime() - 8 * 60 * 60 * 1000)
    setBedtime(defaultBedtime.toTimeString().slice(0, 5))
  }, [])

  const calculateSleep = () => {
    if (!bedtime || !wakeTime) return

    const settings = getUserSettings()
    if (!settings) return

    // Parse times (24-hour format from HTML time input)
    const [bedHour, bedMin] = bedtime.split(":").map(Number)
    const [wakeHour, wakeMin] = wakeTime.split(":").map(Number)

    // Determine which date the sleep occurred on
    // Most common scenario: user logs sleep in the morning after waking up
    // Bedtime was "last night" and wake time is "this morning"
    
    // Start with today's date for wake time (most common case)
    const wakeDate = new Date()
    wakeDate.setHours(wakeHour, wakeMin, 0, 0)
    wakeDate.setSeconds(0, 0)

    const bedDate = new Date()
    bedDate.setHours(bedHour, bedMin, 0, 0)
    bedDate.setSeconds(0, 0)

    // Logic for determining dates:
    // 1. If wake time is in the morning (0-11), it's "this morning" (today)
    // 2. Bedtime is typically the night before:
    //    - If bedtime is PM (12-23), it was yesterday evening/night
    //    - If bedtime is early AM (0-11), it was last night (same date as wake if both AM)
    
    if (wakeHour < 12) {
      // Wake time is in the morning (AM) - it's today
      if (bedHour >= 12) {
        // Bedtime is PM (noon or later) - it was yesterday evening/night
        bedDate.setDate(bedDate.getDate() - 1)
      } else {
        // Bedtime is also AM (early morning like 1 AM, 2 AM)
        // Both are on the same date (today) - this is a late night/early morning sleep
        // No date adjustment needed - both are today
      }
    } else {
      // Wake time is PM (afternoon/evening) - less common but handle it
      // Bedtime must be earlier the same day or previous day
      if (bedHour >= wakeHour) {
        // Bedtime is after or equal to wake time - must be previous day
        bedDate.setDate(bedDate.getDate() - 1)
      } else if (bedHour < 12 && wakeHour >= 12) {
        // Bedtime is AM and wake is PM - bedtime was this morning, wake is this afternoon
        // Both same day - no adjustment needed
      }
    }

    // Final validation: ensure bedtime is before wake time
    // If not, adjust bedtime to previous day
    if (bedDate >= wakeDate) {
      bedDate.setDate(bedDate.getDate() - 1)
    }

    // Calculate total time in bed
    const totalMinutes = (wakeDate.getTime() - bedDate.getTime()) / (1000 * 60)
    
    // Validate: sleep duration should be between 0 and 24 hours (1440 minutes)
    if (totalMinutes < 0 || totalMinutes > 1440) {
      // Invalid calculation - reset
      setCalculatedSleep(null)
      return
    }

    const fallAsleepMinutes = Number.parseInt(fallAsleepTime) || settings.fallAsleepTime
    
    // Actual sleep = time in bed minus time to fall asleep
    const actualSleepMinutes = Math.max(0, totalMinutes - fallAsleepMinutes)

    // Validate actual sleep is reasonable (0-24 hours)
    if (actualSleepMinutes < 0 || actualSleepMinutes > 1440) {
      setCalculatedSleep(null)
      return
    }

    // Calculate complete cycles (floor, not round - only count full cycles)
    const completeCycles = Math.floor(actualSleepMinutes / settings.cycleDuration)
    const extraMinutes = actualSleepMinutes % settings.cycleDuration

    // Calculate debt: ideal sleep duration - actual sleep duration
    const idealSleepMinutes = settings.idealSleepHours * 60
    const debtMinutes = Math.max(0, idealSleepMinutes - actualSleepMinutes)

    setCalculatedSleep({
      totalMinutes: actualSleepMinutes,
      cycles: completeCycles,
      debtMinutes,
    })
  }

  useEffect(() => {
    if (bedtime && wakeTime) {
      calculateSleep()
    }
  }, [bedtime, wakeTime, fallAsleepTime])

  const handleSubmit = () => {
    if (!calculatedSleep || !bedtime || !wakeTime) return

    const settings = getUserSettings()
    if (!settings) return

    // Parse times (24-hour format)
    const [bedHour, bedMin] = bedtime.split(":").map(Number)
    const [wakeHour, wakeMin] = wakeTime.split(":").map(Number)

    // Use the same calculation logic as calculateSleep
    const wakeDate = new Date()
    wakeDate.setHours(wakeHour, wakeMin, 0, 0)
    wakeDate.setSeconds(0, 0)

    const bedDate = new Date()
    bedDate.setHours(bedHour, bedMin, 0, 0)
    bedDate.setSeconds(0, 0)

    // Same logic as calculateSleep
    if (wakeHour < 12) {
      bedDate.setDate(bedDate.getDate() - 1)
      if (bedHour < 12) {
        bedDate.setDate(wakeDate.getDate())
      }
    } else {
      if (bedHour > wakeHour || (bedHour < 12 && wakeHour >= 12)) {
        bedDate.setDate(bedDate.getDate() - 1)
      }
    }

    if (bedDate >= wakeDate) {
      bedDate.setDate(bedDate.getDate() - 1)
    }

    const fallAsleepMinutes = Number.parseInt(fallAsleepTime) || settings.fallAsleepTime
    const sleepTime = new Date(bedDate.getTime() + fallAsleepMinutes * 60000)
    
    // Calculate complete cycles and extra minutes
    const completeCycles = Math.floor(calculatedSleep.totalMinutes / settings.cycleDuration)
    const idealSleepMinutes = settings.idealSleepHours * 60

    const record: SleepRecord = {
      id: Date.now().toString(),
      date: sleepTime.toISOString().split("T")[0],
      bedtime: bedDate.toISOString(),
      estimatedSleepTime: sleepTime.toISOString(),
      wakeTime: wakeDate.toISOString(),
      totalSleepMinutes: calculatedSleep.totalMinutes,
      idealSleepMinutes: idealSleepMinutes,
      debtMinutes: calculatedSleep.debtMinutes,
      cycles: completeCycles, // Store only complete cycles
      isDamageControl: false,
      wakeQualityRating: wakeQuality || undefined,
      notes: notes || undefined,
    }

    saveSleepRecord(record)

    // Mark first sleep log
    if (!getFirstSleepLogDate()) {
      setFirstSleepLogDate(record.date)
    }

    setSubmitted(true)

    setTimeout(() => {
      router.push("/")
    }, 2000)
  }

  if (!mounted) return null

  const settings = getUserSettings()
  if (!settings) return null

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
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Log Sleep</h1>
            <p className="text-sm text-muted-foreground">Record your last night's sleep</p>
          </div>
        </div>

        {submitted && calculatedSleep ? (() => {
          const settings = getUserSettings()
          if (!settings) return null
          
          const extraMinutes = calculatedSleep.totalMinutes % settings.cycleDuration
          const cycleText = calculatedSleep.cycles === 1 ? "cycle" : "cycles"
          const extraText = extraMinutes > 0 ? ` + ${Math.round(extraMinutes)} minutes` : ""
          
          return (
            <Card className="border-2 border-primary bg-primary/5 p-6 text-center">
              <Moon className="mx-auto mb-4 h-12 w-12 text-primary" />
              <h2 className="mb-2 text-xl font-semibold">Sleep Logged!</h2>
              <p className="mb-1 text-lg">
                You slept <strong>{formatDuration(calculatedSleep.totalMinutes)}</strong>
              </p>
              <p className="mb-2 text-sm text-muted-foreground">
                ({calculatedSleep.cycles} complete {cycleText}{extraText})
              </p>
              {calculatedSleep.debtMinutes > 0 ? (
                <p className="text-muted-foreground">
                  Your debt increased by {formatDuration(calculatedSleep.debtMinutes)}.
                </p>
              ) : (
                <p className="text-green-600 dark:text-green-400">Great! You met your sleep goal.</p>
              )}
              <p className="mt-4 text-sm text-muted-foreground">Redirecting to home...</p>
            </Card>
          )
        })() : (
          <div className="space-y-6">
            {/* Sleep Times */}
            <Card className="p-6">
              <h2 className="mb-4 text-lg font-semibold">Sleep Times</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="bedtime">When did you go to bed?</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Input
                      id="bedtime"
                      type="time"
                      value={bedtime}
                      onChange={(e) => setBedtime(e.target.value)}
                      className="flex-1"
                    />
                    {bedtime && (() => {
                      const [hour] = bedtime.split(":").map(Number)
                      const period = hour < 12 ? "AM" : "PM"
                      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
                      return (
                        <span className="text-sm font-medium text-muted-foreground min-w-[3rem]">
                          {displayHour}:{bedtime.split(":")[1]} {period}
                        </span>
                      )
                    })()}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Time you got into bed (use 24-hour format, e.g., 23:00 for 11 PM, 01:20 for 1:20 AM)
                  </p>
                </div>

                <div>
                  <Label htmlFor="fallAsleep">How long did it take to fall asleep? (minutes)</Label>
                  <Input
                    id="fallAsleep"
                    type="number"
                    min="0"
                    max="120"
                    value={fallAsleepTime}
                    onChange={(e) => setFallAsleepTime(e.target.value)}
                    className="mt-1"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Default: {settings.fallAsleepTime} minutes (from your settings)
                  </p>
                </div>

                <div>
                  <Label htmlFor="wakeTime">When did you wake up?</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Input
                      id="wakeTime"
                      type="time"
                      value={wakeTime}
                      onChange={(e) => setWakeTime(e.target.value)}
                      className="flex-1"
                    />
                    {wakeTime && (() => {
                      const [hour] = wakeTime.split(":").map(Number)
                      const period = hour < 12 ? "AM" : "PM"
                      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
                      return (
                        <span className="text-sm font-medium text-muted-foreground min-w-[3rem]">
                          {displayHour}:{wakeTime.split(":")[1]} {period}
                        </span>
                      )
                    })()}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Time you woke up (use 24-hour format, e.g., 07:00 for 7 AM, 06:45 for 6:45 AM)
                  </p>
                </div>
              </div>
            </Card>

            {/* Sleep Calculation Preview */}
            {calculatedSleep && (() => {
              const settings = getUserSettings()
              if (!settings) return null
              
              const completeCycles = calculatedSleep.cycles
              const extraMinutes = calculatedSleep.totalMinutes % settings.cycleDuration
              const idealSleepMinutes = settings.idealSleepHours * 60
              const hours = Math.floor(calculatedSleep.totalMinutes / 60)
              const minutes = Math.round(calculatedSleep.totalMinutes % 60)
              
              return (
                <Card className="border-2 border-primary bg-primary/5 p-6">
                  <h3 className="mb-3 font-semibold">Sleep Summary</h3>
                  <div className="mb-4 rounded-lg bg-background p-3 text-center">
                    <p className="text-sm text-muted-foreground">You slept for</p>
                    <p className="text-2xl font-bold text-primary">
                      {hours > 0 ? `${hours} hour${hours !== 1 ? "s" : ""} ` : ""}
                      {minutes > 0 ? `${minutes} minute${minutes !== 1 ? "s" : ""}` : ""}
                      {hours === 0 && minutes === 0 ? "0 minutes" : ""}
                    </p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Sleep:</span>
                      <span className="font-semibold">{formatDuration(calculatedSleep.totalMinutes)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Complete Cycles:</span>
                      <span className="font-semibold">
                        {completeCycles} cycle{completeCycles !== 1 ? "s" : ""}
                        {extraMinutes > 0 && ` + ${Math.round(extraMinutes)} min`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ideal Sleep:</span>
                      <span className="font-semibold">{formatDuration(idealSleepMinutes)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sleep Debt:</span>
                      <span className={`font-semibold ${calculatedSleep.debtMinutes > 0 ? "text-orange-500" : "text-green-500"}`}>
                        {calculatedSleep.debtMinutes > 0 
                          ? `+${formatDuration(calculatedSleep.debtMinutes)}` 
                          : "0 (Goal met!)"}
                      </span>
                    </div>
                  </div>
                </Card>
              )
            })()}
            
            {/* Validation Error */}
            {bedtime && wakeTime && !calculatedSleep && (
              <Card className="border-2 border-destructive bg-destructive/5 p-4">
                <p className="text-sm text-destructive">
                  <strong>Invalid time range:</strong> Please check that bedtime is before wake time and the sleep duration is reasonable (0-24 hours).
                </p>
              </Card>
            )}

            {/* Wake Quality */}
            <Card className="p-6">
              <h2 className="mb-4 text-lg font-semibold">How did you feel? (Optional)</h2>
              <div className="space-y-4">
                <div>
                  <Label>Wake Quality Rating</Label>
                  <div className="mt-2 flex gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => setWakeQuality(rating)}
                        className={`flex h-10 w-10 items-center justify-center rounded-md border-2 transition-all ${
                          wakeQuality === rating
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        {rating}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {wakeQuality ? `Rating: ${wakeQuality}/5` : "Rate how you felt when waking up"}
                  </p>
                </div>

                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional notes about your sleep..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>
            </Card>

            {/* Submit Button */}
            <Button
              className="w-full"
              size="lg"
              onClick={handleSubmit}
              disabled={!calculatedSleep || !bedtime || !wakeTime}
            >
              <Save className="mr-2 h-5 w-5" />
              Log Sleep
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

