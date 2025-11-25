"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { MorningCheckIn } from "@/components/morning-check-in"

export default function CheckInPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Morning Check-In</h1>
            <p className="text-sm text-muted-foreground">Track your wake quality</p>
          </div>
        </div>

        <MorningCheckIn onComplete={() => router.push("/")} />
      </div>
    </div>
  )
}
