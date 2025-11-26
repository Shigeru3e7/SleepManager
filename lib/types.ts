export interface SleepRecord {
  id: string
  date: string // ISO date string
  bedtime: string // ISO datetime string
  estimatedSleepTime: string // ISO datetime string (bedtime + fall asleep time)
  wakeTime: string // ISO datetime string
  totalSleepMinutes: number
  idealSleepMinutes: number
  debtMinutes: number
  cycles: number
  wakeQualityRating?: number // 1-5 scale
  isDamageControl: boolean
  notes?: string
}

export interface UserSettings {
  age: number
  cycleDuration: number // minutes, default 90
  fallAsleepTime: number // minutes, default 15
  idealSleepHours: number // calculated based on age
  notificationsEnabled: boolean
  bedtimeReminderMinutes: number // how many minutes before bedtime to remind
  timeFormat: "12h" | "24h" // time display format, default 12h
  themePreference: "light" | "dark" // persisted UI preference
}

export interface WeeklyQuestionnaire {
  id: string
  weekStartDate: string // ISO date string
  feelingOnWaking: "exhausted" | "tired" | "acceptable" | "good"
  sleepRestorative: "yes" | "no" | "partially"
  postExertionMalaise: "never" | "sometimes" | "often" | "always"
  tooTiredDaysCount: number // 0-7
  concentrationDifficulties: boolean
  riskScore: "low" | "medium" | "high"
}

export interface RecoveryPlan {
  id: string
  type: "progressive" | "intensive" | "custom"
  debtToRecover: number // minutes
  duration: number // days
  dailyExtraSleep?: number // minutes
  weekendExtraSleep?: number // minutes
  napsPerWeek?: number
  napDuration?: number // minutes
  description: string
  estimatedRecoveryTime: number // days
}

export interface NapRecord {
  id: string
  date: string // ISO date string
  startTime: string // ISO datetime string
  duration: number // minutes (20 or 90)
  type: "power" | "cycle" // 20 min power nap or 90 min cycle nap
  debtReduction: number // minutes of debt reduced by this nap
}
