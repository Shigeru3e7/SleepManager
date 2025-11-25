"use client"

import type { SleepRecord } from "@/lib/types"
import { getDebtLevel } from "@/lib/sleep-calculator"

interface DebtChartProps {
  records: SleepRecord[]
}

export function DebtChart({ records }: DebtChartProps) {
  if (records.length === 0) return null

  // Sort by date ascending and calculate cumulative debt
  const sortedRecords = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  let cumulativeDebt = 0
  const dataPoints = sortedRecords.map((record) => {
    cumulativeDebt += record.debtMinutes
    return {
      date: record.date,
      debt: cumulativeDebt,
    }
  })

  // Find max debt for scaling
  const maxDebt = Math.max(...dataPoints.map((p) => Math.abs(p.debt)), 14 * 60)
  const chartHeight = 200
  const centerY = chartHeight / 2

  // Create SVG path
  const points = dataPoints.map((point, index) => {
    const x = (index / (dataPoints.length - 1)) * 100
    const debtHours = point.debt / 60
    const y = centerY - (point.debt / maxDebt) * centerY * 0.9
    return { x, y, debt: debtHours }
  })

  const pathData = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ")

  // Determine color based on final debt
  const finalDebt = dataPoints[dataPoints.length - 1]?.debt || 0
  const level = getDebtLevel(finalDebt)
  const colorMap = {
    good: "#22c55e",
    caution: "#eab308",
    moderate: "#f97316",
    critical: "#ef4444",
  }
  const lineColor = colorMap[level.level]

  return (
    <div className="space-y-4">
      <div className="relative" style={{ height: `${chartHeight}px` }}>
        <svg viewBox={`0 0 100 ${chartHeight}`} className="h-full w-full" preserveAspectRatio="none">
          {/* Zero line */}
          <line
            x1="0"
            y1={centerY}
            x2="100"
            y2={centerY}
            stroke="hsl(var(--muted-foreground))"
            strokeWidth="1"
            strokeDasharray="2,2"
            opacity="0.3"
          />

          {/* Debt zones */}
          <rect x="0" y="0" width="100" height={centerY} fill="hsl(var(--good))" opacity="0.05" />
          <rect x="0" y={centerY} width="100" height={centerY * 0.25} fill="hsl(var(--caution))" opacity="0.05" />
          <rect
            x="0"
            y={centerY + centerY * 0.25}
            width="100"
            height={centerY * 0.35}
            fill="hsl(var(--moderate))"
            opacity="0.05"
          />
          <rect
            x="0"
            y={centerY + centerY * 0.6}
            width="100"
            height={centerY * 0.4}
            fill="hsl(var(--critical))"
            opacity="0.05"
          />

          {/* Debt line */}
          <path d={pathData} fill="none" stroke={lineColor} strokeWidth="2" vectorEffect="non-scaling-stroke" />

          {/* Points */}
          {points.map((point, index) => (
            <circle key={index} cx={point.x} cy={point.y} r="2" fill={lineColor} vectorEffect="non-scaling-stroke">
              <title>{point.debt.toFixed(1)}h debt</title>
            </circle>
          ))}
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 flex h-full flex-col justify-between text-xs text-muted-foreground">
          <span>-{(maxDebt / 60).toFixed(0)}h</span>
          <span>0h</span>
          <span>+{(maxDebt / 60).toFixed(0)}h</span>
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>
          {new Date(sortedRecords[0].date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
        <span>
          {new Date(sortedRecords[sortedRecords.length - 1].date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>
    </div>
  )
}
