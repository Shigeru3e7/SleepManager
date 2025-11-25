"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { getSleepRecords } from "@/lib/storage"
import { Lightbulb } from "lucide-react"

export function PersonalizedInsights() {
  const [insights, setInsights] = useState<string[]>([])

  useEffect(() => {
    analyzePatterns()
  }, [])

  const analyzePatterns = () => {
    const records = getSleepRecords()
    if (records.length < 7) return

    const newInsights: string[] = []

    // Analyze day of week patterns
    const dayPatterns: { [key: string]: { debt: number; count: number } } = {}
    records.forEach((record) => {
      const day = new Date(record.date).toLocaleDateString("en-US", { weekday: "long" })
      if (!dayPatterns[day]) {
        dayPatterns[day] = { debt: 0, count: 0 }
      }
      dayPatterns[day].debt += record.debtMinutes
      dayPatterns[day].count += 1
    })

    // Find worst day
    let worstDay = ""
    let worstAvg = 0
    Object.entries(dayPatterns).forEach(([day, data]) => {
      const avg = data.total / data.count
      if (avg > worstAvg && data.count >= 2) {
        worstAvg = avg
        worstDay = day
      }
    })

    if (worstDay) {
      const prevDay = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
      const prevDayIndex = (prevDay.indexOf(worstDay) - 1 + 7) % 7
      newInsights.push(
        `You typically sleep worst on ${worstDay}s. Try going to bed 30 minutes earlier on ${prevDay[prevDayIndex]} night.`,
      )
    }

    // Analyze wake quality vs cycles
    const ratedRecords = records.filter((r) => r.wakeQualityRating)
    if (ratedRecords.length >= 5) {
      const cycleQuality: { [key: number]: number[] } = {}
      ratedRecords.forEach((record) => {
        if (!cycleQuality[record.cycles]) {
          cycleQuality[record.cycles] = []
        }
        cycleQuality[record.cycles].push(record.wakeQualityRating!)
      })

      // Find optimal cycle count
      let bestCycles = 0
      let bestAvgQuality = 0
      Object.entries(cycleQuality).forEach(([cycles, ratings]) => {
        if (ratings.length >= 2) {
          const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length
          if (avg > bestAvgQuality) {
            bestAvgQuality = avg
            bestCycles = Number.parseInt(cycles)
          }
        }
      })

      if (bestCycles > 0) {
        const hours = (bestCycles * 90) / 60
        newInsights.push(
          `You feel best after ${bestCycles} cycles (${hours.toFixed(1)} hours) of sleep based on your wake quality ratings.`,
        )
      }
    }

    // Damage control usage pattern
    const damageControlCount = records.filter((r) => r.isDamageControl).length
    if (damageControlCount >= 3) {
      newInsights.push(
        `You've used Damage Control ${damageControlCount} times recently. Consider setting a consistent bedtime to avoid emergency situations.`,
      )
    }

    setInsights(newInsights)
  }

  if (insights.length === 0) return null

  return (
    <Card className="p-6">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <Lightbulb className="h-5 w-5 text-yellow-500" />
        Personalized Insights
      </h3>
      <div className="space-y-3">
        {insights.map((insight, index) => (
          <div key={index} className="rounded-lg bg-primary/10 p-3 text-sm text-pretty">
            {insight}
          </div>
        ))}
      </div>
    </Card>
  )
}
