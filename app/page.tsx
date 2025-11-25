"use client"

import { useEffect, useState } from "react"
import { Moon, Sun, TrendingDown, Heart, ClipboardList } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  isOnboardingComplete,
  calculateTotalDebt,
  getSleepRecords,
  shouldShowQuestionnairePrompt,
  setQuestionnairePromptShown,
  hasLoggedSleep,
  isMorningTime,
} from "@/lib/storage"
import { getDebtLevel, formatDuration } from "@/lib/sleep-calculator"
import { DebtTracker } from "@/components/debt-tracker"
import { PersonalizedInsights } from "@/components/personalized-insights"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [onboarded, setOnboarded] = useState(false)
  const [totalDebt, setTotalDebt] = useState(0)
  const [needsCheckIn, setNeedsCheckIn] = useState(false)
  const [needsQuestionnaire, setNeedsQuestionnaire] = useState(false)

  useEffect(() => {
    setMounted(true)
    const complete = isOnboardingComplete()
    setOnboarded(complete)

    if (complete) {
      setTotalDebt(calculateTotalDebt())

      // Only show check-ins if user has logged at least one night of sleep
      if (hasLoggedSleep()) {
        // Check if today's record exists and needs rating
        const today = new Date().toISOString().split("T")[0]
        const records = getSleepRecords()
        const todayRecord = records.find((r) => r.date === today)

        // Morning check-in: only show if it's morning, user has logged sleep, and today's record exists without rating
        if (isMorningTime() && todayRecord && !todayRecord.wakeQualityRating) {
          setNeedsCheckIn(true)
        }

        // Weekly questionnaire: only show if appropriate conditions are met
        if (shouldShowQuestionnairePrompt()) {
          setNeedsQuestionnaire(true)
        }
      }
    }
  }, [])

  useEffect(() => {
    if (mounted && !onboarded) {
      router.push("/onboarding")
    }
  }, [mounted, onboarded, router])

  if (!mounted || !onboarded) {
    return null
  }

  const debtLevel = getDebtLevel(totalDebt)

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold tracking-tight text-balance">Sleep Manager</h1>
          <p className="text-muted-foreground text-balance">Optimize your sleep cycles and manage sleep debt</p>
        </div>

        {/* Weekly Questionnaire Prompt */}
        {needsQuestionnaire && (
          <Card className="mb-6 border-2 border-primary bg-primary/5 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ClipboardList className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold">Weekly Check-In Available</p>
                  <p className="text-sm text-muted-foreground">2 minutes - Help us detect fatigue patterns</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setQuestionnairePromptShown()
                    setNeedsQuestionnaire(false)
                  }}
                >
                  Later
                </Button>
                <Link href="/questionnaire">
                  <Button size="sm">Start</Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {needsCheckIn && (
          <Card className="mb-6 border-2 border-primary bg-primary/5 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Don't forget your morning check-in!</p>
                <p className="text-sm text-muted-foreground">Rate how you felt waking up today</p>
              </div>
              <Link href="/check-in">
                <Button size="sm">Check In</Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Log Sleep Button - Prominent if no sleep logged yet */}
        {!hasLoggedSleep() && (
          <Card className="mb-6 border-2 border-primary bg-primary/10 p-6 text-center">
            <Moon className="mx-auto mb-3 h-12 w-12 text-primary" />
            <h2 className="mb-2 text-xl font-semibold">Get Started</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Log your first night of sleep to start tracking your sleep debt and patterns.
            </p>
            <Link href="/log-sleep">
              <Button size="lg" className="w-full sm:w-auto">
                <Moon className="mr-2 h-5 w-5" />
                Log Last Night's Sleep
              </Button>
            </Link>
          </Card>
        )}

        <div className="mb-6">
          <PersonalizedInsights />
        </div>

        {totalDebt > 0 && (
          <div className="mb-6">
            <DebtTracker totalDebt={totalDebt} />
          </div>
        )}

        {/* Log Sleep Button - Always available */}
        {hasLoggedSleep() && (
          <Card className="mb-6 border-2 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Log Sleep</p>
                <p className="text-sm text-muted-foreground">Record your last night's sleep</p>
              </div>
              <Link href="/log-sleep">
                <Button size="sm" variant="outline">
                  <Moon className="mr-2 h-4 w-4" />
                  Log Sleep
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Recovery Plan CTA - Always visible */}
        <Card className="mb-6 border-l-4 border-l-primary bg-primary/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Recovery Plans</p>
              <p className="text-sm text-muted-foreground">
                {totalDebt > 0 
                  ? `You have ${formatDuration(totalDebt)} of debt. Explore recovery strategies.`
                  : "Explore recovery strategies to maintain optimal sleep health."}
              </p>
            </div>
            <Link href="/recovery">
              <Button size="sm" variant="outline">
                View Plans
              </Button>
            </Link>
          </div>
        </Card>

        {/* Main Action Buttons */}
        <div className="mb-6 grid gap-4">
          <Link href="/normal-mode" className="block">
            <Card className="cursor-pointer border-2 p-6 transition-all hover:border-primary hover:shadow-lg">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Moon className="h-7 w-7 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="mb-1 text-xl font-semibold">Normal Mode</h2>
                  <p className="text-sm text-muted-foreground text-pretty">
                    Plan your optimal bedtime for complete sleep cycles
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/damage-control" className="block">
            <Card className="cursor-pointer border-2 border-destructive/50 bg-destructive/5 p-6 transition-all hover:border-destructive hover:shadow-lg">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/20">
                  <Sun className="h-7 w-7 text-destructive" />
                </div>
                <div className="flex-1">
                  <h2 className="mb-1 text-xl font-semibold text-destructive">Damage Control</h2>
                  <p className="text-sm text-muted-foreground text-pretty">
                    Already sleep-deprived? Get the best solution now
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Secondary Navigation */}
        <div className="grid gap-3 sm:grid-cols-3">
          <Link href="/history">
            <Button variant="outline" className="h-auto w-full justify-start bg-transparent p-4" size="lg">
              <TrendingDown className="mr-3 h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">History</div>
                <div className="text-xs text-muted-foreground">View your sleep data</div>
              </div>
            </Button>
          </Link>

          <Link href="/recovery">
            <Button variant="outline" className="h-auto w-full justify-start bg-transparent p-4" size="lg">
              <Heart className="mr-3 h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Recovery</div>
                <div className="text-xs text-muted-foreground">Plans & naps</div>
              </div>
            </Button>
          </Link>

          <Link href="/settings">
            <Button variant="outline" className="h-auto w-full justify-start bg-transparent p-4" size="lg">
              <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <div className="text-left">
                <div className="font-semibold">Settings</div>
                <div className="text-xs text-muted-foreground">Customize</div>
              </div>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
