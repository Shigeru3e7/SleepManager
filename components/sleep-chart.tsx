"use client"

import type { SleepRecord } from "@/lib/types"

interface SleepChartProps {
  records: SleepRecord[]
}

export function SleepChart({ records }: SleepChartProps) {
  if (records.length === 0) return null

  // Sort by date ascending
  const sortedRecords = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Find max value for scaling
  const maxMinutes = Math.max(...sortedRecords.map((r) => Math.max(r.totalSleepMinutes, r.idealSleepMinutes)))
  const maxHeight = 200

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-1 overflow-x-auto pb-2">
        {sortedRecords.map((record, index) => {
          const actualHeight = (record.totalSleepMinutes / maxMinutes) * maxHeight
          const idealHeight = (record.idealSleepMinutes / maxMinutes) * maxHeight

          return (
            <div key={record.id} className="flex flex-col items-center gap-2 flex-1 min-w-[40px]">
              <div className="relative flex w-full items-end justify-center gap-1">
                {/* Ideal Sleep Bar (background) */}
                <div
                  className="w-3 rounded-t-sm bg-muted"
                  style={{ height: `${idealHeight}px` }}
                  title={`Ideal: ${(record.idealSleepMinutes / 60).toFixed(1)}h`}
                />
                {/* Actual Sleep Bar */}
                <div
                  className={`w-3 rounded-t-sm ${
                    record.totalSleepMinutes >= record.idealSleepMinutes ? "bg-green-500" : "bg-primary"
                  }`}
                  style={{ height: `${actualHeight}px` }}
                  title={`Actual: ${(record.totalSleepMinutes / 60).toFixed(1)}h`}
                />
              </div>
              <span className="text-xs text-muted-foreground">{new Date(record.date).getDate()}</span>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-primary" />
          <span className="text-muted-foreground">Actual Sleep</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-muted" />
          <span className="text-muted-foreground">Ideal Sleep</span>
        </div>
      </div>
    </div>
  )
}
