export interface SleepSettings {
  cycleDuration: number // in minutes, default 90
  fallAsleepTime: number // in minutes, default 15
  idealSleepHours: number // based on age, default 8
}

export interface SleepCalculation {
  bedtime: Date
  wakeTime: Date
  cycles: number
  totalSleepMinutes: number
  warning?: string
  recommendation?: string
}

export interface DamageControlResult {
  canSleep: boolean
  cycles: number
  sleepUntil?: Date
  totalMinutes?: number
  recommendation: string
  warning?: string
  alternativeOption?: {
    cycles: number
    sleepUntil: Date
    description: string
  }
}

/**
 * Calculate optimal bedtime based on wake time
 */
export function calculateBedtime(wakeTime: Date, targetCycles: number, settings: SleepSettings): SleepCalculation {
  const { cycleDuration, fallAsleepTime } = settings

  const totalSleepMinutes = targetCycles * cycleDuration
  const totalMinutesNeeded = totalSleepMinutes + fallAsleepTime

  const bedtime = new Date(wakeTime.getTime() - totalMinutesNeeded * 60000)

  return {
    bedtime,
    wakeTime,
    cycles: targetCycles,
    totalSleepMinutes,
  }
}

/**
 * Damage Control Mode: Calculate best option when already sleep-deprived
 */
export function calculateDamageControl(
  currentTime: Date,
  wakeTime: Date,
  settings: SleepSettings,
): DamageControlResult {
  const { cycleDuration, fallAsleepTime } = settings

  const availableMinutes = (wakeTime.getTime() - currentTime.getTime()) / 60000

  // Less than 30 minutes - don't sleep at all
  if (availableMinutes < 30) {
    return {
      canSleep: false,
      cycles: 0,
      recommendation:
        "Don't sleep. At this point, 30 minutes or less will make you feel worse. Stay awake and take a 20-minute power nap later in the day.",
      warning: "Critical: Less than 30 minutes available",
    }
  }

  // Account for time to fall asleep
  const effectiveSleepMinutes = availableMinutes - fallAsleepTime

  // Calculate how many complete cycles fit
  const completeCycles = Math.floor(effectiveSleepMinutes / cycleDuration)

  // If we can fit at least 1 complete cycle
  if (completeCycles >= 1) {
    const sleepDuration = completeCycles * cycleDuration + fallAsleepTime
    const sleepUntil = new Date(currentTime.getTime() + sleepDuration * 60000)

    // Check if there's a significant remainder (partial cycle)
    const remainderMinutes = effectiveSleepMinutes - completeCycles * cycleDuration

    let warning
    if (remainderMinutes > 30) {
      warning = `You have ${Math.round(remainderMinutes)} extra minutes. Consider setting alarm for ${formatTime(sleepUntil)} to wake between cycles.`
    }

    return {
      canSleep: true,
      cycles: completeCycles,
      sleepUntil,
      totalMinutes: completeCycles * cycleDuration,
      recommendation: `Sleep now until ${formatTime(sleepUntil)} = ${completeCycles} complete cycle${completeCycles > 1 ? "s" : ""}. This is optimal - you'll wake between cycles.`,
      warning,
    }
  }

  // Less than 1 complete cycle but more than 30 minutes
  // Recommend a power nap or staying awake
  if (effectiveSleepMinutes >= 20 && effectiveSleepMinutes < cycleDuration) {
    const napDuration = 20
    const napUntil = new Date(currentTime.getTime() + (napDuration + fallAsleepTime) * 60000)

    return {
      canSleep: true,
      cycles: 0,
      sleepUntil: napUntil,
      totalMinutes: napDuration,
      recommendation: `Take a 20-minute power nap until ${formatTime(napUntil)}. Not enough time for a full cycle, but this will help you function better.`,
      warning: "Less than one full cycle available",
    }
  }

  return {
    canSleep: false,
    cycles: 0,
    recommendation: "Stay awake and take a 20-minute power nap later in the day when possible.",
  }
}

/**
 * Calculate suggested cycles based on ideal sleep duration
 */
export function calculateIdealCycles(settings: SleepSettings): number {
  const { idealSleepHours, cycleDuration } = settings
  return Math.round((idealSleepHours * 60) / cycleDuration)
}

/**
 * Calculate sleep debt for a single night
 */
export function calculateNightDebt(actualSleepMinutes: number, idealSleepMinutes: number): number {
  return Math.max(0, idealSleepMinutes - actualSleepMinutes)
}

/**
 * Get recommended sleep hours based on age
 */
export function getRecommendedSleepHours(age: number): number {
  if (age < 18) return 9 // Teenagers: 8-10 hours
  if (age < 26) return 8.5 // Young adults: 7-9 hours
  if (age < 65) return 8 // Adults: 7-9 hours
  return 7.5 // Older adults: 7-8 hours
}

/**
 * Format time for display (e.g., "11:30 PM" or "23:30")
 */
export function formatTime(date: Date, format?: "12h" | "24h"): string {
  // If format not provided, check user settings from localStorage
  if (!format && typeof window !== "undefined") {
    try {
      const settings = localStorage.getItem("userSettings")
      if (settings) {
        const parsed = JSON.parse(settings)
        format = parsed.timeFormat || "12h"
      } else {
        format = "12h" // default
      }
    } catch {
      format = "12h" // default on error
    }
  }
  
  const use12Hour = format !== "24h"
  
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: use12Hour,
  })
}

/**
 * Format duration in minutes to hours and minutes
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)

  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

/**
 * Get debt level classification
 */
export function getDebtLevel(totalDebtMinutes: number): {
  level: "good" | "caution" | "moderate" | "critical"
  label: string
  color: string
} {
  const hours = totalDebtMinutes / 60

  if (hours < 2) {
    return { level: "good", label: "Good", color: "text-green-500" }
  } else if (hours < 7) {
    return { level: "caution", label: "Caution", color: "text-yellow-500" }
  } else if (hours < 14) {
    return { level: "moderate", label: "Moderate", color: "text-orange-500" }
  } else {
    return { level: "critical", label: "Critical", color: "text-red-500" }
  }
}
