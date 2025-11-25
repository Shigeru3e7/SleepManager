"use client"

import { Card } from "@/components/ui/card"
import { getDebtLevel, formatDuration } from "@/lib/sleep-calculator"
import { TrendingDown, TrendingUp } from "lucide-react"

interface DebtTrackerProps {
  totalDebt: number
  trend?: "increasing" | "stable" | "decreasing"
  averageDaily?: number
}

export function DebtTracker({ totalDebt, trend, averageDaily }: DebtTrackerProps) {
  const debtLevel = getDebtLevel(totalDebt)
  const debtHours = totalDebt / 60
  const maxHours = 14
  const percentage = Math.min((debtHours / maxHours) * 100, 100)
  
  // Color mapping for progress bar
  const progressColors = {
    good: "rgb(34, 197, 94)", // green-500
    caution: "rgb(234, 179, 8)", // yellow-500
    moderate: "rgb(249, 115, 22)", // orange-500
    critical: "rgb(239, 68, 68)", // red-500
  }

  const trendColors = {
    increasing: "text-red-500",
    stable: "text-yellow-500",
    decreasing: "text-green-500",
  }

  const levelDescriptions = {
    good: "Your sleep debt is minimal. Keep maintaining good sleep habits!",
    caution: "Sleep debt is accumulating. Consider sleeping 30 minutes earlier.",
    moderate: "Significant debt detected. You need a recovery plan soon.",
    critical: "Critical sleep debt! Prioritize recovery this weekend.",
  }

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Sleep Debt (14 days)</h3>
          <p className="text-sm text-muted-foreground">Total accumulated deficit</p>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-medium ${trendColors[trend]}`}>
            {trend === "increasing" ? (
              <TrendingUp className="h-4 w-4" />
            ) : trend === "decreasing" ? (
              <TrendingDown className="h-4 w-4" />
            ) : null}
            {trend}
          </div>
        )}
      </div>

      {/* Debt Display */}
      <div className="mb-4 text-center">
        <div className="text-5xl font-bold">{formatDuration(totalDebt)}</div>
        <div className={`mt-1 text-sm font-semibold ${debtLevel.color}`}>{debtLevel.label}</div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4 space-y-2">
        <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${percentage}%`,
              backgroundColor: progressColors[debtLevel.level],
              minWidth: percentage > 0 ? "4px" : "0",
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0h</span>
          <span>14h (Critical)</span>
        </div>
      </div>

      {/* Description */}
      <div className="rounded-lg p-3 text-sm" style={{ backgroundColor: `hsl(var(--${debtLevel.level}) / 0.1)` }}>
        <p className="text-pretty">{levelDescriptions[debtLevel.level]}</p>
      </div>

      {/* Average Daily Debt */}
      {averageDaily !== undefined && (
        <div className="mt-4 flex items-center justify-between rounded-lg bg-muted/50 p-3 text-sm">
          <span className="text-muted-foreground">Average daily debt</span>
          <span className="font-semibold">{formatDuration(averageDaily)}</span>
        </div>
      )}
    </Card>
  )
}
