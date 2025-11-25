"use client"

import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { formatDuration } from "@/lib/sleep-calculator"
import { calculateTotalDebt } from "@/lib/storage"
import { useEffect, useState } from "react"

export default function ChronicFatigueAlertPage() {
  const [mounted, setMounted] = useState(false)
  const [totalDebt, setTotalDebt] = useState(0)

  useEffect(() => {
    setMounted(true)
    setTotalDebt(calculateTotalDebt())
  }, [])

  if (!mounted) return null

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md border-2 border-destructive p-6">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-destructive">Chronic Fatigue Warning</h1>
          <p className="text-sm text-muted-foreground">Important health alert</p>
        </div>

        <div className="mb-6 space-y-4 rounded-lg bg-destructive/5 p-4">
          <p className="text-sm text-pretty">Our analysis shows concerning patterns over the past 4 weeks:</p>

          <ul className="ml-4 list-disc space-y-2 text-sm text-muted-foreground">
            <li>Persistent sleep debt of {formatDuration(totalDebt)}</li>
            <li>Consistently poor wake quality ratings</li>
            <li>Non-restorative sleep patterns</li>
            <li>Multiple high-fatigue days per week</li>
          </ul>

          <div className="mt-4 rounded-lg border-l-4 border-l-destructive bg-background p-3">
            <p className="font-semibold text-destructive">Medical Consultation Recommended</p>
            <p className="mt-1 text-sm text-muted-foreground text-pretty">
              These symptoms may indicate chronic fatigue syndrome, sleep disorders, or other health conditions that
              require professional evaluation.
            </p>
          </div>
        </div>

        <div className="mb-4 space-y-3">
          <div className="rounded-lg bg-muted/50 p-3 text-sm">
            <p className="mb-1 font-semibold">What you should do:</p>
            <ol className="ml-4 list-decimal space-y-1 text-muted-foreground">
              <li>Schedule an appointment with your doctor</li>
              <li>Share your sleep tracking data</li>
              <li>Discuss possible sleep studies or tests</li>
              <li>Continue tracking your sleep patterns</li>
            </ol>
          </div>

          <div className="rounded-lg bg-primary/10 p-3 text-sm">
            <p className="text-muted-foreground text-pretty">
              This app is not a substitute for professional medical advice. Please consult a healthcare provider for
              proper diagnosis and treatment.
            </p>
          </div>
        </div>

        <Link href="/" className="block">
          <Button className="w-full" size="lg">
            I Understand
          </Button>
        </Link>
      </Card>
    </div>
  )
}
