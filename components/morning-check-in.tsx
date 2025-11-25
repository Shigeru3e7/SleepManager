"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getSleepRecords, saveSleepRecord } from "@/lib/storage"
import { Star } from "lucide-react"

interface MorningCheckInProps {
  onComplete?: () => void
}

export function MorningCheckIn({ onComplete }: MorningCheckInProps) {
  const [rating, setRating] = useState<number>(0)
  const [notes, setNotes] = useState("")
  const [hoveredRating, setHoveredRating] = useState<number>(0)

  const handleSubmit = () => {
    // Find today's sleep record
    const today = new Date().toISOString().split("T")[0]
    const records = getSleepRecords()
    const todayRecord = records.find((r) => r.date === today)

    if (todayRecord) {
      saveSleepRecord({
        ...todayRecord,
        wakeQualityRating: rating,
        notes: notes || undefined,
      })
    }

    onComplete?.()
  }

  const ratingLabels = {
    1: "Exhausted",
    2: "Tired",
    3: "Acceptable",
    4: "Good",
    5: "Excellent",
  }

  return (
    <Card className="border-2 border-primary p-6">
      <div className="mb-4">
        <h3 className="mb-1 text-lg font-semibold">Morning Check-In</h3>
        <p className="text-sm text-muted-foreground">How did you feel waking up today?</p>
      </div>

      <div className="mb-4">
        <Label className="mb-2 block">Wake Quality Rating</Label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`h-8 w-8 ${
                  star <= (hoveredRating || rating) ? "fill-yellow-400 text-yellow-400" : "text-muted"
                }`}
              />
            </button>
          ))}
        </div>
        {(hoveredRating || rating) > 0 && (
          <p className="mt-2 text-sm font-medium text-primary">
            {ratingLabels[(hoveredRating || rating) as keyof typeof ratingLabels]}
          </p>
        )}
      </div>

      <div className="mb-4">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          placeholder="e.g., Had morning exam, stayed up late..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-1"
          rows={3}
        />
      </div>

      <Button className="w-full" onClick={handleSubmit} disabled={rating === 0}>
        Complete Check-In
      </Button>
    </Card>
  )
}
