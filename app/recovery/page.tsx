"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, Coffee, Moon, CheckCircle2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import Link from "next/link"
import { calculateTotalDebt, saveNapRecord } from "@/lib/storage"
import { formatDuration } from "@/lib/sleep-calculator"
import type { RecoveryPlan, NapRecord } from "@/lib/types"

export default function RecoveryPage() {
  const [mounted, setMounted] = useState(false)
  const [totalDebt, setTotalDebt] = useState(0)
  const [selectedPlan, setSelectedPlan] = useState<RecoveryPlan | null>(null)
  const [napDialogOpen, setNapDialogOpen] = useState(false)
  const [selectedNapType, setSelectedNapType] = useState<"power" | "cycle" | null>(null)
  const [napStartTime, setNapStartTime] = useState("")
  const [napLogged, setNapLogged] = useState(false)

  useEffect(() => {
    setMounted(true)
    setTotalDebt(calculateTotalDebt())
    
    // Set default nap start time to current time
    const now = new Date()
    setNapStartTime(now.toTimeString().slice(0, 5))
  }, [])

  const handleLogNap = (type: "power" | "cycle") => {
    setSelectedNapType(type)
    setNapDialogOpen(true)
  }

  const handleSubmitNap = () => {
    if (!selectedNapType || !napStartTime) return

    const duration = selectedNapType === "power" ? 20 : 90
    
    // Parse start time
    const [hours, minutes] = napStartTime.split(":").map(Number)
    const startDate = new Date()
    startDate.setHours(hours, minutes, 0, 0)

    // If nap time is in the future (more than 1 hour), assume it was yesterday
    const now = new Date()
    if (startDate > now && (startDate.getTime() - now.getTime()) > 60 * 60 * 1000) {
      startDate.setDate(startDate.getDate() - 1)
    }

    // Calculate debt reduction
    // Power naps reduce debt by 10-15 minutes (partial recovery)
    // Cycle naps reduce debt by 60-90 minutes (full cycle recovery)
    const debtReduction = selectedNapType === "power" ? 15 : 60

    const nap: NapRecord = {
      id: Date.now().toString(),
      date: startDate.toISOString().split("T")[0],
      startTime: startDate.toISOString(),
      duration,
      type: selectedNapType,
      debtReduction,
    }

    saveNapRecord(nap)
    setNapLogged(true)
    setTotalDebt(calculateTotalDebt())
    
    setTimeout(() => {
      setNapDialogOpen(false)
      setNapLogged(false)
      setSelectedNapType(null)
    }, 2000)
  }

  if (!mounted) return null

  const debtHours = totalDebt / 60

  // Generate recovery plans
  const plans: RecoveryPlan[] = [
    {
      id: "progressive",
      type: "progressive",
      debtToRecover: totalDebt,
      duration: 14,
      dailyExtraSleep: 30,
      description: "Add 30 minutes of sleep each night for 2 weeks",
      estimatedRecoveryTime: 14,
    },
    {
      id: "intensive",
      type: "intensive",
      debtToRecover: totalDebt,
      duration: 7,
      weekendExtraSleep: 120,
      napsPerWeek: 5,
      napDuration: 20,
      description: "Sleep 2 extra hours on weekends + daily 20-minute naps",
      estimatedRecoveryTime: 7,
    },
  ]

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
            <h1 className="text-2xl font-bold">Recovery Plans</h1>
            <p className="text-sm text-muted-foreground">Get back on track</p>
          </div>
        </div>

        {/* Current Debt */}
        <Card className="mb-6 p-6">
          <div className="text-center">
            <p className="mb-2 text-sm text-muted-foreground">Current Sleep Debt</p>
            <p className="mb-1 text-4xl font-bold">{formatDuration(totalDebt)}</p>
            <p className="text-sm text-muted-foreground">Over the last 14 days</p>
          </div>
        </Card>

        {/* Always show recovery plans */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Choose a Recovery Strategy</h2>
          <p className="text-sm text-muted-foreground">Select the plan that fits your lifestyle</p>
        </div>

        {totalDebt < 120 && (
          <Card className="mb-6 p-4 text-center">
            <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-green-500" />
            <p className="text-sm text-muted-foreground text-balance">
              Your sleep debt is minimal. Keep maintaining your current sleep schedule.
            </p>
          </Card>
        )}

        <div className="space-y-4">
              {/* Progressive Plan */}
              <Card
                className={`cursor-pointer border-2 p-6 transition-all hover:border-primary ${
                  selectedPlan?.id === "progressive" ? "border-primary bg-primary/5" : ""
                }`}
                onClick={() => setSelectedPlan(plans[0])}
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                    <Moon className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Progressive Recovery</h3>
                    <p className="text-sm text-muted-foreground">Steady and sustainable</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <p className="text-pretty">
                    <strong>Strategy:</strong> Go to bed 30 minutes earlier each night
                  </p>
                  <p>
                    <strong>Duration:</strong> 14 days
                  </p>
                  <p>
                    <strong>Weekly Recovery:</strong> ~3.5 hours
                  </p>
                </div>

                <div className="mt-4 rounded-lg bg-muted/50 p-3 text-sm">
                  <p className="mb-1 font-semibold">Pros:</p>
                  <ul className="ml-4 list-disc text-muted-foreground">
                    <li>Easy to maintain consistently</li>
                    <li>Fits into daily routine</li>
                    <li>No drastic schedule changes</li>
                  </ul>
                </div>
              </Card>

              {/* Intensive Plan */}
              <Card
                className={`cursor-pointer border-2 p-6 transition-all hover:border-primary ${
                  selectedPlan?.id === "intensive" ? "border-primary bg-primary/5" : ""
                }`}
                onClick={() => setSelectedPlan(plans[1])}
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/10">
                    <Coffee className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Intensive Recovery</h3>
                    <p className="text-sm text-muted-foreground">Fast but demanding</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <p className="text-pretty">
                    <strong>Strategy:</strong> Weekend catch-up sleep + daily power naps
                  </p>
                  <p>
                    <strong>Duration:</strong> 7 days
                  </p>
                  <p>
                    <strong>Requirements:</strong> 2 extra hours on weekends, five 20-minute naps
                  </p>
                </div>

                <div className="mt-4 rounded-lg bg-muted/50 p-3 text-sm">
                  <p className="mb-1 font-semibold">Pros:</p>
                  <ul className="ml-4 list-disc text-muted-foreground">
                    <li>Faster recovery</li>
                    <li>Good for urgent situations</li>
                  </ul>
                  <p className="mb-1 mt-2 font-semibold">Cons:</p>
                  <ul className="ml-4 list-disc text-muted-foreground">
                    <li>Requires schedule flexibility</li>
                    <li>Harder to maintain</li>
                  </ul>
                </div>
              </Card>
            </div>

        {selectedPlan && (
              <Card className="mt-6 border-2 border-primary p-6">
                <h3 className="mb-4 text-lg font-semibold">Recovery Timeline</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Current debt</span>
                    <span className="font-semibold">{formatDuration(totalDebt)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Estimated recovery</span>
                    <span className="font-semibold">{selectedPlan.estimatedRecoveryTime} days</span>
                  </div>
                </div>

                <div className="mt-4 rounded-lg bg-primary/10 p-4 text-sm">
                  <p className="font-semibold text-primary">Important:</p>
                  <p className="mt-1 text-muted-foreground text-pretty">
                    Recovery takes time. Don't try to pay back all debt at once with excessive sleep, as this can
                    disrupt your rhythm. Consistency is key.
                  </p>
                </div>
              </Card>
            )}

            {/* Nap Calculator */}
            <Card className="mt-6 p-6">
              <h3 className="mb-4 text-lg font-semibold">Nap Calculator</h3>
              <p className="mb-4 text-sm text-muted-foreground text-balance">
                Strategic naps can help manage sleep debt and boost alertness. Log your naps to track debt reduction.
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => handleLogNap("power")}
                  className="flex w-full items-start gap-3 rounded-lg border border-border p-4 text-left transition-all hover:border-primary hover:bg-primary/5"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Coffee className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Power Nap</p>
                    <p className="mb-2 text-sm text-muted-foreground">Exactly 20 minutes - quick refresh</p>
                    <p className="text-xs text-muted-foreground text-pretty">
                      Perfect for mid-afternoon slump. Set alarm for 20 minutes. Won't enter deep sleep, so no
                      grogginess.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => handleLogNap("cycle")}
                  className="flex w-full items-start gap-3 rounded-lg border border-border p-4 text-left transition-all hover:border-primary hover:bg-primary/5"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Moon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Full Cycle Nap</p>
                    <p className="mb-2 text-sm text-muted-foreground">90 minutes - one complete sleep cycle</p>
                    <p className="text-xs text-muted-foreground text-pretty">
                      Best for serious sleep deprivation. You'll complete a full cycle and wake refreshed. Only if you
                      have time.
                    </p>
                  </div>
                </button>
              </div>

              {/* Nap Logging Dialog */}
              <Dialog open={napDialogOpen} onOpenChange={(open) => {
                setNapDialogOpen(open)
                if (!open) {
                  setSelectedNapType(null)
                  setNapLogged(false)
                }
              }}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      Log {selectedNapType === "power" ? "Power Nap" : "Full Cycle Nap"}
                    </DialogTitle>
                    <DialogDescription>
                      {selectedNapType === "power"
                        ? "Record when you took a 20-minute power nap. This will reduce your sleep debt by approximately 15 minutes."
                        : "Record when you took a 90-minute cycle nap. This will reduce your sleep debt by approximately 60 minutes."}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="nap-start-time">When did you start your nap?</Label>
                      <Input
                        id="nap-start-time"
                        type="time"
                        value={napStartTime}
                        onChange={(e) => setNapStartTime(e.target.value)}
                        className="mt-1"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        Default: Current time. Adjust if you took the nap earlier.
                      </p>
                    </div>
                    {napLogged && (
                      <div className="rounded-lg bg-green-500/10 p-3 text-center text-sm text-green-600 dark:text-green-400">
                        <p className="font-semibold">Nap logged!</p>
                        <p>
                          Your debt decreased by ~{selectedNapType === "power" ? "15" : "60"} minutes.
                        </p>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setNapDialogOpen(false)
                        setSelectedNapType(null)
                        setNapLogged(false)
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSubmitNap} disabled={napLogged || !selectedNapType}>
                      {napLogged ? "Logged!" : "Log Nap"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {debtHours > 5 && (
                <div className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm">
                  <p className="font-semibold text-destructive">Recommendation:</p>
                  <p className="text-muted-foreground">
                    With {formatDuration(totalDebt)} of debt, you should take a 20-minute power nap today around 2-3 PM
                    to help manage fatigue.
                  </p>
                </div>
              )}
            </Card>
      </div>
    </div>
  )
}
