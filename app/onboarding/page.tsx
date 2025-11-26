"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { saveUserSettings, setOnboardingComplete, setAppStartDate } from "@/lib/storage"
import { getRecommendedSleepHours } from "@/lib/sleep-calculator"
import type { UserSettings } from "@/lib/types"

export default function OnboardingPage() {
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const [step, setStep] = useState(1)
  const [age, setAge] = useState("")
  const [fallAsleepTime, setFallAsleepTime] = useState("15")
  const [cycleDuration, setCycleDuration] = useState("90")

  const handleComplete = () => {
    const ageNum = Number.parseInt(age)
    const idealSleepHours = getRecommendedSleepHours(ageNum)

    const settings: UserSettings = {
      age: ageNum,
      cycleDuration: Number.parseInt(cycleDuration),
      fallAsleepTime: Number.parseInt(fallAsleepTime),
      idealSleepHours,
      notificationsEnabled: false,
      bedtimeReminderMinutes: 30,
      timeFormat: "12h", // default to 12-hour format
      themePreference: resolvedTheme === "dark" ? "dark" : "light",
    }

    saveUserSettings(settings)
    setOnboardingComplete(true)
    setAppStartDate() // Track when user started using the app
    router.push("/")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md p-6">
        <div className="mb-6 text-center">
          <h1 className="mb-2 text-2xl font-bold">Welcome to Sleep Manager</h1>
          <p className="text-sm text-muted-foreground">Let's personalize your sleep tracking</p>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="age">What's your age?</Label>
              <Input
                id="age"
                type="number"
                placeholder="Enter your age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="mt-1"
              />
              <p className="mt-1 text-xs text-muted-foreground">We'll recommend sleep duration based on your age</p>
            </div>

            <Button className="mt-6 w-full" onClick={() => setStep(2)} disabled={!age || Number.parseInt(age) < 1}>
              Continue
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="fallAsleep">How long does it take you to fall asleep? (minutes)</Label>
              <Input
                id="fallAsleep"
                type="number"
                value={fallAsleepTime}
                onChange={(e) => setFallAsleepTime(e.target.value)}
                className="mt-1"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Average is 15 minutes. Be honest - this affects calculations.
              </p>
            </div>

            <div>
              <Label htmlFor="cycle">Your sleep cycle duration (minutes)</Label>
              <Input
                id="cycle"
                type="number"
                value={cycleDuration}
                onChange={(e) => setCycleDuration(e.target.value)}
                className="mt-1"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Default is 90 minutes. We'll refine this over time based on your feedback.
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button className="flex-1" onClick={handleComplete}>
                Get Started
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
