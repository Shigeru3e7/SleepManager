"use client"

import { useCallback, useEffect, useState } from "react"
import { ArrowLeft, Calendar, TrendingDown, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { getRecentSleepRecords } from "@/lib/storage"
import type { SleepRecord } from "@/lib/types"
import { formatDuration, getDebtLevel } from "@/lib/sleep-calculator"
import { SleepChart } from "@/components/sleep-chart"
import { DebtChart } from "@/components/debt-chart"

export default function HistoryPage() {
  const [mounted, setMounted] = useState(false)
  const [records, setRecords] = useState<SleepRecord[]>([])
  const [period, setPeriod] = useState<7 | 14 | 30>(30)

  const loadRecords = useCallback(() => {
    const data = getRecentSleepRecords(period)
    setRecords(data)
  }, [period])

  useEffect(() => {
    setMounted(true)
    loadRecords()
  }, [loadRecords])

  if (!mounted) return null

  // Calculate statistics
  const totalDebt = records.reduce((sum, r) => sum + r.debtMinutes, 0)
  const averageDebt = records.length > 0 ? totalDebt / records.length : 0
  const averageSleep =
    records.length > 0 ? records.reduce((sum, r) => sum + r.totalSleepMinutes, 0) / records.length : 0

  const debtLevel = getDebtLevel(totalDebt)

  // Find worst day
  const worstDay = records.reduce(
    (worst, current) => {
      if (!worst || current.debtMinutes > worst.debtMinutes) return current
      return worst
    },
    null as SleepRecord | null,
  )

  // Day of week analysis
  const dayOfWeekDebt: { [key: string]: { total: number; count: number } } = {}
  records.forEach((record) => {
    const day = new Date(record.date).toLocaleDateString("en-US", { weekday: "long" })
    if (!dayOfWeekDebt[day]) {
      dayOfWeekDebt[day] = { total: 0, count: 0 }
    }
    dayOfWeekDebt[day].total += record.debtMinutes
    dayOfWeekDebt[day].count += 1
  })

  const worstDayOfWeek = Object.entries(dayOfWeekDebt).reduce(
    (worst, [day, data]) => {
      const avg = data.total / data.count
      if (!worst || avg > worst.avg) {
        return { day, avg }
      }
      return worst
    },
    null as { day: string; avg: number } | null,
  )

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Sleep History</h1>
            <p className="text-sm text-muted-foreground">{records.length} nights tracked</p>
          </div>
        </div>

        {/* Period Selector */}
        <div className="mb-6 flex gap-2">
          <Button variant={period === 7 ? "default" : "outline"} onClick={() => setPeriod(7)} size="sm">
            7 Days
          </Button>
          <Button variant={period === 14 ? "default" : "outline"} onClick={() => setPeriod(14)} size="sm">
            14 Days
          </Button>
          <Button variant={period === 30 ? "default" : "outline"} onClick={() => setPeriod(30)} size="sm">
            30 Days
          </Button>
        </div>

        {records.length === 0 ? (
          <Card className="p-8 text-center">
            <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No Sleep Data Yet</h3>
            <p className="text-sm text-muted-foreground">
              Start tracking your sleep to see your history and insights here.
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Statistics Overview */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="p-4">
                <p className="mb-1 text-sm text-muted-foreground">Total Debt</p>
                <p className="text-2xl font-bold">{formatDuration(totalDebt)}</p>
                <span className={`text-xs font-semibold ${debtLevel.color}`}>{debtLevel.label}</span>
              </Card>

              <Card className="p-4">
                <p className="mb-1 text-sm text-muted-foreground">Avg. Nightly Debt</p>
                <p className="text-2xl font-bold">{formatDuration(averageDebt)}</p>
              </Card>

              <Card className="p-4">
                <p className="mb-1 text-sm text-muted-foreground">Avg. Sleep</p>
                <p className="text-2xl font-bold">{(averageSleep / 60).toFixed(1)}h</p>
              </Card>
            </div>

            {/* Sleep Duration Chart */}
            <Card className="p-6">
              <h3 className="mb-4 text-lg font-semibold">Sleep Duration vs Ideal</h3>
              <SleepChart records={records} />
            </Card>

            {/* Debt Trend Chart */}
            <Card className="p-6">
              <h3 className="mb-4 text-lg font-semibold">Cumulative Debt Trend</h3>
              <DebtChart records={records} />
            </Card>

            {/* Insights */}
            <Card className="p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <TrendingDown className="h-5 w-5" />
                Insights
              </h3>
              <div className="space-y-3">
                {worstDay && (
                  <div className="rounded-lg bg-muted/50 p-3 text-sm">
                    <p className="font-semibold">Worst Night</p>
                    <p className="text-muted-foreground">
                      {new Date(worstDay.date).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      - {formatDuration(worstDay.debtMinutes)} debt
                      {worstDay.notes && ` (${worstDay.notes})`}
                    </p>
                  </div>
                )}

                {worstDayOfWeek && (
                  <div className="rounded-lg bg-muted/50 p-3 text-sm">
                    <p className="font-semibold">Worst Day of Week</p>
                    <p className="text-muted-foreground">
                      {worstDayOfWeek.day}s average {formatDuration(worstDayOfWeek.avg)} debt
                    </p>
                  </div>
                )}

                {averageDebt > 45 && (
                  <div className="rounded-lg bg-yellow-500/10 p-3 text-sm">
                    <p className="flex items-center gap-2 font-semibold text-yellow-200">
                      <AlertCircle className="h-4 w-4" />
                      Recommendation
                    </p>
                    <p className="text-yellow-100/80">
                      Your average nightly debt is {formatDuration(averageDebt)}. Try going to bed 30 minutes earlier
                      consistently.
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Recent Records */}
            <Card className="p-6">
              <h3 className="mb-4 text-lg font-semibold">Recent Nights</h3>
              <div className="space-y-3">
                {records.slice(0, 10).map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div>
                      <p className="font-semibold">
                        {new Date(record.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {(record.totalSleepMinutes / 60).toFixed(1)}h sleep, {record.cycles} cycles
                      </p>
                      {record.wakeQualityRating && (
                        <p className="text-xs text-muted-foreground">Wake quality: {record.wakeQualityRating}/5</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-semibold ${
                          record.debtMinutes > 0 ? "text-red-500" : "text-green-500"
                        }`}
                      >
                        {record.debtMinutes > 0 ? "-" : "+"}
                        {formatDuration(Math.abs(record.debtMinutes))}
                      </p>
                      {record.isDamageControl && <span className="text-xs text-destructive">Damage Control</span>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
