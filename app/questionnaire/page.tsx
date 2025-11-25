"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { saveQuestionnaire, getQuestionnaires, calculateTotalDebt } from "@/lib/storage"
import type { WeeklyQuestionnaire } from "@/lib/types"

export default function QuestionnairePage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [answers, setAnswers] = useState({
    feelingOnWaking: "" as WeeklyQuestionnaire["feelingOnWaking"],
    sleepRestorative: "" as WeeklyQuestionnaire["sleepRestorative"],
    postExertionMalaise: "" as WeeklyQuestionnaire["postExertionMalaise"],
    tooTiredDaysCount: 0,
    concentrationDifficulties: false,
  })

  const handleSubmit = () => {
    // Calculate risk score
    let riskScore: "low" | "medium" | "high" = "low"

    const poorWakeQuality = answers.feelingOnWaking === "exhausted" || answers.feelingOnWaking === "tired"
    const nonRestorative = answers.sleepRestorative === "no" || answers.sleepRestorative === "partially"
    const frequentMalaise = answers.postExertionMalaise === "often" || answers.postExertionMalaise === "always"
    const highTiredDays = answers.tooTiredDaysCount >= 4

    const riskFactors = [
      poorWakeQuality,
      nonRestorative,
      frequentMalaise,
      highTiredDays,
      answers.concentrationDifficulties,
    ].filter(Boolean).length

    if (riskFactors >= 4) riskScore = "high"
    else if (riskFactors >= 2) riskScore = "medium"

    const questionnaire: WeeklyQuestionnaire = {
      id: Date.now().toString(),
      weekStartDate: getWeekStartDate(),
      ...answers,
      riskScore,
    }

    saveQuestionnaire(questionnaire)
    checkChronicFatigue()
    router.push("/")
  }

  const checkChronicFatigue = () => {
    const questionnaires = getQuestionnaires()
    const recentQuestionnaires = questionnaires.slice(0, 4)

    if (recentQuestionnaires.length < 4) return

    const highRiskWeeks = recentQuestionnaires.filter((q) => q.riskScore === "high").length
    const totalDebt = calculateTotalDebt()
    const debtHours = totalDebt / 60

    // Critical alert conditions
    if (highRiskWeeks >= 3 && debtHours > 14) {
      // Show chronic fatigue alert
      router.push("/chronic-fatigue-alert")
    }
  }

  const getWeekStartDate = () => {
    const date = new Date()
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1)
    const weekStart = new Date(date.setDate(diff))
    return weekStart.toISOString().split("T")[0]
  }

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
            <h1 className="text-2xl font-bold">Weekly Check-In</h1>
            <p className="text-sm text-muted-foreground">Question {step} of 5 - Takes 2 minutes</p>
          </div>
        </div>

        <Card className="p-6">
          {/* Question 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label className="text-lg">How do you typically feel when waking up?</Label>
                <p className="text-sm text-muted-foreground">Think about this past week</p>
              </div>

              <div className="space-y-2">
                {(["exhausted", "tired", "acceptable", "good"] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setAnswers({ ...answers, feelingOnWaking: option })
                      setStep(2)
                    }}
                    className="w-full rounded-lg border-2 border-border p-4 text-left transition-all hover:border-primary"
                  >
                    <p className="font-semibold capitalize">{option}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Question 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label className="text-lg">Does your sleep feel restorative?</Label>
                <p className="text-sm text-muted-foreground">Do you wake up feeling refreshed?</p>
              </div>

              <div className="space-y-2">
                {(["yes", "partially", "no"] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setAnswers({ ...answers, sleepRestorative: option })
                      setStep(3)
                    }}
                    className="w-full rounded-lg border-2 border-border p-4 text-left transition-all hover:border-primary"
                  >
                    <p className="font-semibold capitalize">{option}</p>
                  </button>
                ))}
              </div>

              <Button variant="ghost" onClick={() => setStep(1)}>
                Back
              </Button>
            </div>
          )}

          {/* Question 3 */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <Label className="text-lg">Do you experience unusual tiredness after moderate activities?</Label>
                <p className="text-sm text-muted-foreground">Post-exertion malaise (feeling worse after activity)</p>
              </div>

              <div className="space-y-2">
                {(["never", "sometimes", "often", "always"] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setAnswers({ ...answers, postExertionMalaise: option })
                      setStep(4)
                    }}
                    className="w-full rounded-lg border-2 border-border p-4 text-left transition-all hover:border-primary"
                  >
                    <p className="font-semibold capitalize">{option}</p>
                  </button>
                ))}
              </div>

              <Button variant="ghost" onClick={() => setStep(2)}>
                Back
              </Button>
            </div>
          )}

          {/* Question 4 */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <Label className="text-lg">How many days this week were you too tired for normal activities?</Label>
                <p className="text-sm text-muted-foreground">Work, school, social activities</p>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((num) => (
                  <button
                    key={num}
                    onClick={() => {
                      setAnswers({ ...answers, tooTiredDaysCount: num })
                      setStep(5)
                    }}
                    className="rounded-lg border-2 border-border p-4 text-center transition-all hover:border-primary"
                  >
                    <p className="text-xl font-bold">{num}</p>
                  </button>
                ))}
              </div>

              <Button variant="ghost" onClick={() => setStep(3)}>
                Back
              </Button>
            </div>
          )}

          {/* Question 5 */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <Label className="text-lg">Do you have difficulty concentrating or remembering things?</Label>
                <p className="text-sm text-muted-foreground">Cognitive difficulties</p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    setAnswers({ ...answers, concentrationDifficulties: false })
                    handleSubmit()
                  }}
                  className="w-full rounded-lg border-2 border-border p-4 text-left transition-all hover:border-primary"
                >
                  <p className="font-semibold">No</p>
                </button>
                <button
                  onClick={() => {
                    setAnswers({ ...answers, concentrationDifficulties: true })
                    handleSubmit()
                  }}
                  className="w-full rounded-lg border-2 border-border p-4 text-left transition-all hover:border-primary"
                >
                  <p className="font-semibold">Yes</p>
                </button>
              </div>

              <Button variant="ghost" onClick={() => setStep(4)}>
                Back
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
